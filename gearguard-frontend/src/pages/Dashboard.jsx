import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import Badge from "../components/common/Badge";
import { listRequests } from "../app/db";
import { isOverdue } from "../utils/dates";

export default function Dashboard() {
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const data = await listRequests();
        setRequests(data);
      } catch (e) {
        toast.error(e.message ?? "Failed loading dashboard");
      }
    })();
  }, []);

  const stats = useMemo(() => {
    const total = requests.length;
    const open = requests.filter(r => r.status === "new" || r.status === "in_progress").length;
    const overdue = requests.filter(r => isOverdue(r.scheduled_date, r.status)).length;
    const repaired = requests.filter(r => r.status === "repaired").length;
    return { total, open, overdue, repaired };
  }, [requests]);

  const Card = ({ title, value, badge }) => (
    <div className="bg-white border rounded-xl p-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">{title}</div>
        {badge}
      </div>
      <div className="text-3xl font-bold mt-2">{value}</div>
    </div>
  );

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      <div className="grid md:grid-cols-4 gap-4">
        <Card title="Total Requests" value={stats.total} badge={<Badge color="gray">All</Badge>} />
        <Card title="Open Requests" value={stats.open} badge={<Badge color="blue">Active</Badge>} />
        <Card title="Overdue" value={stats.overdue} badge={<Badge color="red">Attention</Badge>} />
        <Card title="Repaired" value={stats.repaired} badge={<Badge color="green">Done</Badge>} />
      </div>
    </div>
  );
}
