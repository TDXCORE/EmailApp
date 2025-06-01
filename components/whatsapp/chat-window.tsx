"use client"

import { useState, useEffect, useRef } from 'react'
import { useWhatsAppRealtime, WhatsAppRealtimeMessage } from '@/lib/hooks/use-whatsapp-realtime'
import { whatsappApi } from '@/lib/whatsapp-api'
import MessageInput from './message-input'
import { WhatsAppMessage } from '@/lib/whatsapp-api'
import { Contact } from '@/lib/whatsapp/types'
import { supabase } from '@/lib/supabase'

interface ChatWindowProps {
  selectedWaId: string | null
  contacts: Contact[]
}

const MessageBubble = ({ message, contact }: { message: WhatsAppRealtimeMessage; contact?: Contact }) => {
  const isSent = message.isOutgoing;

  // Function to format timestamp (e.g., "3:51 PM")
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  // Function to determine checkmark icon based on status
  const getStatusIcon = (status: WhatsAppRealtimeMessage['status']) => {
    switch (status) {
      case 'delivered':
      case 'read':
        return <span className="text-blue-500">✔✔</span>; // Double checkmark for delivered/read
      case 'sent':
        return <span className="text-gray-500">✔</span>; // Single checkmark for sent
      default:
        return null; // No icon for other statuses (e.g., pending, failed)
    }
  };

  return (
    <div className={`flex ${isSent ? 'justify-end' : 'justify-start'} items-end`}>
      {!isSent && contact && (
        <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-semibold text-sm mr-2">
          {/* Display first letter of contact name if available */}
          {contact.profile?.name ? contact.profile.name.charAt(0).toUpperCase() : ''}
        </div>
      )}
      <div className={`rounded-lg p-2 max-w-[70%] ${isSent ? 'bg-green-100 text-gray-800' : 'bg-white text-gray-800'} shadow-sm`}>
        {/* Message Content */}
        {message.type === 'text' && message.content?.text?.body}
        {/* Add other message types here if needed (e.g., image, video) */}

        {/* Timestamp and Status */}
        <div className={`text-[10px] mt-1 ${isSent ? 'text-gray-600 text-right' : 'text-gray-500 text-left'}`}>
          {formatTimestamp(message.created_at)}
          {isSent && <span className="ml-1">{getStatusIcon(message.status)}</span>}
        </div>
      </div>
    </div>
  );
};

export default function ChatWindow({ selectedWaId, contacts }: ChatWindowProps) {
  const { messages, setMessages } = useWhatsAppRealtime(selectedWaId || undefined, contacts)
  const [isLoading, setIsLoading] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    if (selectedWaId) {
      scrollToBottom()
    }
  }, [messages, selectedWaId])

  useEffect(() => {
    if (!selectedWaId) {
      // ... handle no conversation selected
      return;
    }

    const newChannel = supabase
      .channel(`whatsapp_messages_${selectedWaId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'whatsapp_messages',
          // TEMPORARILY REMOVE OR COMMENT OUT THE FILTER:
          // filter: `from_number=eq.${selectedWaId} OR to_number=eq.${selectedWaId}`,
        },
        (payload) => {
          console.log('Realtime INSERT (Simplified Listener) event triggered!', payload);
          // You should see this log if INSERT events are reaching the client for this table
          // Now you can process the payload to update your messages state
          // ... your existing logic to add message to state ...
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'whatsapp_messages',
           filter: `from_number=eq.${selectedWaId} OR to_number=eq.${selectedWaId}`, // Keep filter for UPDATE
        },
        (payload) => {
           console.log('Realtime UPDATE event triggered!', payload);
          // ... your existing logic to update message status ...
        }
      )
      .subscribe();

    console.log('Realtime subscription initiated for conversationId:', selectedWaId);
    // This log should appear

    return () => {
      console.log('Cleaning up realtime subscription for conversationId:', selectedWaId);
      supabase.removeChannel(newChannel); // Use removeChannel instead of removeSubscription
    };

  }, [selectedWaId, supabase, contacts]); // Dependencies should include conversationId, supabase, and contacts

  const handleSendMessage = async (content: string) => {
    setIsLoading(true)
    try {
      const textMessage: WhatsAppMessage = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: selectedWaId || '',
        type: 'text',
        text: {
          body: content,
        },
      }

      await whatsappApi.sendMessage(textMessage)

      // Add the sent message to the local state immediately
      const tempMessage: WhatsAppRealtimeMessage = {
        id: Date.now().toString(), // Temporary client-side ID
        message_id: '', // This will be updated by the real-time listener
        from_number: selectedWaId || '', // Outgoing messages show *from* the selected contact in this view
        to_number: whatsappApi.phoneNumberId as string, // Our number is the recipient of the outgoing message in terms of DB storage
        type: 'text',
        content: { text: { body: content } }, // Store the content structure as per WhatsApp API
        status: 'sent', // Or 'pending'
        created_at: new Date().toISOString(),
        isOutgoing: true,
      };

      setMessages(currentMessages => [...currentMessages, tempMessage]);

    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!selectedWaId) {
    return (
      <div className="flex-1 p-4 flex items-center justify-center">
        <p className="text-muted-foreground">Select a conversation from the left panel.</p>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.length === 0 ? (
          <p>No messages yet.</p>
        ) : (
          messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} contact={msg.contact} />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="mt-4">
        <MessageInput onSend={handleSendMessage} isLoading={isLoading} />
      </div>
    </div>
  )
} 