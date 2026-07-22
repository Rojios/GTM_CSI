# Proposal Audit Report
**Client:** DENSO Malaysia (DNMY) / DIAT-DX
**Project:** MES-LES-WMS Proposal (12 เดือน dev + 2 เดือน hypercare)
**Vendor:** FPT Software (เวียดนาม) — คู่แข่ง CSI ในดีลเดียวกัน
**Audited by:** Proposal Audit Engine  **Date:** 2026-07-17
**Overall Score (v1):** 5.17/10  **Verdict:** Weak
**Overall Score (v2):** 5.24/10  **Verdict:** Adequate  (Solution Architecture → Critical, ตัวหาร 37)
**Overall Score (v3):** 5.33/10  **Verdict:** Adequate  (+ Delivery Narrative + Master Schedule → Critical, ตัวหาร 39)
**Overall Score (v4, ล่าสุด):** 5.74/10  **Verdict:** Adequate  (ลด CoI/Commercial/Ask→Important + Diff/Team→Optional, ตัวหาร 34, threshold 7/5/3.5)

## 0. Executive Verdict (3 บรรทัด)

- คะแนนรวม 5.17/10 → **Weak** — engineering/governance/QM แข็งแรงกว่า CSI ในหลายจุด แต่ narrative ปิดดีลพังแบบเดียวกัน: ไม่มี Ask, ไม่มีราคาจริงในเล่ม, track record ไม่มีประวัติ Denso เลย [O]
- ความเสี่ยงใหญ่สุด: FPT ไม่มีความสัมพันธ์กับ Denso มาก่อน (ต่างจาก CSI ที่มี 28 โปรเจค) — credentials เป็น global generic ทำให้เสียเปรียบเชิง "trust" กับ Japanese OEM [O]
- Confidence level: **กลาง-สูง** — ไฟล์เป็น text จริง 92k chars อ่านได้เกือบทั้งหมด, ประเมินจากข้อความ ไม่ได้ดู layout ภาพบางหน้า

## 1. Scoring Matrix (17 sections)

| # | Section | Tier | Score | Coverage |
|---|---------|------|-------|----------|
| 1 | 1. Hero Cover | Important | 5 | [F] หน้า 1 — "MES-LES-WMS Proposal, Denso Malaysia, Oct 2025 by FPT" มินิมอลมาก ไม่มี positioning เป็น trusted partner |
| 2 | 2. Agenda | Optional | 4 | [F] หน้า 2 — TOC 13 หัวข้อ ไม่มี 3-act framing/time budget |
| 3 | 3. Client Context | Important | 7 | [F] หน้า 10 Problem Statement + Business Needs + Challenges ยึดโยง operation จริงของ DNMY (CIGMA/GFA/Nexus, WIP, inbound/outbound) ละเอียด |
| 4 | 4. Pain Statement | Critical | 8 | [F] หน้า 10 — 5 pains ภาษา operation ชัด: High Manual Workload, High Operation Cost, Low Traceability, Scattered Systems, No real-time info — วางก่อน solution ถูกต้อง |
| 5 | 5. Cost of Inaction | Critical | 3 | [F] หน้า 11 มี quantified benefit (50% lead time↓, 25-35% manpower↓, 30% cost↓) แต่เป็น "ผลของการทำ" ไม่ใช่ "ต้นทุนถ้าไม่ทำ" ไม่มี urgency layer |
| 6 | 6. Hero Moat (Track Record) | Critical | 5 | [F] หน้า 3-7 global presence (30 ประเทศ, 30k+ พนักงาน, 100+ Fortune 500, 1000+ cert) วางต้น deck (ดี) แต่ generic — **ไม่มีประวัติ Denso/automotive เลย** ไม่มี asymmetric advantage เฉพาะดีล |
| 7 | 7. Solution Architecture | Important | 8 | [F] หน้า 16-18 landscape + legacy integration + system flow, หน้า 31-34 architecture + tech stack (Angular/Spring/Kafka/PostgreSQL) + non-functional req — ครบและลึก (ค่อนไป technical) |
| 8 | 8. Delivery Narrative (3-Wave) | Important | 6 | [F] หน้า 8 approach 4 ขั้น + หน้า 11 phased + หน้า 46 sequence MES→WMS→LES — มี narrative แต่ไม่ใช่ readiness-wave framework |
| 9 | 9. Master Schedule | Important | 8 | [F] หน้า 64 — Master Schedule พร้อม **DNMY Milestones layer** (plant renovation, line relocation, P103 construction, MSCS) + แยก By FPT/By DNMY/By ทั้งคู่ — client-anchored 2-layer จริง |
| 10 | 10. Commercial Summary & TCO | Critical | 3 | [F] หน้า 35-36 infra cost $18,300 (reference only ไม่ใช่ FPT provide) + หน้า 65 "QUOTATION" เป็นแค่ section divider **ไม่มีราคา project จริงในเล่ม** |
| 11 | 11. Differentiation Grid | Important | 3 | [F] หน้า 11 "Our Key Differentiator" เป็น bullet list (MES/MOM expertise, dual-competency, competitive pricing) ไม่ใช่ grid เทียบมิติ |
| 12 | 12. The Ask & Next 30 Days | Critical | 0 | [F] จบด้วย "Thank You" (หน้า 93) + Contact us — ไม่มี ask หรือ next 30 days |
| 13 | 13. Named Team & Organization | Important | 4 | [F] หน้า 53-55 org chart 3 ฝ่าย + RACI ละเอียด แต่เป็น role; มีชื่อจริงเฉพาะ escalation contact (หน้า 57: LongVD1/LaiLD/DucBN@fpt.com) ทีมหลักไม่มีชื่อ |
| 14 | 14. Governance Fit | Optional | 7 | [F] หน้า 8/52/55-59 PMO + change control board + RACI + escalation + communication plan — framework แข็งแรง แต่เป็น FPT's own ไม่อิง Denso Dev Policy |
| 15 | 15. Quality Management & Risk | Important | 9 | [F] หน้า 60-62 QM แยก section (Testing Process, DoD, Quality Acceptance Criteria) + หน้า 43-47 risk register เต็มรูปแบบ (risks + impact + mitigation + affected system + dependencies) — จุดแข็งสูงสุด |
| 16 | 16. Post Go-Live Support (MA) | Optional | 4 | [F] หน้า 52/69-71 hypercare 2 เดือน + warranty SLA (P1-P4) แต่เป็น warranty-only; หน้า 14 ระบุ post-go-live MA อยู่นอก scope แยกสัญญา — ไม่ใช่ multi-year commitment |
| 17 | 17. Reference Case | Important | 7 | [F] หน้า 72-92 — 3 case ละเอียด (WMS QR heavy industry, MES Apriso medical, WMS paperless) relevant manufacturing แต่ anonymized + ไม่มี automotive/Denso โดยตรง |

## 2. Overall Score Computation

```
Critical ×3:  (8 + 3 + 5 + 3 + 0) = 19  → 19 × 3 = 57
Important ×2: (5 + 7 + 8 + 6 + 8 + 3 + 4 + 9 + 7) = 57 → 57 × 2 = 114
Optional ×1:  (4 + 7 + 4) = 15 → 15 × 1 = 15

Weighted sum = 57 + 114 + 15 = 186
Overall = 186 ÷ 36 = 5.17
```

**5.17 อยู่ในช่วง 4.00–5.99 → Verdict: Weak**

## 3. Strengths (5 ข้อ)

1. [F] **Quality Management + Risk เต็มรูปแบบที่สุด** — QM แยก section พร้อม DoD/acceptance criteria ราย phase + risk register 3 ชั้น (project/implementation/dependencies) มี mitigation+owner+impact ครบ (หน้า 43-47, 60-62) — เหนือ CSI ชัดเจน
2. [F] **Pain Statement เขียนเป็นภาษา operation ดีกว่า** — 5 pains ที่ mirror หน้างานจริง วางก่อน solution ตามหลัก trust-before-features (หน้า 10)
3. [F] **Master Schedule มี client milestone overlay จริง** — ซ้อน plant renovation/line relocation/P103/MSCS ของ DNMY เข้ากับ timeline FPT (หน้า 64)
4. [F] **Solution + tech stack ลึกและเป็นรูปธรรม** — ระบุ component/version จริง (Angular 19, Spring Boot 3, Kafka 3.9, PostgreSQL 17) + non-functional requirements (หน้า 31-34)
5. [F] **Governance/communication framework ครบ** — RACI, escalation path มีชื่อ+email, communication matrix, change control board (หน้า 55-59)

## 4. Gaps (10 ข้อ เรียงตามความรุนแรง)

1. 🔴 **ไม่มี The Ask & Next 30 Days** — ปิดด้วย Thank You + Contact us (หน้า 93) เหมือน CSI เป๊ะ (anti-pattern #7)
2. 🔴 **ไม่มีราคา project จริงในเล่ม** — หน้า QUOTATION (65) ว่างเปล่า มีแต่ infra reference $18,300 ที่ระบุว่าไม่ใช่ FPT provide — C-Level ตัดสินใจเชิงพาณิชย์ไม่ได้จากเล่มนี้ (anti-pattern #8)
3. 🔴 **Hero Moat ไม่มีประวัติ Denso** — credentials เป็น global generic; ในดีล Japanese OEM ที่ให้น้ำหนัก trust นี่คือจุดอ่อนเชิงยุทธศาสตร์ที่ใหญ่ที่สุดเทียบ CSI (anti-pattern #2 บางส่วน — วางต้น deck แต่ไม่มี moat จริง)
4. 🔴 **ไม่มี Cost of Inaction** — มีแต่ benefit ของการทำ ไม่มีชั้นความเร่งด่วน/ต้นทุนถ้าไม่ทำ (anti-pattern #10)
5. 🟡 **MA เป็น warranty 2 เดือน ไม่ใช่ commitment ยาว** — post-go-live MA อยู่นอก scope (หน้า 14) ต่างจาก CSI ที่ commit 3 ปี
6. 🟡 **ไม่มี Differentiation Grid** — key differentiator เป็น bullet ไม่ใช่ decision grid เทียบมิติ
7. 🟡 **Named team ไม่มีชื่อจริง** — org เป็น role ล้วน ยกเว้น escalation contact (anti-pattern #9 บางส่วน)
8. 🟡 **Governance ไม่อิง Denso Dev Policy** — เป็น FPT methodology; เสียโอกาสแสดง fit กับ customer standard (จุดที่ CSI ทำได้ดีกว่า)
9. 🟢 **Hero Cover มินิมอลเกิน** — ไม่มี positioning statement
10. 🟢 **Solution ค่อนไป technical deep-dive** — component/version detail มากสำหรับ executive audience

## 5. Anti-Pattern Audit (11 ข้อ)

| # | Anti-pattern | ผล | หลักฐาน |
|---|---|---|---|
| 1 | Why Us ก่อน Pain | ⚠️ PARTIAL | competency หน้า 3-8 มาก่อน pain หน้า 10 แต่ pain วางก่อน solution |
| 2 | Track record ซ่อน appendix | ✅ PASS | credentials อยู่ต้น deck (แต่ generic ไม่มี Denso) |
| 3 | Reference ไม่ตรงอุตสาหกรรม | ⚠️ PARTIAL | manufacturing relevant แต่ medical/heavy industry ไม่ใช่ automotive |
| 4 | Pain ภาษา system | ✅ PASS | หน้า 10 เป็นภาษา operation ชัดเจน |
| 5 | Schedule ไม่มี client milestone | ✅ PASS | หน้า 64 มี DNMY milestone layer เต็ม |
| 6 | QM ผสมใน procedure | ✅ PASS | QM แยก section (หน้า 60-62) |
| 7 | ปิดด้วย Thank You ไม่มี Ask | ❌ FAIL | หน้า 93 Thank You + contact |
| 8 | Pricing เลขเดียว/ไม่มี | ❌ FAIL | ไม่มีราคา project จริงในเล่ม |
| 9 | Named team = TBD | ⚠️ PARTIAL | role ล้วน ยกเว้น escalation มีชื่อ |
| 10 | Pain ไม่ผูก Cost of Inaction | ❌ FAIL | ไม่มี urgency/quantified risk of inaction |
| 11 | Slide ล้นเกิน | ✅ PASS | 94 หน้า มี appendix case แยกชัด, core กระชับกว่า CSI |

**สรุป: FAIL 3, PARTIAL 4, PASS 6** — FPT ทำได้ดีกว่า CSI VER8.0 ในเชิง anti-pattern (CSI FAIL 7)

## 6. Recommendations

### Critical — ต้องแก้ก่อน submit
1. **ใส่ราคา project จริง + TCO** — หน้า QUOTATION ว่างเปล่าคือ dealbreaker; ต้องมี line items + TCO (slide_ref: หน้า 65)
2. **เพิ่ม The Ask & Next 30 Days** ก่อน Thank You (slide_ref: หน้า 93)
3. **เพิ่ม Cost of Inaction** — แปลง 5 pains เป็นต้นทุน/ความเสี่ยงถ้าไม่ทำ (slide_ref: หลังหน้า 10)
4. **เสริม Hero Moat ด้วย automotive/Japanese OEM case** — ถ้ามีประวัติ Denso group ที่ไหนในเครือ FPT ต้องดึงมาชู(slide_ref: หน้า 3-7)

### Important — ควรแก้
5. เพิ่ม Differentiation Grid เทียบมิติ (slide_ref: หน้า 11)
6. ใส่ชื่อทีมจริง ≥5 บทบาท (slide_ref: หน้า 53-55)
7. เสนอ MA multi-year option ไม่ใช่ warranty 2 เดือน (slide_ref: หน้า 69)
8. Map governance เข้ากับ Denso Dev Policy (slide_ref: หน้า 8)

### Optional
9. เพิ่ม positioning statement บน cover (slide_ref: หน้า 1)
10. ย้าย tech component/version detail ไป appendix (slide_ref: หน้า 32)

## 7. Recommended Skeleton
ใช้ 17-section backbone เดียวกับรายงาน CSI (ปรับ client = DNMY, vendor = FPT) — จุดที่ FPT ต้องเติมมากสุด: Commercial (ราคาหาย), The Ask, Cost of Inaction, Hero Moat เฉพาะ Denso

## Closing
- **Confidence level: กลาง-สูง** — text extraction 92k chars อ่านได้เกือบครบ
- **Limitations:** (1) ราคา project จริงไม่มีในไฟล์ (แยกไฟล์ quotation) — ให้ 3 เพราะ framework มีแต่ตัวเลขหลักหาย (2) ไม่ได้ดู layout ภาพหน้า architecture/schedule — ประเมินจากข้อความ (3) proposal ลงวันที่ Oct 2025 อาจไม่ใช่เวอร์ชันสุดท้าย
- **[TBD]:** ราคา project, ชื่อทีมจริง, ประวัติ Denso ของ FPT (ถ้ามี)
