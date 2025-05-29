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
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { contactSchema } from "@/lib/validations"
import { createContact, getGroups, addContactToGroup } from "@/lib/api"
import { useAppStore } from "@/lib/store"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Upload, FileText } from "lucide-react"
import { z } from "zod"

interface ImportContactsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const importSchema = z.object({
  csvData: z.string().min(1, "Ingresa los datos CSV"),
})

export function ImportContactsModal({ open, onOpenChange }: ImportContactsModalProps) {
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState<any[]>([])
  const [groups, setGroups] = useState<any[]>([])
  const [selectedGroups, setSelectedGroups] = useState<string[]>([])
  const { addContact } = useAppStore()
  const { toast } = useToast()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm({
    resolver: zodResolver(importSchema),
  })

  const csvData = watch("csvData")

  const parseCsvData = (csv: string) => {
    const lines = csv.trim().split("\n")
    if (lines.length < 2) return []

    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase())
    const contacts = []

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v) => v.trim())
      const contact: any = {}

      headers.forEach((header, index) => {
        const value = values[index] || ""
        switch (header) {
          case "email":
          case "correo":
            contact.email = value
            break
          case "first_name":
          case "nombre":
            contact.first_name = value
            break
          case "last_name":
          case "apellido":
            contact.last_name = value
            break
          case "phone":
          case "telefono":
          case "teléfono":
            contact.phone = value
            break
        }
      })

      if (contact.email) {
        contact.status = "active"
        contacts.push(contact)
      }
    }

    return contacts
  }

  const handlePreview = () => {
    if (csvData) {
      const parsed = parseCsvData(csvData)
      setPreview(parsed.slice(0, 5)) // Show first 5 for preview
    }
  }

  useEffect(() => {
    if (open) {
      getGroups().then(setGroups).catch(() => setGroups([]))
      setSelectedGroups([])
    }
  }, [open])

  const onSubmit = async (data: any) => {
    setLoading(true)
    try {
      const contacts = parseCsvData(data.csvData)
      let imported = 0
      let errors = 0

      for (const contactData of contacts) {
        try {
          const result = contactSchema.parse(contactData)
          const { groups, ...contactWithoutGroups } = result;
          const newContact = await createContact({
            ...contactWithoutGroups,
            user_id: "", // Will be set by RLS
          })
          addContact(newContact)
          for (const groupId of selectedGroups) {
            await addContactToGroup(newContact.id, groupId)
          }
          imported++
        } catch (error) {
          errors++
          console.error("Error importing contact:", contactData, error)
        }
      }

      toast({
        title: "Importación completada",
        description: `${imported} contactos importados correctamente. ${errors} errores.`,
      })

      onOpenChange(false)
      reset()
      setPreview([])
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron importar los contactos",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Upload className="mr-2 h-5 w-5" />
            Importar Contactos
          </DialogTitle>
          <DialogDescription>Importa contactos masivamente usando formato CSV</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Alert>
            <FileText className="h-4 w-4" />
            <AlertDescription>
              <strong>Formato CSV esperado:</strong>
              <br />
              Primera línea: email,first_name,last_name,phone
              <br />
              Siguientes líneas: juan@email.com,Juan,Pérez,+1234567890
              <br />
              <br />
              También acepta: correo,nombre,apellido,telefono
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="csvData">Datos CSV</Label>
            <Textarea
              id="csvData"
              {...register("csvData")}
              placeholder="email,first_name,last_name,phone\njuan@email.com,Juan,Pérez,+1234567890\nmaria@email.com,María,García,+0987654321"
              rows={10}
              className="font-mono text-sm"
            />
            {errors.csvData && <p className="text-sm text-red-600">{errors.csvData.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Asignar a grupos</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-32 overflow-y-auto border rounded-md p-3">
              {groups.map((group: any) => (
                <div key={group.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={`group-${group.id}`}
                    checked={selectedGroups.includes(group.id)}
                    onChange={e => {
                      if (e.target.checked) {
                        setSelectedGroups([...selectedGroups, group.id])
                      } else {
                        setSelectedGroups(selectedGroups.filter(id => id !== group.id))
                      }
                    }}
                  />
                  <Label htmlFor={`group-${group.id}`} className="text-sm">
                    {group.name}
                  </Label>
                </div>
              ))}
              {groups.length === 0 && <span className="text-gray-500 text-sm">No hay grupos disponibles</span>}
            </div>
          </div>

          <div className="flex justify-between">
            <Button type="button" variant="outline" onClick={handlePreview}>
              Vista Previa
            </Button>
          </div>

          {preview.length > 0 && (
            <div className="space-y-2">
              <Label>Vista previa (primeros 5 contactos)</Label>
              <div className="border rounded-md p-3 bg-gray-50 max-h-40 overflow-y-auto">
                {preview.map((contact, index) => (
                  <div key={index} className="text-sm py-1">
                    <strong>
                      {contact.first_name} {contact.last_name}
                    </strong>{" "}
                    - {contact.email}
                    {contact.phone && ` - ${contact.phone}`}
                  </div>
                ))}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || preview.length === 0}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Importar {preview.length} Contactos
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
