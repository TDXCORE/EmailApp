import type { Metadata } from "next"
import { GroupsClient } from "@/components/groups/groups-client"

export const metadata: Metadata = {
  title: "Grupos - Email Marketing App",
  description: "Organiza tus contactos en grupos",
}

export default function GroupsPage() {
  return <GroupsClient />
}
