"""
scheduler.py
APScheduler background job — runs every hour, checks each user's timezone,
and triggers the daily AI update at 4AM local time.
"""

import logging
from datetime import datetime

import pytz
from apscheduler.schedulers.background import BackgroundScheduler

from utils.database      import get_db, query, fetch_list, fetch_one
from services.data_generation import run_daily_update

log = logging.getLogger("lifeos.scheduler")
_scheduler = BackgroundScheduler(timezone="UTC")


def _daily_job():
    """
    Runs every hour on UTC.
    For each active user: checks if it is currently 4AM in their timezone.
    If yes, and not yet processed today → runs the daily AI update.
    """
    log.info("[SCHEDULER] Checking users for daily job...")
    db = get_db()

    try:
        users = fetch_list(query(
            db.table("users")
              .select("id, name")
              .eq("onboarding_done", True)
              .limit(500)
        ))

        processed = 0
        for user in users:
            uid  = user["id"]
            name = user.get("name", "")

            profile = fetch_one(query(
                db.table("user_profiles")
                  .select("timezone")
                  .eq("user_id", uid)
                  .limit(1)
            ))
            tz_str = profile.get("timezone", "America/Sao_Paulo")

            try:
                tz        = pytz.timezone(tz_str)
                local_now = datetime.now(tz)
            except Exception:
                local_now = datetime.now()

            # Only process at 4AM in user's timezone
            if local_now.hour != 4:
                continue

            today_str = local_now.date().isoformat()

            # Check if already processed today
            already = fetch_list(query(
                db.table("history_events")
                  .select("id")
                  .eq("user_id", uid)
                  .eq("event_type", "daily_ai_processed")
                  .gte("created_at", today_str)
                  .limit(1)
            ))
            if already:
                continue

            try:
                ok = run_daily_update(uid, name)
                if ok:
                    query(db.table("history_events").insert({
                        "user_id":    uid,
                        "event_type": "daily_ai_processed",
                        "event_data": {
                            "timezone":   tz_str,
                            "local_time": local_now.isoformat(),
                        },
                    }))
                    processed += 1
                    log.info("[SCHEDULER] uid=%s processed at %s (%s)",
                             uid, local_now.strftime("%H:%M"), tz_str)
            except Exception as e:
                log.error("[SCHEDULER] Error for uid=%s: %s", uid, e)

        log.info("[SCHEDULER] %d users processed.", processed)

    except Exception as e:
        log.error("[SCHEDULER] Critical error: %s", e, exc_info=True)


def start_scheduler():
    """Starts the background scheduler. Safe to call multiple times."""
    if _scheduler.running:
        return
    _scheduler.add_job(
        _daily_job,
        "interval",
        hours=1,
        id="daily_ai_job",
        replace_existing=True,
        max_instances=1,
    )
    _scheduler.start()
    log.info("[SCHEDULER] Started — hourly check active.")
