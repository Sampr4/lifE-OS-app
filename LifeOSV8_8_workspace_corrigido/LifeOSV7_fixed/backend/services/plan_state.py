"""
services/plan_state.py — LifeOS V8.2
Single source of truth for plan readiness and state.

D. Replaces the legacy "plans" table check used by first-login-data.
   User readiness is now determined by structured annual plan state,
   not by existence of a row in the old "plans" table.

B/C. All plan-state reads go through here — no competing logic paths.
"""

import logging
from typing import Dict, Optional

from utils.database import get_db, query, fetch_one, fetch_list
from services.plan_persistence import get_active_annual_plan

log = logging.getLogger("lifeos.services.plan_state")


def get_plan_readiness(uid: str) -> Dict:
    """
    D. Returns the complete plan readiness state for a user.

    Fields:
      onboarding_done   — user completed onboarding questions
      annual_plan_ready — an active annual_plan row exists with 12 months
      plan_id           — id of active annual plan (or None)
      months_count      — number of monthly_plans found (0 if none)
      message           — human-readable state summary
      ready             — True only when both onboarding + annual plan are valid

    This is the ONLY function that should gate first-login and plan-state checks.
    """
    db = get_db()

    # 1. Check onboarding
    user = fetch_one(query(
        db.table("users")
          .select("onboarding_done")
          .eq("id", uid)
          .limit(1)
    ))
    onboarding_done = bool((user or {}).get("onboarding_done", False))

    if not onboarding_done:
        return {
            "ready":              False,
            "onboarding_done":    False,
            "annual_plan_ready":  False,
            "plan_id":            None,
            "months_count":       0,
            "message":            "Onboarding não concluído.",
        }

    # 2. Check structured annual plan
    ap = fetch_one(query(
        db.table("annual_plans")
          .select("id")
          .eq("user_id", uid)
          .eq("is_active", True)
          .order("created_at", desc=True)
          .limit(1)
    ))

    if not ap or not ap.get("id"):
        return {
            "ready":              False,
            "onboarding_done":    True,
            "annual_plan_ready":  False,
            "plan_id":            None,
            "months_count":       0,
            "message":            "Plano anual ainda não gerado.",
        }

    annual_plan_id = ap["id"]

    # 3. Count monthly_plans to verify integrity
    mp_rows = fetch_list(query(
        db.table("monthly_plans")
          .select("id")
          .eq("annual_plan_id", annual_plan_id)
    ))
    months_count = len(mp_rows)
    annual_plan_ready = months_count == 12

    return {
        "ready":              annual_plan_ready,
        "onboarding_done":    True,
        "annual_plan_ready":  annual_plan_ready,
        "plan_id":            annual_plan_id,
        "months_count":       months_count,
        "message":            "Plano pronto." if annual_plan_ready
                              else f"Plano incompleto ({months_count}/12 meses).",
    }


def was_data_generated(uid: str) -> bool:
    """
    D/C. Returns True if the user already has a valid structured annual plan.
    Used by first-login-data to prevent double-generation.
    Replaces the old check against the legacy 'plans' table.
    """
    state = get_plan_readiness(uid)
    return state.get("annual_plan_ready", False)


def get_plan_summary_for_dashboard(uid: str) -> Optional[Dict]:
    """
    B. Returns the plan summary for the dashboard endpoint.
    Tries structured annual plan first; falls back to legacy 'plans' snapshot
    only if no structured plan exists (compatibility bridge, not a competing truth).
    """
    db = get_db()

    # Primary: structured annual plan summary
    ap = fetch_one(query(
        db.table("annual_plans")
          .select("id, main_goal, year_theme, plan_start_date, created_at")
          .eq("user_id", uid)
          .eq("is_active", True)
          .order("created_at", desc=True)
          .limit(1)
    ))

    if ap and ap.get("id"):
        return {
            "source":           "structured",
            "annual_plan_id":   ap["id"],
            "main_goal":        ap.get("main_goal", ""),
            "year_theme":       ap.get("year_theme", ""),
            "plan_start_date":  ap.get("plan_start_date"),
            "created_at":       ap.get("created_at"),
        }

    # Compatibility fallback: legacy 'plans' snapshot
    # This branch is reached only for users who have NOT yet regenerated since V8.
    legacy = fetch_one(query(
        db.table("plans")
          .select("content, created_at")
          .eq("user_id", uid)
          .order("created_at", desc=True)
          .limit(1)
    ))
    if legacy and legacy.get("content"):
        content = legacy["content"]
        return {
            "source":    "legacy",
            "summary":   content.get("summary", ""),
            "message":   content.get("motivational_message", ""),
            "created_at": legacy.get("created_at"),
        }

    return None
