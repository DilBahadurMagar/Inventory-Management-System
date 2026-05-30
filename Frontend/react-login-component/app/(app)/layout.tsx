import { AppLayout } from "@/inventory/layouts/AppLayout"

export default function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AppLayout>{children}</AppLayout>
}
