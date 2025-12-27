import React from "react";

const priorityStyles = {
  low: "text-green-700 bg-green-50 border-green-200",
  medium: "text-yellow-700 bg-yellow-50 border-yellow-200",
  high: "text-red-700 bg-red-50 border-red-200",
};

export default function RequestCard({ request, onReassign }) {
  const subject = request?.subject || "Untitled";
  const equipmentName = request?.equipment?.name || "—";
  const serial = request?.equipment?.serial_number || "";
  const teamName = request?.team?.name || "—";

  // In your fetchRequests(), technician is aliased as:
  // technician:assigned_technician_id(id,full_name,avatar_url)
  const techName = request?.technician?.full_name || "Unassigned";
  const techInitial =
    (request?.technician?.full_name || "U").trim().charAt(0).toUpperCase();

  const priority = (request?.priority || "medium").toLowerCase();
  const priorityClass =
    priorityStyles[priority] || priorityStyles.medium;

  const hours = request?.hours_spent;

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 hover:shadow-md transition">
      {/* Title */}
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-bold text-gray-900 leading-snug">{subject}</h3>

        {/* Hours badge (only if exists) */}
        {hours !== null && hours !== undefined && hours !== "" && (
          <div className="text-xs text-gray-600 flex items-center gap-1 whitespace-nowrap">
            <span>⏱</span>
            <span>{hours}h</span>
          </div>
        )}
      </div>

      {/* Equipment */}
      <div className="mt-2 text-sm text-gray-700">
        <div className="flex items-center gap-2">
          <span className="text-gray-500">📦</span>
          <span className="font-medium">{equipmentName}</span>
          {serial ? <span className="text-gray-400">({serial})</span> : null}
        </div>

        {/* Team */}
        <div className="flex items-center gap-2 mt-1">
          <span className="text-gray-500">👥</span>
          <span className="font-medium">{teamName}</span>
        </div>
      </div>

      {/* Technician */}
      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">
            {techInitial}
          </div>
          <div className="text-sm">
            <div className="font-medium text-gray-900">{techName}</div>
            {!request?.technician?.id ? (
              <div className="text-xs text-gray-500 italic">Unassigned</div>
            ) : (
              <div className="text-xs text-gray-500">Assigned</div>
            )}
          </div>
        </div>

        {/* Priority Badge */}
        <span
          className={`text-xs px-2 py-1 rounded border ${priorityClass}`}
          title="Priority"
        >
          {priority.toUpperCase()}
        </span>
      </div>

      {/* Actions */}
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
