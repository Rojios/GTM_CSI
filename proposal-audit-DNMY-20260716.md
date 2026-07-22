# Proposal Audit Report
**Client:** DENSO INTERNATIONAL ASIA CO., LTD. (โรงงาน DENSO MALAYSIA — DNMY)
**Project:** DNMY FIoT Platform Development Project (WMS + LES + MES) VER 8.0
**Audited by:** Proposal Audit Engine  **Date:** 2026-07-16
**Overall Score (v1):** 4.33/10  **Verdict:** Weak
**Overall Score (v2):** 4.43/10  **Verdict:** Weak  (Solution Architecture → Critical, ตัวหาร 37)
**Overall Score (v3):** 4.51/10  **Verdict:** Weak  (+ Delivery Narrative + Master Schedule → Critical, ตัวหาร 39)
**Overall Score (v4, ล่าสุด):** 4.88/10  **Verdict:** Weak  (ลด CoI/Commercial/Ask→Important + Diff/Team→Optional, ตัวหาร 34, threshold 7/5/3.5)

## 0. Executive Verdict (3 บรรทัด)

- คะแนนรวม 4.33/10 → **Weak** — เนื้อหาเชิงเทคนิคและ governance แข็งแรงมาก แต่โครงเรื่องขาย (narrative) ผิดโครงสร้าง: เปิดด้วย WHY CSI, ไม่มี Ask, ไม่มี Differentiation, ทีมเป็น TBD ทั้งหมด [O]
- ความเสี่ยงใหญ่สุดถ้า submit ตามสภาพนี้: C-Level ไม่เห็นเหตุผลว่า "ทำไมต้อง CSI และทำไมต้องตอนนี้" — track record DENSO 28 โปรเจคที่เป็นแต้มต่อจริงถูกฝังไว้ appendix หน้า 75-76 [O]
- Confidence level: **กลาง** — อ่านครบทุก section หลักจากภาพ render + ข้อความ แต่ ~11 หน้า case study ใน appendix เป็นภาพล้วนอ่านได้เฉพาะหัวเรื่อง

## 1. Scoring Matrix (17 sections)

| # | Section | Tier | Score | Coverage |
|---|---------|------|-------|----------|
| 1 | 1. Hero Cover | Important | 7 | [F] หน้า 1 — cover สะอาด ระบุ client "FOR DENSO INTERNATIONAL ASIA", ชื่อโปรเจค, วันที่ create/submit ครบ; ขาด positioning statement ว่าเป็น trusted partner |
| 2 | 2. Agenda | Optional | 4 | [F] หน้า 2 — เป็น TOC 9 หัวข้อพร้อมเลขหน้า; ไม่มีการจัดกรอบ 3-act หรือ time budget |
| 3 | 3. Client Context | Important | 4 | [F] หน้า 8-9 มี Problem Statement + Customer Request แต่ไม่มี slide บริบทธุรกิจลูกค้าโดยเฉพาะ (โรงงาน, volume, สถานการณ์ปัจจุบันของ DNMY) |
| 4 | 4. Pain Statement | Critical | 5 | [F] หน้า 8: Delayed Data / Area Limitations / Manual Reliance + หน้า 9: 4 issues — มี pain จริงแต่เขียนสั้นเป็น label กึ่งภาษา system ("Delayed Data Management") และวางหลัง WHY CSI |
| 5 | 5. Cost of Inaction | Critical | 2 | [F] มีเพียงวลีเชิงคุณภาพ ("disrupting the seamless manufacturing cycle", "risk of operational errors" หน้า 8) — ไม่มีการแปลงเป็นความเสี่ยงธุรกิจที่วัดได้ ไม่มีชั้นความเร่งด่วน |
| 6 | 6. Hero Moat (Track Record) | Critical | 3 | [F] track record แข็งแรงมากแต่อยู่ APPENDIX C/D/E (หน้า 68-99): 28 โปรเจค DENSO, 23 บริษัทใช้ WMS ของ CSI, ความร่วมมือ DIAT-DX ปัจจุบัน — ส่วนหน้า deck (WHY CSI หน้า 3-7) เป็น corporate credentials ทั่วไป (certs, partners) ไม่ใช่ moat เฉพาะโปรเจคนี้ |
| 7 | 7. Solution Architecture | Important | 8 | [F] หน้า 15 Overall Landscape (แบ่ง CSI scope ชัด), หน้า 16 Data Integration, หน้า 17-20 integration 44 เส้น, หน้า 38-40 GCP architecture — ครบและชัดเจนมาก |
| 8 | 8. Delivery Narrative (3-Wave) | Important | 6 | [F] หน้า 8 roadmap phased go-live: WMS 2027 → LES 2028 → MES 2029 + หน้า 43 methodology 6 phase (Fushime sign-off) — มี narrative เป็นขั้นแต่ไม่ใช่กรอบ readiness-wave |
| 9 | 9. Master Schedule | Important | 6 | [F] หน้า 52 Gantt 2026-2029 ราย system มีคอลัมน์ MAIN/SUB แยกความรับผิดชอบ CSI vs DIAT/DNMY — แต่ไม่มี client milestones ซ้อนทับเป็น layer ที่สอง |
| 10 | 10. Commercial Summary & TCO | Critical | 6 | [F] หน้า 57-58 — line items ราย system พร้อม M/M breakdown ต่อ role, รวม 38.6M THB excl. VAT + MA 3.71M/ปี บังคับ 3 ปี; ขาดตาราง TCO หลายปีรวม (โปรเจค + MA 3 ปี ≈ 49.73M ไม่ได้แสดง) |
| 11 | 11. Differentiation Grid | Important | 0 | missing — ไม่มี slide เทียบคู่แข่ง/ทางเลือกในมิติใดเลย |
| 12 | 12. The Ask & Next 30 Days | Critical | 0 | missing — main deck ปิดที่ T&C แล้วตามด้วย "THANK YOU FOR YOUR PARTICIPATION" (หน้า 63) ไม่มีคำขอการตัดสินใจหรือ next steps |
| 13 | 13. Named Team & Organization | Important | 2 | [F] หน้า 47 PIC = TBA ทุกแถว, หน้า 50 Project Formation: PM: XXX, SA×3 (TBD), PG×3 (TBD) — มีโครงสร้างแต่ไม่มีชื่อจริงแม้แต่คนเดียว |
| 14 | 14. Governance Fit | Optional | 8 | [F] หน้า 42 อิง Asia Denso Development Policy (V-model ของลูกค้าเอง), หน้า 43 Fushime sign-off + role involvement matrix, หน้า 46 Requirement Change Policy — fit กับ Japanese OEM governance ชัดเจน |
| 15 | 15. Quality Management & Risk | Important | 4 | [F] QA checkpoints ฝังอยู่ใน Dev Policy (หน้า 42-43) ไม่แยกเป็น section; หน้า 45 มี Risks 9 ข้อแต่เป็น bullet list ไม่มี mitigation/owner — ไม่ใช่ risk register |
| 16 | 16. Post Go-Live Support (MA) | Optional | 8 | [F] หน้า 54-55 helpdesk model + SLA 4 ระดับ (CAT1 ตอบใน 30 นาที แก้ใน 1 วันทำการ) + หน้า 58 MA บังคับ 3 ปี + หน้า 62 MA terms — ครบ |
| 17 | 17. Reference Case | Important | 7 | [F] หน้า 74-76: 28 โปรเจคกับ DENSO Group + ความร่วมมือ DIAT-DX ปัจจุบัน, หน้า 97-99: 23 WMS customers (ส่วนใหญ่ Japanese manufacturing) + 2 case studies — ตรงอุตสาหกรรม แต่ case ถูก anonymize และอยู่ appendix |

## 2. Overall Score Computation

```
Critical ×3:  (5 + 2 + 3 + 6 + 0) = 16  → 16 × 3 = 48
Important ×2: (7 + 4 + 8 + 6 + 6 + 0 + 2 + 4 + 7) = 44 → 44 × 2 = 88
Optional ×1:  (4 + 8 + 8) = 20 → 20 × 1 = 20

Weighted sum = 48 + 88 + 20 = 156
Overall = 156 ÷ 36 = 4.33
```

**4.33 อยู่ในช่วง 4.00–5.99 → Verdict: Weak**

## 3. Strengths (5 ข้อ)

1. [F] **สถาปัตยกรรม solution ครบและลึกที่สุดในตลาด tier นี้** — landscape แยก CSI scope ชัด, integration mapping 44 เส้นระบุ From/To/Purpose รายตัว, GCP architecture ระบุ service ครบ 13 layer (หน้า 15-20, 38-40)
2. [F] **Governance fit ตรง DNA ของ Denso** — อิง Asia Denso Development Policy V-model ของลูกค้าเอง พร้อม Fushime sign-off gates และ involvement matrix ราย role ราย phase (หน้า 42-43) — จุดนี้เหนือ vendor ทั่วไปที่เสนอ methodology ของตัวเอง
3. [F] **MA/Support มีมาตรฐานระดับ enterprise** — SLA 4 ระดับพร้อม response/resolution time ชัดเจน, helpdesk ภาษาไทย/อังกฤษ, ราคา MA แยกรายปี (หน้า 54-58)
4. [F] **Pricing โปร่งใส** — แจกแจง M/M ต่อ role (PM/SA/PG/PC) ต่อ system ไม่ใช่ตัวเลขก้อนเดียว (หน้า 57)
5. [F] **Track record ตรง client group จริง** — 28 โปรเจคกับ DENSO entities + งาน DIAT-DX ที่กำลังทำอยู่ — เป็น asymmetric advantage ที่คู่แข่งไม่มี แต่ถูกวางผิดตำแหน่ง (appendix)

## 4. Gaps (10 ข้อ เรียงตามความรุนแรง)

1. 🔴 **ไม่มี The Ask & Next 30 Days** — deck ปิดด้วย Thank You ลอย (หน้า 63) ไม่ขอการตัดสินใจ ไม่เสนอ next steps (anti-pattern #7)
2. 🔴 **ไม่มี Cost of Inaction** — pain ไม่ถูกแปลงเป็นตัวเลข/ความเสี่ยงธุรกิจ ไม่มีเหตุผลว่า "ทำไมต้องอนุมัติปีนี้" ทั้งที่ roadmap ผูก FY24-FY26 (anti-pattern #10)
3. 🔴 **เปิดด้วย WHY CSI ก่อน Pain** — หน้า 3-7 เป็น corporate profile ก่อนถึง Problem Statement หน้า 8 (anti-pattern #1)
4. 🔴 **Hero Moat ถูกฝังใน appendix** — 28 DENSO projects + 23 WMS cases อยู่หน้า 74-99 ขณะที่ต้น deck ใส่ certs/partners ทั่วไป (anti-pattern #2)
5. 🟡 **ไม่มี Differentiation Grid** — ไม่มีมิติเปรียบเทียบใดๆ ให้ C-Level ใช้ตัดสินใจเลือก CSI เหนือคู่แข่ง
6. 🟡 **Named team = TBD/XXX ทั้งหมด** — PIC ทุกตำแหน่งเป็น TBA (หน้า 47, 50) สำหรับดีล 38.6M THB นี่คือช่องให้คู่แข่งโจมตีทันที (anti-pattern #9)
7. 🟡 **Pain เขียนกึ่งภาษา system และสั้นเกิน** — "Delayed Data Management", "Manual Job" — ไม่ mirror คำพูดหน้างานของ operation (anti-pattern #4 บางส่วน)
8. 🟡 **QM ไม่แยก section + Risk ไม่มี mitigation** — risks 9 ข้อ (หน้า 45) ไม่มี likelihood/impact/owner/mitigation (anti-pattern #6)
9. 🟡 **Schedule ไม่มี client milestone overlay** — Gantt มี MAIN/SUB แต่ไม่มีชั้น milestone ฝั่ง DNMY เช่น Cigma readiness, plant shutdown, AMR vendor delivery (anti-pattern #5)
10. 🟢 **ไม่มี multi-year TCO รวม + deck ยาว 100 หน้า** — ตัวเลขรวม 3 ปีลูกค้าต้องคำนวณเอง; core deck 63 หน้าเจือจาง narrative (anti-pattern #8 บางส่วน, #11)

## 5. Anti-Pattern Audit (11 ข้อ)

| # | Anti-pattern | ผล | หลักฐาน |
|---|---|---|---|
| 1 | Why Us ก่อน Pain | ❌ FAIL | TOC: WHY CSI (หน้า 3-7) มาก่อน Executive Summary/Pain (หน้า 8) |
| 2 | Track record ซ่อน appendix | ❌ FAIL | DENSO 28 โปรเจค + WMS cases อยู่ Appendix C/D/E (หน้า 74-99) |
| 3 | Reference ไม่ตรงอุตสาหกรรม | ✅ PASS | DENSO Group โดยตรง + Japanese manufacturing WMS |
| 4 | Pain ภาษา system | ⚠️ PARTIAL | หน้า 8 กึ่ง operation ("stock overflows in production lines") แต่หน้า 9 เป็น label แห้ง ("Manual Job") |
| 5 | Schedule ไม่มี client milestone | ❌ FAIL | Gantt หน้า 52 มีแต่ผู้รับผิดชอบ MAIN/SUB ไม่มี milestone layer ของลูกค้า |
| 6 | QM ผสมใน procedure | ❌ FAIL | QA/Fushime ฝังใน Dev Policy (หน้า 42-43) ไม่มี QM section แยก |
| 7 | ปิดด้วย Thank You ไม่มี Ask | ❌ FAIL | หน้า 63 "THANK YOU FOR YOUR PARTICIPATION" ไม่มี ask/next steps |
| 8 | Pricing เลขเดียว | ✅ PASS (บางส่วน) | มี line items + M/M ต่อ role; ขาดเฉพาะ TCO รวมหลายปี |
| 9 | Named team = TBD | ❌ FAIL | หน้า 47 PIC=TBA ทุกแถว, หน้า 50 PM: XXX / SA (TBD) / PG (TBD) |
| 10 | Pain ไม่ผูก Cost of Inaction | ❌ FAIL | ไม่มีชั้น urgency/quantified risk ใดๆ |
| 11 | Slide ล้นเกิน | ⚠️ PARTIAL | 100 หน้า (core ~63 + appendix ~37) — appendix แยกถูกต้อง แต่ core ยาวและมีหน้า detail ปน (integration 44 เส้น 4 หน้าอยู่ใน core) |

**สรุป: FAIL 7 ข้อ, PARTIAL 2 ข้อ, PASS 2 ข้อ** — ทุกข้อที่ fail สะท้อนในคะแนน section ที่เกี่ยวแล้ว

## 6. Recommendations

### Critical — ต้องแก้ก่อน submit

1. **เพิ่ม slide "The Ask & Next 30 Days"** แทรกก่อน Thank You (หน้า 63) — ระบุสิ่งที่ขอจาก DNMY (approve budget FY, ตั้ง PIC ฝั่งลูกค้า, kickoff date) + timeline 30 วันแรก (slide_ref: หลัง T&C หน้า 62)
2. **เพิ่ม slide "Cost of Inaction"** ต่อจาก Problem Statement — แปลง 3 pains เป็นความเสี่ยงธุรกิจ: ต้นทุน manual labor ต่อปี, ความเสี่ยง stock overflow ต่อ production stop, ค่าเสียโอกาสถ้าเลื่อน go-live ออกไป 1 ปี — ตัวเลขขอจากทีม DIAT-DX ที่ทำงานกับลูกค้าอยู่แล้ว [TBD] (slide_ref: หลังหน้า 8)
3. **สลับโครงเรื่อง: Pain ก่อน Why CSI + ยก Hero Moat ขึ้นต้น deck** — ย้าย Executive Summary/Customer Request (หน้า 8-9) ขึ้นก่อน แล้วแทน WHY CSI ทั่วไปด้วย 1-2 slide "CSI × DENSO Track Record" (สรุป 28 โปรเจค + งาน DIAT-DX ปัจจุบัน + 23 WMS implementations) ส่วน corporate profile เดิมย้ายลง appendix (slide_ref: หน้า 3-9)
4. **ระบุชื่อทีมจริงอย่างน้อย 5 บทบาทหลัก** — PM (Master), PM ราย system, SA lead — ถ้ายังระบุครบไม่ได้ ให้ใส่ชื่อ + ประวัติย่อของ key persons ที่ยืนยันได้ก่อน [TBD] (slide_ref: หน้า 47, 50)

### Important — ควรแก้

5. **เพิ่ม Differentiation Grid** — เทียบ CSI vs ทางเลือก (SI ญี่ปุ่นรายใหญ่ / local SI / package vendor) ใน 5 มิติ: DENSO group experience, Denso Dev Policy compliance, ราคา/M/M, ทีม TH+EN+JP, MA 3 ปี (slide_ref: ก่อน pricing หน้า 56)
6. **แยก Quality Management & Risk เป็น section เอง** — ยก Fushime/QA gates ออกจาก Dev Policy + ทำ risk register จาก 9 ข้อในหน้า 45 เพิ่ม likelihood/impact/mitigation/owner (slide_ref: หน้า 42-45)
7. **Overlay client milestones บน Master Schedule** — เพิ่มชั้น DNMY/DIAT: Cigma API readiness, AMR vendor delivery, plant events, UAT windows (slide_ref: หน้า 52)
8. **เพิ่มตาราง Multi-year TCO** — Y1 implementation 38.6M + MA ปีละ 3.71M × 3 ปี = ภาพรวม ~49.73M THB excl. VAT ให้ C-Level เห็นภาระผูกพันเต็ม (slide_ref: หน้า 58)

### Optional — ถ้ามีเวลา

9. ปรับ Agenda เป็น 3-act (สถานการณ์ DNMY → เราส่งมอบต่างอย่างไร → ข้อเสนอและ ask) พร้อมเวลาโดยประมาณ (slide_ref: หน้า 2)
10. เขียน pain ใหม่เป็นภาษา operation ที่ mirror คำพูดหน้างาน เช่น "พนักงานต้องเดินเช็ค stock เองทุกกะเพราะข้อมูลใน Cigma ตามหลังหน้างานครึ่งวัน" (slide_ref: หน้า 8-9)
11. ย้ายหน้า integration detail 44 เส้น (หน้า 17-20) ไป appendix — เก็บไว้เฉพาะ landscape + data flow ใน core (slide_ref: หน้า 17-20)

## 7. Recommended Skeleton (ปรับตาม DNMY FIoT)

1. **Hero Cover** — "DNMY FIoT Platform — by DENSO Group's Long-standing Digital Partner" ระบุ CSI × DIAT-DX partnership
2. **Agenda** — 3-act: Your Situation → How We Deliver → Our Commitment & Ask
3. **Client Context** — สถานการณ์โรงงาน DNMY: Cigma legacy, พื้นที่จำกัด, แผน AMR [TBD: ข้อมูล plant/volume จริง]
4. **Pain Statement** — 4 pains ภาษา operation: ข้อมูลตามหลังหน้างาน, พื้นที่ไม่พอ, งาน manual สูง, transfer ซับซ้อนถี่ขึ้น
5. **Cost of Inaction** — quantify: labor cost, stock overflow → line stop risk, ค่าเสียโอกาสเลื่อน FY [TBD: ตัวเลขจาก DIAT-DX]
6. **Hero Moat** — 28 DENSO projects + DIAT-DX PMO ปัจจุบัน + 23 WMS implementations + Denso Dev Policy compliance
7. **Solution Architecture** — Overall Landscape (หน้า 15 เดิม — ดีอยู่แล้ว) + Data Integration overview
8. **Delivery Narrative** — 3 waves: Warehouse Ready (WMS 2027) → Logistics Ready (LES 2028) → Production Ready (MES 2029)
9. **Master Schedule** — Gantt เดิม + client milestone overlay [TBD: milestone ฝั่ง DNMY]
10. **Commercial Summary & TCO** — line items เดิม + ตาราง TCO 3 ปี ~49.73M THB
11. **Differentiation Grid** — 5 มิติ vs ทางเลือก [TBD: ข้อมูลคู่แข่งในดีลนี้]
12. **The Ask & Next 30 Days** — ขอ approve + ตั้ง PIC + kickoff; แผน 30 วันแรก
13. **Named Team & Organization** — โครงสร้างเดิมหน้า 50 + ชื่อจริง ≥5 ตำแหน่ง [TBD]
14. **Governance Fit** — Asia Denso Dev Policy + Fushime (หน้า 42-43 เดิม — จุดแข็ง คงไว้)
15. **Quality Management & Risk** — QM แยก section + risk register 9 ข้อพร้อม mitigation
16. **Post Go-Live Support (MA)** — SLA + helpdesk เดิม (หน้า 54-55 — ดีอยู่แล้ว)
17. **Reference Case** — คัด 2-3 case ที่ใกล้ DNMY ที่สุด (WMS+AMR automotive) ขึ้น core, ที่เหลือ appendix

## Closing

- **Confidence level: กลาง** — ครอบคลุมทุก section หลักจากการอ่านภาพ render 39 หน้า + ข้อความสกัดทั้งเล่ม
- **Limitations:** (1) PDF เป็นภาพเกือบทั้งเล่ม — หน้า case study appendix (79-95) อ่านได้เฉพาะหัวเรื่อง เนื้อหาละเอียดใน case ไม่ถูกนำมาคิดคะแนน (2) เลขหน้า footer (ถึง 104) ไม่ตรงกับจำนวนหน้า PDF (100) — อาจมี slide ที่ถูกลบ/ซ่อนใน export (3) ประเมินจากเอกสารอย่างเดียว ไม่มีข้อมูล RFP/คู่แข่ง/ประวัติ deal
- **[TBD] ที่ต้อง verify ก่อน submit:** ชื่อทีมจริง, ตัวเลข cost of inaction, client milestones ฝั่ง DNMY, ข้อมูลคู่แข่งในดีล, ยอด TCO รวมที่ CSI ต้องการ commit
