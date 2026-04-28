"""
utils/dates.py
Date and timezone helpers used across the backend.
"""

from datetime import date, datetime, timedelta
import pytz


def today() -> str:
    return date.today().isoformat()


def month_start() -> str:
    return date.today().replace(day=1).isoformat()


def week_start() -> str:
    t = date.today()
    return (t - timedelta(days=t.weekday())).isoformat()


def local_datetime(tz_str: str) -> datetime:
    """Returns current datetime in the given timezone."""
    try:
        tz = pytz.timezone(tz_str)
        return datetime.now(tz)
    except Exception:
        return datetime.now()


def local_date(tz_str: str) -> date:
    """Returns current date in the given timezone."""
    return local_datetime(tz_str).date()
