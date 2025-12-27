import { useState } from "react";
import { Routes, Route, Link, useLocation } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Dashboard from "./pages/Dashboard";
import EquipmentList from "./pages/EquipmentList";
import KanbanBoard from "./pages/KanbanBoard";
import CalendarView from "./pages/CalendarView";
import RequestForm from "./pages/RequestForm";

export default function App() {
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [refreshKanban, setRefreshKanban] = useState(0);
  const location = useLocation();

  const handleRequestSuccess = () => {
    setShowRequestForm(false);
    setRefreshKanban((p) => p + 1);
  };

  const isActive = (path) =>
    location.pathname === path
      ? "bg-blue-600 text-white"
      : "text-gray-700 hover:bg-gray-100";

  return (
    <div className="flex h-screen bg-gray-100">
      <Toaster position="top-right" />

      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-blue-600 flex items-center gap-2">
            ⚙️ GearGuard
          </h1>
          <p className="text-xs text-gray-600 mt-1">Maintenance Tracker</p>
        </div>

        <nav className="p-4 space-y-2">
          <Link
            to="/"
            className={`block px-4 py-2 rounded transition ${isActive("/")}`}
          >
            📊 Dashboard
          </Link>
          <Link
            to="/equipment"
            className={`block px-4 py-2 rounded transition ${isActive("/equipment")}`}
          >
            🏭 Equipment
          </Link>
          <Link
            to="/maintenance"
            className={`block px-4 py-2 rounded transition ${isActive("/maintenance")}`}
          >
            🛠️ Kanban Board
          </Link>
          <Link
            to="/calendar"
            className={`block px-4 py-2 rounded transition ${isActive("/calendar")}`}
          >
            📅 Calendar
          </Link>
        </nav>

        <div className="p-4 mt-6 border-t border-gray-200">
          <button
            onClick={() => setShowRequestForm(true)}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-2 px-4 rounded font-semibold hover:shadow-lg transition"
          >
            + New Request
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/equipment" element={<EquipmentList />} />
          <Route path="/maintenance" element={<KanbanBoard refreshTrigger={refreshKanban} />} />
          <Route path="/calendar" element={<CalendarView />} />
        </Routes>
      </div>

      {/* Request Form Modal */}
      {showRequestForm && (
        <RequestForm
          onClose={() => setShowRequestForm(false)}
          onSuccess={handleRequestSuccess}
        />
      )}
    </div>
  );
}
