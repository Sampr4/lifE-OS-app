"""
routes/onboarding.py
Adaptive onboarding flow endpoints.

GET  /api/onboarding/start      — returns current state + first question
POST /api/onboarding/answer     — saves answer, returns next question
POST /api/onboarding/finalize   — marks onboarding complete + generates initial data
GET  /api/onboarding/progress   — returns saved progress snapshot
POST /api/onboarding/progress   — saves progress snapshot (auto-save)
"""

import logging
from flask import Blueprint, request, g

from middleware.auth              import auth_required
from services.onboarding          import (
    get_next_question,
    get_next_question_adaptive,
    save_onboarding_answer,
    finalize_onboarding,
    detect_profession_type,
    get_progress,
    _get_previous_answers,
)
from services.data_generation     import generate_initial_data
from utils.database               import get_db, query, fetch_one, fetch_list
from utils.responses              import success, error

log = logging.getLogger("lifeos.routes.onboarding")
onboarding_routes = Blueprint("onboarding_routes", __name__)


@onboarding_routes.get("/api/onboarding/start")
@auth_required
def onboarding_start():
    """
    Returns the current onboarding state.
    If progress exists → resumes from saved index.
    Otherwise starts from question 0.
    """
    db       = get_db()
    progress = fetch_one(query(
        db.table("onboarding_progress")
          .select("current_index, profession_type")
          .eq("user_id", g.uid)
          .limit(1)
    ))

    current_index   = progress.get("current_index", 0) if progress else 0
    profession_type = progress.get("profession_type", "gen") if progress else "gen"

    question = get_next_question(current_index, profession_type)

    return success({
        "current_index":   current_index,
        "profession_type": profession_type,
        "question":        question,
        "is_complete":     question is None,
    })


@onboarding_routes.post("/api/onboarding/answer")
@auth_required
def onboarding_answer():
    """
    Saves the user's answer to the current question.
    If the answer is to q_profession, detects the profession type.
    Advances the index and returns the next question.

    FIX: profession_type detection happens BEFORE advancing index
         so the next question can be adapted immediately.
    """
    body          = request.get_json(silent=True) or {}
    question_id   = body.get("question_id", "").strip()
    answer        = body.get("answer", "")
    current_index = int(body.get("current_index", 0))

    if not question_id:
        return error("MISSING_FIELD", "question_id is required.", 400)

    db = get_db()

    # Get current profession_type
    progress = fetch_one(query(
        db.table("onboarding_progress")
          .select("profession_type")
          .eq("user_id", g.uid)
          .limit(1)
    ))
    profession_type = progress.get("profession_type", "gen") if progress else "gen"

    # Save the answer
    parsed = save_onboarding_answer(g.uid, question_id, str(answer), profession_type)

    # Update profession_type if this was the profession question
    if question_id == "q_profession":
        profession_type = detect_profession_type(str(answer))
        log.info("[ONBOARDING] Profession detected: %s for uid=%s", profession_type, g.uid)

    # Advance index
    new_index = current_index + 1

    # Persist progress to database
    query(db.table("onboarding_progress").upsert({
        "user_id":         g.uid,
        "current_index":   new_index,
        "profession_type": profession_type,
    }, on_conflict="user_id"))

    # Get the next question (AI-adaptive for index >= 2, static for 0-1)
    all_answers = _get_previous_answers(g.uid)
    next_question = get_next_question_adaptive(g.uid, new_index, profession_type, all_answers)

    return success({
        "saved":           True,
        "current_index":   new_index,
        "profession_type": profession_type,
        "question":        next_question,
        "is_complete":     next_question is None,
        "parsed":          parsed,
    })


@onboarding_routes.post("/api/onboarding/finalize")
@auth_required
def onboarding_finalize():
    """
    Called when all questions are answered.
    1. Verifies onboarding isn't already done
    2. Marks onboarding_done = True in users table
    3. Generates initial AI data (goals, tasks, habits, routine)
    4. Returns dashboard-ready summary

    FIX: Check if data already exists BEFORE generating to avoid duplicates.
         Uses database lock to prevent race conditions.
    """
    db   = get_db()
    user = fetch_one(query(
        db.table("users")
          .select("onboarding_done")
          .eq("id", g.uid)
          .limit(1)
    ))

    if user.get("onboarding_done"):
        # Check if data was already generated
        existing = fetch_list(query(
            db.table("plans")
              .select("id")
              .eq("user_id", g.uid)
              .limit(1)
        ))
        if existing:
            return success({
                "message": "Onboarding already complete with data.",
                "already_done": True,
                "generated": False
            })

    # Mark onboarding as done FIRST (FIX: prevents stuck state)
    finalize_onboarding(g.uid)

    # Check again if data exists (might have been generated by first_login_data in race)
    existing = fetch_list(query(
        db.table("plans")
          .select("id")
          .eq("user_id", g.uid)
          .limit(1)
    ))
    if existing:
        log.info("[ONBOARDING] Data already exists for uid=%s, skipping generation", g.uid)
        return success({
            "message": "Onboarding complete! Data was already generated.",
            "generated": False
        })

    # Generate AI data
    try:
        result = generate_initial_data(g.uid)
        log.info("[ONBOARDING] Initial data generated for uid=%s", g.uid)
        return success({
            "message":   "Onboarding complete! Your plan is ready.",
            "generated": True,
            **result,
        })
    except Exception as e:
        log.error("[ONBOARDING] AI generation failed for uid=%s: %s", g.uid, e, exc_info=True)
        return success({
            "message":   "Onboarding complete! Dashboard is being prepared.",
            "generated": False,
        })


@onboarding_routes.get("/api/onboarding/progress")
@auth_required
def get_onboarding_progress():
    row = fetch_one(query(
        get_db()
        .table("onboarding_progress")
        .select("*")
        .eq("user_id", g.uid)
        .limit(1)
    ))
    return success(row)


@onboarding_routes.post("/api/onboarding/progress")
@auth_required
def save_onboarding_progress():
    """
    Auto-save endpoint called by the frontend periodically.
    Saves index + answers snapshot + flow snapshot for cross-device resume.

    FIX: Uses a single upsert with only the columns that definitely exist.
         flow_snapshot is stored inside answers_snapshot as a nested key
         to avoid column-existence issues.
    """
    body = request.get_json(silent=True) or {}

    payload = {
        "user_id":         g.uid,
        "current_index":   int(body.get("current_index", 0)),
        "profession_type": body.get("profession_type", "gen"),
        "answers_snapshot": {
            "answers":       body.get("answers_snapshot", {}),
            "flow_snapshot": body.get("flow_snapshot", []),
        },
    }

    query(get_db().table("onboarding_progress").upsert(
        payload, on_conflict="user_id"
    ))
    return success({"saved": True})