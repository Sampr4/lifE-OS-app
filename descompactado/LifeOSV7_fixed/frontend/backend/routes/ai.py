"""
routes/ai.py
AI-powered endpoints: plan generation, motivational messages, goal analysis.
"""
import logging
from flask import Blueprint, request, g
from middleware.auth          import auth_required
from services.ai              import get_motivational_message, analyze_goals
from services.data_generation import generate_initial_data
from services.user            import get_full_profile, get_goals, get_checkin_today, get_latest_plan
from utils.database           import get_db, query, fetch_one, fetch_list
from utils.responses          import success, error

log = logging.getLogger("lifeos.routes.ai")
ai_routes = Blueprint("ai_routes", __name__)


@ai_routes.get("/api/ai/plan/latest")
@auth_required
def get_plan():
    plan = get_latest_plan(g.uid)
    return success(plan or {})


@ai_routes.post("/api/ai/plan")
@auth_required
def regenerate_plan():
    """Force-regenerates the life plan for the user."""
    user = get_full_profile(g.uid)
    if not user.get("onboarding_done"):
        return error("NOT_READY", "Complete onboarding first.", 400)
    try:
        result = generate_initial_data(g.uid)
        return success(result)
    except Exception as e:
        log.error("[AI/PLAN] %s", e, exc_info=True)
        return error("AI_ERROR", str(e), 500)


@ai_routes.post("/api/ai/motivational")
@auth_required
def motivational():
    user = get_full_profile(g.uid)
    msg  = get_motivational_message(g.uid, {
        "name":       user.get("name", ""),
        "profession": user.get("profession", ""),
        "streak":     user.get("current_streak", 0),
    })
    return success({"message": msg})


@ai_routes.post("/api/ai/goals/analyze")
@auth_required
def goals_analysis():
    goals   = get_goals(g.uid)
    checkin = get_checkin_today(g.uid)
    result  = analyze_goals(g.uid, goals, checkin)
    return success(result)


@ai_routes.post("/api/first-login-data")
@auth_required
def first_login_data():
    """
    Called right after onboarding finishes.
    Generates initial data if it doesn't exist yet.
    Saves locale from request headers.
    
    FIX: Check if data already exists to avoid duplicate generation.
         Only generate if onboarding is done AND no data exists.
    """
    db   = get_db()
    user = fetch_one(query(
        db.table("users")
          .select("onboarding_done")
          .eq("id", g.uid)
          .limit(1)
    ))
    if not user.get("onboarding_done"):
        return error("NOT_READY", "Onboarding not yet complete.", 400)

    # Check if data was already generated (plans table)
    existing = fetch_list(query(
        db.table("plans").select("id").eq("user_id", g.uid).limit(1)
    ))
    if existing:
        return success({"message": "Data already exists.", "generated": False})

    # Also check goals as backup verification
    goals_exist = fetch_list(query(
        db.table("goals").select("id").eq("user_id", g.uid).limit(1)
    ))
    if goals_exist:
        return success({"message": "Data already exists (goals found).", "generated": False})

    # Save locale
    locale = g.locale
    query(db.table("user_profiles").update({
        "timezone": locale["timezone"],
        "lang":     locale["lang"],
        "currency": locale["currency"],
    }).eq("user_id", g.uid))

    try:
        result = generate_initial_data(g.uid)
        return success({"message": "Data generated!", "generated": True, **result})
    except Exception as e:
        log.error("[FIRST_LOGIN] %s", e, exc_info=True)
        return error("GEN_ERROR", str(e), 500)


@ai_routes.post("/api/ai/onboarding/parse")
@auth_required
def parse_onboarding():
    """Non-blocking endpoint called by frontend after each onboarding answer."""
    return success({"parsed": True})
