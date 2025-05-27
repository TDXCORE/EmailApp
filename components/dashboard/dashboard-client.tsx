"use client"

import { useEffect, useState } from "react"
import { Header } from "@/components/layout/header"
import { MetricsCards } from "@/components/dashboard/metrics-cards"
import { MetricsChart } from "@/components/dashboard/metrics-chart"
import { getDashboardMetrics } from "@/lib/api"
import { Skeleton } from "@/components/ui/skeleton"

export function DashboardClient() {
  const [metrics, setMetrics] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadMetrics = async () => {
      try {
        const data = await getDashboardMetrics()
        setMetrics(data)
      } catch (error) {
        console.error("Error loading metrics:", error)
      } finally {
        setLoading(false)
      }
    }

    loadMetrics()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <Header title="Dashboard" description="Resumen de tu actividad de email marketing" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Header title="Dashboard" description="Resumen de tu actividad de email marketing" />
      {metrics && (
        <div className="space-y-6">
          <MetricsCards metrics={metrics} />
          <MetricsChart data={metrics} />
        </div>
      )}
    </div>
  )
}
