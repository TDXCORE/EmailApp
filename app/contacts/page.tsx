import type { Metadata } from "next"
import { ContactsClient } from "@/components/contacts/contacts-client"

export const metadata: Metadata = {
  title: "Contactos - Email Marketing App",
  description: "Gestiona tu lista de contactos",
}

export default function ContactsPage() {
  return <ContactsClient />
}
