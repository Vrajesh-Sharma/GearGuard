import { useState, useEffect } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { supabase } from "../lib/supabaseClient";
import { toast } from "react-hot-toast";

export default function CalendarView() {
  const [preventive, setPreventive] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPreventive();
  }, []);

  const fetchPreventive = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from("maintenance_requests")
        .select(
          `*,
          equipment:equipment_id(id,name),
          technician:assigned_technician_id(id,full_name),
          team:team_id(id,name)`
        )
        .eq("request_type", "preventive")
        .order("scheduled_date");

      setPreventive(data || []);
    } catch (error) {
      console.error("Fetch error:", error);
      toast.error("Failed to load preventive maintenance");
    } finally {
      setLoading(false);
    }
  };

  const dateStr = selectedDate.toISOString().split("T")[0];
  const dayRequests = preventive.filter((r) => r.scheduled_date === dateStr);

  // Highlight dates with requests
  const tileContent = ({ date }) => {
    const d = date.toISOString().split("T")[0];
    const count = preventive.filter((r) => r.scheduled_date === d).length;
    return count > 0 ? (
      <div className="text-xs font-bold text-blue-600 bg-blue-100 rounded-full w-5 h-5 flex items-center justify-center">
        {count}
      </div>
    ) : null;
  };

  if (loading) {
    return <div className="p-6 text-center">Loading calendar...</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Preventive Maintenance Calendar</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg p-4 shadow-md border border-gray-200">
            <Calendar
              onChange={setSelectedDate}
              value={selectedDate}
              tileContent={tileContent}
              className="react-calendar"
            />
          </div>
        </div>

        {/* Requests for selected date */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg p-6 shadow-md border border-gray-200">
            <h2 className="text-xl font-bold mb-4">
              Scheduled for {new Date(dateStr).toLocaleDateString()}
            </h2>

            {dayRequests.length > 0 ? (
              <div className="space-y-3">
                {dayRequests.map((r) => (
                  <div
                    key={r.id}
                    className="border-l-4 border-l-blue-500 bg-blue-50 p-4 rounded"
                  >
                    <h3 className="font-semibold text-gray-900">{r.subject}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      📦 Equipment: {r.equipment?.name || "Unknown"}
                    </p>
                    <p className="text-sm text-gray-600">
                      👥 Team: {r.team?.name || "Unknown"}
                    </p>
                    {r.technician && (
                      <p className="text-sm text-gray-600">
                        👤 Technician: {r.technician.full_name}
                      </p>
                    )}
                    <div className="flex gap-2 mt-3">
                      <span
                        className={`text-xs px-2 py-1 rounded font-semibold ${
                          r.priority === "high"
                            ? "bg-red-100 text-red-700"
                            : r.priority === "medium"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {r.priority.toUpperCase()}
                      </span>
                      <span
                        className={`text-xs px-2 py-1 rounded font-semibold ${
                          r.status === "new"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {r.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 text-lg">
                  No preventive maintenance scheduled for this date
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* All upcoming preventive maintenance */}
      <div className="mt-8 bg-white rounded-lg p-6 shadow-md border border-gray-200">
        <h2 className="text-xl font-bold mb-4">Upcoming Preventive Maintenance</h2>
        <div className="space-y-2">
          {preventive
            .filter((r) => r.scheduled_date >= dateStr)
            .slice(0, 10)
            .map((r) => (
              <div key={r.id} className="border border-gray-200 p-3 rounded flex justify-between items-center">
                <div>
                  <p className="font-semibold">{r.subject}</p>
                  <p className="text-sm text-gray-600">{r.equipment?.name}</p>
                </div>
                <p className="text-sm font-medium text-gray-700">
                  {new Date(r.scheduled_date).toLocaleDateString()}
                </p>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}