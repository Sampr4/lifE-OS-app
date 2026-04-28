"""
routes/dashboard_current.py — LifeOS V8.4

GET /api/dashboard/current

Single endpoint that returns ALL data the dashboard UI needs.
This is the ONE source of truth for the dashboard — no legacy
variables, no TASKS/HABITS/GOALS arrays, no METRICS, no WEEKLY.

Data flow:
  annual_plans → monthly_plans → weekly_plans → plan_tasks / plan_habits

Every field is safe (never None/undefined) — guaranteed by this layer.
"""

import logging
from datetime import date, timedelta
from typing   import Dict, List, Optional

from flask import Blueprint, g

from middleware.auth  import auth_required
from utils.database   import get_db, query, fetch_one, fetch_list
from utils.responses  import success, error

log = logging.getLogger("lifeos.routes.dashboard_current")
dashboard_current_routes = Blueprint("dashboard_current_routes", __name__)


# ── helpers ───────────────────────────────────────────────────────────────────

def _safe_str(v, default: str = "") -> str:
    return str(v).strip() if v is not None else default


def _safe_int(v, default: int = 0) -> int:
    try:
        return int(v) if v is not None else default
    except (TypeError, ValueError):
        return default


def _resolve_week_indexes(start_raw) -> tuple:
    """Return (month_index 1-12, week_index 1-4) from plan_start_date."""
    try:
        start = date.fromisoformat(str(start_raw)[:10]) if start_raw else date.today()
    except ValueError:
        start = date.today()
    elapsed     = max(0, (date.today() - start).days)
    plan_week   = elapsed // 7
    month_index = min(12, plan_week // 4 + 1)
    week_index  = min(4,  plan_week % 4 + 1)
    return month_index, week_index


def _ui_message(progress: int, profession: str = "") -> str:
    """Build a motivational message based on progress (never empty)."""
    if progress >= 70:
        return "Excelente progresso! Continue com esse ritmo 🔥"
    if progress >= 30:
        return "Você está evoluindo. Cada passo conta 💪"
    if progress > 0:
        return "Bom começo. Vamos focar nas tarefas de hoje ✨"
    return "Novo ciclo começando. Hora de agir 🚀"


# ── main endpoint ─────────────────────────────────────────────────────────────

@dashboard_current_routes.get("/api/dashboard/current")
@auth_required
def get_dashboard_current():
    """
    Returns a complete, UI-ready dashboard payload.

    Response shape (all fields always present, never undefined):
    {
      "user":    { name, profession },
      "week":    { week_index, month_index, goal },
      "tasks":   [ { id, title, done } ],
      "habits":  [ { id, title, frequency } ],
      "progress": 45,
      "stats":   { tasks_done, tasks_total, habits_total, streak_days },
      "ui":      { message, pending_tasks }
    }
    """
    db  = get_db()
    uid = g.uid

    # V8.6.1: Mandatory hit-log so we can prove in logs which route is active
    log.info("[DASHBOARD/CURRENT] HIT uid=%s", uid)

    # ── 1. User profile ────────────────────────────────────────────────────────
    u = fetch_one(query(
        db.table("users")
          .select("id, name, onboarding_done")
          .eq("id", uid).limit(1)
    )) or {}

    p = fetch_one(query(
        db.table("user_profiles")
          .select("profession, profession_type, current_streak")
          .eq("user_id", uid).limit(1)
    )) or {}

    user_name       = _safe_str(u.get("name"), "Usuário")
    profession      = _safe_str(p.get("profession"))
    streak_days     = _safe_int(p.get("current_streak"))

    # ── 2. Active annual plan ──────────────────────────────────────────────────
    ap = fetch_one(query(
        db.table("annual_plans")
          .select("id, plan_start_date, main_goal, year_theme")
          .eq("user_id", uid)
          .eq("is_active", True)
          .order("created_at", desc=True)
          .limit(1)
    ))

    # If no plan exists, return a safe empty dashboard (no crashes, no undefined)
    if not ap or not ap.get("id"):
        return success({
            "user":     {"name": user_name, "profession": profession},
            "week":     {"week_index": 1, "month_index": 1, "goal": ""},
            "tasks":    [],
            "habits":   [],
            "progress": 0,
            "stats":    {"tasks_done": 0, "tasks_total": 0,
                         "habits_total": 0, "streak_days": streak_days},
            "ui":       {"message": "Complete o onboarding para gerar seu plano. 📋",
                         "pending_tasks": 0},
        })

    annual_plan_id = ap["id"]
    month_index, week_index = _resolve_week_indexes(ap.get("plan_start_date"))

    # ── 3. Monthly plan ────────────────────────────────────────────────────────
    mp = fetch_one(query(
        db.table("monthly_plans")
          .select("id, month_focus")
          .eq("annual_plan_id", annual_plan_id)
          .eq("month_index", month_index)
          .limit(1)
    ))

    if not mp or not mp.get("id"):
        # Plan exists but this month's row is missing (edge case)
        return success({
            "user":     {"name": user_name, "profession": profession},
            "week":     {"week_index": week_index,
                         "month_index": month_index, "goal": ""},
            "tasks":    [],
            "habits":   [],
            "progress": 0,
            "stats":    {"tasks_done": 0, "tasks_total": 0,
                         "habits_total": 0, "streak_days": streak_days},
            "ui":       {"message": "Plano ainda sendo configurado…",
                         "pending_tasks": 0},
        })

    # ── 4. Weekly plan ─────────────────────────────────────────────────────────
    wp = fetch_one(query(
        db.table("weekly_plans")
          .select("id, week_index, week_goal")
          .eq("monthly_plan_id", mp["id"])
          .eq("week_index", week_index)
          .limit(1)
    ))

    if not wp or not wp.get("id"):
        return success({
            "user":     {"name": user_name, "profession": profession},
            "week":     {"week_index": week_index,
                         "month_index": month_index, "goal": ""},
            "tasks":    [],
            "habits":   [],
            "progress": 0,
            "stats":    {"tasks_done": 0, "tasks_total": 0,
                         "habits_total": 0, "streak_days": streak_days},
            "ui":       {"message": "Semana atual não encontrada no plano.",
                         "pending_tasks": 0},
        })

    wid       = wp["id"]
    week_goal = _safe_str(wp.get("week_goal"))

    # ── 5. Tasks (plan_tasks) ──────────────────────────────────────────────────
    raw_tasks = fetch_list(query(
        db.table("plan_tasks")
          .select("id, title, status")
          .eq("weekly_plan_id", wid)
    )) or []

    tasks = [
        {
            "id":    _safe_str(t.get("id")),
            "title": _safe_str(t.get("title")),
            "done":  t.get("status") == "done",
        }
        for t in raw_tasks
    ]

    # ── 6. Habits (plan_habits) ────────────────────────────────────────────────
    raw_habits = fetch_list(query(
        db.table("plan_habits")
          .select("id, title")
          .eq("weekly_plan_id", wid)
    )) or []

    habits = [
        {
            "id":        _safe_str(h.get("id")),
            "title":     _safe_str(h.get("title")),
            "frequency": "daily",
        }
        for h in raw_habits
    ]

    # ── 7. Progress calculation ────────────────────────────────────────────────
    tasks_total = len(tasks)
    tasks_done  = sum(1 for t in tasks if t["done"])
    progress    = round((tasks_done / tasks_total) * 100) if tasks_total > 0 else 0
    pending     = tasks_total - tasks_done

    # ── 8. UI message (safe, never empty) ─────────────────────────────────────
    message = _ui_message(progress, profession)

    log.info(
        "[DASH/CURRENT] uid=%s month=%d week=%d tasks=%d done=%d progress=%d%%",
        uid, month_index, week_index, tasks_total, tasks_done, progress,
    )

    return success({
        "user": {
            "name":       user_name,
            "profession": profession,
        },
        "week": {
            "week_index":  week_index,
            "month_index": month_index,
            "goal":        week_goal,
        },
        "tasks":    tasks,
        "habits":   habits,
        "progress": progress,
        "stats": {
            "tasks_done":   tasks_done,
            "tasks_total":  tasks_total,
            "habits_total": len(habits),
            "streak_days":  streak_days,
        },
        "ui": {
            "message":      message,
            "pending_tasks": pending,
        },
    })
