"""
routes/workspace.py
Workspace inteligente estilo Notion para o LifeOS.

Objetivo: transformar captura rápida, páginas em blocos, tarefas e projetos
em dados reais persistidos no Supabase — sem mock e sem localStorage.
"""

from __future__ import annotations

import logging
import re
from datetime import date, datetime, timedelta
from typing import Any, Dict, List, Optional
from uuid import uuid4

from flask import Blueprint, g, request

from middleware.auth import auth_required
from utils.database import get_db, query, fetch_list, fetch_one
from utils.responses import success, error

log = logging.getLogger("lifeos.routes.workspace")
workspace_routes = Blueprint("workspace_routes", __name__)

ITEM_TYPES = {"note", "task", "project", "study", "reminder", "idea"}
ITEM_STATUS = {"pending", "in_progress", "done", "archived"}
PROJECT_STATUS = {"active", "paused", "completed", "archived"}
PRIORITIES = {"low", "medium", "high"}
BLOCK_TYPES = {"text", "heading", "todo", "checklist", "quote", "code", "image", "link", "divider"}

WEEKDAYS_PT = {
    "segunda": 0, "segunda-feira": 0,
    "terca": 1, "terça": 1, "terca-feira": 1, "terça-feira": 1,
    "quarta": 2, "quarta-feira": 2,
    "quinta": 3, "quinta-feira": 3,
    "sexta": 4, "sexta-feira": 4,
    "sabado": 5, "sábado": 5,
    "domingo": 6,
}

ACTION_RE = re.compile(
    r"\b(estudar|revisar|fazer|comprar|pagar|ligar|enviar|entregar|marcar|resolver|preparar|criar|organizar|assistir|ler|treinar|praticar|finalizar)\b",
    re.IGNORECASE,
)


def _utc_now() -> str:
    return datetime.utcnow().isoformat()


def _text(value: Any, max_len: int = 500, default: str = "") -> str:
    if value is None:
        return default
    value = str(value).strip()
    return value[:max_len] if value else default


def _json_obj(value: Any) -> Dict[str, Any]:
    return value if isinstance(value, dict) else {}


def _tags(value: Any) -> List[str]:
    if not isinstance(value, list):
        return []
    clean = []
    for tag in value[:20]:
        t = _text(tag, 40)
        if t and t not in clean:
            clean.append(t)
    return clean


def _status(value: Any, allowed: set[str], default: str) -> str:
    value = _text(value, 40).lower()
    return value if value in allowed else default


def _priority(value: Any, text_hint: str = "") -> str:
    value = _text(value, 30).lower()
    if value in PRIORITIES:
        return value
    hint = text_hint.lower()
    if any(k in hint for k in ("urgente", "prioridade", "importante", "hoje", "prazo", "entregar")):
        return "high"
    if any(k in hint for k in ("quando der", "baixa", "sem pressa")):
        return "low"
    return "medium"


def _parse_due_date(raw: Any, source_text: str = "") -> Optional[str]:
    value = _text(raw, 30).lower()
    text = f"{value} {source_text.lower()}".strip()
    today = date.today()

    if value and re.fullmatch(r"\d{4}-\d{2}-\d{2}", value):
        return value

    if "hoje" in text:
        return today.isoformat()
    if "amanhã" in text or "amanha" in text:
        return (today + timedelta(days=1)).isoformat()
    if "depois de amanhã" in text or "depois de amanha" in text:
        return (today + timedelta(days=2)).isoformat()

    for name, idx in WEEKDAYS_PT.items():
        if re.search(rf"\b{name}\b", text):
            delta = (idx - today.weekday()) % 7
            if delta == 0:
                delta = 7
            return (today + timedelta(days=delta)).isoformat()

    br = re.search(r"\b(\d{1,2})/(\d{1,2})(?:/(\d{2,4}))?\b", text)
    if br:
        day = int(br.group(1)); month = int(br.group(2)); year = br.group(3)
        year_i = int(year) if year else today.year
        if year_i < 100:
            year_i += 2000
        try:
            return date(year_i, month, day).isoformat()
        except ValueError:
            return None

    iso = re.search(r"\b(20\d{2}-\d{2}-\d{2})\b", text)
    return iso.group(1) if iso else None


def _classify_text(text: str) -> Dict[str, Any]:
    normalized = text.lower().strip()
    item_type = "note"

    if any(k in normalized for k in ("lembrete", "me lembrar", "lembrar de", "não esquecer", "nao esquecer")):
        item_type = "reminder"
    elif any(k in normalized for k in ("projeto", "desenvolver", "criar app", "criar site", "plataforma")):
        item_type = "project"
    elif any(k in normalized for k in ("ideia", "idéia", "pensamento")):
        item_type = "idea"
    elif any(k in normalized for k in ("enem", "estudar", "revisar", "simulado", "matemática", "matematica", "redação", "redacao")):
        item_type = "task" if _parse_due_date(None, normalized) or ACTION_RE.search(normalized) else "study"
    elif ACTION_RE.search(normalized):
        item_type = "task"

    due_date = _parse_due_date(None, normalized)
    title = re.sub(r"\b(hoje|amanh[ãa]|depois de amanh[ãa]|segunda(?:-feira)?|ter[cç]a(?:-feira)?|quarta(?:-feira)?|quinta(?:-feira)?|sexta(?:-feira)?|s[áa]bado|domingo)\b", "", text, flags=re.IGNORECASE)
    title = re.sub(r"\s+", " ", title).strip(" -—.,") or text.strip()
    title = title[:180]

    return {
        "type": item_type,
        "title": title,
        "content": "" if item_type in {"task", "reminder"} else text.strip(),
        "due_date": due_date,
        "priority": _priority(None, normalized),
        "metadata": {"source_text": text.strip(), "classified_by": "lifeos_rules_v1"},
    }


def _select_item_cols() -> str:
    return "id,type,title,content,status,priority,due_date,parent_id,tags,metadata,created_at,updated_at"


def _select_page_cols() -> str:
    return "id,title,icon,cover_image,parent_id,is_archived,created_at,updated_at"


def _select_block_cols() -> str:
    return "id,page_id,type,content,position,metadata,created_at,updated_at"


def _select_task_cols() -> str:
    return "id,title,description,status,priority,due_date,project_id,page_id,source_item_id,created_at,updated_at"


def _select_project_cols() -> str:
    return "id,name,description,status,progress,page_id,created_at,updated_at"


def _get_now_tasks(uid: str) -> List[Dict[str, Any]]:
    rows = fetch_list(query(
        get_db().table("workspace_tasks")
        .select(_select_task_cols())
        .eq("user_id", uid)
        .neq("status", "done")
        .neq("status", "archived")
        .order("due_date", desc=False)
        .order("created_at", desc=True)
        .limit(50)
    ))
    weight = {"high": 3, "medium": 2, "low": 1}
    today_s = date.today().isoformat()

    def score(t: Dict[str, Any]) -> tuple:
        due = str(t.get("due_date") or "9999-12-31")[:10]
        overdue_or_today = 0 if due <= today_s else 1
        return (overdue_or_today, -weight.get(t.get("priority", "medium"), 2), due)

    return sorted(rows, key=score)[:5]


def _insert_global_task(uid: str, item: Dict[str, Any]) -> None:
    """Best-effort integration with the existing dashboard tasks table."""
    try:
        payload = {
            "user_id": uid,
            "title": item.get("title") or "Nova tarefa",
            "category": "workspace",
            "priority": item.get("priority") or "medium",
            "due_date": item.get("due_date") or date.today().isoformat(),
            "done": False,
            "source": "workspace",
        }
        query(get_db().table("tasks").insert(payload))
    except Exception as exc:  # pragma: no cover - best effort only
        log.warning("[WORKSPACE] Could not mirror task into tasks table: %s", exc)


def _create_task_from_item(uid: str, item: Dict[str, Any]) -> None:
    task_payload = {
        "user_id": uid,
        "title": item.get("title") or "Nova tarefa",
        "description": item.get("content") or "",
        "status": "pending",
        "priority": item.get("priority") or "medium",
        "due_date": item.get("due_date"),
        "source_item_id": item.get("id"),
        "updated_at": _utc_now(),
    }
    query(get_db().table("workspace_tasks").insert(task_payload))
    _insert_global_task(uid, item)


@workspace_routes.get("/api/workspace")
@auth_required
def get_workspace():
    db = get_db()
    uid = g.uid
    items = fetch_list(query(
        db.table("workspace_items")
        .select(_select_item_cols())
        .eq("user_id", uid)
        .neq("status", "archived")
        .order("created_at", desc=True)
        .limit(100)
    ))
    pages = fetch_list(query(
        db.table("workspace_pages")
        .select(_select_page_cols())
        .eq("user_id", uid)
        .eq("is_archived", False)
        .order("updated_at", desc=True)
        .limit(30)
    ))
    tasks = fetch_list(query(
        db.table("workspace_tasks")
        .select(_select_task_cols())
        .eq("user_id", uid)
        .neq("status", "done")
        .neq("status", "archived")
        .order("created_at", desc=True)
        .limit(50)
    ))
    projects = fetch_list(query(
        db.table("workspace_projects")
        .select(_select_project_cols())
        .eq("user_id", uid)
        .neq("status", "archived")
        .order("updated_at", desc=True)
        .limit(30)
    ))
    return success({
        "items": items,
        "pages": pages,
        "tasks": tasks,
        "projects": projects,
        "now": _get_now_tasks(uid),
    })


@workspace_routes.post("/api/workspace/quick-create")
@auth_required
def quick_create():
    body = request.get_json(silent=True) or {}
    text = _text(body.get("text"), 3000)
    if not text:
        return error("MISSING_TEXT", "Digite uma nota, tarefa, ideia ou plano.", 400)

    parsed = _classify_text(text)
    parsed.update({
        "id": str(uuid4()),
        "user_id": g.uid,
        "status": "pending",
        "tags": _tags(body.get("tags")),
        "updated_at": _utc_now(),
    })
    res = query(get_db().table("workspace_items").insert(parsed))
    if res is None:
        return error("DB_ERROR", "Não foi possível salvar a captura no Workspace.", 500)

    if parsed["type"] in {"task", "reminder", "study"}:
        _create_task_from_item(g.uid, parsed)
    elif parsed["type"] == "project":
        query(get_db().table("workspace_projects").insert({
            "user_id": g.uid,
            "name": parsed["title"],
            "description": text,
            "status": "active",
            "progress": 0,
            "updated_at": _utc_now(),
        }))

    item = fetch_one(query(
        get_db().table("workspace_items")
        .select(_select_item_cols())
        .eq("id", parsed["id"])
        .eq("user_id", g.uid)
        .limit(1)
    )) or parsed

    suggestions = []
    if parsed["type"] in {"note", "study", "project"}:
        suggestions.append({"label": "Criar página a partir disso", "action": "create_page"})
    if ACTION_RE.search(text) and parsed["type"] != "task":
        suggestions.append({"label": "Extrair tarefas desse texto", "action": "extract_tasks"})

    return success({"item": item, "suggestions": suggestions}, status=201)


@workspace_routes.patch("/api/workspace/items/<item_id>")
@auth_required
def update_workspace_item(item_id: str):
    body = request.get_json(silent=True) or {}
    allowed = {"type", "title", "content", "status", "priority", "due_date", "parent_id", "tags", "metadata"}
    data = {k: v for k, v in body.items() if k in allowed}
    if not data:
        return error("NO_FIELDS", "Nenhum campo válido enviado.", 400)
    if "type" in data:
        data["type"] = _status(data["type"], ITEM_TYPES, "note")
    if "status" in data:
        data["status"] = _status(data["status"], ITEM_STATUS, "pending")
    if "priority" in data:
        data["priority"] = _priority(data["priority"])
    if "title" in data:
        data["title"] = _text(data["title"], 220, "Sem título")
    if "content" in data:
        data["content"] = _text(data["content"], 5000)
    if "due_date" in data:
        data["due_date"] = _parse_due_date(data["due_date"])
    if "tags" in data:
        data["tags"] = _tags(data["tags"])
    if "metadata" in data:
        data["metadata"] = _json_obj(data["metadata"])
    data["updated_at"] = _utc_now()
    if query(get_db().table("workspace_items").update(data).eq("id", item_id).eq("user_id", g.uid)) is None:
        return error("DB_ERROR", "Não foi possível atualizar o item.", 500)
    return success({"updated": True})


@workspace_routes.delete("/api/workspace/items/<item_id>")
@auth_required
def archive_workspace_item(item_id: str):
    if query(get_db().table("workspace_items").update({"status": "archived", "updated_at": _utc_now()}).eq("id", item_id).eq("user_id", g.uid)) is None:
        return error("DB_ERROR", "Não foi possível arquivar o item.", 500)
    return success({"deleted": True})


@workspace_routes.post("/api/workspace/pages")
@auth_required
def create_page():
    body = request.get_json(silent=True) or {}
    title = _text(body.get("title"), 180, "Nova página")
    icon = _text(body.get("icon"), 8, "📝")
    template = _text(body.get("template"), 40, "blank")
    page_id = str(uuid4())
    payload = {
        "id": page_id,
        "user_id": g.uid,
        "title": title,
        "icon": icon,
        "cover_image": _text(body.get("coverImage") or body.get("cover_image"), 500) or None,
        "parent_id": body.get("parentId") or body.get("parent_id"),
        "is_archived": False,
        "updated_at": _utc_now(),
    }
    if query(get_db().table("workspace_pages").insert(payload)) is None:
        return error("DB_ERROR", "Não foi possível criar a página.", 500)

    starter_blocks = []
    if template != "blank":
        starter = {
            "study": [("heading", "Plano de estudo"), ("todo", "Definir primeira tarefa"), ("text", "Anotações importantes…")],
            "project": [("heading", "Objetivo do projeto"), ("text", "Explique o resultado esperado."), ("todo", "Criar primeira etapa")],
            "tasks": [("heading", "Lista de tarefas"), ("todo", "Primeira tarefa")],
            "summary": [("heading", "Resumo"), ("text", "Principais pontos…"), ("heading", "Próximas ações")],
            "ideas": [("heading", "Ideias"), ("text", "Escreva livremente e depois transforme em ação.")],
        }.get(template, [])
        for pos, (btype, content) in enumerate(starter):
            block = {
                "user_id": g.uid, "page_id": page_id, "type": btype,
                "content": content, "position": pos, "metadata": {}, "updated_at": _utc_now(),
            }
            query(get_db().table("workspace_blocks").insert(block))
            starter_blocks.append(block)

    page = fetch_one(query(get_db().table("workspace_pages").select(_select_page_cols()).eq("id", page_id).eq("user_id", g.uid).limit(1))) or payload
    return success({"page": page, "blocks": starter_blocks}, status=201)


@workspace_routes.get("/api/workspace/pages/<page_id>")
@auth_required
def get_page(page_id: str):
    page = fetch_one(query(get_db().table("workspace_pages").select(_select_page_cols()).eq("id", page_id).eq("user_id", g.uid).eq("is_archived", False).limit(1)))
    if not page:
        return error("NOT_FOUND", "Página não encontrada.", 404)
    blocks = fetch_list(query(get_db().table("workspace_blocks").select(_select_block_cols()).eq("user_id", g.uid).eq("page_id", page_id).order("position")))
    return success({"page": page, "blocks": blocks})


@workspace_routes.patch("/api/workspace/pages/<page_id>")
@auth_required
def update_page(page_id: str):
    body = request.get_json(silent=True) or {}
    data = {}
    if "title" in body:
        data["title"] = _text(body.get("title"), 180, "Sem título")
    if "icon" in body:
        data["icon"] = _text(body.get("icon"), 8, "📝")
    if "coverImage" in body or "cover_image" in body:
        data["cover_image"] = _text(body.get("coverImage") or body.get("cover_image"), 500) or None
    if "parentId" in body or "parent_id" in body:
        data["parent_id"] = body.get("parentId") or body.get("parent_id")
    if not data:
        return error("NO_FIELDS", "Nenhum campo válido enviado.", 400)
    data["updated_at"] = _utc_now()
    if query(get_db().table("workspace_pages").update(data).eq("id", page_id).eq("user_id", g.uid)) is None:
        return error("DB_ERROR", "Não foi possível atualizar a página.", 500)
    return success({"updated": True})


@workspace_routes.delete("/api/workspace/pages/<page_id>")
@auth_required
def archive_page(page_id: str):
    if query(get_db().table("workspace_pages").update({"is_archived": True, "updated_at": _utc_now()}).eq("id", page_id).eq("user_id", g.uid)) is None:
        return error("DB_ERROR", "Não foi possível arquivar a página.", 500)
    return success({"deleted": True})


@workspace_routes.post("/api/workspace/pages/<page_id>/blocks")
@auth_required
def create_block(page_id: str):
    body = request.get_json(silent=True) or {}
    btype = _status(body.get("type"), BLOCK_TYPES, "text")
    content = _text(body.get("content"), 8000)
    try:
        position = int(body.get("order", body.get("position", 0)) or 0)
    except Exception:
        position = 0
    block_id = str(uuid4())
    payload = {
        "id": block_id,
        "user_id": g.uid,
        "page_id": page_id,
        "type": btype,
        "content": content,
        "position": position,
        "metadata": _json_obj(body.get("metadata")),
        "updated_at": _utc_now(),
    }
    if query(get_db().table("workspace_blocks").insert(payload)) is None:
        return error("DB_ERROR", "Não foi possível criar o bloco.", 500)
    query(get_db().table("workspace_pages").update({"updated_at": _utc_now()}).eq("id", page_id).eq("user_id", g.uid))
    block = fetch_one(query(get_db().table("workspace_blocks").select(_select_block_cols()).eq("id", block_id).eq("user_id", g.uid).limit(1))) or payload
    return success(block, status=201)


@workspace_routes.patch("/api/workspace/blocks/<block_id>")
@auth_required
def update_block(block_id: str):
    body = request.get_json(silent=True) or {}
    data = {}
    if "type" in body:
        data["type"] = _status(body.get("type"), BLOCK_TYPES, "text")
    if "content" in body:
        data["content"] = _text(body.get("content"), 8000)
    if "order" in body or "position" in body:
        try:
            data["position"] = int(body.get("order", body.get("position", 0)) or 0)
        except Exception:
            data["position"] = 0
    if "metadata" in body:
        data["metadata"] = _json_obj(body.get("metadata"))
    if not data:
        return error("NO_FIELDS", "Nenhum campo válido enviado.", 400)
    data["updated_at"] = _utc_now()
    if query(get_db().table("workspace_blocks").update(data).eq("id", block_id).eq("user_id", g.uid)) is None:
        return error("DB_ERROR", "Não foi possível atualizar o bloco.", 500)
    return success({"updated": True})


@workspace_routes.delete("/api/workspace/blocks/<block_id>")
@auth_required
def delete_block(block_id: str):
    if query(get_db().table("workspace_blocks").delete().eq("id", block_id).eq("user_id", g.uid)) is None:
        return error("DB_ERROR", "Não foi possível excluir o bloco.", 500)
    return success({"deleted": True})


@workspace_routes.patch("/api/workspace/pages/<page_id>/blocks/reorder")
@auth_required
def reorder_blocks(page_id: str):
    body = request.get_json(silent=True) or {}
    blocks = body.get("blocks") if isinstance(body.get("blocks"), list) else []
    for block in blocks:
        bid = block.get("id") if isinstance(block, dict) else None
        if not bid:
            continue
        try:
            pos = int(block.get("order", block.get("position", 0)) or 0)
        except Exception:
            pos = 0
        query(get_db().table("workspace_blocks").update({"position": pos, "updated_at": _utc_now()}).eq("id", bid).eq("page_id", page_id).eq("user_id", g.uid))
    query(get_db().table("workspace_pages").update({"updated_at": _utc_now()}).eq("id", page_id).eq("user_id", g.uid))
    return success({"updated": True})


def _extract_task_candidates(text: str) -> List[Dict[str, Any]]:
    chunks = re.split(r"[\n.;]+|(?:\s+e\s+)", text)
    tasks: List[Dict[str, Any]] = []
    seen = set()
    for raw in chunks:
        c = raw.strip(" -•\t")
        if len(c) < 4:
            continue
        if not ACTION_RE.search(c):
            continue
        title = c[:160]
        key = title.lower()
        if key in seen:
            continue
        seen.add(key)
        tasks.append({
            "title": title,
            "priority": _priority(None, c),
            "due_date": _parse_due_date(None, c),
            "status": "pending",
        })
        if len(tasks) >= 12:
            break
    return tasks


@workspace_routes.post("/api/workspace/pages/<page_id>/extract-tasks")
@auth_required
def extract_tasks_from_page(page_id: str):
    body = request.get_json(silent=True) or {}
    commit = bool(body.get("commit"))
    blocks = fetch_list(query(get_db().table("workspace_blocks").select("content").eq("user_id", g.uid).eq("page_id", page_id).order("position")))
    text = "\n".join(str(b.get("content") or "") for b in blocks)
    tasks = _extract_task_candidates(text)
    created = []
    if commit:
        for t in tasks:
            payload = {**t, "user_id": g.uid, "page_id": page_id, "updated_at": _utc_now()}
            res = query(get_db().table("workspace_tasks").insert(payload).select(_select_task_cols()).limit(1))
            created_row = fetch_one(res)
            created.append(created_row or payload)
            _insert_global_task(g.uid, payload)
    return success({"tasks": created if commit else tasks, "created": commit})
