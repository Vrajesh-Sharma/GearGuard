from flask import Blueprint, request, jsonify
from .supabase_client import get_supabase

equipment_bp = Blueprint("equipment", __name__, url_prefix="/api/equipment")

@equipment_bp.get("")
def list_equipment():
    supabase = get_supabase()
    q = request.args.get("q")
    dept = request.args.get("department")
    owner = request.args.get("owner_employee_id")

    query = supabase.table("equipment").select("*")
    if q:
        query = query.ilike("name", f"%{q}%")
    if dept:
        query = query.eq("department", dept)
    if owner:
        query = query.eq("owner_employee_id", owner)

    res = query.order("created_at", desc=True).execute()
    return jsonify(res.data), 200

@equipment_bp.get("/<equipment_id>")
def get_equipment(equipment_id):
    """Auto-fill endpoint: returns equipment + team + default technician name (if exists)."""
    supabase = get_supabase()

    eq_res = supabase.table("equipment").select("*").eq("id", equipment_id).single().execute()
    eq = eq_res.data

    team = None
    if eq.get("team_id"):
        team_res = supabase.table("teams").select("id,name").eq("id", eq["team_id"]).single().execute()
        team = team_res.data

    tech = None
    if eq.get("default_technician_id"):
        tech_res = supabase.table("users").select("id,full_name,avatar_url").eq("id", eq["default_technician_id"]).single().execute()
        tech = tech_res.data

    return jsonify({
        "equipment": eq,
        "team": team,
        "default_technician": tech,
    }), 200

@equipment_bp.get("/<equipment_id>/requests")
def equipment_requests(equipment_id):
    """Smart button list: all requests for this equipment."""
    supabase = get_supabase()
    res = supabase.table("maintenance_requests").select("*").eq("equipment_id", equipment_id).order("created_at", desc=True).execute()
    return jsonify(res.data), 200

@equipment_bp.get("/<equipment_id>/open-count")
def equipment_open_count(equipment_id):
    """Smart button badge count: open requests only."""
    supabase = get_supabase()
    res = supabase.table("maintenance_requests").select("id,status").eq("equipment_id", equipment_id).execute()
    open_count = sum(1 for r in res.data if r["status"] in ["new", "in_progress"])
    return jsonify({"equipment_id": equipment_id, "open_count": open_count}), 200
