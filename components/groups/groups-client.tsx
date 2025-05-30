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
import { Plus, Edit, Trash2, Search, FolderOpen, Users, List, LayoutGrid, ChevronUp, ChevronDown } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"

export function GroupsClient() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedGroup, setSelectedGroup] = useState<Group | undefined>()
  const [showGroupModal, setShowGroupModal] = useState(false)
  const { groups, setGroups, removeGroup, isLoading, setIsLoading } = useAppStore()
  const { toast } = useToast()
  const [viewMode, setViewMode] = useState<'cards' | 'table'>("cards")
  const [sortBy, setSortBy] = useState<string>("created_at")
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>("desc")

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

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortDir(sortDir === "asc" ? "desc" : "asc")
    } else {
      setSortBy(column)
      setSortDir("asc")
    }
  }

  const sortedGroups = [...filteredGroups].sort((a, b) => {
    let aValue = a[sortBy as keyof Group]
    let bValue = b[sortBy as keyof Group]
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
    if (sortBy === "created_at") {
      return sortDir === "asc"
        ? new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        : new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    }
    // Para contactos (cantidad)
    if (sortBy === "contact_count") {
      return sortDir === "asc"
        ? (a.contact_count || 0) - (b.contact_count || 0)
        : (b.contact_count || 0) - (a.contact_count || 0)
    }
    return 0
  })

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
        <div className="flex space-x-2">
          <Button onClick={handleNewGroup}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Grupo
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

      {viewMode === "cards" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedGroups.map((group) => (
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
                    {typeof group.contact_count === "object" ? 0 : group.contact_count || 0} contactos
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
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer select-none" onClick={() => handleSort("name")}>Nombre {sortBy === "name" && (sortDir === "asc" ? <ChevronUp className="inline h-4 w-4" /> : <ChevronDown className="inline h-4 w-4" />)}</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer select-none" onClick={() => handleSort("description")}>Descripción {sortBy === "description" && (sortDir === "asc" ? <ChevronUp className="inline h-4 w-4" /> : <ChevronDown className="inline h-4 w-4" />)}</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer select-none" onClick={() => handleSort("contact_count")}>Contactos {sortBy === "contact_count" && (sortDir === "asc" ? <ChevronUp className="inline h-4 w-4" /> : <ChevronDown className="inline h-4 w-4" />)}</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer select-none" onClick={() => handleSort("created_at")}>Creado {sortBy === "created_at" && (sortDir === "asc" ? <ChevronUp className="inline h-4 w-4" /> : <ChevronDown className="inline h-4 w-4" />)}</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {sortedGroups.map((group) => (
                <tr key={group.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 whitespace-nowrap flex items-center"><FolderOpen className="mr-2 h-5 w-5 text-teal-600" />{group.name}</td>
                  <td className="px-4 py-2 whitespace-nowrap">{group.description || '-'}</td>
                  <td className="px-4 py-2 whitespace-nowrap">{typeof group.contact_count === "object" ? 0 : group.contact_count || 0}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-500">{new Date(group.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(group)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDelete(group.id)}>
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
