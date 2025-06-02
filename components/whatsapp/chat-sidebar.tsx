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
  lastMessageTimestamp?: string | null;
}

interface ChatSidebarProps {
  contacts: Contact[];
  onSelectConversation: Dispatch<SetStateAction<string | null>>;
  selectedWaId: string | null;
}

export default function ChatSidebar({ contacts, onSelectConversation, selectedWaId }: ChatSidebarProps) {
  const [search, setSearch] = useState('')
  
  // Function to format timestamp (e.g., "10:50 PM" or "5/30/2025")
  const formatTimestamp = (timestamp: string | null) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.getDate() === now.getDate() &&
                    date.getMonth() === now.getMonth() &&
                    date.getFullYear() === now.getFullYear();

    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'numeric', day: 'numeric', year: 'numeric' });
    }
  };

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
              <li
                key={contact.id}
                className={`flex items-center p-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${selectedWaId === contact.wa_id ? 'bg-gray-100' : ''}`}
                onClick={() => onSelectConversation(contact.wa_id)}
              >
                {/* Avatar */}
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-white font-bold">
                    {contact.profile?.name ? contact.profile.name.charAt(0).toUpperCase() : contact.wa_id.charAt(0)}
                  </div>
                </div>

                {/* Contact Info and Last Message */}
                <div className="flex-1 ml-3 overflow-hidden">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-800 truncate">
                      {contact.profile?.name || contact.wa_id}
                    </span>
                    {/* Timestamp - Color based on unread count and selection */}
                    {contact.lastMessageTimestamp && (
                      <span className={`text-xs ${contact.unreadCount && contact.unreadCount > 0 && selectedWaId !== contact.wa_id ? 'text-green-600 font-semibold' : 'text-gray-500'}`}>
                        {formatTimestamp(contact.lastMessageTimestamp)}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600 truncate">
                    {contact.lastMessagePreview || 'No messages yet'}
                  </div>
                </div>

                {/* Unread Count Badge - Show only if unreadCount > 0 and not selected */}
                {contact.unreadCount && contact.unreadCount > 0 && selectedWaId !== contact.wa_id && (
                  <div className="flex-shrink-0 ml-2">
                    <span className="flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-green-500 rounded-full">
                      {contact.unreadCount}
                    </span>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  )
} 