"""
utils/responses.py
Standardized JSON response helpers for all routes.
"""

import logging
from flask import jsonify

log = logging.getLogger("lifeos.responses")


def success(data=None, status: int = 200, **extra):
    """Standard success response."""
    payload = {"success": True}
    if data is not None:
        payload["data"] = data
    payload.update(extra)
    return jsonify(payload), status


def error(code: str, message: str, status: int = 400):
    """Standard error response with structured payload."""
    log.warning("[ERR %d] %s — %s", status, code, message)
    return jsonify({"success": False, "error": code, "message": message}), status
