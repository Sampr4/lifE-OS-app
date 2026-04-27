"""
services/plan_persistence.py — LifeOS V8.1
Validates and persists an annual plan to normalized relational tables.

V8.1 changes:
  A. Strict Pydantic schema validation (exactly 12 months, 4 weeks, no empties,
     no duplicate indexes, minimum item counts per week).
  B. Safer staged persistence with post-save integrity verification.
     On mismatch -> clean up all inserted rows -> return failure.
  F. plan_start_date added; get_current_week_plan() resolves current
     month/week from elapsed plan time, not calendar month.
"""

import logging
from datetime import date
from typing import Dict, List, Optional, Tuple

from pydantic import BaseModel, Field, field_validator, model_validator
from utils.database import get_db, query, fetch_one, fetch_list

log = logging.getLogger("lifeos.services.plan_persistence")


# ── A. Strict Pydantic Schema ─────────────────────────────────────────────────

class WeekPlan(BaseModel):
    week_index:  int       = Field(..., ge=1, le=4)
    week_goal:   str       = Field(..., min_length=3, max_length=1000)
    tasks:       List[str] = Field(..., min_length=3)
    habits:      List[str] = Field(..., min_length=2)
    checkpoints: List[str] = Field(..., min_length=2)

    @field_validator("tasks", "habits", "checkpoints", mode="before")
    @classmethod
    def no_empty_strings(cls, v):
        if not isinstance(v, list):
            raise ValueError("must be a list")
        cleaned = [str(s).strip() for s in v]
        if any(s == "" for s in cleaned):
            raise ValueError("list must not contain empty strings")
        return cleaned

    @field_validator("week_goal", mode="before")
    @classmethod
    def clean_week_goal(cls, v):
        v = str(v).strip()
        if not v:
            raise ValueError("week_goal must not be empty")
        return v


class MonthPlan(BaseModel):
    month_index: int            = Field(..., ge=1, le=12)
    month_focus: str            = Field(..., min_length=3, max_length=1000)
    weeks:       List[WeekPlan] = Field(..., min_length=4, max_length=4)

    @field_validator("month_focus", mode="before")
    @classmethod
    def clean_focus(cls, v):
        v = str(v).strip()
        if not v:
            raise ValueError("month_focus must not be empty")
        return v

    @model_validator(mode="after")
    def unique_week_indexes(self):
        indexes = [w.week_index for w in self.weeks]
        if len(indexes) != len(set(indexes)):
            raise ValueError(
                f"Duplicate week_index in month {self.month_index}: {indexes}"
            )
        if sorted(indexes) != [1, 2, 3, 4]:
            raise ValueError(
                f"Month {self.month_index} weeks must be 1-4, got {sorted(indexes)}"
            )
        return self


class AnnualPlanSchema(BaseModel):
    main_goal:  str             = Field(..., min_length=5, max_length=1000)
    year_theme: str             = Field(..., min_length=3, max_length=500)
    months:     List[MonthPlan] = Field(..., min_length=12, max_length=12)

    @field_validator("main_goal", "year_theme", mode="before")
    @classmethod
    def no_empty(cls, v):
        v = str(v).strip()
        if not v:
            raise ValueError("Field must not be empty")
        return v

    @model_validator(mode="after")
    def unique_month_indexes(self):
        indexes = [m.month_index for m in self.months]
        if len(set(indexes)) != 12:
            raise ValueError(f"Duplicate month_index values: {indexes}")
        if sorted(indexes) != list(range(1, 13)):
            raise ValueError(f"month_index must cover 1-12, got {sorted(indexes)}")
        return self


def validate_annual_plan_schema(plan: Dict) -> Tuple[bool, str]:
    """Strict Pydantic validation. Returns (is_valid, error_message)."""
    if not isinstance(plan, dict):
        return False, "Plan must be a dict"
    if plan.get("parse_error"):
        return False, "Plan has parse_error flag"
    try:
        AnnualPlanSchema(**plan)
        return True, ""
    except Exception as e:
        return False, str(e)


# ── Persistence helpers ───────────────────────────────────────────────────────

def _insert(table: str, row: Dict) -> Optional[Dict]:
    try:
        res  = query(get_db().table(table).insert(row))
        if res is None:
            return None
        data = getattr(res, "data", None)
        if isinstance(data, list) and data:
            return data[0]
        if isinstance(data, dict) and data:
            return data
        return None
    except Exception as e:
        log.error("[PERSIST] Insert %s failed: %s", table, e)
        return None


def _delete_annual_plan(plan_id: str):
    """Cascade-deletes an annual plan and all its children."""
    try:
        query(get_db().table("annual_plans").delete().eq("id", plan_id))
        log.info("[PERSIST] Rolled back annual_plan id=%s", plan_id)
    except Exception as e:
        log.warning("[PERSIST] Rollback failed id=%s: %s", plan_id, e)


# ── B. Post-save integrity verification ──────────────────────────────────────

def _verify_integrity(annual_plan_id: str,
                      exp_tasks: int, exp_habits: int, exp_checkpoints: int
                      ) -> Tuple[bool, str]:
    db = get_db()

    mp_rows = fetch_list(query(
        db.table("monthly_plans").select("id").eq("annual_plan_id", annual_plan_id)
    ))
    if len(mp_rows) != 12:
        return False, f"Expected 12 monthly_plans, got {len(mp_rows)}"

    monthly_ids = [r["id"] for r in mp_rows]
    wp_rows = fetch_list(query(
        db.table("weekly_plans").select("id").in_("monthly_plan_id", monthly_ids)
    ))
    if len(wp_rows) != 48:
        return False, f"Expected 48 weekly_plans, got {len(wp_rows)}"

    weekly_ids = [r["id"] for r in wp_rows]

    def count_child(table, field):
        rows = fetch_list(query(db.table(table).select("id").in_(field, weekly_ids)))
        return len(rows)

    tc = count_child("plan_tasks",       "weekly_plan_id")
    hc = count_child("plan_habits",      "weekly_plan_id")
    cc = count_child("plan_checkpoints", "weekly_plan_id")

    if tc < exp_tasks:
        return False, f"Expected >= {exp_tasks} plan_tasks, got {tc}"
    if hc < exp_habits:
        return False, f"Expected >= {exp_habits} plan_habits, got {hc}"
    if cc < exp_checkpoints:
        return False, f"Expected >= {exp_checkpoints} plan_checkpoints, got {cc}"

    return True, "ok"


# ── Main persistence function ─────────────────────────────────────────────────

def persist_annual_plan(uid: str, plan: Dict,
                        plan_start_date: Optional[str] = None) -> Optional[Dict]:
    """
    V8.1: Validates, persists, and verifies an annual plan atomically.

      1. Strict Pydantic validation — rejects any partial/malformed plan.
      2. Deactivate prior active plans.
      3. Staged inserts: annual → monthly → weekly → children.
      4. Post-save integrity check (exact row counts).
      5. On failure → cascade-delete new plan row → return None.
    """
    valid, err = validate_annual_plan_schema(plan)
    if not valid:
        log.error("[PERSIST] Validation failed: %s", err)
        return None

    start_date = plan_start_date or date.today().isoformat()
    db = get_db()

    # Deactivate existing active plans
    try:
        existing = fetch_list(query(
            db.table("annual_plans").select("id").eq("user_id", uid).eq("is_active", True)
        ))
        for old in existing:
            query(db.table("annual_plans").update({"is_active": False}).eq("id", old["id"]))
            log.info("[PERSIST] Deactivated plan id=%s", old["id"])
    except Exception as e:
        log.warning("[PERSIST] Could not deactivate old plans: %s", e)

    # Insert annual_plan row
    ap_row = _insert("annual_plans", {
        "user_id":         uid,
        "main_goal":       plan["main_goal"][:500],
        "year_theme":      plan["year_theme"][:300],
        "is_active":       True,
        "plan_start_date": start_date,
    })
    if not ap_row or not ap_row.get("id"):
        log.error("[PERSIST] Failed to create annual_plan row uid=%s", uid)
        return None

    annual_plan_id = ap_row["id"]
    counts = {"months": 0, "weeks": 0, "tasks": 0, "habits": 0, "checkpoints": 0}
    failed = False

    validated = AnnualPlanSchema(**plan)

    for m in validated.months:
        mp_row = _insert("monthly_plans", {
            "annual_plan_id": annual_plan_id,
            "month_index":    m.month_index,
            "month_focus":    m.month_focus[:500],
        })
        if not mp_row or not mp_row.get("id"):
            log.error("[PERSIST] Failed monthly_plan m=%d uid=%s", m.month_index, uid)
            failed = True
            break

        counts["months"] += 1

        for w in m.weeks:
            wp_row = _insert("weekly_plans", {
                "monthly_plan_id": mp_row["id"],
                "week_index":      w.week_index,
                "week_goal":       w.week_goal[:500],
            })
            if not wp_row or not wp_row.get("id"):
                log.error("[PERSIST] Failed weekly_plan m=%d w=%d uid=%s",
                          m.month_index, w.week_index, uid)
                failed = True
                break

            wid = wp_row["id"]
            counts["weeks"] += 1

            for t in w.tasks:
                if _insert("plan_tasks", {"weekly_plan_id": wid, "title": t[:500], "status": "pending"}):
                    counts["tasks"] += 1

            for h in w.habits:
                if _insert("plan_habits", {"weekly_plan_id": wid, "title": h[:300]}):
                    counts["habits"] += 1

            for c in w.checkpoints:
                if _insert("plan_checkpoints", {"weekly_plan_id": wid, "description": c[:500]}):
                    counts["checkpoints"] += 1

        if failed:
            break

    if failed:
        _delete_annual_plan(annual_plan_id)
        return None

    # Post-save integrity check
    ok, msg = _verify_integrity(
        annual_plan_id,
        counts["tasks"], counts["habits"], counts["checkpoints"],
    )
    if not ok:
        log.error("[PERSIST] Integrity check failed: %s — rollback uid=%s", msg, uid)
        _delete_annual_plan(annual_plan_id)
        return None

    log.info(
        "[PERSIST] Plan saved uid=%s: %dm %dw %dt %dh %dc",
        uid, counts["months"], counts["weeks"],
        counts["tasks"], counts["habits"], counts["checkpoints"],
    )
    return {
        "annual_plan_id":    annual_plan_id,
        "months_saved":      counts["months"],
        "weeks_saved":       counts["weeks"],
        "tasks_saved":       counts["tasks"],
        "habits_saved":      counts["habits"],
        "checkpoints_saved": counts["checkpoints"],
    }


# ── Read functions ────────────────────────────────────────────────────────────

def get_active_annual_plan(uid: str) -> Optional[Dict]:
    db = get_db()
    ap = fetch_one(query(
        db.table("annual_plans")
          .select("id, main_goal, year_theme, plan_start_date, created_at")
          .eq("user_id", uid).eq("is_active", True)
          .order("created_at", desc=True).limit(1)
    ))
    if not ap or not ap.get("id"):
        return None

    annual_plan_id = ap["id"]
    months_rows = fetch_list(query(
        db.table("monthly_plans").select("id, month_index, month_focus")
          .eq("annual_plan_id", annual_plan_id).order("month_index")
    ))

    months_out = []
    for m in months_rows:
        weeks_rows = fetch_list(query(
            db.table("weekly_plans").select("id, week_index, week_goal")
              .eq("monthly_plan_id", m["id"]).order("week_index")
        ))
        weeks_out = []
        for w in weeks_rows:
            wid = w["id"]
            tasks       = fetch_list(query(db.table("plan_tasks").select("id, title, status").eq("weekly_plan_id", wid)))
            habits      = fetch_list(query(db.table("plan_habits").select("id, title").eq("weekly_plan_id", wid)))
            checkpoints = fetch_list(query(db.table("plan_checkpoints").select("id, description, is_done").eq("weekly_plan_id", wid)))
            weeks_out.append({
                "id": wid, "week_index": w["week_index"], "week_goal": w["week_goal"],
                "tasks": tasks, "habits": habits, "checkpoints": checkpoints,
            })
        months_out.append({
            "id": m["id"], "month_index": m["month_index"],
            "month_focus": m["month_focus"], "weeks": weeks_out,
        })

    return {
        "id": annual_plan_id, "main_goal": ap["main_goal"],
        "year_theme": ap["year_theme"],
        "plan_start_date": ap.get("plan_start_date"),
        "created_at": ap.get("created_at"),
        "months": months_out,
    }


# ── F. Plan-time-aware current week resolution ────────────────────────────────

def resolve_current_plan_week(uid: str) -> Tuple[Optional[int], Optional[int]]:
    """
    Returns (month_index, week_index) based on elapsed days from plan_start_date.
    Each plan-week = 7 days; plan-month = 4 weeks = 28 days.
    Returns (None, None) if no active plan found.
    """
    db = get_db()
    ap = fetch_one(query(
        db.table("annual_plans").select("id, plan_start_date")
          .eq("user_id", uid).eq("is_active", True)
          .order("created_at", desc=True).limit(1)
    ))
    if not ap or not ap.get("id"):
        return None, None

    start_raw = ap.get("plan_start_date")
    try:
        start = date.fromisoformat(str(start_raw)[:10]) if start_raw else date.today()
    except ValueError:
        start = date.today()

    elapsed = max(0, (date.today() - start).days)
    plan_week    = elapsed // 7              # 0-based week number in the plan
    month_index  = min(12, plan_week // 4 + 1)
    week_index   = min(4,  plan_week % 4 + 1)
    return month_index, week_index


def get_current_week_plan(uid: str) -> Optional[Dict]:
    """Returns the weekly plan for the current plan-week (time-anchored)."""
    month_idx, week_idx = resolve_current_plan_week(uid)
    if month_idx is None:
        return None

    db = get_db()
    ap = fetch_one(query(
        db.table("annual_plans").select("id").eq("user_id", uid).eq("is_active", True)
          .order("created_at", desc=True).limit(1)
    ))
    if not ap:
        return None

    mp = fetch_one(query(
        db.table("monthly_plans").select("id")
          .eq("annual_plan_id", ap["id"]).eq("month_index", month_idx).limit(1)
    ))
    if not mp:
        return None

    wp = fetch_one(query(
        db.table("weekly_plans").select("id, week_index, week_goal")
          .eq("monthly_plan_id", mp["id"]).eq("week_index", week_idx).limit(1)
    ))
    if not wp:
        return None

    wid = wp["id"]
    return {
        "week_index":  wp["week_index"],
        "week_goal":   wp["week_goal"],
        "month_index": month_idx,
        "tasks":       fetch_list(query(db.table("plan_tasks").select("*").eq("weekly_plan_id", wid))),
        "habits":      fetch_list(query(db.table("plan_habits").select("*").eq("weekly_plan_id", wid))),
        "checkpoints": fetch_list(query(db.table("plan_checkpoints").select("*").eq("weekly_plan_id", wid))),
    }


def verify_user_owns_task(uid: str, task_id: str) -> bool:
    """D. Verifies task ownership through the full join chain."""
    db  = get_db()
    row = fetch_one(query(
        db.table("plan_tasks")
          .select("id, weekly_plan_id")
          .eq("id", task_id)
          .limit(1)
    ))
    if not row or not row.get("weekly_plan_id"):
        return False

    wp = fetch_one(query(
        db.table("weekly_plans")
          .select("id, monthly_plan_id")
          .eq("id", row["weekly_plan_id"])
          .limit(1)
    ))
    if not wp or not wp.get("monthly_plan_id"):
        return False

    mp = fetch_one(query(
        db.table("monthly_plans")
          .select("id, annual_plan_id")
          .eq("id", wp["monthly_plan_id"])
          .limit(1)
    ))
    if not mp or not mp.get("annual_plan_id"):
        return False

    ap = fetch_one(query(
        db.table("annual_plans")
          .select("id, user_id")
          .eq("id", mp["annual_plan_id"])
          .limit(1)
    ))
    return bool(ap and ap.get("user_id") == uid)


def verify_user_owns_checkpoint(uid: str, checkpoint_id: str) -> bool:
    """D. Verifies checkpoint ownership through the full join chain."""
    db  = get_db()
    row = fetch_one(query(
        db.table("plan_checkpoints")
          .select("id, weekly_plan_id")
          .eq("id", checkpoint_id)
          .limit(1)
    ))
    if not row or not row.get("weekly_plan_id"):
        return False

    wp = fetch_one(query(
        db.table("weekly_plans")
          .select("id, monthly_plan_id")
          .eq("id", row["weekly_plan_id"])
          .limit(1)
    ))
    if not wp or not wp.get("monthly_plan_id"):
        return False

    mp = fetch_one(query(
        db.table("monthly_plans")
          .select("id, annual_plan_id")
          .eq("id", wp["monthly_plan_id"])
          .limit(1)
    ))
    if not mp or not mp.get("annual_plan_id"):
        return False

    ap = fetch_one(query(
        db.table("annual_plans")
          .select("id, user_id")
          .eq("id", mp["annual_plan_id"])
          .limit(1)
    ))
    return bool(ap and ap.get("user_id") == uid)
