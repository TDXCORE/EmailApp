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
import { contactSchema, type ContactFormData } from "@/lib/validations"
import { createContact, updateContact, getGroups, addContactToGroup, removeContactFromGroup } from "@/lib/api"
import { useAppStore } from "@/lib/store"
import { useToast } from "@/hooks/use-toast"
import type { Contact, Group } from "@/lib/types"
import { Loader2 } from "lucide-react"

interface ContactFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  contact?: Contact
}

export function ContactFormModal({ open, onOpenChange, contact }: ContactFormModalProps) {
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(false)
  const { addContact, updateContact: updateContactStore } = useAppStore()
  const { toast } = useToast()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      status: "active",
      groups: [],
    },
  })

  const selectedGroups = watch("groups") || []

  useEffect(() => {
    if (open) {
      loadGroups()
      if (contact) {
        reset({
          email: contact.email,
          first_name: contact.first_name || "",
          last_name: contact.last_name || "",
          phone: contact.phone || "",
          status: contact.status,
          groups: contact.groups?.map((g) => g.id) || [],
        })
      } else {
        reset({
          email: "",
          first_name: "",
          last_name: "",
          phone: "",
          status: "active",
          groups: [],
        })
      }
    }
  }, [open, contact, reset])

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

  const onSubmit = async (data: ContactFormData) => {
    setLoading(true)
    try {
      let savedContact: Contact

      if (contact) {
        savedContact = await updateContact(contact.id, {
          email: data.email,
          first_name: data.first_name,
          last_name: data.last_name,
          phone: data.phone,
          status: data.status,
        })
        updateContactStore(contact.id, savedContact)

        // Update contact-group relationships
        const currentGroups = contact.groups?.map((g) => g.id) || []
        const newGroups = data.groups || []

        // Remove old relationships
        for (const groupId of currentGroups) {
          if (!newGroups.includes(groupId)) {
            await removeContactFromGroup(contact.id, groupId)
          }
        }

        // Add new relationships
        for (const groupId of newGroups) {
          if (!currentGroups.includes(groupId)) {
            await addContactToGroup(contact.id, groupId)
          }
        }

        toast({
          title: "Éxito",
          description: "Contacto actualizado correctamente",
        })
      } else {
        savedContact = await createContact({
          email: data.email,
          first_name: data.first_name,
          last_name: data.last_name,
          phone: data.phone,
          status: data.status,
        })

        // Add contact-group relationships
        for (const groupId of data.groups || []) {
          await addContactToGroup(savedContact.id, groupId)
        }

        addContact(savedContact)
        toast({
          title: "Éxito",
          description: "Contacto creado correctamente",
        })
      }
      onOpenChange(false)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo guardar el contacto",
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
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{contact ? "Editar Contacto" : "Nuevo Contacto"}</DialogTitle>
          <DialogDescription>
            {contact ? "Modifica los datos del contacto" : "Agrega un nuevo contacto a tu lista"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">Nombre</Label>
              <Input id="first_name" {...register("first_name")} placeholder="Juan" />
              {errors.first_name && <p className="text-sm text-red-600">{errors.first_name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="last_name">Apellido</Label>
              <Input id="last_name" {...register("last_name")} placeholder="Pérez" />
              {errors.last_name && <p className="text-sm text-red-600">{errors.last_name.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...register("email")} placeholder="juan@ejemplo.com" />
            {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono (opcional)</Label>
              <Input id="phone" {...register("phone")} placeholder="+1234567890" />
              {errors.phone && <p className="text-sm text-red-600">{errors.phone.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Estado</Label>
              <Select onValueChange={(value) => setValue("status", value as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Activo</SelectItem>
                  <SelectItem value="unsubscribed">Desuscrito</SelectItem>
                  <SelectItem value="bounced">Rebotado</SelectItem>
                </SelectContent>
              </Select>
              {errors.status && <p className="text-sm text-red-600">{errors.status.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Grupos</Label>
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
              {contact ? "Actualizar" : "Crear"} Contacto
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
