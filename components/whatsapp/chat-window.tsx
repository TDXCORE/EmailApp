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
        {message.type === 'image' && message.content?.image?.link && (
          <div>
            <img src={message.content.image.link} alt="Image" className="max-w-xs rounded-md" />
            {message.content.image.caption && <p className="mt-1 text-sm">{message.content.image.caption}</p>}
          </div>
        )}
        {message.type === 'audio' && message.content?.audio?.link && (
          <div>
            <audio controls src={message.content.audio.link}></audio>
          </div>
        )}
        {message.type === 'document' && message.content?.document?.link && (
          <div>
            <a
              href={message.content.document.link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              {message.content.document.filename || 'Document'} {/* Display filename if available */}
            </a>
          </div>
        )}
        {message.type === 'video' && message.content?.video?.link && (
           <div>
             <video controls src={message.content.video.link} className="max-w-xs rounded-md"></video>
             {message.content.video.caption && <p className="mt-1 text-sm">{message.content.video.caption}</p>}
           </div>
        )}
        {/* Add other message types here if needed (e.g., sticker, location) */}

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
      // Ensure previous channel is removed if conversationId becomes null
      setMessages([]); // Clear messages when no conversation is selected
      // The cleanup function of the previous useEffect takes care of removing the channel
      return;
    }

    console.log('Realtime subscription initiated for conversationId:', selectedWaId);

    const newChannel = supabase
      .channel(`whatsapp_messages_${selectedWaId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'whatsapp_messages',
          // TEMPORARILY REMOVE OR COMMENT OUT THE FILTER:
          // filter: `from_number=eq.${selectedWaId} OR to_number=eq.${selectedWaId}`, // Removed filter for testing
        },
        (payload) => {
          console.log('Realtime INSERT event triggered! (Simplified Listener)', payload); // Log payload
          const newMessage = payload.new as WhatsAppRealtimeMessage; // Cast payload.new to the message type
          // Find and attach contact to the new message (needed for avatar in bubble)
          const contact = contacts.find(c => c.wa_id === newMessage.from_number);
          const newMessageWithContact = { ...newMessage, contact };

          setMessages(currentMessages => {
             // Avoid duplicates if realtime sends existing messages on subscribe/reconnect
             if (currentMessages.find(msg => msg.id === newMessageWithContact.id)) {
               console.log('Realtime INSERT (Simplified): Message already exists, skipping.', newMessageWithContact.id);
               return currentMessages;
             }
            console.log('Realtime INSERT (Simplified): Adding new message.', newMessageWithContact);
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
          filter: `from_number=eq.${selectedWaId} OR to_number=eq.${selectedWaId}`, // Keep filter for UPDATE
        },
        (payload) => {
           console.log('Realtime UPDATE event triggered!', payload); // Log payload
           const updatedMessage = payload.new as WhatsAppRealtimeMessage;
            // Find and attach contact to the updated message (important for initial fetch updates)
           const contact = contacts.find(c => c.wa_id === updatedMessage.from_number);
           const updatedMessageWithContact = { ...updatedMessage, contact };
           console.log('Realtime UPDATE: Updating message.', updatedMessageWithContact);
           setMessages(currentMessages =>
             currentMessages.map((msg) =>
               msg.id === updatedMessageWithContact.id ? updatedMessageWithContact : msg
             )
           );
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up realtime subscription for conversationId:', selectedWaId);
      supabase.removeChannel(newChannel); // Correct cleanup
    };

  }, [selectedWaId, supabase, contacts, setMessages]); // Added setMessages to dependencies

  // Function to upload file to Supabase Storage
  const uploadFile = async (file: File): Promise<string | null> => {
    if (!selectedWaId) return null; // Need a conversation ID for path

    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `${selectedWaId}/${fileName}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from('whatsappt-multimedia') // Corrected bucket name
        .upload(filePath, file);

      if (uploadError) {
        console.error('Error uploading file:', uploadError);
        return null;
      }

      const { data } = supabase.storage
        .from('whatsappt-multimedia') // Corrected bucket name
        .getPublicUrl(filePath);

       if (!data?.publicUrl) {
           console.error('Error getting public URL: Public URL not found.');
           return null; 
       }

      return data.publicUrl;
    } catch (error) {
      console.error('Error in uploadFile:', error);
      return null;
    }
  };

  // Modify handleSendMessage to accept File or string
  const handleSendMessage = async (content: string | File) => {
    setIsLoading(true)
    try {
      let messagePayload: WhatsAppMessage;
      let uploadedFileUrl: string | null = null;
      let whatsappMediaId: string | null = null;

      if (typeof content === 'string') {
        // Handle text message
        messagePayload = {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: selectedWaId || '',
          type: 'text',
          text: {
            body: content,
          },
        };
      } else {
        // Handle file message
        const file = content;
        const fileType = file.type.split('/')[0]; // Get the main type (image, audio, video, application)

        // Upload file to WhatsApp Cloud API first
        console.log('Uploading file to WhatsApp API before sending...', file.name);
        const whatsappMediaId = await whatsappApi.uploadMediaToWhatsApp(file);

        if (!whatsappMediaId) {
          console.error('Failed to upload file to WhatsApp API');
          setIsLoading(false);
          return;
        }
         console.log('Successfully uploaded file to WhatsApp API. Media ID:', whatsappMediaId);

        // Determine WhatsApp message type based on file type
        let whatsappMessageType: 'image' | 'audio' | 'document' | 'video';
        if (fileType === 'image') {
          whatsappMessageType = 'image';
        } else if (fileType === 'audio') {
          whatsappMessageType = 'audio';
        } else if (fileType === 'video') {
          whatsappMessageType = 'video';
        } else {
          whatsappMessageType = 'document';
        }

        // Construct the appropriate message payload using the media ID
        messagePayload = {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: selectedWaId || '',
          type: whatsappMessageType,
          [whatsappMessageType]: {
               // Use 'id' for media messages in the sending payload
               id: whatsappMediaId,
               // Optional: Add caption or filename if needed, WhatsApp API supports this in the message payload
               ...(whatsappMessageType === 'image' && { caption: file.name }),
               ...(whatsappMessageType === 'video' && { caption: file.name }),
               ...(whatsappMessageType === 'document' && { filename: file.name }),
          }
        } as WhatsAppMessage;
      }

      // Add temporary message to state before sending
      const tempMessage: WhatsAppRealtimeMessage = {
        id: Date.now().toString(),
        message_id: '',
        from_number: whatsappApi.phoneNumberId as string,
        to_number: selectedWaId || '',
        type: messagePayload.type,
        status: 'pending',
        created_at: new Date().toISOString(),
        isOutgoing: true,
        content: messagePayload.type === 'text' 
          ? { text: { body: content as string } }
          : { [messagePayload.type]: { 
               // For temporary display, we still need a URL. 
               // We don't have the public Supabase URL yet at this point for outgoing messages.
               // We could use a temporary client-side URL (like data URL) or a placeholder.
               // For simplicity now, we'll use a placeholder and rely on Realtime update
               // to show the actual media once the webhook processes the sent message.
               // If immediate display is critical, consider a more complex client-side approach.
               // Using the file name as a temporary identifier/placeholder:
               name: (content as File).name, // Using 'name' as a temp placeholder field
               // We can add a temporary local URL if needed for immediate display, e.g. URL.createObjectURL(file)
               // tempLocalUrl: typeof content !== 'string' ? URL.createObjectURL(content) : undefined,
               // Include the WhatsApp Media ID in the temporary message for potential client-side tracking
               whatsappMediaId: whatsappMediaId,
            }
          }
      };

      setMessages(currentMessages => [...currentMessages, tempMessage]);

       // TODO: Clean up temporary local URL if used for display later
      // if (tempMessage.content?.[messagePayload.type]?.tempLocalUrl) {
      //   URL.revokeObjectURL(tempMessage.content[messagePayload.type].tempLocalUrl);
      // }

      // Send the message
      await whatsappApi.sendMessage(messagePayload);

    } catch (error) {
      console.error('Error sending message:', error);
      // TODO: Handle error state in UI, potentially remove temp message or mark as failed
    } finally {
      setIsLoading(false);
    }
  };

  // Modify MessageInput onSend to handle files
  const handleMessageInputSend = (input: string | File) => {
      handleSendMessage(input);
  };

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
        <MessageInput onSend={handleMessageInputSend} isLoading={isLoading} />
      </div>
    </div>
  )
} 