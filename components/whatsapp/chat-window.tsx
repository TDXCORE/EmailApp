"use client"

import { useState, useEffect, useRef } from 'react'
import { useWhatsAppRealtime, WhatsAppRealtimeMessage } from '@/lib/hooks/use-whatsapp-realtime'
import { whatsappApi } from '@/lib/whatsapp-api'
import MessageInput from './message-input'
import { WhatsAppMessage } from '@/lib/whatsapp-api'

interface ChatWindowProps {
  selectedWaId: string | null
}

const MessageBubble = ({ message, isSent }: { message: WhatsAppRealtimeMessage, isSent: boolean }) => {
  return (
    <div className={`flex ${isSent ? 'justify-end' : 'justify-start'}`}>
      <div className={`rounded-lg p-2 ${isSent ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}`}>
        {message.content.text?.body || '...'}
      </div>
    </div>
  );
};

export default function ChatWindow({ selectedWaId }: ChatWindowProps) {
  const { messages } = useWhatsAppRealtime(selectedWaId || undefined)
  const [isLoading, setIsLoading] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    if (selectedWaId) {
      scrollToBottom()
    }
  }, [messages, selectedWaId])

  const handleSendMessage = async (content: string) => {
    setIsLoading(true)
    try {
      // First try to send a template message
      const templateMessage: WhatsAppMessage = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: selectedWaId || '',
        type: 'template',
        template: {
          name: 'hello_world',
          language: {
            code: 'en_US'
          }
        }
      }

      console.log('Sending template message:', {
        to: selectedWaId,
        template: 'hello_world'
      });

      await whatsappApi.sendMessage(templateMessage)

      // If template message succeeds, also send the text message
      const textMessage: WhatsAppMessage = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: selectedWaId || '',
        type: 'text',
        text: {
          body: content,
        },
      }

      await whatsappApi.sendMessage(textMessage)
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!selectedWaId) {
    return (
      <div className="flex-1 p-4 flex items-center justify-center">
        <p className="text-muted-foreground">Select a conversation from the left panel.</p>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col h-full p-4">
      <h2 className="text-xl font-semibold mb-4">Conversation with {selectedWaId}</h2>
      <div className="flex-1 overflow-y-auto space-y-2">
        {messages.length === 0 ? (
          <p>No messages yet.</p>
        ) : (
          messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} isSent={msg.from_number !== selectedWaId} />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="mt-4">
        <MessageInput onSend={handleSendMessage} isLoading={isLoading} />
      </div>
    </div>
  )
} 