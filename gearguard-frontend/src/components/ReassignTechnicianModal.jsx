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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-lg bg-white shadow-lg border border-gray-200">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-bold">Reassign Technician</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800"
            disabled={loading}
          >
            ✕
          </button>
        </div>

        <div className="p-4 space-y-3">
          <div className="text-sm text-gray-700">
            <div className="font-semibold">{request.subject}</div>
            <div className="text-gray-500">
              Team: {request.team?.name || "—"}
            </div>
          </div>

          <label className="block text-sm font-medium text-gray-700">
            Technician
          </label>
          <select
            value={selectedTechId}
            onChange={(e) => setSelectedTechId(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2"
            disabled={loading}
          >
            <option value="">Select a technician</option>
            {techOptions.map((t) => (
              <option key={t.id} value={t.id}>
                {t.full_name} ({t.email})
              </option>
            ))}
          </select>

          {!teamId && (
            <p className="text-xs text-red-600">
              This request has no team assigned. Auto-fill should set team_id.
            </p>
          )}
        </div>

        <div className="p-4 border-t border-gray-200 flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-50"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
            disabled={loading}
          >
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
