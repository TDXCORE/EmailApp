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
import { configSchema, type ConfigFormData } from "@/lib/validations"
import { createConfig, updateConfig } from "@/lib/api"
import { useAppStore } from "@/lib/store"
import { useToast } from "@/hooks/use-toast"
import type { Config } from "@/lib/types"
import { Loader2, Eye, EyeOff } from "lucide-react"

interface ConfigFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  config?: Config
}

export function ConfigFormModal({ open, onOpenChange, config }: ConfigFormModalProps) {
  const [loading, setLoading] = useState(false)
  const [showValue, setShowValue] = useState(false)
  const { addConfig, updateConfig: updateConfigStore } = useAppStore()
  const { toast } = useToast()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ConfigFormData>({
    resolver: zodResolver(configSchema),
  })

  useEffect(() => {
    if (open) {
      if (config) {
        reset({
          key: config.key,
          value: config.value,
          description: config.description || "",
        })
      } else {
        reset({
          key: "",
          value: "",
          description: "",
        })
      }
    }
  }, [open, config, reset])

  const onSubmit = async (data: ConfigFormData) => {
    setLoading(true)
    try {
      if (config) {
        const updated = await updateConfig(config.id, data)
        updateConfigStore(config.id, updated)
        toast({
          title: "Éxito",
          description: "Configuración actualizada correctamente",
        })
      } else {
        const newConfig = await createConfig({
          ...data,
          user_id: "", // Will be set by RLS
        })
        addConfig(newConfig)
        toast({
          title: "Éxito",
          description: "Configuración creada correctamente",
        })
      }
      onOpenChange(false)
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo guardar la configuración",
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
          <DialogTitle>{config ? "Editar Configuración" : "Nueva Configuración"}</DialogTitle>
          <DialogDescription>
            {config ? "Modifica la configuración" : "Agrega una nueva variable de configuración"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="key">Clave</Label>
            <Input
              id="key"
              {...register("key")}
              placeholder="Ej: AWS_SES_ACCESS_KEY"
              disabled={!!config} // No permitir editar la clave si ya existe
            />
            {errors.key && <p className="text-sm text-red-600">{errors.key.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="value">Valor</Label>
            <div className="relative">
              <Input
                id="value"
                type={showValue ? "text" : "password"}
                {...register("value")}
                placeholder="Valor de la configuración"
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowValue(!showValue)}
              >
                {showValue ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            {errors.value && <p className="text-sm text-red-600">{errors.value.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción (opcional)</Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="Describe para qué se usa esta configuración..."
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
              {config ? "Actualizar" : "Crear"} Configuración
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
