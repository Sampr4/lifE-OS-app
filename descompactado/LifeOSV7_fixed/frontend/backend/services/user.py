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
        "progress":        p.get("progress_pct", 0),
        "focus_score":     p.get("focus_score", 0),
        "energy_level":    p.get("energy_level", 5),
        "current_streak":  p.get("current_streak", 0),
        "total_xp":        p.get("total_xp", 0),
        "level":           p.get("level", 1),
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


def get_habits(uid: str) -> List:
    db     = get_db()
    # Try full select; fall back to minimal columns if schema is missing fields
    habits = fetch_list(query(
        db.table("habits")
          .select("id, name, icon, goal_value, goal_unit, current_streak, is_active")
          .eq("user_id", uid)
          .eq("is_active", True)
          .order("sort_order")
    ))
    if not habits:
        habits = fetch_list(query(
            db.table("habits")
              .select("*")
              .eq("user_id", uid)
              .limit(20)
        ))
    if not habits:
        return []
    hab_ids   = [h["id"] for h in habits]
    seven_ago = (date.today() - timedelta(days=6)).isoformat()
    logs = fetch_list(query(
        db.table("habit_logs")
          .select("habit_id, log_date, done")
          .in_("habit_id", hab_ids)
          .gte("log_date", seven_ago)
    ))
    if not logs:
        # Fallback: try 'completed' column instead of 'done'
        logs = fetch_list(query(
            db.table("habit_logs")
              .select("habit_id, log_date, completed")
              .in_("habit_id", hab_ids)
              .gte("log_date", seven_ago)
        ))
        # Normalize 'completed' → 'done'
        for l in logs:
            if "completed" in l and "done" not in l:
                l["done"] = l["completed"]
    log_map: Dict[str, List] = {}
    for l in logs:
        log_map.setdefault(l["habit_id"], []).append(l)

    return [{
        "id":     h["id"],
        "name":   h.get("name", ""),
        "icon":   h.get("icon", "⭐"),
        "goal":   float(h.get("goal_value", 1)),
        "unit":   h.get("goal_unit", "vez"),
        "streak": h.get("current_streak", 0),
        "best":   h.get("best_streak", 0),
        "days":   [l["log_date"] for l in log_map.get(h["id"], []) if l.get("done")],
    } for h in habits]


def get_routine(uid: str) -> List:
    db        = get_db()
    templates = fetch_list(query(
        db.table("routine_templates")
          .select("id, time_of_day, activity, category, sort_order")
          .eq("user_id", uid)
          .eq("is_active", True)
          .order("time_of_day")
    ))
    if not templates:
        return []
    today_str = date.today().isoformat()
    tmpl_ids  = [t["id"] for t in templates]
    logs      = fetch_list(query(
        db.table("routine_daily_logs")
          .select("template_id, done")
          .in_("template_id", tmpl_ids)
          .eq("log_date", today_str)
    ))
    done_ids = {l["template_id"] for l in logs if l.get("done")}
    return [{
        "id":   t["id"],
        "time": str(t.get("time_of_day", ""))[:5],
        "text": t.get("activity", ""),
        "cat":  t.get("category", "pessoal"),
        "done": t["id"] in done_ids,
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
    wstart = week_start()
    return fetch_list(query(
        get_db().table("weekly_metrics")
                .select("day_of_week, productivity_pct")
                .eq("user_id", uid)
                .eq("week_start", wstart)
                .order("day_of_week")
    ))


def get_checkin_today(uid: str) -> Dict:
    today_str = date.today().isoformat()
    row = fetch_one(query(
        get_db().table("checkin_sessions")
                .select("*")
                .eq("user_id", uid)
                .eq("session_date", today_str)
                .limit(1)
    ))
    return {
        "done":             row.get("is_complete", False),
        "answers":          row.get("answers", {}),
        "open_answers":     row.get("open_answers", {}),
        "adaptive_answers": row.get("adaptive_answers", {}),
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
    # Try with reminder_time; fall back to minimal columns if it doesn't exist
    row = fetch_one(query(
        get_db().table("daily_reminders")
                .select("text, reminder_time, is_active")
                .eq("user_id", uid)
                .eq("reminder_date", date.today().isoformat())
                .limit(1)
    ))
    if not row:
        row = fetch_one(query(
            get_db().table("daily_reminders")
                    .select("text, is_active")
                    .eq("user_id", uid)
                    .eq("reminder_date", date.today().isoformat())
                    .limit(1)
        ))
    return {
        "text":   row.get("text", ""),
        "time":   str(row.get("reminder_time", "") or "")[:5],
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