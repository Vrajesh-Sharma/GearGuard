import { useEffect, useMemo, useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import toast from "react-hot-toast";
import { supabase } from "../lib/supabaseClient";
import RequestForm from "./RequestForm";

// helper: convert Date -> YYYY-MM-DD
function isoDate(d) {
  return new Date(d).toISOString().split("T")[0];
}

export default function CalendarView() {
  const [value, setValue] = useState(new Date());
  const [preventive, setPreventive] = useState([]);

  const [openCreate, setOpenCreate] = useState(false);
  const [prefill, setPrefill] = useState({
    request_type: "preventive",
    scheduled_date: isoDate(new Date()),
  });

  const selectedIso = isoDate(value);

  async function load() {
    try {
      const { data, error } = await supabase
        .from("maintenance_requests")
        .select(
          `id, subject, priority, status, scheduled_date, request_type,
           equipment:equipment_id(id,name)`
        )
        .eq("request_type", "preventive")
        .not("scheduled_date", "is", null)
        .order("scheduled_date", { ascending: true });

      if (error) throw error;
      setPreventive(data || []);
    } catch (e) {
      console.error(e);
      toast.error(e.message ?? "Failed loading preventive requests");
    }
  }

  useEffect(() => {
    load();
  }, []);

  const dayItems = useMemo(
    () => preventive.filter((r) => r.scheduled_date === selectedIso),
    [preventive, selectedIso]
  );

  function tileContent({ date }) {
    const d = isoDate(date);
    const count = preventive.filter((r) => r.scheduled_date === d).length;
    if (!count) return null;

    return (
      <div className="mt-1 text-[10px] bg-blue-600 text-white rounded px-1 inline-block">
        {count}
      </div>
    );
  }

  // ✅ Requirement: click a date to schedule a request on that date
  const handleDayClick = (date) => {
    setValue(date);

    const clickedIso = isoDate(date);
    setPrefill({
      request_type: "preventive",
      scheduled_date: clickedIso,
    });
    setOpenCreate(true);
  };

  return (
    <div className="grid lg:grid-cols-3 gap-6 p-6">
      <div className="bg-white border rounded-xl p-4">
        <div className="font-semibold mb-3">Preventive Calendar</div>

        <Calendar
          value={value}
          onChange={setValue}
          onClickDay={handleDayClick}   // ✅ click date opens scheduling
          tileContent={tileContent}
        />

        {/* Optional: keep button too (useful on mobile) */}
        <button
          className="w-full mt-4 bg-blue-600 text-white rounded px-4 py-2 hover:bg-blue-700"
          onClick={() => {
            setPrefill({
              request_type: "preventive",
              scheduled_date: selectedIso,
            });
            setOpenCreate(true);
          }}
        >
          + Schedule on {selectedIso}
        </button>

        <p className="text-xs text-gray-500 mt-2">
          Tip: Click any date on the calendar to schedule preventive maintenance.
        </p>
      </div>

      <div className="lg:col-span-2 bg-white border rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="font-semibold">Scheduled on {selectedIso}</div>
        </div>

        {dayItems.length === 0 ? (
          <div className="text-sm text-gray-600">
            No preventive maintenance scheduled for this date.
          </div>
        ) : (
          <div className="space-y-3">
            {dayItems.map((r) => (
              <div key={r.id} className="border rounded-lg p-3">
                <div className="font-medium">{r.subject}</div>
                <div className="text-xs text-gray-600">
                  Equipment: {r.equipment?.name || "—"} • Priority: {r.priority} • Status:{" "}
                  {r.status}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create preventive request modal */}
      {openCreate && (
        <RequestForm
          onClose={() => setOpenCreate(false)}
          onSuccess={() => load()}
          prefill={prefill}   // ✅ pass scheduled date + type into form
        />
      )}
    </div>
  );
}
