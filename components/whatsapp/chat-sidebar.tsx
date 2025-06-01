"use client"
import { useState, Dispatch, SetStateAction } from 'react'
import { Search } from 'lucide-react'
import Link from 'next/link'

interface Contact {
  id: string;
  wa_id: string;
  profile?: { name?: string };
}

interface ChatSidebarProps {
  contacts: Contact[];
  onSelectConversation: Dispatch<SetStateAction<string | null>>;
  selectedWaId: string | null;
}

export default function ChatSidebar({ contacts, onSelectConversation, selectedWaId }: ChatSidebarProps) {
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
        {contacts.length === 0 ? (
          <div className="text-center text-gray-400 mt-10 text-sm">No hay conversaciones</div>
        ) : (
          <ul>
            {contacts.map((contact) => (
              <li key={contact.id} className="mb-2">
                <button
                  className={`block w-full text-left p-2 rounded ${selectedWaId === contact.wa_id ? 'bg-blue-100' : 'hover:bg-gray-100'}`}
                  onClick={() => onSelectConversation(contact.wa_id)}
                >
                  {contact.profile?.name || contact.wa_id}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  )
} 