import { useState, useEffect, useMemo } from "react";
import { supabase } from "../lib/supabaseClient";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { toast } from "react-hot-toast";

const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444"];

function GlassPanel({ title, subtitle, children, right }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/70 backdrop-blur-xl shadow-glass">
      <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-white/10 pointer-events-none" />
      <div className="relative p-5 md:p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h2 className="text-sm md:text-base font-semibold text-slate-900">
              {title}
            </h2>
            {subtitle ? (
              <p className="text-xs text-slate-600 mt-1">{subtitle}</p>
            ) : null}
          </div>
          {right}
        </div>
        {children}
      </div>
    </div>
  );
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div
      className="rounded-xl border border-white/10 bg-slate-900/90 text-white px-3 py-2 shadow-lg backdrop-blur"
      style={{ minWidth: 160 }}
    >
      {label ? <div className="text-xs text-white/70 mb-1">{label}</div> : null}
      {payload.map((p, idx) => (
        <div key={idx} className="flex items-center justify-between gap-4 text-sm">
          <span className="text-white/80">{p.name}</span>
          <span className="font-semibold">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    overdue: 0,
    repaired: 0,
  });
  const [chartData, setChartData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("maintenance_requests")
        .select(
          `id,
           status,
           scheduled_date,
           category,
           team:team_id(id,name),
           request_type`
        )
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Query error:", error);
        throw error;
      }

      if (!data) {
        setStats({ total: 0, open: 0, overdue: 0, repaired: 0 });
        setLoading(false);
        return;
      }

      const total = data.length;
      const open = data.filter((r) => ["new", "in_progress"].includes(r.status)).length;
      const repaired = data.filter((r) => r.status === "repaired").length;

      const today = new Date().toISOString().split("T")[0];
      const overdue = data.filter(
        (r) =>
          r.scheduled_date &&
          r.scheduled_date < today &&
          ["new", "in_progress"].includes(r.status)
      ).length;

      setStats({ total, open, overdue, repaired });

      const teamCounts = {};
      data.forEach((r) => {
        const teamName = r.team?.name || "Unassigned";
        teamCounts[teamName] = (teamCounts[teamName] || 0) + 1;
      });

      const teamChartData = Object.entries(teamCounts)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

      setChartData(teamChartData);

      const categoryCounts = {};
      data.forEach((r) => {
        const cat = r.category || "Other";
        categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
      });

      const catChartData = Object.entries(categoryCounts).map(([name, value]) => ({
        name,
        value,
      }));
      setCategoryData(catChartData);
    } catch (error) {
      console.error("Dashboard fetch error:", error.message);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const completionRate = useMemo(() => {
    return stats.total > 0 ? Math.round((stats.repaired / stats.total) * 100) : 0;
  }, [stats]);

  if (loading) {
    return (
      <div className="min-h-[60vh] p-6">
        <div className="rounded-3xl border border-white/10 bg-white/10 backdrop-blur-xl p-8 shadow-glass">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-48 bg-white/20 rounded" />
            <div className="h-4 w-64 bg-white/10 rounded" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-28 bg-white/10 rounded-2xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    // Full-page premium background
    <div className="min-h-screen">
      <div className="relative overflow-hidden">
        {/* Animated gradient backdrop */}
        <div className="absolute inset-0 bg-[radial-gradient(closest-side,rgba(59,130,246,0.30),transparent),radial-gradient(closest-side,rgba(16,185,129,0.22),transparent),radial-gradient(closest-side,rgba(245,158,11,0.18),transparent)] bg-[length:200%_200%] animate-gradient" />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/30 via-slate-950/60 to-slate-950/90" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-8">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs text-white/80 backdrop-blur">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                Live maintenance insights
              </div>

              <h1 className="mt-4 text-3xl md:text-5xl font-extrabold tracking-tight text-white">
                GearGuard <span className="text-white/70">Dashboard</span>
              </h1>

              <p className="mt-2 text-sm md:text-base text-white/70 max-w-2xl">
                Real-time view of request load, overdue risk, and team distribution.
              </p>
            </div>

            <button
              onClick={fetchDashboard}
              className="self-start md:self-auto rounded-xl bg-white text-slate-900 px-4 py-2 font-semibold shadow-soft hover:shadow-glass transition"
            >
              Refresh
            </button>
          </div>

          {/* Stat Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <StatCard title="Total Requests" value={stats.total} tone="blue" icon="📋" />
            <StatCard title="Open Requests" value={stats.open} tone="yellow" icon="🔄" />
            <StatCard title="Overdue" value={stats.overdue} tone="red" icon="⚠️" />
            <StatCard title="Completed" value={stats.repaired} tone="green" icon="✅" />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <GlassPanel
              title="Requests by Team"
              subtitle="Workload distribution across maintenance teams"
              right={
                <span className="text-xs text-slate-600 bg-white/60 rounded-full px-3 py-1 border border-white/40">
                  Updated just now
                </span>
              }
            >
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis dataKey="name" tick={{ fill: "#334155", fontSize: 12 }} />
                    <YAxis tick={{ fill: "#334155", fontSize: 12 }} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(2,6,23,0.06)" }} />
                    <Bar dataKey="value" fill="#3B82F6" radius={[10, 10, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-slate-600 text-sm py-10 text-center">
                  No data available
                </div>
              )}
            </GlassPanel>

            <GlassPanel
              title="Requests by Category"
              subtitle="Equipment categories with highest maintenance demand"
            >
              {categoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height={320}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      outerRadius={95}
                      innerRadius={55}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {categoryData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-slate-600 text-sm py-10 text-center">
                  No data available
                </div>
              )}
            </GlassPanel>
          </div>

          {/* Summary */}
          <GlassPanel title="Summary" subtitle="Key KPIs at a glance">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <Kpi label="Total" value={stats.total} accent="text-blue-600" />
              <Kpi label="Active" value={stats.open} accent="text-yellow-700" />
              <Kpi label="Overdue" value={stats.overdue} accent="text-red-600" />
              <Kpi label="Completion Rate" value={`${completionRate}%`} accent="text-emerald-700" />
            </div>
          </GlassPanel>

          <div className="h-10" />
        </div>
      </div>
    </div>
  );
}

function Kpi({ label, value, accent }) {
  return (
    <div className="rounded-2xl border border-white/20 bg-white/50 backdrop-blur p-4 shadow-soft">
      <div className={`text-3xl font-extrabold ${accent}`}>{value}</div>
      <div className="text-xs text-slate-600 mt-1">{label}</div>
    </div>
  );
}

function StatCard({ title, value, tone, icon }) {
  const toneMap = {
    blue: {
      ring: "ring-blue-500/20",
      grad: "from-blue-600/15 to-blue-600/0",
      text: "text-blue-200",
      value: "text-white",
    },
    yellow: {
      ring: "ring-yellow-500/20",
      grad: "from-yellow-500/15 to-yellow-500/0",
      text: "text-yellow-200",
      value: "text-white",
    },
    red: {
      ring: "ring-red-500/20",
      grad: "from-red-500/15 to-red-500/0",
      text: "text-red-200",
      value: "text-white",
    },
    green: {
      ring: "ring-emerald-500/20",
      grad: "from-emerald-500/15 to-emerald-500/0",
      text: "text-emerald-200",
      value: "text-white",
    },
  }[tone];

  return (
    <div className={`relative overflow-hidden rounded-2xl border border-white/10 bg-white/10 backdrop-blur-xl shadow-glass ring-1 ${toneMap.ring} hover:translate-y-[-2px] transition`}>
      <div className={`absolute inset-0 bg-gradient-to-br ${toneMap.grad}`} />
      <div className="relative p-5">
        <div className="flex items-start justify-between">
          <div>
            <div className={`text-xs font-semibold ${toneMap.text}`}>{title}</div>
            <div className={`mt-3 text-4xl font-extrabold ${toneMap.value}`}>{value}</div>
          </div>
          <div className="text-3xl opacity-90 animate-float">{icon}</div>
        </div>
      </div>
    </div>
  );
}
