"""
routes/system.py
System health check endpoints.
"""
from flask import Blueprint
from utils.database  import get_db, query
from utils.responses import success

system_routes = Blueprint("system_routes", __name__)
VERSION = "5.0.0"


@system_routes.get("/health")
def health_simple():
    return success({"status": "ok", "version": VERSION})


@system_routes.get("/api/system/health")
def sys_health():
    db_ok = False
    try:
        query(get_db().table("users").select("id").limit(1))
        db_ok = True
    except Exception:
        pass
    return success({
        "status":  "ok" if db_ok else "degraded",
        "db":      "connected" if db_ok else "error",
        "version": VERSION,
    })
