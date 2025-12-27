import Badge from "../common/Badge";
import { isOverdue } from "../../utils/dates";

export default function RequestCard({ request, technician }) {
  const overdue = isOverdue(request.scheduled_date, request.status);
  const priorityColor = request.priority === "high" ? "red" : request.priority === "medium" ? "yellow" : "blue";

  return (
    <div className="bg-white border rounded-lg p-3 shadow-sm relative">
      {overdue && <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500 rounded-l-lg" />}
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-semibold text-sm">{request.subject}</div>
          <div className="text-xs text-gray-600">Type: {request.request_type}</div>
        </div>
        <Badge color={priorityColor}>{request.priority}</Badge>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {technician?.avatar_url ? (
            <img src={technician.avatar_url} alt="tech" className="w-7 h-7 rounded-full" />
          ) : (
            <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-xs">
              {technician?.full_name?.[0] ?? "?"}
            </div>
          )}
          <div className="text-xs text-gray-700">{technician?.full_name ?? "Unassigned"}</div>
        </div>
        <div className="text-xs text-gray-500">{request.hours_spent ? `${request.hours_spent}h` : "-"}</div>
      </div>

      {overdue && <div className="mt-2 text-xs text-red-600 font-medium">Overdue</div>}
    </div>
  );
}
