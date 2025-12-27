import { useState, useEffect, useMemo } from "react";
import { supabase } from "../lib/supabaseClient";
import { toast } from "react-hot-toast";

export default function RequestForm({ onClose, onSuccess, prefill }) {
  const [formData, setFormData] = useState({
    subject: "",
    description: "",
    equipment_id: "",
    category: "",
    team_id: "",
    assigned_technician_id: "",
    request_type: "corrective",
    priority: "medium",
    scheduled_date: "",
  });

  const [equipment, setEquipment] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(false);

  const [scrapAttempt, setScrapAttempt] = useState(false);

  useEffect(() => {
    if (!prefill) return;

    setFormData((p) => ({
      ...p,
      ...(prefill.request_type ? { request_type: prefill.request_type } : {}),
      ...(prefill.scheduled_date ? { scheduled_date: prefill.scheduled_date } : {}),
    }));
  }, [prefill]);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("equipment")
        .select("id,name,serial_number,category,team_id,default_technician_id,status")
        .order("name", { ascending: true });

      if (error) {
        console.error(error);
        toast.error("Failed to load equipment");
        return;
      }

      setEquipment(data || []);
    })();
  }, []);

  const equipmentById = useMemo(() => {
    const map = new Map();
    equipment.forEach((e) => map.set(e.id, e));
    return map;
  }, [equipment]);

  const selectedEq = formData.equipment_id ? equipmentById.get(formData.equipment_id) : null;
  const isSelectedScrapped = selectedEq?.status === "scrapped";

  const handleEquipmentChange = async (e) => {
    const equipmentId = e.target.value;
    setScrapAttempt(false);

    if (!equipmentId) {
      setFormData((p) => ({
        ...p,
        equipment_id: "",
        team_id: "",
        category: "",
        assigned_technician_id: "",
      }));
      setTechnicians([]);
      return;
    }

    const eqLocal = equipmentById.get(equipmentId);

    if (eqLocal?.status === "scrapped") {
      setScrapAttempt(true);
      toast.error("This equipment is scrapped and cannot be used for new requests.");

      setFormData((p) => ({
        ...p,
        equipment_id: "",
        team_id: "",
        category: "",
        assigned_technician_id: "",
      }));
      setTechnicians([]);
      return;
    }

    setFormData((p) => ({ ...p, equipment_id: equipmentId }));

    try {
      const { data: eq, error } = await supabase
        .from("equipment")
        .select("status, team_id, category, default_technician_id")
        .eq("id", equipmentId)
        .single();

      if (error) throw error;

      if (eq?.status === "scrapped") {
        setScrapAttempt(true);
        toast.error("This equipment is scrapped and cannot be used for new requests.");

        setFormData((p) => ({
          ...p,
          equipment_id: "",
          team_id: "",
          category: "",
          assigned_technician_id: "",
        }));
        setTechnicians([]);
        return;
      }

      if (eq) {
        setFormData((p) => ({
          ...p,
          team_id: eq.team_id,
          category: eq.category,
          assigned_technician_id: eq.default_technician_id,
        }));

        if (eq.team_id) {
          const { data: members, error: mErr } = await supabase
            .from("users")
            .select("id,full_name,avatar_url")
            .eq("team_id", eq.team_id);

          if (mErr) throw mErr;
          setTechnicians(members || []);
        } else {
          setTechnicians([]);
        }
      }
    } catch (err) {
      console.error("Auto-fill failed:", err);
      toast.error("Failed to auto-fill team");
    }
  };

  const resetForm = () => {
    setFormData({
      subject: "",
      description: "",
      equipment_id: "",
      category: "",
      team_id: "",
      assigned_technician_id: "",
      request_type: prefill?.request_type || "corrective",
      priority: "medium",
      scheduled_date: prefill?.scheduled_date || "",
    });
    setTechnicians([]);
    setScrapAttempt(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!formData.subject || !formData.equipment_id) {
        toast.error("Subject and Equipment are required");
        setLoading(false);
        return;
      }

      if (formData.request_type === "preventive" && !formData.scheduled_date) {
        toast.error("Scheduled Date is required for Preventive requests");
        setLoading(false);
        return;
      }

      const eqLocal = equipmentById.get(formData.equipment_id);
      if (eqLocal?.status === "scrapped") {
        toast.error("Cannot create a request for scrapped equipment.");
        setLoading(false);
        return;
      }

      const { data: eqCheck, error: eqErr } = await supabase
        .from("equipment")
        .select("status")
        .eq("id", formData.equipment_id)
        .single();

      if (eqErr) throw eqErr;

      if (eqCheck?.status === "scrapped") {
        toast.error("Cannot create a request for scrapped equipment.");
        setLoading(false);
        return;
      }

      const payload = {
        subject: formData.subject,
        description: formData.description,
        equipment_id: formData.equipment_id,
        category: formData.category,
        team_id: formData.team_id,
        assigned_technician_id: formData.assigned_technician_id || null,
        request_type: formData.request_type,
        priority: formData.priority,
        scheduled_date: formData.scheduled_date || null,
        status: "new",
        created_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("maintenance_requests")
        .insert([payload])
        .select()
        .single();

      if (error) throw error;

      toast.success("Request created successfully!");
      resetForm();
      onSuccess?.(data);
      onClose?.();
    } catch (error) {
      console.error("Submit error:", error);
      toast.error(error.message || "Failed to create request");
    } finally {
      setLoading(false);
    }
  };

  const selectHasError = scrapAttempt || isSelectedScrapped;

  const inputBase =
    "w-full rounded-2xl border border-white/10 bg-white/10 backdrop-blur px-4 py-3 text-white placeholder:text-white/40 outline-none focus:ring-2 focus:ring-blue-500/40";
  const selectBase =
    "w-full rounded-2xl border border-white/10 bg-white/10 backdrop-blur px-4 py-3 text-white outline-none focus:ring-2 focus:ring-blue-500/40";
  const labelBase = "block text-xs font-semibold text-white/70 mb-2";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-white/10 bg-white/10 backdrop-blur-xl shadow-glass">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/25 via-transparent to-transparent" />

        {/* Header */}
        <div className="relative sticky top-0 border-b border-white/10 bg-white/10 backdrop-blur-xl px-6 py-4 flex justify-between items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs text-white/80">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              Create request
            </div>
            <h2 className="mt-2 text-xl md:text-2xl font-extrabold tracking-tight text-white">
              Maintenance Request
            </h2>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-white/70 hover:text-white hover:bg-white/15 transition"
            type="button"
            aria-label="Close"
            title="Close"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="relative p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Subject */}
          <div>
            <label className={labelBase}>Subject *</label>
            <input
              type="text"
              required
              placeholder="e.g., Leaking Oil"
              value={formData.subject}
              onChange={(e) => setFormData((p) => ({ ...p, subject: e.target.value }))}
              className={inputBase}
            />
          </div>

          {/* Equipment */}
          <div>
            <label className={labelBase}>Equipment *</label>
            <select
              required
              value={formData.equipment_id}
              onChange={handleEquipmentChange}
              className={`${selectBase} ${selectHasError ? "ring-2 ring-red-500/40 border-red-500/30 bg-red-500/10" : ""}`}
            >
              <option value="" className="text-slate-900">
                Select Equipment...
              </option>

              {equipment
                .filter((eq) => eq.status !== "scrapped")
                .map((eq) => (
                  <option key={eq.id} value={eq.id} className="text-slate-900">
                    {eq.name} ({eq.serial_number})
                  </option>
                ))}

              {equipment.some((eq) => eq.status === "scrapped") && (
                <optgroup label="Scrapped (Not usable)">
                  {equipment
                    .filter((eq) => eq.status === "scrapped")
                    .map((eq) => (
                      <option key={eq.id} value={eq.id} disabled className="text-slate-900">
                        [SCRAPPED] {eq.name} ({eq.serial_number})
                      </option>
                    ))}
                </optgroup>
              )}
            </select>

            {(scrapAttempt || isSelectedScrapped) && (
              <div className="mt-3 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-100">
                This equipment is scrapped and cannot be selected for new maintenance requests.
              </div>
            )}
          </div>

          {/* Team (Auto-filled) */}
          <div>
            <label className={labelBase}>Team (Auto-filled)</label>
            <input
              type="text"
              disabled
              value={
                equipment.find((e) => e.id === formData.equipment_id)?.team_id
                  ? "Assigned Automatically"
                  : "Select equipment above"
              }
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white/60"
            />
          </div>

          {/* Technician */}
          <div>
            <label className={labelBase}>Technician</label>
            <select
              value={formData.assigned_technician_id || ""}
              onChange={(e) =>
                setFormData((p) => ({
                  ...p,
                  assigned_technician_id: e.target.value || null,
                }))
              }
              className={selectBase}
            >
              <option value="" className="text-slate-900">
                Unassigned
              </option>
              {technicians.map((tech) => (
                <option key={tech.id} value={tech.id} className="text-slate-900">
                  {tech.full_name}
                </option>
              ))}
            </select>
          </div>

          {/* Type + Priority */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelBase}>Type</label>
              <select
                value={formData.request_type}
                onChange={(e) => setFormData((p) => ({ ...p, request_type: e.target.value }))}
                className={selectBase}
              >
                <option value="corrective" className="text-slate-900">
                  Corrective (Breakdown)
                </option>
                <option value="preventive" className="text-slate-900">
                  Preventive (Checkup)
                </option>
              </select>
            </div>

            <div>
              <label className={labelBase}>Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData((p) => ({ ...p, priority: e.target.value }))}
                className={selectBase}
              >
                <option value="low" className="text-slate-900">Low</option>
                <option value="medium" className="text-slate-900">Medium</option>
                <option value="high" className="text-slate-900">High</option>
              </select>
            </div>
          </div>

          {/* Scheduled Date */}
          {formData.request_type === "preventive" && (
            <div>
              <label className={labelBase}>Scheduled Date</label>
              <input
                type="date"
                value={formData.scheduled_date}
                onChange={(e) => setFormData((p) => ({ ...p, scheduled_date: e.target.value }))}
                className={inputBase}
              />
            </div>
          )}

          {/* Description */}
          <div>
            <label className={labelBase}>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
              placeholder="Additional details..."
              rows="3"
              className={`${inputBase} resize-none`}
            />
          </div>

          {/* Footer buttons */}
          <div className="pt-4 border-t border-white/10 flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white/80 hover:bg-white/10 transition"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="rounded-2xl bg-white text-slate-900 px-4 py-2.5 text-sm font-extrabold shadow-soft hover:shadow-glass transition disabled:opacity-60"
            >
              {loading ? "Creating..." : "Create Request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
