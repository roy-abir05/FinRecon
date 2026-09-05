"use client";
import Link from "next/link";
import {
  LayoutDashboard,
  CheckSquare,
  AlertCircle,
  Cpu,
  Database,
  BarChart3,
} from "lucide-react";
import { usePathname } from "next/navigation";

export default function Sidebar() {
  const navItems = [
    { name: "Overview", href: "/", icon: LayoutDashboard },
    { name: "Reconciliation", href: "/reconciliation", icon: CheckSquare },
    { name: "Exceptions", href: "/exceptions", icon: AlertCircle },
    { name: "AI Audit", href: "/audit", icon: Cpu },
    { name: "Data Sources", href: "/sources", icon: Database },
    { name: "Analytics", href: "/analytics", icon: BarChart3 },
  ];

  const pathname = usePathname();

  return (
    <div className="w-64 bg-[#080808] border-r border-[#1a1a1a] h-screen flex flex-col">
      <div className="p-6 pb-2">
        <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
          FINRECON
          <span className="text-[#00E5FF] font-black text-2xl leading-none">
            .
          </span>
        </h1>
        <div className="mt-4 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse"></div>
          <span className="text-xs uppercase tracking-wider font-mono text-[#8B96A8]">
            System Live
          </span>
        </div>
      </div>
      <nav className="flex-1 px-4 mt-8 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.name} href={item.href}>
              <div
                className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md ${
                  pathname === item.href
                    ? "bg-[#111111] text-[#00E5FF] border border-[#222B3A]"
                    : "text-[#8B96A8] hover:text-white hover:bg-[#111111]"
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.name}
              </div>
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-[#1a1a1a]">
        <div className="text-xs font-mono text-[#8B96A8]">
          Build <span className="text-white">v1.0.0</span>
        </div>
      </div>
    </div>
  );
}
