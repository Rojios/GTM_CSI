# Proposal Audit Report
**Client:** DENSO Malaysia (DNMY)
**Project:** Denso DNMY Project — WMS + LES + MES (12 เดือน + 3 เดือน warranty)
**Vendor:** X10 / Extend IT Resource Co., Ltd. (ไทย) — คู่แข่งรายที่ 3 ในดีลเดียวกัน
**Audited by:** Proposal Audit Engine  **Date:** 2026-07-17
**Overall Score (v1):** 4.92/10  **Verdict:** Weak
**Overall Score (v2):** 5.00/10  **Verdict:** Adequate  (Solution Architecture → Critical, ตัวหาร 37)
**Overall Score (v3):** 5.05/10  **Verdict:** Adequate  (+ Delivery Narrative + Master Schedule → Critical, ตัวหาร 39)
**Overall Score (v4, ล่าสุด):** 5.32/10  **Verdict:** Adequate  (ลด CoI/Commercial/Ask→Important + Diff/Team→Optional, ตัวหาร 34, threshold 7/5/3.5)

## 0. Executive Verdict (3 บรรทัด)

- คะแนนรวม 4.92/10 → **Weak** — commercial ครบที่สุดในสามเจ้า (ราคาจริงแยก phase + MA) และ pain เขียนดี แต่ narrative ปิดดีลพังแบบเดียวกัน + track record เป็น financial ไม่ใช่ automotive [O]
- ความเสี่ยงใหญ่สุด: จุดแข็งหลักของ X10 คือ Banking/Financial (Top #3 Thailand) — ผิด sector สำหรับ Denso manufacturing และไม่มีประวัติ Denso; ยังพบ template contamination ("Allianz" หลุดใน 3+ หน้า) เป็น red flag คุณภาพ [F หน้า 100/103/104]
- Confidence level: **กลาง-สูง** — text 108k chars อ่านได้เกือบครบ ประเมินจากข้อความ

## 1. Scoring Matrix (17 sections)

| # | Section | Tier | Score | Coverage |
|---|---------|------|-------|----------|
| 1 | 1. Hero Cover | Important | 4 | [F] หน้า 1 — "Denso DNMY Project, 31 Mar 2026" มินิมอล ไม่มี positioning |
| 2 | 2. Agenda | Optional | 4 | [F] หน้า 2 TOC 14 หัวข้อ+เลขหน้า ครบแต่ไม่มี 3-act framing |
| 3 | 3. Client Context | Important | 7 | [F] หน้า 4/6 Problem Statement + Denso Requirements Objective (Inbound/Production/Outbound/Reporting) ยึด operation จริง |
| 4 | 4. Pain Statement | Critical | 8 | [F] หน้า 4 — 6 pains ภาษา operation ชัด (Excel/paper Kanban, overflow parts cost, floor space constrained, manual FIFO) วางก่อน solution |
| 5 | 5. Cost of Inaction | Critical | 3 | [F] pain มี cost implication แต่ไม่มี slide quantified cost/urgency layer แยก |
| 6 | 6. Hero Moat (Track Record) | Critical | 4 | [F] หน้า 8-9 15 ปี/230+ projects/Top #3 Financial Thailand/ISO 29110 วางต้น deck (ดี) แต่ moat หลัก = **Banking/Financial** ผิด sector + ไม่มีประวัติ Denso |
| 7 | 7. Solution Architecture | Important | 8 | [F] หน้า 21/75/77-78 landscape + GCP GKE/Cloud SQL Multi-AZ + tech stack (Vue3/Node20/Python3.12/PostgreSQL15) + หน้า 80 NFR ครบ |
| 8 | 8. Delivery Narrative (3-Wave) | Important | 6 | [F] หน้า 7 DEFINE/DESIGN/BUILD/DEPLOY + หน้า 76 phasing WMS→LES→MES + หน้า 83 waterfall — มี narrative แต่ไม่ใช่ readiness-wave |
| 9 | 9. Master Schedule | Important | 6 | [F] หน้า 109-111 timeline แยก 3 ปี รายเดือน M1-M15 มี signoff milestone แต่เป็น timeline X10 เอง **ไม่มี client milestone overlay** |
| 10 | 10. Commercial Summary & TCO | Critical | 8 | [F] หน้า 124-128 — ราคาจริงครบ: All 39.4M + แยก phase (WMS 15.6M/LES 8.1M/MES 15.6M) + travel + MA 15%/system/ปี + CR 12,000/manday — ครบสุดในสามเจ้า |
| 11 | 11. Differentiation Grid | Important | 2 | [F] มีแค่ "Why X10" bullets (หน้า 8) ไม่ใช่ grid เทียบมิติ |
| 12 | 12. The Ask & Next 30 Days | Critical | 0 | [F] จบที่ commercial offering (หน้า 128) ไม่มี ask/next steps/closing เลย |
| 13 | 13. Named Team & Organization | Important | 3 | [F] หน้า 91-93 org chart + R&R (Denso+X10) เป็น role ล้วน ไม่มีชื่อจริงแม้แต่คนเดียว |
| 14 | 14. Governance Fit | Optional | 6 | [F] หน้า 95/99 PM method 11 ด้าน + governance 3 ชั้น + CR authority — framework ดี แต่เป็น X10's own + **template contamination "Allianz"** (หน้า 100/103) |
| 15 | 15. Quality Management & Risk | Important | 4 | [F] หน้า 96-97 risk/issue methodology ทั่วไป **ไม่มี risk register เฉพาะโปรเจค** (ต่างจาก FPT) + QC ปนใน PM method |
| 16 | 16. Post Go-Live Support (MA) | Optional | 6 | [F] หน้า 121-122 support flow + SLA 4 ระดับ (S1 24x7 1hr/6hr) + หน้า 128 MA annual 15%/system เป็น option; warranty หลัก 3 เดือน |
| 17 | 17. Reference Case | Important | 6 | [F] หน้า 13-19 Financial cases (loan/payment/wealth) + Manufacturing cases (MRP/material receiving/E-PDI); manufacturing relevant มี แต่จุดเน้น financial ไม่ใช่ Denso/warehouse |

## 2. Overall Score Computation

```
Critical ×3:  (8 + 3 + 4 + 8 + 0) = 23  → 23 × 3 = 69
Important ×2: (4 + 7 + 8 + 6 + 6 + 2 + 3 + 4 + 6) = 46 → 46 × 2 = 92
Optional ×1:  (4 + 6 + 6) = 16 → 16 × 1 = 16

Weighted sum = 69 + 92 + 16 = 177
Overall = 177 ÷ 36 = 4.92
```

**4.92 อยู่ในช่วง 4.00–5.99 → Verdict: Weak**

## 3. Strengths (5 ข้อ)

1. [F] **Commercial ครบและโปร่งใสที่สุดในสามเจ้า** — ราคาจริงทั้ง all-project (39.4M) และแยกราย phase + MA annual + CR rate (หน้า 124-128) FPT ไม่มีราคาในเล่มเลย
2. [F] **Pain Statement เขียนเป็นภาษา operation ดีเยี่ยม** — 6 pains ที่ชี้ต้นทุนจริง (overflow warehouse cost, floor space, manual Kanban) วางก่อน solution (หน้า 4)
3. [F] **Business Capabilities ละเอียดที่สุด** — WMS 12 หน้า + LES 4 + MES 11 ระบุ function/feature/benefit ครบทุกโมดูล (หน้า 34-63)
4. [F] **Solution + tech architecture เป็นรูปธรรม** — GCP GKE Multi-AZ, DR (RPO<15min RTO<1hr), NFR 7 ด้าน (หน้า 77-80)
5. [F] **PM methodology มีโครงสร้าง** — 11 ด้าน + governance 3-tier cadence + CR authority matrix (หน้า 95-99)

## 4. Gaps (10 ข้อ เรียงตามความรุนแรง)

1. 🔴 **ไม่มี The Ask & Next 30 Days** — จบที่ตารางราคา ไม่มีแม้แต่ closing slide (anti-pattern #7)
2. 🔴 **Hero Moat ผิด sector** — จุดแข็งคือ Banking/Financial ("Top #3 Financial", "Banking Reconcile systems") ไม่ใช่ automotive manufacturing + ไม่มีประวัติ Denso (anti-pattern #3 บางส่วน)
3. 🔴 **Template contamination** — "Allianz" (บริษัทประกัน ลูกค้ารายอื่น) หลุดใน governance/PM sample หลายหน้า (100/103/104) = สัญญาณ reuse template ไม่ตรวจทาน [F]
4. 🔴 **ไม่มี Cost of Inaction** — ไม่มี urgency/quantified risk (anti-pattern #10)
5. 🟡 **ไม่มี risk register จริง** — มีแต่ methodology ลอย ไม่มีตารางความเสี่ยงเฉพาะโปรเจค (FPT ทำได้ดีกว่ามาก) (anti-pattern #6 บางส่วน)
6. 🟡 **ไม่มี Differentiation Grid** — Why X10 เป็น bullet ไม่ใช่ decision grid
7. 🟡 **Named team ไม่มีชื่อจริง** — role ล้วน ไม่มี escalation contact ด้วยซ้ำ (anti-pattern #9)
8. 🟡 **Master Schedule ไม่มี client milestone** — timeline X10 ล้วน ไม่ overlay DNMY events (anti-pattern #5)
9. 🟢 **Governance ไม่อิง Denso Dev Policy** — เป็น X10 methodology
10. 🟢 **Sample UI/deliverable ระบุ "ILLUSTRATIVE" จำนวนมาก** — หน้า 103-107 เป็น template ทั่วไปไม่เจาะจง DNMY

## 5. Anti-Pattern Audit (11 ข้อ)

| # | Anti-pattern | ผล | หลักฐาน |
|---|---|---|---|
| 1 | Why Us ก่อน Pain | ✅ PASS | Problem Statement (หน้า 4) มาก่อน Why X10 (หน้า 8) |
| 2 | Track record ซ่อน appendix | ✅ PASS | Why X10 อยู่ต้น deck (แต่ผิด sector) |
| 3 | Reference ไม่ตรงอุตสาหกรรม | ⚠️ PARTIAL | มี manufacturing แต่จุดเน้น financial; ไม่มี Denso/automotive โดยตรง |
| 4 | Pain ภาษา system | ✅ PASS | หน้า 4 ภาษา operation ชัด |
| 5 | Schedule ไม่มี client milestone | ❌ FAIL | หน้า 109-111 timeline X10 ล้วน |
| 6 | QM ผสมใน procedure | ⚠️ PARTIAL | QM/risk เป็น methodology ไม่มี register แยก |
| 7 | ปิดด้วย Thank You ไม่มี Ask | ❌ FAIL | จบที่ตารางราคา ไม่มี ask |
| 8 | Pricing เลขเดียว/ไม่มี | ✅ PASS | ราคาแยก phase + line items ครบสุด |
| 9 | Named team = TBD | ❌ FAIL | role ล้วน ไม่มีชื่อจริง |
| 10 | Pain ไม่ผูก Cost of Inaction | ❌ FAIL | ไม่มี urgency layer |
| 11 | Slide ล้นเกิน | ⚠️ PARTIAL | 130 หน้า มี UI sample 8 หน้า + ILLUSTRATIVE เยอะที่เจือจาง |

**สรุป: FAIL 4, PARTIAL 3, PASS 4**

## 6. Recommendations

### Critical — ต้องแก้ก่อน submit
1. **แก้ template contamination "Allianz" ทันที** — เป็น red flag ที่ทำลายความน่าเชื่อถือทั้งเล่มต่อสายตา C-Level (slide_ref: หน้า 100/103/104)
2. **เพิ่ม The Ask & Next 30 Days** ปิดท้าย (slide_ref: หลังหน้า 128)
3. **ยก manufacturing/automotive reference ขึ้นแทน financial ใน Hero Moat** — จุดขาย Banking ผิด audience (slide_ref: หน้า 8, 15-19)
4. **เพิ่ม Cost of Inaction** quantify (slide_ref: หลังหน้า 4)

### Important — ควรแก้
5. เพิ่ม risk register จริงเฉพาะโปรเจค (slide_ref: หน้า 96)
6. เพิ่ม Differentiation Grid (slide_ref: หน้า 8)
7. ใส่ชื่อทีมจริง ≥5 บทบาท (slide_ref: หน้า 91)
8. Overlay client milestone บน timeline (slide_ref: หน้า 109-111)

### Optional
9. Map governance เข้ากับ Denso Dev Policy
10. แทน ILLUSTRATIVE sample ด้วยตัวอย่างที่เจาะจง DNMY

## 7. Recommended Skeleton
17-section backbone เดียวกัน (client=DNMY, vendor=X10) — จุดต้องเติม: The Ask, Cost of Inaction, Hero Moat เฉพาะ manufacturing, risk register, differentiation grid; จุดแข็งที่คงไว้: commercial breakdown, pain, business capabilities

## Closing
- **Confidence level: กลาง-สูง** — text 108k chars อ่านได้เกือบครบ
- **Limitations:** (1) ไม่ได้ดู layout ภาพหน้า UI sample/architecture (2) proposal ลงวันที่ 31 Mar 2026 อาจไม่ใช่เวอร์ชันสุดท้าย (3) ประเมินจากเอกสาร ไม่มีข้อมูลผลดีลจริง
- **[TBD]:** ชื่อทีมจริง, cost of inaction figures, ผลดีลจริง
