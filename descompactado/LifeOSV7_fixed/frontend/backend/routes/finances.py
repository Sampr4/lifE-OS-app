"""
routes/finances.py
Finance entry CRUD + weekly/metrics endpoints.
"""
from flask      import Blueprint, request, g
from datetime   import date
from middleware.auth import auth_required
from services.user   import get_finances, get_weekly, get_metrics
from utils.database  import get_db, query
from services.data_generation import _insert_with_fallback
from utils.responses import success, error

finance_routes = Blueprint("finance_routes", __name__)


@finance_routes.get("/api/finances")
@auth_required
def list_finances():
    return success(get_finances(g.uid))


@finance_routes.post("/api/finances")
@auth_required
def create_finance():
    body     = request.get_json(silent=True) or {}
    cat_name = str(body.get("category_name", "")).strip()
    if not cat_name:
        return error("MISSING_FIELD", "category_name is required.", 400)
    month  = date.today().replace(day=1).isoformat()
    budget = float(body.get("budget", 0))
    spent  = float(body.get("spent", 0))
    pct    = round(spent / budget * 100, 2) if budget > 0 else 0
    res = _insert_with_fallback(
        "finance_entries",
        {
            "user_id":         g.uid,
            "category_name":   cat_name[:100],
            "icon":            str(body.get("icon", "💰")),
            "budget":          budget,
            "spent":           spent,
            "pct_used":        pct,
            "reference_month": month,
            "source":          "manual",
        },
        optional_keys=["source"],
    )
    return success(res[0] if isinstance(res, list) and res else (res or {}), status=201)


@finance_routes.patch("/api/finances/<fid>")
@auth_required
def update_finance(fid):
    body    = request.get_json(silent=True) or {}
    allowed = {"category_name", "icon", "budget", "spent"}
    data    = {k: v for k, v in body.items() if k in allowed}
    if "budget" in data or "spent" in data:
        budget = float(data.get("budget", 0))
        spent  = float(data.get("spent", 0))
        if budget > 0:
            data["pct_used"] = round(spent / budget * 100, 2)
    query(get_db().table("finance_entries").update(data).eq("id", fid).eq("user_id", g.uid))
    return success({"updated": True})


@finance_routes.get("/api/weekly")
@auth_required
def get_weekly_data():
    return success(get_weekly(g.uid))


@finance_routes.get("/api/metrics")
@auth_required
def get_metrics_data():
    return success(get_metrics(g.uid))
