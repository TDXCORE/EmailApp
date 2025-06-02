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

  // *** Log contacts state whenever it might update ***
  console.log('Current contacts state:', contacts);
  // ***********************************************

  // Function to mark messages as read
  const markMessagesAsRead = async (contactWaId: string) => {
    console.log(`--- Debug markMessagesAsRead for contact ${contactWaId} ---`); // Added log
    if (!whatsappPhoneNumberId) {
      console.error('Cannot mark messages as read: WhatsApp Phone Number ID is not set.');
      console.log(`Finished markMessagesAsRead for ${contactWaId} (Error: missing phone number ID)`); // Added log
      return;
    }
    console.log(`Attempting to mark messages as read for conversation with ${contactWaId} in DB...`); // Added log
    const { error } = await supabase
      .from('whatsapp_messages')
      .update({ status: 'read' })
      .eq('from_number', contactWaId) // Messages from this contact
      .eq('to_number', whatsappPhoneNumberId) // Messages sent to our number
      .neq('status', 'read'); // Only update if not already read

    if (error) {
      console.error(`Error marking messages as read for ${contactWaId}:`, error);
      console.log(`Finished markMessagesAsRead for ${contactWaId} (Error: DB update failed)`); // Added log
    } else {
      console.log(`Successfully marked messages as read for ${contactWaId} in DB.`); // Added log
      // Update local state to set unread count to 0
      setContacts(currentContacts => {
          console.log(`Updating local state for ${contactWaId} - setting unreadCount to 0`); // Added log
          const updatedContacts = currentContacts.map(contact =>
            contact.wa_id === contactWaId ? { ...contact, unreadCount: 0 } : contact
          );
          console.log(`Local state updated for ${contactWaId}:`, updatedContacts.find(c => c.wa_id === contactWaId)); // Added log
          return updatedContacts;
      });
      // *** Update last seen timestamp in localStorage ***
      // Find the latest message timestamp for this conversation in the current contacts state
      const contact = contacts.find(c => c.wa_id === contactWaId);
      if (contact?.lastMessageTimestamp) {
         console.log(`Attempting to update last seen timestamp in localStorage for ${contactWaId} to ${contact.lastMessageTimestamp}`); // Added log
         setLastSeenTimestamp(contactWaId, contact.lastMessageTimestamp);
         console.log(`Updated last seen timestamp for ${contactWaId} to ${contact.lastMessageTimestamp}`); // Existing log
      } else {
          console.log(`No lastMessageTimestamp found for ${contactWaId}, not updating localStorage.`); // Added log
      }
      // ***************************************************
       console.log(`Finished markMessagesAsRead successfully for ${contactWaId}.`); // Added log
    }
  };

  // *** Effect 1: Setup Realtime subscription for the sidebar (No dependency on selectedWaId) ***
  useEffect(() => {
    console.log('useEffect [supabase, whatsappPhoneNumberId] running (Realtime setup)');
    console.log('Using Supabase client from auth-helpers in WhatsAppPage', supabase ? '***INITIALIZED***' : '***NOT INITIALIZED***');
    console.log('WhatsApp Phone Number ID for Realtime:', whatsappPhoneNumberId);

    if (!whatsappPhoneNumberId) {
      console.error('NEXT_PUBLIC_WHATSAPP_PHONE_NUMBER_ID is not set. Realtime subscription not active.');
      return;
    }

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
                console.log(`--- Debug for contact ${contact.wa_id} (Realtime INSERT) ---`); // Added log
                console.log(`Contact ${contact.wa_id} currently selected: ${contact.wa_id === selectedWaId}`); // Added log
                const lastSeen = getLastSeenTimestamp(contact.wa_id);
                console.log(`Last seen timestamp for ${contact.wa_id} (Realtime INSERT):`, lastSeen);
                console.log(`New message timestamp: ${newMessage.created_at}`); // Added log
                console.log(`Is new message after last seen? ${lastSeen && new Date(newMessage.created_at).getTime() > new Date(lastSeen).getTime()}`); // Added log
                console.log(`Current unreadCount for ${contact.wa_id} (Realtime INSERT):`, contact.unreadCount);

                // Increment unread count only if the conversation is NOT currently selected
                // and the new message arrived after the last seen timestamp
                const shouldIncrementUnread = contact.wa_id !== selectedWaId && (!lastSeen || new Date(newMessage.created_at).getTime() > new Date(lastSeen).getTime()); // Added clear condition variable
                console.log(`Should increment unread count for ${contact.wa_id}? ${shouldIncrementUnread}`); // Added log

                const updatedUnreadCount = shouldIncrementUnread
                  ? (contact.unreadCount || 0) + 1
                  : (contact.unreadCount || 0);

                console.log(`Calculated updatedUnreadCount for ${contact.wa_id} (Realtime INSERT):`, updatedUnreadCount);

                // *** Update last seen timestamp in localStorage if the conversation is selected ***
                 if (contact.wa_id === selectedWaId && newMessage.created_at) {
                     // We only update last seen here if the message is for the currently selected conversation
                     // This ensures that the lastSeen timestamp accurately reflects the latest message *the user saw*
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

          console.log(`--- Debug for contact ${conversationWaId} (Realtime UPDATE) ---`); // Added log
          console.log(`Updated message ID: ${updatedMessage.id}, Status: ${updatedMessage.status}, Timestamp: ${updatedMessage.created_at}`); // Added log

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
      .on('SUBSCRIBE', () => {
        console.log('Realtime Channel SUBSCRIBED successfully for sidebar!');
      })
      .on('ERROR', (err: Error) => {
        console.error('Realtime Channel ERROR for sidebar:', err);
      })
      .subscribe();

    console.log('Attempting to subscribe to sidebar realtime channel...');

    // Cleanup function for the subscription
    const cleanup = () => {
      console.log('Cleaning up sidebar realtime subscription.');
      // Check if messagesChannel is valid before removing
      if (messagesChannel) {
          supabase.removeChannel(messagesChannel);
      }
    };

    return cleanup;

  }, [supabase, whatsappPhoneNumberId]); // Removed selectedWaId dependency

  // *** Effect 2: Mark messages as read when a conversation is selected ***
  useEffect(() => {
    console.log('useEffect [selectedWaId, whatsappPhoneNumberId, supabase] running (Marking as read)'); // Log this effect
    if (selectedWaId && whatsappPhoneNumberId && supabase) {
      console.log(`Selected conversation changed to: ${selectedWaId}. Marking messages as read.`);
      markMessagesAsRead(selectedWaId);
    }
  }, [selectedWaId, whatsappPhoneNumberId, supabase, markMessagesAsRead]); // Depend on selectedWaId, whatsappPhoneNumberId, supabase, and markMessagesAsRead

  // *** Effect 3: Initial fetch of contacts (Runs only once on mount) ***
  useEffect(() => {
      console.log('useEffect [] running (Initial fetch)'); // Log this effect
       if (!whatsappPhoneNumberId) {
         // Error will be shown by the first effect's log, no need to re-set state here
           setLoading(false);
           return;
       }
       async function fetchContactsInitial() {
            console.log('Fetching contacts from Supabase (Initial)...'); // Log fetch start
             setLoading(true);
             setError(null); // Clear previous errors

             const { data: contactsData, error: contactsError } = await supabase
               .from('whatsapp_contacts')
               .select('id, wa_id, profile')
               .order('updated_at', { ascending: false }); // Order by last updated

             console.log('Supabase initial fetch result:', { data: contactsData, error: contactsError }); // Log fetch result

             if (contactsError) {
               console.error('Error fetching contacts (Initial): ', contactsError);
               setError('Failed to load contacts.');
               setLoading(false);
               return; // Exit if contacts fetch fails
             }

             if (!contactsData) {
               console.log('No contacts found (Initial).');
               setContacts([]);
               setLoading(false);
               return; // No contacts to process
             }

             console.log(`Fetched ${contactsData.length} contacts (Initial).`); // Corrected template literal

             // Fetch unread count and last message for each contact using last seen timestamp
             const contactsWithData = await Promise.all(contactsData.map(async (contact) => {
               const lastSeen = getLastSeenTimestamp(contact.wa_id);
               const unreadCount = lastSeen ? 0 : 1; // Assuming unread if no lastSeen timestamp
               const lastMessageTimestamp = lastSeen;
               const lastMessagePreview = lastSeen ? null : '[No Message Preview]';
               return {
                 ...contact,
                 unreadCount,
                 lastMessageTimestamp,
                 lastMessagePreview,
               };
             }));

             setContacts(contactsWithData);
             setLoading(false);
           }
           fetchContactsInitial();
       }, [supabase, whatsappPhoneNumberId]);

  return (
    <div className="flex h-screen w-full overflow-hidden">
      {/* Pass contacts and the selection handler to ChatSidebar */}
      <ChatSidebar contacts={contacts} onSelectConversation={setSelectedWaId} selectedWaId={selectedWaId} />

      {/* Right panel: Header and Chat Window */}
      {/* Ensure right panel takes remaining width and is flex column */}
      <div className="flex flex-col flex-1 h-full bg-gray-50">
        {/* Header - Ensure it has a fixed height and doesn't shrink/grow */}
        {selectedWaId ? (
          (() => {
            const selectedContact = contacts.find(contact => contact.wa_id === selectedWaId);
            const contactName = selectedContact?.profile?.name || selectedWaId;
            return <ChatHeader contactName={contactName} />;
          })()
        ) : (
          <div className="flex items-center justify-center h-16 bg-white border-b border-gray-200 shadow-sm flex-shrink-0">
             <h3 className="text-lg font-semibold text-gray-500">Select a conversation</h3>
          </div>
        )}

        {/* Chat Window - Ensure it takes the remaining height and is scrollable */}
        {/* Add padding here if needed, or within ChatWindow itself */}
        <div className="flex-1 overflow-y-auto p-4">
           <ChatWindow selectedWaId={selectedWaId} contacts={contacts} />
        </div>

      </div>
    </div>
  );
}