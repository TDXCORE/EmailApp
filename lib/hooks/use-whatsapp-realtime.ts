'use client';

import { useEffect, useState } from 'react'
import { createClientComponentClient, SupabaseClient } from '@supabase/auth-helpers-nextjs'
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
  console.log('useWhatsAppRealtime hook running for conversationId:', conversationId);
  const [messages, setMessages] = useState<WhatsAppRealtimeMessage[]>([])
  const [channel, setChannel] = useState<RealtimeChannel | null>(null)
  
  const supabase = createClientComponentClient();

  useEffect(() => {
    console.log('useEffect in useWhatsAppRealtime running for conversationId:', conversationId);

    if (!conversationId) {
        console.log('No conversationId provided, skipping message fetch and subscription.');
        setMessages([]);
        if (channel) {
          supabase.removeChannel(channel);
          setChannel(null);
        }
        return;
    }
    
    console.log('Fetching messages for conversationId:', conversationId);

    const fetchMessages = async () => {
      let query = supabase
        .from('whatsapp_messages')
        .select('*')
        .order('created_at', { ascending: true })

      if (conversationId) {
        query = query.or(`from_number.eq.${conversationId},to_number.eq.${conversationId}`)
      }

      const { data, error } = await query

      console.log('Supabase message fetch result for', conversationId, { data, error });

      if (error) {
        console.error('Error fetching messages:', error)
        return
      }

      setMessages(data || [])
      console.log(`Fetched ${data ? data.length : 0} messages for ${conversationId}.`);
    }

    fetchMessages()

    console.log('Subscribing to new messages for conversationId:', conversationId);
    const newChannel = supabase
      .channel(`whatsapp_messages_${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'whatsapp_messages',
          filter: `from_number=eq.${conversationId} OR to_number=eq.${conversationId}`,
        },
        (payload) => {
          console.log('New message received in realtime:', payload);
          setMessages((current) => [...current, payload.new as WhatsAppRealtimeMessage])
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'whatsapp_messages',
          filter: `from_number=eq.${conversationId} OR to_number=eq.${conversationId}`,
        },
        (payload) => {
          console.log('Message updated in realtime:', payload);
          setMessages((current) =>
            current.map((msg) =>
              msg.id === payload.new.id ? (payload.new as WhatsAppRealtimeMessage) : msg
            )
          )
        }
      )
      .subscribe()

    setChannel(newChannel)
    console.log('Realtime subscription active for conversationId:', conversationId);

    return () => {
      console.log('Cleaning up realtime subscription for conversationId:', conversationId);
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [conversationId, supabase]);

  return { messages }
} 