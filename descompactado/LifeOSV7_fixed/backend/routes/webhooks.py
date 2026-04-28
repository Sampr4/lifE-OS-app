"""
routes/webhooks.py
Webhook schedule CRUD (email reminders).
"""
from flask import Blueprint, request, g
from middleware.auth import auth_required
from utils.database  import get_db, query, fetch_list
from utils.responses import success, error

webhook_routes = Blueprint("webhook_routes", __name__)


@webhook_routes.get("/api/webhooks")
@auth_required
def list_webhooks():
    res = fetch_list(query(
        get_db().table("webhook_schedules")
                .select("*")
                .eq("user_id", g.uid)
                .order("trigger_hour")
    ))
    return success(res)


@webhook_routes.post("/api/webhooks")
@auth_required
def create_webhook():
    body = request.get_json(silent=True) or {}
    hour = int(body.get("trigger_hour", 19))
    if not (0 <= hour <= 23):
        return error("INVALID_HOUR", "trigger_hour must be 0–23.", 400)
    res = query(
        get_db().table("webhook_schedules").insert({
            "user_id":       g.uid,
            "webhook_type":  str(body.get("webhook_type", "email")),
            "subject":       str(body.get("subject", "LifeOS Reminder"))[:200],
            "body_template": str(body.get("body_template", "Olá {{name}}, não esqueça do check-in!"))[:1000],
            "trigger_hour":  hour,
            "is_active":     True,
        }).select("*").single()
    )
    return success(res.data if res else {}, status=201)


@webhook_routes.patch("/api/webhooks/<wid>")
@auth_required
def update_webhook(wid):
    body    = request.get_json(silent=True) or {}
    allowed = {"subject", "body_template", "trigger_hour", "is_active"}
    data    = {k: v for k, v in body.items() if k in allowed}
    query(get_db().table("webhook_schedules").update(data).eq("id", wid).eq("user_id", g.uid))
    return success({"updated": True})


@webhook_routes.delete("/api/webhooks/<wid>")
@auth_required
def delete_webhook(wid):
    query(get_db().table("webhook_schedules").delete().eq("id", wid).eq("user_id", g.uid))
    return success({"deleted": True})


@webhook_routes.get("/api/webhooks/logs")
@auth_required
def list_webhook_logs():
    res = fetch_list(query(
        get_db().table("webhook_logs")
                .select("id, fired_at, status, error_msg")
                .eq("user_id", g.uid)
                .order("fired_at", desc=True)
                .limit(50)
    ))
    return success(res)
