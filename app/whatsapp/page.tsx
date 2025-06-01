'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

interface Contact {
  id: string;
  wa_id: string;
  profile?: { name?: string };
}

export default function WhatsAppPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('useEffect in WhatsAppPage running'); // Log useEffect start
    // Initialize Supabase client only in the browser
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    console.log('Checking NEXT_PUBLIC Supabase env vars in WhatsAppPage:', {
      SUPABASE_URL: supabaseUrl ? '***SET***' : '***NOT SET***',
      SUPABASE_ANON_KEY: supabaseAnonKey ? '***SET***' : '***NOT SET***',
    });

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is not set in WhatsAppPage.");
      setError("Server configuration error: Missing Supabase public keys.");
      setLoading(false);
      return; 
    }

    let supabase: SupabaseClient;
    try {
      supabase = createClient(supabaseUrl, supabaseAnonKey);
      console.log('Supabase client created successfully in WhatsAppPage');
    } catch (e: any) {
      console.error('Failed to create Supabase client in WhatsAppPage:', e);
      setError(`Failed to initialize Supabase: ${e.message}`);
      setLoading(false);
      return;
    }

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

    // Optional: Set up real-time subscription for contacts list if needed
    // (e.g., to automatically add new contacts to the list without refresh)
    // const contactChannel = supabase
    //   .channel('whatsapp_contacts_list')
    //   .on(
    //     'postgres_changes',
    //     { event: 'INSERT', schema: 'public', table: 'whatsapp_contacts' },
    //     (payload) => {
    //       console.log('New contact received in realtime:', payload);
    //       // Add the new contact to the state if it's not already there
    //       setContacts((current) => {
    //         if (!current.some(contact => contact.id === (payload.new as Contact).id)) {
    //           return [payload.new as Contact, ...current];
    //         }
    //         return current;
    //       });
    //     }
    //   )
    //   .subscribe();

    // return () => {
    //   supabase.removeChannel(contactChannel);
    // };

  }, []); // Empty dependency array means this runs once on mount

  if (loading) {
    return <div>Loading conversations...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="flex h-full">
      {/* Conversations List Panel */}
      <div className="w-80 border-r p-4 overflow-y-auto">
        <h2 className="text-xl font-semibold mb-4">Conversations</h2>
        {
          contacts.length === 0 ? (
            <p>No conversations yet.</p>
          ) : (
            <ul>
              {contacts.map((contact) => (
                <li key={contact.id} className="mb-2">
                  <Link href={`/whatsapp/${contact.wa_id}`} className="block p-2 rounded hover:bg-gray-100">
                    {contact.profile?.name || contact.wa_id} {/* Display name or wa_id */}
                  </Link>
                </li>
              ))}
            </ul>
          )
        }
      </div>

      {/* Conversation View (Initially empty or a placeholder) */}
      <div className="flex-1 p-4 flex items-center justify-center">
        <p className="text-muted-foreground">Select a conversation from the left panel.</p>
      </div>
    </div>
  );
} 