import type { Metadata } from "next"
import { UnsubscribeClient } from "@/components/unsubscribe/unsubscribe-client"

export const metadata: Metadata = {
  title: "Desuscribirse - Email Marketing App",
  description: "Desuscribirse de nuestras comunicaciones de email marketing",
}

export default function UnsubscribePage() {
  return <UnsubscribeClient />
}
