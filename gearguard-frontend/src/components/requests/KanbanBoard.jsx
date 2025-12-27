import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import Button from "../common/Button";
import { REQUEST_STATUSES } from "../../utils/constants";
import { listRequests, updateRequest } from "../../app/db";
import RequestCard from "./RequestCard";
import RequestForm from "./RequestForm";
import { supabase } from "../../app/supabaseClient";

export default function KanbanBoard({ equipmentIdFilter }) {
  const [openCreate, setOpenCreate] = useState(false);
  const [requests, setRequests] = useState([]);
  const [userMap, setUserMap] = useState(new Map());

  async function load() {
    try {
      const data = await listRequests({ equipmentId: equipmentIdFilter || "" });
      setRequests(data);

      // fetch technicians (simple: pull all users referenced)
      const techIds = [...new Set(data.map(r => r.assigned_technician_id).filter(Boolean))];
      if (techIds.length) {
        const { data: users, error } = await supabase.from("users").select("id,full_name,avatar_url").in("id", techIds);
        if (error) throw error;
        setUserMap(new Map(users.map(u => [u.id, u])));
      } else {
        setUserMap(new Map());
      }
    } catch (e) {
      toast.error(e.message ?? "Failed loading requests");
    }
  }

  useEffect(() => { load(); }, [equipmentIdFilter]);

  const grouped = useMemo(() => {
    const g = Object.fromEntries(REQUEST_STATUSES.map(s => [s.key, []]));
    for (const r of requests) g[r.status]?.push(r);
    return g;
  }, [requests]);

  async function onDragEnd(result) {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const newStatus = destination.droppableId;
    const req = requests.find(r => r.id === draggableId);
    if (!req) return;

    // optimistic update
    setRequests(prev => prev.map(r => (r.id === draggableId ? { ...r, status: newStatus } : r)));

    try {
      await updateRequest(draggableId, { status: newStatus });
      // Scrap logic: mark equipment unusable can be implemented later (optional). [file:2]
    } catch (e) {
      toast.error("Failed to update status; reverting");
      setRequests(prev => prev.map(r => (r.id === draggableId ? { ...r, status: req.status } : r)));
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold">Maintenance Kanban</h1>
          <p className="text-sm text-gray-600">Drag cards across stages: New → In Progress → Repaired/Scrap.</p>
        </div>
        <Button onClick={() => setOpenCreate(true)}>+ New Request</Button>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {REQUEST_STATUSES.map((col) => (
            <div key={col.key} className="w-[320px] shrink-0">
              <div className="bg-gray-100 rounded-xl p-3 border">
                <div className="flex items-center justify-between mb-3">
                  <div className="font-semibold">{col.label}</div>
                  <div className="text-xs text-gray-600">{grouped[col.key]?.length ?? 0}</div>
                </div>

                <Droppable droppableId={col.key}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`min-h-[500px] rounded-lg p-2 ${
                        snapshot.isDraggingOver ? "bg-blue-50" : "bg-white"
                      }`}
                    >
                      {(grouped[col.key] ?? []).map((r, idx) => (
                        <Draggable key={r.id} draggableId={r.id} index={idx}>
                          {(p) => (
                            <div ref={p.innerRef} {...p.draggableProps} {...p.dragHandleProps} className="mb-3">
                              <RequestCard request={r} technician={userMap.get(r.assigned_technician_id)} />
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            </div>
          ))}
        </div>
      </DragDropContext>

      <RequestForm
        open={openCreate}
        onClose={() => setOpenCreate(false)}
        onCreated={() => load()}
        presetEquipmentId={equipmentIdFilter}
      />
    </div>
  );
}
