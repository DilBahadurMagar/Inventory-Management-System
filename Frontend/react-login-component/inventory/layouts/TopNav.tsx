"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Search, Bell, ChevronDown, LogOut, User, Settings, Shield } from "lucide-react"
import { useApp } from "../store/appStore"

export function TopNav() {
  const { state, logout, toast } = useApp()
  const router = useRouter()
  const [profileOpen, setProfileOpen] = useState(false)
  const [searchFocused, setSearchFocused] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const handleLogout = () => {
    logout()
    router.push("/")
    toast({
      type: "info",
      title: "Signed out",
      message: "You have been signed out successfully.",
    })
  }

  const roleColors: Record<string, string> = {
    admin: "text-rose-400 bg-rose-500/10 border-rose-500/20",
    manager: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    viewer: "text-gray-400 bg-gray-500/10 border-gray-500/20",
  }

  return (
    <header className="h-16 bg-gray-900/80 backdrop-blur-md border-b border-gray-800/80 flex items-center px-6 gap-4 shrink-0">
      <div
        className={`relative flex-1 max-w-md transition-all duration-200 ${searchFocused ? "max-w-lg" : ""}`}
      >
        <Search
          size={15}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
        />
        <input
          type="text"
          placeholder="Search assets, locations..."
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
          className="input-base pl-9 h-9 text-sm"
        />
        {searchFocused && (
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-600 bg-gray-800 border border-gray-700 rounded px-1.5 py-0.5">
            ⌘K
          </kbd>
        )}
      </div>

      <div className="flex-1" />

      <div className="flex items-center gap-2">
        <button
          type="button"
          className="relative p-2 rounded-lg text-gray-400 hover:text-gray-200 hover:bg-gray-800 transition-colors"
        >
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-500 rounded-full ring-2 ring-gray-900" />
        </button>

        <div ref={profileRef} className="relative">
          <button
            type="button"
            onClick={() => setProfileOpen((v) => !v)}
            className="flex items-center gap-2.5 pl-3 pr-2 py-1.5 rounded-lg hover:bg-gray-800 transition-colors"
          >
            <img
              src={state.user?.avatar}
              alt={state.user?.name}
              className="w-7 h-7 rounded-full object-cover ring-2 ring-gray-700"
            />
            <div className="text-left hidden sm:block">
              <p className="text-xs font-semibold text-gray-200 leading-tight">{state.user?.name}</p>
              <p className="text-[10px] text-gray-500 leading-tight">{state.user?.department}</p>
            </div>
            <ChevronDown
              size={14}
              className={`text-gray-500 transition-transform duration-200 ${profileOpen ? "rotate-180" : ""}`}
            />
          </button>

          {profileOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-gray-900 border border-gray-700/60 rounded-xl shadow-2xl overflow-hidden animate-scale-in z-50">
              <div className="px-4 py-3 border-b border-gray-700/50">
                <p className="text-sm font-semibold text-gray-100">{state.user?.name}</p>
                <p className="text-xs text-gray-500">{state.user?.email}</p>
                <span
                  className={`mt-1.5 inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${roleColors[state.user?.role ?? "viewer"]}`}
                >
                  <Shield size={10} />
                  {state.user?.role?.charAt(0).toUpperCase()}
                  {state.user?.role?.slice(1)}
                </span>
              </div>
              <div className="py-1">
                {[
                  { icon: User, label: "My Profile" },
                  { icon: Settings, label: "Account Settings" },
                ].map(({ icon: Icon, label }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setProfileOpen(false)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-400 hover:text-gray-200 hover:bg-gray-800 transition-colors"
                  >
                    <Icon size={15} />
                    {label}
                  </button>
                ))}
              </div>
              <div className="py-1 border-t border-gray-700/50">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-rose-400 hover:bg-rose-500/10 transition-colors"
                >
                  <LogOut size={15} />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
