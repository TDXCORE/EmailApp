"use client"
import { useState } from 'react'
import { Search } from 'lucide-react'

const conversations = [
  // Placeholder para futuras conversaciones
]

export default function ChatSidebar() {
  const [search, setSearch] = useState('')
  return (
    <aside className="w-80 bg-white border-r border-gray-200 h-full flex flex-col">
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center bg-gray-50 rounded px-2 py-1">
          <Search className="w-4 h-4 text-gray-400 mr-2" />
          <input
            className="bg-transparent outline-none flex-1 text-sm"
            placeholder="Buscar conversación..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="text-center text-gray-400 mt-10 text-sm">No hay conversaciones</div>
        ) : (
          // Aquí iría el mapeo de conversaciones
          <></>
        )}
      </div>
    </aside>
  )
} 