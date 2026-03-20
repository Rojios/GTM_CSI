import sys
sys.stdout.reconfigure(encoding="utf-8")
sys.stderr.reconfigure(encoding="utf-8")

import csv
import json
import os
from datetime import datetime

import gradio as gr
import pandas as pd

import scoring_agent
from scoring_agent import SYSTEM_PROMPT, score_deal
from discovery_agent import DEFAULT_SOLUTION_MASTER, discover_deal
from solution_shaping_agent import shape_solution

_HERE = os.path.dirname(os.path.abspath(__file__))
DEALS_LOG_FILE         = os.path.join(_HERE, "deals_log.csv")
LOG_FILE               = os.path.join(_HERE, "feedback_log.csv")
DISCOVERY_LOG_FILE     = os.path.join(_HERE, "discovery_feedback_log.csv")
SHAPING_LOG_FILE       = os.path.join(_HERE, "shaping_feedback_log.csv")
OPTIMIZED_PROMPT_FILE  = os.path.join(_HERE, "optimized_prompt.txt")

DEALS_LOG_COLUMNS = [
    "deal_id", "timestamp", "company", "contact", "budget", "need",
    "timing", "competitors", "interest",
    "banti_budget", "banti_authority", "banti_need", "banti_timing",
    "banti_interest", "banti_total",
    "f3_solution_fit", "f3_competitive_force", "f3_feasibility", "f3_total",
    "go_nogo", "tier", "reasoning", "risk_flags",
    "discovery_overall_fit", "discovery_difficulty",
    "discovery_matched_solutions", "discovery_next_step",
    "stage", "status",
]
HISTORY_DISPLAY_COLS = [
    "deal_id", "timestamp", "company", "go_nogo", "tier",
    "discovery_overall_fit", "discovery_difficulty", "stage",
]
LOG_COLUMNS = [
    "timestamp", "deal_context", "ai_gonogo", "ai_tier",
    "ai_banti_total", "ai_f3_total", "ai_reasoning",
    "correct_gonogo", "correct_tier", "feedback_note",
]
DISCOVERY_LOG_COLUMNS = [
    "timestamp", "deal_context", "ai_overall_fit", "ai_overall_difficulty",
    "ai_next_step", "correct_fit", "correct_difficulty", "feedback_note",
]
SHAPING_LOG_COLUMNS = [
    "timestamp", "deal_id", "ai_decision", "ai_solution_fit", "ai_feasibility",
    "ai_f3_total", "ai_tier", "ai_customization_ratio",
    "correct_decision", "feedback_note",
]

TIER_LABELS = {
    1: "Tier 1 — Template Proposal",
    2: "Tier 2 — Story-driven Proposal",
    3: "Tier 3 — Strategic C-level Consulting",
}
FIT_COLORS = {
    "Full Fit": "#16a34a", "Partial Fit": "#d97706", "Full Custom": "#dc2626",
}
DIFF_COLORS = {
    "Easy": "#16a34a", "Medium": "#d97706", "Hard": "#dc2626",
}
NEXT_STEP_COLORS = {
    "Proceed to Solution Shaping": "#16a34a",
    "Need More Info": "#d97706",
    "No Fit": "#dc2626",
}
TYPE_COLORS = {
    "Standard": "#16a34a", "Custom": "#d97706", "Integration": "#2563eb",
}
PRIORITY_COLORS = {
    "Must Have": "#dc2626", "Should Have": "#d97706", "Nice to Have": "#6b7280",
}
SEVERITY_COLORS = {
    "High": "#dc2626", "Medium": "#d97706", "Low": "#16a34a",
}


# ─── Helpers ─────────────────────────────────────────────────────────────────

def _ensure_log(path, columns):
    if not os.path.exists(path):
        with open(path, "w", newline="", encoding="utf-8") as f:
            csv.DictWriter(f, fieldnames=columns).writeheader()


def _generate_deal_id() -> str:
    today = datetime.now().strftime("%Y%m%d")
    _ensure_log(DEALS_LOG_FILE, DEALS_LOG_COLUMNS)
    try:
        df = pd.read_csv(DEALS_LOG_FILE, encoding="utf-8")
        prefix = f"GTM-{today}-"
        today_ids = df[df["deal_id"].astype(str).str.startswith(prefix, na=False)]["deal_id"]
        seq = int(today_ids.str.extract(r"-(\d+)$")[0].dropna().astype(int).max()) + 1 if not today_ids.empty else 1
    except Exception:
        seq = 1
    return f"GTM-{today}-{seq:03d}"


def _log_scoring(deal_id, company, contact, budget, need, timeline, competitors, interest, result):
    _ensure_log(DEALS_LOG_FILE, DEALS_LOG_COLUMNS)
    banti = result["banti"]
    f3    = result["f3"]
    row = {
        "deal_id":   deal_id,
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "company": company, "contact": contact, "budget": budget,
        "need": need, "timing": timeline, "competitors": competitors, "interest": interest,
        "banti_budget":    banti["budget"],
        "banti_authority": banti["authority"],
        "banti_need":      banti["need"],
        "banti_timing":    banti["timing"],
        "banti_interest":  banti["interest"],
        "banti_total":     banti["total"],
        "f3_solution_fit":      f3["solution_fit"],
        "f3_competitive_force": f3["competitive_force"],
        "f3_feasibility":       f3["feasibility"],
        "f3_total":             f3["total"],
        "go_nogo":    result["go_nogo"],
        "tier":       result.get("tier", ""),
        "reasoning":  result.get("reasoning", ""),
        "risk_flags": "; ".join(result.get("risk_flags", [])),
        "discovery_overall_fit": "", "discovery_difficulty": "",
        "discovery_matched_solutions": "", "discovery_next_step": "",
        "stage": "Scoring", "status": "Scored",
    }
    with open(DEALS_LOG_FILE, "a", newline="", encoding="utf-8") as f:
        csv.DictWriter(f, fieldnames=DEALS_LOG_COLUMNS).writerow(row)


def _update_discovery_log(deal_id: str, disc_result: dict):
    if not deal_id:
        return
    _ensure_log(DEALS_LOG_FILE, DEALS_LOG_COLUMNS)
    try:
        df = pd.read_csv(DEALS_LOG_FILE, encoding="utf-8")
    except Exception:
        return
    solutions = disc_result.get("matched_solutions", [])
    sol_names = "; ".join(s.get("solution_name", "") for s in solutions)
    mask = df["deal_id"] == deal_id
    if mask.any():
        for col in ["discovery_overall_fit", "discovery_difficulty",
                    "discovery_matched_solutions", "discovery_next_step", "stage", "status"]:
            df[col] = df[col].astype(object)
        df.loc[mask, "discovery_overall_fit"]      = disc_result.get("overall_fit", "")
        df.loc[mask, "discovery_difficulty"]        = disc_result.get("overall_difficulty", "")
        df.loc[mask, "discovery_matched_solutions"] = sol_names
        df.loc[mask, "discovery_next_step"]         = disc_result.get("next_step", "")
        df.loc[mask, "stage"]  = "Discovery"
        df.loc[mask, "status"] = "Discovery Complete"
        df.to_csv(DEALS_LOG_FILE, index=False, encoding="utf-8")


def _update_shaping_log(deal_id: str, shaping_result: dict):
    if not deal_id:
        return
    _ensure_log(DEALS_LOG_FILE, DEALS_LOG_COLUMNS)
    try:
        df = pd.read_csv(DEALS_LOG_FILE, encoding="utf-8")
    except Exception:
        return
    mask = df["deal_id"] == deal_id
    if mask.any():
        for col in ["stage", "status"]:
            df[col] = df[col].astype(object)
        df.loc[mask, "stage"]  = "Solution Shaping"
        df.loc[mask, "status"] = "Shaping Complete"
        df.to_csv(DEALS_LOG_FILE, index=False, encoding="utf-8")


def _score_bar(score, max_score):
    pct = int(score / max_score * 20)
    return "█" * pct + "░" * (20 - pct)


def _badge(text, color):
    return (
        f'<span style="background:{color};color:#fff;padding:3px 10px;'
        f'border-radius:12px;font-weight:bold;font-size:0.9rem">{text}</span>'
    )


def build_deal_context(company, contact, budget, need, timeline, competitors, interest):
    return (
        f"Company: {company}\nContact & Role: {contact}\nBudget: {budget}\n"
        f"Need & Pain: {need}\nTimeline: {timeline}\nCompetitors: {competitors}\n"
        f"Interest Level: {interest}"
    )


def get_current_prompt():
    if os.path.exists(OPTIMIZED_PROMPT_FILE):
        with open(OPTIMIZED_PROMPT_FILE, "r", encoding="utf-8") as f:
            return f.read(), "📄 ใช้ **optimized prompt** อยู่"
    return SYSTEM_PROMPT, "📄 ใช้ **default prompt** อยู่"


# ─── Shaping Render Helpers ──────────────────────────────────────────────────

def _render_shaping_design(solution_design: list) -> str:
    if not solution_design:
        return "<div style='color:#6b7280'>ไม่มีข้อมูล Solution Design</div>"
    html = ""
    for sol in solution_design:
        sol_name = sol.get("solution_name", "—")
        html += f'<div style="font-family:sans-serif;margin-bottom:20px">'
        html += f'<h3 style="margin:0 0 10px 0;color:#1e40af">📦 {sol_name}</h3>'
        for mod in sol.get("modules", []):
            complexity = mod.get("estimated_complexity", "—")
            comp_color = {"Low": "#16a34a", "Medium": "#d97706", "High": "#dc2626"}.get(complexity, "#888")
            html += f'''
            <div style="border:1px solid #e5e7eb;border-radius:8px;padding:12px;margin-bottom:12px">
              <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px">
                <b style="font-size:1rem">{mod.get("module_name","—")}</b>
                {_badge(complexity, comp_color)}
              </div>
              <div style="color:#6b7280;font-size:0.9rem;margin-bottom:8px">{mod.get("module_purpose","")}</div>
              <table style="width:100%;border-collapse:collapse;font-size:0.85rem">
                <thead>
                  <tr style="background:#f3f4f6">
                    <th style="text-align:left;padding:6px 8px;border-bottom:1px solid #e5e7eb">Function</th>
                    <th style="text-align:left;padding:6px 8px;border-bottom:1px solid #e5e7eb">Description</th>
                    <th style="padding:6px 8px;border-bottom:1px solid #e5e7eb">Type</th>
                    <th style="padding:6px 8px;border-bottom:1px solid #e5e7eb">Priority</th>
                    <th style="text-align:left;padding:6px 8px;border-bottom:1px solid #e5e7eb">Pain Addressed</th>
                  </tr>
                </thead>
                <tbody>'''
            for fn in mod.get("function_list", []):
                ftype    = fn.get("type", "—")
                priority = fn.get("priority", "—")
                html += f'''
                  <tr style="border-bottom:1px solid #f3f4f6">
                    <td style="padding:5px 8px;font-weight:500">{fn.get("function_name","—")}</td>
                    <td style="padding:5px 8px;color:#374151">{fn.get("description","")}</td>
                    <td style="padding:5px 8px;text-align:center">{_badge(ftype, TYPE_COLORS.get(ftype,"#888"))}</td>
                    <td style="padding:5px 8px;text-align:center">{_badge(priority, PRIORITY_COLORS.get(priority,"#888"))}</td>
                    <td style="padding:5px 8px;color:#6b7280;font-size:0.82rem">{fn.get("pain_addressed","")}</td>
                  </tr>'''
            html += "</tbody></table></div>"
        html += "</div>"
    return html


def _render_function_summary(fs: dict) -> str:
    total   = fs.get("total_functions", 0)
    std     = fs.get("standard_count", 0)
    custom  = fs.get("custom_count", 0)
    integ   = fs.get("integration_count", 0)
    must    = fs.get("must_have_count", 0)
    ratio   = fs.get("customization_ratio", 0)
    ratio_color = "#16a34a" if ratio <= 30 else ("#d97706" if ratio <= 60 else "#dc2626")
    bar_std  = int(std  / total * 100) if total else 0
    bar_cust = int(custom / total * 100) if total else 0
    bar_int  = int(integ / total * 100) if total else 0
    return f"""
    <div style="font-family:sans-serif">
      <div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:12px">
        <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:10px 18px;text-align:center">
          <div style="font-size:1.8rem;font-weight:bold;color:#16a34a">{total}</div>
          <div style="color:#6b7280;font-size:0.85rem">Total Functions</div>
        </div>
        <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:10px 18px;text-align:center">
          <div style="font-size:1.8rem;font-weight:bold;color:#2563eb">{must}</div>
          <div style="color:#6b7280;font-size:0.85rem">Must Have</div>
        </div>
        <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:10px 18px;text-align:center">
          <div style="font-size:1.8rem;font-weight:bold;color:{ratio_color}">{ratio}%</div>
          <div style="color:#6b7280;font-size:0.85rem">Customization Ratio</div>
        </div>
      </div>
      <div style="margin-bottom:8px">
        <div style="display:flex;justify-content:space-between;margin-bottom:2px">
          <span>Standard ({std})</span><span>{bar_std}%</span>
        </div>
        <div style="background:#e5e7eb;border-radius:4px;height:12px">
          <div style="background:#16a34a;width:{bar_std}%;height:100%;border-radius:4px"></div>
        </div>
      </div>
      <div style="margin-bottom:8px">
        <div style="display:flex;justify-content:space-between;margin-bottom:2px">
          <span>Custom ({custom})</span><span>{bar_cust}%</span>
        </div>
        <div style="background:#e5e7eb;border-radius:4px;height:12px">
          <div style="background:#d97706;width:{bar_cust}%;height:100%;border-radius:4px"></div>
        </div>
      </div>
      <div>
        <div style="display:flex;justify-content:space-between;margin-bottom:2px">
          <span>Integration ({integ})</span><span>{bar_int}%</span>
        </div>
        <div style="background:#e5e7eb;border-radius:4px;height:12px">
          <div style="background:#2563eb;width:{bar_int}%;height:100%;border-radius:4px"></div>
        </div>
      </div>
    </div>"""


def _render_f3(f3: dict) -> str:
    sf  = f3.get("solution_fit",      {})
    cf  = f3.get("competitive_force", {})
    fea = f3.get("feasibility",       {})
    total = f3.get("total", 0)
    tier  = f3.get("tier_confirm", "—")
    tier_label = TIER_LABELS.get(tier, f"Tier {tier}") if isinstance(tier, int) else "—"
    def _score_row(label, obj):
        s = obj.get("score", 0)
        r = obj.get("reasoning", "")
        bar = "█" * s + "░" * (5 - s)
        return f"""
        <tr style="border-bottom:1px solid #f3f4f6">
          <td style="padding:8px;font-weight:500">{label}</td>
          <td style="padding:8px;font-family:monospace;color:#2563eb">{bar} {s}/5</td>
          <td style="padding:8px;color:#6b7280;font-size:0.9rem">{r}</td>
        </tr>"""
    return f"""
    <div style="font-family:sans-serif">
      <table style="width:100%;border-collapse:collapse">
        <thead>
          <tr style="background:#f3f4f6">
            <th style="text-align:left;padding:8px">Dimension</th>
            <th style="text-align:left;padding:8px">Score</th>
            <th style="text-align:left;padding:8px">Reasoning</th>
          </tr>
        </thead>
        <tbody>
          {_score_row("Solution Fit", sf)}
          {_score_row("Competitive Force", cf)}
          {_score_row("Feasibility", fea)}
          <tr style="font-weight:bold;background:#f0fdf4">
            <td style="padding:8px">Total</td>
            <td style="padding:8px;color:#16a34a">{total} / 15</td>
            <td style="padding:8px">{_badge(tier_label, '#2563eb')}</td>
          </tr>
        </tbody>
      </table>
    </div>"""


def _render_risks(risk: dict) -> str:
    tech_risks = risk.get("technical_risks", [])
    biz_risks  = risk.get("business_risks", [])
    def _risk_rows(risks):
        if not risks:
            return "<tr><td colspan='3' style='padding:8px;color:#6b7280'>ไม่มี</td></tr>"
        rows = ""
        for r in risks:
            sev = r.get("severity", "—")
            rows += f"""
            <tr style="border-bottom:1px solid #f3f4f6">
              <td style="padding:8px">{r.get("risk","—")}</td>
              <td style="padding:8px;text-align:center">{_badge(sev, SEVERITY_COLORS.get(sev,"#888"))}</td>
              <td style="padding:8px;color:#6b7280;font-size:0.9rem">{r.get("mitigation","")}</td>
            </tr>"""
        return rows
    header = '<thead><tr style="background:#f3f4f6"><th style="text-align:left;padding:8px">Risk</th><th style="padding:8px">Severity</th><th style="text-align:left;padding:8px">Mitigation</th></tr></thead>'
    return f"""
    <div style="font-family:sans-serif">
      <b>Technical Risks</b>
      <table style="width:100%;border-collapse:collapse;margin-bottom:16px">{header}<tbody>{_risk_rows(tech_risks)}</tbody></table>
      <b>Business Risks</b>
      <table style="width:100%;border-collapse:collapse">{header}<tbody>{_risk_rows(biz_risks)}</tbody></table>
    </div>"""


def _render_gonogo(go_nogo: dict) -> str:
    decision   = go_nogo.get("decision", "—")
    gate       = go_nogo.get("gate", "—")
    conditions = go_nogo.get("conditions", [])
    is_go      = (decision == "Go")
    color      = "#16a34a" if is_go else "#dc2626"
    icon       = "✅" if is_go else "❌"
    cond_html  = "".join(f"<li>{c}</li>" for c in conditions) if conditions else "<li>ไม่มีเงื่อนไข</li>"
    return f"""
    <div style="font-family:sans-serif">
      <div style="font-size:2.2rem;font-weight:bold;color:{color};text-align:center;padding:16px 0">
        {icon} {decision}
      </div>
      <div style="text-align:center;color:#6b7280;margin-bottom:12px">Gate: <b>{gate}</b></div>
      <div><b>Conditions / Next Actions:</b>
        <ul style="margin:4px 0;padding-left:1.4em">{cond_html}</ul>
      </div>
    </div>"""


# ─── Tab 0: Scoring ───────────────────────────────────────────────────────────

def submit(company, contact, budget, need, timeline, competitors, interest):
    def _err(msg):
        return (
            "—", "—", gr.update(value=msg, visible=True), "—", "", "", "",
            gr.update(visible=False), gr.update(visible=False),
            gr.update(value="", visible=False),
            None, "", "",
        )

    if not company.strip():
        return _err("⚠️ กรุณากรอก Company")

    deal_context = build_deal_context(company, contact, budget, need, timeline, competitors, interest)
    try:
        result = score_deal(deal_context)
    except Exception as e:
        return _err(f"❌ Error: {e}")

    deal_id    = _generate_deal_id()
    banti      = result["banti"]
    f3         = result["f3"]
    go_nogo    = result["go_nogo"]
    tier       = result.get("tier")
    reasoning  = result.get("reasoning", "")
    risk_flags = result.get("risk_flags", [])
    tier_label = TIER_LABELS.get(tier, "N/A") if tier else "N/A"

    _log_scoring(deal_id, company, contact, budget, need, timeline, competitors, interest, result)

    go_nogo_html = (
        '<div style="font-size:2rem;font-weight:bold;color:#16a34a">✅ GO</div>'
        if go_nogo == "Go"
        else '<div style="font-size:2rem;font-weight:bold;color:#dc2626">❌ NO-GO</div>'
    )
    breakdown_html = f"""
    <div style="font-family:sans-serif;line-height:1.8">
      <b>BANTi Breakdown</b>
      <table style="width:100%;border-collapse:collapse;margin-top:6px">
        <tr><td>Budget</td>   <td style="text-align:right">{banti['budget']} / 20</td></tr>
        <tr><td>Authority</td><td style="text-align:right">{banti['authority']} / 20</td></tr>
        <tr><td>Need</td>     <td style="text-align:right">{banti['need']} / 20</td></tr>
        <tr><td>Timing</td>   <td style="text-align:right">{banti['timing']} / 20</td></tr>
        <tr><td>Interest</td> <td style="text-align:right">{banti['interest']} / 20</td></tr>
        <tr style="font-weight:bold;border-top:1px solid #ccc">
          <td>Total</td><td style="text-align:right">{banti['total']} / 100</td>
        </tr>
      </table><br>
      <b>F³ Breakdown</b>
      <table style="width:100%;border-collapse:collapse;margin-top:6px">
        <tr><td>Solution Fit</td>      <td style="text-align:right">{f3['solution_fit']} / 5</td></tr>
        <tr><td>Competitive Force</td> <td style="text-align:right">{f3['competitive_force']} / 5</td></tr>
        <tr><td>Feasibility</td>       <td style="text-align:right">{f3['feasibility']} / 5</td></tr>
        <tr style="font-weight:bold;border-top:1px solid #ccc">
          <td>Total</td><td style="text-align:right">{f3['total']} / 15</td>
        </tr>
      </table>
    </div>"""

    risk_items = "".join(f"<li>{flag}</li>" for flag in risk_flags)
    risk_html  = f"<ul style='margin:0;padding-left:1.2em'>{risk_items}</ul>" if risk_flags else "—"
    is_go      = (go_nogo == "Go")
    nogo_html  = (
        "" if is_go
        else '<div style="color:#dc2626;font-weight:bold;padding:8px 0">'
             '🚫 Deal ไม่ผ่าน gate — ไม่สามารถ Proceed ได้</div>'
    )

    return (
        f"{banti['total']} / 100\n{_score_bar(banti['total'], 100)}",
        f"{f3['total']} / 15\n{_score_bar(f3['total'], 15)}",
        gr.update(value=go_nogo_html, visible=True),
        tier_label,
        f"<div style='font-family:sans-serif'>{reasoning}</div>",
        breakdown_html,
        f"<div style='font-family:sans-serif'>{risk_html}</div>",
        gr.update(visible=True),
        gr.update(visible=is_go),
        gr.update(value=nogo_html, visible=not is_go),
        result, deal_context, deal_id,
    )


def proceed_to_discovery(last_result, last_context):
    if last_result is None:
        return gr.update(selected=1), "⚠️ ยังไม่มีผล scoring"
    banti_total = last_result["banti"]["total"]
    f3_total    = last_result["f3"]["total"]
    tier        = last_result.get("tier", "N/A")
    summary_html = f"""
    <div style="font-family:sans-serif;background:#f0fdf4;border:1px solid #bbf7d0;
                border-radius:8px;padding:12px;margin-bottom:8px">
      <b>📊 Scoring Summary</b><br>
      {_badge("GO", "#16a34a")} &nbsp;
      BANTi: <b>{banti_total}/100</b> &nbsp;|&nbsp;
      F³: <b>{f3_total}/15</b> &nbsp;|&nbsp;
      Tier: <b>{TIER_LABELS.get(tier, "N/A") if isinstance(tier, int) else "N/A"}</b>
    </div>"""
    return gr.update(selected=1), summary_html


def submit_feedback(correct_gonogo, correct_tier, feedback_note, last_result, last_context):
    if last_result is None:
        return "⚠️ ยังไม่มีผล scoring"
    _ensure_log(LOG_FILE, LOG_COLUMNS)
    tier_val = last_result.get("tier")
    row = {
        "timestamp":      datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "deal_context":   last_context,
        "ai_gonogo":      last_result["go_nogo"],
        "ai_tier":        str(tier_val) if tier_val else "null",
        "ai_banti_total": last_result["banti"]["total"],
        "ai_f3_total":    last_result["f3"]["total"],
        "ai_reasoning":   last_result.get("reasoning", ""),
        "correct_gonogo": correct_gonogo,
        "correct_tier":   correct_tier,
        "feedback_note":  feedback_note,
    }
    with open(LOG_FILE, "a", newline="", encoding="utf-8") as f:
        csv.DictWriter(f, fieldnames=LOG_COLUMNS).writerow(row)
    return "✅ บันทึก Feedback เรียบร้อยแล้ว"


# ─── Tab 1: Discovery ────────────────────────────────────────────────────────

def run_discovery(last_result, last_context, tech_pains, tech_requirements, requested_solution):
    if last_result is None or not last_context:
        return (
            '<div style="color:#d97706;font-weight:bold">⚠️ กรุณา Score Deal และกด Proceed ก่อน</div>',
            "", "", "", "", None,
        )

    extra_parts = []
    if tech_pains.strip():
        extra_parts.append(f"## Additional Pains (from discovery interview)\n{tech_pains.strip()}")
    if tech_requirements.strip():
        extra_parts.append(f"## Technical Requirements\n{tech_requirements.strip()}")
    if requested_solution.strip():
        extra_parts.append(f"## Customer Requested Solution\n{requested_solution.strip()}")
    enhanced_context = last_context + ("\n\n" + "\n\n".join(extra_parts) if extra_parts else "")

    try:
        result = discover_deal(enhanced_context, last_result, DEFAULT_SOLUTION_MASTER)
    except Exception as e:
        return f'<div style="color:#dc2626">❌ Error: {e}</div>', "", "", "", "", None

    overall_fit  = result.get("overall_fit", "—")
    overall_diff = result.get("overall_difficulty", "—")
    next_step    = result.get("next_step", "—")
    recommended  = result.get("recommended_approach", "—")
    out_of_scope = result.get("out_of_scope", [])
    solutions    = result.get("matched_solutions", [])

    header_html = f"""
    <div style="font-family:sans-serif;display:flex;gap:16px;flex-wrap:wrap;margin-bottom:12px">
      <div>Overall Fit: {_badge(overall_fit, FIT_COLORS.get(overall_fit,'#888'))}</div>
      <div>Difficulty: {_badge(overall_diff, DIFF_COLORS.get(overall_diff,'#888'))}</div>
      <div>Next Step: {_badge(next_step, NEXT_STEP_COLORS.get(next_step,'#888'))}</div>
    </div>
    <div style="font-family:sans-serif;margin-bottom:8px">
      <b>Recommended Approach:</b> {recommended}
    </div>"""

    sol_rows = ""
    for s in solutions:
        fit    = s.get("fit_level", "—")
        diff   = s.get("difficulty", "—")
        custom = s.get("customization_needed", [])
        custom_html = "".join(f"<li>{c}</li>" for c in custom) if custom else "<li>ไม่มี</li>"
        sol_rows += f"""
        <div style="border:1px solid #e5e7eb;border-radius:8px;padding:12px;margin-bottom:10px;
                    font-family:sans-serif">
          <div style="display:flex;gap:8px;align-items:center;margin-bottom:6px">
            <b>{s.get('solution_name','—')}</b>
            {_badge(fit, FIT_COLORS.get(fit,'#888'))}
            {_badge(diff, DIFF_COLORS.get(diff,'#888'))}
          </div>
          <div style="color:#374151;margin-bottom:4px">{s.get('fit_reasoning','')}</div>
          <div><b>Customization needed:</b>
            <ul style="margin:2px 0;padding-left:1.2em">{custom_html}</ul>
          </div>
        </div>"""

    solutions_html = sol_rows or "<div style='color:#6b7280'>ไม่พบ matched solution</div>"
    oos_items      = "".join(f"<li>{i}</li>" for i in out_of_scope)
    oos_html       = f"<ul style='margin:0;padding-left:1.2em'>{oos_items}</ul>" if out_of_scope else "<div style='color:#6b7280'>—</div>"
    ns_color       = NEXT_STEP_COLORS.get(next_step, "#888")
    next_html      = (f'<div style="font-size:1.1rem;font-weight:bold;color:{ns_color};'
                      f'border:2px solid {ns_color};border-radius:8px;padding:10px;'
                      f'text-align:center">→ {next_step}</div>')

    return header_html, solutions_html, oos_html, next_html, json.dumps(result), result


def submit_discovery_feedback(correct_fit, correct_diff, feedback_note, discovery_json_str):
    if not discovery_json_str:
        return "⚠️ ยังไม่มีผล Discovery"
    _ensure_log(DISCOVERY_LOG_FILE, DISCOVERY_LOG_COLUMNS)
    try:
        result = json.loads(discovery_json_str)
    except Exception:
        return "❌ Error reading discovery result"
    row = {
        "timestamp":             datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "deal_context":          "",
        "ai_overall_fit":        result.get("overall_fit", ""),
        "ai_overall_difficulty": result.get("overall_difficulty", ""),
        "ai_next_step":          result.get("next_step", ""),
        "correct_fit":           correct_fit,
        "correct_difficulty":    correct_diff,
        "feedback_note":         feedback_note,
    }
    with open(DISCOVERY_LOG_FILE, "a", newline="", encoding="utf-8") as f:
        csv.DictWriter(f, fieldnames=DISCOVERY_LOG_COLUMNS).writerow(row)
    return "✅ บันทึก Feedback เรียบร้อยแล้ว"


# ─── Tab 2: Solution Shaping ─────────────────────────────────────────────────

def run_shaping(discovery_json_str, last_result, last_context, deal_id):
    if not discovery_json_str:
        err = '<div style="color:#d97706;font-weight:bold">⚠️ กรุณา Run Discovery ให้เสร็จก่อน</div>'
        return err, "", "", "", "", "", ""
    try:
        disc_result = json.loads(discovery_json_str)
    except Exception:
        err = '<div style="color:#dc2626">❌ Error reading discovery result</div>'
        return err, "", "", "", "", "", ""

    try:
        result = shape_solution(last_context, last_result, disc_result)
    except Exception as e:
        err = f'<div style="color:#dc2626">❌ Error: {e}</div>'
        return err, "", "", "", "", "", ""

    _update_shaping_log(deal_id, result)

    design_html  = _render_shaping_design(result.get("solution_design", []))
    summary_html = _render_function_summary(result.get("function_summary", {}))
    f3_html      = _render_f3(result.get("f3_assessment", {}))
    risk_html    = _render_risks(result.get("risk_assessment", {}))
    gonogo_html  = _render_gonogo(result.get("go_nogo", {}))

    go_nogo  = result.get("go_nogo", {})
    decision = go_nogo.get("decision", "")
    is_go    = (decision == "Go")

    oos_items = result.get("out_of_scope", [])
    oos_html  = "".join(
        f'<div style="border-left:3px solid #d97706;padding:4px 10px;margin-bottom:6px;font-family:sans-serif">'
        f'<b>{i.get("item","")}</b> — <span style="color:#6b7280">{i.get("reason","")}</span></div>'
        for i in oos_items
    ) if oos_items else "<div style='color:#6b7280'>ไม่มี</div>"

    return (
        "",   # clear warning
        design_html,
        summary_html + "<br><b>Out of Scope:</b><br>" + oos_html,
        f3_html,
        risk_html,
        gonogo_html,
        json.dumps(result),
    )


def submit_shaping_feedback(correct_decision, feedback_note, shaping_json_str, deal_id):
    if not shaping_json_str:
        return "⚠️ ยังไม่มีผล Solution Shaping"
    _ensure_log(SHAPING_LOG_FILE, SHAPING_LOG_COLUMNS)
    try:
        result = json.loads(shaping_json_str)
    except Exception:
        return "❌ Error reading shaping result"
    f3   = result.get("f3_assessment", {})
    fs   = result.get("function_summary", {})
    gng  = result.get("go_nogo", {})
    row = {
        "timestamp":             datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "deal_id":               deal_id,
        "ai_decision":           gng.get("decision", ""),
        "ai_solution_fit":       f3.get("solution_fit", {}).get("score", ""),
        "ai_feasibility":        f3.get("feasibility", {}).get("score", ""),
        "ai_f3_total":           f3.get("total", ""),
        "ai_tier":               f3.get("tier_confirm", ""),
        "ai_customization_ratio": fs.get("customization_ratio", ""),
        "correct_decision":      correct_decision,
        "feedback_note":         feedback_note,
    }
    with open(SHAPING_LOG_FILE, "a", newline="", encoding="utf-8") as f:
        csv.DictWriter(f, fieldnames=SHAPING_LOG_COLUMNS).writerow(row)
    return "✅ บันทึก Feedback เรียบร้อยแล้ว"


# ─── Tab 3: History Log ───────────────────────────────────────────────────────

def load_history():
    _ensure_log(DEALS_LOG_FILE, DEALS_LOG_COLUMNS)
    try:
        df = pd.read_csv(DEALS_LOG_FILE, encoding="utf-8")
    except Exception:
        return pd.DataFrame(columns=HISTORY_DISPLAY_COLS), "ยังไม่มีข้อมูล"
    if df.empty:
        return pd.DataFrame(columns=HISTORY_DISPLAY_COLS), "ยังไม่มีข้อมูล"

    total     = len(df)
    go_count  = (df["go_nogo"] == "Go").sum()
    go_rate   = round(go_count / total * 100, 1)

    fit_df    = df[df["discovery_overall_fit"].notna() & (df["discovery_overall_fit"] != "")]
    ff_count  = (fit_df["discovery_overall_fit"] == "Full Fit").sum() if not fit_df.empty else 0
    ff_rate   = round(ff_count / len(fit_df) * 100, 1) if not fit_df.empty else 0

    avg_banti = round(pd.to_numeric(df["banti_total"], errors="coerce").mean(), 1)

    summary = (
        f"**Total deals:** {total} | "
        f"**Go rate:** {go_rate}% ({go_count}/{total}) | "
        f"**Full Fit:** {ff_rate}% ({ff_count}/{len(fit_df)}) | "
        f"**Avg BANTi:** {avg_banti}"
    )
    display_df = df[[c for c in HISTORY_DISPLAY_COLS if c in df.columns]]
    return display_df, summary


# ─── Tab 4: Prompt Optimizer ─────────────────────────────────────────────────

def analyze_feedback_fn():
    _ensure_log(LOG_FILE, LOG_COLUMNS)
    try:
        df = pd.read_csv(LOG_FILE, encoding="utf-8")
    except Exception:
        return "", "⚠️ ยังไม่มีข้อมูล"
    if df.empty:
        return "", "⚠️ ยังไม่มีข้อมูล"
    wrong = df[
        (df["ai_gonogo"] != df["correct_gonogo"]) |
        (df["ai_tier"].astype(str) != df["correct_tier"].astype(str))
    ]
    if wrong.empty:
        return "", "✅ AI ไม่มีเคสที่ผิดเลย"
    examples = [
        f"Deal: {r['deal_context']}\nAI: Go/No-Go={r['ai_gonogo']}, Tier={r['ai_tier']}\n"
        f"Correct: Go/No-Go={r['correct_gonogo']}, Tier={r['correct_tier']}\nFeedback: {r['feedback_note']}"
        for _, r in wrong.iterrows()
    ]
    current_prompt, _ = get_current_prompt()
    request = (
        f"You are a prompt engineer.\n\nCurrent system prompt:\n{current_prompt}\n\n"
        f"Wrong cases:\n\n" + "\n\n---\n\n".join(examples)
        + "\n\nAnalyze patterns and write an improved prompt.\n\n"
        "Format:\nANALYSIS:\n<2-3 sentences>\n\nIMPROVED PROMPT:\n<full prompt>"
    )
    try:
        resp = scoring_agent.client.messages.create(
            model="claude-sonnet-4-6", max_tokens=2000,
            messages=[{"role": "user", "content": request}],
        )
        text = resp.content[0].text
        if "IMPROVED PROMPT:" in text:
            analysis = text.split("IMPROVED PROMPT:", 1)[0].replace("ANALYSIS:", "").strip()
            improved = text.split("IMPROVED PROMPT:", 1)[1].strip()
        else:
            analysis, improved = "ดู prompt ด้านล่าง", text.strip()
        return improved, f"✅ วิเคราะห์เสร็จ\n\n**สรุป:** {analysis}"
    except Exception as e:
        return "", f"❌ Error: {e}"


def apply_prompt_fn(new_prompt):
    if not new_prompt.strip():
        return "⚠️ ไม่มี prompt ให้ save"
    with open(OPTIMIZED_PROMPT_FILE, "w", encoding="utf-8") as f:
        f.write(new_prompt.strip())
    return "✅ Prompt updated successfully"


def rollback_fn():
    if os.path.exists(OPTIMIZED_PROMPT_FILE):
        os.remove(OPTIMIZED_PROMPT_FILE)
        return SYSTEM_PROMPT, "✅ Rolled back to default prompt"
    return SYSTEM_PROMPT, "ℹ️ กำลังใช้ default prompt อยู่แล้ว"


# ─── UI ──────────────────────────────────────────────────────────────────────

with gr.Blocks(title="Go to Market AI Agent Pipeline") as demo:
    gr.Markdown("# 🎯 Go to Market AI Agent Pipeline\nBANTi-F³ Framework — powered by Claude")

    last_result_state    = gr.State(None)
    last_context_state   = gr.State("")
    deal_id_state        = gr.State("")
    discovery_json_state = gr.State("")
    shaping_json_state   = gr.State("")

    with gr.Tabs(selected=0) as main_tabs:

        # ── Tab 0: Scoring ────────────────────────────────────────────────────
        with gr.Tab("📊 Scoring", id=0):
            with gr.Row():
                with gr.Column(scale=1):
                    gr.Markdown("### 📋 Deal Information")
                    company     = gr.Textbox(label="Company",       placeholder="เช่น บริษัท ABC จำกัด")
                    contact     = gr.Textbox(label="Contact & Role", placeholder="เช่น คุณสมชาย — CTO")
                    budget      = gr.Textbox(label="Budget",         placeholder="เช่น มีงบ 2 ล้านบาท ยืนยันแล้ว")
                    need        = gr.Textbox(label="Need & Pain",    placeholder="เช่น ระบบ ERP เก่าทำให้ report ช้า 3 ชม./วัน", lines=3)
                    timeline    = gr.Textbox(label="Timeline",       placeholder="เช่น ต้องการ go-live ภายใน 60 วัน")
                    competitors = gr.Textbox(label="Competitors",    placeholder="เช่น ไม่มีคู่แข่ง / shortlist เดียว")
                    interest    = gr.Textbox(label="Interest Level", placeholder="เช่น มี internal champion push โปรเจกต์อยู่")
                    submit_btn  = gr.Button("🚀 Score Deal", variant="primary", size="lg")

                with gr.Column(scale=1):
                    gr.Markdown("### 📊 Results")
                    go_nogo_out   = gr.HTML(visible=False)
                    with gr.Row():
                        banti_out = gr.Textbox(label="BANTi Score", interactive=False)
                        f3_out    = gr.Textbox(label="F³ Score",    interactive=False)
                    tier_out      = gr.Textbox(label="Tier",          interactive=False)
                    reasoning_out = gr.HTML(label="Reasoning")
                    breakdown_out = gr.HTML(label="Score Breakdown")
                    risk_out      = gr.HTML(label="⚠️ Risk Flags")
                    nogo_msg      = gr.HTML(visible=False)
                    proceed_btn   = gr.Button("➡️ Proceed to Discovery", variant="primary", visible=False)

            with gr.Group(visible=False) as feedback_group:
                gr.Markdown("---\n### ✏️ Boss Feedback — Scoring")
                with gr.Row():
                    correct_gonogo = gr.Radio(["Go", "No-Go"], label="Go/No-Go ที่ถูกต้อง", value="Go")
                    correct_tier   = gr.Radio(["1", "2", "3", "N/A"], label="Tier ที่ถูกต้อง", value="N/A")
                feedback_note   = gr.Textbox(label="Feedback Note", lines=2)
                feedback_btn    = gr.Button("💾 Submit Feedback", variant="secondary")
                feedback_status = gr.Markdown("")

            submit_btn.click(
                fn=submit,
                inputs=[company, contact, budget, need, timeline, competitors, interest],
                outputs=[
                    banti_out, f3_out, go_nogo_out, tier_out,
                    reasoning_out, breakdown_out, risk_out,
                    feedback_group, proceed_btn, nogo_msg,
                    last_result_state, last_context_state, deal_id_state,
                ],
            )
            feedback_btn.click(
                fn=submit_feedback,
                inputs=[correct_gonogo, correct_tier, feedback_note,
                        last_result_state, last_context_state],
                outputs=[feedback_status],
            )

        # ── Tab 1: Discovery ──────────────────────────────────────────────────
        with gr.Tab("🔍 Discovery", id=1):
            scoring_summary_html = gr.HTML()
            discovery_warning    = gr.HTML(
                value='<div style="color:#d97706;font-weight:bold;padding:8px 0">'
                      '⚠️ กรุณา Score Deal และกด Proceed ก่อน</div>'
            )

            with gr.Row():
                with gr.Column(scale=1):
                    gr.Markdown("### 🔎 Technical Discovery Input")
                    tech_pains         = gr.Textbox(label="Pains (เพิ่มเติม/ละเอียดขึ้น)", lines=5,
                        placeholder="เช่น\n- ปิดบัญชีช้า ใช้เวลา 15 วัน\n- Stock count ผิดพลาด 20%/เดือน")
                    tech_requirements  = gr.Textbox(label="Requirements (technical)", lines=5,
                        placeholder="เช่น\n- ERP รองรับ 200 users, 2 sites\n- Integrate legacy payroll")
                    requested_solution = gr.Textbox(label="Requested Solution (ถ้าลูกค้าระบุมา)", lines=3,
                        placeholder="เช่น ลูกค้าถามหา ERP + BI Dashboard")
                    run_discovery_btn  = gr.Button("🔍 Run Discovery", variant="primary", size="lg")

                with gr.Column(scale=1):
                    gr.Markdown("### 📊 Discovery Results")
                    discovery_header    = gr.HTML()
                    discovery_solutions = gr.HTML()
                    discovery_oos       = gr.HTML()
                    discovery_nextstep  = gr.HTML()

            with gr.Group(visible=False) as disc_feedback_group:
                gr.Markdown("---\n### ✏️ Boss Feedback — Discovery")
                with gr.Row():
                    disc_correct_fit  = gr.Radio(
                        ["Full Fit", "Partial Fit", "Full Custom"],
                        label="Overall Fit ที่ถูกต้อง", value="Full Fit"
                    )
                    disc_correct_diff = gr.Radio(
                        ["Easy", "Medium", "Hard"],
                        label="Difficulty ที่ถูกต้อง", value="Medium"
                    )
                disc_feedback_note   = gr.Textbox(label="Feedback Note", lines=2)
                disc_feedback_btn    = gr.Button("💾 Submit Feedback", variant="secondary")
                disc_feedback_status = gr.Markdown("")

            shaping_proceed_btn = gr.Button(
                "➡️ Proceed to Solution Shaping", variant="primary", visible=False
            )

            def _run_discovery_and_show(last_result, last_context, deal_id,
                                        tech_pains, tech_requirements, requested_solution):
                header, solutions, oos, nextstep, json_str, disc_result = run_discovery(
                    last_result, last_context, tech_pains, tech_requirements, requested_solution,
                )
                if disc_result:
                    _update_discovery_log(deal_id, disc_result)
                next_step   = disc_result.get("next_step", "") if disc_result else ""
                show_shaping = next_step == "Proceed to Solution Shaping"
                return (
                    gr.update(visible=False),
                    header, solutions, oos, nextstep,
                    gr.update(visible=bool(json_str)),
                    json_str,
                    gr.update(visible=show_shaping),
                )

            run_discovery_btn.click(
                fn=_run_discovery_and_show,
                inputs=[last_result_state, last_context_state, deal_id_state,
                        tech_pains, tech_requirements, requested_solution],
                outputs=[
                    discovery_warning,
                    discovery_header, discovery_solutions,
                    discovery_oos, discovery_nextstep,
                    disc_feedback_group, discovery_json_state,
                    shaping_proceed_btn,
                ],
            )
            disc_feedback_btn.click(
                fn=submit_discovery_feedback,
                inputs=[disc_correct_fit, disc_correct_diff,
                        disc_feedback_note, discovery_json_state],
                outputs=[disc_feedback_status],
            )

        # ── Tab 2: Solution Shaping ───────────────────────────────────────────
        with gr.Tab("💡 Solution Shaping", id=2):
            shaping_warning = gr.HTML(
                value='<div style="color:#d97706;font-weight:bold;padding:8px 0">'
                      '⚠️ กรุณา Run Discovery ให้เสร็จและ Next Step = Proceed to Solution Shaping ก่อน</div>'
            )

            run_shaping_btn = gr.Button("🔬 Run Solution Shaping", variant="primary", size="lg")

            with gr.Accordion("📊 Section 1 — Discovery Summary", open=False):
                disc_summary_display = gr.HTML(
                    value="<div style='color:#6b7280'>รัน Discovery ก่อนเพื่อดูสรุป</div>"
                )

            gr.Markdown("### 📦 Section 2 — Solution Design")
            shaping_design_out = gr.HTML()

            gr.Markdown("### 📈 Section 3 — Function Summary")
            shaping_summary_out = gr.HTML()

            gr.Markdown("### 🎯 Section 4 — F³ Score + Tier")
            shaping_f3_out = gr.HTML()

            gr.Markdown("### ⚠️ Section 5 — Risk Assessment")
            shaping_risk_out = gr.HTML()

            gr.Markdown("### ✅ Section 6 — Go/No-Go Decision")
            shaping_gonogo_out = gr.HTML()

            estimation_proceed_btn = gr.Button(
                "➡️ Proceed to Estimation", variant="primary", visible=False
            )

            with gr.Group(visible=False) as shaping_feedback_group:
                gr.Markdown("---\n### ✏️ Section 7 — Boss Feedback — Solution Shaping")
                shaping_correct_decision = gr.Radio(
                    ["Go", "No-Go"], label="Go/No-Go ที่ถูกต้อง", value="Go"
                )
                shaping_feedback_note   = gr.Textbox(label="Feedback Note", lines=2)
                shaping_feedback_btn    = gr.Button("💾 Submit Feedback", variant="secondary")
                shaping_feedback_status = gr.Markdown("")

            def _run_shaping_and_show(disc_json, last_result, last_context, deal_id):
                warning, design, summary, f3, risk, gonogo, json_str = run_shaping(
                    disc_json, last_result, last_context, deal_id
                )
                # Build discovery summary for accordion
                disc_summary = ""
                if disc_json:
                    try:
                        dr = json.loads(disc_json)
                        overall_fit  = dr.get("overall_fit", "—")
                        overall_diff = dr.get("overall_difficulty", "—")
                        next_s       = dr.get("next_step", "—")
                        approach     = dr.get("recommended_approach", "—")
                        sols = dr.get("matched_solutions", [])
                        sol_list = "".join(
                            f'<li><b>{s.get("solution_name","")}</b> — '
                            f'{_badge(s.get("fit_level",""), FIT_COLORS.get(s.get("fit_level",""),"#888"))} '
                            f'{s.get("fit_reasoning","")}</li>'
                            for s in sols
                        )
                        disc_summary = f"""
                        <div style="font-family:sans-serif">
                          <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:8px">
                            <span>Overall Fit: {_badge(overall_fit, FIT_COLORS.get(overall_fit,'#888'))}</span>
                            <span>Difficulty: {_badge(overall_diff, DIFF_COLORS.get(overall_diff,'#888'))}</span>
                            <span>Next Step: {_badge(next_s, NEXT_STEP_COLORS.get(next_s,'#888'))}</span>
                          </div>
                          <div style="margin-bottom:6px"><b>Recommended:</b> {approach}</div>
                          <ul style="margin:0;padding-left:1.2em">{sol_list}</ul>
                        </div>"""
                    except Exception:
                        disc_summary = "<div style='color:#dc2626'>Error loading discovery summary</div>"

                is_complete = bool(json_str)
                try:
                    res = json.loads(json_str) if json_str else {}
                    is_go = res.get("go_nogo", {}).get("decision", "") == "Go"
                except Exception:
                    is_go = False

                return (
                    gr.update(value=warning, visible=bool(warning)),
                    disc_summary,
                    design, summary, f3, risk, gonogo,
                    gr.update(visible=is_complete and is_go),   # estimation_proceed_btn
                    gr.update(visible=is_complete),             # shaping_feedback_group
                    json_str,
                )

            run_shaping_btn.click(
                fn=_run_shaping_and_show,
                inputs=[discovery_json_state, last_result_state, last_context_state, deal_id_state],
                outputs=[
                    shaping_warning,
                    disc_summary_display,
                    shaping_design_out, shaping_summary_out,
                    shaping_f3_out, shaping_risk_out, shaping_gonogo_out,
                    estimation_proceed_btn,
                    shaping_feedback_group,
                    shaping_json_state,
                ],
            )
            shaping_feedback_btn.click(
                fn=submit_shaping_feedback,
                inputs=[shaping_correct_decision, shaping_feedback_note,
                        shaping_json_state, deal_id_state],
                outputs=[shaping_feedback_status],
            )

        # ── Tab 3: History Log ────────────────────────────────────────────────
        with gr.Tab("📜 History Log", id=3):
            refresh_btn   = gr.Button("🔄 Refresh", variant="secondary")
            summary_out   = gr.Markdown("กด Refresh เพื่อโหลดข้อมูล")
            history_table = gr.Dataframe(
                headers=HISTORY_DISPLAY_COLS, interactive=False, wrap=True,
            )
            refresh_btn.click(fn=load_history, inputs=[], outputs=[history_table, summary_out])

        # ── Tab 4: Prompt Optimizer ───────────────────────────────────────────
        with gr.Tab("🧠 Prompt Optimizer", id=4):
            prompt_status    = gr.Markdown("")
            current_prompt   = gr.Textbox(label="Current Prompt (active)", lines=20, interactive=False)
            analyze_btn      = gr.Button("🔍 Analyze Feedback & Generate New Prompt", variant="primary")
            optimizer_status = gr.Markdown("")
            proposed_prompt  = gr.Textbox(label="Proposed New Prompt (แก้ไขได้ก่อน Apply)", lines=20)
            with gr.Row():
                apply_btn    = gr.Button("✅ Apply New Prompt",    variant="primary")
                rollback_btn = gr.Button("↩️ Rollback to Default", variant="stop")
            apply_status = gr.Markdown("")

            analyze_btn.click(fn=analyze_feedback_fn,  inputs=[],               outputs=[proposed_prompt, optimizer_status])
            apply_btn.click(  fn=apply_prompt_fn,       inputs=[proposed_prompt], outputs=[apply_status])
            rollback_btn.click(fn=rollback_fn,          inputs=[],               outputs=[current_prompt, apply_status])

    proceed_btn.click(
        fn=proceed_to_discovery,
        inputs=[last_result_state, last_context_state],
        outputs=[main_tabs, scoring_summary_html],
    )
    shaping_proceed_btn.click(
        fn=lambda: gr.update(selected=2),
        inputs=[],
        outputs=[main_tabs],
    )
    demo.load(fn=get_current_prompt, outputs=[current_prompt, prompt_status])

if __name__ == "__main__":
    demo.launch(inbrowser=True, theme=gr.themes.Soft())
