"use client"

import { Header } from "@/components/layout/header"
import { UnsubscribeReports } from "@/components/reports/unsubscribe-reports"

export function ReportsClient() {
  return (
    <div className="space-y-6">
      <Header title="Reportes" description="Análisis y reportes de desuscripciones" />
      <UnsubscribeReports />
    </div>
  )
}
