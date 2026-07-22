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


def _build_system_prompt(master: str) -> str:
    return f"""You are a GTM Solution Shaping Agent. Your job is to design a detailed solution
based on the deal context, scoring, and discovery results.

## Solution Master Knowledge Base
{master}

## Instructions
For each matched solution from discovery_result:
1. Design detailed modules and function lists
2. Classify each function as Standard / Custom / Integration
3. Assign priority: Must Have / Should Have / Nice to Have
4. Map each function to the customer's pain it addresses
5. Assess F³ scores with clear reasoning
6. Identify risks with mitigation strategies
7. Make Go/No-Go decision for Solution Fit gate

## function type definitions
- Standard: feature ที่มีใน product ทันที ไม่ต้อง develop เพิ่ม
- Custom: feature ที่ต้อง develop หรือ configure พิเศษเกิน standard
- Integration: ต้อง connect กับ external system

## customization_ratio formula
customization_ratio = round((custom_count + integration_count) / total_functions * 100)

## F³ Scoring (0-5 each)
- solution_fit: solution ตอบ requirement ได้แค่ไหน
- competitive_force: ตำแหน่งเทียบคู่แข่ง
- feasibility: ทีมและ resource พร้อม deliver ไหม
- tier_confirm: 1 if total<8, 2 if 8-11, 3 if 12-15

## Go/No-Go gate: Solution Fit (PPS)
- Go if solution_fit >= 3 AND feasibility >= 3
- No-Go if solution is mostly Full Custom (ratio > 60%)
- Conditions = สิ่งที่ต้องทำก่อน proceed

## Output constraints — KEEP IT SHORT
- module_purpose: max 8 words
- function description: max 6 words
- pain_addressed: max 4 words (keyword only)
- reasoning: max 10 words
- risk/mitigation: max 10 words each
- Max 4 modules per solution, max 5 functions per module
- out_of_scope: max 3 items

## Output Format (JSON only — no text outside JSON)
{{
  "solution_design": [
    {{
      "solution_name": "<name>",
      "modules": [
        {{
          "module_name": "<name>",
          "module_purpose": "<8 words max>",
          "function_list": [
            {{
              "function_name": "<name>",
              "description": "<6 words max>",
              "type": "Standard" | "Custom" | "Integration",
              "priority": "Must Have" | "Should Have" | "Nice to Have",
              "pain_addressed": "<4 words max>"
            }}
          ],
          "estimated_complexity": "Low" | "Medium" | "High"
        }}
      ]
    }}
  ],
  "function_summary": {{
    "total_functions": <int>,
    "standard_count": <int>,
    "custom_count": <int>,
    "integration_count": <int>,
    "must_have_count": <int>,
    "customization_ratio": <int 0-100>
  }},
  "out_of_scope": [
    {{"item": "<name>", "reason": "<6 words max>"}}
  ],
  "f3_assessment": {{
    "solution_fit":      {{"score": <0-5>, "reasoning": "<10 words max>"}},
    "competitive_force": {{"score": <0-5>, "reasoning": "<10 words max>"}},
    "feasibility":       {{"score": <0-5>, "reasoning": "<10 words max>"}},
    "total": <sum>,
    "tier_confirm": 1 | 2 | 3
  }},
  "risk_assessment": {{
    "technical_risks": [
      {{"risk": "<10 words max>", "severity": "High" | "Medium" | "Low", "mitigation": "<10 words max>"}}
    ],
    "business_risks": [
      {{"risk": "<10 words max>", "severity": "High" | "Medium" | "Low", "mitigation": "<10 words max>"}}
    ]
  }},
  "go_nogo": {{
    "decision": "Go" | "No-Go",
    "gate": "Solution Fit (PPS)",
    "conditions": ["<condition if any>"]
  }}
}}"""


def shape_solution(deal_context: str, scoring_result: dict, discovery_result: dict,
                   solution_master_path: str = None) -> dict:
    path = solution_master_path or DEFAULT_SOLUTION_MASTER
    with open(path, "r", encoding="utf-8") as f:
        master = f.read()

    # Build context for the agent
    matched = discovery_result.get("matched_solutions", [])
    matched_summary = "\n".join(
        f"- {s.get('solution_name','')}: {s.get('fit_level','')} | {s.get('fit_reasoning','')}"
        for s in matched
    )

    banti_total = scoring_result.get("banti", {}).get("total", "N/A")
    tier        = scoring_result.get("tier", "N/A")

    user_message = f"""## Deal Context
{deal_context}

## Scoring Summary
- BANTi Total: {banti_total}/100  |  Tier: {tier}
- Go/No-Go: {scoring_result.get('go_nogo', 'N/A')}

## Discovery Results
- Overall Fit: {discovery_result.get('overall_fit', 'N/A')}
- Overall Difficulty: {discovery_result.get('overall_difficulty', 'N/A')}
- Recommended Approach: {discovery_result.get('recommended_approach', '')}

## Matched Solutions
{matched_summary}

## Out of Scope (from discovery)
{chr(10).join('- ' + i for i in discovery_result.get('out_of_scope', []))}

Design a detailed solution shaping for the matched solutions above.
Generate module breakdown, function lists, F³ assessment, risks, and Go/No-Go decision."""

    try:
        response = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=8192,
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
    except anthropic.AuthenticationError:
        raise RuntimeError("API Key ไม่ถูกต้อง")
    except json.JSONDecodeError as e:
        raise RuntimeError(f"Model ส่ง response ที่ไม่ใช่ JSON: {e}")
    except Exception as e:
        raise RuntimeError(f"Error: {e}")


if __name__ == "__main__":
    # Quick CLI test
    scoring = {"go_nogo": "Go", "banti": {"total": 80}, "f3": {"total": 12}, "tier": 3}
    discovery = {
        "overall_fit": "Partial Fit",
        "overall_difficulty": "Medium",
        "recommended_approach": "Deploy ERP Platform + Analytics Dashboard",
        "matched_solutions": [
            {"solution_name": "ERP Platform", "fit_level": "Partial Fit",
             "fit_reasoning": "Covers core procurement and finance, needs integration with legacy payroll"},
        ],
        "out_of_scope": ["Machine automation control"],
    }
    deal_ctx = "Company: ABC Co. Budget: 2M THB. Need ERP + Dashboard. Go-live 60 days."
    result = shape_solution(deal_ctx, scoring, discovery)
    print(json.dumps(result, indent=2, ensure_ascii=False))
