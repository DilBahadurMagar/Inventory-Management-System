"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronRight, Home } from "lucide-react"

const routeLabels: Record<string, string> = {
  dashboard: "Dashboard",
  items: "Inventory",
  locations: "Locations",
  reports: "Reports",
  settings: "Settings",
  notifications: "Notifications",
  help: "Help & Support",
}

interface BreadcrumbProps {
  extra?: { label: string; to?: string }[]
}

export function Breadcrumb({ extra }: BreadcrumbProps) {
  const pathname = usePathname()
  const segments = pathname.split("/").filter(Boolean)

  const crumbs = segments.map((seg, i) => ({
    label: routeLabels[seg] ?? decodeURIComponent(seg),
    to: "/" + segments.slice(0, i + 1).join("/"),
    isLast: i === segments.length - 1 && !extra,
  }))

  const allCrumbs = [
    ...crumbs,
    ...(extra ?? []).map((e, i) => ({
      label: e.label,
      to: e.to,
      isLast: i === (extra?.length ?? 0) - 1,
    })),
  ]

  return (
    <nav className="flex items-center gap-1 text-xs text-gray-500 mb-1">
      <Link href="/dashboard" className="hover:text-gray-300 transition-colors">
        <Home size={12} />
      </Link>
      {allCrumbs.map((crumb, i) => (
        <span key={`${crumb.label}-${i}`} className="flex items-center gap-1">
          <ChevronRight size={12} className="text-gray-700" />
          {crumb.isLast || !crumb.to ? (
            <span className="text-gray-300 font-medium">{crumb.label}</span>
          ) : (
            <Link href={crumb.to} className="hover:text-gray-300 transition-colors">
              {crumb.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  )
}
