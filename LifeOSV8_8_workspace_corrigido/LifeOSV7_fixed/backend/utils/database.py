"""
utils/database.py
Supabase client singleton with safe query helpers.

FIX: Replaced maybe_single() (causes HTTP 204 exception in postgrest-py)
     with limit(1) queries handled by fetch_one().
     Added safe_query() wrapper that handles both list and single responses.
"""

import os
import threading
import logging
from typing import Any, Dict, List, Optional
from supabase import create_client, Client
from utils.dates import today

log = logging.getLogger("lifeos.database")
_client: Optional[Client] = None
_lock = threading.Lock()

DB_ERROR = object()


def _reset_client():
    global _client
    with _lock:
        _client = None


def get_db() -> Client:
    global _client
    if _client is not None:
        return _client
    with _lock:
        if _client is None:
            url = os.environ.get("SUPABASE_URL", "")
            key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
            if not url or not key:
                raise RuntimeError(
                    "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env"
                )
            _client = create_client(url, key)
            log.info("[DB] Connected to Supabase: %s", url[:40])
    return _client


def query(builder) -> Any:
    """
    Executes a Supabase query builder.
    Returns response object, DB_ERROR sentinel, or None on query error.
    """
    try:
        return builder.execute()
    except Exception as e:
        err_str = str(e).lower()
        if any(k in err_str for k in ("server disconnected", "connection", "timeout", "network")):
            log.warning("[DB] Connection lost — will reconnect: %s", e)
            _reset_client()
            return DB_ERROR
        log.error("[DB] Query failed: %s", e, exc_info=False)
        return None


def fetch_list(res) -> List:
    """Extracts .data as a list. Returns [] on any failure."""
    if res is None or res is DB_ERROR:
        return []
    data = getattr(res, "data", None)
    if isinstance(data, list):
        return data
    if data is None:
        return []
    if isinstance(data, dict):
        return [data]
    return []


def fetch_one(res) -> Dict:
    """
    Extracts first item from response.
    Works for both list responses and single-object responses.
    Returns {} on any failure or empty result.
    """
    if res is None or res is DB_ERROR:
        return {}
    data = getattr(res, "data", None)
    if isinstance(data, list):
        return data[0] if data and isinstance(data[0], dict) else {}
    if isinstance(data, dict) and data:
        return data
    return {}


def log_ai_call(uid: str, gen_type: str, success: bool, tokens_in: int = 0, tokens_out: int = 0, error: str = None):
    """
    Logs AI generation calls for observability/monitoring.
    """
    payload = {
        "user_id": uid,
        "event_type": "ai_call",
        "event_data": {
            "gen_type": gen_type,
            "success": success,
            "tokens_in": tokens_in,
            "tokens_out": tokens_out,
            "error": error[:500] if error else None,
        },
        "created_at": today(),
    }
    try:
        query(get_db().table("user_events").insert(payload))
    except:
        pass  # Silent fail for logging

def log_event(uid: str, event_type: str, event_data: Dict = None):
    """
    Logs user/system events for observability.
    Tolerates missing table/cols.
    """
    payload = {
        "user_id": uid,
        "event_type": event_type,
        "event_data": event_data or {},
        "created_at": today(),
    }
    db = get_db()
    # Try full payload
    res = query(db.table("user_events").insert(payload))
    if res is None:
        # Fallback: minimal
        query(db.table("user_events").insert({
            "user_id": uid,
            "event_type": event_type,
        }))
