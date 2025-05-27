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
import { Textarea } from "@/components/ui/textarea"
import { groupSchema, type GroupFormData } from "@/lib/validations"
import { createGroup, updateGroup } from "@/lib/api"
import { useAppStore } from "@/lib/store"
import { useToast } from "@/hooks/use-toast"
import type { Group } from "@/lib/types"
import { Loader2 } from "lucide-react"

interface GroupFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  group?: Group
}

export function GroupFormModal({ open, onOpenChange, group }: GroupFormModalProps) {
  const [loading, setLoading] = useState(false)
  const { addGroup, updateGroup: updateGroupStore } = useAppStore()
  const { toast } = useToast()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<GroupFormData>({
    resolver: zodResolver(groupSchema),
  })

  useEffect(() => {
    if (open) {
      if (group) {
        reset({
          name: group.name,
          description: group.description || "",
        })
      } else {
        reset({
          name: "",
          description: "",
        })
      }
    }
  }, [open, group, reset])

  const onSubmit = async (data: GroupFormData) => {
    setLoading(true)
    try {
      if (group) {
        const updated = await updateGroup(group.id, data)
        updateGroupStore(group.id, updated)
        toast({
          title: "Éxito",
          description: "Grupo actualizado correctamente",
        })
      } else {
        const newGroup = await createGroup({
          ...data,
          user_id: "", // Will be set by RLS
        })
        addGroup(newGroup)
        toast({
          title: "Éxito",
          description: "Grupo creado correctamente",
        })
      }
      onOpenChange(false)
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo guardar el grupo",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{group ? "Editar Grupo" : "Nuevo Grupo"}</DialogTitle>
          <DialogDescription>
            {group ? "Modifica los datos del grupo" : "Crea un nuevo grupo de contactos"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre del grupo</Label>
            <Input id="name" {...register("name")} placeholder="Ej: Clientes VIP" />
            {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción (opcional)</Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="Describe el propósito de este grupo..."
              rows={3}
            />
            {errors.description && <p className="text-sm text-red-600">{errors.description.message}</p>}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {group ? "Actualizar" : "Crear"} Grupo
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
