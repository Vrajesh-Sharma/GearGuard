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
        .select(
          `*,
           owner:owner_employee_id(id,full_name,email)`
        )
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
    return <div className="p-6 text-center">Loading equipment...</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Equipment Management</h1>

      <div className="bg-white rounded-lg p-4 mb-6 shadow-sm border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <input
              type="text"
              placeholder="Search by name or serial..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>

          <div>
            <select
              value={filterDept}
              onChange={(e) => setFilterDept(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2"
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={filterOwner}
              onChange={(e) => setFilterOwner(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2"
            >
              <option value="">All Employees</option>
              {owners.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.full_name} {o.email ? `(${o.email})` : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-between gap-2">
            <p className="text-sm text-gray-600">{filtered.length} equipment found</p>
            {(filterDept || filterOwner || search) && (
              <button
                onClick={() => {
                  setSearch("");
                  setFilterDept("");
                  setFilterOwner("");
                }}
                className="text-sm px-3 py-2 bg-gray-200 rounded hover:bg-gray-300"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((eq) => (
          <div
            key={eq.id}
            className="border border-gray-200 rounded-lg p-5 hover:shadow-lg transition bg-white"
          >
            <div className="mb-3">
              <h3 className="text-lg font-bold text-gray-900">{eq.name}</h3>
              <p className="text-sm text-gray-600">SN: {eq.serial_number}</p>
            </div>

            <div className="space-y-2 mb-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Category:</span>
                <span className="ml-2 text-gray-600">{eq.category}</span>
              </div>

              <div>
                <span className="font-medium text-gray-700">Department:</span>
                <span className="ml-2 text-gray-600">{eq.department}</span>
              </div>

              {eq.purchase_date && (
                <div>
                  <span className="font-medium text-gray-700">Purchase Date:</span>
                  <span className="ml-2 text-gray-600">
                    {new Date(eq.purchase_date).toLocaleDateString()}
                  </span>
                </div>
              )}

              <div>
                <span className="font-medium text-gray-700">Location:</span>
                <span className="ml-2 text-gray-600">{eq.location}</span>
              </div>

              <div>
                <span className="font-medium text-gray-700">Employee:</span>
                <span className="ml-2 text-gray-600">
                  {eq.owner?.full_name || "Unassigned"}
                </span>
              </div>

              <div>
                <span className="font-medium text-gray-700">Status:</span>
                <span
                  className={`ml-2 px-2 py-1 rounded text-xs font-semibold ${
                    eq.status === "active"
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {eq.status}
                </span>
              </div>
            </div>

            {eq.warranty_expiry && (
              <p className="text-xs text-gray-500 mb-4">
                Warranty until: {new Date(eq.warranty_expiry).toLocaleDateString()}
              </p>
            )}

            <button
              onClick={() => {
                navigate("/maintenance", { state: { equipmentFilter: eq.id } });
              }}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-2 px-4 rounded font-semibold hover:shadow-md transition flex items-center justify-between"
            >
              <span>Maintenance</span>
              <span className="ml-2 bg-white/20 px-2 py-1 rounded text-sm font-bold">
                {requestCounts[eq.id] || 0}
              </span>
            </button>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No equipment found</p>
        </div>
      )}
    </div>
  );
}
