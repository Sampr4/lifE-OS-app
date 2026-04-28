"""
middleware/auth.py
Firebase token validation + Supabase user resolution.

FIX: Uses .limit(1) instead of .limit(1) to prevent
     postgrest-py from crashing on HTTP 204 when user not found.
"""

import os
import time
import logging
from functools import wraps
from flask import request, g

import firebase_admin
from firebase_admin import credentials, auth as fb_auth

from utils.database import get_db, query, fetch_one, DB_ERROR
from utils.responses import error

log = logging.getLogger("lifeos.auth")

_cred_path = os.environ.get("FIREBASE_CREDENTIALS", "serviceAccountKey.json")
if not firebase_admin._apps:
    try:
        firebase_admin.initialize_app(credentials.Certificate(_cred_path))
        log.info("[FIREBASE] Initialized: %s", _cred_path)
    except Exception as e:
        log.critical("[FIREBASE] Init failed: %s", e)


def _verify_token(token: str) -> dict:
    try:
        return fb_auth.verify_id_token(token)
    except Exception as e:
        if "used too early" in str(e).lower():
            log.warning("[AUTH] Token used too early — retrying in 1.5s")
            time.sleep(1.5)
            return fb_auth.verify_id_token(token)
        raise


def _ensure_child_rows(uid: str):
    db = get_db()
    for table in ("user_profiles", "user_settings"):
        try:
            db.table(table).upsert(
                {"user_id": uid},
                on_conflict="user_id"
            ).execute()
        except Exception as e:
            log.warning("[AUTH] Could not ensure %s row for uid=%s: %s", table, uid, e)


def _get_locale() -> dict:
    return {
        "timezone": request.headers.get("X-Timezone", "America/Sao_Paulo"),
        "lang":     request.headers.get("X-Language", "pt-BR"),
        "currency": request.headers.get("X-Currency", "BRL"),
    }


def auth_required(f):
    """
    Validates Firebase Bearer token, resolves Supabase UUID, injects g.uid.
    FIX: Uses .limit(1) not .limit(1) to avoid 204 crashes.
    """
    @wraps(f)
    def wrapper(*args, **kwargs):
        raw   = request.headers.get("Authorization", "")
        token = raw.replace("Bearer ", "").strip()

        if not token:
            return error("AUTH_MISSING", "Authorization token is required.", 401)

        try:
            decoded = _verify_token(token)
            fuid    = decoded["uid"]

            # FIX: .limit(1) instead of .limit(1)
            res = query(
                get_db()
                .table("users")
                .select("id")
                .eq("firebase_uid", fuid)
                .limit(1)
            )

            if res is DB_ERROR:
                log.error("[AUTH] DB connection lost resolving uid for fuid=%s", fuid)
                return error("DB_UNAVAILABLE",
                             "Database temporarily unavailable. Please try again.", 503)

            row = fetch_one(res)

            if not row or not row.get("id"):
                return error("USER_NOT_FOUND",
                             "User not registered. Please sign in first.", 401)

            uid = row["id"]
            _ensure_child_rows(uid)

            g.uid    = uid
            g.fuid   = fuid
            g.locale = _get_locale()
            return f(*args, **kwargs)

        except fb_auth.InvalidIdTokenError:
            return error("AUTH_INVALID", "Invalid token.", 401)
        except fb_auth.ExpiredIdTokenError:
            return error("AUTH_EXPIRED", "Token has expired.", 401)
        except fb_auth.RevokedIdTokenError:
            return error("AUTH_REVOKED", "Token has been revoked.", 401)
        except Exception as e:
            log.error("[AUTH] Unexpected error: %s", e, exc_info=True)
            return error("AUTH_ERROR", f"Authentication error: {str(e)}", 500)

    return wrapper
