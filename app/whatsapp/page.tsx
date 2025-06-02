'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient, SupabaseClient } from '@supabase/auth-helpers-nextjs';
import ChatSidebar from '@/components/whatsapp/chat-sidebar';
import ChatWindow from '@/components/whatsapp/chat-window';
import ChatHeader from '@/components/whatsapp/chat-header';
import { Contact } from '@/lib/whatsapp/types';

export default function WhatsAppPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedWaId, setSelectedWaId] = useState<string | null>(null); // State to track selected conversation

  // Get the Supabase client from auth-helpers
  const supabase = createClientComponentClient();

  useEffect(() => {
    console.log('useEffect in WhatsAppPage running'); // Log useEffect start
    console.log('Using Supabase client from auth-helpers in WhatsAppPage', supabase ? '***INITIALIZED***' : '***NOT INITIALIZED***');

    async function fetchContacts() {
      console.log('Fetching contacts from Supabase...'); // Log fetch start
      setLoading(true);

      const { data: contactsData, error: contactsError } = await supabase
        .from('whatsapp_contacts')
        .select('id, wa_id, profile')
        .order('updated_at', { ascending: false }); // Order by last updated

      console.log('Supabase fetch result:', { data: contactsData, error: contactsError }); // Log fetch result

      if (contactsError) {
        console.error('Error fetching contacts:', contactsError);
        setError('Failed to load contacts.');
        setLoading(false);
        return; // Exit if contacts fetch fails
      }

      if (!contactsData) {
        console.log('No contacts found.');
        setContacts([]);
        setLoading(false);
        return; // No contacts to process
      }

      console.log(`Fetched ${contactsData.length} contacts.`); // Log number of contacts

      // Fetch unread count and last message for each contact
      const contactsWithData = await Promise.all(contactsData.map(async (contact) => {
        // Fetch unread count (messages sent TO our number that are not read)
        const { count: unreadCount, error: unreadError } = await supabase
          .from('whatsapp_messages')
          .select('*', { count: 'exact', head: true })
          .eq('from_number', contact.wa_id) // Messages from this contact
          .eq('to_number', 'TU_NUMERO_DE_EMPRESA') // Replace with your company's WhatsApp number ID
          .neq('status', 'read'); // Not yet read

        if (unreadError) {
          console.error(`Error fetching unread count for ${contact.wa_id}:`, unreadError);
        }

        // Fetch the last message content
        const { data: lastMessageData, error: lastMessageError } = await supabase
          .from('whatsapp_messages')
          .select('type, content')
          .or(`from_number.eq.${contact.wa_id},to_number.eq.${contact.wa_id}`) // Messages involving this contact
          .order('created_at', { ascending: false })
          .limit(1);

        let lastMessagePreview: string | null = null;
        if (lastMessageError) {
          console.error(`Error fetching last message for ${contact.wa_id}:`, lastMessageError);
        } else if (lastMessageData && lastMessageData.length > 0) {
          const lastMessage = lastMessageData[0];
          // Generate a preview based on message type
          if (lastMessage.type === 'text' && lastMessage.content?.text?.body) {
            lastMessagePreview = lastMessage.content.text.body; // Use text body
          } else if (lastMessage.type !== 'text' && lastMessage.content && lastMessage.content[lastMessage.type]) {
              // For media types, show the type or caption/filename if available
              const mediaContent = lastMessage.content[lastMessage.type];
              if (mediaContent.caption) {
                  lastMessagePreview = mediaContent.caption; // Use caption
              } else if (mediaContent.filename) {
                   lastMessagePreview = mediaContent.filename; // Use filename for documents
              } else {
                lastMessagePreview = `[${lastMessage.type.charAt(0).toUpperCase()}${lastMessage.type.slice(1)}]`; // e.g., [Image], [Audio]
              }
          } else {
               lastMessagePreview = '[Unsupported Message Type]'; // Fallback for unexpected content structure
          }
           // Truncate preview if too long
           if (lastMessagePreview && lastMessagePreview.length > 50) {
              lastMessagePreview = lastMessagePreview.substring(0, 50) + '...';
           }
        }

        return {
          ...contact,
          unreadCount: unreadCount || 0,
          lastMessagePreview: lastMessagePreview,
        };
      }));

      setContacts(contactsWithData);
      setLoading(false);
      console.log('Finished fetching contacts with message data.'); // Log fetch end
    }

    fetchContacts();

    // Consider adding a real-time subscription here to automatically add new contacts
    // to the list if a message is received from a new number and update message previews and unread counts

  }, [supabase]); // Depend on supabase to ensure it's initialized

  if (loading) {
    return <div>Loading conversations...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="flex h-full w-full">
      {/* Pass contacts and the selection handler to ChatSidebar */}
      <ChatSidebar contacts={contacts} onSelectConversation={setSelectedWaId} selectedWaId={selectedWaId} />

      {/* Right panel: Header and Chat Window */}
      <div className="flex flex-col flex-1 h-full">
        {/* Find the selected contact to pass name to header */}
        {selectedWaId ? (
          (() => {
            const selectedContact = contacts.find(contact => contact.wa_id === selectedWaId);
            const contactName = selectedContact?.profile?.name || selectedWaId;
            return <ChatHeader contactName={contactName} />;
          })()
        ) : (
          <div className="flex items-center justify-center h-16 bg-white border-b border-gray-200 shadow-sm">
             <h3 className="text-lg font-semibold text-gray-500">Select a conversation</h3>
          </div>
        )}

        {/* Pass the selectedWaId and contacts to ChatWindow */}
        <ChatWindow selectedWaId={selectedWaId} contacts={contacts} />
      </div>
    </div>
  );
} 