import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

export default function EquipmentList({ onSelectEquipment }) {
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [filterDept, setFilterDept] = useState("");
  const [filterOwner, setFilterOwner] = useState("");

  const [requestCounts, setRequestCounts] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    fetchEquipment();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchEquipment = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("equipment")
        .select(`*, owner:owner_employee_id(id,full_name,email)`)
        .order("name");

      if (error) throw error;
      setEquipment(data || []);

      await fetchRequestCounts(data || []);
    } catch (error) {
      console.error("Fetch error:", error);
      toast.error("Failed to load equipment");
    } finally {
      setLoading(false);
    }
  };

  const fetchRequestCounts = async (equipList) => {
    try {
      const counts = {};
      for (const eq of equipList) {
        const { data } = await supabase
          .from("maintenance_requests")
          .select("id")
          .eq("equipment_id", eq.id)
          .in("status", ["new", "in_progress"]);

        counts[eq.id] = data?.length || 0;
      }
      setRequestCounts(counts);
    } catch (error) {
      console.error("Count error:", error);
    }
  };

  const filtered = equipment.filter((eq) => {
    const matchSearch =
      eq.name.toLowerCase().includes(search.toLowerCase()) ||
      eq.serial_number.toLowerCase().includes(search.toLowerCase());
    const matchDept = !filterDept || eq.department === filterDept;
    const matchOwner =
      !filterOwner || (eq.owner_employee_id && eq.owner_employee_id === filterOwner);

    return matchSearch && matchDept && matchOwner;
  });

  const departments = [...new Set(equipment.map((e) => e.department).filter(Boolean))];

  const ownersMap = new Map();
  equipment.forEach((e) => {
    if (e.owner?.id) ownersMap.set(e.owner.id, e.owner);
  });
  const owners = Array.from(ownersMap.values()).sort((a, b) =>
    (a.full_name || "").localeCompare(b.full_name || "")
  );

  if (loading) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/10 backdrop-blur-xl p-8 shadow-glass">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-64 rounded bg-white/15" />
          <div className="h-4 w-96 rounded bg-white/10" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 pt-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-56 rounded-3xl bg-white/10 border border-white/10" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const inputBase =
    "w-full rounded-2xl border border-white/10 bg-white/10 backdrop-blur px-4 py-3 text-white placeholder:text-white/40 outline-none focus:ring-2 focus:ring-blue-500/40";

  return (
    <div>
      <div className="mb-6 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs text-white/80 backdrop-blur">
            <span className="h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
            Asset Registry
          </div>
          <h1 className="mt-3 text-3xl md:text-4xl font-extrabold tracking-tight text-white">
            Equipment <span className="text-white/70">Management</span>
          </h1>
          <p className="mt-1 text-sm text-white/70">
            Search, filter, and jump into ongoing maintenance instantly.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm text-white/80 backdrop-blur">
            {filtered.length} items
          </div>
          {(filterDept || filterOwner || search) && (
            <button
              onClick={() => {
                setSearch("");
                setFilterDept("");
                setFilterOwner("");
              }}
              className="rounded-xl bg-white text-slate-900 px-4 py-2 text-sm font-semibold shadow-soft hover:shadow-glass transition"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      <div className="mb-6 rounded-3xl border border-white/10 bg-white/10 backdrop-blur-xl shadow-glass">
        <div className="p-4 md:p-5 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50">⌕</div>
            <input
              type="text"
              placeholder="Search equipment or serial..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`${inputBase} pl-10`}
            />
          </div>

          <select
            value={filterDept}
            onChange={(e) => setFilterDept(e.target.value)}
            className={inputBase}
          >
            <option value="" className="text-slate-900">All Departments</option>
            {departments.map((d) => (
              <option key={d} value={d} className="text-slate-900">
                {d}
              </option>
            ))}
          </select>

          <select
            value={filterOwner}
            onChange={(e) => setFilterOwner(e.target.value)}
            className={inputBase}
          >
            <option value="" className="text-slate-900">All Employees</option>
            {owners.map((o) => (
              <option key={o.id} value={o.id} className="text-slate-900">
                {o.full_name} {o.email ? `(${o.email})` : ""}
              </option>
            ))}
          </select>

          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white/70 text-sm">
            Tip: Scrapped assets are highlighted in red and locked.
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((eq) => {
          const isScrapped = eq.status === "scrapped";
          const openCount = requestCounts[eq.id] || 0;

          return (
            <div
              key={eq.id}
              className={`relative overflow-hidden rounded-3xl border shadow-glass transition backdrop-blur-xl ${
                isScrapped
                  ? "border-red-500/30 bg-red-500/10"
                  : "border-white/10 bg-white/10 hover:bg-white/15"
              }`}
            >
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent" />

              <div className="relative p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className={`text-lg font-extrabold tracking-tight ${isScrapped ? "text-red-100" : "text-white"}`}>
                      {eq.name}
                    </h3>
                    <p className="text-xs text-white/60 mt-1">SN: {eq.serial_number}</p>
                  </div>

                  {isScrapped ? (
                    <span className="inline-flex items-center gap-2 rounded-full bg-red-600/20 text-red-100 border border-red-500/30 px-3 py-1 text-xs font-bold">
                      <span className="h-2 w-2 rounded-full bg-red-400" />
                      SCRAPPED
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2 rounded-full bg-emerald-600/15 text-emerald-100 border border-emerald-500/20 px-3 py-1 text-xs font-bold">
                      <span className="h-2 w-2 rounded-full bg-emerald-400" />
                      ACTIVE
                    </span>
                  )}
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <InfoRow label="Category" value={eq.category} />
                  <InfoRow label="Department" value={eq.department} />
                  <InfoRow label="Location" value={eq.location} />
                  <InfoRow label="Employee" value={eq.owner?.full_name || "Unassigned"} />
                  <InfoRow label="Purchase Date" value={eq.purchase_date ? new Date(eq.purchase_date).toLocaleDateString() : "—"} />
                  <InfoRow label="Warranty" value={eq.warranty_expiry ? new Date(eq.warranty_expiry).toLocaleDateString() : "—"} />
                </div>

                {isScrapped && (
                  <div className="mt-4 rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-xs font-semibold text-red-100">
                    This asset is scrapped and cannot be used for new maintenance requests.
                  </div>
                )}

                <button
                  disabled={isScrapped}
                  onClick={() => {
                    navigate("/maintenance", { state: { equipmentFilter: eq.id, onlyOngoing: true } });
                  }}
                  className={`mt-5 w-full rounded-2xl px-4 py-3 font-semibold transition flex items-center justify-between ${
                    isScrapped
                      ? "bg-red-500/20 text-red-100 cursor-not-allowed border border-red-500/25"
                      : "bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:shadow-soft border border-white/10"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="text-lg">{isScrapped ? "⛔" : "🛠️"}</span>
                    {isScrapped ? "Maintenance Locked" : "Maintenance"}
                  </span>

                  <span
                    className={`ml-2 px-3 py-1 rounded-full text-sm font-extrabold ${
                      isScrapped ? "bg-red-500/15 border border-red-500/25" : "bg-white/15 border border-white/15"
                    }`}
                  >
                    {openCount}
                  </span>
                </button>

                {!isScrapped && (
                  <div className="mt-2 text-xs text-white/50">
                    Opens ongoing requests (New + In Progress)
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="mt-10 rounded-3xl border border-white/10 bg-white/10 backdrop-blur-xl p-10 text-center text-white/70 shadow-glass">
          No equipment found.
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
      <div className="text-[11px] text-white/50">{label}</div>
      <div className="text-sm font-semibold text-white/90 truncate">{value || "—"}</div>
    </div>
  );
}
