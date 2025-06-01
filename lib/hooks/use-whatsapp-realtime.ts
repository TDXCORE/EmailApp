'use client';

import { useEffect, useState } from 'react'
import { createClientComponentClient, SupabaseClient } from '@supabase/auth-helpers-nextjs'
import { RealtimeChannel } from '@supabase/supabase-js'
import { WhatsAppMessage } from '@/lib/whatsapp-api'
import { Contact } from '@/lib/whatsapp/types'
import { whatsappApi } from '@/lib/whatsapp-api'

export interface WhatsAppRealtimeMessage {
  id: string
  message_id: string
  from_number: string
  to_number: string
  type: string
  content: any
  status: 'sent' | 'received' | 'delivered' | 'read'
  created_at: string
  isOutgoing: boolean
  contact?: Contact;
}

export function useWhatsAppRealtime(conversationId?: string, contacts: Contact[] = []) {
  console.log('useWhatsAppRealtime hook running for conversationId:', conversationId);
  const [messages, setMessages] = useState<WhatsAppRealtimeMessage[]>([])
  const [channel, setChannel] = useState<RealtimeChannel | null>(null)
  
  const supabase = createClientComponentClient();

  // Access the phone number ID from the singleton WhatsAppAPI instance
  const userPhoneNumberId = whatsappApi.phoneNumberId;
  console.log('useWhatsAppRealtime - User Phone Number ID:', userPhoneNumberId);

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

      // Associate messages with contacts
      const messagesWithContacts = (data || []).map(msg => {
        const contact = contacts.find(c => c.wa_id === msg.from_number);
        // Determine if the message is outgoing based on the from_number and our phone number ID
        const isOutgoing = msg.from_number === userPhoneNumberId;
        console.log('Fetched Message:', { from_number: msg.from_number, userPhoneNumberId, isOutgoing });
        return { ...msg, contact, isOutgoing };
      });

      setMessages(messagesWithContacts);
      console.log(`Fetched ${messagesWithContacts.length} messages for ${conversationId}.`);
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
          console.log('Realtime INSERT payload:', payload);
          const newMessage = payload.new as WhatsAppRealtimeMessage;

          // Find and attach contact to the new message
          const contact = contacts.find(c => c.wa_id === newMessage.from_number);
          // Determine if outgoing for real-time message
          const isOutgoing = newMessage.from_number === userPhoneNumberId;
          console.log('Realtime INSERT Message:', { from_number: newMessage.from_number, userPhoneNumberId, isOutgoing });
          const newMessageWithContact = { ...newMessage, contact, isOutgoing };

          setMessages(currentMessages => {
            // Avoid duplicates if realtime sends existing messages on subscribe/reconnect
            if (currentMessages.find(msg => msg.id === newMessageWithContact.id)) {
              return currentMessages;
            }
            const updatedMessages = [...currentMessages, newMessageWithContact];
            // Sort messages by timestamp to ensure correct order
            updatedMessages.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
            return updatedMessages;
          });
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
          console.log('Realtime UPDATE payload:', payload); // Log payload for inspection
          const updatedMessage = payload.new as WhatsAppRealtimeMessage;
           // Find and attach contact to the updated message (important for initial fetch updates)
          const contact = contacts.find(c => c.wa_id === updatedMessage.from_number);
          const updatedMessageWithContact = { ...updatedMessage, contact };
          setMessages(currentMessages =>
            currentMessages.map((msg) =>
              msg.id === updatedMessageWithContact.id ? updatedMessageWithContact : msg
            )
          );
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
  }, [conversationId, supabase, contacts]);

  return { messages, setMessages }
} 