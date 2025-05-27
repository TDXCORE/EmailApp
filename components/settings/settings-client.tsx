"use client"

import { useEffect, useState } from "react"
import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ConfigFormModal } from "@/components/settings/config-form-modal"
import { getConfigs, deleteConfig } from "@/lib/api"
import { useAppStore } from "@/lib/store"
import type { Config } from "@/lib/types"
import { Plus, Edit, Trash2, Search, Settings, Key, Eye, EyeOff } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function SettingsClient() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedConfig, setSelectedConfig] = useState<Config | undefined>()
  const [showConfigModal, setShowConfigModal] = useState(false)
  const [visibleValues, setVisibleValues] = useState<Set<string>>(new Set())
  const { configs, setConfigs, removeConfig, isLoading, setIsLoading } = useAppStore()
  const { toast } = useToast()

  useEffect(() => {
    loadConfigs()
  }, [])

  const loadConfigs = async () => {
    setIsLoading(true)
    try {
      const data = await getConfigs()
      setConfigs(data)
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar las configuraciones",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = (config: Config) => {
    setSelectedConfig(config)
    setShowConfigModal(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm("¿Estás seguro de que quieres eliminar esta configuración?")) {
      try {
        await deleteConfig(id)
        removeConfig(id)
        toast({
          title: "Éxito",
          description: "Configuración eliminada correctamente",
        })
      } catch (error) {
        toast({
          title: "Error",
          description: "No se pudo eliminar la configuración",
          variant: "destructive",
        })
      }
    }
  }

  const handleNewConfig = () => {
    setSelectedConfig(undefined)
    setShowConfigModal(true)
  }

  const toggleValueVisibility = (configId: string) => {
    const newVisible = new Set(visibleValues)
    if (newVisible.has(configId)) {
      newVisible.delete(configId)
    } else {
      newVisible.add(configId)
    }
    setVisibleValues(newVisible)
  }

  const maskValue = (value: string) => {
    return "*".repeat(Math.min(value.length, 20))
  }

  const filteredConfigs = configs.filter(
    (config) =>
      config.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
      config.description?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Header title="Configuración" description="Gestiona las variables de entorno y configuraciones" />
        <div className="grid grid-cols-1 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Header title="Configuración" description="Gestiona las variables de entorno y configuraciones" />
        <Button onClick={handleNewConfig}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Configuración
        </Button>
      </div>

      <Alert>
        <Settings className="h-4 w-4" />
        <AlertDescription>
          <strong>Configuraciones comunes:</strong> AWS_SES_ACCESS_KEY, AWS_SES_SECRET_KEY, AWS_SES_REGION, SMTP_HOST,
          SMTP_PORT, SMTP_USER, SMTP_PASSWORD
        </AlertDescription>
      </Alert>

      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Buscar configuraciones..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="text-sm text-gray-500">
          {filteredConfigs.length} de {configs.length} configuraciones
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredConfigs.map((config) => (
          <Card key={config.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center">
                  <Key className="mr-2 h-5 w-5 text-teal-600" />
                  {config.key}
                </CardTitle>
                <Badge variant="outline">Configuración</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {config.description && <p className="text-sm text-gray-600">{config.description}</p>}

                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">Valor:</span>
                  <code className="text-sm bg-gray-100 px-2 py-1 rounded flex-1">
                    {visibleValues.has(config.id) ? config.value : maskValue(config.value)}
                  </code>
                  <Button variant="ghost" size="sm" onClick={() => toggleValueVisibility(config.id)}>
                    {visibleValues.has(config.id) ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-gray-500">
                    Actualizada: {new Date(config.updated_at).toLocaleDateString()}
                  </span>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(config)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(config.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredConfigs.length === 0 && (
        <div className="text-center py-12">
          <Settings className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            {searchTerm ? "No se encontraron configuraciones" : "No hay configuraciones"}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm
              ? "Intenta con otros términos de búsqueda"
              : "Comienza agregando las configuraciones necesarias para Amazon SES y otros servicios."}
          </p>
          {!searchTerm && (
            <div className="mt-6">
              <Button onClick={handleNewConfig}>
                <Plus className="mr-2 h-4 w-4" />
                Nueva Configuración
              </Button>
            </div>
          )}
        </div>
      )}

      <ConfigFormModal open={showConfigModal} onOpenChange={setShowConfigModal} config={selectedConfig} />
    </div>
  )
}
