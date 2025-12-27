from flask import Blueprint, jsonify
from .supabase_client import get_supabase

teams_bp = Blueprint("teams", __name__, url_prefix="/api/teams")

@teams_bp.get("")
def list_teams():
    supabase = get_supabase()
    res = supabase.table("teams").select("*").order("name").execute()
    return jsonify(res.data), 200

@teams_bp.get("/<team_id>/members")
def team_members(team_id):
    supabase = get_supabase()
    res = supabase.table("users").select("id,full_name,avatar_url,team_id,role").eq("team_id", team_id).order("full_name").execute()
    return jsonify(res.data), 200
