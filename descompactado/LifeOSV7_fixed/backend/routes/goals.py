"""
routes/goals.py
Goal CRUD endpoints.
"""
from flask import Blueprint, request, g
from middleware.auth import auth_required
from services.user   import get_goals
from utils.database  import get_db, query
from services.data_generation import _insert_with_fallback
from utils.responses import success, error

goal_routes = Blueprint("goal_routes", __name__)


@goal_routes.get("/api/goals")
@auth_required
def list_goals():
    return success(get_goals(g.uid))


@goal_routes.post("/api/goals")
@auth_required
def create_goal():
    body  = request.get_json(silent=True) or {}
    title = str(body.get("title", "")).strip()
    if not title:
        return error("MISSING_FIELD", "title is required.", 400)
    total = float(body.get("total_value", 100))
    db = get_db()
    res = _insert_with_fallback("goals", {
            "user_id":       g.uid,
            "title":         title[:200],
            "category":      str(body.get("category", "geral")),
            "current_value": float(body.get("current_value", 0)),
            "total_value":   total,
            "unit":          str(body.get("unit", "%")),
            "pct":           0,
            "deadline":      body.get("deadline"),
            "is_active":     True,
            "sort_order":    99,
            "source":        "manual",
        }, optional_keys=["source"])
    # Fetch the inserted row
    if res is None:
        from utils.database import fetch_one
        res = type("R", (), {"data": None})()
    if not res:
        return error("DB_ERROR", "Failed to create goal.", 500)
    return success(res.data, status=201)


@goal_routes.patch("/api/goals/<gid>")
@auth_required
def update_goal(gid):
    body    = request.get_json(silent=True) or {}
    allowed = {"title", "category", "current_value", "total_value", "unit", "pct", "deadline", "is_active"}
    data    = {k: v for k, v in body.items() if k in allowed}
    # Recalculate pct if values changed
    if "current_value" in data or "total_value" in data:
        cur   = float(data.get("current_value", 0))
        total = float(data.get("total_value", 100))
        data["pct"] = int(cur / total * 100) if total > 0 else 0
    query(get_db().table("goals").update(data).eq("id", gid).eq("user_id", g.uid))
    return success({"updated": True})


@goal_routes.delete("/api/goals/<gid>")
@auth_required
def delete_goal(gid):
    query(get_db().table("goals").update({"is_active": False}).eq("id", gid).eq("user_id", g.uid))
    return success({"deleted": True})
