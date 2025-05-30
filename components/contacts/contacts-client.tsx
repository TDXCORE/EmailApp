"use client"

import { useEffect, useState } from "react"
import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ContactFormModal } from "@/components/contacts/contact-form-modal"
import { ImportContactsModal } from "@/components/contacts/import-contacts-modal"
import { getContacts, deleteContact } from "@/lib/api"
import { useAppStore } from "@/lib/store"
import type { Contact } from "@/lib/types"
import { Plus, Edit, Trash2, Search, Upload, Mail, Phone, Users, List, LayoutGrid, ChevronUp, ChevronDown } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"

export function ContactsClient() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedContact, setSelectedContact] = useState<Contact | undefined>()
  const [showContactModal, setShowContactModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [viewMode, setViewMode] = useState<'cards' | 'table'>("cards")
  const [sortBy, setSortBy] = useState<string>("created_at")
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>("desc")
  const { contacts, setContacts, removeContact, isLoading, setIsLoading } = useAppStore()
  const { toast } = useToast()

  useEffect(() => {
    loadContacts()
  }, [])

  const loadContacts = async () => {
    setIsLoading(true)
    try {
      const data = await getContacts()
      setContacts(data)
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los contactos",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = (contact: Contact) => {
    setSelectedContact(contact)
    setShowContactModal(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm("¿Estás seguro de que quieres eliminar este contacto?")) {
      try {
        await deleteContact(id)
        removeContact(id)
        toast({
          title: "Éxito",
          description: "Contacto eliminado correctamente",
        })
      } catch (error) {
        toast({
          title: "Error",
          description: "No se pudo eliminar el contacto",
          variant: "destructive",
        })
      }
    }
  }

  const handleNewContact = () => {
    setSelectedContact(undefined)
    setShowContactModal(true)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "unsubscribed":
        return "bg-yellow-100 text-yellow-800"
      case "bounced":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "active":
        return "Activo"
      case "unsubscribed":
        return "Desuscrito"
      case "bounced":
        return "Rebotado"
      default:
        return status
    }
  }

  const filteredContacts = contacts.filter(
    (contact) =>
      contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.last_name?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortDir(sortDir === "asc" ? "desc" : "asc")
    } else {
      setSortBy(column)
      setSortDir("asc")
    }
  }

  const sortedContacts = [...filteredContacts].sort((a, b) => {
    let aValue = a[sortBy as keyof Contact]
    let bValue = b[sortBy as keyof Contact]
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
        <Header title="Contactos" description="Gestiona tu lista de contactos" />
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
        <Header title="Contactos" description="Gestiona tu lista de contactos" />
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => setShowImportModal(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Importar
          </Button>
          <Button onClick={handleNewContact}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Contacto
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
            placeholder="Buscar contactos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="text-sm text-gray-500">
          {filteredContacts.length} de {contacts.length} contactos
        </div>
      </div>

      {viewMode === "cards" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedContacts.map((contact) => (
            <Card key={contact.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    {contact.first_name} {contact.last_name}
                  </CardTitle>
                  <Badge className={getStatusColor(contact.status)}>{getStatusText(contact.status)}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center text-sm text-gray-600">
                    <Mail className="mr-2 h-4 w-4" />
                    {contact.email}
                  </div>

                  {contact.phone && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Phone className="mr-2 h-4 w-4" />
                      {contact.phone}
                    </div>
                  )}

                  <div className="flex items-center text-sm text-gray-600">
                    <Users className="mr-2 h-4 w-4" />
                    {contact.groups?.length || 0} grupos
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs text-gray-500">{new Date(contact.created_at).toLocaleDateString()}</span>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(contact)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDelete(contact.id)}>
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
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer select-none" onClick={() => handleSort("first_name")}>Nombre {sortBy === "first_name" && (sortDir === "asc" ? <ChevronUp className="inline h-4 w-4" /> : <ChevronDown className="inline h-4 w-4" />)}</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer select-none" onClick={() => handleSort("email")}>Email {sortBy === "email" && (sortDir === "asc" ? <ChevronUp className="inline h-4 w-4" /> : <ChevronDown className="inline h-4 w-4" />)}</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer select-none" onClick={() => handleSort("phone")}>Teléfono {sortBy === "phone" && (sortDir === "asc" ? <ChevronUp className="inline h-4 w-4" /> : <ChevronDown className="inline h-4 w-4" />)}</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer select-none" onClick={() => handleSort("groups")}>Grupos {sortBy === "groups" && (sortDir === "asc" ? <ChevronUp className="inline h-4 w-4" /> : <ChevronDown className="inline h-4 w-4" />)}</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer select-none" onClick={() => handleSort("status")}>Estado {sortBy === "status" && (sortDir === "asc" ? <ChevronUp className="inline h-4 w-4" /> : <ChevronDown className="inline h-4 w-4" />)}</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer select-none" onClick={() => handleSort("created_at")}>Creado {sortBy === "created_at" && (sortDir === "asc" ? <ChevronUp className="inline h-4 w-4" /> : <ChevronDown className="inline h-4 w-4" />)}</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {sortedContacts.map((contact) => (
                <tr key={contact.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 whitespace-nowrap">{contact.first_name} {contact.last_name}</td>
                  <td className="px-4 py-2 whitespace-nowrap">{contact.email}</td>
                  <td className="px-4 py-2 whitespace-nowrap">{contact.phone || '-'}</td>
                  <td className="px-4 py-2 whitespace-nowrap">{contact.groups?.length || 0}</td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(contact.status)}`}>{getStatusText(contact.status)}</span>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-500">{new Date(contact.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(contact)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDelete(contact.id)}>
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

      {filteredContacts.length === 0 && (
        <div className="text-center py-12">
          <Users className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            {searchTerm ? "No se encontraron contactos" : "No hay contactos"}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm
              ? "Intenta con otros términos de búsqueda"
              : "Comienza agregando tu primer contacto o importando una lista."}
          </p>
          {!searchTerm && (
            <div className="mt-6 flex justify-center space-x-2">
              <Button onClick={handleNewContact}>
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Contacto
              </Button>
              <Button variant="outline" onClick={() => setShowImportModal(true)}>
                <Upload className="mr-2 h-4 w-4" />
                Importar Contactos
              </Button>
            </div>
          )}
        </div>
      )}

      <ContactFormModal open={showContactModal} onOpenChange={setShowContactModal} contact={selectedContact} />

      <ImportContactsModal open={showImportModal} onOpenChange={setShowImportModal} />
    </div>
  )
}
