import Link from "next/link";
import {
  LayoutDashboard,
  CheckSquare,
  AlertCircle,
  Cpu,
  Database,
  BarChart3,
} from "lucide-react";

export default function Sidebar() {
  const navItems = [
    { name: "Overview", href: "/", icon: LayoutDashboard },
    { name: "Reconciliation", href: "/reconciliation", icon: CheckSquare },
    { name: "Exceptions", href: "/exceptions", icon: AlertCircle },
    { name: "AI Audit", href: "/audit", icon: Cpu },
    { name: "Data Sources", href: "/sources", icon: Database },
    { name: "Analytics", href: "/analytics", icon: BarChart3 },
  ];

  return (
    <div className="w-64 bg-gray-50 border-r border-gray-200 h-screen flex flex-col">
      <div className="p-6">
        <h1 className="text-xl font-bold tracking-tight text-gray-900">
          FINRECON
        </h1>
        <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider font-semibold">
          August Reconciliation
        </p>
      </div>
      <nav className="flex-1 px-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 hover:text-gray-900"
            >
              <Icon className="w-4 h-4 text-gray-500" />
              {item.name}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-gray-200">
        <div className="text-xs text-gray-500">
          Engine Status:{" "}
          <span className="text-green-500 font-medium">Online</span>
        </div>
      </div>
    </div>
  );
}
