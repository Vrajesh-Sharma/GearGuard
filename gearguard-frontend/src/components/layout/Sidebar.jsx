import { NavLink } from "react-router-dom";
import clsx from "clsx";

const links = [
  { to: "/", label: "Dashboard" },
  { to: "/equipment", label: "Equipment" },
  { to: "/maintenance", label: "Kanban" },
  { to: "/calendar", label: "Calendar" },
  { to: "/teams", label: "Teams" },
];

export default function Sidebar() {
  return (
    <aside className="w-60 border-r bg-white p-4">
      <div className="font-bold text-xl mb-6">GearGuard</div>
      <nav className="space-y-1">
        {links.map(l => (
          <NavLink
            key={l.to}
            to={l.to}
            className={({ isActive }) =>
              clsx(
                "block rounded-md px-3 py-2 text-sm",
                isActive ? "bg-blue-50 text-blue-700 font-medium" : "hover:bg-gray-100"
              )
            }
          >
            {l.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
