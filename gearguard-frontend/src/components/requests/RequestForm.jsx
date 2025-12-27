import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import Button from "../common/Button";
import { PRIORITIES } from "../../utils/constants";
import { createRequest, getEquipmentById, listEquipment, listTeams, listUsersByTeam } from "../../app/db";
import { isoDate } from "../../utils/dates";

export default function RequestForm({ open, onClose, onCreated, presetEquipmentId }) {
  const [equipmentOptions, setEquipmentOptions] = useState([]);
  const [teams, setTeams] = useState([]);
  const [technicians, setTechnicians] = useState([]);

  const [form, setForm] = useState({
    subject: "",
    description: "",
    equipment_id: presetEquipmentId || "",
    category: "",
    team_id: "",
    assigned_technician_id: "",
    request_type: "corrective",
    priority: "medium",
    scheduled_date: "",
  });

  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        const [eq, tm] = await Promise.all([listEquipment(), listTeams()]);
        setEquipmentOptions(eq);
        setTeams(tm);
      } catch (e) {
        toast.error(e.message ?? "Failed loading form data");
      }
    })();
  }, [open]);

  // Auto-fill when equipment changes
  useEffect(() => {
    if (!open) return;
    if (!form.equipment_id) return;

    (async () => {
      try {
        const eq = await getEquipmentById(form.equipment_id);

        // Auto-fill: category, team, default technician
        setForm((p) => ({
          ...p,
          category: eq.category || "",
          team_id: eq.team_id || "",
          assigned_technician_id: eq.default_technician_id || "",
        }));

        if (eq.team_id) {
          const members = await listUsersByTeam(eq.team_id);
          setTechnicians(members);
        } else {
          setTechnicians([]);
        }
      } catch (e) {
        toast.error(e.message ?? "Auto-fill failed");
      }
    })();
  }, [form.equipment_id, open]);

  // If team changes manually, refetch team members
  useEffect(() => {
    if (!open) return;
    if (!form.team_id) return;

    (async () => {
      try {
        const members = await listUsersByTeam(form.team_id);
        setTechnicians(members);
      } catch (e) {
        toast.error(e.message ?? "Failed loading team members");
      }
    })();
  }, [form.team_id, open]);

  const teamName = useMemo(
    () => teams.find(t => t.id === form.team_id)?.name || "",
    [teams, form.team_id]
  );

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      if (!form.subject.trim()) throw new Error("Subject is required");
      if (!form.equipment_id) throw new Error("Equipment is required");

      const payload = {
        subject: form.subject,
        description: form.description,
        equipment_id: form.equipment_id,
        team_id: form.team_id,
        assigned_technician_id: form.assigned_technician_id || null,
        request_type: form.request_type, // corrective|preventive
        status: "new",
        priority: form.priority,
        scheduled_date: form.request_type === "preventive" ? (form.scheduled_date || isoDate(new Date())) : null,
        hours_spent: null,
        created_at: new Date().toISOString(),
      };

      const created = await createRequest(payload);
      toast.success("Request created");
      onCreated?.(created);
      onClose();
      setForm((p) => ({ ...p, subject: "", description: "" }));
    } catch (e2) {
      toast.error(e2.message ?? "Failed to create request");
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute left-1/2 top-1/2 w-[95vw] max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white shadow-xl">
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="font-semibold">Create Maintenance Request</h3>
          <button className="text-gray-500 hover:text-gray-900" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="text-sm font-medium">Subject *</label>
            <input className="mt-1 w-full border rounded-md px-3 py-2" value={form.subject}
              onChange={(e) => setForm(p => ({ ...p, subject: e.target.value }))} />
          </div>

          <div className="md:col-span-2">
            <label className="text-sm font-medium">Equipment *</label>
            <select className="mt-1 w-full border rounded-md px-3 py-2" value={form.equipment_id}
              onChange={(e) => setForm(p => ({ ...p, equipment_id: e.target.value }))}>
              <option value="">Select equipment</option>
              {equipmentOptions.map(eq => (
                <option key={eq.id} value={eq.id}>{eq.name} ({eq.serial_number})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium">Category (Auto)</label>
            <input className="mt-1 w-full border rounded-md px-3 py-2 bg-gray-50" value={form.category} disabled />
          </div>

          <div>
            <label className="text-sm font-medium">Team (Auto)</label>
            <input className="mt-1 w-full border rounded-md px-3 py-2 bg-gray-50" value={teamName} disabled />
          </div>

          <div>
            <label className="text-sm font-medium">Technician</label>
            <select className="mt-1 w-full border rounded-md px-3 py-2" value={form.assigned_technician_id}
              onChange={(e) => setForm(p => ({ ...p, assigned_technician_id: e.target.value }))}>
              <option value="">Unassigned</option>
              {technicians.map(u => (
                <option key={u.id} value={u.id}>{u.full_name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium">Priority</label>
            <select className="mt-1 w-full border rounded-md px-3 py-2" value={form.priority}
              onChange={(e) => setForm(p => ({ ...p, priority: e.target.value }))}>
              {PRIORITIES.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="text-sm font-medium">Request Type</label>
            <div className="mt-2 flex gap-4 text-sm">
              <label className="flex items-center gap-2">
                <input type="radio" checked={form.request_type === "corrective"}
                  onChange={() => setForm(p => ({ ...p, request_type: "corrective" }))} />
                Corrective
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" checked={form.request_type === "preventive"}
                  onChange={() => setForm(p => ({ ...p, request_type: "preventive" }))} />
                Preventive
              </label>
            </div>
          </div>

          {form.request_type === "preventive" && (
            <div className="md:col-span-2">
              <label className="text-sm font-medium">Scheduled Date</label>
              <input type="date" className="mt-1 w-full border rounded-md px-3 py-2"
                value={form.scheduled_date}
                onChange={(e) => setForm(p => ({ ...p, scheduled_date: e.target.value }))} />
            </div>
          )}

          <div className="md:col-span-2">
            <label className="text-sm font-medium">Description</label>
            <textarea className="mt-1 w-full border rounded-md px-3 py-2 min-h-24" value={form.description}
              onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))} />
          </div>

          <div className="md:col-span-2 flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit">Create</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
