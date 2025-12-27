import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { toast } from "react-hot-toast";

const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444"];

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
      // FIXED: Fetch requests with TEAM relationship directly (not through technician)
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
        console.warn("No data returned");
        setStats({ total: 0, open: 0, overdue: 0, repaired: 0 });
        setLoading(false);
        return;
      }

      // Calculate stats
      const total = data.length;
      const open = data.filter((r) =>
        ["new", "in_progress"].includes(r.status)
      ).length;
      const repaired = data.filter((r) => r.status === "repaired").length;

      const today = new Date().toISOString().split("T")[0];
      const overdue = data.filter(
        (r) =>
          r.scheduled_date &&
          r.scheduled_date < today &&
          ["new", "in_progress"].includes(r.status)
      ).length;

      setStats({ total, open, overdue, repaired });

      // FIXED: Team chart data - groups by team name directly
      const teamCounts = {};
      data.forEach((r) => {
        // Get team name from the team relationship (not technician)
        const teamName = r.team?.name || "Unassigned";
        teamCounts[teamName] = (teamCounts[teamName] || 0) + 1;
      });

      const teamChartData = Object.entries(teamCounts)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value); // Sort by highest count first

      console.log("Team Chart Data:", teamChartData); // Debug: see what's being charted
      setChartData(teamChartData);

      // Category chart data
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

  if (loading) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-600">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-4xl font-bold mb-8">Dashboard</h1>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Total Requests"
          value={stats.total}
          color="blue"
          icon="📋"
        />
        <StatCard
          title="Open Requests"
          value={stats.open}
          color="yellow"
          icon="🔄"
        />
        <StatCard title="Overdue" value={stats.overdue} color="red" icon="⚠️" />
        <StatCard
          title="Completed"
          value={stats.repaired}
          color="green"
          icon="✅"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Requests by Team */}
        <div className="bg-white rounded-lg p-6 shadow-md border border-gray-200">
          <h2 className="text-lg font-bold mb-4">Requests by Team</h2>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-center py-8">No data available</p>
          )}
        </div>

        {/* Requests by Category */}
        <div className="bg-white rounded-lg p-6 shadow-md border border-gray-200">
          <h2 className="text-lg font-bold mb-4">Requests by Category</h2>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-center py-8">No data available</p>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="bg-white rounded-lg p-6 shadow-md border border-gray-200">
        <h2 className="text-lg font-bold mb-4">Summary</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-3xl font-bold text-blue-600">{stats.total}</p>
            <p className="text-sm text-gray-600">Total Requests</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-yellow-600">{stats.open}</p>
            <p className="text-sm text-gray-600">Active</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-red-600">{stats.overdue}</p>
            <p className="text-sm text-gray-600">Overdue</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-green-600">
              {stats.total > 0
                ? Math.round((stats.repaired / stats.total) * 100)
                : 0}
              %
            </p>
            <p className="text-sm text-gray-600">Completion Rate</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, color, icon }) {
  const bgColor = {
    blue: "bg-blue-50 border-blue-200",
    yellow: "bg-yellow-50 border-yellow-200",
    red: "bg-red-50 border-red-200",
    green: "bg-green-50 border-green-200",
  }[color];

  const textColor = {
    blue: "text-blue-600",
    yellow: "text-yellow-600",
    red: "text-red-600",
    green: "text-green-600",
  }[color];

  return (
    <div className={`${bgColor} border rounded-lg p-6`}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm text-gray-600 font-medium">{title}</p>
          <p className={`text-3xl font-bold ${textColor} mt-2`}>{value}</p>
        </div>
        <span className="text-3xl">{icon}</span>
      </div>
    </div>
  );
}
