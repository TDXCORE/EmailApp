import type { Metadata } from "next"
import ChatSidebar from '@/components/whatsapp/chat-sidebar'
import ChatWindow from '@/components/whatsapp/chat-window'

export const metadata: Metadata = {
  title: "WhatsApp - EmailMarketing",
  description: "Gestiona tus comunicaciones de WhatsApp",
}

export default function WhatsAppPage() {
  return (
    <div className="flex h-full w-full">
      <ChatSidebar />
      <ChatWindow />
    </div>
  )
} 