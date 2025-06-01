'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient, SupabaseClient } from '@supabase/auth-helpers-nextjs';
import ChatSidebar from '@/components/whatsapp/chat-sidebar';
import ChatWindow from '@/components/whatsapp/chat-window';

interface Contact {
  id: string;
  wa_id: string;
  profile?: { name?: string };
}

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
      
      const { data, error } = await supabase
        .from('whatsapp_contacts')
        .select('id, wa_id, profile')
        .order('updated_at', { ascending: false }); // Order by last updated

      console.log('Supabase fetch result:', { data, error }); // Log fetch result

      if (error) {
        console.error('Error fetching contacts:', error);
        setError('Failed to load contacts.');
      } else {
        console.log(`Fetched ${data ? data.length : 0} contacts.`); // Log number of contacts
        setContacts(data || []);
      }
      setLoading(false);
      console.log('Finished fetching contacts.'); // Log fetch end
    }

    fetchContacts();

    // Consider adding a real-time subscription here to automatically add new contacts
    // to the list if a message is received from a new number.

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
      {/* Pass the selectedWaId to ChatWindow */}
      <ChatWindow selectedWaId={selectedWaId} />
    </div>
  );
} 