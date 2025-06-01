"use client"

import { useState } from 'react'
import { Send, Paperclip, Smile, MapPin, User } from 'lucide-react'

interface MessageInputProps {
  onSend: (message: string) => void
  isLoading?: boolean
}

export default function MessageInput({ onSend, isLoading }: MessageInputProps) {
  const [message, setMessage] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (message.trim() && !isLoading) {
      onSend(message.trim())
      setMessage('')
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center gap-2 w-full p-2 bg-white border-t border-gray-200"
    >
      <div className="flex items-center gap-1">
        <button
          type="button"
          className="p-2 hover:bg-gray-200 rounded-full focus:outline-none text-gray-500"
          title="Emojis"
          tabIndex={-1}
        >
          <Smile className="w-6 h-6" />
        </button>
        <button
          type="button"
          className="p-2 hover:bg-gray-200 rounded-full focus:outline-none text-gray-500"
          title="Adjuntar archivo"
          tabIndex={-1}
        >
          <Paperclip className="w-6 h-6" />
        </button>
      </div>

      <div className="flex-1 bg-gray-100 rounded-lg px-4 py-2 focus-within:ring-1 focus-within:ring-blue-400">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Escribe un mensaje..."
          className="w-full bg-transparent outline-none text-base text-gray-800 placeholder-gray-500"
          disabled={isLoading}
        />
      </div>

      <button
        type="submit"
        className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={isLoading || !message.trim()}
        title="Enviar mensaje"
      >
        <Send className="w-6 h-6" />
      </button>
    </form>
  )
} 