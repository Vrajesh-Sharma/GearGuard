import { useState, useEffect } from "react";
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

  // ✅ Apply prefill from Calendar (or other callers)
  // Example: { request_type: "preventive", scheduled_date: "2025-12-31" }
  useEffect(() => {
    if (!prefill) return;

    setFormData((p) => ({
      ...p,
      ...(prefill.request_type ? { request_type: prefill.request_type } : {}),
      ...(prefill.scheduled_date ? { scheduled_date: prefill.scheduled_date } : {}),
    }));
  }, [prefill]);

  // Load equipment on mount
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("equipment")
        .select("id,name,serial_number,category,team_id,default_technician_id");

      if (error) {
        console.error(error);
        toast.error("Failed to load equipment");
        return;
      }

      setEquipment(data || []);
    })();
  }, []);

  // AUTO-FILL LOGIC: When equipment changes
  const handleEquipmentChange = async (e) => {
    const equipmentId = e.target.value;
    setFormData((p) => ({ ...p, equipment_id: equipmentId }));

    if (!equipmentId) return;

    try {
      // Fetch equipment details
      const { data: eq, error } = await supabase
        .from("equipment")
        .select("team_id,category,default_technician_id")
        .eq("id", equipmentId)
        .single();

      if (error) throw error;

      if (eq) {
        // Auto-fill team and technician
        setFormData((p) => ({
          ...p,
          team_id: eq.team_id,
          category: eq.category,
          assigned_technician_id: eq.default_technician_id,
        }));

        // Fetch team members to filter technician dropdown
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
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate required fields
      if (!formData.subject || !formData.equipment_id) {
        toast.error("Subject and Equipment are required");
        setLoading(false);
        return;
      }

      // If Preventive, scheduled date should be present (recommended for requirement)
      if (formData.request_type === "preventive" && !formData.scheduled_date) {
        toast.error("Scheduled Date is required for Preventive requests");
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-96 overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold">Create Maintenance Request</h2>
          <button
            onClick={onClose}
            className="text-2xl text-gray-500 hover:text-gray-700"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Subject */}
          <div>
            <label className="block text-sm font-medium mb-1">Subject *</label>
            <input
              type="text"
              required
              placeholder="e.g., Leaking Oil"
              value={formData.subject}
              onChange={(e) =>
                setFormData((p) => ({ ...p, subject: e.target.value }))
              }
              className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Equipment (AUTO-FILL) */}
          <div>
            <label className="block text-sm font-medium mb-1">Equipment *</label>
            <select
              required
              value={formData.equipment_id}
              onChange={handleEquipmentChange}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Equipment...</option>
              {equipment.map((eq) => (
                <option key={eq.id} value={eq.id}>
                  {eq.name} ({eq.serial_number})
                </option>
              ))}
            </select>
          </div>

          {/* Team (Auto-filled) */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Team (Auto-filled)
            </label>
            <input
              type="text"
              disabled
              value={
                equipment.find((e) => e.id === formData.equipment_id)?.team_id
                  ? "Assigned Automatically"
                  : "Select equipment above"
              }
              className="w-full border border-gray-200 bg-gray-50 rounded px-3 py-2 text-gray-600"
            />
          </div>

          {/* Technician (Filtered by team) */}
          <div>
            <label className="block text-sm font-medium mb-1">Technician</label>
            <select
              value={formData.assigned_technician_id || ""}
              onChange={(e) =>
                setFormData((p) => ({
                  ...p,
                  assigned_technician_id: e.target.value || null,
                }))
              }
              className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Unassigned</option>
              {technicians.map((tech) => (
                <option key={tech.id} value={tech.id}>
                  {tech.full_name}
                </option>
              ))}
            </select>
          </div>

          {/* Request Type + Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Type</label>
              <select
                value={formData.request_type}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, request_type: e.target.value }))
                }
                className="w-full border border-gray-300 rounded px-3 py-2"
              >
                <option value="corrective">Corrective (Breakdown)</option>
                <option value="preventive">Preventive (Checkup)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, priority: e.target.value }))
                }
                className="w-full border border-gray-300 rounded px-3 py-2"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          {/* Scheduled Date (for preventive) */}
          {formData.request_type === "preventive" && (
            <div>
              <label className="block text-sm font-medium mb-1">
                Scheduled Date
              </label>
              <input
                type="date"
                value={formData.scheduled_date}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    scheduled_date: e.target.value,
                  }))
                }
                className="w-full border border-gray-300 rounded px-3 py-2"
              />
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData((p) => ({ ...p, description: e.target.value }))
              }
              placeholder="Additional details..."
              rows="3"
              className="w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 justify-end pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create Request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
