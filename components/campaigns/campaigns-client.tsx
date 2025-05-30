"use client"

import { useEffect, useState } from "react"
import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getCampaigns, deleteCampaign, updateCampaign, getCampaignMetrics } from "@/lib/api"
import { useAppStore } from "@/lib/store"
import type { Campaign } from "@/lib/types"
import { Plus, Edit, Trash2, Calendar, Send, Mail, Play, Pause, MessageSquare, List, LayoutGrid, ChevronUp, ChevronDown } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { CampaignFormModal } from "@/components/campaigns/campaign-form-modal"
import { SendCampaignModal } from "@/components/campaigns/send-campaign-modal"
import { useToast } from "@/hooks/use-toast"

export function CampaignsClient() {
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | undefined>()
  const [showCampaignModal, setShowCampaignModal] = useState(false)
  const [showSendModal, setShowSendModal] = useState(false)
  const [campaignToSend, setCampaignToSend] = useState<Campaign | undefined>()
  const { campaigns, setCampaigns, removeCampaign, isLoading, setIsLoading } = useAppStore()
  const { toast } = useToast()
  const [pausingCampaign, setPausingCampaign] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'cards' | 'table'>("cards")
  const [sortBy, setSortBy] = useState<string>("created_at")
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>("desc")
  const [metricsMap, setMetricsMap] = useState<Record<string, any>>({})

  useEffect(() => {
    loadCampaigns()
  }, [])

  useEffect(() => {
    // Cargar métricas para cada campaña
    const fetchMetrics = async () => {
      const map: Record<string, any> = {}
      await Promise.all(
        campaigns.map(async (c) => {
          try {
            map[c.id] = await getCampaignMetrics(c.id)
          } catch {
            map[c.id] = null
          }
        })
      )
      setMetricsMap(map)
    }
    if (campaigns.length > 0) fetchMetrics()
  }, [campaigns])

  const loadCampaigns = async () => {
    setIsLoading(true)
    try {
      const data = await getCampaigns()
      setCampaigns(data)
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar las campañas",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm("¿Estás seguro de que quieres eliminar esta campaña?")) {
      try {
        await deleteCampaign(id)
        removeCampaign(id)
        toast({
          title: "Éxito",
          description: "Campaña eliminada correctamente",
        })
      } catch (error) {
        toast({
          title: "Error",
          description: "No se pudo eliminar la campaña",
          variant: "destructive",
        })
      }
    }
  }

  const handleEdit = (campaign: Campaign) => {
    setSelectedCampaign(campaign)
    setShowCampaignModal(true)
  }

  const handleSend = (campaign: Campaign) => {
    setCampaignToSend(campaign)
    setShowSendModal(true)
  }

  const handleNewCampaign = () => {
    setSelectedCampaign(undefined)
    setShowCampaignModal(true)
  }

  const handleForceSend = async (campaign: Campaign) => {
    if (confirm("¿Estás seguro de que quieres enviar esta campaña inmediatamente?")) {
      setCampaignToSend(campaign)
      setShowSendModal(true)
    }
  }

  const handleTogglePause = async (campaign: Campaign) => {
    setPausingCampaign(campaign.id)
    try {
      const newStatus = campaign.status === "paused" ? "scheduled" : "paused"
      await updateCampaign(campaign.id, { status: newStatus })

      // Update the campaign in the store
      const updatedCampaigns = campaigns.map((c) => (c.id === campaign.id ? { ...c, status: newStatus } : c))
      setCampaigns(updatedCampaigns)

      toast({
        title: "Éxito",
        description: `Campaña ${newStatus === "paused" ? "pausada" : "reanudada"} correctamente`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo cambiar el estado de la campaña",
        variant: "destructive",
      })
    } finally {
      setPausingCampaign(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-gray-100 text-gray-800"
      case "sent":
        return "bg-green-100 text-green-800"
      case "scheduled":
        return "bg-blue-100 text-blue-800"
      case "paused":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "draft":
        return "Borrador"
      case "sent":
        return "Enviada"
      case "scheduled":
        return "Programada"
      case "paused":
        return "Pausada"
      default:
        return status
    }
  }

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortDir(sortDir === "asc" ? "desc" : "asc")
    } else {
      setSortBy(column)
      setSortDir("asc")
    }
  }

  const sortedCampaigns = [...campaigns].sort((a, b) => {
    let aValue = a[sortBy as keyof Campaign]
    let bValue = b[sortBy as keyof Campaign]
    // Para campos string
    if (typeof aValue === "string" && typeof bValue === "string") {
      return sortDir === "asc"
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue)
    }
    // Para campos numéricos
    if (typeof aValue === "number" && typeof bValue === "number") {
      return sortDir === "asc" ? aValue - bValue : bValue - aValue
    }
    // Para fechas
    if (sortBy === "created_at" || sortBy === "sent_at" || sortBy === "scheduled_at") {
      return sortDir === "asc"
        ? new Date(a[sortBy as keyof Campaign] as string || 0).getTime() - new Date(b[sortBy as keyof Campaign] as string || 0).getTime()
        : new Date(b[sortBy as keyof Campaign] as string || 0).getTime() - new Date(a[sortBy as keyof Campaign] as string || 0).getTime()
    }
    // Para grupos (cantidad)
    if (sortBy === "groups") {
      return sortDir === "asc"
        ? (a.groups?.length || 0) - (b.groups?.length || 0)
        : (b.groups?.length || 0) - (a.groups?.length || 0)
    }
    return 0
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Header title="Campañas" description="Gestiona tus campañas de email marketing" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Header title="Campañas" description="Gestiona tus campañas de email marketing" />
        <div className="flex space-x-2">
          <Button onClick={handleNewCampaign}>
            <Plus className="mr-2 h-4 w-4" />
            Nueva Campaña
          </Button>
          <Button
            variant={viewMode === "cards" ? "default" : "outline"}
            size="icon"
            onClick={() => setViewMode("cards")}
            aria-label="Vista de tarjetas"
          >
            <LayoutGrid className="h-5 w-5" />
          </Button>
          <Button
            variant={viewMode === "table" ? "default" : "outline"}
            size="icon"
            onClick={() => setViewMode("table")}
            aria-label="Vista de tabla"
          >
            <List className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {viewMode === "cards" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedCampaigns.map((campaign) => {
            const metrics = metricsMap[campaign.id]
            return (
              <Card key={campaign.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{campaign.name}</CardTitle>
                    <Badge className={getStatusColor(campaign.status)}>{getStatusText(campaign.status)}</Badge>
                  </div>
                  <p className="text-sm text-gray-600">{campaign.subject}</p>
                  {/* Métricas */}
                  <div className="mt-2 flex flex-wrap gap-2 text-xs">
                    <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded">Apertura: {metrics ? `${metrics.open_rate.toFixed(1)}%` : "—"}</span>
                    <span className="bg-green-50 text-green-700 px-2 py-1 rounded">Clics: {metrics ? `${metrics.click_rate.toFixed(1)}%` : "—"}</span>
                    <span className="bg-red-50 text-red-700 px-2 py-1 rounded">Rebote: {metrics ? `${metrics.bounce_rate.toFixed(1)}%` : "—"}</span>
                    <span className="bg-gray-50 text-gray-700 px-2 py-1 rounded">Unsuscritos: {metrics ? metrics.unsubscribed : "—"}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-sm text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="mr-2 h-4 w-4" />
                        Creada: {new Date(campaign.created_at).toLocaleDateString()}
                      </div>
                      {campaign.sent_at && (
                        <div className="flex items-center mt-1">
                          <Send className="mr-2 h-4 w-4" />
                          Enviada: {new Date(campaign.sent_at).toLocaleDateString()}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">{campaign.groups?.length || 0} grupos</span>
                      <div className="flex space-x-1">
                        {/* Send button - only for scheduled campaigns */}
                        {campaign.status === "scheduled" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleForceSend(campaign)}
                            title="Enviar ahora"
                          >
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                        )}

                        {/* Pause/Play button - for scheduled and paused campaigns */}
                        {(campaign.status === "scheduled" || campaign.status === "paused") && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleTogglePause(campaign)}
                            disabled={pausingCampaign === campaign.id}
                            title={campaign.status === "paused" ? "Reanudar campaña" : "Pausar campaña"}
                          >
                            {pausingCampaign === campaign.id ? (
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
                            ) : campaign.status === "paused" ? (
                              <Play className="h-4 w-4" />
                            ) : (
                              <Pause className="h-4 w-4" />
                            )}
                          </Button>
                        )}

                        {/* Send button - for draft campaigns */}
                        {campaign.status === "draft" && (
                          <Button variant="outline" size="sm" onClick={() => handleSend(campaign)}>
                            <Send className="h-4 w-4" />
                          </Button>
                        )}

                        <Button variant="outline" size="sm" onClick={() => handleEdit(campaign)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDelete(campaign.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer select-none" onClick={() => handleSort("name")}>Nombre {sortBy === "name" && (sortDir === "asc" ? <ChevronUp className="inline h-4 w-4" /> : <ChevronDown className="inline h-4 w-4" />)}</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer select-none" onClick={() => handleSort("subject")}>Asunto {sortBy === "subject" && (sortDir === "asc" ? <ChevronUp className="inline h-4 w-4" /> : <ChevronDown className="inline h-4 w-4" />)}</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer select-none" onClick={() => handleSort("groups")}>Grupos {sortBy === "groups" && (sortDir === "asc" ? <ChevronUp className="inline h-4 w-4" /> : <ChevronDown className="inline h-4 w-4" />)}</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer select-none" onClick={() => handleSort("status")}>Estado {sortBy === "status" && (sortDir === "asc" ? <ChevronUp className="inline h-4 w-4" /> : <ChevronDown className="inline h-4 w-4" />)}</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer select-none" onClick={() => handleSort("created_at")}>Creada {sortBy === "created_at" && (sortDir === "asc" ? <ChevronUp className="inline h-4 w-4" /> : <ChevronDown className="inline h-4 w-4" />)}</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer select-none" onClick={() => handleSort("sent_at")}>Enviada {sortBy === "sent_at" && (sortDir === "asc" ? <ChevronUp className="inline h-4 w-4" /> : <ChevronDown className="inline h-4 w-4" />)}</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {sortedCampaigns.map((campaign) => (
                <tr key={campaign.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 whitespace-nowrap">{campaign.name}</td>
                  <td className="px-4 py-2 whitespace-nowrap">{campaign.subject}</td>
                  <td className="px-4 py-2 whitespace-nowrap">{campaign.groups?.length || 0}</td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(campaign.status)}`}>{getStatusText(campaign.status)}</span>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-500">{new Date(campaign.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-500">{campaign.sent_at ? new Date(campaign.sent_at).toLocaleDateString() : '-'}</td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <div className="flex space-x-1">
                      {/* Send button - only for scheduled campaigns */}
                      {campaign.status === "scheduled" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleForceSend(campaign)}
                          title="Enviar ahora"
                        >
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                      )}
                      {/* Pause/Play button - for scheduled and paused campaigns */}
                      {(campaign.status === "scheduled" || campaign.status === "paused") && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleTogglePause(campaign)}
                          disabled={pausingCampaign === campaign.id}
                          title={campaign.status === "paused" ? "Reanudar campaña" : "Pausar campaña"}
                        >
                          {pausingCampaign === campaign.id ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
                          ) : campaign.status === "paused" ? (
                            <Play className="h-4 w-4" />
                          ) : (
                            <Pause className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                      {/* Send button - for draft campaigns */}
                      {campaign.status === "draft" && (
                        <Button variant="outline" size="sm" onClick={() => handleSend(campaign)}>
                          <Send className="h-4 w-4" />
                        </Button>
                      )}
                      <Button variant="outline" size="sm" onClick={() => handleEdit(campaign)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDelete(campaign.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {campaigns.length === 0 && (
        <div className="text-center py-12">
          <Mail className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No hay campañas</h3>
          <p className="mt-1 text-sm text-gray-500">Comienza creando tu primera campaña de email marketing.</p>
          <div className="mt-6">
            <Button onClick={handleNewCampaign}>
              <Plus className="mr-2 h-4 w-4" />
              Nueva Campaña
            </Button>
          </div>
        </div>
      )}

      <CampaignFormModal open={showCampaignModal} onOpenChange={setShowCampaignModal} campaign={selectedCampaign} />

      {campaignToSend && (
        <SendCampaignModal
          open={showSendModal}
          onOpenChange={setShowSendModal}
          campaign={campaignToSend}
          onCampaignSent={loadCampaigns}
        />
      )}
    </div>
  )
}
