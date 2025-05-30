import type { Metadata } from "next"
import { CampaignsClient } from "@/components/campaigns/campaigns-client"

export const metadata: Metadata = {
  title: "Campañas - TDX Transformación Digital SAS",
  description: "Gestiona tus campañas de email marketing",
}

export default function CampaignsPage() {
  return <CampaignsClient />
}
