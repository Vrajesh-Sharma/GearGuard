import { useSearchParams } from "react-router-dom";
import KanbanBoard from "../components/requests/KanbanBoard";

export default function MaintenancePage() {
  const [params] = useSearchParams();
  const equipmentId = params.get("equipmentId") || "";
  return <KanbanBoard equipmentIdFilter={equipmentId} />;
}
