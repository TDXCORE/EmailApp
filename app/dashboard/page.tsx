import type { Metadata } from "next"
import { DashboardClient } from "@/components/dashboard/dashboard-client"

export const metadata: Metadata = {
  title: "Dashboard - TDX",
  description: "Resumen de tu actividad de email marketing",
}

export default function DashboardPage() {
  return <DashboardClient />
}
