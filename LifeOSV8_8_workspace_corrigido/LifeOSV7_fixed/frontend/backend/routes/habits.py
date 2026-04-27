"""
routes/habits.py
Habits + habit log CRUD endpoints.
"""
from flask      import Blueprint, request, g
from datetime   import date, timedelta
from middleware.auth import auth_required
from services.user   import get_habits
from utils.database  import get_db, query
from services.data_generation import _insert_with_fallback, fetch_list, fetch_one
from utils.responses import success, error

habit_routes = Blueprint("habit_routes", __name__)


@habit_routes.get("/api/habits")
@auth_required
def list_habits():
    return success(get_habits(g.uid))


@habit_routes.post("/api/habits")
@auth_required
def create_habit():
    body = request.get_json(silent=True) or {}
    name = str(body.get("name", "")).strip()
    if not name:
        return error("MISSING_FIELD", "name is required.", 400)
    res = query(
        get_db().table("habits").insert({
            "user_id":        g.uid,
            "name":           name[:150],
            "icon":           str(body.get("icon", "⭐")),
            "goal_value":     float(body.get("goal_value", 1)),
            "goal_unit":      str(body.get("goal_unit", "vez")),
            "frequency_days": str(body.get("frequency_days", "all")),
            "sort_order":     99,
            "is_active":      True,
            "source":         "manual",
        }).select("*").single()
    )
    return success(res.data if res else {}, status=201)


@habit_routes.post("/api/habits/<hid>/log")
@auth_required
def log_habit(hid):
    body     = request.get_json(silent=True) or {}
    log_date = body.get("date", date.today().isoformat())
    done     = bool(body.get("done", True))

    # Try with 'done'; fall back to 'completed' if column doesn't exist
    res = query(get_db().table("habit_logs").upsert({
        "habit_id": hid,
        "user_id":  g.uid,
        "log_date": log_date,
        "done":     done,
    }, on_conflict="habit_id,log_date"))
    if res is None:
        query(get_db().table("habit_logs").upsert({
            "habit_id":  hid,
            "user_id":   g.uid,
            "log_date":  log_date,
            "completed": done,
        }, on_conflict="habit_id,log_date"))

    if done:
        _recalculate_streak(hid, g.uid)

    return success({"logged": True, "done": done, "date": log_date})


def _recalculate_streak(hid: str, uid: str):
    """Recalculates the current streak for a habit based on recent logs."""
    db = get_db()
    # Try 'done' column; fall back to 'completed'
    logs = fetch_list(query(
        db.table("habit_logs")
               .select("log_date, done")
               .eq("habit_id", hid)
               .eq("done", True)
               .order("log_date", desc=True)
               .limit(60)
    ))
    if not logs:
        logs = fetch_list(query(
            db.table("habit_logs")
                   .select("log_date, completed")
                   .eq("habit_id", hid)
                   .eq("completed", True)
                   .order("log_date", desc=True)
                   .limit(60)
        ))
    if not logs:
        return
    done_dates = {l.get("log_date") for l in logs}
    streak     = 0
    check_day  = date.today()
    while check_day.isoformat() in done_dates:
        streak   += 1
        check_day = check_day - timedelta(days=1)
    query(get_db().table("habits")
                  .update({"current_streak": streak})
                  .eq("id", hid).eq("user_id", uid))


@habit_routes.delete("/api/habits/<hid>")
@auth_required
def delete_habit(hid):
    query(get_db().table("habits")
                  .update({"is_active": False})
                  .eq("id", hid).eq("user_id", g.uid))
    return success({"deleted": True})
