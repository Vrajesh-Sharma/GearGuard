import React, { useMemo } from "react";

const priorityStyles = {
  low: "text-green-700 bg-green-50 border-green-200",
  medium: "text-yellow-700 bg-yellow-50 border-yellow-200",
  high: "text-red-700 bg-red-50 border-red-200",
};

export default function RequestCard({ request, onReassign }) {
  const subject = request?.subject || "Untitled";
  const equipmentName = request?.equipment?.name || "—";
  const teamName = request?.team?.name || "—";

  const techName = request?.technician?.full_name || "Unassigned";
  const techInitial = (techName || "U").trim().charAt(0).toUpperCase();

  const priority = (request?.priority || "medium").toLowerCase();
  const priorityClass = priorityStyles[priority] || priorityStyles.medium;

  const hours = request?.hours_spent;

  const isOverdue = useMemo(() => {
    // Overdue logic: has scheduled_date AND date < today AND not completed
    if (!request?.scheduled_date) return false;
    if (!["new", "in_progress"].includes(request?.status)) return false;

    const today = new Date().toISOString().split("T")[0];
    return request.scheduled_date < today;
  }, [request]);

  return (
    <div className="relative bg-white rounded-lg border border-gray-200 shadow-sm p-4 hover:shadow-md transition">
      {/* Overdue indicator */}
      {isOverdue && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500 rounded-l-lg" />
      )}

      <div className="flex items-start justify-between gap-3">
        <h3 className="font-bold text-gray-900 leading-snug">{subject}</h3>

        {hours !== null && hours !== undefined && hours !== "" && (
          <div className="text-xs text-gray-600 flex items-center gap-1 whitespace-nowrap">
            <span>⏱</span>
            <span>{hours}h</span>
          </div>
        )}
      </div>

      <div className="mt-2 text-sm text-gray-700 space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-gray-500">📦</span>
          <span className="font-medium">{equipmentName}</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-gray-500">👥</span>
          <span className="font-medium">{teamName}</span>
        </div>

        {isOverdue && (
          <div className="text-xs text-red-600 font-semibold">
            ⚠️ Overdue
          </div>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">
            {techInitial}
          </div>
          <div className="text-sm">
            <div className="font-medium text-gray-900">{techName}</div>
          </div>
        </div>

        <span className={`text-xs px-2 py-1 rounded border ${priorityClass}`}>
          {priority.toUpperCase()}
        </span>
      </div>

      <div className="mt-3 flex justify-end">
        <button
          onClick={() => onReassign?.(request)}
          className="text-xs px-3 py-1 rounded border border-blue-600 text-blue-700 hover:bg-blue-50 transition"
          type="button"
        >
          Reassign
        </button>
      </div>
    </div>
  );
}
