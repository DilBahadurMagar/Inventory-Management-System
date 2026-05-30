"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "./Sidebar"
import { TopNav } from "./TopNav"
import { ToastContainer } from "../components/ui/Toast"
import { useApp } from "../store/appStore"

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { state } = useApp()
  const router = useRouter()

  useEffect(() => {
    if (!state.isAuthenticated) {
      router.replace("/")
    }
  }, [state.isAuthenticated, router])

  if (!state.isAuthenticated) {
    return null
  }

  return (
    <div className="inventory-app flex h-screen bg-gray-950 overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0">
        <TopNav />
        <main className="flex-1 overflow-y-auto">
          <div className="p-6 animate-fade-in">{children}</div>
        </main>
      </div>
      <ToastContainer />
    </div>
  )
}
