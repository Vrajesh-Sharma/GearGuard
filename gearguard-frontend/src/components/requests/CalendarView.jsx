import { useEffect, useMemo, useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import toast from "react-hot-toast";
import Button from "../common/Button";
import Modal from "../common/Modal";
import { listRequests } from "../../app/db";
import { isoDate } from "../../utils/dates";
import RequestForm from "./RequestForm";

export default function CalendarView() {
  const [value, setValue] = useState(new Date());
  const [preventive, setPreventive] = useState([]);
  const [openCreate, setOpenCreate] = useState(false);

  async function load() {
    try {
      const data = await listRequests({ type: "preventive" });
      setPreventive(data);
    } catch (e) {
      toast.error(e.message ?? "Failed loading preventive requests");
    }
  }

  useEffect(() => { load(); }, []);

  const selectedIso = isoDate(value);

  const dayItems = useMemo(
    () => preventive.filter(r => r.scheduled_date === selectedIso),
    [preventive, selectedIso]
  );

  function tileContent({ date }) {
    const d = isoDate(date);
    const count = preventive.filter(r => r.scheduled_date === d).length;
    if (!count) return null;
    return <div className="mt-1 text-[10px] bg-blue-600 text-white rounded px-1 inline-block">{count}</div>;
  }

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="bg-white border rounded-xl p-4">
        <div className="font-semibold mb-3">Preventive Calendar</div>
        <Calendar value={value} onChange={setValue} tileContent={tileContent} />
        <Button className="w-full mt-4" onClick={() => setOpenCreate(true)}>
          + Schedule on {selectedIso}
        </Button>
      </div>

      <div className="lg:col-span-2 bg-white border rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="font-semibold">Scheduled on {selectedIso}</div>
        </div>

        {dayItems.length === 0 ? (
          <div className="text-sm text-gray-600">No preventive maintenance scheduled for this date.</div>
        ) : (
          <div className="space-y-3">
            {dayItems.map(r => (
              <div key={r.id} className="border rounded-lg p-3">
                <div className="font-medium">{r.subject}</div>
                <div className="text-xs text-gray-600">Priority: {r.priority} • Status: {r.status}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create preventive request modal (use RequestForm; user selects equipment) */}
      {openCreate && (
        <RequestForm
          open={openCreate}
          onClose={() => setOpenCreate(false)}
          onCreated={() => load()}
        />
      )}
    </div>
  );
}
