"""
routes/routine.py  —  LifeOS v8.7
Daily routine + log toggle endpoints.

FIX v8.7: Added /api/routine/current that reads from plan_tasks (structured plan)
           first, then falls back to legacy flat routine_templates table.
           Logs clearly which source feeds the screen.
"""
import logging
from flask      import Blueprint, request, g
from datetime   import date
from middleware.auth import auth_required
from services.user   import get_routine
from utils.database  import get_db, query
from services.data_generation import _insert_with_fallback, fetch_one, fetch_list
from utils.responses import success, error

routine_routes = Blueprint("routine_routes", __name__)
log = logging.getLogger("lifeos.routes.routine")


# ─── CURRENT-WEEK ROUTINE (primary screen source v8.7) ────────
@routine_routes.get("/api/routine/current")
@auth_required
def get_current_routine():
    """
    Returns current week's tasks from the STRUCTURED annual plan (plan_tasks).
    Falls back to legacy flat routine_templates table if structured plan is missing.
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
        # Step 2: Find current weekly_plan
        today_str = date.today().isoformat()
        weekly_plan = fetch_one(query(
            db.table("weekly_plans")
              .select("id, week_start, week_number, focus_theme, weekly_goal")
              .eq("annual_plan_id", annual_plan["id"])
              .lte("week_start", today_str)
              .order("week_start", desc=True)
              .limit(1)
        ))

        if weekly_plan and weekly_plan.get("id"):
            weekly_plan_id = weekly_plan["id"]

            # Step 3: Read plan_tasks for this week
            plan_tasks = fetch_list(query(
                db.table("plan_tasks")
                  .select("id, title, category, priority, time_of_day, description")
                  .eq("weekly_plan_id", weekly_plan_id)
                  .order("time_of_day")
                  .limit(10)
            ))

            if plan_tasks:
                log.info(
                    "[ROUTINE/CURRENT] uid=%s weekly_plan_id=%s count=%d source=plan_tasks",
                    uid, weekly_plan_id, len(plan_tasks)
                )
                # Check today's completion logs
                today_iso = date.today().isoformat()
                task_ids  = [t["id"] for t in plan_tasks]
                logs = fetch_list(query(
                    db.table("routine_daily_logs")
                      .select("template_id, done")
                      .in_("template_id", task_ids)
                      .eq("log_date", today_iso)
                ))
                done_ids = {l["template_id"] for l in logs if l.get("done")}

                return success([{
                    "id":    t["id"],
                    "time":  str(t.get("time_of_day", "") or "")[:5],
                    "text":  t.get("title", ""),
                    "cat":   t.get("category", "trabalho"),
                    "done":  t["id"] in done_ids,
                    "desc":  t.get("description", ""),
                    "source": "plan_tasks",
                    "focus": weekly_plan.get("focus_theme", ""),
                    "weekly_goal": weekly_plan.get("weekly_goal", ""),
                } for t in plan_tasks])

            log.warning(
                "[ROUTINE/CURRENT] weekly_plan_id=%s found but plan_tasks empty uid=%s",
                weekly_plan_id, uid
            )

    # Fallback: legacy flat routine_templates
    log.warning("[ROUTINE/LEGACY] using flat routine source uid=%s", uid)
    flat = get_routine(uid)
    for r in flat:
        r["source"] = "routine_flat"
    return success(flat)


# ─── Standard CRUD ─────────────────────────────────────────────
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
