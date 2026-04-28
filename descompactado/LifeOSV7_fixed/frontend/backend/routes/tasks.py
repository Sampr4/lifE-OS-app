"""
routes/tasks.py
Task CRUD endpoints.
"""
import logging
from flask import Blueprint, request, g
from middleware.auth    import auth_required
from services.user      import get_tasks
from utils.database     import get_db, query, fetch_one
from utils.dates        import today
from utils.responses    import success, error
from datetime           import datetime

log = logging.getLogger("lifeos.routes.tasks")
task_routes = Blueprint("task_routes", __name__)


@task_routes.get("/api/tasks")
@auth_required
def list_tasks():
    return success(get_tasks(g.uid))


@task_routes.post("/api/tasks")
@auth_required
def create_task():
    body  = request.get_json(silent=True) or {}
    title = str(body.get("title", "")).strip()
    if not title:
        return error("MISSING_FIELD", "title is required.", 400)

    res = query(
        get_db().table("tasks").insert({
            "user_id":  g.uid,
            "title":    title[:300],
            "category": str(body.get("category", "pessoal")),
            "priority": str(body.get("priority", "medium")),
            "due_date": body.get("due_date") or today(),
            "done":     False,
            "source":   "manual",
        }).select("*").single()
    )
    if not res or not res.data:
        return error("DB_ERROR", "Failed to create task.", 500)
    return success(res.data, status=201)


@task_routes.patch("/api/tasks/<tid>")
@auth_required
def update_task(tid):
    body    = request.get_json(silent=True) or {}
    allowed = {"title", "category", "priority", "due_date", "done"}
    data    = {k: v for k, v in body.items() if k in allowed}
    if not data:
        return error("NO_FIELDS", "No valid fields provided.", 400)
    if data.get("done") is True:
        data["done_at"] = datetime.utcnow().isoformat()
    query(get_db().table("tasks").update(data).eq("id", tid).eq("user_id", g.uid))
    return success({"updated": True})


@task_routes.delete("/api/tasks/<tid>")
@auth_required
def delete_task(tid):
    query(get_db().table("tasks").delete().eq("id", tid).eq("user_id", g.uid))
    return success({"deleted": True})
