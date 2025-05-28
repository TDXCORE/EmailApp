"use client"

import { useEffect, useState } from "react"
import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { GroupFormModal } from "@/components/groups/group-form-modal"
import { getGroups, deleteGroup } from "@/lib/api"
import { useAppStore } from "@/lib/store"
import type { Group } from "@/lib/types"
import { Plus, Edit, Trash2, Search, FolderOpen, Users } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"

export function GroupsClient() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedGroup, setSelectedGroup] = useState<Group | undefined>()
  const [showGroupModal, setShowGroupModal] = useState(false)
  const { groups, setGroups, removeGroup, isLoading, setIsLoading } = useAppStore()
  const { toast } = useToast()

  useEffect(() => {
    loadGroups()
  }, [])

  const loadGroups = async () => {
    setIsLoading(true)
    try {
      const data = await getGroups()
      setGroups(data)
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los grupos",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = (group: Group) => {
    setSelectedGroup(group)
    setShowGroupModal(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm("¿Estás seguro de que quieres eliminar este grupo?")) {
      try {
        await deleteGroup(id)
        removeGroup(id)
        toast({
          title: "Éxito",
          description: "Grupo eliminado correctamente",
        })
      } catch (error) {
        toast({
          title: "Error",
          description: "No se pudo eliminar el grupo",
          variant: "destructive",
        })
      }
    }
  }

  const handleNewGroup = () => {
    setSelectedGroup(undefined)
    setShowGroupModal(true)
  }

  const filteredGroups = groups.filter(
    (group) =>
      group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      group.description?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Header title="Grupos" description="Organiza tus contactos en grupos" />
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
        <Header title="Grupos" description="Organiza tus contactos en grupos" />
        <Button onClick={handleNewGroup}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Grupo
        </Button>
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Buscar grupos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="text-sm text-gray-500">
          {filteredGroups.length} de {groups.length} grupos
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredGroups.map((group) => (
          <Card key={group.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <FolderOpen className="mr-2 h-5 w-5 text-teal-600" />
                {group.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {group.description && <p className="text-sm text-gray-600">{group.description}</p>}

                <div className="flex items-center text-sm text-gray-600">
                  <Users className="mr-2 h-4 w-4" />
                  {(typeof group.contact_count === "object" && group.contact_count !== null
                    ? group.contact_count.count
                    : group.contact_count || 0)} contactos
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-gray-500">{new Date(group.created_at).toLocaleDateString()}</span>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(group)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(group.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredGroups.length === 0 && (
        <div className="text-center py-12">
          <FolderOpen className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            {searchTerm ? "No se encontraron grupos" : "No hay grupos"}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm
              ? "Intenta con otros términos de búsqueda"
              : "Comienza creando tu primer grupo para organizar tus contactos."}
          </p>
          {!searchTerm && (
            <div className="mt-6">
              <Button onClick={handleNewGroup}>
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Grupo
              </Button>
            </div>
          )}
        </div>
      )}

      <GroupFormModal open={showGroupModal} onOpenChange={setShowGroupModal} group={selectedGroup} />
    </div>
  )
}
