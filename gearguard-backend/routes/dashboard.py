from flask import Blueprint, jsonify
from datetime import date
from .supabase_client import get_supabase

dashboard_bp = Blueprint("dashboard", __name__, url_prefix="/api/dashboard")

@dashboard_bp.get("/stats")
def stats():
    supabase = get_supabase()
    res = supabase.table("maintenance_requests").select("id,status,scheduled_date,request_type").execute()
    rows = res.data

    total = len(rows)
    open_count = sum(1 for r in rows if r["status"] in ["new", "in_progress"])
    repaired = sum(1 for r in rows if r["status"] == "repaired")
    scrap = sum(1 for r in rows if r["status"] == "scrap")

    # simple overdue calc: scheduled_date < today and not closed
    today = date.today().isoformat()
    overdue = sum(
        1 for r in rows
        if r.get("scheduled_date") and r["scheduled_date"] < today and r["status"] in ["new", "in_progress"]
    )

    return jsonify({
        "total": total,
        "open": open_count,
        "overdue": overdue,
        "repaired": repaired,
        "scrap": scrap
    }), 200
