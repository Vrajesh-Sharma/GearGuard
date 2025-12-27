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
    return <div className="p-6 text-center">Loading Kanban...</div>;
  }

  // Group requests by status
  const grouped = Object.keys(COLUMNS).reduce((acc, status) => {
    acc[status] = requests.filter((r) => r.status === status);
    return acc;
  }, {});

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-3xl font-bold">Maintenance Kanban</h1>
        {equipmentFilter && (
          <button
            onClick={() => setEquipmentFilter(null)}
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
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
                  className={`bg-gray-50 rounded-lg p-4 min-h-96 border-2 border-transparent ${
                    snapshot.isDraggingOver ? "border-blue-400 bg-blue-50" : ""
                  }`}
                >
                  <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                    <span
                      className={`w-3 h-3 rounded-full bg-${column.color}-500`}
                    />
                    {column.title}
                    <span className="ml-auto bg-gray-200 px-2 py-1 rounded text-sm">
                      {grouped[statusKey].length}
                    </span>
                  </h2>

                  <div className="space-y-3">
                    {grouped[statusKey].map((request, index) => (
                      <Draggable
                        key={request.id}
                        draggableId={request.id}
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`${snapshot.isDragging ? "opacity-50" : ""}`}
                          >
                            <RequestCard request={request} onReassign={openReassign} />
                          </div>
                        )}
                      </Draggable>
                    ))}
                  </div>

                  {provided.placeholder}
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm">
            <h3 className="text-lg font-bold mb-4">Hours Spent on Repair</h3>
            <input
              type="number"
              step="0.5"
              min="0"
              value={hoursSpent}
              onChange={(e) => setHoursSpent(e.target.value)}
              placeholder="Enter hours..."
              className="w-full border border-gray-300 rounded px-3 py-2 mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setHoursModal(false)}
                className="flex-1 border border-gray-300 rounded px-4 py-2 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmRepaired}
                className="flex-1 bg-green-600 text-white rounded px-4 py-2 hover:bg-green-700"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
