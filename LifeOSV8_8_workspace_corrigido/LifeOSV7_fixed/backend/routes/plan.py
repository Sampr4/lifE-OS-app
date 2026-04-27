"""
routes/plan.py — LifeOS V8.3

D. Task and checkpoint mutations verify ownership through the full join chain.
   Returns 404 if record not found, 403 if ownership mismatch.

V8.3 NEW: GET /api/plan/current
  Returns the current week's structured plan data in a flat, UI-ready format:
    { week, tasks, habits, progress }
  This is the single endpoint the frontend dashboard must consume.
  All other /api/annual_plan/* endpoints remain for the Plano IA module.
"""

import logging
from datetime import date
from flask import Blueprint, g, request

from middleware.auth           import auth_required
from services.plan_persistence import (
    get_active_annual_plan,
    get_current_week_plan,
    resolve_current_plan_week,
    verify_user_owns_task,
    verify_user_owns_checkpoint,
)
from services.data_generation  import generate_initial_data
from utils.database            import get_db, query, fetch_one, fetch_list
from utils.responses           import success, error

log         = logging.getLogger("lifeos.routes.plan")
plan_routes = Blueprint("plan_routes", __name__)


# ── V8.3: NEW ENDPOINT ────────────────────────────────────────────────────────

@plan_routes.get("/api/plan/current")
@auth_required
def get_current_plan():
    """
    Returns the current week's plan data in a flat, UI-ready JSON format.

    Algorithm:
      1. Find active annual_plan for this user
      2. Resolve current month/week index from plan_start_date + elapsed days
      3. Fetch weekly_plan -> plan_tasks + plan_habits
      4. Compute progress = done_tasks / total_tasks * 100

    Response shape (always):
      {
        "week":     { "id": "...", "week_index": 1, "week_goal": "..." },
        "tasks":    [ { "id": "...", "title": "...", "done": false } ],
        "habits":   [ { "id": "...", "title": "...", "frequency": "daily" } ],
        "progress": 35
      }
    """
    db  = get_db()
    uid = g.uid

    # 1. Active annual plan
    ap = fetch_one(query(
        db.table("annual_plans")
          .select("id, plan_start_date")
          .eq("user_id", uid)
          .eq("is_active", True)
          .order("created_at", desc=True)
          .limit(1)
    ))
    if not ap or not ap.get("id"):
        return success({
            "week":     None,
            "tasks":    [],
            "habits":   [],
            "progress": 0,
            "message":  "Nenhum plano ativo encontrado. Complete o onboarding.",
        })

    annual_plan_id = ap["id"]

    # 2. Resolve current month/week from plan_start_date
    start_raw = ap.get("plan_start_date")
    try:
        start = date.fromisoformat(str(start_raw)[:10]) if start_raw else date.today()
    except ValueError:
        start = date.today()

    elapsed     = max(0, (date.today() - start).days)
    plan_week   = elapsed // 7
    month_index = min(12, plan_week // 4 + 1)
    week_index  = min(4,  plan_week % 4 + 1)

    # 3. Fetch monthly_plan row
    mp = fetch_one(query(
        db.table("monthly_plans")
          .select("id")
          .eq("annual_plan_id", annual_plan_id)
          .eq("month_index", month_index)
          .limit(1)
    ))
    if not mp or not mp.get("id"):
        return success({
            "week":     None,
            "tasks":    [],
            "habits":   [],
            "progress": 0,
            "message":  f"Mês {month_index} não encontrado no plano.",
        })

    # 4. Fetch weekly_plan row
    wp = fetch_one(query(
        db.table("weekly_plans")
          .select("id, week_index, week_goal")
          .eq("monthly_plan_id", mp["id"])
          .eq("week_index", week_index)
          .limit(1)
    ))
    if not wp or not wp.get("id"):
        return success({
            "week":     None,
            "tasks":    [],
            "habits":   [],
            "progress": 0,
            "message":  f"Semana {week_index} não encontrada no plano.",
        })

    wid = wp["id"]

    # 5. Fetch tasks and habits
    raw_tasks = fetch_list(query(
        db.table("plan_tasks")
          .select("id, title, status")
          .eq("weekly_plan_id", wid)
    ))
    raw_habits = fetch_list(query(
        db.table("plan_habits")
          .select("id, title")
          .eq("weekly_plan_id", wid)
    ))

    # 6. Normalise tasks — map status→done bool
    tasks = [
        {
            "id":    t.get("id", ""),
            "title": t.get("title", ""),
            "done":  t.get("status") == "done",
        }
        for t in (raw_tasks or [])
    ]

    # 7. Normalise habits
    habits = [
        {
            "id":        h.get("id", ""),
            "title":     h.get("title", ""),
            "frequency": "daily",
        }
        for h in (raw_habits or [])
    ]

    # 8. Compute progress (% of tasks done)
    total = len(tasks)
    done  = sum(1 for t in tasks if t["done"])
    progress = round((done / total * 100)) if total > 0 else 0

    return success({
        "week": {
            "id":         wid,
            "week_index": wp.get("week_index", week_index),
            "week_goal":  wp.get("week_goal", ""),
            "month_index": month_index,
        },
        "tasks":    tasks,
        "habits":   habits,
        "progress": progress,
    })


# ── Existing endpoints (unchanged) ────────────────────────────────────────────

@plan_routes.get("/api/annual_plan")
@auth_required
def get_annual_plan():
    plan = get_active_annual_plan(g.uid)
    if plan is None:
        return success({
            "plan":       None,
            "plan_ready": False,
            "message":    "Plano anual ainda não gerado. Complete o onboarding para gerar.",
        })
    return success({"plan": plan, "plan_ready": True})


@plan_routes.get("/api/annual_plan/current_week")
@auth_required
def get_current_week():
    week = get_current_week_plan(g.uid)
    if week is None:
        return success({
            "week":       None,
            "plan_ready": False,
            "message":    "Semana atual não encontrada no plano.",
        })
    return success({"week": week, "plan_ready": True})


@plan_routes.post("/api/annual_plan/regenerate")
@auth_required
def regenerate_annual_plan():
    db   = get_db()
    user = fetch_one(query(
        db.table("users").select("onboarding_done").eq("id", g.uid).limit(1)
    ))
    if not user or not user.get("onboarding_done"):
        return error("ONBOARDING_INCOMPLETE",
                     "Complete o onboarding antes de regenerar o plano.", 400)

    log.info("[PLAN] Regeneration requested uid=%s", g.uid)
    try:
        result = generate_initial_data(g.uid)
        return success({"message": "Plano regenerado com sucesso.", "generated": True, **result})
    except Exception as e:
        log.error("[PLAN] Regeneration failed uid=%s: %s", g.uid, e)
        return error("GENERATION_FAILED", "Falha ao regenerar o plano.", 500)


@plan_routes.patch("/api/annual_plan/task/<task_id>")
@auth_required
def update_plan_task(task_id: str):
    """
    D. Verifies ownership through the full join chain before mutating.
    """
    body   = request.get_json(silent=True) or {}
    status = body.get("status", "").strip()

    if status not in ("pending", "done", "skipped"):
        return error("INVALID_STATUS", "Status deve ser: pending, done, skipped.", 400)

    db = get_db()

    task = fetch_one(query(
        db.table("plan_tasks").select("id").eq("id", task_id).limit(1)
    ))
    if not task or not task.get("id"):
        return error("NOT_FOUND", "Tarefa não encontrada.", 404)

    if not verify_user_owns_task(g.uid, task_id):
        return error("FORBIDDEN", "Acesso não autorizado a esta tarefa.", 403)

    query(db.table("plan_tasks").update({"status": status}).eq("id", task_id))
    return success({"updated": True, "task_id": task_id, "status": status})


@plan_routes.patch("/api/annual_plan/checkpoint/<checkpoint_id>")
@auth_required
def update_plan_checkpoint(checkpoint_id: str):
    """
    D. Verifies ownership through the full join chain before mutating.
    """
    body    = request.get_json(silent=True) or {}
    is_done = bool(body.get("is_done", False))

    db = get_db()

    cp = fetch_one(query(
        db.table("plan_checkpoints").select("id").eq("id", checkpoint_id).limit(1)
    ))
    if not cp or not cp.get("id"):
        return error("NOT_FOUND", "Checkpoint não encontrado.", 404)

    if not verify_user_owns_checkpoint(g.uid, checkpoint_id):
        return error("FORBIDDEN", "Acesso não autorizado a este checkpoint.", 403)

    query(db.table("plan_checkpoints").update({"is_done": is_done}).eq("id", checkpoint_id))
    return success({"updated": True, "checkpoint_id": checkpoint_id, "is_done": is_done})
