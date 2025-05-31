"use client"

import { useState } from 'react'
import { useWhatsAppRealtime } from '@/lib/hooks/use-whatsapp-realtime'
import { whatsappApi } from '@/lib/whatsapp-api'
import MessageInput from './message-input'
import { WhatsAppMessage } from '@/lib/whatsapp-api'

interface ChatWindowProps {
  conversationId: string
}

export default function ChatWindow({ conversationId }: ChatWindowProps) {
  const { messages } = useWhatsAppRealtime(conversationId)
  const [isLoading, setIsLoading] = useState(false)

  const handleSendMessage = async (content: string) => {
    setIsLoading(true)
    try {
      const message: WhatsAppMessage = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: conversationId,
        type: 'text',
        text: {
          body: content,
        },
      }

      await whatsappApi.sendMessage(message)
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full w-full max-w-full bg-white">
      <div className="flex-1 overflow-y-auto p-2 sm:p-4 space-y-2 sm:space-y-4 w-full max-w-full"
        style={{ minHeight: 0 }}>
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex w-full ${
              message.from_number === conversationId ? 'justify-start' : 'justify-end'
            }`}
          >
            <div
              className={`inline-block break-words max-w-[85vw] sm:max-w-[70%] rounded-2xl px-4 py-2 shadow-sm text-sm sm:text-base ${
                message.from_number === conversationId
                  ? 'bg-gray-100 text-gray-900'
                  : 'bg-blue-500 text-white'
              }`}
              style={{ wordBreak: 'break-word' }}
            >
              {message.type === 'text' && (
                <p className="whitespace-pre-line">{message.content.text?.body}</p>
              )}
              {message.type === 'image' && (
                <div>
                  <img
                    src={message.content.image?.link}
                    alt={message.content.image?.caption || 'Image'}
                    className="max-w-full rounded mb-1"
                  />
                  {message.content.image?.caption && (
                    <p className="mt-1 text-xs opacity-80">{message.content.image.caption}</p>
                  )}
                </div>
              )}
              {/* Add more message type renderers as needed */}
              <span className="text-[10px] sm:text-xs opacity-60 mt-1 block text-right">
                {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}
      </div>
      <div className="border-t p-2 sm:p-4 bg-white sticky bottom-0 w-full">
        <MessageInput onSend={handleSendMessage} isLoading={isLoading} />
      </div>
    </div>
  )
} 