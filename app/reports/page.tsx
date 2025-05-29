import type { Metadata } from "next"
import { ReportsClient } from "@/components/reports/reports-client"

export const metadata: Metadata = {
  title: "Reportes - Email Marketing App",
  description: "Reportes y análisis de desuscripciones",
}

export default function ReportsPage() {
  return <ReportsClient />
}
