'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient, SupabaseClient } from '@supabase/auth-helpers-nextjs';
import ChatSidebar from '@/components/whatsapp/chat-sidebar';
import ChatWindow from '@/components/whatsapp/chat-window';
import ChatHeader from '@/components/whatsapp/chat-header';
import { Contact } from '@/lib/whatsapp/types';

// Helper functions for managing last seen timestamps in localStorage
const getLastSeenTimestamp = (waId: string): string | null => {
  if (typeof window === 'undefined') return null; // Avoid localStorage errors on server-side
  const lastSeen = localStorage.getItem(`lastSeen-${waId}`);
  return lastSeen;
};

const setLastSeenTimestamp = (waId: string, timestamp: string | null) => {
  if (typeof window === 'undefined') return; // Avoid localStorage errors on server-side
  if (timestamp) {
    localStorage.setItem(`lastSeen-${waId}`, timestamp);
  } else {
    localStorage.removeItem(`lastSeen-${waId}`);
  }
};

export default function WhatsAppPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedWaId, setSelectedWaId] = useState<string | null>(null); // State to track selected conversation

  // Get the Supabase client from auth-helpers
  const supabase = createClientComponentClient();

  // Get the WhatsApp Phone Number ID from environment variables
  const whatsappPhoneNumberId = process.env.NEXT_PUBLIC_WHATSAPP_PHONE_NUMBER_ID;

  // Function to mark messages as read
  const markMessagesAsRead = async (contactWaId: string) => {
    if (!whatsappPhoneNumberId) {
      console.error('Cannot mark messages as read: WhatsApp Phone Number ID is not set.');
      return;
    }
    console.log(`Marking messages as read for conversation with ${contactWaId}`);
    const { error } = await supabase
      .from('whatsapp_messages')
      .update({ status: 'read' })
      .eq('from_number', contactWaId) // Messages from this contact
      .eq('to_number', whatsappPhoneNumberId) // Messages sent to our number
      .neq('status', 'read'); // Only update if not already read

    if (error) {
      console.error(`Error marking messages as read for ${contactWaId}:`, error);
    } else {
      console.log(`Successfully marked messages as read for ${contactWaId}`);
      // Update local state to set unread count to 0
      setContacts(currentContacts =>
        currentContacts.map(contact =>
          contact.wa_id === contactWaId ? { ...contact, unreadCount: 0 } : contact
        )
      );
      // *** Update last seen timestamp in localStorage ***
      // Find the latest message timestamp for this conversation in the current contacts state
      const contact = contacts.find(c => c.wa_id === contactWaId);
      if (contact?.lastMessageTimestamp) {
         setLastSeenTimestamp(contactWaId, contact.lastMessageTimestamp);
         console.log(`Updated last seen timestamp for ${contactWaId} to ${contact.lastMessageTimestamp}`);
      }
      // ***************************************************
    }
  };

  // *** Effect 1: Fetch contacts and setup Realtime subscription for the sidebar ***
  useEffect(() => {
    console.log('useEffect [supabase, whatsappPhoneNumberId] running'); // Log this effect
    console.log('Using Supabase client from auth-helpers in WhatsAppPage', supabase ? '***INITIALIZED***' : '***NOT INITIALIZED***');
    console.log('WhatsApp Phone Number ID for Realtime:', whatsappPhoneNumberId);

    if (!whatsappPhoneNumberId) {
      console.error('NEXT_PUBLIC_WHATSAPP_PHONE_NUMBER_ID is not set. Realtime subscription not active.');
      setError('Configuration error: WhatsApp Phone Number ID is not set.');
      setLoading(false);
      return; // Exit if the phone number ID is not set
    }

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
        // *** Get last seen timestamp from localStorage ***
        const lastSeen = getLastSeenTimestamp(contact.wa_id);
        console.log(`Last seen timestamp for ${contact.wa_id}:`, lastSeen);

        // Fetch unread count: messages sent TO our number, FROM this contact, received AFTER last seen timestamp
        let unreadCount = 0;
        if (lastSeen) {
            const { count, error: unreadError } = await supabase
              .from('whatsapp_messages')
              .select('*', { count: 'exact', head: true })
              .eq('from_number', contact.wa_id)
              .eq('to_number', whatsappPhoneNumberId)
              .neq('status', 'read')
              .gt('created_at', lastSeen); // Only count messages after the last seen timestamp

            if (unreadError) {
              console.error(`Error fetching unread count (> lastSeen) for ${contact.wa_id}:`, unreadError);
            } else {
              unreadCount = count || 0;
            }
        } else {
             // If no last seen timestamp, count all unread messages from this contact
             const { count, error: unreadError } = await supabase
              .from('whatsapp_messages')
              .select('*', { count: 'exact', head: true })
              .eq('from_number', contact.wa_id)
              .eq('to_number', whatsappPhoneNumberId)
              .neq('status', 'read');

            if (unreadError) {
              console.error(`Error fetching initial unread count for ${contact.wa_id}:`, unreadError);
            } else {
              unreadCount = count || 0;
            }
        }

        // Fetch the last message content and timestamp
        const { data: lastMessageData, error: lastMessageError } = await supabase
          .from('whatsapp_messages')
          .select('type, content, created_at') // Select created_at as well
          .or(`from_number.eq.${contact.wa_id},to_number.eq.${contact.wa_id}`) // Corrected typo here
          .order('created_at', { ascending: false })
          .limit(1);

        let lastMessagePreview: string | null = null;
        let lastMessageTimestamp: string | null = null;

        if (lastMessageError) {
          console.error(`Error fetching last message for ${contact.wa_id}:`, lastMessageError);
        } else if (lastMessageData && lastMessageData.length > 0) {
          const lastMessage = lastMessageData[0];
          lastMessageTimestamp = lastMessage.created_at;

          // Generate a preview based on message type
          if (lastMessage.type === 'text' && lastMessage.content?.text?.body) {
            lastMessagePreview = lastMessage.content.text.body;
          } else if (lastMessage.type !== 'text' && lastMessage.content && lastMessage.content[lastMessage.type]) {
              // For media types, show the type or caption/filename if available
              const mediaContent = lastMessage.content[lastMessage.type];
              if (mediaContent.caption) {
                  lastMessagePreview = mediaContent.caption;
              } else if (mediaContent.filename) {
                   lastMessagePreview = mediaContent.filename;
              } else {
                lastMessagePreview = `[${lastMessage.type.charAt(0).toUpperCase()}${lastMessage.type.slice(1)}]`;
              }
          } else {
               lastMessagePreview = '[Unsupported Message Type]';
          }
           // Truncate preview if too long
           if (lastMessagePreview && lastMessagePreview.length > 50) {
              lastMessagePreview = lastMessagePreview.substring(0, 50) + '...';
           }
        }

        return { // Return updated contact object
          ...contact,
          unreadCount: unreadCount, // Use the count based on last seen timestamp
          lastMessagePreview: lastMessagePreview,
          lastMessageTimestamp: lastMessageTimestamp,
        };
      }));

      // Sort contacts by last message timestamp for correct order in sidebar
      contactsWithData.sort((a, b) => {
        const dateA = a.lastMessageTimestamp ? new Date(a.lastMessageTimestamp).getTime() : 0;
        const dateB = b.lastMessageTimestamp ? new Date(b.lastMessageTimestamp).getTime() : 0;
        return dateB - dateA; // Descending order
      });

      setContacts(contactsWithData);
      setLoading(false);
      console.log('Finished fetching contacts with message data.');
    }

    fetchContacts();

    // Setup Realtime subscription for messages to update sidebar
    const messagesChannel = supabase
      .channel('whatsapp_messages_sidebar') // Unique channel name
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'whatsapp_messages' },
        (payload) => { // Changed to not async since we are not awaiting fetch here anymore
          console.log('Sidebar Realtime INSERT event triggered!', payload);
          const newMessage = payload.new;
          // Determine the other participant based on who sent the message (from_number or to_number being our number)
          const conversationWaId = newMessage.from_number === whatsappPhoneNumberId ? newMessage.to_number : newMessage.from_number; // Identify the other participant

          // Update the contacts list in state
          setContacts(currentContacts => {
            const updatedContacts = currentContacts.map(contact => {
              if (contact.wa_id === conversationWaId) {
                // Update last message preview and timestamp
                let newLastMessagePreview: string | null = null;
                 if (newMessage.type === 'text' && newMessage.content?.text?.body) {
                    newLastMessagePreview = newMessage.content.text.body;
                 } else if (newMessage.type !== 'text' && newMessage.content && newMessage.content[newMessage.type]) {
                    const mediaContent = newMessage.content[newMessage.type];
                     if (mediaContent.caption) {
                         newLastMessagePreview = mediaContent.caption;
                     } else if (mediaContent.filename) {
                          newLastMessagePreview = mediaContent.filename;
                     } else {
                       newLastMessagePreview = `[${newMessage.type.charAt(0).toUpperCase()}${newMessage.type.slice(1)}]`;
                     }
                 } else {
                      newLastMessagePreview = '[Unsupported Message Type]';
                 }
                 if (newLastMessagePreview && newLastMessagePreview.length > 50) {
                     newLastMessagePreview = newLastMessagePreview.substring(0, 50) + '...';
                 }

                // *** Update unread count based on whether the conversation is selected and last seen timestamp ***
                // Increment unread count only if the conversation is NOT currently selected
                // and the new message arrived after the last seen timestamp
                const lastSeen = getLastSeenTimestamp(contact.wa_id);
                const updatedUnreadCount = contact.wa_id === selectedWaId || (lastSeen && new Date(newMessage.created_at).getTime() <= new Date(lastSeen).getTime())
                  ? (contact.unreadCount || 0) // Don't increment if selected or message is older than last seen
                  : (contact.unreadCount || 0) + 1; // Increment if not selected and message is newer

                // *** Update last seen timestamp in localStorage if the conversation is selected ***
                 if (contact.wa_id === selectedWaId && newMessage.created_at) {
                     setLastSeenTimestamp(contact.wa_id, newMessage.created_at);
                      console.log(`Realtime INSERT: Updated last seen timestamp for ${contact.wa_id} to ${newMessage.created_at}`);
                 }

                return { // Return updated contact object
                  ...contact,
                  lastMessagePreview: newLastMessagePreview,
                  lastMessageTimestamp: newMessage.created_at,
                  unreadCount: updatedUnreadCount,
                };
              }
              return contact; // Return unchanged contact if not the target conversation
            });

            // If the contact is not in the current list (new conversation), you might want to fetch/add it here
            // This requires more complex logic to get contact details for a new wa_id
            // For simplicity now, we assume contacts are pre-populated or added elsewhere.
            // A simple approach could be to re-fetch contacts after a small delay:
            // setTimeout(fetchContacts, 1000); // Not ideal for performance

             console.log('Contacts after INSERT update:', updatedContacts);
             // Re-sort the list to keep the most recent conversation at the top
             updatedContacts.sort((a, b) => {
                const dateA = a.lastMessageTimestamp ? new Date(a.lastMessageTimestamp).getTime() : 0;
                const dateB = b.lastMessageTimestamp ? new Date(b.lastMessageTimestamp).getTime() : 0;
                return dateB - dateA; // Descending order
              });

            return updatedContacts;
          });
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'whatsapp_messages' },
        (payload) => { // Removed async as we are not awaiting fetch
          console.log('Sidebar Realtime UPDATE event triggered!', payload);
          const updatedMessage = payload.new;
          // Determine the other participant
          const conversationWaId = updatedMessage.from_number === whatsappPhoneNumberId ? updatedMessage.to_number : updatedMessage.from_number; // Identify the other participant

          setContacts(currentContacts => {
            const updatedContacts = currentContacts.map(contact => {
              if (contact.wa_id === conversationWaId) {
                // Update last message preview/timestamp ONLY if the updated message is the latest
                const isLatestMessage = !contact.lastMessageTimestamp || new Date(updatedMessage.created_at).getTime() >= new Date(contact.lastMessageTimestamp).getTime();

                let newLastMessagePreview = contact.lastMessagePreview;
                let newLastMessageTimestamp = contact.lastMessageTimestamp;

                if (isLatestMessage) {
                  // Update last message preview logic (same as INSERT)
                  if (updatedMessage.type === 'text' && updatedMessage.content?.text?.body) {
                    newLastMessagePreview = updatedMessage.content.text.body;
                  } else if (updatedMessage.type !== 'text' && updatedMessage.content && updatedMessage.content[updatedMessage.type]) {
                    const mediaContent = updatedMessage.content[updatedMessage.type];
                    if (mediaContent.caption) {
                      newLastMessagePreview = mediaContent.caption;
                    } else if (mediaContent.filename) {
                      newLastMessagePreview = mediaContent.filename;
                    } else {
                      newLastMessagePreview = `[${updatedMessage.type.charAt(0).toUpperCase()}${updatedMessage.type.slice(1)}]`;
                    }
                  } else {
                    newLastMessagePreview = '[Unsupported Message Type]';
                  }
                  if (newLastMessagePreview && newLastMessagePreview.length > 50) {
                    newLastMessagePreview = newLastMessagePreview.substring(0, 50) + '...';
                  }
                  newLastMessageTimestamp = updatedMessage.created_at;
                }

                // *** Do NOT re-fetch unread count here. Unread count is handled by INSERT and markMessagesAsRead ***
                // Keep existing unread count from state
                const updatedUnreadCount = contact.unreadCount;

                return { // Return updated contact object
                  ...contact,
                  unreadCount: updatedUnreadCount, // Use the count managed by INSERT/markMessagesAsRead
                  lastMessagePreview: newLastMessagePreview, // Update only if latest message
                  lastMessageTimestamp: newLastMessageTimestamp, // Update only if latest message
                };
              }
              return contact; // Return unchanged contact
            });

            console.log('Contacts after UPDATE update:', updatedContacts);
            // Re-sort the list
            updatedContacts.sort((a, b) => {
              const dateA = a.lastMessageTimestamp ? new Date(a.lastMessageTimestamp).getTime() : 0;
              const dateB = b.lastMessageTimestamp ? new Date(b.lastMessageTimestamp).getTime() : 0;
              return dateB - dateA; // Descending order
            });

            return updatedContacts;
          });
        }
      )
      .subscribe();

    // Cleanup function for the subscription
    const cleanup = () => {
      console.log('Cleaning up sidebar realtime subscription.');
      supabase.removeChannel(messagesChannel);
    };

    return cleanup;

  }, [supabase, whatsappPhoneNumberId, selectedWaId]); // Depend on supabase, whatsappPhoneNumberId, and selectedWaId

  // *** Effect 2: Mark messages as read when a conversation is selected ***
  useEffect(() => {
    console.log('useEffect [selectedWaId, whatsappPhoneNumberId, supabase] running'); // Log this effect
    if (selectedWaId && whatsappPhoneNumberId && supabase) {
      console.log(`Selected conversation changed to: ${selectedWaId}. Marking messages as read.`);
      markMessagesAsRead(selectedWaId);
    }
  }, [selectedWaId, whatsappPhoneNumberId, supabase, markMessagesAsRead]); // Added markMessagesAsRead dependency

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