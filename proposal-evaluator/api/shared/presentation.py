"""Presentation Coach (R4) — สร้าง guideline การนำเสนอ proposal ตามกลุ่มผู้ฟัง.

รับ proposal text + audience role -> LLM สรุป guideline (markdown ไทย) ว่าควรโฟกัสอะไร
เน้นอะไร เลี่ยงอะไร ตามระดับผู้ฟัง โดยอ้างอิงเนื้อหา proposal จริง.
ใช้ LLM provider เดียวกับ audit (llm.client_and_model).
"""
from __future__ import annotations

from . import llm

# audience role -> คำอธิบายบริบทให้ LLM ปรับคำแนะนำ
AUDIENCE = {
    "c_level": "ผู้บริหารระดับสูง (C-Level / executives) — สนใจคุณค่าเชิงธุรกิจ, ROI, ความเสี่ยง, "
               "timeline ภาพรวม, ผลกระทบเชิงกลยุทธ์ ไม่ลงลึกรายละเอียดเทคนิค เวลาจำกัด",
    "users": "ผู้ใช้งานจริง (end users) — สนใจว่าระบบช่วยงานประจำวันยังไง ใช้ง่ายไหม "
             "เปลี่ยนวิธีทำงานเดิมแค่ไหน มีการอบรม/ช่วยเหลือยังไง กังวลเรื่อง workload ช่วงเปลี่ยนผ่าน",
    "it": "ฝ่าย IT ขององค์กรลูกค้า — สนใจการดูแลระบบระยะยาว, การเชื่อมต่อกับระบบเดิม (integration), "
          "security/compliance, โครงสร้างพื้นฐานที่ต้องเตรียม, ภาระ support หลัง go-live",
    "purchase": "ฝ่ายจัดซื้อ (procurement) — สนใจความคุ้มค่า ราคาเทียบตลาด, เงื่อนไขสัญญา/การจ่ายเงิน, "
                "SLA และ penalty, ความน่าเชื่อถือของ vendor, ความเสี่ยงด้านสัญญาและการส่งมอบ",
    "technical": "ทีมเทคนิค (engineers / architects) — สนใจสถาปัตยกรรม, การเชื่อมต่อระบบ (integration), "
                 "ความเป็นไปได้เชิงเทคนิค, security, ความน่าเชื่อถือของ solution",
    "non_technical": "ผู้ฟังทั่วไปที่ไม่ใช่สายเทคนิค (business users / operations) — สนใจประโยชน์ใช้งานจริง, "
                     "ความง่ายในการใช้, ผลลัพธ์ที่จับต้องได้ ต้องใช้ภาษาเข้าใจง่าย เลี่ยงศัพท์เทคนิค",
}

_TEMPERATURE = 0.3  # ให้มีความสร้างสรรค์เล็กน้อยแต่ยังยึดเนื้อหา


def coach_guideline(proposal_text: str, audience_desc: str) -> str:
    """คืน guideline การนำเสนอ (markdown ไทย). audience_desc = คำอธิบายผู้ฟัง
    (จาก AUDIENCE map หรือ custom text ที่ผู้ใช้พิมพ์เอง)."""
    client, model = llm.client_and_model()
    system = (
        "คุณเป็นโค้ชการนำเสนอ (presentation coach) มืออาชีพสำหรับงานขาย B2B enterprise. "
        "อ่าน proposal ที่ให้ แล้วสรุปเป็น guideline การนำเสนอที่เจาะจงกลุ่มผู้ฟัง โดยยึดจากเนื้อหา proposal จริง. "
        "ตอบเป็นภาษาไทย รูปแบบ markdown มีหัวข้อตามนี้:\n"
        "## โฟกัสหลัก\n(3-4 ข้อ ว่าการพรีเซนต์ต่อผู้ฟังกลุ่มนี้ควรเน้นภาพรวมเรื่องอะไร)\n"
        "## ประเด็นที่ควรชู\n(ดึงจุดแข็ง/เนื้อหาจริงใน proposal ที่โดนใจผู้ฟังกลุ่มนี้ อ้างส่วนที่เกี่ยวข้อง)\n"
        "## สิ่งที่ควรเลี่ยงหรือระวัง\n(สิ่งที่ผู้ฟังกลุ่มนี้ไม่สนใจ หรือจุดอ่อนใน proposal ที่ต้องเตรียมรับมือ)\n"
        "## คำถามที่อาจโดนถาม + แนวตอบ\n(2-3 คำถามที่ผู้ฟังกลุ่มนี้มักถาม พร้อมแนวทางตอบ)\n\n"
        "ห้ามแนะนำลอยๆ — ต้องอ้างอิงเนื้อหาที่มีจริงใน proposal เสมอ."
    )
    user = (
        f"กลุ่มผู้ฟัง: {audience_desc}\n\n"
        f"=== PROPOSAL TEXT ===\n{proposal_text[:24000]}\n=== END ==="
    )
    resp = client.chat.completions.create(
        model=model, temperature=_TEMPERATURE,
        messages=[{"role": "system", "content": system}, {"role": "user", "content": user}],
    )
    return resp.choices[0].message.content or ""
