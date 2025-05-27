"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"

interface MetricsChartProps {
  data: {
    totalSent: number
    totalOpened: number
    totalClicked: number
    totalBounced: number
    openRate: number
    clickRate: number
    bounceRate: number
  }
}

export function MetricsChart({ data }: MetricsChartProps) {
  const barData = [
    { name: "Enviados", value: data.totalSent, color: "#0f766e" },
    { name: "Abiertos", value: data.totalOpened, color: "#0891b2" },
    { name: "Clics", value: data.totalClicked, color: "#06b6d4" },
    { name: "Rebotes", value: data.totalBounced, color: "#ef4444" },
  ]

  const pieData = [
    { name: "Apertura", value: data.openRate, color: "#0891b2" },
    { name: "Clics", value: data.clickRate, color: "#06b6d4" },
    { name: "Rebotes", value: data.bounceRate, color: "#ef4444" },
  ]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Métricas de Email</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#0f766e" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tasas de Rendimiento (%)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value.toFixed(1)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
