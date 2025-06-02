'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient, SupabaseClient } from '@supabase/auth-helpers-nextjs';
import ChatSidebar from '@/components/whatsapp/chat-sidebar';
import ChatWindow from '@/components/whatsapp/chat-window';
import ChatHeader from '@/components/whatsapp/chat-header';
import { Contact } from '@/lib/whatsapp/types';

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
        // Fetch unread count (messages sent TO our number that are not read)
        const { count: unreadCount, error: unreadError } = await supabase
          .from('whatsapp_messages')
          .select('*', { count: 'exact', head: true })
          .eq('from_number', contact.wa_id) // Messages from this contact
          .eq('to_number', whatsappPhoneNumberId) // Use the environment variable here
          .neq('status', 'read'); // Not yet read

        if (unreadError) {
          console.error(`Error fetching unread count for ${contact.wa_id}:`, unreadError);
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

        return {
          ...contact,
          unreadCount: unreadCount || 0,
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
        async (payload) => { // Made this async to await the fetch
          console.log('Sidebar Realtime INSERT event triggered!', payload);
          const newMessage = payload.new;
          // Determine the other participant based on who sent the message (from_number or to_number being our number)
          const conversationWaId = newMessage.from_number === whatsappPhoneNumberId ? newMessage.to_number : newMessage.from_number; // Identify the other participant

          // Re-fetch unread count for this specific conversation
          const { count: newUnreadCount, error: unreadError } = await supabase
            .from('whatsapp_messages')
            .select('*', { count: 'exact', head: true })
            .eq('from_number', conversationWaId) // Messages from this contact
            .eq('to_number', whatsappPhoneNumberId) // Use the environment variable here
            .neq('status', 'read'); // Not yet read

          if (unreadError) {
            console.error(`Error re-fetching unread count for ${conversationWaId}:`, unreadError);
            // Continue with existing unread count if fetch fails
          }

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

                return { // Return updated contact object
                  ...contact,
                  lastMessagePreview: newLastMessagePreview,
                  lastMessageTimestamp: newMessage.created_at,
                  // Use the newly fetched unread count
                  unreadCount: newUnreadCount !== null ? newUnreadCount : (contact.unreadCount || 0),
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
        async (payload) => { // Made this callback async
          console.log('Sidebar Realtime UPDATE event triggered!', payload);
          const updatedMessage = payload.new;
          // Determine the other participant based on who sent the message (from_number or to_number being our number)
          const conversationWaId = updatedMessage.from_number === whatsappPhoneNumberId ? updatedMessage.to_number : updatedMessage.from_number; // Identify the other participant

          // Re-fetch unread count for this specific conversation
          const { count: newUnreadCount, error: unreadError } = await supabase
            .from('whatsapp_messages')
            .select('*', { count: 'exact', head: true })
            .eq('from_number', conversationWaId) // Messages from this contact
            .eq('to_number', whatsappPhoneNumberId) // Use the environment variable here
            .neq('status', 'read'); // Not yet read

          if (unreadError) {
            console.error(`Error re-fetching unread count for ${conversationWaId}:`, unreadError);
            // Continue with existing unread count if fetch fails
          }

          setContacts(currentContacts => {
            const updatedContacts = currentContacts.map(contact => {
              if (contact.wa_id === conversationWaId) {
                // Update last message preview/timestamp if the updated message is the latest
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

                return { // Return updated contact object
                  ...contact,
                  // Use the newly fetched unread count
                  unreadCount: newUnreadCount !== null ? newUnreadCount : (contact.unreadCount || 0),
                  lastMessagePreview: newLastMessagePreview,
                  lastMessageTimestamp: newLastMessageTimestamp,
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

  }, [supabase, whatsappPhoneNumberId]); // Depend on supabase and whatsappPhoneNumberId

  // *** Effect 2: Mark messages as read when a conversation is selected ***
  useEffect(() => {
    console.log('useEffect [selectedWaId, whatsappPhoneNumberId, supabase] running'); // Log this effect
    if (selectedWaId && whatsappPhoneNumberId && supabase) {
      console.log(`Selected conversation changed to: ${selectedWaId}. Marking messages as read.`);
      markMessagesAsRead(selectedWaId);
    }
  }, [selectedWaId, whatsappPhoneNumberId, supabase]); // Depend on selectedWaId, whatsappPhoneNumberId, and supabase

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