"use client";

import {
  LayoutDashboard,
  Plus,
  Search,
  FolderOpen,
  Wallet,
  MessageSquare,
  LogOut,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navigationItems = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    href: "/onboarding/dashboard",
  },
  {
    title: "Create project",
    icon: Plus,
    href: "/client/create-project",
  },
  {
    title: "Search Talent",
    icon: Search,
    href: "/onboarding/dashboard/talent",
  },
  {
    title: "Manage project",
    icon: FolderOpen,
    href: "/dashboard/manage-project",
  },
  {
    title: "Wallet",
    icon: Wallet,
    href: "/dashboard/wallet",
  },
  {
    title: "Messages",
    icon: MessageSquare,
    href: "/dashboard/messages",
  },
];

export function ClientSidebar() {
  const pathname = usePathname();

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-full">
      <nav className="flex-1 p-2">
        <ul className="space-y-1">
          {navigationItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-teal-50 text-teal-700 border-r-2 border-teal-600"
                      : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.title}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-2 border-t border-gray-200">
        <button className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700 w-full transition-colors">
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}
