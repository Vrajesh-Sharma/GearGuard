import { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { supabase } from "../lib/supabaseClient";
import { toast } from "react-hot-toast";

import ReassignTechnicianModal from "./ReassignTechnicianModal";
import RequestCard from "./RequestCard";

const COLUMNS = {
  new: { title: "New", color: "blue" },
  in_progress: { title: "In Progress", color: "yellow" },
  repaired: { title: "Repaired", color: "green" },
  scrap: { title: "Scrap", color: "red" },
};

const dotClass = {
  blue: "bg-blue-500",
  yellow: "bg-yellow-500",
  green: "bg-emerald-500",
  red: "bg-red-500",
};

export default function KanbanBoard({ refreshTrigger }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Hours modal for moving to repaired
  const [hoursModal, setHoursModal] = useState(false);
  const [hoursSpent, setHoursSpent] = useState("");
  const [currentRequestId, setCurrentRequestId] = useState(null);

  // Optional equipment filter (used by Smart Button from Equipment page)
  const [equipmentFilter, setEquipmentFilter] = useState(null);

  // Reassign modal state
  const [reassignOpen, setReassignOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);

  useEffect(() => {
    fetchRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTrigger, equipmentFilter]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("maintenance_requests")
        .select(
          `*,
          equipment:equipment_id(id,name,serial_number),
          technician:assigned_technician_id(id,full_name,avatar_url),
          team:team_id(id,name)`
        )
        .order("created_at", { ascending: false });

      if (equipmentFilter) {
        query = query.eq("equipment_id", equipmentFilter);
      }

      const { data, error } = await query;
      if (error) throw error;

      setRequests(data || []);
    } catch (error) {
      console.error("Fetch error:", error);
      toast.error("Failed to load requests");
    } finally {
      setLoading(false);
    }
  };

  // Drag-drop handler
  const onDragEnd = async (result) => {
    const { draggableId, destination } = result;
    if (!destination) return;

    const newStatus = destination.droppableId;
    const request = requests.find((r) => r.id === draggableId);
    if (!request) return;

    // If moving to "repaired", ask for hours spent if not already filled
    if (newStatus === "repaired" && !request.hours_spent) {
      setCurrentRequestId(draggableId);
      setHoursSpent("");
      setHoursModal(true);
      return;
    }

    await updateRequestStatus(draggableId, newStatus);
  };

  const updateRequestStatus = async (requestId, newStatus) => {
    try {
      const updateData = { status: newStatus };

      // Scrap logic: mark equipment as scrapped if request moved to scrap
      if (newStatus === "scrap") {
        const req = requests.find((r) => r.id === requestId);
        if (req?.equipment_id) {
          await supabase
            .from("equipment")
            .update({ status: "scrapped" })
            .eq("id", req.equipment_id);
        }
      }

      const { error } = await supabase
        .from("maintenance_requests")
        .update(updateData)
        .eq("id", requestId);

      if (error) throw error;

      setRequests((prev) =>
        prev.map((r) => (r.id === requestId ? { ...r, status: newStatus } : r))
      );

      toast.success(`Request moved to ${COLUMNS[newStatus].title}`);
    } catch (error) {
      console.error("Update error:", error);
      toast.error("Failed to update request");
    }
  };

  const confirmRepaired = async () => {
    if (!hoursSpent || isNaN(parseFloat(hoursSpent))) {
      toast.error("Please enter valid hours");
      return;
    }

    try {
      const parsed = parseFloat(hoursSpent);

      const { error } = await supabase
        .from("maintenance_requests")
        .update({
          status: "repaired",
          hours_spent: parsed,
        })
        .eq("id", currentRequestId);

      if (error) throw error;

      setRequests((prev) =>
        prev.map((r) =>
          r.id === currentRequestId
            ? { ...r, status: "repaired", hours_spent: parsed }
            : r
        )
      );

      toast.success("Request marked as repaired");
      setHoursModal(false);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to update request");
    }
  };

  // Reassign handlers
  const openReassign = (req) => {
    setSelectedRequest(req);
    setReassignOpen(true);
  };

  const closeReassign = () => {
    setReassignOpen(false);
    setSelectedRequest(null);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="rounded-3xl border border-white/10 bg-white/10 backdrop-blur-xl p-8 shadow-glass">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-72 bg-white/15 rounded" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-[520px] rounded-3xl bg-white/10 border border-white/10" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Group requests by status
  const grouped = Object.keys(COLUMNS).reduce((acc, status) => {
    acc[status] = requests.filter((r) => r.status === status);
    return acc;
  }, {});

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs text-white/80 backdrop-blur">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            Technician Workspace
          </div>
          <h1 className="mt-3 text-3xl md:text-4xl font-extrabold tracking-tight text-white">
            Maintenance <span className="text-white/70">Kanban</span>
          </h1>
          <p className="mt-1 text-sm text-white/70">
            Drag requests across stages, reassign technicians, and log hours on completion.
          </p>
        </div>

        {equipmentFilter && (
          <button
            onClick={() => setEquipmentFilter(null)}
            className="rounded-xl bg-white text-slate-900 px-4 py-2 text-sm font-semibold shadow-soft hover:shadow-glass transition"
          >
            Clear Filter
          </button>
        )}
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Object.entries(COLUMNS).map(([statusKey, column]) => (
            <Droppable key={statusKey} droppableId={statusKey}>
              {(provided, snapshot) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className={`relative overflow-hidden rounded-3xl border backdrop-blur-xl shadow-glass transition ${
                    snapshot.isDraggingOver
                      ? "border-blue-500/40 bg-blue-500/10"
                      : "border-white/10 bg-white/10"
                  }`}
                >
                  {/* Column header */}
                  <div className="sticky top-0 z-10 px-4 py-4 border-b border-white/10 bg-white/10 backdrop-blur-xl">
                    <div className="flex items-center gap-3">
                      <span className={`h-3 w-3 rounded-full ${dotClass[column.color]}`} />
                      <div className="text-white font-bold">{column.title}</div>
                      <div className="ml-auto rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-bold text-white/80">
                        {grouped[statusKey].length}
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-white/50">
                      {statusKey === "new" && "Newly created requests waiting to be taken."}
                      {statusKey === "in_progress" && "Work currently being handled."}
                      {statusKey === "repaired" && "Completed jobs with logged hours."}
                      {statusKey === "scrap" && "Marked unusable; equipment gets scrapped."}
                    </div>
                  </div>

                  {/* Cards */}
                  <div className="p-4 space-y-3 min-h-[520px]">
                    {grouped[statusKey].map((request, index) => (
                      <Draggable key={request.id} draggableId={request.id} index={index}>
                        {(provided, snap) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`transition ${
                              snap.isDragging ? "rotate-[0.4deg] scale-[1.02]" : ""
                            }`}
                          >
                            <RequestCard request={request} onReassign={openReassign} />
                          </div>
                        )}
                      </Draggable>
                    ))}

                    {provided.placeholder}

                    {grouped[statusKey].length === 0 && (
                      <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-6 text-center text-sm text-white/60">
                        Drop cards here
                      </div>
                    )}
                  </div>
                </div>
              )}
            </Droppable>
          ))}
        </div>
      </DragDropContext>

      {/* Reassign Technician Modal */}
      <ReassignTechnicianModal
        isOpen={reassignOpen}
        onClose={closeReassign}
        request={selectedRequest}
        onUpdated={fetchRequests}
      />

      {/* Hours Modal */}
      {hoursModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4">
          <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-white/10 backdrop-blur-xl shadow-glass overflow-hidden">
            <div className="p-5 border-b border-white/10">
              <div className="text-white font-extrabold text-lg">Log Repair Hours</div>
              <div className="text-white/60 text-sm mt-1">
                Enter time spent to move request to <span className="text-white/80 font-semibold">Repaired</span>.
              </div>
            </div>

            <div className="p-5">
              <label className="text-xs text-white/70 font-semibold">Hours Spent</label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={hoursSpent}
                onChange={(e) => setHoursSpent(e.target.value)}
                placeholder="e.g., 1.5"
                className="mt-2 w-full rounded-2xl border border-white/10 bg-white/10 backdrop-blur px-4 py-3 text-white placeholder:text-white/40 outline-none focus:ring-2 focus:ring-emerald-500/40"
              />

              <div className="mt-4 flex gap-3">
                <button
                  onClick={() => setHoursModal(false)}
                  className="flex-1 rounded-2xl border border-white/10 bg-white/5 text-white/80 px-4 py-3 font-semibold hover:bg-white/10 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmRepaired}
                  className="flex-1 rounded-2xl bg-emerald-500 text-slate-950 px-4 py-3 font-extrabold hover:bg-emerald-400 transition"
                >
                  Confirm
                </button>
              </div>

              <div className="mt-3 text-[11px] text-white/45">
                Tip: This is required by workflow to complete a repair.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
