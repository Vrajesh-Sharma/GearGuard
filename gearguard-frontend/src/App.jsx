import { useState } from "react";
import { Routes, Route, Link, useLocation } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import AppShell from "./pages/AppShell";

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
      ? "bg-white text-slate-900 shadow-soft"
      : "text-white/75 hover:text-white hover:bg-white/10";

  return (
    <div className="min-h-screen">
      <Toaster position="top-right" />

      <div className="flex min-h-screen">
        {/* Sidebar (glass + dark to match pages) */}
        <aside className="w-72 shrink-0 border-r border-white/10 bg-white/5 backdrop-blur-xl">
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-2xl border border-white/10 bg-white/10 flex items-center justify-center text-white">
                ⚙️
              </div>
              <div>
                <h1 className="text-xl font-extrabold tracking-tight text-white">
                  GearGuard
                </h1>
                <p className="text-xs text-white/60">Maintenance Tracker</p>
              </div>
            </div>
          </div>

          <nav className="p-4 space-y-2">
            <Link
              to="/"
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition ${isActive(
                "/"
              )}`}
            >
              <span className="text-lg">📊</span>
              <span className="font-semibold">Dashboard</span>
            </Link>

            <Link
              to="/equipment"
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition ${isActive(
                "/equipment"
              )}`}
            >
              <span className="text-lg">🏭</span>
              <span className="font-semibold">Equipment</span>
            </Link>

            <Link
              to="/maintenance"
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition ${isActive(
                "/maintenance"
              )}`}
            >
              <span className="text-lg">🛠️</span>
              <span className="font-semibold">Kanban Board</span>
            </Link>

            <Link
              to="/calendar"
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition ${isActive(
                "/calendar"
              )}`}
            >
              <span className="text-lg">📅</span>
              <span className="font-semibold">Calendar</span>
            </Link>
          </nav>

          <div className="p-4 mt-6 border-t border-white/10">
            <button
              onClick={() => setShowRequestForm(true)}
              className="w-full rounded-2xl bg-white text-slate-900 py-3 px-4 font-extrabold shadow-soft hover:shadow-glass transition"
              type="button"
            >
              + New Request
            </button>

            <div className="mt-3 text-[11px] text-white/50">
              Tip: Use Calendar to schedule preventive maintenance.
            </div>
          </div>
        </aside>

        {/* Main content area (global dark animated background via AppShell) */}
        <main className="flex-1 overflow-auto">
          <AppShell>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/equipment" element={<EquipmentList />} />
              <Route
                path="/maintenance"
                element={<KanbanBoard refreshTrigger={refreshKanban} />}
              />
              <Route path="/calendar" element={<CalendarView />} />
            </Routes>
          </AppShell>
        </main>

        {/* Request Form Modal */}
        {showRequestForm && (
          <RequestForm
            onClose={() => setShowRequestForm(false)}
            onSuccess={handleRequestSuccess}
          />
        )}
      </div>
    </div>
  );
}
