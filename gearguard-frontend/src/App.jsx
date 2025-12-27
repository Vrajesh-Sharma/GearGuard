import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppShell from "./components/layout/AppShell";
import Dashboard from "./pages/Dashboard";
import EquipmentPage from "./pages/EquipmentPage";
import MaintenancePage from "./pages/MaintenancePage";
import CalendarPage from "./pages/CalendarPage";
import TeamsPage from "./pages/TeamsPage";

export default function App() {
  return (
    <BrowserRouter>
      <AppShell>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/equipment" element={<EquipmentPage />} />
          <Route path="/maintenance" element={<MaintenancePage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/teams" element={<TeamsPage />} />
        </Routes>
      </AppShell>
    </BrowserRouter>
  );
}
