"""
routes/feedback_support.py
Persist feedback and support messages from frontend forms.
"""

from flask import Blueprint, request, g
from middleware.auth import auth_required
from services.data_generation import _insert_with_fallback
from utils.responses import success, error

feedback_support_routes = Blueprint("feedback_support_routes", __name__)


@feedback_support_routes.post("/api/feedback")
@auth_required
def create_feedback():
    body = request.get_json(silent=True) or {}
    message = str(body.get("message", "")).strip()
    if not message:
        return error("MISSING_FIELD", "message is required.", 400)
    category = str(body.get("category", "Outro"))[:100]
    rating = body.get("rating")
    payload = {
        "user_id": g.uid,
        "message": message[:5000],
        "category": category,
        "rating": int(rating) if str(rating).isdigit() else None,
        "source": "dashboard",
        "status": "new",
    }
    res = _insert_with_fallback("feedback_entries", payload, optional_keys=["source", "status", "rating"])
    if res is None:
        return error("DB_ERROR", "Failed to save feedback.", 500)
    return success(res.data, status=201)


@feedback_support_routes.post("/api/support")
@auth_required
def create_support_ticket():
    body = request.get_json(silent=True) or {}
    subject = str(body.get("subject", "")).strip()
    message = str(body.get("message", "")).strip()
    if not subject or not message:
        return error("MISSING_FIELD", "subject and message are required.", 400)
    payload = {
        "user_id": g.uid,
        "subject": subject[:200],
        "message": message[:5000],
        "status": "open",
        "source": "dashboard",
    }
    res = _insert_with_fallback("support_tickets", payload, optional_keys=["source", "status"])
    if res is None:
        return error("DB_ERROR", "Failed to save support ticket.", 500)
    return success(res.data, status=201)
