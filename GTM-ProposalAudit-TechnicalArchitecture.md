# GTM-ProposalAudit — Technical & Infrastructure Architecture

เอกสารเทคนิคเชิงลึก (technical deep-dive) สำหรับ knowledge base NotebookLM
ปรับปรุงล่าสุด: 2026-07-21 | เจ้าของ: Boss (CSI Groups)
ที่มา: ดึงจากซอร์สโค้ดจริงใน repo (`proposal-evaluator/`) — เอกสารนี้เน้น infra + architecture + data model + API เสริมจาก `GTM-ProposalAudit-Playbook.md`

หมายเหตุความเชื่อมั่น: ส่วนที่เป็นข้อเท็จจริงจากโค้ด (fact จากไฟล์) ระบุ path กำกับ; ส่วนที่อาจ drift ระหว่าง bicep default กับ resource ที่ deploy จริง จะ flag ไว้

---

## 1. ภาพรวมสถาปัตยกรรมระบบ (System Architecture Overview)

repo GTM มี **2 ระบบแยกกันสิ้นเชิง** — คนละ LLM คนละ deploy target:

| | ส่วน A — GTM Discovery RAG | ส่วน B — Proposal Evaluator |
|---|---|---|
| หน้าที่ | คัดกรองดีล (deal qualification) + จับคู่ solution | ตรวจคุณภาพ (audit) proposal ให้คะแนนทำซ้ำได้ |
| LLM | Claude Sonnet (`claude-sonnet-4-6`) | Azure OpenAI (gpt-5.x) |
| รูปแบบ | prototype CLI/local (Python) | Azure cloud web app (production) |
| ที่อยู่ใน repo | root folder | `proposal-evaluator/` |
| Deploy | ยังไม่ deploy (รันเครื่อง local) | deploy จริงบน Azure |

**หลักการออกแบบร่วม:** แยกงาน "ตัดสินเชิงคุณภาพ" (LLM) ออกจากงาน "คำนวณ/ถ่วงน้ำหนัก" (โค้ด) → ผลลัพธ์ทำซ้ำได้ (deterministic) และ audit ย้อนได้

---

## 2. ส่วน B — Proposal Evaluator: Cloud Architecture

### 2.1 แผนผังระดับสูง (high-level topology)

```
Browser (ผู้ใช้ @csigroups.com)
  │  HTTPS + Entra ID SSO
  ▼
Azure Static Web App (Standard tier, region eastasia)
  │  - โฮสต์ React SPA (build จาก Vite)
  │  - เป็น security boundary (auth + route protection)
  │  - proxy /api/* → linked backend (same-origin, ไม่มี CORS, ไม่ต้อง key)
  │  - ส่ง header x-ms-client-principal (base64 JSON) ไป backend
  ▼
Azure Functions (Python 3.11, Consumption/Y1 Dynamic, Linux)
  │  auth_level = ANONYMOUS (SWA เป็นด่านความปลอดภัย)
  ├──► Azure Blob Storage (container `proposals`, private, SAS 4 ชม.)
  ├──► Azure AI Document Intelligence (FormRecognizer S0) — extract text + OCR
  ├──► Azure OpenAI (S0, region eastus) — audit JSON mode
  └──► Azure SQL Database (Basic tier) — auth ผ่าน Managed Identity (MSI)
  │
Application Insights (telemetry ทั้ง Function App)
```

### 2.2 ตารางทรัพยากร Azure (จาก `infra/main.bicep`)

Resource prefix = `{baseName}-{suffix}` โดย `baseName='propeval'`, `suffix = substring(uniqueString(rg.id),0,5)` (deploy จริง = `lupxx`)

| Resource | ประเภท / API ver | SKU / Tier | Region | หมายเหตุ |
|----------|------------------|-----------|--------|---------|
| Storage Account | `Microsoft.Storage@2023-01-01` StorageV2 | Standard_LRS | RG location | `allowBlobPublicAccess:false`, TLS1.2, HTTPS-only; เก็บ Functions runtime + container `proposals` |
| Application Insights | `Microsoft.Insights/components@2020-02-02` | web | RG location | telemetry |
| Azure OpenAI | `Microsoft.CognitiveServices/accounts@2024-10-01` kind OpenAI | S0 | **eastus** | `customSubDomainName`, publicNetworkAccess Enabled |
| Model deployment | `.../deployments@2024-10-01` | GlobalStandard, capacity 50 (K TPM) | eastus | ⚠️ bicep default = `gpt-5.5` (v `2026-04-24`); resource ที่ deploy จริงต่างจาก default — ดู §2.4 |
| Document Intelligence | `CognitiveServices/accounts` kind FormRecognizer | S0 | RG location | text extract + OCR fallback |
| SQL Server | `Microsoft.Sql/servers@2023-08-01-preview` | — | RG location | **Entra-only auth** (`azureADOnlyAuthentication:true`), TLS1.2 min |
| SQL Database | `.../databases` | **Basic** | RG location | ชื่อ DB `proposal_evaluator` |
| SQL firewall rule | `.../firewallRules` | — | — | `AllowAzureServices` (0.0.0.0-0.0.0.0) ให้ Function เข้าถึง |
| App Service Plan | `Microsoft.Web/serverfarms@2023-12-01` | **Y1 Dynamic** (Consumption) | RG location | `reserved:true` (Linux) |
| Function App | `Microsoft.Web/sites` kind `functionapp,linux` | — | RG location | `linuxFxVersion:Python\|3.11`, SystemAssigned MI, httpsOnly, FTPS disabled |
| Static Web App | `Microsoft.Web/staticSites` | **Standard** | **eastasia** | Standard จำเป็นสำหรับ linked backend (bring-your-own Function App) |

**Deploy จริง (จาก memory, 2026-07-16→21):**
- Subscription: "Azure Credit - ITPC TUM" | RG: `rg-proposal-evaluator` (southeastasia; SWA ที่ eastasia)
- Function API: `https://propeval-lupxx-func.azurewebsites.net`
- Frontend SWA: `https://green-stone-0ae1ea500.7.azurestaticapps.net`
- SQL: `propeval-lupxx-sql`

### 2.3 Authentication & Authorization model (3 ชั้น)

**ชั้น 1 — Identity (Entra ID SSO):**
- App Registration `proposal-evaluator-sso` (client id `1287e210-caf8-48ce-9cf6-ab50c58ea5b1`), single-tenant → ใครมี `@csigroups.com` เข้าได้
- tenant `d13bbbeb-78ed-4ce0-a599-480197b496ce`
- ตั้งค่าใน SWA app settings: `AAD_CLIENT_ID` / `AAD_CLIENT_SECRET` (secret อายุ 2 ปี)
- `staticwebapp.config.json` (frontend/public/): provider azureActiveDirectory, บังคับ `allowedRoles:["authenticated"]` บน `/api/*` + `/*`, responseOverrides 401 → `/login`
- **สถานะ:** DEPLOYED + verified live (2026-07-21) — เปิด production URL โดยไม่ login → redirect ไป `login.microsoftonline.com`

**ชั้น 2 — Resource-to-resource auth (จาก bicep):**
| ปลายทาง | วิธี auth |
|---------|----------|
| Azure SQL | **Managed Identity** (`Authentication=ActiveDirectoryMsi` ใน SQL_CONNECTION_STRING, ODBC Driver 18) |
| OpenAI / DocIntel / Blob | **key-based** ผ่าน Function App appSettings (`AZURE_OPENAI_KEY`, `DOCINTEL_KEY`, `BLOB_CONNECTION_STRING` มี AccountKey) |

⚠️ Hardening ที่ยังไม่ทำ: ย้าย key ทั้งหมดไป Key Vault + reference (ระบุใน comment หัวไฟล์ bicep + backlog)

**ชั้น 3 — RBAC (application-level, จาก `api/shared/auth.py`):**
- SWA ส่ง `x-ms-client-principal` (base64 JSON) → `parse_principal()` ดึง email/oid
- role สะสม hierarchical: `user(1) < manager(2) < management(3) < admin(4)` (`ROLE_RANK`)
- Page gate (`PAGE_MIN_ROLE`): evaluate=user, proposals=user (เห็นเฉพาะ own via owner_id), library=manager, dashboard=management, settings=admin
- ไม่มี principal = role `guest` (rank 0, authenticated=False) → frontend เด้ง `/login`
- `AUTH_DEV_MODE=1` env = จำลอง admin สำหรับ local dev เท่านั้น (prod ห้ามตั้ง)
- login ครั้งแรก `db.get_or_create_user` สร้าง role `user` เสมอ → admin เลื่อน role ผ่าน Settings
- bootstrap admin: `rungroj@csigroups.com` (Boss)

### 2.4 โมเดล LLM ที่ใช้ (สถานะ + discrepancy)

- **bicep default (ในโค้ดปัจจุบัน):** `gpt-5.5`, version `2026-04-24`, SKU GlobalStandard, capacity 50K TPM
- **deployed จริง (memory 2026-07-16):** `gpt-5.4-mini` (เพราะ gpt-4o ถูก deprecate ก.ค.2026 deploy ใหม่ไม่ได้)
- api-version: `2025-04-01-preview`
- ⚠️ **มี drift** ระหว่าง bicep default กับสิ่งที่ deploy — ต้อง verify `AZURE_OPENAI_DEPLOYMENT` app setting บน Function App จริงเพื่อยืนยันโมเดลปัจจุบัน (ความเชื่อมั่น: กลาง)
- call แบบ **JSON mode** (`response_format`), temp 0.2 — บังคับ output ตรง Pydantic `EvaluationLLMOutput`

### 2.5 ทางเลือก Local LLM (ปรึกษาแล้ว ยังไม่ actioned)

- endpoint OpenAI-compat: `https://runner.csigroups.com:32212/v1` (Bearer token, `system_fingerprint=fp_ollama` = Ollama)
- models available: gemma4:latest / gemma4:31b / gpt-oss:20b (reasoning) / scb10x/typhoon-ocr-3b (OCR ไทย → แทน DocIntel ได้) / bge-m3 (embedding)
- จุดเชื่อม LLM ที่ต้องแก้ = 2 ไฟล์: `evaluation.py:_client()` + `project_content.py` (ทั้งคู่ hardcode `AzureOpenAI(...)` + `AZURE_OPENAI_KEY`) → เปลี่ยนเป็น `OpenAI(base_url=...)`
- 🔴 ข้อจำกัด: latency 20-30s/call (reasoning model), audit เต็ม 17 sections เสี่ยงชน Azure Functions HTTP timeout ~230s → อาจต้อง async pattern (submit→poll); Functions serverless เข้า GPU ไม่ได้ ต้อง host แยก

---

## 3. Backend — โครงสร้างโค้ด (Azure Functions Python)

### 3.1 โครงไฟล์ `proposal-evaluator/api/`

| ไฟล์ | หน้าที่ |
|------|---------|
| `function_app.py` | HTTP router — 25 endpoint (Azure Functions v2 programming model, decorator `@app.route`) |
| `host.json` | Functions host config |
| `requirements.txt` | dependencies (ดู §3.4) |
| `shared/auth.py` | RBAC — parse principal, ROLE_RANK, PAGE_MIN_ROLE, page gate |
| `shared/db.py` | data access layer (pyodbc → Azure SQL) |
| `shared/models.py` | Pydantic models — LLM JSON contract + API DTO |
| `shared/rubric.py` | canonical 17 sections + tier (single source of truth) |
| `shared/scoring.py` | deterministic weighted score + calibration + verdict |
| `shared/evaluation.py` | เรียก LLM + normalize ผลให้ครบ 17 section |
| `shared/extraction.py` | text extract (Doc Intelligence + PPTX fallback) |
| `shared/project_content.py` | F30 GPT extraction ของ project content (Proposal Library) |
| `prompts/proposal_master_system.md` | system prompt ของ proposal-master (mirror ของ skill) |

### 3.2 REST API — endpoint map ครบ (จาก `function_app.py`)

ทุก endpoint `auth_level=ANONYMOUS` (SWA เป็น security boundary; เรียก Function ตรง = HTTP 400 block)

| Method | Route | หน้าที่ | หมวด |
|--------|-------|---------|------|
| GET | `/api/health` | health check | ops |
| POST | `/api/prepare` | upload + extract + LLM auto-detect client/project (F20), คืน meta ให้ยืนยัน | evaluate (phase 1) |
| POST | `/api/evaluate` | audit เต็ม → score + recommendations + skeleton (cache/gate logic ในนี้) | evaluate (phase 2) |
| POST | `/api/comments` | เพิ่ม user comment (F26) | thread |
| GET | `/api/proposals` | list threads (1 แถว/thread, version สูงสุด) | list |
| GET | `/api/threads/{thread_id}` | detail thread เต็ม (17 score_details + history + comments) | detail |
| GET | `/api/threads/{thread_id}/history` | ทุก version ของ thread | detail |
| GET | `/api/me` | คืน role + page access ของ user ปัจจุบัน | auth |
| GET | `/api/dashboard` | KPI + verdict donut + score/win trend + action lists (F42) | dashboard |
| GET | `/api/users` | list users | admin |
| POST | `/api/users` | เพิ่ม user | admin |
| PATCH | `/api/users/{user_id}` | เปลี่ยน role | admin |
| GET | `/api/masterdata` | list master data (solution_type/industry) | admin |
| POST | `/api/masterdata` | เพิ่ม master data | admin |
| DELETE | `/api/masterdata/{mid}` | ลบ master data | admin |
| GET | `/api/settings` | อ่าน AppSettings (kv) | admin |
| PUT | `/api/settings` | เขียน AppSettings | admin |
| GET | `/api/library` | list Proposal Library (filter search/outcome/verify) | library |
| GET | `/api/library/{thread_id}` | detail library item | library |
| PATCH | `/api/library/{thread_id}` | แก้ field + verify | library |
| POST | `/api/library/backfill` | extract project content ย้อนหลังทุก thread ที่ยังไม่มี | library |

**Helper ภายใน:** `_upload_blob()` (เก็บไฟล์ `<uuid>/<filename>`), `_sas_url(hours=4)` (gen read-only SAS), `_extract_and_store_content()` (hook หลัง evaluate, fire-safe), `_full_eval()` (nested — audit pipeline หลัก)

### 3.3 Evaluation pipeline (F03 → F13)

```
upload PDF/PPTX
  → validate format/size            (F03)
  → store original ใน Blob          (F04)
  → create submission + version     (F05)
  → extract text (DocIntel + OCR / python-pptx fallback)  (F06/F07)
  → build proposal-master prompt    (F08)
  → call Azure OpenAI JSON mode, temp 0.2  (F09)
  → parse + validate Pydantic (EvaluationLLMOutput)  (F10)
  → normalize ให้ครบ 17 section (section ขาด = 0)  (evaluation._normalize_to_rubric)
  → compute weighted score ในโค้ด (scoring.py)  (F11)  ← deterministic
  → map verdict                     (F12)
  → persist SQL + render report     (F13)
```

**Caching/gate (ลด LLM call):**
- **Content-hash cache (F24):** cache key = `content_hash (SHA-256 ของ normalized text) + lang` → เนื้อหา+ภาษาเดิม reuse คะแนนเดิม 100% (per-thread: `find_eval_by_hash(thread_id,...)`)
- **Improvement-gate (F25):** เนื้อหาเปลี่ยนแต่ไม่แก้ตามคำแนะนำ → reuse; แก้แล้ว → re-eval; `score_source` badge = evaluated/reused

### 3.4 Dependencies (`api/requirements.txt`)

`azure-functions` · `azure-storage-blob` · `azure-ai-formrecognizer` (DocIntel) · `openai>=1.40.0` · `pyodbc` (Azure SQL) · `python-pptx` (PPTX fallback) · `pydantic>=2.0`

### 3.5 LLM JSON contract (Pydantic, `models.py`)

```
EvaluationLLMOutput = {
  score_details: [ScoreDetail{ slide_section, tier, score_1_10, coverage }],
  recommendations: [Recommendation{ priority, rec_text, slide_ref }],
  skeleton_md: str,
  strengths: [str],
  gaps: [str]
}
```
- `Tier = Critical|Important|Optional` ; `Verdict = Strong|Adequate|Weak|Critical`
- **ดีไซน์สำคัญ:** `score_1_10` **ไม่ผูก ge/le ที่ Pydantic** ตั้งใจ — LLM ส่งค่านอกช่วง (เช่น 11) จะไม่ทำให้ parse fail/retry; clamp 0-10 ทำที่ `_normalize_to_rubric` จุดเดียว (single enforcement point) — เป็น bug ที่ eval harness จับได้แล้วแก้
- `overall_score` จาก LLM **ไม่เชื่อ** — recompute ใน scoring.py เสมอ
- models เสริม: `DetectedMeta` (F20), `GateResult` (F25), `ProjectContentLLM` + `Milestone`/`ManpowerRow` (F30, confidence ต่อ field, null=ไม่พบ ห้ามเดา)

---

## 4. Data Model — Azure SQL (`sql/schema.sql`)

### 4.1 Entity relationship

```
Users (1) ─< ProposalThreads (1) ─< Submissions (1) ─< EvaluationResults (1) ─< ScoreDetails
                    │                     │                      └─< Recommendations
                    │                     └─ (content_hash, text_content, lang, score_source)
                    ├─< Comments
                    └─(1:1)─ ProposalContent (Proposal Library)
```

### 4.2 ตารางหลัก (8 ตาราง + 1 view + 1 sequence)

| ตาราง | PK | คอลัมน์สำคัญ | หมายเหตุ |
|-------|-----|-------------|---------|
| `Users` | user_id (GUID) | entra_oid (unique), email, role | **schema.sql เดิม role enum = submitter/analyst/admin** แต่ `migration_rbac_settings.sql` ALTER เป็น user/manager/management/admin (ดู §4.3) |
| `ProposalThreads` | thread_id | ticket_no (`PE-YYYY-NNNNN` unique), client_name, project_name, owner_id (nullable→Users) | 1 thread = 1 project; owner_id ยัง nullable รอ backfill |
| `seq_ticket` | (SEQUENCE) | START 1 INCREMENT 1 | ticket running ยาวไม่ reset (year เป็น prefix ตอน format) |
| `Submissions` | submission_id | thread_id, version_no, filename, content_type, blob_url, content_hash (CHAR64), text_content, lang(th/en), score_source, status | 1 record/upload; `UQ_thread_version` unique(thread_id,version_no) |
| `EvaluationResults` | eval_id | submission_id, overall_score DECIMAL(4,2), verdict, skeleton_md, raw_llm_json, model_name | overall คำนวณ backend |
| `ScoreDetails` | detail_id | eval_id (cascade), slide_section, tier, score_1_10 (0-10), coverage | per-section |
| `Recommendations` | rec_id | eval_id (cascade), priority, rec_text, slide_ref | |
| `Comments` | comment_id | thread_id, submission_id (nullable), author, comment_text | F26 |
| `ProposalContent` | content_id | thread_id (unique 1:1), price/cost (amount+currency), duration_months, milestones (JSON), manpower (JSON), solution_type, industry, deal_outcome(Won/Lost/Pending), source(extracted/manual/pm_system), field_confidence (JSON), verify_status, sync_status, retry_count, ... | Proposal Library, 28 col; รวม SharePoint sync state |

**View:** `vw_ThreadScores` — JOIN Threads+Submissions+EvaluationResults (LEFT) → ใช้ยึด "latest-per-thread" ในหลาย query (proposals list, dashboard)

**Indexes:** IX บน Submissions(thread,version) / Submissions(thread,hash) / Eval(submission) / Eval(created) / Threads(owner) / Threads(client,project) / Comments(thread,created) / Content(outcome,verify) / Content(sync,dirty)

### 4.3 Migrations

| ไฟล์ | เนื้อหา |
|------|---------|
| `sql/schema.sql` | schema เริ่มต้น (SA Phase 3) |
| `sql/migration_rbac_settings.sql` | ALTER Users role enum (submitter→user, analyst→manager) + สร้าง MasterData + AppSettings tables + bootstrap `rungroj@csigroups.com`=admin |
| `sql/migration_proposal_library.sql` | สร้าง ProposalContent (idempotent) |

วิธีรัน SQL กับ live DB (non-interactive, เครื่องนี้ไม่มี ODBC Driver 17/18 + ไม่มี sqlcmd): `mssql-python` (pip, driver ฝังในตัว) + AAD token จาก `az account get-access-token --resource https://database.windows.net/` ส่งผ่าน `attrs_before={1256: token_struct}`

---

## 5. Frontend — React SPA (`proposal-evaluator/frontend/`)

### 5.1 Stack (จาก `package.json`)

| Package | Version | บทบาท |
|---------|---------|-------|
| react / react-dom | ^18.3.1 | UI |
| react-router-dom | ^6.26.0 | routing |
| vite | ^5.4.0 | bundler/dev server |
| typescript | ^5.5.4 | type |
| @vitejs/plugin-react | ^4.3.1 | JSX |

build: `tsc && vite build` → static assets → deploy SWA

### 5.2 โครงไฟล์

| ไฟล์ | หน้าที่ |
|------|---------|
| `src/main.tsx` | entry |
| `src/App.tsx` | ทั้งแอพ (nav, views, state) — monolithic |
| `src/api/client.ts` | typed API client (fetch `/api/*` relative) |
| `src/theme.css` | design tokens (light+dark), primary #1d4ed8, Inter + IBM Plex Sans Thai |
| `public/staticwebapp.config.json` | SWA auth + route protection + navigationFallback (SPA) |

### 5.3 UI / navigation

- Layout: sidebar (dark gradient) + topbar (search input จริง) + dark-mode toggle + circular gauge + tabs + trend chart
- Branding: "CSI Groups" / sub "COS Solution Audit" / app title "Proposal Audit Agent"
- Nav (กรองตาม role): **Evaluation Resulted** (เดิม Proposals) · **Proposal Library** · **Auditor Dashboard** · **Settings** + ปุ่ม New Evaluation
- นำเข้า design จาก Claude Design UI Kit (DesignSync MCP, project `f8e9ffd2-...`) → implement เป็น React จริง

---

## 6. Scoring Engine — Deterministic core

### 6.1 `rubric.py` — canonical 17 sections (single source of truth)

section list + tier ถูก FIX ตายตัว → weighted-score denominator คงที่ → ทำซ้ำได้

| # | Section | Tier |
|---|---------|------|
| 1 | Hero Cover | Important |
| 2 | Agenda | Optional |
| 3 | Client Context | Important |
| 4 | Pain Statement | **Critical** |
| 5 | Cost of Inaction | Important |
| 6 | Hero Moat (Track Record) | **Critical** |
| 7 | Solution Architecture | **Critical** |
| 8 | Delivery Narrative (3-Wave) | **Critical** |
| 9 | Master Schedule | **Critical** |
| 10 | Commercial Summary & TCO | Important |
| 11 | Differentiation Grid | Optional |
| 12 | The Ask & Next 30 Days | Optional |
| 13 | Named Team & Organization | Optional |
| 14 | Governance Fit | Important |
| 15 | Quality Management & Risk | Important |
| 16 | Post Go-Live Support (MA) | Important |
| 17 | Reference Case | Important |

Critical(5) + Important(8) + Optional(4) = 17

### 6.2 `scoring.py` — สูตรคำนวณ (v7)

```python
TIER_WEIGHT = {"Critical": 4, "Important": 3, "Optional": 1}
CALIBRATION_OFFSET = 1.5

overall = min(10.0, round(weighted_sum/weight_total + 1.5, 2))
#   weight_total = 5×4 + 8×3 + 4×1 = 48  (ตัวหารคงที่)

verdict:  Strong ≥7 | Adequate ≥5 | Weak ≥3.5 | Critical (ต่ำกว่า)
```

- **แยกงานชัด:** LLM ให้ score รายมิติ (1-10) เท่านั้น → โค้ดถ่วงน้ำหนัก+คำนวณ → deterministic
- **Calibration offset +1.5** มาจาก expert anchor ของ Boss (v6 raw underestimate ~1.3-1.5 อย่างเป็นระบบ); แตะ overall จุดเดียว ไม่แตะ section/ranking
- ⚠️ ระวังสับสน: tier "Critical" = สำคัญมาก (weight×4); verdict "Critical" = คะแนนแย่ (คนละ column)

### 6.3 Anchored rubric

13 sections (Critical+Important) มีเกณฑ์ย่อยรายระดับคะแนน (8-10 / 5-7 / 1-4) ใน `proposal_master_system.md` + skill → ลด variance + audit ย้อนได้ (Optional 4 ตัวใช้ scale ทั่วไป)

**ผล variance test (FPT proposal 5 รอบ, temp 0.2):** overall mean 7.48, SD 0.116, verdict Strong 5/5; 6 section ที่มี anchor นิ่งสนิท (spread 0); Critical ทั้ง 5 แกว่งน้อยมาก → overall เชื่อถือได้

---

## 7. ส่วน A — GTM Discovery RAG: Technical detail

### 7.1 Pipeline 3 agent (Python, root folder)

```
Deal Context (ข้อความ)
  → scoring_agent.py         → BANTi-F³ + Go/No-Go + Tier
  → discovery_agent.py       → map pain กับ solution_master.md → Fit Level
  → solution_shaping_agent.py → module→function + customization_ratio + Go/No-Go
```
ทุก agent เรียก Claude Sonnet (`claude-sonnet-4-6`) คืน JSON; `app.py` (~52KB) = UI; `solution_master.md` = knowledge base 18 solutions

### 7.2 Decision logic

- **Scoring:** BANTi เต็ม 100 (5 มิติ×20) + F³ เต็ม 15 (3 มิติ×5); Go ถ้า BANTi≥60; Tier1(F³<8)/Tier2(8-11)/Tier3(12-15)
- **Discovery:** Full Fit(<20%) / Partial(20-50%) / Full Custom(>50%)
- **Shaping:** function = Standard/Custom/Integration; `customization_ratio=(custom+integration)/total×100`; Go ถ้า solution_fit≥3 AND feasibility≥3; No-Go ถ้า ratio>60%

### 7.3 🔴 หนี้ security ค้าง (ยังไม่แก้)

`discovery_agent.py:9`, `scoring_agent.py:9`, `solution_shaping_agent.py:9` มี **Anthropic API key hardcode** (`sk-ant-api03-...`) commit เข้า git แล้ว → key compromised → **ควร revoke + ย้าย env var ด่วน** (ความเชื่อมั่น: สูง)

---

## 8. Deployment & Ops — คำสั่งจริง + gotchas

### 8.1 Deploy commands

| ส่วน | คำสั่ง |
|------|--------|
| Infra | `az bicep build` → `az deployment group create` (params `main.parameters.json` + `infra/deploy.ps1`) |
| Backend | `func azure functionapp publish propeval-lupxx-func --build remote` |
| Frontend | `swa deploy .\dist --deployment-token <tok> --env production` |
| SQL migration | `mssql-python` + AAD token (ดู §4.3) |

### 8.2 Gotchas (บทเรียน)

- **Function deploy** ต้องใช้ `func ... publish --build remote` — config-zip index functions ไม่ได้; exit 255 = แค่ warning python 3.13 local vs 3.11 Azure (remote build สำเร็จจริง — verify จาก endpoint)
- **SWA deploy รอบแรกอาจ upload .js ไม่ครบ** (index.html ขึ้นแต่ hashed .js 404 → SPA blank) → re-deploy ซ้ำ
- **verify ต้องผ่าน SWA URL เสมอ** — เรียก Function ตรง = block HTTP 400 (SWA เป็น security boundary)
- **SQL firewall:** IP client เปลี่ยน (ISP) → `az sql server firewall-rule create` เพิ่ม IP
- **az ไม่อยู่บน PATH** shell ใหม่ → full path `C:\Program Files\Microsoft SDKs\Azure\CLI2\wbin`
- **deployment token:** `az staticwebapp secrets list -n propeval-lupxx-web -g rg-proposal-evaluator --query properties.apiKey -o tsv`

---

## 9. Technical Debt — สรุปเชิงเทคนิค

| ระดับ | รายการ | ความเชื่อมั่น |
|------|--------|--------------|
| 🔴 ด่วน (security) | API key hardcode 3 ไฟล์ ส่วน A (`*_agent.py:9`) — revoke + ย้าย env | สูง |
| 🔴 ด่วน (security) | key web app อยู่ appSettings → ย้าย Key Vault | สูง |
| 🎯 สำคัญ (validity) | หา ground truth ผลดีล DNMY → calibrate rubric หลุด overfit (ปรับ 7 รอบ/1 วัน จาก 3 ตัวอย่าง) | สูง |
| 🟡 ops | git commit — โค้ด rubric v5-v7 + SSO enforcement ยังไม่เข้า git (repo ยัง initial commit) | สูง |
| 🟡 feature | M3 SharePoint sync รอ M365 admin (Sites.Selected consent) | — |
| 🟡 data | owner_id nullable รอ backfill 9 โปรเจคเก่า (user ธรรมดายังไม่เห็น) | — |
| 🟢 hardening | blob soft delete (90 วัน) + versioning (โค้ดใช้ overwrite=True) | — |
| 🟢 เล็ก | blob upload ไม่ set content-type → เปิดลิงก์ download แทน preview inline | — |
| 🟢 config | custom domain csigroups.com รอ IT เพิ่ม CNAME (DNS zone คนละ subscription) | — |

---

## 10. สรุป Fact vs สิ่งที่ต้อง verify

**Fact (จากซอร์สโค้ดจริง):** โครงสร้าง infra bicep, data model SQL, endpoint map, RBAC logic, สูตร scoring v7, stack version, dependencies

**ต้อง verify (อาจ drift):**
1. โมเดล OpenAI ที่ deploy จริง — bicep default `gpt-5.5` vs memory `gpt-5.4-mini` → เช็ค `AZURE_OPENAI_DEPLOYMENT` บน Function App (ความเชื่อมั่น: กลาง)
2. `docs/architecture.md` ในโค้ด **stale** (ระบุ GPT-4o + role submitter/analyst เดิม) — เอกสารนี้ทับด้วยข้อมูลปัจจุบัน
3. สถานะ backlog อัปเดตล่าสุด 2026-07-21 (memory) — งาน ops บางส่วนอาจเปลี่ยน
