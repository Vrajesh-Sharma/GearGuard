import { supabase } from "./supabaseClient";

// Equipment
export async function listEquipment({ q = "", department = "", owner = "" } = {}) {
  let query = supabase
    .from("equipment")
    .select("id,name,serial_number,category,department,location,owner_employee_id,team_id,default_technician_id,status,created_at");

  if (q) query = query.ilike("name", `%${q}%`);
  if (department) query = query.eq("department", department);
  if (owner) query = query.eq("owner_employee_id", owner);

  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function getEquipmentById(id) {
  const { data, error } = await supabase.from("equipment").select("*").eq("id", id).single();
  if (error) throw error;
  return data;
}

// Teams & users
export async function listTeams() {
  const { data, error } = await supabase.from("teams").select("*").order("name");
  if (error) throw error;
  return data;
}

export async function listUsersByTeam(teamId) {
  const { data, error } = await supabase.from("users").select("id,full_name,avatar_url,team_id").eq("team_id", teamId);
  if (error) throw error;
  return data;
}

// Requests
export async function listRequests({ equipmentId = "", type = "" } = {}) {
  let q = supabase
    .from("maintenance_requests")
    .select("*");

  if (equipmentId) q = q.eq("equipment_id", equipmentId);
  if (type) q = q.eq("request_type", type);

  const { data, error } = await q.order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function createRequest(payload) {
  const { data, error } = await supabase.from("maintenance_requests").insert(payload).select("*").single();
  if (error) throw error;
  return data;
}

export async function updateRequest(id, patch) {
  const { data, error } = await supabase.from("maintenance_requests").update(patch).eq("id", id).select("*").single();
  if (error) throw error;
  return data;
}
