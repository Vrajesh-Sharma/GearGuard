import { useNavigate } from "react-router-dom";
import EquipmentList from "../components/Equipment/EquipmentList";

export default function EquipmentPage() {
  const navigate = useNavigate();
  return <EquipmentList onOpenMaintenance={(equipmentId) => navigate(`/maintenance?equipmentId=${equipmentId}`)} />;
}
