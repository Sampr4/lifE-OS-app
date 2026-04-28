"""
main.py
LifeOS v5 — Application entry point.
App factory pattern. All configuration happens here.
"""

import os
import logging
from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
log = logging.getLogger("lifeos")


def create_app() -> Flask:
    app = Flask(__name__)
    app.config["JSON_AS_ASCII"]  = False
    app.config["JSON_SORT_KEYS"] = False

    # ── CORS ─────────────────────────────────────────────────
    is_dev = os.environ.get("FLASK_ENV") == "development"
    raw_origins = os.environ.get("ALLOWED_ORIGINS", "")
    # In development, allow ALL origins (includes file://, localhost:*, etc.)
    # In production, restrict to the configured list
    origins = "*" if is_dev else (raw_origins.split(",") if raw_origins else "*")
    cors_cfg = {
        "origins":       origins,
        "methods":       ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization",
                          "X-Timezone", "X-Language", "X-Currency"],
        "supports_credentials": False,
    }
    CORS(app, resources={r"/api/*": cors_cfg, r"/health": cors_cfg})

    # ── Register Blueprints ──────────────────────────────────
    from routes.system    import system_routes
    from routes.auth      import auth_routes
    from routes.user      import user_routes
    from routes.onboarding import onboarding_routes
    from routes.dashboard import dashboard_routes
    from routes.tasks     import task_routes
    from routes.goals     import goal_routes
    from routes.habits    import habit_routes
    from routes.routine   import routine_routes
    from routes.finances  import finance_routes
    from routes.checkin   import checkin_routes
    from routes.ai        import ai_routes
    from routes.agenda    import agenda_routes
    from routes.webhooks  import webhook_routes

    for bp in (
        system_routes, auth_routes, user_routes, onboarding_routes,
        dashboard_routes, task_routes, goal_routes, habit_routes,
        routine_routes, finance_routes, checkin_routes, ai_routes,
        agenda_routes, webhook_routes,
    ):
        app.register_blueprint(bp)

    # ── Global Error Handlers ────────────────────────────────
    from utils.responses import error
    import traceback

    @app.errorhandler(404)
    def e404(_):
        return error("NOT_FOUND", "Endpoint not found.", 404)

    @app.errorhandler(405)
    def e405(_):
        return error("METHOD_NOT_ALLOWED", "Method not allowed.", 405)

    @app.errorhandler(500)
    def e500(e):
        log.error("[500] %s\n%s", e, traceback.format_exc())
        return error("INTERNAL_ERROR", "Internal server error.", 500)

    @app.errorhandler(Exception)
    def handle_exception(e):
        log.error("[UNHANDLED] %s\n%s", e, traceback.format_exc())
        return error("INTERNAL_ERROR", f"Unexpected error: {str(e)}", 500)

    log.info("✅ LifeOS v5 — app created with %d blueprints", len(app.blueprints))
    return app


if __name__ == "__main__":
    from scheduler import start_scheduler

    app   = create_app()
    port  = int(os.environ.get("PORT", 5000))
    debug = os.environ.get("FLASK_ENV") == "development"

    start_scheduler()

    log.info("🚀 LifeOS v5 starting on port %d (debug=%s)", port, debug)
    app.run(host="0.0.0.0", port=port, debug=debug)