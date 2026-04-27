"""
routes/auth.py
Registration, token validation, and logout endpoints.

FIXES APPLIED:
- Replaced .maybe_single() with .limit(1) everywhere (avoids HTTP 204 crash)
- Extract UID directly from insert response data (no second query needed)
- Added verbose logging so terminal always shows exactly what failed
- Added /api/debug/db endpoint to test DB schema without logging in
"""

import time
import logging
from flask import Blueprint, request, g
from firebase_admin import auth as fb_auth

from middleware.auth  import auth_required
from utils.database   import get_db, query, fetch_one, fetch_list, DB_ERROR
from utils.responses  import success, error

log = logging.getLogger("lifeos.routes.auth")
auth_routes = Blueprint("auth_routes", __name__)


@auth_routes.get("/api/auth/me")
@auth_required
def auth_me():
    return success({"uid": g.uid})


@auth_routes.post("/api/auth/logout")
@auth_required
def auth_logout():
    return success({"message": "Logout acknowledged."})


@auth_routes.get("/api/debug/db")
def debug_db():
    """
    Tests DB connectivity and schema without needing a login.
    Open http://localhost:5000/api/debug/db in browser to diagnose issues.
    """
    results = {}
    try:
        db = get_db()
        results["connection"] = "OK"

        for tbl in ("users", "user_profiles", "user_settings",
                    "onboarding_progress", "onboarding_answers",
                    "goals", "tasks", "habits"):
            try:
                db.table(tbl).select("*").limit(1).execute()
                results[tbl] = "OK"
            except Exception as e:
                results[tbl] = f"ERROR: {e}"

        # Test firebase_uid column specifically
        try:
            db.table("users").select("firebase_uid").limit(1).execute()
            results["users.firebase_uid_col"] = "OK — column exists"
        except Exception as e:
            results["users.firebase_uid_col"] = f"MISSING — {e}"

    except Exception as e:
        results["connection"] = f"FAILED: {e}"

    all_ok = all("OK" in str(v) for v in results.values())
    return success({"db_check": results, "all_ok": all_ok})


@auth_routes.post("/api/auth/register")
def auth_register():
    """
    Called by login.html after Firebase sign-in.
    Creates user row in Supabase if it doesn't exist.
    Returns { uid, onboarding_done, is_new }.
    """
    body  = request.get_json(silent=True) or {}
    token = body.get("token", "").strip()

    if not token:
        return error("MISSING_TOKEN", "Firebase token is required.", 400)

    # ── 1. Verify Firebase token ─────────────────────────────
    try:
        try:
            decoded = fb_auth.verify_id_token(token)
        except Exception as first_err:
            if "used too early" in str(first_err).lower():
                log.warning("[AUTH/register] Clock skew — retrying in 1.5s")
                time.sleep(1.5)
                decoded = fb_auth.verify_id_token(token)
            else:
                raise
    except Exception as e:
        log.error("[AUTH/register] Firebase token invalid: %s", e)
        return error("INVALID_TOKEN", f"Invalid Firebase token: {str(e)}", 401)

    fuid     = decoded["uid"]
    email    = decoded.get("email", "")
    raw_name = decoded.get("name", "") or email.split("@")[0] or "User"
    name     = raw_name[:100]
    initials = "".join(w[0].upper() for w in name.split()[:2]) or "U"
    log.info("[AUTH/register] Token OK — fuid=...%s email=%s", fuid[-6:], email)

    # ── 2. Get DB connection ─────────────────────────────────
    try:
        db = get_db()
    except Exception as e:
        log.error("[AUTH/register] DB connection failed: %s", e)
        return error("DB_UNAVAILABLE", "Cannot connect to database.", 503)

    # ── 3. Check if user already exists ─────────────────────
    log.info("[AUTH/register] Checking if user exists...")
    existing_res = query(
        db.table("users")
          .select("id, onboarding_done")
          .eq("firebase_uid", fuid)
          .limit(1)
    )

    if existing_res is DB_ERROR:
        return error("DB_UNAVAILABLE", "Database temporarily unavailable.", 503)

    if existing_res is None:
        log.error("[AUTH/register] Query failed — users table missing firebase_uid column? "
                  "Run http://localhost:5000/api/debug/db")
        return error("DB_ERROR",
                     "Cannot query users table. Make sure you ran the full SQL migration "
                     "in Supabase (including firebase_uid column). "
                     "Open http://localhost:5000/api/debug/db to diagnose.", 500)

    existing = fetch_one(existing_res)

    if existing and existing.get("id"):
        log.info("[AUTH/register] Returning existing user uid=%s", existing["id"])
        return success({
            "uid":             existing["id"],
            "onboarding_done": existing.get("onboarding_done", False),
            "is_new":          False,
        })

    # ── 4. Create new user ───────────────────────────────────
    log.info("[AUTH/register] Inserting new user...")
    insert_res = query(
        db.table("users").insert({
            "firebase_uid":    fuid,
            "email":           email,
            "name":            name,
            "initials":        initials,
            "plan":            "free",
            "onboarding_done": False,
        })
    )

    if insert_res is None:
        # Pode acontecer quando o frontend dispara /api/auth/register duas vezes quase ao mesmo tempo:
        # uma requisição cria o usuário e a outra recebe conflito da chave única firebase_uid.
        # Em vez de quebrar com 500, torna o registro idempotente e retorna o usuário existente.
        log.warning("[AUTH/register] Insert returned error — rechecking firebase_uid before failing")
        race_res = query(
            db.table("users")
              .select("id, onboarding_done")
              .eq("firebase_uid", fuid)
              .limit(1)
        )
        race_user = fetch_one(race_res)
        if race_user and race_user.get("id"):
            log.info("[AUTH/register] Race/conflict resolved, returning existing uid=%s", race_user["id"])
            return success({
                "uid":             race_user["id"],
                "onboarding_done": race_user.get("onboarding_done", False),
                "is_new":          False,
            })
        log.error("[AUTH/register] Insert failed — run /api/debug/db to diagnose")
        return error("DB_ERROR",
                     "Failed to insert user. Open http://localhost:5000/api/debug/db "
                     "to see which tables/columns are missing.", 500)

    # ── 5. Get UID from insert response directly ─────────────
    uid = None
    insert_data = getattr(insert_res, "data", None)
    if isinstance(insert_data, list) and insert_data:
        uid = insert_data[0].get("id")
    elif isinstance(insert_data, dict):
        uid = insert_data.get("id")

    # Fallback query if insert response had no ID
    if not uid:
        log.warning("[AUTH/register] Insert returned no ID — querying...")
        for _ in range(3):
            res = query(
                db.table("users").select("id").eq("firebase_uid", fuid).limit(1)
            )
            row = fetch_one(res)
            if row and row.get("id"):
                uid = row["id"]
                break
            time.sleep(0.4)

    if not uid:
        log.error("[AUTH/register] Could not get UID after insert")
        return error("DB_ERROR", "Failed to retrieve new user ID.", 500)

    # ── 6. Create profile/settings rows ─────────────────────
    for table in ("user_profiles", "user_settings"):
        try:
            db.table(table).upsert({"user_id": uid}, on_conflict="user_id").execute()
        except Exception as e:
            log.warning("[AUTH/register] Could not create %s (non-fatal): %s", table, e)

    log.info("[AUTH] New user registered uid=%s fuid=...%s", uid, fuid[-6:])
    return success({
        "uid":             uid,
        "onboarding_done": False,
        "is_new":          True,
    }, status=201)
