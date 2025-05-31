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
      className="flex items-end gap-2 w-full px-2 py-2 bg-white rounded-b-lg border-t border-gray-200"
    >
      <div className="flex items-center gap-1 bg-gray-100 rounded-full flex-1 px-3 py-2 focus-within:ring-2 focus-within:ring-blue-400">
        <button
          type="button"
          className="p-1 hover:bg-gray-200 rounded-full focus:outline-none"
          title="Adjuntar archivo"
          tabIndex={-1}
        >
          <Paperclip className="w-5 h-5 text-gray-500" />
        </button>
        <button
          type="button"
          className="p-1 hover:bg-gray-200 rounded-full focus:outline-none"
          title="Emojis"
          tabIndex={-1}
        >
          <Smile className="w-5 h-5 text-gray-500" />
        </button>
        <button
          type="button"
          className="p-1 hover:bg-gray-200 rounded-full focus:outline-none"
          title="Ubicación"
          tabIndex={-1}
        >
          <MapPin className="w-5 h-5 text-gray-500" />
        </button>
        <button
          type="button"
          className="p-1 hover:bg-gray-200 rounded-full focus:outline-none"
          title="Contacto"
          tabIndex={-1}
        >
          <User className="w-5 h-5 text-gray-500" />
        </button>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Escribe un mensaje..."
          className="flex-1 bg-transparent outline-none text-base px-2 py-1 min-w-0"
          disabled={isLoading}
          style={{ minWidth: 0 }}
        />
      </div>
      <button
        type="submit"
        disabled={!message.trim() || isLoading}
        className={`ml-1 p-2 rounded-full shadow-md transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-400
          ${message.trim() && !isLoading ? 'bg-blue-500 hover:bg-blue-600 text-white' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
        style={{ minWidth: 44, minHeight: 44 }}
        aria-label="Enviar"
      >
        <Send className="w-5 h-5" />
      </button>
    </form>
  )
} 