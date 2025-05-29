"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { RichTextEditor } from "@/components/editor/rich-text-editor"
import { campaignSchema, type CampaignFormData } from "@/lib/validations"
import { createCampaign, updateCampaign, getGroups, addCampaignToGroup, removeCampaignFromGroup } from "@/lib/api"
import { useAppStore } from "@/lib/store"
import { useToast } from "@/hooks/use-toast"
import type { Campaign, Group } from "@/lib/types"
import { Loader2 } from "lucide-react"

interface CampaignFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  campaign?: Campaign
}

export function CampaignFormModal({ open, onOpenChange, campaign }: CampaignFormModalProps) {
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(false)
  const [content, setContent] = useState("")
  const { addCampaign, updateCampaign: updateCampaignStore } = useAppStore()
  const { toast } = useToast()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<CampaignFormData>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      status: "draft",
      groups: [],
    },
  })

  const selectedGroups = watch("groups") || []

  useEffect(() => {
    if (open) {
      loadGroups()
      if (campaign) {
        setContent(campaign.content)
        reset({
          name: campaign.name,
          subject: campaign.subject,
          content: campaign.content,
          status: campaign.status,
          scheduled_at: campaign.scheduled_at || "",
          groups: campaign.groups?.map((g) => g.id) || [],
        })
      } else {
        setContent("")
        reset({
          name: "",
          subject: "",
          content: "",
          status: "draft",
          scheduled_at: "",
          groups: [],
        })
      }
    }
  }, [open, campaign, reset])

  const loadGroups = async () => {
    try {
      const data = await getGroups()
      setGroups(data)
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los grupos",
        variant: "destructive",
      })
    }
  }

  const handleContentChange = (newContent: string) => {
    setContent(newContent)
    setValue("content", newContent)
  }

  const onSubmit = async (data: CampaignFormData) => {
    setLoading(true)
    try {
      let savedCampaign: Campaign

      const campaignData = {
        ...data,
        content: content, // Use the rich text editor content
      }

      if (campaign) {
        savedCampaign = await updateCampaign(campaign.id, {
          name: campaignData.name,
          subject: campaignData.subject,
          content: campaignData.content,
          status: campaignData.status,
          scheduled_at: campaignData.scheduled_at || null,
        })
        updateCampaignStore(campaign.id, savedCampaign)

        // Update campaign-group relationships
        const currentGroups = campaign.groups?.map((g) => g.id) || []
        const newGroups = campaignData.groups

        // Remove old relationships
        for (const groupId of currentGroups) {
          if (!newGroups.includes(groupId)) {
            await removeCampaignFromGroup(campaign.id, groupId)
          }
        }

        // Add new relationships
        for (const groupId of newGroups) {
          if (!currentGroups.includes(groupId)) {
            await addCampaignToGroup(campaign.id, groupId)
          }
        }

        toast({
          title: "Éxito",
          description: "Campaña actualizada correctamente",
        })
      } else {
        savedCampaign = await createCampaign({
          name: campaignData.name,
          subject: campaignData.subject,
          content: campaignData.content,
          status: campaignData.status,
          scheduled_at: campaignData.scheduled_at || null,
        })

        // Add campaign-group relationships
        for (const groupId of campaignData.groups) {
          await addCampaignToGroup(savedCampaign.id, groupId)
        }

        addCampaign(savedCampaign)
        toast({
          title: "Éxito",
          description: "Campaña creada correctamente",
        })
      }
      onOpenChange(false)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo guardar la campaña",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleGroupChange = (groupId: string, checked: boolean) => {
    const current = selectedGroups || []
    if (checked) {
      setValue("groups", [...current, groupId])
    } else {
      setValue(
        "groups",
        current.filter((id) => id !== groupId),
      )
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{campaign ? "Editar Campaña" : "Nueva Campaña"}</DialogTitle>
          <DialogDescription>
            {campaign ? "Modifica los datos de la campaña" : "Crea una nueva campaña de email marketing"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre de la campaña</Label>
              <Input id="name" {...register("name")} placeholder="Ej: Newsletter Enero 2024" />
              {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Estado</Label>
              <Select onValueChange={(value) => setValue("status", value as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Borrador</SelectItem>
                  <SelectItem value="scheduled">Programada</SelectItem>
                  <SelectItem value="paused">Pausada</SelectItem>
                </SelectContent>
              </Select>
              {errors.status && <p className="text-sm text-red-600">{errors.status.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Asunto del email</Label>
            <Input id="subject" {...register("subject")} placeholder="Ej: ¡Ofertas especiales solo para ti!" />
            {errors.subject && <p className="text-sm text-red-600">{errors.subject.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="scheduled_at">Fecha programada (opcional)</Label>
            <Input id="scheduled_at" type="datetime-local" {...register("scheduled_at")} />
            {errors.scheduled_at && <p className="text-sm text-red-600">{errors.scheduled_at.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Contenido del email</Label>
            <RichTextEditor
              value={content}
              onChange={handleContentChange}
              placeholder="Escribe el contenido de tu email aquí..."
            />
            {errors.content && <p className="text-sm text-red-600">{errors.content.message}</p>}
            <p className="text-xs text-gray-500">
              Nota: Se agregará automáticamente un enlace de desuscripción al final del email.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Grupos de contactos</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-32 overflow-y-auto border rounded-md p-3">
              {groups.map((group) => (
                <div key={group.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={group.id}
                    checked={selectedGroups.includes(group.id)}
                    onCheckedChange={(checked) => handleGroupChange(group.id, checked as boolean)}
                  />
                  <Label htmlFor={group.id} className="text-sm">
                    {group.name}
                  </Label>
                </div>
              ))}
            </div>
            {errors.groups && <p className="text-sm text-red-600">{errors.groups.message}</p>}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {campaign ? "Actualizar" : "Crear"} Campaña
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
