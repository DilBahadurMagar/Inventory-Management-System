"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Package,
  MapPin,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Boxes,
  Bell,
  HelpCircle,
} from "lucide-react"
import { useApp } from "../store/appStore"

const navItems = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/items", icon: Package, label: "Inventory" },
  { to: "/locations", icon: MapPin, label: "Locations" },
  { to: "/reports", icon: BarChart3, label: "Reports" },
]

const bottomItems = [
  { to: "/notifications", icon: Bell, label: "Notifications" },
  { to: "/settings", icon: Settings, label: "Settings" },
  { to: "/help", icon: HelpCircle, label: "Help & Support" },
]

export function Sidebar() {
  const { state, toggleSidebar } = useApp()
  const collapsed = state.sidebarCollapsed
  const pathname = usePathname()

  return (
    <aside
      className={`
      flex flex-col h-full bg-gray-900 border-r border-gray-800/80
      transition-all duration-300 ease-in-out shrink-0
      ${collapsed ? "w-16" : "w-60"}
    `}
    >
      <div
        className={`flex items-center h-16 px-4 border-b border-gray-800/80 ${collapsed ? "justify-center" : "gap-3"}`}
      >
        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shrink-0 shadow-glow-blue">
          <Boxes size={16} className="text-white" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <span className="text-sm font-bold text-white tracking-tight block">AssetVault</span>
            <span className="text-[10px] text-gray-500 block -mt-0.5">Asset Management</span>
          </div>
        )}
      </div>

      <nav className="flex-1 py-4 px-2 space-y-0.5 overflow-y-auto no-scrollbar">
        {!collapsed && (
          <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-widest px-2 mb-2">
            Main
          </p>
        )}
        {navItems.map(({ to, icon: Icon, label }) => {
          const isActive = pathname.startsWith(to)
          return (
            <Link
              key={to}
              href={to}
              title={collapsed ? label : undefined}
              className={`sidebar-link ${isActive ? "sidebar-link-active" : ""} ${collapsed ? "justify-center px-2" : ""}`}
            >
              <Icon size={18} className="shrink-0" />
              {!collapsed && <span>{label}</span>}
              {!collapsed && isActive && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400" />
              )}
            </Link>
          )
        })}
      </nav>

      <div className="py-3 px-2 border-t border-gray-800/80 space-y-0.5">
        {bottomItems.map(({ to, icon: Icon, label }) => {
          const isActive = pathname.startsWith(to)
          return (
            <Link
              key={to}
              href={to}
              title={collapsed ? label : undefined}
              className={`sidebar-link ${isActive ? "sidebar-link-active" : ""} ${collapsed ? "justify-center px-2" : ""}`}
            >
              <Icon size={18} className="shrink-0" />
              {!collapsed && <span>{label}</span>}
            </Link>
          )
        })}
      </div>

      <div className="p-3 border-t border-gray-800/80">
        <button
          type="button"
          onClick={toggleSidebar}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-gray-800 transition-colors text-xs font-medium ${collapsed ? "justify-center" : ""}`}
        >
          {collapsed ? (
            <ChevronRight size={16} />
          ) : (
            <>
              <ChevronLeft size={16} />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  )
}
