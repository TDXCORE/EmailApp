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
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
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
              <li key={contact.id}>
                <button
                  className={`flex items-center w-full px-4 py-3 border-b border-gray-100 focus:outline-none transition-colors duration-150
                    ${selectedWaId === contact.wa_id ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
                  onClick={() => onSelectConversation(contact.wa_id)}
                >
                  {/* Avatar Placeholder */}
                  <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-semibold text-lg mr-4">
                     {/* Display first letter of name or a default icon */}
                     {contact.profile?.name ? contact.profile.name.charAt(0).toUpperCase() : '?'}
                  </div>
                  
                  {/* Contact Info, Last Message Preview, Timestamp, and Unread Count */}
                  <div className="flex-1 flex flex-col overflow-hidden">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className={`text-base font-semibold text-gray-800 truncate ${contact.unreadCount && contact.unreadCount > 0 ? 'text-gray-800' : 'text-gray-600'}`}>
                        {contact.profile?.name || contact.wa_id}
                      </h3>
                      {/* Last Message Timestamp */}
                      {contact.lastMessageTimestamp && (
                        <span className={`text-xs ${contact.unreadCount && contact.unreadCount > 0 ? 'text-blue-600 font-semibold' : 'text-gray-500'} flex-shrink-0`}>
                          {formatTimestamp(contact.lastMessageTimestamp)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-2">
                       {/* Display Last Message Snippet */}
                      <p className={`text-sm truncate ${contact.unreadCount && contact.unreadCount > 0 ? 'text-gray-800 font-semibold' : 'text-gray-600'} flex-1`}>
                        {contact.lastMessagePreview || 'No messages yet'}
                      </p>

                      {/* Display Unread Count */}
                      {contact.unreadCount && contact.unreadCount > 0 && (
                        <div className="ml-auto bg-blue-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
                          {contact.unreadCount}
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  )
} 