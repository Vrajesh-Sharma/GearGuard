from flask import Blueprint, request, jsonify
from datetime import date, datetime
from .supabase_client import get_supabase

requests_bp = Blueprint("requests", __name__, url_prefix="/api/requests")

@requests_bp.get("")
def list_requests():
    supabase = get_supabase()
    equipment_id = request.args.get("equipmentId") or request.args.get("equipment_id")
    req_type = request.args.get("type")  # preventive/corrective

    q = supabase.table("maintenance_requests").select("*")
    if equipment_id:
        q = q.eq("equipment_id", equipment_id)
    if req_type:
        q = q.eq("request_type", req_type)

    res = q.order("created_at", desc=True).execute()
    return jsonify(res.data), 200

@requests_bp.post("")
def create_request():
    """Creates request. For Breakdown: status starts 'new'. For Preventive: scheduled_date required."""
    supabase = get_supabase()
    payload = request.get_json(force=True)

    # minimal validation
    if not payload.get("subject"):
        return jsonify({"error": "subject required"}), 400
    if not payload.get("equipment_id"):
        return jsonify({"error": "equipment_id required"}), 400

    if payload.get("request_type") == "preventive" and not payload.get("scheduled_date"):
        return jsonify({"error": "scheduled_date required for preventive"}), 400

    payload.setdefault("status", "new")
    payload.setdefault("created_at", datetime.utcnow().isoformat())

    res = supabase.table("maintenance_requests").insert(payload).execute()
    return jsonify(res.data[0]), 201

@requests_bp.put("/<request_id>/status")
def update_status(request_id):
    """Kanban drag-drop: new | in_progress | repaired | scrap."""
    supabase = get_supabase()
    body = request.get_json(force=True)
    status = body.get("status")

    if status not in ["new", "in_progress", "repaired", "scrap"]:
        return jsonify({"error": "invalid status"}), 400

    patch = {"status": status, "updated_at": datetime.utcnow().isoformat()}

    # If repaired, optionally set completed_date
    if status == "repaired":
        patch["completed_date"] = date.today().isoformat()

    res = supabase.table("maintenance_requests").update(patch).eq("id", request_id).execute()

    # Scrap logic (optional): mark equipment as scrapped if request moved to scrap
    # Spec says: indicate equipment no longer usable when moved to Scrap stage. [file:2]
    if status == "scrap":
        # fetch equipment_id, then update equipment.status
        req_row = res.data[0] if res.data else None
        if req_row and req_row.get("equipment_id"):
            supabase.table("equipment").update({"status": "scrapped"}).eq("id", req_row["equipment_id"]).execute()

    return jsonify(res.data[0] if res.data else {"ok": True}), 200

@requests_bp.post("/<request_id>/complete")
def complete_request(request_id):
    """Technician records hours_spent and moves to repaired."""
    supabase = get_supabase()
    body = request.get_json(force=True)

    hours_spent = body.get("hours_spent")
    if hours_spent is None:
        return jsonify({"error": "hours_spent required"}), 400

    patch = {
        "hours_spent": hours_spent,
        "status": "repaired",
        "completed_date": date.today().isoformat(),
        "updated_at": datetime.utcnow().isoformat(),
    }
    res = supabase.table("maintenance_requests").update(patch).eq("id", request_id).execute()
    return jsonify(res.data[0]), 200
