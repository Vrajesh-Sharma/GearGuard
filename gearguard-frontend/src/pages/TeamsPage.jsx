import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { listTeams } from "../app/db";

export default function TeamsPage() {
  const [teams, setTeams] = useState([]);
  useEffect(() => {
    (async () => {
      try { setTeams(await listTeams()); }
      catch (e) { toast.error(e.message ?? "Failed loading teams"); }
    })();
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Teams</h1>
      <div className="grid md:grid-cols-3 gap-4">
        {teams.map(t => (
          <div key={t.id} className="bg-white border rounded-xl p-4">
            <div className="font-semibold">{t.name}</div>
            <div className="text-sm text-gray-600">{t.specialty || t.description || "-"}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
