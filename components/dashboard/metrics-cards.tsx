"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail, Users, FolderOpen, TrendingUp, Eye, MousePointer, AlertTriangle } from "lucide-react"

interface MetricsCardsProps {
  metrics: {
    totalCampaigns: number
    totalContacts: number
    totalGroups: number
    totalSent: number
    totalOpened: number
    totalClicked: number
    totalBounced: number
    openRate: number
    clickRate: number
    bounceRate: number
  }
}

export function MetricsCards({ metrics }: MetricsCardsProps) {
  const cards = [
    {
      title: "Total Campañas",
      value: metrics.totalCampaigns,
      icon: Mail,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Total Contactos",
      value: metrics.totalContacts,
      icon: Users,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Total Grupos",
      value: metrics.totalGroups,
      icon: FolderOpen,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Emails Enviados",
      value: metrics.totalSent,
      icon: TrendingUp,
      color: "text-teal-600",
      bgColor: "bg-teal-50",
    },
    {
      title: "Tasa de Apertura",
      value: `${metrics.openRate.toFixed(1)}%`,
      icon: Eye,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
    {
      title: "Tasa de Clics",
      value: `${metrics.clickRate.toFixed(1)}%`,
      icon: MousePointer,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
    },
    {
      title: "Tasa de Rebote",
      value: `${metrics.bounceRate.toFixed(1)}%`,
      icon: AlertTriangle,
      color: "text-red-600",
      bgColor: "bg-red-50",
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">{card.title}</CardTitle>
            <div className={`p-2 rounded-lg ${card.bgColor}`}>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
