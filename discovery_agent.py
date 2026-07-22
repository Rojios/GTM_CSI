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

_HERE = os.path.dirname(os.path.abspath(__file__))
DEFAULT_SOLUTION_MASTER = os.path.join(_HERE, "solution_master.md")


def _build_system_prompt(solution_master_content: str) -> str:
    return f"""You are a GTM Discovery Agent. Analyze a deal's pains and requirements,
map them against the Solution Master, and return a structured JSON assessment.

## Solution Master Knowledge Base
{solution_master_content}

## Scoring Context
You will receive BANTi score, Tier, and Go/No-Go decision as additional context.
Use this to calibrate the recommended_approach and next_step.

## Fit Level Rules
- Full Fit: solution covers requirements with <20% customization needed
- Partial Fit: solution covers requirements but needs 20-50% customization
- Full Custom: requirement is outside solution scope (>50% custom or clearly out-of-scope)

## next_step Rules
- "Proceed to Solution Shaping": overall_fit is Full Fit or Partial Fit, deal has clear requirements
- "Need More Info": pains or requirements are vague, cannot determine fit confidently
- "No Fit": all requirements fall under Full Custom / out-of-scope

## Output Format (JSON only — no text outside JSON)
{{
  "matched_solutions": [
    {{
      "solution_name": "<name from master>",
      "fit_level": "Full Fit" | "Partial Fit" | "Full Custom",
      "fit_reasoning": "<why this solution matches — 1-2 sentences>",
      "customization_needed": ["<item>"] or [],
      "difficulty": "Easy" | "Medium" | "Hard"
    }}
  ],
  "overall_fit": "Full Fit" | "Partial Fit" | "Full Custom",
  "overall_difficulty": "Easy" | "Medium" | "Hard",
  "recommended_approach": "<concrete recommendation — 1-2 sentences>",
  "out_of_scope": ["<requirement not covered by any solution>"],
  "next_step": "Proceed to Solution Shaping" | "Need More Info" | "No Fit"
}}"""


def discover_deal(deal_context: str, scoring_result: dict, solution_master_path: str = None) -> dict:
    path = solution_master_path or DEFAULT_SOLUTION_MASTER
    with open(path, "r", encoding="utf-8") as f:
        master = f.read()

    banti_total = scoring_result.get("banti", {}).get("total", "N/A")
    f3_total    = scoring_result.get("f3", {}).get("total", "N/A")
    tier        = scoring_result.get("tier", "N/A")
    go_nogo     = scoring_result.get("go_nogo", "N/A")
    reasoning   = scoring_result.get("reasoning", "")

    user_message = f"""## Deal Context
{deal_context}

## Scoring Summary
- Go/No-Go: {go_nogo}
- BANTi Total: {banti_total} / 100
- F³ Total: {f3_total} / 15
- Tier: {tier}
- AI Reasoning: {reasoning}

Analyze the pains and requirements from the deal context above.
Map them against the Solution Master and return the JSON assessment."""

    try:
        response = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=2000,
            system=_build_system_prompt(master),
            messages=[{"role": "user", "content": user_message}],
        )
        text = response.content[0].text.strip()
        if text.startswith("```"):
            text = text.split("```", 2)[1]
            if text.startswith("json"):
                text = text[4:]
            text = text.rsplit("```", 1)[0].strip()
        return json.loads(text)
    except anthropic.BadRequestError as e:
        raise RuntimeError(f"API Error: {e}")
    except anthropic.AuthenticationError:
        raise RuntimeError("API Key ไม่ถูกต้อง")
    except json.JSONDecodeError as e:
        raise RuntimeError(f"Model ส่ง response ที่ไม่ใช่ JSON: {e}")


if __name__ == "__main__":
    print("=== GTM Discovery Agent ===\n")
    print("Deal Context (กด Enter 2 ครั้งเมื่อเสร็จ):\n")
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

    # Minimal scoring result for CLI testing
    scoring_result = {"go_nogo": "Go", "banti": {"total": 80}, "f3": {"total": 12}, "tier": 3}

    print("\nกำลังวิเคราะห์...\n")
    result = discover_deal(deal_context, scoring_result)
    print(json.dumps(result, indent=2, ensure_ascii=False))
