# GTM-ProposalAudit — Playbook
เอกสารสรุปโปรเจคทั้งหมด (knowledge base สำหรับ NotebookLM)
ปรับปรุงล่าสุด: 2026-07-17 | เจ้าของ: Boss (CSI Groups)

---

## 0. สรุปผู้บริหาร (Executive Summary)

โปรเจค GTM (Go-To-Market) ของ CSI Groups ประกอบด้วย **2 ระบบย่อยที่แยกกันชัดเจน** แต่อยู่ใน repo เดียวกัน:

| ส่วน | ชื่อ | หน้าที่ | LLM ที่ใช้ | สถานะ |
|------|------|--------|-----------|-------|
| **A** | GTM Discovery RAG | คัดกรองดีล (deal qualification) + จับคู่ pain กับ solution + ออกแบบ solution เบื้องต้น | Claude Sonnet (claude-sonnet-4-6) | prototype (CLI/local) |
| **B** | Proposal Evaluator (Proposal Audit Agent) | ตรวจสอบคุณภาพ (audit) proposal B2B ด้วย rubric ให้คะแนนแบบทำซ้ำได้ + Proposal Library + Dashboard | Azure OpenAI (gpt-5.4-mini) | deploy production บน Azure |

**แก่นของโปรเจค:** เปลี่ยนงาน pre-sales ที่เดิมใช้วิจารณญาณคน (subjective) ให้เป็น **กระบวนการที่วัดได้และทำซ้ำได้** (deterministic + auditable) ตั้งแต่คัดกรองดีล → ออกแบบ solution → ตรวจคุณภาพ proposal ก่อนยื่นลูกค้า

**ชื่อ NotebookLM:** GTM-ProposalAudit

---

## 1. บริบทและที่มา (Context & Origin)

- โปรเจคเริ่มจาก Boss ติดตั้ง global skill `proposal-master` + `sa-skill` แล้วต้องการสร้าง web app ประเมิน proposal จริง
- ผ่านกระบวนการ SA (System Analyst) ด้วย sa-skill 4 phase ก่อนเขียนโค้ด (Requirements → As-Is/To-Be → System Design → Scope/Handoff)
- เป้าหมายเชิงธุรกิจ: ยกระดับคุณภาพ proposal ของ CSI ให้แข่งขันได้ + สร้างคลังความรู้ (proposal library) ที่ค้นได้ทั้งองค์กร

---

## 2. ส่วน A — GTM Discovery RAG

ระบบ 3 agent ทำงานต่อเนื่องเป็นสายพาน (pipeline) รับข้อมูลดีล แล้วประเมินทีละขั้น ทุก agent เรียก Claude Sonnet และคืนผลเป็น JSON

### 2.1 สถาปัตยกรรม pipeline

```
Deal Context (ข้อความบรรยายดีล)
  → [1] Scoring Agent   → BANTi-F³ score + Go/No-Go + Tier
  → [2] Discovery Agent → จับคู่ pain กับ solution (Fit Level)
  → [3] Solution Shaping Agent → ออกแบบ module/function + F³ + risk + Go/No-Go
```

ไฟล์: `scoring_agent.py`, `discovery_agent.py`, `solution_shaping_agent.py`, `app.py` (UI ~52KB), knowledge base `solution_master.md`

### 2.2 Scoring Agent — กรอบ BANTi-F³

**BANTi (เต็ม 100 คะแนน)** — วัดความพร้อมของดีล:
| มิติ | เต็ม | เกณฑ์เต็ม |
|------|-----|----------|
| Budget | 20 | ระบุงบชัด / มี PO / budget code |
| Authority | 20 | คุยกับ C-Level / VP / เจ้าของโดยตรง |
| Need | 20 | ระบุ pain ชัด + business impact เป็นตัวเลข |
| Timing | 20 | ต้องการ go-live ภายใน 90 วัน |
| Interest | 20 | มี internal champion ที่ push จริง |

**F³ (เต็ม 15 คะแนน, มิติละ 5)** — วัดความน่าชนะ:
- Solution Fit — standard product ตอบ requirement ได้ 80%+
- Competitive Force — เราถูก shortlist เดี่ยว หรือคู่แข่งอ่อน
- Execution Feasibility — ทีม/resource/timeline พร้อมส่งมอบ

**กฎการตัดสิน (Decision Rules):**
- **Go** ถ้า BANTi ≥ 60
- **Tier 1** (F³ < 8) → Template propose
- **Tier 2** (F³ 8-11) → Story-driven proposal
- **Tier 3** (F³ 12-15) → Strategic C-level consulting

### 2.3 Discovery Agent — จับคู่ Pain กับ Solution

รับผล scoring + deal context แล้ว map เข้ากับ `solution_master.md` คืน Fit Level:
- **Full Fit** — customize < 20%
- **Partial Fit** — customize 20-50%
- **Full Custom** — นอกขอบเขต solution (> 50%)

next_step: "Proceed to Solution Shaping" / "Need More Info" / "No Fit"

### 2.4 Solution Shaping Agent — ออกแบบ solution

แตก solution เป็น module → function list โดยจัดประเภทแต่ละ function:
- **Standard** — มีใน product ทันที
- **Custom** — ต้อง develop/configure เพิ่ม
- **Integration** — ต้องเชื่อมระบบภายนอก

คำนวณ `customization_ratio = (custom + integration) / total × 100`

**Go/No-Go gate (Solution Fit / PPS):** Go ถ้า solution_fit ≥ 3 **และ** feasibility ≥ 3; No-Go ถ้า ratio > 60% (Full Custom เป็นส่วนใหญ่)

### 2.5 solution_master.md — Knowledge Base (18 solutions)

ครอบคลุม 18 โซลูชันของ CSI จัดตาม category:

| # | Solution | Category |
|---|----------|----------|
| 1-2 | Advance Planning, Production Planning | Software Platform (โรงงาน) |
| 3-4 | Traceability, WMS | Software Platform (supply chain) |
| 5 | HRM | Software Platform |
| 6-7 | Auto Loan, Personal Loan | Financial Technology |
| 8 | IoT / Sensor | IoT |
| 9-11 | BI, Data Analytics, Big Data | Analytics / Data Infra |
| 12-13 | OEE Dashboard, Operation Dashboard | Manufacturing Analytics / Visibility |
| 14-15 | Operation Consultant, DX Consultant | Consulting Service |
| 16-18 | Accounting, Purchasing, Electronic TAX | Software Platform |

แต่ละ solution มีโครงเดียวกัน: Capabilities / Pain ที่แก้ได้ / Standard Features / Customization Triggers / ขอบเขตที่ทำไม่ได้ / Difficulty Matrix (Easy 1-3 เดือน / Medium 3-6 / Hard 6-12)

---

## 3. ส่วน B — Proposal Evaluator (Proposal Audit Agent)

Web app ให้ทีม engineer/sales upload proposal (PDF/PPTX) → ได้คะแนน + จุดแข็ง + ช่องว่าง (gap) + skeleton แนะนำ; ผู้ส่งตัดสินใจ accept หรือปรับปรุงแล้ว resubmit; เก็บคะแนนเพื่อวิเคราะห์ trend

### 3.1 สถาปัตยกรรม (Azure ทั้งหมด)

| ชั้น | เทคโนโลยี |
|------|----------|
| LLM | **Azure OpenAI (gpt-5.4-mini)** — ไม่ใช้ Claude (Boss สั่งชัดเจน); gpt-4o deprecated ก.ค.2026 |
| Backend | Azure Functions (Python, Consumption/serverless) |
| Database | Azure SQL (Basic tier) |
| Frontend | React + Vite + TypeScript → Azure Static Web Apps |
| Auth | Entra ID SSO (single-tenant, @csigroups.com) |
| ไฟล์ต้นฉบับ | Azure Blob Storage (container `proposals`, private, SAS 4 ชม.) |
| Text extraction | Azure AI Document Intelligence + OCR fallback |
| Volume | 20-50 proposal/เดือน |

### 3.2 Evaluation pipeline (F03 → F13)

```
upload PDF/PPTX
  → validate format/size (F03)
  → store original ใน Blob (F04)
  → create submission + version (F05)
  → extract text (Doc Intelligence + OCR) (F06/F07)
  → build proposal-master prompt (F08)
  → call Azure OpenAI JSON mode, temp 0.2 (F09)
  → parse + validate Pydantic (F10)
  → คำนวณ weighted score ในโค้ด (F11) ← deterministic, ไม่ให้ GPT คำนวณ
  → map verdict (F12)
  → persist SQL + render report (F13)
```

**หลักการสำคัญ:** GPT ให้คะแนนรายมิติเท่านั้น (1-10 ต่อ section) — **การถ่วงน้ำหนักและคำนวณคะแนนรวมทำใน `scoring.py`** เพื่อให้ผลทำซ้ำได้ (deterministic) ไม่แกว่งตาม LLM

### 3.3 ฟีเจอร์หลักที่ deploy แล้ว

- **Auto-detect client/project** จาก proposal (LLM, F20) → popup ยืนยัน/แก้
- **Ticket running** `PE-YYYY-NNNNN` (SQL SEQUENCE, ไม่ reset, 1/project)
- **Content-hash cache** (F24) — เนื้อหาเดิม + ภาษาเดิม → reuse คะแนนเดิม 100% (cache key = content_hash + lang)
- **Improvement-gate** (F25) — เนื้อหาเปลี่ยนแต่ไม่แก้ตามคำแนะนำ → reuse; แก้แล้ว → re-eval
- **User comments** (F26) + **history view** ทุก version
- **เลือกภาษา output** (ไทย/อังกฤษ) ที่ confirm modal (default ไทย); section labels/tier/verdict คงเป็น EN (enum)
- **Open Latest Proposal** — เปิดไฟล์ต้นฉบับผ่าน SAS URL
- **Proposal Library** (module ใหม่) — มุมมอง project content (Price/Cost/Schedule/Manpower/Deal Outcome); GPT auto-extract + คนยืนยัน (F30-F41)
- **Auditor Dashboard** — KPI 5 tiles + verdict donut + ScoreWinTrend (กราฟเส้น 2 แกน score/win-rate) + action lists
- **Entra SSO** — App Registration `proposal-evaluator-sso`, single-tenant

### 3.4 UI/Branding

- นำเข้าจาก Claude Design UI Kit (DesignSync MCP) → implement เป็น React จริง
- Theme: light+dark tokens, primary #1d4ed8, font Inter + IBM Plex Sans Thai
- Layout: sidebar (dark gradient) + topbar + dark-mode toggle + circular gauge + tabs + trend chart
- Branding: "CSI Groups" / sub "COS Solution Audit" / app title "Proposal Audit Agent"
- Nav 3 เมนู: **Evaluation Resulted** (เดิม Proposals) · **Proposal Library** · **Auditor Dashboard** · **Settings** + ปุ่ม New Evaluation

---

## 4. Rubric — หัวใจของ Audit Engine (เวอร์ชันปัจจุบัน v7)

Rubric คือเกณฑ์ให้คะแนน proposal ที่ใช้ทั้งใน web app และ skill `proposal-master` (sync กันเสมอ)

### 4.1 โครงสร้าง 17 canonical sections + 3 tier

**สูตรคำนวณ (deterministic, v7):**
- ตัวคูณตาม tier: **Critical ×4 / Important ×3 / Optional ×1**
- ตัวหารคงที่: **48**
- **Calibration offset +1.5** ที่ overall: `overall = min(10, raw + 1.5)`
- Verdict: **Strong ≥ 7 / Adequate ≥ 5 / Weak ≥ 3.5 / Critical (ต่ำกว่า)**
  - ⚠️ ระวังสับสน: tier "Critical" = สำคัญมาก; verdict "Critical" = คะแนนแย่ (คนละความหมาย คนละ column)

**Tier assignment (v5-v7):**
| Tier | จำนวน | Sections |
|------|-------|----------|
| **Critical (5)** | ×4 | Pain(4), Hero Moat(6), Solution Architecture(7), Delivery Narrative(8), Master Schedule(9) |
| **Important (8)** | ×3 | Hero Cover(1), Client Context(3), Cost of Inaction(5), Commercial(10), Governance Fit(14), QM & Risk(15), MA(16), Reference(17) |
| **Optional (4)** | ×1 | Agenda(2), Differentiation(11), The Ask(12), Named Team(13) |

**ปรัชญา tier:** Critical = "ความสามารถส่งมอบจริง" (เน้น implementation trio: Solution Architecture + Delivery + Master Schedule); Governance/MA ยกเป็น Important เพราะ long-term partnership fit สไตล์ Japanese OEM

### 4.2 Anchored rubric

13 sections ที่เป็น Critical + Important มี **เกณฑ์ย่อยรายระดับคะแนน** (8-10 / 5-7 / 1-4) เพื่อลดความแกว่งของ LLM (variance) + audit ย้อนได้ว่าทำไมได้คะแนนนั้น (Optional 4 ตัวใช้ scale ทั่วไป)

### 4.3 Calibration offset +1.5 — ที่มา

- มาจาก **expert anchor ของ Boss**: Boss ให้ FPT 7-8 / X10 6.5-7.5 / CSI 6-7 เทียบกับ engine raw v6 (5.96/5.60/5.33) → gap คงที่ ~1.3-1.5 อย่างเป็นระบบ, ranking ตรงกัน
- Boss สั่ง: "เห็นด้วยกับ LLM แค่อยากให้คะแนนสูงขึ้น +1.5"
- ผล v7: CSI 6.83 / FPT 7.46 / X10 7.10 — ตรงช่วงที่ Boss คาดทั้ง 3
- **section scores + ranking ไม่แตะ** — offset ที่ overall จุดเดียว
- ⚠️ **ความเสี่ยง:** flat offset สมมติ bias คงที่ทั้ง scale แต่ anchor มีแค่ช่วง 5.3-6.0 — ปลายบน/ล่างยังไม่ยืนยัน; proposal แย่จริงจะได้ +1.5 เมตตาด้วย

### 4.4 ประวัติวิวัฒนาการ rubric (v1 → v7, ทั้งหมดปรับ 2026-07-17)

| Ver | การเปลี่ยนแปลงหลัก | ตัวหาร | Threshold |
|-----|-------------------|-------|-----------|
| v1 | baseline | 36 | 8/6/4 |
| v2 | Solution Architecture → Critical + เกณฑ์ย่อย technical 5 มิติ | 37 | 7/5/3.5 |
| v3 | + implementation trio (Delivery + Master Schedule) → Critical | 39 | 7/5/3.5 |
| v4 | ลด CoI/Commercial/The Ask → Important; Differentiation/Named Team → Optional | 34 | 7/5/3.5 |
| v5 | The Ask → Optional; Governance/MA → Important | 35 | 7/5/3.5 |
| v6 | ตัวคูณ 3/2/1 → **4/3/1** | 48 | 7/5/3.5 |
| **v7** | + **calibration offset +1.5** + **anchored rubric 13 sections** | 48 | 7/5/3.5 |

⚠️ **ปรับ rubric 7 รอบใน 1 วัน อิงตัวอย่างชุดเดียว = overfit ชัดเจน** — ทางเดียวที่หลุด loop คือรู้ผลดีลจริง (ground truth) แล้ว calibrate ให้ทำนายผู้ชนะ

### 4.5 การวัดความสม่ำเสมอ (variance test, 2026-07-17)

รัน FPT proposal เดียวกัน 5 ครั้ง (thread แยก, temp 0.2):
- **overall นิ่งดีมาก** — mean 7.48, SD 0.116, verdict Strong 5/5 (100% stable)
- 6 section นิ่งสนิท (spread 0) — ล้วนมี anchor ชัด → anchored rubric ได้ผล
- Critical ทั้ง 5 แกว่งน้อยมาก → overall เชื่อถือได้เพราะ Critical น้ำหนัก ×4 นิ่ง
- section ที่แกว่ง ≥ 2 เป็น Optional (ไม่มี anchor) น้ำหนักต่ำ กระทบ overall น้อย
- **residual risk:** proposal ที่คะแนน borderline (ใกล้ 5.0/7.0) spread 0.31 อาจเด้งข้าม boundary

---

## 5. DNMY Back-test Set — ชุด validate engine

ชุดทดสอบที่มีค่าที่สุด: **proposal จริง 3 เจ้าแข่งดีลเดียวกันเป๊ะ** — Denso Malaysia (DNMY), WMS+LES+MES, phased go-live WMS 2027/LES 2028/MES 2029

| Vendor | v1 | v4 | รายงาน |
|--------|-----|-----|--------|
| **FPT Software** (เวียดนาม) | 5.17 Weak | 5.74 Adeq | proposal-audit-FPT-DNMY-20260717.md |
| **X10 / Extend IT** (ไทย) | 4.92 Weak | 5.32 Adeq | proposal-audit-X10-DNMY-20260717.md |
| **CSI Thailand** (เจ้าบ้าน) | 4.33 Weak | 4.88 Weak | proposal-audit-DNMY-20260716.md |

**ราคา:** CSI 38.6M + MA 3.71M/ปี×3 (~49.7M) | X10 39.4M + MA 15%/system/ปี | FPT ไม่ระบุ

### 5.1 ผลเชิง validity (ตอบคำถาม "engine ดีพอไหม")

- ✅ **Discriminant validity ผ่าน** — จัดอันดับ 3 เจ้าต่อเนื่อง (FPT>X10>CSI) ไม่ให้เท่ากัน อธิบายได้ทีละ section
- ❌ **Predictive validity ยังไม่รู้** — ไม่ทราบผลดีลจริงว่าใครชนะ (**ground truth ที่ยังขาด — งานสำคัญที่สุด**)
- ⚠️ **Calibration น่าสงสัย** — 3 SI มืออาชีพในดีล ~39M ได้ Weak หมด → threshold อาจเข้มเกินไปสำหรับ "technical delivery bid"
- 🔑 **Paradox สำคัญ** — CSI เป็น incumbent (28 Denso projects) แต่ได้คะแนนต่ำสุด เพราะ engine ลงโทษ "การจัดวาง narrative" ไม่ใช่ "ศักยภาพชนะ"; engine อ่านแค่สิ่งที่เขียนบนกระดาษ จับ "ทุนความสัมพันธ์นอกเอกสาร" ไม่ได้
- 👁️ **จุดที่ต้องมีคนตรวจ** — X10 มี template contamination ("Allianz" หลุดหลายหน้า) = red flag คุณภาพที่ human จับได้ แต่ engine ไม่ flag อัตโนมัติ

### 5.2 ข้อสรุปการใช้งาน engine

เชื่อได้เชิง **เปรียบเทียบ** (เรา vs คู่แข่งดีลเดียวกัน) + เชิง **วินิจฉัย** (section ไหนขาด); **ยังไม่ควรใช้เป็นเกรดสัมบูรณ์/go-no-go** จนกว่าจะมี ground truth มา calibrate

**Pattern ร่วมของ SI ในตลาดนี้:** ทั้ง 3 เจ้าพังเหมือนกันที่ The Ask (0 ทุกเจ้า) + ไม่มี Cost of Inaction + Differentiation อ่อน

---

## 6. Deployment — Azure Production

**Subscription:** "Azure Credit - ITPC TUM" | **RG:** `rg-proposal-evaluator` (southeastasia; SWA ที่ eastasia) | **prefix:** `propeval-lupxx-*`

| Resource | Endpoint / ชื่อ |
|----------|----------------|
| Function API | https://propeval-lupxx-func.azurewebsites.net |
| Frontend SWA | https://green-stone-0ae1ea500.7.azurestaticapps.net |
| SQL | propeval-lupxx-sql (6 tables + ProposalContent 28 col) |
| Model | gpt-5.4-mini, api-version 2025-04-01-preview, GlobalStandard @ eastus |

**Frontend↔Backend wiring:** SWA Standard tier + linked backend → SPA เรียก `/api` relative, SWA proxy same-origin (ไม่ต้อง key, ไม่มี CORS). Functions เป็น ANONYMOUS (SWA เป็น security boundary — เรียก function ตรงๆ ถูก block HTTP 400)

### 6.1 Deploy gotchas (บทเรียน)

- **Function deploy:** ต้องใช้ `func azure functionapp publish propeval-lupxx-func --build remote --python` — **ต้องมี `--python`** ไม่งั้น error "worker runtime None"; config-zip index functions ไม่ได้
- **func publish exit 255** = แค่ warning python 3.13 local vs 3.11 Azure, remote build สำเร็จจริง (verify จาก endpoint)
- **SWA deploy รอบแรกอาจ upload JS asset ไม่ครบ** (index.html ขึ้นแต่ .js 404 → SPA blank) → re-deploy ซ้ำ
- **verify ต้องผ่าน SWA URL เสมอ** ไม่ใช่เรียก function ตรง
- **SQL live (non-interactive):** เครื่องนี้ไม่มี ODBC Driver 17/18 + ไม่มี sqlcmd → ใช้ `mssql-python` (pip, driver ฝังในตัว) + AAD token จาก `az account get-access-token --resource https://database.windows.net/` ผ่าน `attrs_before={1256: token_struct}`
- **SQL firewall:** IP client เปลี่ยนได้ (ISP) → login error ให้ `az sql server firewall-rule create` เพิ่ม IP
- **az ไม่อยู่บน PATH** shell ใหม่ → full path `C:\Program Files\Microsoft SDKs\Azure\CLI2\wbin`

---

## 7. Skills ที่เกี่ยวข้อง

ติดตั้งที่ `C:\Users\rungroj\.claude\skills\`:

- **proposal-master** — **= audit engine ที่เขียนเอง** (Boss เปลี่ยนชื่อจาก `proposal-audit-engine`, ลบต้นฉบับทิ้ง). audit-only (ให้คะแนน/ตรวจ ไม่สร้าง deck). mirror ของ engine ใน web app: 17 sections + tier + สูตร v7 + anchored rubric + 11 anti-patterns. **sync กับ `rubric.py` + `scoring.py` + `proposal_master_system.md` เสมอ**
- **sa-skill** — Senior Systems Analyst; รัน 4-phase ก่อน vibe code

---

## 8. Backlog / หนี้ทางเทคนิค (Technical Debt)

### 8.1 ด่วน — Security
- 🔴 **API key hardcode** — `discovery_agent.py:9`, `scoring_agent.py:9`, `solution_shaping_agent.py:9` มี Anthropic API key เขียนตรงในโค้ด (`sk-ant-api03-...`) และ commit เข้า git แล้ว → **ควร revoke key + ย้ายไป `.env`/env var ทันที** (ความเชื่อมั่น: สูง)
- key ของ web app อยู่ใน appSettings → ควรย้าย Key Vault

### 8.2 สำคัญ — Validity
- 🎯 **หา ground truth ผลดีล DNMY** (ใครชนะจริง CSI/FPT/X10) มา calibrate rubric — ทางเดียวที่หลุดจาก overfit loop หลังปรับ 7 รอบ
- เพิ่มมิติ incumbent/relationship (engine จับทุนความสัมพันธ์นอกเอกสารไม่ได้)
- auto-flag template contamination (เช่น "Allianz" หลุดใน X10)

### 8.3 ค้าง — Feature/Ops
- **M3 SharePoint sync** — รอ M365 admin (app registration + Sites.Selected consent + Entra group)
- คนเข้า Proposal Library เติม Price/Cost + Save & Verify (ทั้ง 9 ยัง pending_verify) + update Deal Outcome
- **git commit** — โค้ดทั้งหมดยังไม่ commit
- **auth F01/F02** — owner_id nullable ชั่วคราว, Entra SSO ทำแล้วแต่ owner mapping ยัง placeholder
- custom domain csigroups.com — รอ IT เพิ่ม CNAME (DNS zone อยู่คนละ subscription)
- เปิด blob soft delete (90 วัน) + versioning (โค้ดใช้ overwrite=True)
- หนี้เล็ก: blob upload ไม่ set content-type → เปิดลิงก์ browser download แทน preview inline

---

## 9. Lessons Learned (บทเรียนสำคัญ)

1. **แยกงาน LLM ออกจากงานคำนวณ** — ให้ LLM ตัดสินเชิงคุณภาพ (score รายมิติ), คำนวณ/ถ่วงน้ำหนักในโค้ด → ผลทำซ้ำได้ (deterministic)
2. **Anchored rubric ลด variance ได้จริง** — section ที่มีเกณฑ์ย่อยรายระดับคะแนน แกว่งน้อยกว่า section ที่ไม่มี anchor อย่างชัดเจน
3. **Overfit เป็นความเสี่ยงจริง** — ปรับ rubric 7 รอบจากตัวอย่าง 3 ฉบับใน 1 วัน โดยไม่มี ground truth = ขยับเส้นให้สบายใจ ไม่ใช่ปรับให้ทำนายแม่น
4. **Calibration ต้องมี anchor จากคน** — expert anchor ของ Boss ทำให้คะแนนตรงกับสัญชาตญาณผู้เชี่ยวชาญ แต่ยังต้องระวัง flat offset ที่ปลาย scale
5. **Engine เก่งเชิงเปรียบเทียบ/วินิจฉัย ไม่ใช่เกรดสัมบูรณ์** — เหมาะใช้เทียบเรา vs คู่แข่ง + หา section ที่ขาด มากกว่าตัดสิน go/no-go
6. **Human-in-the-loop ยังจำเป็น** — red flag คุณภาพบางอย่าง (template contamination, ทุนความสัมพันธ์) engine จับไม่ได้
