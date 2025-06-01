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
    // Initialize Supabase client only in the browser
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is not set.");
      setError("Server configuration error: Missing Supabase public keys.");
      setLoading(false);
      return; 
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    async function fetchContacts() {
      setLoading(true);
      const { data, error } = await supabase
        .from('whatsapp_contacts')
        .select('id, wa_id, profile')
        .order('updated_at', { ascending: false }); // Order by last updated

      if (error) {
        console.error('Error fetching contacts:', error);
        setError('Failed to load contacts.');
      } else {
        setContacts(data || []);
      }
      setLoading(false);
    }

    fetchContacts();

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