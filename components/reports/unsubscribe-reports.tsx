"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getUnsubscribeLogs } from "@/lib/api"
import type { UnsubscribeLog } from "@/lib/types"
import { Calendar, Mail, UserX, RefreshCw, Download } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"

export function UnsubscribeReports() {
  const [logs, setLogs] = useState<UnsubscribeLog[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadLogs()
  }, [])

  const loadLogs = async () => {
    try {
      const data = await getUnsubscribeLogs()
      setLogs(data)
    } catch (error) {
      console.error("Error loading unsubscribe logs:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los registros de desuscripción",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadLogs()
  }

  const exportLogs = () => {
    const csvContent = [
      ["Email", "Fecha", "Razón", "ID Campaña", "ID Contacto"].join(","),
      ...logs.map((log) =>
        [
          log.email,
          new Date(log.unsubscribed_at).toLocaleString(),
          getReasonText(log.reason),
          log.campaign_id,
          log.contact_id,
        ].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `unsubscribe-logs-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const getReasonColor = (reason: string) => {
    switch (reason) {
      case "user_request":
        return "bg-blue-100 text-blue-800"
      case "bounce":
        return "bg-red-100 text-red-800"
      case "spam_complaint":
        return "bg-orange-100 text-orange-800"
      case "admin_action":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getReasonText = (reason: string) => {
    switch (reason) {
      case "user_request":
        return "Solicitud del usuario"
      case "bounce":
        return "Email rebotado"
      case "spam_complaint":
        return "Reporte de spam"
      case "admin_action":
        return "Acción del administrador"
      default:
        return reason
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Registro de Desuscripciones</h3>
          <p className="text-sm text-gray-600">Historial completo de desuscripciones con detalles</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            Actualizar
          </Button>
          {logs.length > 0 && (
            <Button variant="outline" size="sm" onClick={exportLogs}>
              <Download className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
          )}
          <Badge variant="outline">{logs.length} total</Badge>
        </div>
      </div>

      {logs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <UserX className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay desuscripciones</h3>
            <p className="text-gray-500 text-center">
              Aún no se han registrado desuscripciones en tus campañas.
              <br />
              Esto es una buena señal - significa que tu contenido es relevante para tus suscriptores.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {logs.map((log) => (
            <Card key={log.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Mail className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="font-medium">{log.email}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(log.unsubscribed_at).toLocaleString()}</span>
                        </div>
                        <span>•</span>
                        <span>Campaña: {log.campaign_id.slice(0, 8)}...</span>
                      </div>
                    </div>
                  </div>
                  <Badge className={getReasonColor(log.reason)}>{getReasonText(log.reason)}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {logs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Resumen de Desuscripciones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {logs.filter((l) => l.reason === "user_request").length}
                </div>
                <div className="text-sm text-gray-600">Solicitudes de usuario</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">
                  {logs.filter((l) => l.reason === "bounce").length}
                </div>
                <div className="text-sm text-gray-600">Emails rebotados</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">
                  {logs.filter((l) => l.reason === "spam_complaint").length}
                </div>
                <div className="text-sm text-gray-600">Reportes de spam</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-600">
                  {logs.filter((l) => l.reason === "admin_action").length}
                </div>
                <div className="text-sm text-gray-600">Acciones admin</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
