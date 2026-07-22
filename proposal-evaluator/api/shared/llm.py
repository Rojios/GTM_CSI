"""LLM provider factory (R2) — เลือก Azure OpenAI หรือ Local LLM.

Provider สลับได้ global ผ่านหน้า Settings (คีย์ `llm_provider` ใน dbo.AppSettings):
- "azure" (default) -> Azure OpenAI จาก env (AZURE_OPENAI_*)
- "local"           -> OpenAI-compatible endpoint จาก env (LOCAL_LLM_BASE_URL/API_KEY/MODEL)

Settings เก็บแค่ "ตัวเลือก provider"; endpoint/token/model ของ local ฝังใน env (Function App
App Settings) ไม่เก็บใน DB -> ไม่มี secret ใน DB และไม่ leak ผ่าน settings API.

client ที่คืนเป็น openai SDK เหมือนกันทั้งคู่ (chat.completions + JSON mode).

หมายเหตุ latency: local LLM ทดสอบแล้ว 20-30s/call -> timeout ตั้งสูง (600s) แต่ Azure
Functions HTTP ยังมีเพดาน ~230s เอง (เป็น risk แยก ดู memory proposal-evaluator-project).
"""
from __future__ import annotations

import os

# คีย์ LLM ที่ให้ admin แก้ผ่าน Settings (whitelist ของ settings_put)
# provider = azure|local; local_llm_model = model ที่เลือกจาก UI (endpoint/token ฝัง env)
LLM_SETTING_KEYS = ("llm_provider", "local_llm_model")

_LOCAL_TIMEOUT = 600  # local LLM ช้า -> เผื่อเวลา (Functions HTTP เพดาน ~230s เอง)


def local_env_ready() -> bool:
    """endpoint local พร้อมไหม (base_url env ตั้งไว้) — model เลือกจาก UI แยกต่างหาก."""
    return bool(os.environ.get("LOCAL_LLM_BASE_URL"))


def list_models() -> list[str]:
    """ดึงรายชื่อ model จาก local server (GET /v1/models) ให้ UI เลือก.

    env ไม่ครบ หรือต่อไม่ได้ -> [] (UI แสดงว่ายังเลือกไม่ได้).
    """
    base_url = os.environ.get("LOCAL_LLM_BASE_URL", "").strip()
    if not base_url:
        return []
    from openai import OpenAI

    api_key = os.environ.get("LOCAL_LLM_API_KEY", "").strip() or "not-needed"
    try:
        client = OpenAI(base_url=base_url, api_key=api_key, timeout=30)
        return sorted(m.id for m in client.models.list().data)
    except Exception:  # noqa: BLE001 — ต่อ server ไม่ได้ -> UI แสดงว่าง
        return []


def local_info() -> dict:
    """ข้อมูล local LLM สำหรับ admin — endpoint พร้อมไหม + model ที่เลือกไว้ (จาก settings)."""
    from . import db  # lazy

    ready = local_env_ready()
    model = (db.get_settings().get("local_llm_model") or "").strip()
    return {"ready": ready, "model": model}


def current_model() -> str:
    """ชื่อ model ที่จะใช้จริงตาม provider ปัจจุบัน (สำหรับบันทึกลง eval + แสดงใน UI)."""
    from . import db  # lazy

    s = db.get_settings()
    if (s.get("llm_provider") or "azure").strip().lower() == "local":
        return (s.get("local_llm_model") or os.environ.get("LOCAL_LLM_MODEL", "")).strip() or "local"
    return os.environ.get("AZURE_OPENAI_DEPLOYMENT", "azure")


def get_provider() -> str:
    """provider ปัจจุบัน ('azure'|'local'). อ่านล้มเหลว -> azure (ปลอดภัย, ของเดิม)."""
    from . import db  # lazy: กัน import chain ดึง pyodbc ตอน offline eval

    try:
        return (db.get_settings().get("llm_provider") or "azure").strip().lower()
    except Exception:  # noqa: BLE001 — DB มีปัญหา -> fallback Azure
        return "azure"


def client_and_model() -> tuple[object, str]:
    """คืน (openai client, model/deployment name) ตาม provider ที่ตั้งไว้.

    local ตั้งค่าไม่ครบ (ขาด base_url หรือ model) -> RuntimeError ให้ caller retry/แจ้ง.
    """
    from . import db  # lazy: กัน import chain ดึง pyodbc ตอน offline eval

    settings = db.get_settings()
    provider = (settings.get("llm_provider") or "azure").strip().lower()

    if provider == "local":
        from openai import OpenAI

        base_url = os.environ.get("LOCAL_LLM_BASE_URL", "").strip()
        if not base_url:
            raise RuntimeError("Local LLM endpoint ไม่พร้อม — ตั้ง env LOCAL_LLM_BASE_URL บน Function App")
        # model เลือกจาก UI (settings); fallback env LOCAL_LLM_MODEL เผื่อยังไม่ได้เลือก
        model = (settings.get("local_llm_model") or os.environ.get("LOCAL_LLM_MODEL", "")).strip()
        if not model:
            raise RuntimeError("ยังไม่ได้เลือก Local LLM model ใน Settings")
        api_key = os.environ.get("LOCAL_LLM_API_KEY", "").strip() or "not-needed"
        return OpenAI(base_url=base_url, api_key=api_key, timeout=_LOCAL_TIMEOUT), model

    # default: Azure OpenAI (env เดิม)
    from openai import AzureOpenAI

    return (
        AzureOpenAI(
            azure_endpoint=os.environ["AZURE_OPENAI_ENDPOINT"],
            api_key=os.environ["AZURE_OPENAI_KEY"],
            api_version=os.environ["AZURE_OPENAI_API_VERSION"],
        ),
        os.environ["AZURE_OPENAI_DEPLOYMENT"],
    )
