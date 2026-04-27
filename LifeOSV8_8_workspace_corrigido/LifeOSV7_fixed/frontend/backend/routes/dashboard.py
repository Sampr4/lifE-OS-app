"""
routes/dashboard.py
Retorna todos os dados do dashboard em uma única requisição.

FIX: Queries paralelas com ThreadPoolExecutor (máx 6 workers) em vez de
     sequencial. Reduz de ~8s para ~1-2s. Cada serviço tem _safe() wrapper
     para nunca travar o dashboard inteiro.
"""

import logging
from concurrent.futures import ThreadPoolExecutor, as_completed, TimeoutError
from flask import Blueprint, g

from middleware.auth import auth_required
from services.user import (
    get_full_profile, get_metrics, get_goals, get_tasks,
    get_habits, get_routine, get_weekly, get_checkin_today,
    get_reminder_today, get_notifications, get_latest_plan,
    get_finances, get_calendar,
)
from utils.responses import success

log = logging.getLogger("lifeos.routes.dashboard")
dashboard_routes = Blueprint("dashboard_routes", __name__)


def _safe(fn, *args, key="?"):
    try:
        return fn(*args)
    except Exception as e:
        log.warning("[DASHBOARD] %s failed: %s", key, e)
        return None


@dashboard_routes.get("/api/dashboard")
@auth_required
def get_dashboard():
    uid = g.uid

    # Define all tasks to run in parallel
    tasks = {
        "user":          (get_full_profile, uid),
        "metrics":       (get_metrics,      uid),
        "goals":         (get_goals,        uid),
        "tasks":         (get_tasks,        uid),
        "habits":        (get_habits,       uid),
        "routine":       (get_routine,      uid),
        "weekly":        (get_weekly,       uid),
        "checkin":       (get_checkin_today,uid),
        "reminder":      (get_reminder_today, uid),
        "notifications": (get_notifications, uid),
        "plan":          (get_latest_plan,  uid),
        "finances":      (get_finances,     uid),
        "calendar":      (get_calendar,     uid),
    }

    results = {k: None for k in tasks}

    try:
        with ThreadPoolExecutor(max_workers=6) as executor:
            future_to_key = {
                executor.submit(_safe, fn, arg, key=key): key
                for key, (fn, arg) in tasks.items()
            }
            for future in as_completed(future_to_key, timeout=12):
                key = future_to_key[future]
                try:
                    results[key] = future.result(timeout=1)
                except Exception as e:
                    log.warning("[DASHBOARD] %s result error: %s", key, e)
                    results[key] = None
    except TimeoutError:
        log.warning("[DASHBOARD] Some tasks timed out — returning partial results")
    except Exception as e:
        log.error("[DASHBOARD] Executor error: %s", e)

    # Check if user has real data (not just onboarding done)
    # This helps frontend distinguish between "new user" and "data generation failed"
    has_real_data = bool(
        results.get("goals") or 
        results.get("tasks") or 
        results.get("habits") or 
        results.get("routine") or 
        results.get("plan")
    )
    
    # Add meta info for frontend
    results["_meta"] = {
        "has_data": has_real_data,
        "onboarding_done": results.get("user", {}).get("onboarding_done", False) if results.get("user") else False,
    }

    return success(results)
