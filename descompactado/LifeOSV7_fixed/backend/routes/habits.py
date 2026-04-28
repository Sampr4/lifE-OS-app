"""
routes/habits.py  —  LifeOS v8.7
Habits + habit log CRUD endpoints.

FIX v8.7: Added /api/habits/current that reads from plan_habits (structured plan)
           first, then falls back to legacy flat habits table.
           Logs clearly which source feeds the screen.
"""
import logging
from flask      import Blueprint, request, g
from datetime   import date, timedelta
from middleware.auth import auth_required
from services.user   import get_habits
from utils.database  import get_db, query
from services.data_generation import _insert_with_fallback, fetch_list, fetch_one
from utils.responses import success, error

habit_routes = Blueprint("habit_routes", __name__)
log = logging.getLogger("lifeos.routes.habits")


# ─── CURRENT-WEEK HABITS (primary screen source v8.7) ─────────
@habit_routes.get("/api/habits/current")
@auth_required
def get_current_habits():
    """
    Returns current week's habits from the STRUCTURED annual plan.
    Falls back to legacy flat habits table if no structured plan exists.
    """
    uid = g.uid
    db  = get_db()

    # Step 1: Find active annual plan
    annual_plan = fetch_one(query(
        db.table("annual_plans")
          .select("id, plan_start_date")
          .eq("user_id", uid)
          .eq("is_active", True)
          .order("created_at", desc=True)
          .limit(1)
    ))

    if annual_plan and annual_plan.get("id"):
        # Step 2: Find current weekly_plan (most recent past/current week)
        today_str = date.today().isoformat()
        weekly_plan = fetch_one(query(
            db.table("weekly_plans")
              .select("id, week_start, week_number, focus_theme")
              .eq("annual_plan_id", annual_plan["id"])
              .lte("week_start", today_str)
              .order("week_start", desc=True)
              .limit(1)
        ))

        if weekly_plan and weekly_plan.get("id"):
            weekly_plan_id = weekly_plan["id"]

            # Step 3: Read plan_habits for this week
            plan_habits = fetch_list(query(
                db.table("plan_habits")
                  .select("id, name, icon, goal_value, goal_unit, frequency_days, category")
                  .eq("weekly_plan_id", weekly_plan_id)
                  .order("created_at")
                  .limit(10)
            ))

            if plan_habits:
                log.info(
                    "[HABITS/CURRENT] uid=%s weekly_plan_id=%s count=%d source=plan_habits",
                    uid, weekly_plan_id, len(plan_habits)
                )
                # Enrich with 7-day logs
                hab_ids   = [h["id"] for h in plan_habits]
                seven_ago = (date.today() - timedelta(days=6)).isoformat()
                logs = fetch_list(query(
                    db.table("habit_logs")
                      .select("habit_id, log_date, done")
                      .in_("habit_id", hab_ids)
                      .gte("log_date", seven_ago)
                ))
                log_map = {}
                for l in logs:
                    log_map.setdefault(l["habit_id"], []).append(l)

                return success([{
                    "id":     h["id"],
                    "name":   h.get("name", ""),
                    "icon":   h.get("icon", "⭐"),
                    "goal":   float(h.get("goal_value", 1)),
                    "unit":   h.get("goal_unit", "vez"),
                    "streak": 0,
                    "best":   0,
                    "days":   [l["log_date"] for l in log_map.get(h["id"], []) if l.get("done")],
                    "source": "plan_habits",
                    "focus":  weekly_plan.get("focus_theme", ""),
                } for h in plan_habits])

            log.warning(
                "[HABITS/CURRENT] weekly_plan_id=%s found but plan_habits empty uid=%s",
                weekly_plan_id, uid
            )

    # Fallback: legacy flat habits table
    log.warning("[HABITS/LEGACY] using flat habits source uid=%s", uid)
    flat = get_habits(uid)
    for h in flat:
        h["source"] = "habits_flat"
    return success(flat)


# ─── Standard CRUD ─────────────────────────────────────────────
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
    db = get_db()
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
