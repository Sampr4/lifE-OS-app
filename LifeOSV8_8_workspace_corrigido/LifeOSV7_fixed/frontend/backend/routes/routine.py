"""
routes/routine.py
Daily routine templates + log toggle.
"""
from flask      import Blueprint, request, g
from datetime   import date
from middleware.auth import auth_required
from services.user   import get_routine
from utils.database  import get_db, query
from services.data_generation import _insert_with_fallback, fetch_one
from utils.responses import success, error

routine_routes = Blueprint("routine_routes", __name__)


@routine_routes.get("/api/routine")
@auth_required
def list_routine():
    return success(get_routine(g.uid))


@routine_routes.post("/api/routine")
@auth_required
def create_routine_item():
    body     = request.get_json(silent=True) or {}
    activity = str(body.get("activity", "")).strip()
    if not activity:
        return error("MISSING_FIELD", "activity is required.", 400)
    res = query(
        get_db().table("routine_templates").insert({
            "user_id":     g.uid,
            "time_of_day": str(body.get("time", "08:00"))[:5],
            "activity":    activity[:200],
            "category":    str(body.get("category", "pessoal")),
            "sort_order":  99,
            "is_active":   True,
            "source":      "manual",
        }).select("*").single()
    )
    return success(res.data if res else {}, status=201)


@routine_routes.post("/api/routine/<tid>/toggle")
@auth_required
def toggle_routine(tid):
    today_str = date.today().isoformat()
    db        = get_db()
    existing  = fetch_one(query(
        db.table("routine_daily_logs")
          .select("done")
          .eq("template_id", tid)
          .eq("log_date", today_str)
          .limit(1)
    ))
    new_done = not existing.get("done", False)
    query(db.table("routine_daily_logs").upsert({
        "user_id":     g.uid,
        "template_id": tid,
        "log_date":    today_str,
        "done":        new_done,
    }, on_conflict="template_id,log_date"))
    return success({"done": new_done})


@routine_routes.delete("/api/routine/<tid>")
@auth_required
def delete_routine_item(tid):
    query(get_db().table("routine_templates")
                  .update({"is_active": False})
                  .eq("id", tid).eq("user_id", g.uid))
    return success({"deleted": True})
