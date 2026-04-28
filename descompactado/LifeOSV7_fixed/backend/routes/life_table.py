"""
routes/life_table.py
Notion-style workspace table for LifeOS.
"""
import logging
from datetime import datetime
from uuid import uuid4
from flask import Blueprint, request, g

from middleware.auth import auth_required
from utils.database import get_db, query, fetch_list, fetch_one
from utils.responses import success, error

log = logging.getLogger("lifeos.routes.life_table")
life_table_routes = Blueprint("life_table_routes", __name__)

_ALLOWED_FIELDS = {
    "title", "icon", "status", "priority", "area", "due_date",
    "notes", "properties", "position", "is_archived",
}
_STATUS_ALLOWED = {"ideia", "a_fazer", "fazendo", "feito", "pausado", "arquivado"}
_PRIORITY_ALLOWED = {"baixa", "media", "alta", "urgente"}


def _clean_text(value, max_len=500):
    if value is None:
        return ""
    return str(value).strip()[:max_len]


def _clean_date(value):
    value = _clean_text(value, 20)
    return value[:10] if value else None


def _normalize_payload(body: dict, creating: bool = False) -> dict:
    data = {k: v for k, v in body.items() if k in _ALLOWED_FIELDS}

    if "title" in data:
        data["title"] = _clean_text(data.get("title"), 220) or "Nova linha"
    elif creating:
        data["title"] = "Nova linha"

    if "icon" in data:
        data["icon"] = _clean_text(data.get("icon"), 8) or "▦"
    elif creating:
        data["icon"] = "▦"

    if "status" in data:
        status = _clean_text(data.get("status"), 30).lower()
        data["status"] = status if status in _STATUS_ALLOWED else "a_fazer"
    elif creating:
        data["status"] = "a_fazer"

    if "priority" in data:
        priority = _clean_text(data.get("priority"), 30).lower()
        data["priority"] = priority if priority in _PRIORITY_ALLOWED else "media"
    elif creating:
        data["priority"] = "media"

    if "area" in data:
        data["area"] = _clean_text(data.get("area"), 80) or "Geral"
    elif creating:
        data["area"] = "Geral"

    if "due_date" in data:
        data["due_date"] = _clean_date(data.get("due_date"))

    if "notes" in data:
        data["notes"] = _clean_text(data.get("notes"), 2000)

    if "properties" in data and not isinstance(data.get("properties"), dict):
        data["properties"] = {}
    elif creating and "properties" not in data:
        data["properties"] = {}

    if "position" in data:
        try:
            data["position"] = int(data.get("position") or 0)
        except Exception:
            data["position"] = 0

    if "is_archived" in data:
        data["is_archived"] = bool(data.get("is_archived"))

    data["updated_at"] = datetime.utcnow().isoformat()
    return data


def _select_cols():
    return "id, title, icon, status, priority, area, due_date, notes, properties, position, is_archived, created_at, updated_at"


@life_table_routes.get("/api/life-table")
@auth_required
def list_life_table_rows():
    include_archived = str(request.args.get("archived", "false")).lower() == "true"
    q = (
        get_db().table("life_table_rows")
        .select(_select_cols())
        .eq("user_id", g.uid)
        .order("position")
        .order("created_at")
    )
    if not include_archived:
        q = q.eq("is_archived", False)
    return success(fetch_list(query(q)))


@life_table_routes.post("/api/life-table")
@auth_required
def create_life_table_row():
    body = request.get_json(silent=True) or {}
    row_id = str(uuid4())
    current = fetch_list(query(
        get_db().table("life_table_rows").select("id").eq("user_id", g.uid).eq("is_archived", False)
    ))
    payload = _normalize_payload({**body, "position": body.get("position", len(current))}, creating=True)
    payload.update({"id": row_id, "user_id": g.uid, "is_archived": False})
    if query(get_db().table("life_table_rows").insert(payload)) is None:
        return error("DB_ERROR", "Não foi possível criar a linha da tabela.", 500)
    created = fetch_one(query(
        get_db().table("life_table_rows").select(_select_cols()).eq("id", row_id).eq("user_id", g.uid).limit(1)
    ))
    return success(created or payload, status=201)


@life_table_routes.patch("/api/life-table/<row_id>")
@auth_required
def update_life_table_row(row_id):
    body = request.get_json(silent=True) or {}
    data = _normalize_payload(body, creating=False)
    if not data:
        return error("NO_FIELDS", "Nenhum campo válido enviado.", 400)
    if query(get_db().table("life_table_rows").update(data).eq("id", row_id).eq("user_id", g.uid)) is None:
        return error("DB_ERROR", "Não foi possível atualizar a linha.", 500)
    return success({"updated": True})


@life_table_routes.delete("/api/life-table/<row_id>")
@auth_required
def delete_life_table_row(row_id):
    if query(
        get_db().table("life_table_rows")
        .update({"is_archived": True, "updated_at": datetime.utcnow().isoformat()})
        .eq("id", row_id).eq("user_id", g.uid)
    ) is None:
        return error("DB_ERROR", "Não foi possível arquivar a linha.", 500)
    return success({"deleted": True})
