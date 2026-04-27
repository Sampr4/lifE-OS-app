"""
routes/user.py
User profile read and update endpoints.
GET   /api/user      — full profile
PATCH /api/user      — update profile/settings/user fields
PATCH /api/user/locale — save locale from frontend headers
"""

import logging
from flask import Blueprint, request, g

from middleware.auth     import auth_required
from services.user       import get_full_profile
from utils.database      import get_db, query
from utils.responses     import success, error

log = logging.getLogger("lifeos.routes.user")
user_routes = Blueprint("user_routes", __name__)


@user_routes.get("/api/user")
@user_routes.get("/api/me")
@auth_required
def get_user():
    return success(get_full_profile(g.uid))


@user_routes.patch("/api/user")
@auth_required
def update_user():
    body = request.get_json(silent=True) or {}
    db   = get_db()

    PROFILE_FIELDS  = {"profession", "bio", "week_status", "energy_level",
                       "timezone", "lang", "currency", "vision", "profession_type"}
    SETTINGS_FIELDS = {"theme", "ai_personality", "notifications", "email_reminders"}
    USER_FIELDS     = {"name", "avatar_url"}

    profile_data  = {k: v for k, v in body.items() if k in PROFILE_FIELDS}
    settings_data = {k: v for k, v in body.items() if k in SETTINGS_FIELDS}
    user_data     = {k: v for k, v in body.items() if k in USER_FIELDS}

    if profile_data:
        query(db.table("user_profiles").update(profile_data).eq("user_id", g.uid))

    if settings_data:
        query(db.table("user_settings").update(settings_data).eq("user_id", g.uid))

    if user_data:
        if "name" in user_data:
            n = str(user_data["name"])[:100]
            user_data["initials"] = "".join(w[0].upper() for w in n.split()[:2]) or "U"
        query(db.table("users").update(user_data).eq("id", g.uid))

    return success(get_full_profile(g.uid))


@user_routes.patch("/api/user/locale")
@auth_required
def save_locale():
    locale = g.locale
    db = get_db()

    # Try saving all three locale fields; fall back to just timezone+lang
    # if the currency column doesn't exist yet in user_profiles
    try:
        query(db.table("user_profiles").update({
            "timezone": locale["timezone"],
            "lang":     locale["lang"],
            "currency": locale["currency"],
        }).eq("user_id", g.uid))
    except Exception:
        # currency column may not exist — save what we can
        query(db.table("user_profiles").update({
            "timezone": locale["timezone"],
            "lang":     locale["lang"],
        }).eq("user_id", g.uid))

    return success(locale)