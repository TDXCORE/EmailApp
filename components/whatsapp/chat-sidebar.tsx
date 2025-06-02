"use client"
import { useState, Dispatch, SetStateAction } from 'react'
import { Search } from 'lucide-react'
import Link from 'next/link'

interface Contact {
  id: string;
  wa_id: string;
  profile?: { name?: string };
  unreadCount?: number;
  lastMessagePreview?: string | null;
}

interface ChatSidebarProps {
  contacts: Contact[];
  onSelectConversation: Dispatch<SetStateAction<string | null>>;
  selectedWaId: string | null;
}

export default function ChatSidebar({ contacts, onSelectConversation, selectedWaId }: ChatSidebarProps) {
  const [search, setSearch] = useState('')
  
  // Filter contacts based on search input
  const filteredContacts = contacts.filter(contact => 
    contact.profile?.name?.toLowerCase().includes(search.toLowerCase()) ||
    contact.wa_id.includes(search) // Also allow searching by phone number
  );

  return (
    <aside className="w-80 bg-white border-r border-gray-200 h-full flex flex-col">
      {/* Search Input */}
      <div className="p-3 border-b border-gray-100">
        <div className="flex items-center bg-gray-100 rounded-full px-4 py-2">
          <Search className="w-5 h-5 text-gray-500 mr-3" />
          <input
            className="bg-transparent outline-none flex-1 text-sm text-gray-800 placeholder-gray-500"
            placeholder="Buscar conversación..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>
      
      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {filteredContacts.length === 0 ? (
          <div className="text-center text-gray-500 mt-10 text-sm">No hay conversaciones</div>
        ) : (
          <ul>
            {filteredContacts.map((contact) => (
              <li key={contact.id}>
                <button
                  className={`flex items-center w-full px-4 py-3 border-b border-gray-100 focus:outline-none transition-colors duration-150
                    ${selectedWaId === contact.wa_id ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
                  onClick={() => onSelectConversation(contact.wa_id)}
                >
                  {/* Avatar Placeholder */}
                  <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-semibold text-lg mr-4">
                     {/* Display first letter of name or a default icon */}
                     {contact.profile?.name ? contact.profile.name.charAt(0).toUpperCase() : ''}
                  </div>
                  
                  {/* Contact Info and Last Message/Timestamp */}
                  <div className="flex-1 flex flex-col">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-semibold text-gray-800 truncate max-w-[70%]">
                        {contact.profile?.name || contact.wa_id}
                      </h3>
                      {/* Placeholder for Last Message Timestamp */}
                      {/* You would replace this with actual last message timestamp from your data */}
                      {/* <span className="text-xs text-gray-500 ml-2">3:51 PM</span> */}
                    </div>
                    {/* Display Last Message Snippet */}
                    {contact.lastMessagePreview && (
                      <p className="text-sm text-gray-600 truncate">{contact.lastMessagePreview}</p>
                    )}
                  </div>

                  {/* Display Unread Count */}
                  {contact.unreadCount && contact.unreadCount > 0 && (
                    <div className="ml-2 bg-blue-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {contact.unreadCount}
                    </div>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  )
} 