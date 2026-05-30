"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { LoginForm } from "@/components/login-form"
import { useApp } from "@/inventory/store/appStore"

export function LoginPageClient() {
  const { state } = useApp()
  const router = useRouter()

  useEffect(() => {
    if (state.isAuthenticated) {
      router.replace("/dashboard")
    }
  }, [state.isAuthenticated, router])

  if (state.isAuthenticated) {
    return null
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <LoginForm />
    </main>
  )
}
