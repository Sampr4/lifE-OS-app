"""
routes/agenda.py
Calendar events + Notes CRUD.
"""
from flask      import Blueprint, request, g
from datetime   import date
from middleware.auth import auth_required
from services.user   import get_calendar
from utils.database  import get_db, query
from services.data_generation import _insert_with_fallback, fetch_list
from utils.responses import success, error

agenda_routes = Blueprint("agenda_routes", __name__)


# ── Calendar Events ───────────────────────────────────────────

@agenda_routes.get("/api/calendar")
@agenda_routes.get("/api/agenda")
@auth_required
def list_calendar():
    return success(get_calendar(g.uid))


@agenda_routes.post("/api/calendar")
@agenda_routes.post("/api/agenda")
@auth_required
def create_event():
    body  = request.get_json(silent=True) or {}
    title = str(body.get("title", "")).strip()
    if not title:
        return error("MISSING_FIELD", "title is required.", 400)
    res = query(
        get_db().table("calendar_events").insert({
            "user_id":       g.uid,
            "title":         title[:200],
            "category":      str(body.get("category", "pessoal")),
            "event_date":    body.get("date", date.today().isoformat()),
            "event_time":    body.get("time"),
            "duration_text": str(body.get("duration", ""))[:50],
            "notes":         str(body.get("notes", ""))[:500],
            "source":        "manual",
        }).select("*").single()
    )
    return success(res.data if res else {}, status=201)


@agenda_routes.patch("/api/calendar/<eid>")
@auth_required
def update_event(eid):
    body    = request.get_json(silent=True) or {}
    allowed = {"title", "category", "event_date", "event_time", "duration_text", "notes"}
    data    = {k: v for k, v in body.items() if k in allowed}
    query(get_db().table("calendar_events").update(data).eq("id", eid).eq("user_id", g.uid))
    return success({"updated": True})


@agenda_routes.delete("/api/calendar/<eid>")
@auth_required
def delete_event(eid):
    query(get_db().table("calendar_events").delete().eq("id", eid).eq("user_id", g.uid))
    return success({"deleted": True})


# ── Notes ────────────────────────────────────────────────────

@agenda_routes.get("/api/notes")
@auth_required
def list_notes():
    res = fetch_list(query(
        get_db().table("notes")
                .select("id, title, body, tags, created_at, updated_at")
                .eq("user_id", g.uid)
                .order("updated_at", desc=True)
                .limit(50)
    ))
    return success(res)


@agenda_routes.post("/api/notes")
@auth_required
def create_note():
    body  = request.get_json(silent=True) or {}
    title = str(body.get("title", "")).strip()
    text  = str(body.get("text", body.get("body", ""))).strip()
    res   = query(
        get_db().table("notes").insert({
            "user_id": g.uid,
            "title":   title[:200],
            "body":    text[:5000],
            "tags":    body.get("tags", []),
        }).select("*").single()
    )
    return success(res.data if res else {}, status=201)


@agenda_routes.patch("/api/notes/<nid>")
@auth_required
def update_note(nid):
    body    = request.get_json(silent=True) or {}
    allowed = {"title", "body", "tags"}
    data    = {k: v for k, v in body.items() if k in allowed}
    query(get_db().table("notes").update(data).eq("id", nid).eq("user_id", g.uid))
    return success({"updated": True})


@agenda_routes.delete("/api/notes/<nid>")
@auth_required
def delete_note(nid):
    query(get_db().table("notes").delete().eq("id", nid).eq("user_id", g.uid))
    return success({"deleted": True})
