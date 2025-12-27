import React, { useMemo } from "react";

const priorityUI = {
  low: {
    chip: "border-emerald-500/20 bg-emerald-500/10 text-emerald-100",
    dot: "bg-emerald-400",
  },
  medium: {
    chip: "border-yellow-500/25 bg-yellow-500/10 text-yellow-100",
    dot: "bg-yellow-400",
  },
  high: {
    chip: "border-red-500/25 bg-red-500/10 text-red-100",
    dot: "bg-red-400",
  },
};

export default function RequestCard({ request, onReassign }) {
  const subject = request?.subject || "Untitled";
  const equipmentName = request?.equipment?.name || "—";
  const teamName = request?.team?.name || "—";

  const techName = request?.technician?.full_name || "Unassigned";
  const techInitial = (techName || "U").trim().charAt(0).toUpperCase();

  const priority = (request?.priority || "medium").toLowerCase();
  const pr = priorityUI[priority] || priorityUI.medium;

  const hours = request?.hours_spent;

  const isOverdue = useMemo(() => {
    if (!request?.scheduled_date) return false;
    if (!["new", "in_progress"].includes(request?.status)) return false;

    const today = new Date().toISOString().split("T")[0];
    return request.scheduled_date < today;
  }, [request]);

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border shadow-glass transition ${
        isOverdue
          ? "border-red-500/30 bg-red-500/10"
          : "border-white/10 bg-white/10 hover:bg-white/15"
      } backdrop-blur-xl`}
    >
      {/* Overdue left strip */}
      {isOverdue && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-400/90" />
      )}

      {/* sheen */}
      <div
        className={`pointer-events-none absolute inset-0 ${
          isOverdue
            ? "bg-gradient-to-br from-red-500/10 via-transparent to-transparent"
            : "bg-gradient-to-br from-white/20 via-transparent to-transparent"
        }`}
      />

      <div className="relative p-4">
        {/* Top row */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-extrabold tracking-tight text-white truncate">
                {subject}
              </h3>
              {isOverdue && (
                <span className="shrink-0 rounded-full border border-red-500/25 bg-red-500/10 px-2 py-0.5 text-[10px] font-extrabold text-red-100">
                  OVERDUE
                </span>
              )}
            </div>

            <div className="mt-2 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-white/80">
                <span className="text-white/60">📦</span>
                <span className="truncate max-w-[180px]">{equipmentName}</span>
              </span>

              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-white/80">
                <span className="text-white/60">👥</span>
                <span className="truncate max-w-[160px]">{teamName}</span>
              </span>
            </div>
          </div>

          {/* right side badges */}
          <div className="flex flex-col items-end gap-2 shrink-0">
            <span
              className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[11px] font-extrabold ${pr.chip}`}
              title="Priority"
            >
              <span className={`h-2 w-2 rounded-full ${pr.dot}`} />
              {priority.toUpperCase()}
            </span>

            {hours !== null && hours !== undefined && hours !== "" && (
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-white/80">
                ⏱ {hours}h
              </span>
            )}
          </div>
        </div>

        {/* Bottom row */}
        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative">
              <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-blue-500/40 to-emerald-500/20 blur-sm opacity-70" />
              <div className="relative h-9 w-9 rounded-full border border-white/10 bg-white/10 text-white flex items-center justify-center font-extrabold">
                {techInitial}
              </div>
            </div>

            <div className="min-w-0">
              <div className="text-sm font-semibold text-white/90 truncate">
                {techName}
              </div>
              <div className="text-[11px] text-white/50">
                Assigned technician
              </div>
            </div>
          </div>

          <button
            onClick={() => onReassign?.(request)}
            type="button"
            className="shrink-0 rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-xs font-extrabold text-white/90 hover:bg-white/15 transition"
          >
            Reassign
          </button>
        </div>
      </div>
    </div>
  );
}
