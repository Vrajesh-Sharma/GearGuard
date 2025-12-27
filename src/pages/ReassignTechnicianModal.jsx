import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import toast from "react-hot-toast";

export default function ReassignTechnicianModal({
  isOpen,
  onClose,
  request,
  onUpdated,
}) {
  const [loading, setLoading] = useState(false);
  const [technicians, setTechnicians] = useState([]);
  const [selectedTechId, setSelectedTechId] = useState("");

  const teamId = request?.team_id || null;

  useEffect(() => {
    if (!isOpen || !request) return;
    setSelectedTechId(request.assigned_technician_id || "");
  }, [isOpen, request]);

  useEffect(() => {
    const fetchTechs = async () => {
      if (!isOpen || !teamId) {
        setTechnicians([]);
        return;
      }
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("users")
          .select("id, full_name, email, role, team_id")
          .eq("team_id", teamId)
          .order("full_name", { ascending: true });

        if (error) throw error;
        setTechnicians(data || []);
      } catch (e) {
        console.error(e);
        toast.error("Failed to load team members");
      } finally {
        setLoading(false);
      }
    };

    fetchTechs();
  }, [isOpen, teamId]);

  const techOptions = useMemo(() => technicians, [technicians]);

  const handleSave = async () => {
    if (!request?.id) return;
    if (!selectedTechId) {
      toast.error("Please select a technician");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from("maintenance_requests")
        .update({ assigned_technician_id: selectedTechId })
        .eq("id", request.id);

      if (error) throw error;

      toast.success("Technician reassigned");
      onUpdated?.();
      onClose?.();
    } catch (e) {
      console.error(e);
      toast.error("Failed to reassign technician");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !request) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-white/10 backdrop-blur-xl shadow-glass">
        {/* soft gradient sheen */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/25 via-transparent to-transparent" />

        {/* Header */}
        <div className="relative p-5 border-b border-white/10">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs text-white/80">
                <span className="h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
                Assignment
              </div>
              <h3 className="mt-3 text-lg font-extrabold tracking-tight text-white">
                Reassign Technician
              </h3>
              <p className="mt-1 text-sm text-white/60">
                Update the assignee for this request (team filtered).
              </p>
            </div>

            <button
              onClick={onClose}
              className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-white/70 hover:text-white hover:bg-white/15 transition disabled:opacity-50"
              disabled={loading}
              aria-label="Close"
              title="Close"
              type="button"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="relative p-5 space-y-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
            <div className="text-xs text-white/50">Request</div>
            <div className="text-sm font-semibold text-white/90 mt-1">
              {request.subject}
            </div>
            <div className="text-xs text-white/50 mt-1">
              Team: <span className="text-white/70">{request.team?.name || "—"}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-white/70 mb-2">
              Technician
            </label>

            <select
              value={selectedTechId}
              onChange={(e) => setSelectedTechId(e.target.value)}
              disabled={loading}
              className="w-full rounded-2xl border border-white/10 bg-white/10 backdrop-blur px-4 py-3 text-white outline-none focus:ring-2 focus:ring-blue-500/40 disabled:opacity-60"
            >
              <option value="" className="text-slate-900">
                Select a technician
              </option>
              {techOptions.map((t) => (
                <option key={t.id} value={t.id} className="text-slate-900">
                  {t.full_name} ({t.email})
                </option>
              ))}
            </select>

            {!teamId && (
              <div className="mt-3 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-xs font-semibold text-red-100">
                This request has no team assigned. Auto-fill should set team_id.
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="relative p-5 border-t border-white/10 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white/80 hover:bg-white/10 transition disabled:opacity-60"
            disabled={loading}
            type="button"
          >
            Cancel
          </button>

          <button
            onClick={handleSave}
            className="rounded-2xl bg-white text-slate-900 px-4 py-2.5 text-sm font-extrabold shadow-soft hover:shadow-glass transition disabled:opacity-60"
            disabled={loading}
            type="button"
          >
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
