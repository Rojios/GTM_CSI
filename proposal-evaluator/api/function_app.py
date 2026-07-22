"""Azure Functions (Python v2 model) — HTTP API.

Flow (2-phase upload):
  POST /api/prepare             F03/F04/F06/F07/F20/F22 — upload -> store -> extract -> detect meta -> lookup
  POST /api/evaluate            F11/F12/F24/F25 — confirm -> cache/gate -> evaluate/reuse -> persist
  POST /api/comments            F26 — add user comment
  GET  /api/threads/{id}/history F17/F27 — versions + comments
  GET  /api/health              liveness

Auth (F01/F02): ANONYMOUS โดยตั้งใจ — security boundary อยู่ที่ Static Web Apps (linked backend).
หลัง link, Function App ถูกจำกัดให้เรียกผ่าน SWA เท่านั้น. ห้าม deploy standalone.
"""
from __future__ import annotations

import json
import logging
import os
import uuid
from datetime import datetime, timedelta, timezone
from urllib.parse import unquote, urlparse

import azure.functions as func
from azure.storage.blob import BlobSasPermissions, BlobServiceClient, generate_blob_sas

from shared import auth, db, llm, presentation, scoring
from shared.evaluation import (
    content_hash,
    detect_metadata,
    evaluate_proposal,
    improvement_gate,
)
from shared.extraction import extract_text
from shared.project_content import extract_project_content

app = func.FunctionApp()

_ALLOWED_TYPES = {"application/pdf", "application/vnd.openxmlformats-officedocument.presentationml.presentation"}
_MAX_BYTES = 25 * 1024 * 1024
_MODEL = os.environ.get("AZURE_OPENAI_DEPLOYMENT", "gpt")


def _json(payload: dict, status: int = 200) -> func.HttpResponse:
    return func.HttpResponse(
        json.dumps(payload, ensure_ascii=False, default=str), status_code=status, mimetype="application/json"
    )


def _upload_blob(data: bytes, filename: str, prefix: str) -> str:
    svc = BlobServiceClient.from_connection_string(os.environ["BLOB_CONNECTION_STRING"])
    container = os.environ.get("BLOB_CONTAINER", "proposals")
    client = svc.get_blob_client(container=container, blob=f"{prefix}/{filename}")
    client.upload_blob(data, overwrite=True)
    return client.url


def _sas_url(blob_url: str, hours: int = 4) -> str:
    """สร้าง read-only SAS URL ให้เปิดไฟล์ต้นฉบับได้ (container เป็น private)."""
    if not blob_url:
        return ""
    try:
        svc = BlobServiceClient.from_connection_string(os.environ["BLOB_CONNECTION_STRING"])
        path = unquote(urlparse(blob_url).path).lstrip("/")
        container, _, blob_name = path.partition("/")
        sas = generate_blob_sas(
            account_name=svc.account_name,
            container_name=container,
            blob_name=blob_name,
            account_key=svc.credential.account_key,
            permission=BlobSasPermissions(read=True),
            expiry=datetime.now(timezone.utc) + timedelta(hours=hours),
        )
        return f"{blob_url}?{sas}"
    except Exception:  # noqa: BLE001
        logging.exception("SAS generation failed")
        return ""


@app.route(route="health", methods=["GET"], auth_level=func.AuthLevel.ANONYMOUS)
def health(req: func.HttpRequest) -> func.HttpResponse:
    return _json({"status": "ok"})


@app.route(route="prepare", methods=["POST"], auth_level=func.AuthLevel.ANONYMOUS)
def prepare(req: func.HttpRequest) -> func.HttpResponse:
    """F03/F04/F06/F07/F20/F22 — upload + extract + detect + lookup (ยังไม่ประเมิน/ยังไม่สร้าง thread)."""
    try:
        file = req.files.get("file")
        if file is None:
            return _json({"error": "missing file"}, 400)
        filename = file.filename or "proposal"
        content_type = file.content_type or ""
        data = file.stream.read()

        if len(data) > _MAX_BYTES:
            return _json({"error": "file too large (max 25MB)"}, 413)
        if content_type not in _ALLOWED_TYPES and not filename.lower().endswith((".pdf", ".pptx")):
            return _json({"error": "unsupported format (PDF/PPTX only)"}, 415)

        prefix = str(uuid.uuid4())
        blob_url = _upload_blob(data, filename, prefix)

        text = extract_text(data, content_type, filename)
        if not text.strip():
            return _json({"error": "no text extracted from file"}, 422)

        chash = content_hash(text)
        meta = detect_metadata(text)

        # preview: มี thread ของ client+project ที่ detect ได้อยู่แล้วไหม
        existing = None
        if meta.client_name and meta.project_name:
            thread = db.find_thread_by_client_project(meta.client_name, meta.project_name)
            if thread:
                prior = db.latest_evaluated_submission(thread["thread_id"])
                scores = db.get_thread_scores(thread["thread_id"])
                latest = scores[-1] if scores else None
                existing = {
                    "ticket_no": thread["ticket_no"],
                    "latest_version": prior["version_no"] if prior else 0,
                    "next_version": (prior["version_no"] + 1) if prior else 1,
                    "latest_score": float(latest["overall_score"]) if latest and latest["overall_score"] is not None else None,
                    "latest_verdict": latest["verdict"] if latest else None,
                }

        return _json({
            "blob_url": blob_url,
            "filename": filename,
            "content_type": content_type,
            "file_size": len(data),
            "content_hash": chash,
            "text": text,
            "suggested_client": meta.client_name,
            "suggested_project": meta.project_name,
            "existing": existing,          # null = โปรเจคใหม่
        })
    except Exception as err:  # noqa: BLE001
        logging.exception("prepare failed")
        return _json({"error": str(err)}, 500)


@app.route(route="evaluate", methods=["POST"], auth_level=func.AuthLevel.ANONYMOUS)
def evaluate(req: func.HttpRequest) -> func.HttpResponse:
    """F11/F12/F24/F25 — confirm client/project -> cache/gate -> evaluate or reuse -> persist."""
    try:
        b = req.get_json()
        client_name = (b.get("client_name") or "").strip()
        project_name = (b.get("project_name") or "").strip()
        text = b.get("text") or ""
        if not client_name or not project_name:
            return _json({"error": "client_name และ project_name จำเป็น"}, 400)
        if not text.strip():
            return _json({"error": "missing text (เรียก /api/prepare ก่อน)"}, 400)

        lang = b.get("lang") if b.get("lang") in ("th", "en") else "en"
        chash = content_hash(text)

        # find/create thread + ticket (F21/F22) — set owner จาก user ที่ login (F44)
        me = auth.current_user(req)
        thread = db.find_thread_by_client_project(client_name, project_name)
        if thread:
            thread_id, ticket_no = thread["thread_id"], thread["ticket_no"]
        else:
            ticket_no = db.issue_ticket(datetime.now(timezone.utc).year)
            thread_id = db.create_thread(client_name, project_name, ticket_no, owner_id=me["user_id"])

        version_no = db.next_version_no(thread_id)
        prior = db.latest_evaluated_submission(thread_id)  # ก่อนสร้าง submission ปัจจุบัน

        submission_id = db.create_submission(
            thread_id, version_no, b.get("filename", "proposal"), b.get("content_type", ""),
            b.get("blob_url", ""), int(b.get("file_size", 0)), chash, text, lang,
        )

        def _full_eval() -> str:
            llm = evaluate_proposal(text, lang=lang)
            overall = scoring.compute_overall_score(llm.score_details)
            return db.save_evaluation(submission_id, overall, scoring.map_verdict(overall),
                                      llm, llm.model_dump_json(), _MODEL, "evaluated")

        try:
            source, gate_note = "evaluated", ""
            cached_eval_id = db.find_eval_by_hash(thread_id, chash, lang)

            if cached_eval_id:
                # F24 — เนื้อหา + ภาษาเดิมเป๊ะ -> reuse (คะแนนคงที่ 100%)
                eval_id = db.copy_evaluation(submission_id, cached_eval_id)
                source, gate_note = "reused", "identical content + language (cache hit)"
            elif prior is not None:
                content_changed = prior["content_hash"] != chash
                lang_changed = prior["lang"] != lang
                if not content_changed:
                    # เนื้อหาเดิมแต่ cache ไม่ hit -> ภาษาเปลี่ยน -> ประเมินใหม่ในภาษาที่เลือก
                    eval_id = _full_eval()
                    gate_note = "same content, different output language → re-evaluated"
                else:
                    # F25 — เนื้อหาเปลี่ยน -> เช็คว่าแก้ตามคำแนะนำไหม
                    recs = db.get_recommendation_texts(prior["eval_id"])
                    gate = improvement_gate(recs, prior["text_content"], text)
                    if gate.addressed_count == 0 and not lang_changed:
                        eval_id = db.copy_evaluation(submission_id, prior["eval_id"])
                        source, gate_note = "reused", gate.note or "no flagged issues addressed → reuse prior score"
                    else:
                        eval_id = _full_eval()
                        gate_note = (f"addressed {gate.addressed_count} recommendation(s) → re-evaluated"
                                     if not lang_changed else "output language changed → re-evaluated")
            else:
                eval_id = _full_eval()  # first version
        except Exception:
            db.set_submission_status(submission_id, "Failed")
            raise

        # F30 — extract project content (fire-safe: ล้มเหลวไม่กระทบผลประเมิน)
        try:
            _extract_and_store_content(thread_id, submission_id, chash, text)
        except Exception:  # noqa: BLE001
            logging.exception("project content extraction failed (non-fatal)")

        result = db.get_evaluation(eval_id)
        return _json({
            "thread_id": thread_id, "ticket_no": ticket_no, "version_no": version_no,
            "submission_id": submission_id, "score_source": source, "gate_note": gate_note, "lang": lang,
            "filename": b.get("filename", "proposal"), "file_url": _sas_url(b.get("blob_url", "")),
            **result,
            "history": db.get_thread_scores(thread_id),
            "comments": db.get_comments(thread_id),
        })
    except Exception as err:  # noqa: BLE001
        logging.exception("evaluate failed")
        return _json({"error": str(err)}, 500)


@app.route(route="comments", methods=["POST"], auth_level=func.AuthLevel.ANONYMOUS)
def comments(req: func.HttpRequest) -> func.HttpResponse:
    """F26 — add user comment."""
    b = req.get_json()
    thread_id = b.get("thread_id")
    text = (b.get("comment_text") or "").strip()
    if not thread_id or not text:
        return _json({"error": "thread_id และ comment_text จำเป็น"}, 400)
    db.add_comment(thread_id, b.get("submission_id"), b.get("author") or "user", text)
    return _json({"thread_id": thread_id, "comments": db.get_comments(thread_id)})


@app.route(route="proposals", methods=["GET"], auth_level=func.AuthLevel.ANONYMOUS)
def proposals(req: func.HttpRequest) -> func.HttpResponse:
    """F18/F19 — รายการ proposal. user เห็นเฉพาะของตัวเอง, manager+ เห็นทั้งหมด (F44)."""
    try:
        me = auth.current_user(req)
        # ไม่มีสิทธิ์เข้า Library (manager+ เดิม) -> เห็นเฉพาะ thread ตัวเอง
        owner = None if auth.has_page(me["role"], "library") else me["user_id"]
        return _json(db.list_proposals(owner_id=owner))
    except Exception as err:  # noqa: BLE001
        logging.exception("proposals list failed")
        return _json({"error": str(err)}, 500)


@app.route(route="threads/{thread_id}", methods=["GET"], auth_level=func.AuthLevel.ANONYMOUS)
def thread_detail(req: func.HttpRequest) -> func.HttpResponse:
    """F17 — ผลประเมินเต็มของ version ที่ประเมินแล้วล่าสุดใน thread (shape เดียวกับ /evaluate)."""
    try:
        thread_id = req.route_params.get("thread_id")
        thread = db.get_thread(thread_id)
        if not thread:
            return _json({"error": "thread not found"}, 404)

        history_rows = db.get_thread_scores(thread_id)
        comments = db.get_comments(thread_id)
        prior = db.latest_evaluated_submission(thread_id)
        if not prior:
            # thread มีอยู่แต่ยังไม่มี version ที่ประเมินสำเร็จ
            return _json({
                "thread_id": thread_id, "ticket_no": thread["ticket_no"],
                "client_name": thread["client_name"], "project_name": thread["project_name"],
                "history": history_rows, "comments": comments, "evaluated": False,
            })

        # score_source ของ version ล่าสุดที่ประเมินแล้ว (จาก history)
        src = next((r.get("score_source") for r in history_rows
                    if r.get("version_no") == prior["version_no"]), None)

        result = db.get_evaluation(prior["eval_id"])
        return _json({
            "thread_id": thread_id, "ticket_no": thread["ticket_no"],
            "client_name": thread["client_name"], "project_name": thread["project_name"],
            "version_no": prior["version_no"], "lang": prior["lang"],
            "score_source": src or "evaluated", "gate_note": "",
            "filename": prior.get("filename", "proposal"), "file_url": _sas_url(prior.get("blob_url", "")),
            **result,
            "history": history_rows, "comments": comments,
        })
    except Exception as err:  # noqa: BLE001
        logging.exception("thread detail failed")
        return _json({"error": str(err)}, 500)


@app.route(route="threads/{thread_id}/history", methods=["GET"], auth_level=func.AuthLevel.ANONYMOUS)
def history(req: func.HttpRequest) -> func.HttpResponse:
    """F17/F27 — versions + comments."""
    thread_id = req.route_params.get("thread_id")
    return _json({
        "thread_id": thread_id,
        "versions": db.get_thread_scores(thread_id),
        "comments": db.get_comments(thread_id),
    })


# ===================== Proposal Library (F30-F37) =====================

def _extract_and_store_content(thread_id: str, submission_id: str, chash: str, text: str) -> None:
    """F30 — extract แล้ว upsert ตามกติกา verify (ห้ามทับข้อมูลที่คนยืนยันแล้ว)."""
    llm = extract_project_content(text)
    db.upsert_extracted_content(
        thread_id, submission_id, chash, llm.model_dump() if llm else None
    )


@app.route(route="me", methods=["GET"], auth_level=func.AuthLevel.ANONYMOUS)
def me(req: func.HttpRequest) -> func.HttpResponse:
    """F43 — ตัวตน + role + สิทธิ์เข้าหน้าของผู้ใช้ปัจจุบัน (ให้ frontend ซ่อน/แสดงเมนู)."""
    try:
        u = auth.current_user(req)
        return _json({**u, "access": auth.page_access(u["role"])})
    except Exception as err:  # noqa: BLE001
        logging.exception("me failed")
        return _json({"error": str(err)}, 500)


@app.route(route="dashboard", methods=["GET"], auth_level=func.AuthLevel.ANONYMOUS)
def dashboard(req: func.HttpRequest) -> func.HttpResponse:
    """F42 — สรุปภาพรวม (management+ เท่านั้น)."""
    try:
        u = auth.current_user(req)
        if not auth.require(u, "dashboard"):
            return _json({"error": "forbidden"}, 403)
        return _json(db.get_dashboard())
    except Exception as err:  # noqa: BLE001
        logging.exception("dashboard failed")
        return _json({"error": str(err)}, 500)


# ===================== Users / Settings (F43-F46) =====================

@app.route(route="users", methods=["GET"], auth_level=func.AuthLevel.ANONYMOUS)
def users_list(req: func.HttpRequest) -> func.HttpResponse:
    """F44 — รายชื่อ user + role (admin เท่านั้น)."""
    try:
        u = auth.current_user(req)
        if not auth.require(u, "settings"):
            return _json({"error": "forbidden"}, 403)
        return _json(db.list_users())
    except Exception as err:  # noqa: BLE001
        logging.exception("users list failed")
        return _json({"error": str(err)}, 500)


@app.route(route="users", methods=["POST"], auth_level=func.AuthLevel.ANONYMOUS)
def users_add(req: func.HttpRequest) -> func.HttpResponse:
    """F44 — pre-add user ด้วย email + role (admin). พอ login จริงได้ role นี้เลย."""
    try:
        u = auth.current_user(req)
        if not auth.require(u, "settings"):
            return _json({"error": "forbidden"}, 403)
        b = req.get_json()
        email = (b.get("email") or "").strip()
        role = (b.get("role") or "user").strip()
        if "@" not in email:
            return _json({"error": "email ไม่ถูกต้อง"}, 400)
        if not db.role_exists(role):
            return _json({"error": f"ไม่พบ role '{role}' ในระบบ"}, 400)
        db.add_user_by_email(email, role)
        return _json({"ok": True, "users": db.list_users()})
    except Exception as err:  # noqa: BLE001
        logging.exception("users add failed")
        return _json({"error": str(err)}, 500)


@app.route(route="users/{user_id}", methods=["PATCH"], auth_level=func.AuthLevel.ANONYMOUS)
def users_set_role(req: func.HttpRequest) -> func.HttpResponse:
    """F44 — เปลี่ยน role ของ user (admin เท่านั้น)."""
    try:
        u = auth.current_user(req)
        if not auth.require(u, "settings"):
            return _json({"error": "forbidden"}, 403)
        role = (req.get_json().get("role") or "").strip()
        if not db.role_exists(role):
            return _json({"error": f"ไม่พบ role '{role}' ในระบบ"}, 400)
        ok = db.set_user_role(req.route_params.get("user_id"), role)
        return _json({"ok": ok, "users": db.list_users()})
    except Exception as err:  # noqa: BLE001
        logging.exception("set role failed")
        return _json({"error": str(err)}, 500)


@app.route(route="rbac-init", methods=["POST"], auth_level=func.AuthLevel.ANONYMOUS)
def admin_init_rbac(req: func.HttpRequest) -> func.HttpResponse:
    """R3 — สร้าง Roles/RolePermissions + seed 4 role เดิม (idempotent, admin). เรียกครั้งเดียวตอน setup."""
    try:
        u = auth.current_user(req)
        if not auth.require(u, "settings"):
            return _json({"error": "forbidden"}, 403)
        return _json(db.ensure_rbac_schema())
    except Exception as err:  # noqa: BLE001
        logging.exception("init rbac failed")
        return _json({"error": str(err)}, 500)


@app.route(route="roles", methods=["GET"], auth_level=func.AuthLevel.ANONYMOUS)
def roles_list(req: func.HttpRequest) -> func.HttpResponse:
    """R3 — list roles + permission matrix + user count (admin)."""
    try:
        u = auth.current_user(req)
        if not auth.require(u, "settings"):
            return _json({"error": "forbidden"}, 403)
        return _json({"roles": db.list_roles(), "pages": list(db.PAGES)})
    except Exception as err:  # noqa: BLE001
        logging.exception("roles list failed")
        return _json({"error": str(err)}, 500)


@app.route(route="roles", methods=["POST"], auth_level=func.AuthLevel.ANONYMOUS)
def roles_create(req: func.HttpRequest) -> func.HttpResponse:
    """R3 — สร้าง role ใหม่ (admin) — permission ทุกหน้าเริ่มต้น = ปิด."""
    try:
        u = auth.current_user(req)
        if not auth.require(u, "settings"):
            return _json({"error": "forbidden"}, 403)
        name = (req.get_json().get("name") or "").strip()
        if not name:
            return _json({"error": "ต้องระบุชื่อ role"}, 400)
        if db.role_exists(name):
            return _json({"error": f"role '{name}' มีอยู่แล้ว"}, 400)
        db.create_role(name)
        return _json({"roles": db.list_roles(), "pages": list(db.PAGES)})
    except Exception as err:  # noqa: BLE001
        logging.exception("role create failed")
        return _json({"error": str(err)}, 500)


@app.route(route="roles/{role_id}", methods=["DELETE"], auth_level=func.AuthLevel.ANONYMOUS)
def roles_delete(req: func.HttpRequest) -> func.HttpResponse:
    """R3 — ลบ role (admin). Guard: system role ห้ามลบ + role ที่มี user ใช้อยู่ห้ามลบ."""
    try:
        u = auth.current_user(req)
        if not auth.require(u, "settings"):
            return _json({"error": "forbidden"}, 403)
        role = db.get_role_by_id(req.route_params.get("role_id"))
        if not role:
            return _json({"error": "ไม่พบ role"}, 404)
        if role["is_system"]:
            return _json({"error": "ลบ system role (admin) ไม่ได้"}, 400)
        n = db.count_users_with_role(role["name"])
        if n > 0:
            return _json({"error": f"มี user {n} คนใช้ role นี้อยู่ — ย้าย role ก่อนลบ"}, 400)
        db.delete_role(role["role_id"])
        return _json({"roles": db.list_roles(), "pages": list(db.PAGES)})
    except Exception as err:  # noqa: BLE001
        logging.exception("role delete failed")
        return _json({"error": str(err)}, 500)


@app.route(route="roles/{role_id}/permissions", methods=["PUT"], auth_level=func.AuthLevel.ANONYMOUS)
def roles_set_permissions(req: func.HttpRequest) -> func.HttpResponse:
    """R3 — set permission matrix (admin). Guard กันล็อกตัวเองออกจาก Settings."""
    try:
        u = auth.current_user(req)
        if not auth.require(u, "settings"):
            return _json({"error": "forbidden"}, 403)
        role = db.get_role_by_id(req.route_params.get("role_id"))
        if not role:
            return _json({"error": "ไม่พบ role"}, 404)
        perms = {k: bool(v) for k, v in (req.get_json().get("permissions") or {}).items() if k in db.PAGES}
        # guard 1: system role (admin) ต้องคงสิทธิ์ Settings เสมอ (กัน admin ล็อกตัวเอง)
        if role["is_system"] and not perms.get("settings", True):
            return _json({"error": "ถอนสิทธิ์ Settings จาก system role (admin) ไม่ได้"}, 400)
        # guard 2: ต้องเหลืออย่างน้อย 1 role ที่เข้า Settings ได้เสมอ
        if "settings" in perms and not perms["settings"]:
            cur = db.get_role_permissions(role["name"]).get("settings", False)
            remaining = db.count_roles_with_page("settings") - (1 if cur else 0)
            if remaining < 1:
                return _json({"error": "ต้องเหลืออย่างน้อย 1 role ที่เข้า Settings ได้"}, 400)
        db.set_role_permissions(role["role_id"], perms)
        return _json({"roles": db.list_roles(), "pages": list(db.PAGES)})
    except Exception as err:  # noqa: BLE001
        logging.exception("role set permissions failed")
        return _json({"error": str(err)}, 500)


@app.route(route="presentation-coach", methods=["POST"], auth_level=func.AuthLevel.ANONYMOUS)
def presentation_coach(req: func.HttpRequest) -> func.HttpResponse:
    """R4 — สร้าง guideline การนำเสนอตามกลุ่มผู้ฟัง อิงเนื้อหา proposal ล่าสุดของ thread."""
    try:
        auth.current_user(req)  # ต้อง login (SWA gate) — ผู้ที่เปิดผลประเมินได้ใช้ coach ได้
        b = req.get_json()
        thread_id = b.get("thread_id")
        audience = (b.get("audience") or "").strip()
        custom = (b.get("custom_audience") or "").strip()
        # audience จาก preset map หรือ custom text ที่ผู้ใช้พิมพ์เอง (อย่างใดอย่างหนึ่ง)
        if audience in presentation.AUDIENCE:
            desc = presentation.AUDIENCE[audience]
        elif custom:
            desc = custom[:500]  # จำกัดความยาว กัน prompt บวม
        else:
            return _json({"error": "ต้องระบุ audience (preset) หรือ custom_audience (พิมพ์เอง)"}, 400)
        if not thread_id:
            return _json({"error": "ต้องระบุ thread_id"}, 400)
        sub = db.latest_evaluated_submission(thread_id)
        if not sub or not sub.get("text_content"):
            return _json({"error": "ไม่พบเนื้อหา proposal ของรายการนี้"}, 404)
        return _json({"guideline": presentation.coach_guideline(sub["text_content"], desc)})
    except Exception as err:  # noqa: BLE001
        logging.exception("presentation coach failed")
        return _json({"error": str(err)}, 500)


@app.route(route="masterdata", methods=["GET"], auth_level=func.AuthLevel.ANONYMOUS)
def masterdata_list(req: func.HttpRequest) -> func.HttpResponse:
    """F45 — รายการ Solution Type / Industry (ทุก role อ่านได้ — ใช้เป็น dropdown)."""
    try:
        cat = req.params.get("category")
        return _json(db.list_master_data(cat))
    except Exception as err:  # noqa: BLE001
        logging.exception("masterdata list failed")
        return _json({"error": str(err)}, 500)


@app.route(route="masterdata", methods=["POST"], auth_level=func.AuthLevel.ANONYMOUS)
def masterdata_add(req: func.HttpRequest) -> func.HttpResponse:
    """F45 — เพิ่มค่า master data (admin)."""
    try:
        u = auth.current_user(req)
        if not auth.require(u, "settings"):
            return _json({"error": "forbidden"}, 403)
        b = req.get_json()
        cat, val = (b.get("category") or "").strip(), (b.get("value") or "").strip()
        if cat not in ("solution_type", "industry") or not val:
            return _json({"error": "category (solution_type/industry) + value จำเป็น"}, 400)
        db.add_master_data(cat, val)
        return _json(db.list_master_data())
    except Exception as err:  # noqa: BLE001
        logging.exception("masterdata add failed")
        return _json({"error": str(err)}, 500)


@app.route(route="masterdata/{mid}", methods=["DELETE"], auth_level=func.AuthLevel.ANONYMOUS)
def masterdata_delete(req: func.HttpRequest) -> func.HttpResponse:
    """F45 — ลบค่า master data (admin)."""
    try:
        u = auth.current_user(req)
        if not auth.require(u, "settings"):
            return _json({"error": "forbidden"}, 403)
        return _json({"ok": db.delete_master_data(req.route_params.get("mid")), "items": db.list_master_data()})
    except Exception as err:  # noqa: BLE001
        logging.exception("masterdata delete failed")
        return _json({"error": str(err)}, 500)


def _settings_view(u: dict) -> dict:
    """shape settings สำหรับ frontend.

    - ทุก role: default_lang, default_currency, llm_provider (ค่าตั้งต้น submit + provider ปัจจุบัน)
    - admin เพิ่ม: local_llm_ready (env พร้อมไหม) + local_llm_model (จาก env, read-only)
    local config (endpoint/token) ฝัง env ไม่เก็บ DB -> ไม่ส่งกลับ frontend เลย
    """
    s = db.get_settings()
    out = {
        "default_lang": s.get("default_lang", "th"),
        "default_currency": s.get("default_currency", "THB"),
        "llm_provider": s.get("llm_provider", "azure"),
    }
    if auth.require(u, "settings"):
        info = llm.local_info()
        out["local_llm_ready"] = info["ready"]
        out["local_llm_model"] = info["model"]
    return out


@app.route(route="settings", methods=["GET"], auth_level=func.AuthLevel.ANONYMOUS)
def settings_get(req: func.HttpRequest) -> func.HttpResponse:
    """F46 — audit defaults + LLM provider (secret masked; LLM config เฉพาะ admin)."""
    try:
        return _json(_settings_view(auth.current_user(req)))
    except Exception as err:  # noqa: BLE001
        logging.exception("settings get failed")
        return _json({"error": str(err)}, 500)


@app.route(route="settings", methods=["PUT"], auth_level=func.AuthLevel.ANONYMOUS)
def settings_put(req: func.HttpRequest) -> func.HttpResponse:
    """F46/R2 — แก้ audit defaults + LLM provider config (admin)."""
    try:
        u = auth.current_user(req)
        if not auth.require(u, "settings"):
            return _json({"error": "forbidden"}, 403)
        allowed_keys = ("default_lang", "default_currency") + llm.LLM_SETTING_KEYS
        allowed = {k: v for k, v in req.get_json().items() if k in allowed_keys}
        # สลับไป local ต้อง: endpoint env พร้อม + เลือก model แล้ว (จาก body หรือค่าเดิมใน DB)
        if str(allowed.get("llm_provider", "")).strip().lower() == "local":
            if not llm.local_env_ready():
                return _json({"error": "Local endpoint ไม่พร้อม — ตั้ง env LOCAL_LLM_BASE_URL บน Function App"}, 400)
            chosen = (allowed.get("local_llm_model") or db.get_settings().get("local_llm_model") or "").strip()
            if not chosen:
                return _json({"error": "กรุณาเลือก Local LLM model ก่อนสลับไป Local"}, 400)
            # กัน bug: สลับ local ทั้งที่ Azure ต่อ server ไม่ถึง -> upload/audit จะ hang เงียบ
            reachable = llm.list_models()
            if not reachable:
                return _json({"error": "Azure ต่อ Local server ไม่ได้ (ตรวจ firewall/network) — ยังสลับไป Local ไม่ได้"}, 400)
            if chosen not in reachable:
                return _json({"error": f"ไม่พบ model '{chosen}' บน server (มี: {', '.join(reachable)})"}, 400)
        db.put_settings(allowed)
        return _json(_settings_view(u))
    except Exception as err:  # noqa: BLE001
        logging.exception("settings put failed")
        return _json({"error": str(err)}, 500)


@app.route(route="llm/models", methods=["GET"], auth_level=func.AuthLevel.ANONYMOUS)
def llm_models(req: func.HttpRequest) -> func.HttpResponse:
    """R2 — รายชื่อ model จาก local server ให้ UI เลือก (admin). ต่อไม่ได้ -> models: []."""
    try:
        u = auth.current_user(req)
        if not auth.require(u, "settings"):
            return _json({"error": "forbidden"}, 403)
        return _json({"ready": llm.local_env_ready(), "models": llm.list_models()})
    except Exception as err:  # noqa: BLE001
        logging.exception("llm models failed")
        return _json({"error": str(err)}, 500)


@app.route(route="library", methods=["GET"], auth_level=func.AuthLevel.ANONYMOUS)
def library_list(req: func.HttpRequest) -> func.HttpResponse:
    """F31 — รายการ Proposal Library (manager+ เท่านั้น)."""
    try:
        u = auth.current_user(req)
        if not auth.require(u, "library"):
            return _json({"error": "forbidden"}, 403)
        return _json(db.list_library())
    except Exception as err:  # noqa: BLE001
        logging.exception("library list failed")
        return _json({"error": str(err)}, 500)


@app.route(route="library/{thread_id}", methods=["GET"], auth_level=func.AuthLevel.ANONYMOUS)
def library_detail(req: func.HttpRequest) -> func.HttpResponse:
    """F32 — content เต็ม + SAS link ไฟล์ version ล่าสุด."""
    try:
        thread_id = req.route_params.get("thread_id")
        item = db.get_library_item(thread_id)
        if item is None:
            return _json({"error": "thread not found"}, 404)
        prior = db.latest_evaluated_submission(thread_id)
        item["filename"] = prior.get("filename", "") if prior else ""
        item["file_url"] = _sas_url(prior.get("blob_url", "")) if prior else ""
        return _json(item)
    except Exception as err:  # noqa: BLE001
        logging.exception("library detail failed")
        return _json({"error": str(err)}, 500)


@app.route(route="library/{thread_id}", methods=["PATCH"], auth_level=func.AuthLevel.ANONYMOUS)
def library_update(req: func.HttpRequest) -> func.HttpResponse:
    """F33 — แก้/ยืนยัน project content (รวม Deal Outcome). สร้าง record ว่างให้ถ้ายังไม่มี."""
    try:
        thread_id = req.route_params.get("thread_id")
        b = req.get_json()
        outcome = b.get("deal_outcome")
        if outcome is not None and outcome not in ("Won", "Lost", "Pending"):
            return _json({"error": "deal_outcome ต้องเป็น Won/Lost/Pending"}, 400)

        db.create_empty_content(thread_id)  # no-op ถ้ามีอยู่แล้ว
        db.update_library_item(
            thread_id, b, verify=bool(b.get("verify")), author=b.get("author") or "user"
        )
        return _json(db.get_library_item(thread_id))
    except Exception as err:  # noqa: BLE001
        logging.exception("library update failed")
        return _json({"error": str(err)}, 500)


@app.route(route="library/backfill", methods=["POST"], auth_level=func.AuthLevel.ANONYMOUS)
def library_backfill(req: func.HttpRequest) -> func.HttpResponse:
    """F37 (ส่วน extraction) — ไล่ extract thread เก่าที่ยังไม่มี content.

    ส่วน sync ไป SharePoint รอ M3 (admin consent). รันซ้ำได้ — ข้าม thread ที่มี content แล้ว.
    """
    try:
        targets = db.threads_missing_content()
        done, failed = 0, []
        for t in targets:
            try:
                _extract_and_store_content(
                    t["thread_id"], t["submission_id"], t["content_hash"] or "", t["text_content"]
                )
                done += 1
            except Exception as err:  # noqa: BLE001
                failed.append({"thread_id": t["thread_id"], "error": str(err)})
        return _json({"total": len(targets), "done": done, "failed": failed})
    except Exception as err:  # noqa: BLE001
        logging.exception("library backfill failed")
        return _json({"error": str(err)}, 500)
