import { z } from "zod"

export const campaignSchema = z.object({
  name: z.string().min(1, "El nombre es requerido").max(100, "Máximo 100 caracteres"),
  subject: z.string().min(1, "El asunto es requerido").max(200, "Máximo 200 caracteres"),
  content: z.string().min(1, "El contenido es requerido"),
  status: z.enum(["draft", "sent", "scheduled", "paused"]),
  scheduled_at: z.string().optional(),
  groups: z.array(z.string()).min(1, "Selecciona al menos un grupo"),
})

export const contactSchema = z.object({
  email: z.string().email("Email inválido"),
  first_name: z.string().min(1, "El nombre es requerido").max(50, "Máximo 50 caracteres"),
  last_name: z.string().min(1, "El apellido es requerido").max(50, "Máximo 50 caracteres"),
  phone: z.string().optional(),
  status: z.enum(["active", "unsubscribed", "bounced"]),
  groups: z.array(z.string()).optional(),
})

export const groupSchema = z.object({
  name: z.string().min(1, "El nombre es requerido").max(100, "Máximo 100 caracteres"),
  description: z.string().max(500, "Máximo 500 caracteres").optional(),
})

export const configSchema = z.object({
  key: z.string().min(1, "La clave es requerida"),
  value: z.string().min(1, "El valor es requerido"),
  description: z.string().max(200, "Máximo 200 caracteres").optional(),
})

export const importContactsSchema = z.object({
  contacts: z.array(contactSchema).min(1, "Debe importar al menos un contacto"),
})

export type CampaignFormData = z.infer<typeof campaignSchema>
export type ContactFormData = z.infer<typeof contactSchema>
export type GroupFormData = z.infer<typeof groupSchema>
export type ConfigFormData = z.infer<typeof configSchema>
export type ImportContactsData = z.infer<typeof importContactsSchema>
