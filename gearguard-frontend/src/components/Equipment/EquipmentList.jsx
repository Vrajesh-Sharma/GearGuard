import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import Button from "../common/Button";
import Badge from "../common/Badge";
import { listEquipment, listRequests } from "../../app/db";

export default function EquipmentList({ onOpenMaintenance }) {
  const [q, setQ] = useState("");
  const [department, setDepartment] = useState("");
  const [equipment, setEquipment] = useState([]);
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const [eq, req] = await Promise.all([
          listEquipment({ q, department }),
          listRequests(),
        ]);
        setEquipment(eq);
        setRequests(req);
      } catch (e) {
        toast.error(e.message ?? "Failed loading equipment");
      }
    })();
  }, [q, department]);

  const openCountByEquip = useMemo(() => {
    const map = new Map();
    for (const r of requests) {
      if (r.status === "repaired" || r.status === "scrap") continue;
      map.set(r.equipment_id, (map.get(r.equipment_id) ?? 0) + 1);
    }
    return map;
  }, [requests]);

  return (
    <div>
      <div className="flex items-end justify-between gap-4 mb-4">
        <div>
          <h1 className="text-2xl font-bold">Equipment</h1>
          <p className="text-gray-600 text-sm">Track assets by department/employee and open maintenance.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-3 mb-6">
        <input
          className="border rounded-md px-3 py-2 bg-white"
          placeholder="Search equipment..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <input
          className="border rounded-md px-3 py-2 bg-white"
          placeholder="Filter by department (exact match)"
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
        />
        <div />
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {equipment.map((eq) => {
          const openCount = openCountByEquip.get(eq.id) ?? 0;
          return (
            <div key={eq.id} className="bg-white border rounded-xl p-4 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-semibold">{eq.name}</div>
                  <div className="text-xs text-gray-600">Serial: {eq.serial_number}</div>
                  <div className="text-xs text-gray-600">Dept: {eq.department || "-"}</div>
                  <div className="text-xs text-gray-600">Location: {eq.location || "-"}</div>
                </div>
                {eq.status === "scrapped" ? <Badge color="red">Scrapped</Badge> : <Badge color="green">Active</Badge>}
              </div>

              <div className="mt-4 flex items-center justify-between">
                <Button
                  onClick={() => onOpenMaintenance(eq.id)}
                  className="w-full"
                >
                  Maintenance <span className="ml-2 bg-white/20 px-2 py-0.5 rounded-full text-xs">{openCount}</span>
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
