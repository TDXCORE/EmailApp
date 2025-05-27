import type { Metadata } from "next"
import { SettingsClient } from "@/components/settings/settings-client"

export const metadata: Metadata = {
  title: "Configuración - Email Marketing App",
  description: "Gestiona las variables de entorno y configuraciones",
}

export default function SettingsPage() {
  return <SettingsClient />
}
