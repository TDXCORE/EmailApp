import { useEffect, useState } from 'react'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { RealtimeChannel } from '@supabase/supabase-js'
import { WhatsAppMessage } from '@/lib/whatsapp-api'

export interface WhatsAppRealtimeMessage {
  id: string
  message_id: string
  from_number: string
  to_number: string
  type: string
  content: WhatsAppMessage
  status: 'sent' | 'received' | 'delivered' | 'read'
  created_at: string
}

export function useWhatsAppRealtime(conversationId?: string) {
  const [messages, setMessages] = useState<WhatsAppRealtimeMessage[]>([])
  const [channel, setChannel] = useState<RealtimeChannel | null>(null)
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null)

  useEffect(() => {
    // Initialize Supabase client only in the browser
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is not set.");
      // Handle this error appropriately in the UI, perhaps show a message
      return; // Exit useEffect if keys are missing
    }

    const client = createClient(supabaseUrl, supabaseAnonKey);
    setSupabase(client);

    // Initial fetch of messages and subscription should only happen if supabase client is available
    if (!client) return;

    const fetchMessages = async () => {
      let query = client
        .from('whatsapp_messages')
        .select('*')
        .order('created_at', { ascending: true })

      if (conversationId) {
        query = query.or(`from_number.eq.${conversationId},to_number.eq.${conversationId}`)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching messages:', error)
        return
      }

      setMessages(data || [])
    }

    fetchMessages()

    // Subscribe to new messages
    const newChannel = client
      .channel('whatsapp_messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'whatsapp_messages',
          filter: conversationId
            ? `from_number=eq.${conversationId} OR to_number=eq.${conversationId}`
            : undefined,
        },
        (payload) => {
          setMessages((current) => [...current, payload.new as WhatsAppRealtimeMessage])
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'whatsapp_messages',
          filter: conversationId
            ? `from_number=eq.${conversationId} OR to_number=eq.${conversationId}`
            : undefined,
        },
        (payload) => {
          setMessages((current) =>
            current.map((msg) =>
              msg.id === payload.new.id ? (payload.new as WhatsAppRealtimeMessage) : msg
            )
          )
        }
      )
      .subscribe()

    setChannel(newChannel)

    return () => {
      if (channel) {
        client.removeChannel(channel)
      }
    }
  }, [conversationId])

  return { messages }
} 