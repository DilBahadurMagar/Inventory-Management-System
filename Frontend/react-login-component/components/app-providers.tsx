"use client"

import { AppProvider } from "@/inventory/store/appStore"

export function AppProviders({ children }: { children: React.ReactNode }) {
  return <AppProvider>{children}</AppProvider>
}
