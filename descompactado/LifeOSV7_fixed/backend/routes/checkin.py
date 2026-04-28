"""
routes/checkin.py
Daily check-in session endpoints.
"""
import logging
from flask      import Blueprint, request, g
from datetime   import date, datetime, timedelta
from middleware.auth import auth_required
from services.user   import get_checkin_today, get_checkin_pendencies, get_reminder_today
from utils.database  import get_db, query, fetch_one
from utils.dates     import week_start
from utils.responses import success, error

log = logging.getLogger("lifeos.routes.checkin")
checkin_routes = Blueprint("checkin_routes", __name__)


def _upsert_weekly_metric(db, uid: str, wstart: str, dow: int, productivity_pct: int):
    row = {
        "user_id": uid,
        "week_start": wstart,
        "day_of_week": dow,
        "productivity_pct": productivity_pct,
    }
    res = query(db.table("weekly_metrics").upsert(row, on_conflict="user_id,week_start,day_of_week"))
    if res is not None:
        return res
    existing = fetch_one(query(
        db.table("weekly_metrics")
          .select("id")
          .eq("user_id", uid)
          .eq("week_start", wstart)
          .eq("day_of_week", dow)
          .limit(1)
    ))
    if existing.get("id"):
        return query(db.table("weekly_metrics").update({"productivity_pct": productivity_pct}).eq("id", existing["id"]))
    return query(db.table("weekly_metrics").insert(row))


@checkin_routes.get("/api/checkin/today")
@auth_required
def checkin_today():
    return success(get_checkin_today(g.uid))


@checkin_routes.get("/api/checkin/pendencies")
@auth_required
def checkin_pendencies():
    return success(get_checkin_pendencies(g.uid))


@checkin_routes.get("/api/reminder")
@checkin_routes.get("/api/reminder/today")
@auth_required
def get_reminder():
    return success(get_reminder_today(g.uid))


@checkin_routes.patch("/api/reminder")
@checkin_routes.patch("/api/reminder/today")
@auth_required
def save_reminder():
    """Creates/updates today's reminder from the dashboard."""
    body = request.get_json(silent=True) or {}
    text = str(body.get("text") or body.get("message") or "").strip()
    reminder_time = str(body.get("time") or body.get("reminder_time") or "08:00").strip()[:5]
    today_str = date.today().isoformat()
    if not text:
        return error("MISSING_FIELD", "text is required.", 400)

    db = get_db()
    payload = {
        "user_id": g.uid,
        "reminder_date": today_str,
        "text": text[:500],
        "reminder_time": reminder_time,
        "is_active": True,
    }

    res = query(db.table("daily_reminders").upsert(
        payload,
        on_conflict="user_id,reminder_date"
    ))
    if res is None:
        # Legacy fallback for schemas without reminder_date/reminder_time.
        legacy_payload = {
            "user_id": g.uid,
            "text": text[:500],
            "is_active": True,
        }
        res = query(db.table("daily_reminders").upsert(
            legacy_payload,
            on_conflict="user_id"
        ))
    if res is None:
        return error("DB_ERROR", "Failed to save reminder.", 500)
    return success({"saved": True, "text": text[:500], "time": reminder_time, "active": True})


@checkin_routes.post("/api/checkin")
@auth_required
def save_checkin():
    """Saves a completed daily check-in session."""
    body      = request.get_json(silent=True) or {}
    today_str = date.today().isoformat()
    db        = get_db()

    query(db.table("checkin_sessions").upsert({
        "user_id":          g.uid,
        "session_date":     today_str,
        "answers":          body.get("answers", {}),
        "open_answers":     body.get("open_answers", {}),
        "adaptive_answers": body.get("adaptive_answers", {}),
        "is_complete":      True,
        "completed_at":     datetime.utcnow().isoformat(),
    }, on_conflict="user_id,session_date"))

    # Calculate score and update weekly metrics
    score = _calc_score(body.get("answers", {}))
    dow   = date.today().weekday()
    _upsert_weekly_metric(db, g.uid, week_start(), dow, score)

    # Award XP and update streak
    _award_xp(g.uid, 50, db)
    _update_user_streak(g.uid, db)

    return success({"saved": True, "score": score})


def _calc_score(answers: dict) -> int:
    if not answers:
        return 0
    yes = sum(1 for v in answers.values() if str(v).lower() in ("sim", "yes", "true", "1"))
    return min(int(yes / max(len(answers), 1) * 100), 100)


def _award_xp(uid: str, xp: int, db):
    profile = fetch_one(query(
        db.table("user_profiles")
          .select("total_xp, level")
          .eq("user_id", uid)
          .limit(1)
    ))
    new_xp    = (profile.get("total_xp") or 0) + xp
    new_level = max(1, new_xp // 500 + 1)
    query(db.table("user_profiles")
            .update({"total_xp": new_xp, "level": new_level})
            .eq("user_id", uid))


def _update_user_streak(uid: str, db):
    """Recalculates the user's consecutive check-in streak."""
    today_str = date.today().isoformat()
    streak    = 0
    check_day = date.today()
    while True:
        row = fetch_one(query(
            db.table("checkin_sessions")
              .select("session_date")
              .eq("user_id", uid)
              .eq("session_date", check_day.isoformat())
              .eq("is_complete", True)
              .limit(1)
        ))
        if not row:
            break
        streak   += 1
        check_day = check_day - timedelta(days=1)
        if streak > 365:
            break
    query(db.table("user_profiles")
            .update({"current_streak": streak})
            .eq("user_id", uid))
