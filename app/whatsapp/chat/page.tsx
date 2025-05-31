import ChatSidebar from '@/components/whatsapp/chat-sidebar'
import ChatWindow from '@/components/whatsapp/chat-window'

export default function WhatsAppChatPage() {
  return (
    <div className="flex h-full w-full">
      <ChatSidebar />
      <ChatWindow />
    </div>
  )
} 