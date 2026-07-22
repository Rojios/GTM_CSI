# Proposal Evaluator

Web app ประเมินคุณภาพ B2B proposal ก่อนส่งลูกค้า — ทีม engineer/sales upload proposal (PDF/PPTX) แล้วระบบให้คะแนน + Skeleton structure ที่แนะนำ โดย port ตรรกะจาก `proposal-master` skill ไปรันบน **Azure OpenAI (GPT-4o)** ทั้งหมดอยู่บน Azure

## Architecture (Azure-only)

```
[React SPA / Static Web Apps]
        | (Entra ID SSO)
        v
[Azure Functions API] --> [Blob Storage]            (proposal files)
        |               --> [Document Intelligence]  (text + OCR)
        |               --> [Azure OpenAI GPT-4o]    (proposal-master prompt, JSON)
        v
[Azure SQL] (score, version, history) --> [Dashboard]
```

## Structure

| Path | Purpose |
|------|---------|
| `frontend/` | React + Vite + TypeScript SPA (deploy → Azure Static Web Apps) |
| `api/` | Azure Functions (Python) — upload, extract, evaluate, score, history |
| `api/prompts/` | proposal-master → Azure OpenAI system prompt + JSON schema |
| `sql/` | Azure SQL schema (DDL) |
| `infra/` | Bicep IaC — provision Azure resources |
| `docs/` | Architecture & design docs (from SA Phase 1-4) |

## Function map (SA Phase 4)

| Module | Functions |
|--------|-----------|
| M1 Auth | F01 SSO Login, F02 Role Authorization |
| M2 Upload | F03 Upload, F04 Store File, F05 Version Linking |
| M3 Extract | F06 Extract Text, F07 OCR Fallback |
| M4 Eval | F08 Build Prompt, F09 Call OpenAI, F10 Parse Result |
| M5 Score | F11 Weighted Score, F12 Map Verdict |
| M6 Result | F13 Render Report, F14 Download Markdown |
| M7 Decision | F15 Accept, F16 Resubmit, F17 Compare Versions |
| M8 Analytics | F18 History Dashboard, F19 Filter & Aggregate |

## Local dev

```bash
# Backend (Azure Functions)
cd api
python -m venv .venv && .venv\Scripts\activate
pip install -r requirements.txt
cp local.settings.json.example local.settings.json   # เติมค่า connection strings
func start

# Frontend
cd frontend
npm install
npm run dev
```

## Scoring model

- คะแนนต่อ slide/section: 0-10 (GPT ประเมินตาม proposal-master rubric)
- **Overall = weighted average** ที่คำนวณใน backend (deterministic): `Critical x3, Important x2, Optional x1`
- Verdict: `>=8 Strong | 6-7.9 Adequate | 4-5.9 Weak | <4 Critical`

> คะแนนรวมคำนวณใน code เสมอ (ไม่ให้ GPT คำนวณ) เพื่อความคงเส้นคงวาและวิเคราะห์ trend ได้
