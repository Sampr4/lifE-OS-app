"""
services/user.py
All user-facing data read services.
Each function is pure: uid in → data dict/list out.
No side effects. Safe to run in parallel.
"""

import logging
from typing import Dict, List, Optional
from datetime import date, timedelta

from utils.database import get_db, query, fetch_list, fetch_one
from utils.dates    import today, month_start, week_start

log = logging.getLogger("lifeos.services.user")


_WEEK_DAYS_PT = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"]

def _int(value, default=0):
    try:
        if value is None or value == "":
            return default
        return int(float(value))
    except Exception:
        return default


def get_full_profile(uid: str) -> Dict:
    """Returns the complete user profile: users + user_profiles + user_settings."""
    db = get_db()
    u  = fetch_one(query(
        db.table("users")
          .select("id, name, initials, email, plan, avatar_url, onboarding_done")
          .eq("id", uid).limit(1)
    ))
    p  = fetch_one(query(
        db.table("user_profiles").select("*").eq("user_id", uid).limit(1)
    ))
    s  = fetch_one(query(
        db.table("user_settings").select("*").eq("user_id", uid).limit(1)
    ))
    u = u or {}
    p = p or {}
    s = s or {}
    return {
        "id":              u.get("id", uid),
        "name":            u.get("name", ""),
        "initials":        u.get("initials", "U"),
        "email":           u.get("email", ""),
        "plan":            u.get("plan", "free"),
        "avatar_url":      u.get("avatar_url"),
        "onboarding_done": u.get("onboarding_done", False),
        "profession":      p.get("profession", ""),
        "profession_type": p.get("profession_type", "gen"),
        "bio":             p.get("bio", ""),
        "week_status":     p.get("week_status", ""),
        "progress":        _int(p.get("progress_pct", 0), 0),
        "focus_score":     _int(p.get("focus_score", 0), 0),
        "energy_level":    _int(p.get("energy_level", 5), 5),
        "current_streak":  _int(p.get("current_streak", 0), 0),
        "total_xp":        _int(p.get("total_xp", 0), 0),
        "level":           _int(p.get("level", 1), 1),
        "member_since":    str(p.get("member_since", "")),
        "timezone":        p.get("timezone", "America/Sao_Paulo"),
        "lang":            p.get("lang", "pt-BR"),
        "currency":        p.get("currency", "BRL"),
        "theme":           s.get("theme", "light"),
        "ai_personality":  s.get("ai_personality", "coach_motivacional"),
        "notifications":   s.get("notifications", True),
        "vision":          p.get("vision", ""),
    }


def get_metrics(uid: str) -> List:
    """Weekly performance metrics summary."""
    db     = get_db()
    tasks  = fetch_list(query(db.table("tasks").select("id, done").eq("user_id", uid)))
    done   = sum(1 for t in tasks if t.get("done"))
    pending = len(tasks) - done

    habits = fetch_list(query(
        db.table("habits")
          .select("current_streak")
          .eq("user_id", uid)
          .eq("is_active", True)
    ))
    avg_streak = round(
        sum(h.get("current_streak", 0) for h in habits) / max(len(habits), 1), 0
    ) if habits else 0

    return [
        {"label": "Tarefas feitas", "value": done,        "unit": "",     "up": True,  "pct": min(done * 10, 100),        "delta": f"{done} total"},
        {"label": "Pendentes",      "value": pending,     "unit": "",     "up": False, "pct": min(pending * 10, 100),     "delta": f"{pending} itens"},
        {"label": "Sequência",      "value": int(avg_streak), "unit": "dias", "up": True, "pct": min(int(avg_streak) * 5, 100), "delta": "média hábitos"},
    ]


def get_goals(uid: str) -> List:
    res = fetch_list(query(
        get_db().table("goals")
                .select("id, title, category, current_value, total_value, unit, pct, deadline, is_active, sort_order")
                .eq("user_id", uid)
                .eq("is_active", True)
                .order("sort_order")
    ))
    return [{
        "id":      g["id"],
        "title":   g.get("title", ""),
        "cat":     g.get("category", "geral"),
        "current": float(g.get("current_value", 0)),
        "total":   float(g.get("total_value", 100)),
        "unit":    g.get("unit", "%"),
        "pct":     g.get("pct", 0),
        "deadline": str(g.get("deadline", "")),
    } for g in res]


def get_tasks(uid: str) -> List:
    # Try with due_date column; fall back to simpler select if column missing
    res = fetch_list(query(
        get_db().table("tasks")
                .select("id, title, category, priority, due_date, done")
                .eq("user_id", uid)
                .order("done")
                .limit(50)
    ))
    if not res:
        # Fallback: select without due_date in case column doesn't exist yet
        res = fetch_list(query(
            get_db().table("tasks")
                    .select("id, title, category, priority, done")
                    .eq("user_id", uid)
                    .order("done")
                    .limit(50)
        ))
    return [{
        "id":       t["id"],
        "title":    t.get("title", ""),
        "tag":      t.get("category", "pessoal"),
        "priority": t.get("priority", "medium"),
        "due":      str(t.get("due_date", "")),
        "done":     t.get("done", False),
    } for t in res]


def _is_generic_habit_name(name: str) -> bool:
    """Known demo/fallback habits that must not be presented as personalized data."""
    n = (name or "").strip().lower()
    banned_exact = {
        "beber 2l de água", "beber 2l de agua", "beber água", "beber agua",
        "estudar 1 hora", "treinar", "acordar antes das 7h", "trabalhar no projeto",
        "ler 10 minutos", "exercício físico", "exercicio fisico", "rotina matinal",
    }
    banned_contains = ["2l de", "beber água", "beber agua", "estudar 1 hora", "acordar antes", "ler 10"]
    return n in banned_exact or any(x in n for x in banned_contains)


def _active_weekly_plan_id(uid: str) -> Optional[str]:
    """Return current structured weekly plan id, if the migrations ran correctly."""
    db = get_db()
    annual = fetch_one(query(
        db.table("annual_plans")
          .select("id")
          .eq("user_id", uid)
          .eq("is_active", True)
          .order("created_at", desc=True)
          .limit(1)
    ))
    annual_id = annual.get("id") if annual else None
    if not annual_id:
        return None
    today_iso = date.today().isoformat()
    weekly = fetch_one(query(
        db.table("weekly_plans")
          .select("id")
          .eq("annual_plan_id", annual_id)
          .lte("week_start", today_iso)
          .order("week_start", desc=True)
          .limit(1)
    ))
    return weekly.get("id") if weekly else None


def get_habits(uid: str) -> List:
    """
    Prefer plan_habits from the structured current plan. Legacy habits are used only
    as a compatibility fallback, with known demo items filtered out.
    """
    db = get_db()
    weekly_id = _active_weekly_plan_id(uid)
    if weekly_id:
        rows = fetch_list(query(
            db.table("plan_habits")
              .select("id, name, icon, goal_value, goal_unit, frequency_days, category, created_at")
              .eq("weekly_plan_id", weekly_id)
              .order("created_at")
              .limit(20)
        ))
        rows = [h for h in rows if not _is_generic_habit_name(h.get("name", ""))]
        if rows:
            ids = [h["id"] for h in rows]
            seven_ago = (date.today() - timedelta(days=6)).isoformat()
            logs = fetch_list(query(
                db.table("habit_logs")
                  .select("habit_id, log_date, done")
                  .in_("habit_id", ids)
                  .gte("log_date", seven_ago)
            ))
            log_map: Dict[str, List] = {}
            for l in logs:
                log_map.setdefault(l["habit_id"], []).append(l)
            log.info("[HABITS] source=plan_habits uid=%s count=%d", uid, len(rows))
            return [{
                "id": h["id"],
                "name": h.get("name", ""),
                "icon": h.get("icon", "⭐"),
                "goal": float(h.get("goal_value", 1) or 1),
                "unit": h.get("goal_unit", "vez"),
                "streak": 0,
                "best": 0,
                "days": [l["log_date"] for l in log_map.get(h["id"], []) if l.get("done")],
                "source": "plan_habits",
                "cat": h.get("category", "geral"),
            } for h in rows]

    habits = fetch_list(query(
        db.table("habits")
          .select("id, name, icon, goal_value, goal_unit, current_streak, best_streak, is_active, source, sort_order")
          .eq("user_id", uid)
          .eq("is_active", True)
          .order("sort_order")
          .limit(30)
    ))
    habits = [h for h in habits if not _is_generic_habit_name(h.get("name", ""))]
    if not habits:
        return []
    hab_ids = [h["id"] for h in habits]
    seven_ago = (date.today() - timedelta(days=6)).isoformat()
    logs = fetch_list(query(
        db.table("habit_logs")
          .select("habit_id, log_date, done")
          .in_("habit_id", hab_ids)
          .gte("log_date", seven_ago)
    ))
    log_map: Dict[str, List] = {}
    for l in logs:
        log_map.setdefault(l["habit_id"], []).append(l)
    log.warning("[HABITS] source=legacy_filtered uid=%s count=%d", uid, len(habits))
    return [{
        "id": h["id"],
        "name": h.get("name", ""),
        "icon": h.get("icon", "⭐"),
        "goal": float(h.get("goal_value", 1) or 1),
        "unit": h.get("goal_unit", "vez"),
        "streak": h.get("current_streak", 0),
        "best": h.get("best_streak", 0),
        "days": [l["log_date"] for l in log_map.get(h["id"], []) if l.get("done")],
        "source": h.get("source", "legacy_filtered"),
    } for h in habits]

def get_routine(uid: str) -> List:
    """Prefer structured plan_tasks; fall back to legacy routine_templates only if needed."""
    db = get_db()
    weekly_id = _active_weekly_plan_id(uid)
    if weekly_id:
        rows = fetch_list(query(
            db.table("plan_tasks")
              .select("id, title, category, priority, time_of_day, description, created_at")
              .eq("weekly_plan_id", weekly_id)
              .order("time_of_day")
              .limit(20)
        ))
        if rows:
            today_iso = date.today().isoformat()
            ids = [r["id"] for r in rows]
            logs = fetch_list(query(
                db.table("routine_daily_logs")
                  .select("template_id, done")
                  .in_("template_id", ids)
                  .eq("log_date", today_iso)
            ))
            done_ids = {l["template_id"] for l in logs if l.get("done")}
            log.info("[ROUTINE] source=plan_tasks uid=%s count=%d", uid, len(rows))
            return [{
                "id": r["id"],
                "time": str(r.get("time_of_day", "") or "")[:5],
                "text": r.get("title", ""),
                "cat": r.get("category", "trabalho"),
                "done": r["id"] in done_ids,
                "desc": r.get("description", ""),
                "source": "plan_tasks",
            } for r in rows]

    templates = fetch_list(query(
        db.table("routine_templates")
          .select("id, time_of_day, activity, category, sort_order, source")
          .eq("user_id", uid)
          .eq("is_active", True)
          .order("time_of_day")
          .limit(30)
    ))
    if not templates:
        return []
    today_str = date.today().isoformat()
    tmpl_ids = [t["id"] for t in templates]
    logs = fetch_list(query(
        db.table("routine_daily_logs")
          .select("template_id, done")
          .in_("template_id", tmpl_ids)
          .eq("log_date", today_str)
    ))
    done_ids = {l["template_id"] for l in logs if l.get("done")}
    log.warning("[ROUTINE] source=legacy uid=%s count=%d", uid, len(templates))
    return [{
        "id": t["id"],
        "time": str(t.get("time_of_day", ""))[:5],
        "text": t.get("activity", ""),
        "cat": t.get("category", "pessoal"),
        "done": t["id"] in done_ids,
        "source": t.get("source", "legacy"),
    } for t in templates]

def get_finances(uid: str) -> List:
    month = date.today().replace(day=1).isoformat()
    res   = fetch_list(query(
        get_db().table("finance_entries")
                .select("id, category_name, icon, budget, spent, pct_used")
                .eq("user_id", uid)
                .eq("reference_month", month)
    ))
    return [{
        "id":     f["id"],
        "name":   f.get("category_name", ""),
        "icon":   f.get("icon", "💰"),
        "budget": float(f.get("budget", 0)),
        "spent":  float(f.get("spent", 0)),
        "pct":    float(f.get("pct_used", 0)),
    } for f in res]


def get_weekly(uid: str) -> List:
    """Retorna sempre 7 dias no formato que o frontend espera: {day, pct}."""
    wstart = week_start()
    rows = fetch_list(query(
        get_db().table("weekly_metrics")
                .select("day_of_week, productivity_pct")
                .eq("user_id", uid)
                .eq("week_start", wstart)
                .order("day_of_week")
    ))
    by_day = {}
    for r in rows:
        raw_day = _int(r.get("day_of_week"), 0)
        idx = raw_day - 1 if 1 <= raw_day <= 7 else raw_day
        if 0 <= idx <= 6:
            by_day[idx] = max(0, min(100, _int(r.get("productivity_pct"), 0)))
    return [{"day": _WEEK_DAYS_PT[i], "pct": by_day.get(i, 0)} for i in range(7)]


def get_checkin_today(uid: str) -> Dict:
    today_str = date.today().isoformat()
    row = fetch_one(query(
        get_db().table("checkin_sessions")
                .select("*")
                .eq("user_id", uid)
                .eq("session_date", today_str)
                .limit(1)
    ))
    row = row or {}
    return {
        "done":             row.get("is_complete", False),
        "answers":          row.get("answers", {}) or {},
        "open_answers":     row.get("open_answers", {}) or {},
        "adaptive_answers": row.get("adaptive_answers", {}) or {},
        "timestamp":        str(row.get("completed_at", "")),
    }


def get_checkin_pendencies(uid: str) -> List:
    days      = [(date.today() - timedelta(days=i)).isoformat() for i in range(1, 8)]
    done_rows = fetch_list(query(
        get_db().table("checkin_sessions")
                .select("session_date")
                .eq("user_id", uid)
                .eq("is_complete", True)
                .in_("session_date", days)
    ))
    done_dates = {r["session_date"] for r in done_rows}
    return [day for day in days if day not in done_dates]


def get_reminder_today(uid: str) -> Dict:
    """
    Returns today's reminder. Supports both the newer schema
    (reminder_date + reminder_time) and older schemas without reminder_date.
    """
    db = get_db()
    today_iso = date.today().isoformat()

    row = fetch_one(query(
        db.table("daily_reminders")
          .select("text, reminder_time, is_active")
          .eq("user_id", uid)
          .eq("reminder_date", today_iso)
          .limit(1)
    ))

    if not row:
        row = fetch_one(query(
            db.table("daily_reminders")
              .select("text, reminder_time, is_active")
              .eq("user_id", uid)
              .order("created_at", desc=True)
              .limit(1)
        ))

    if not row:
        row = fetch_one(query(
            db.table("daily_reminders")
              .select("text, is_active")
              .eq("user_id", uid)
              .order("created_at", desc=True)
              .limit(1)
        ))

    row = row or {}
    return {
        "text":   row.get("text", "") or "",
        "time":   str(row.get("reminder_time", "") or row.get("time", "") or "")[:5],
        "active": row.get("is_active", False),
    }


def get_notifications(uid: str) -> List:
    res = fetch_list(query(
        get_db().table("notifications")
                .select("id, title, message, is_read, created_at")
                .eq("user_id", uid)
                .order("created_at", desc=True)
                .limit(20)
    ))
    return [{
        "id":      n["id"],
        "title":   n.get("title", ""),
        "message": n.get("message", ""),
        "unread":  not n.get("is_read", False),
        "time":    str(n.get("created_at", ""))[:16],
    } for n in res]


def get_latest_plan(uid: str) -> Optional[Dict]:
    row = fetch_one(query(
        get_db().table("plans")
                .select("content, created_at")
                .eq("user_id", uid)
                .order("created_at", desc=True)
                .limit(1)
                .limit(1)
    ))
    return row.get("content") if row else None


def get_calendar(uid: str) -> List:
    today_str = date.today().isoformat()
    # Try with notes column; fall back without it if column doesn't exist
    res = fetch_list(query(
        get_db().table("calendar_events")
                .select("id, title, category, event_date, event_time, duration_text, notes")
                .eq("user_id", uid)
                .gte("event_date", today_str)
                .order("event_date")
                .order("event_time")
                .limit(30)
    ))
    if not res:
        res = fetch_list(query(
            get_db().table("calendar_events")
                    .select("id, title, category, event_date, event_time")
                    .eq("user_id", uid)
                    .gte("event_date", today_str)
                    .order("event_date")
                    .limit(30)
        ))
    return [{
        "id":    e["id"],
        "title": e.get("title", ""),
        "cat":   e.get("category", "pessoal"),
        "date":  str(e.get("event_date", "")),
        "time":  str(e.get("event_time", ""))[:5],
        "dur":   e.get("duration_text", ""),
        "note":  e.get("notes", ""),
    } for e in res]