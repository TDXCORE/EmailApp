"use client"

import { useEffect, useState } from "react"
import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getCampaigns, deleteCampaign, updateCampaign } from "@/lib/api"
import { useAppStore } from "@/lib/store"
import type { Campaign } from "@/lib/types"
import { Plus, Edit, Trash2, Calendar, Send, Mail, Play, Pause, MessageSquare } from "lucide-react"
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

  useEffect(() => {
    loadCampaigns()
  }, [])

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
        <Button onClick={handleNewCampaign}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Campaña
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {campaigns.map((campaign) => (
          <Card key={campaign.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{campaign.name}</CardTitle>
                <Badge className={getStatusColor(campaign.status)}>{getStatusText(campaign.status)}</Badge>
              </div>
              <p className="text-sm text-gray-600">{campaign.subject}</p>
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
        ))}
      </div>

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
