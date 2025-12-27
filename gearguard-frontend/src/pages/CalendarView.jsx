import { useEffect, useMemo, useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import toast from "react-hot-toast";
import { supabase } from "../lib/supabaseClient";
import RequestForm from "./RequestForm";

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
      <div className="mt-1 text-[10px] rounded-full px-2 py-0.5 inline-flex items-center justify-center border border-white/10 bg-blue-500/30 text-white">
        {count}
      </div>
    );
  }

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
    <div className="p-6">
      <div className="mb-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs text-white/80 backdrop-blur">
          <span className="h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
          Preventive Scheduling
        </div>
        <h1 className="mt-3 text-3xl md:text-4xl font-extrabold tracking-tight text-white">
          Calendar <span className="text-white/70">View</span>
        </h1>
        <p className="mt-1 text-sm text-white/70">
          Click any date to schedule preventive maintenance.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Calendar panel */}
        <div className="rounded-3xl border border-white/10 bg-white/10 backdrop-blur-xl shadow-glass overflow-hidden">
          <div className="p-5 border-b border-white/10">
            <div className="text-white font-extrabold">Preventive Calendar</div>
            <div className="text-white/60 text-sm mt-1">
              Selected: <span className="text-white/80 font-semibold">{selectedIso}</span>
            </div>
          </div>

          <div className="p-5">
            <div className="calendar-dark">
              <Calendar
                value={value}
                onChange={setValue}
                onClickDay={handleDayClick}
                tileContent={tileContent}
              />
            </div>

            <button
              className="w-full mt-4 rounded-2xl bg-white text-slate-900 px-4 py-3 font-extrabold shadow-soft hover:shadow-glass transition"
              onClick={() => {
                setPrefill({
                  request_type: "preventive",
                  scheduled_date: selectedIso,
                });
                setOpenCreate(true);
              }}
              type="button"
            >
              + Schedule on {selectedIso}
            </button>

            <p className="text-xs text-white/60 mt-2">
              Tip: Click any date on the calendar to schedule preventive maintenance.
            </p>
          </div>
        </div>

        {/* Day list panel */}
        <div className="lg:col-span-2 rounded-3xl border border-white/10 bg-white/10 backdrop-blur-xl shadow-glass overflow-hidden">
          <div className="p-5 border-b border-white/10 flex items-center justify-between">
            <div>
              <div className="text-white font-extrabold">Scheduled on {selectedIso}</div>
              <div className="text-white/60 text-sm mt-1">
                {dayItems.length} request(s)
              </div>
            </div>
          </div>

          <div className="p-5">
            {dayItems.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-6 text-sm text-white/70">
                No preventive maintenance scheduled for this date.
              </div>
            ) : (
              <div className="space-y-3">
                {dayItems.map((r) => (
                  <div
                    key={r.id}
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 hover:bg-white/10 transition"
                  >
                    <div className="text-white font-semibold">{r.subject}</div>
                    <div className="text-xs text-white/60 mt-1">
                      Equipment: {r.equipment?.name || "—"} • Priority: {r.priority} • Status:{" "}
                      {r.status}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Create preventive request modal */}
        {openCreate && (
          <RequestForm
            onClose={() => setOpenCreate(false)}
            onSuccess={() => load()}
            prefill={prefill}
          />
        )}
      </div>
    </div>
  );
}
