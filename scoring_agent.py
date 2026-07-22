import anthropic
import json
import os
import sys

sys.stdout.reconfigure(encoding="utf-8")
sys.stderr.reconfigure(encoding="utf-8")

# API key อ่านจาก env ANTHROPIC_API_KEY เท่านั้น (ห้าม hardcode — คีย์เก่ารั่วขึ้น git ต้อง revoke)
if not os.environ.get("ANTHROPIC_API_KEY"):
    raise SystemExit("ต้องตั้ง env ANTHROPIC_API_KEY ก่อนรัน (เช่น setx / export หรือไฟล์ .env)")
client = anthropic.Anthropic()

OPTIMIZED_PROMPT_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "optimized_prompt.txt")


def get_active_prompt() -> str:
    if os.path.exists(OPTIMIZED_PROMPT_FILE):
        with open(OPTIMIZED_PROMPT_FILE, "r", encoding="utf-8") as f:
            return f.read()
    return SYSTEM_PROMPT


SYSTEM_PROMPT = """
You are a GTM Deal Qualification Agent using the BANTi-F³ framework.

## Scoring Rules

### BANTi (100 points total)
Budget (20 pts):
- 20 pts: ลูกค้าระบุงบประมาณชัดเจน หรือมี PO/budget code
- 10 pts: บอกว่ามีงบแต่ยังไม่ confirm ตัวเลข
- 0 pts: ไม่มีข้อมูลงบประมาณ

Authority (20 pts):
- 20 pts: คุยกับ C-Level / VP / เจ้าของโดยตรง
- 10 pts: คุยกับ IT/Ops Manager เป็น influencer
- 0 pts: ไม่รู้ว่าใครตัดสินใจ

Need (20 pts):
- 20 pts: ระบุ pain ชัด + บอก business impact เป็นตัวเลขได้
- 8 pts: สนใจทั่วไป ยังไม่มี pain ชัดเจน
- 0 pts: ไม่มี need ชัดเจน

Timing (20 pts):
- 20 pts: ต้องการ go-live ภายใน 90 วัน
- 8 pts: อยู่ระหว่างศึกษา ยังไม่มี timeline ชัด
- 0 pts: ไม่มี timeline

Interest (20 pts):
- 20 pts: มี internal champion ที่ actively push โปรเจกต์
- 8 pts: ติดต่อมาเอง แต่ไม่มี urgency
- 0 pts: passive/cold lead

### F³ (15 points total, 5 each)
Solution Fit (5 pts): Standard product ตอบ requirement ได้ 80%+ ไม่ต้อง custom มาก
Competitive Force (5 pts): เราถูก shortlist เดียว หรือคู่แข่งอ่อนแอชัดเจน
Execution Feasibility (5 pts): ทีม resource และ timeline ทุกอย่างพร้อม deliver
Score 3-4 for partial fit, 1-2 for weak, 0 for none.

### Decision Rules
- Go if BANTi >= 60 pts
- Tier 1 if F³ < 8 → Template propose
- Tier 2 if F³ 8-11 → Story-driven proposal
- Tier 3 if F³ 12-15 → Strategic C-level consulting

## Output Format (JSON only, no text outside JSON)
{
  "banti": {
    "budget": <0|10|20>,
    "authority": <0|10|20>,
    "need": <0|8|20>,
    "timing": <0|8|20>,
    "interest": <0|8|20>,
    "total": <sum>
  },
  "f3": {
    "solution_fit": <0-5>,
    "competitive_force": <0-5>,
    "feasibility": <0-5>,
    "total": <sum>
  },
  "go_nogo": "Go" | "No-Go",
  "tier": 1 | 2 | 3 | null,
  "reasoning": "<2-3 sentences>",
  "risk_flags": ["<flag1>", "<flag2>"]
}
"""

def score_deal(deal_context: str) -> dict:
    try:
        response = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=1000,
            system=get_active_prompt(),
            messages=[{"role": "user", "content": deal_context}]
        )
        text = response.content[0].text.strip()
        if text.startswith("```"):
            text = text.split("```", 2)[1]
            if text.startswith("json"):
                text = text[4:]
            text = text.rsplit("```", 1)[0].strip()
        return json.loads(text)
    except anthropic.BadRequestError as e:
        raise SystemExit(f"API Error: {e}")
    except anthropic.AuthenticationError:
        raise SystemExit("API Key ไม่ถูกต้อง กรุณาตรวจสอบ ANTHROPIC_API_KEY")
    except json.JSONDecodeError as e:
        raise SystemExit(f"Model ส่ง response ที่ไม่ใช่ JSON: {e}")

if __name__ == "__main__":
    print("=== GTM Scoring Agent ===\n")
    print("Paste deal context แล้วกด Enter 2 ครั้ง:\n")
    
    lines = []
    while True:
        try:
            line = input()
            if line == "":
                break
            lines.append(line)
        except EOFError:
            break
    
    deal_context = "\n".join(lines)
    
    print("\nกำลัง score...\n")
    result = score_deal(deal_context)
    print(json.dumps(result, indent=2, ensure_ascii=False))