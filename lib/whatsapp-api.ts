import { createClient, SupabaseClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const WHATSAPP_API_VERSION = 'v22.0'
const WHATSAPP_PHONE_NUMBER_ID = process.env.NEXT_PUBLIC_WHATSAPP_PHONE_NUMBER_ID
const WHATSAPP_ACCESS_TOKEN = process.env.NEXT_PUBLIC_WHATSAPP_ACCESS_TOKEN
const WHATSAPP_WEBHOOK_TOKEN = process.env.NEXT_PUBLIC_WHATSAPP_WEBHOOK_TOKEN
const WHATSAPP_APP_SECRET = process.env.NEXT_PUBLIC_WHATSAPP_APP_SECRET

const BASE_URL = `https://graph.facebook.com/${WHATSAPP_API_VERSION}`

// Function to generate appsecret_proof
const generateAppSecretProof = (accessToken: string, appSecret: string) => {
  return crypto
    .createHmac('sha256', appSecret)
    .update(accessToken)
    .digest('hex')
}

export interface WhatsAppMessage {
  messaging_product: 'whatsapp'
  recipient_type: 'individual'
  to: string
  type: 'text' | 'image' | 'document' | 'audio' | 'video' | 'sticker' | 'location' | 'contacts' | 'interactive' | 'reaction' | 'template'
  text?: {
    preview_url?: boolean
    body: string
  }
  image?: {
    link: string
    caption?: string
  }
  document?: {
    link: string
    caption?: string
    filename?: string
  }
  audio?: {
    link: string
  }
  video?: {
    link: string
    caption?: string
  }
  sticker?: {
    link: string
  }
  location?: {
    latitude: number
    longitude: number
    name?: string
    address?: string
  }
  contacts?: {
    contacts: Array<{
      name: {
        formatted_name: string
        first_name?: string
        last_name?: string
      }
      phones: Array<{
        phone: string
        type?: string
        wa_id?: string
      }>
    }>
  }
  interactive?: {
    type: 'button' | 'list' | 'product' | 'product_list'
    body: {
      text: string
    }
    action: {
      buttons?: Array<{
        type: 'reply'
        reply: {
          id: string
          title: string
        }
      }>
      button?: string
      sections?: Array<{
        title: string
        rows: Array<{
          id: string
          title: string
          description?: string
        }>
      }>
    }
  }
  reaction?: {
    message_id: string
    emoji: string
  }
  template?: {
    name: string
    language: {
      code: string
    }
    components?: Array<{
      type: string
      parameters: Array<{
        type: string
        text: string
      }>
    }>
  }
}

export class WhatsAppAPI {
  private static instance: WhatsAppAPI
  // Remove top-level supabase client initialization
  // private supabase = createClient(...) 

  // Public property to expose the phone number ID
  public readonly phoneNumberId: string | undefined = WHATSAPP_PHONE_NUMBER_ID;

  private constructor() {
    // Debug environment variables
    console.log('WhatsApp API Environment Variables:', {
      phoneNumberId: WHATSAPP_PHONE_NUMBER_ID ? '***SET***' : '***NOT SET***',
      accessToken: WHATSAPP_ACCESS_TOKEN ? '***SET***' : '***NOT SET***',
      webhookToken: WHATSAPP_WEBHOOK_TOKEN ? '***SET***' : '***NOT SET***',
      appSecret: WHATSAPP_APP_SECRET ? '***SET***' : '***NOT SET***',
      apiVersion: WHATSAPP_API_VERSION,
      baseUrl: BASE_URL
    });
  }

  static getInstance(): WhatsAppAPI {
    if (!WhatsAppAPI.instance) {
      WhatsAppAPI.instance = new WhatsAppAPI()
    }
    return WhatsAppAPI.instance
  }

  private getSupabaseClient(): SupabaseClient | null {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not set for WhatsApp API.");
      return null;
    }

    return createClient(
      supabaseUrl,
      supabaseServiceKey,
      {
        auth: {
          persistSession: false
        }
      }
    );
  }

  async sendMessage(message: WhatsAppMessage) {
    try {
      // Validate required environment variables
      if (!WHATSAPP_PHONE_NUMBER_ID || !WHATSAPP_ACCESS_TOKEN || !WHATSAPP_APP_SECRET) {
        throw new Error('Missing required WhatsApp environment variables');
      }

      // Generate appsecret_proof
      const appSecretProof = generateAppSecretProof(WHATSAPP_ACCESS_TOKEN, WHATSAPP_APP_SECRET);

      // Log the request details (excluding sensitive data)
      console.log('Sending WhatsApp message:', {
        to: message.to,
        type: message.type,
        phoneNumberId: WHATSAPP_PHONE_NUMBER_ID,
        apiVersion: WHATSAPP_API_VERSION
      });

      const response = await fetch(`${BASE_URL}/${WHATSAPP_PHONE_NUMBER_ID}/messages?appsecret_proof=${appSecretProof}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      })

      if (!response.ok) {
        const errorBody = await response.text();
        console.error('WhatsApp API Error:', {
          status: response.status,
          statusText: response.statusText,
          errorBody,
          url: `${BASE_URL}/${WHATSAPP_PHONE_NUMBER_ID}/messages`
        });
        throw new Error(`Failed to send message: ${response.status} - ${errorBody}`);
      }

      const data = await response.json()
      console.log('WhatsApp API Success:', {
        messageId: data.messages?.[0]?.id,
        status: 'sent'
      });
      
      // Store message in Supabase
      const supabase = this.getSupabaseClient();
      if (!supabase) {
        console.error("Supabase client not available to store sent message.");
        throw new Error("Database connection not configured.");
      }

      await supabase
        .from('whatsapp_messages')
        .insert({
          message_id: data.messages[0].id,
          from_number: WHATSAPP_PHONE_NUMBER_ID,
          to_number: message.to,
          type: message.type,
          content: message,
          status: 'sent',
          created_at: new Date().toISOString(),
        })

      return data
    } catch (error) {
      console.error('Error sending WhatsApp message:', error)
      throw error
    }
  }

  async verifyWebhook(mode: string, token: string, challenge: string) {
    if (mode === 'subscribe' && token === WHATSAPP_WEBHOOK_TOKEN) {
      return challenge
    }
    throw new Error('Invalid webhook verification')
  }

  async handleWebhook(payload: any) {
    // Add logging to check environment variables at runtime
    console.log('Checking Supabase env vars in handleWebhook:', {
      SUPABASE_URL: process.env.SUPABASE_URL ? '***SET***' : '***NOT SET***',
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? '***SET***' : '***NOT SET***',
    });
    
    // Initialize Supabase client inside the handler
    const supabase = this.getSupabaseClient();
    if (!supabase) {
      console.error("Supabase client not available to handle webhook.");
      // Return an error response to Meta
      // Meta expects a 200 OK, but we can log the internal failure
      // Consider returning a specific error format if needed by Meta for debugging
      throw new Error("Server configuration error: Database connection missing for webhook.");
    }

    try {
      // Process incoming messages from the payload
      const entries = payload.entry;
      for (const entry of entries) {
        // Ensure there are changes and that they are related to messages
        if (!entry.changes || !Array.isArray(entry.changes)) continue; 

        for (const change of entry.changes) {
          if (change.field === 'messages') {
            const messages = change.value.messages;
             // Ensure there are messages
             if (!messages || !Array.isArray(messages) || messages.length === 0) continue;

            for (const incomingMessage of messages) {
              const messageType = incomingMessage.type;
              let contentToStore: any = null; // Initialize content to store
              let storedMessageType = messageType;

              console.log('Processing incoming message type:', messageType);
              console.log('Incoming message details:', incomingMessage); // Log full incoming message

              // Handle different message types for storage
              if (messageType === 'text') {
                contentToStore = { text: { body: incomingMessage.text?.body } };
              } else if (['image', 'audio', 'video', 'document', 'sticker'].includes(messageType)) {
                 const mediaId = incomingMessage[messageType]?.id;
                 const caption = incomingMessage[messageType]?.caption; // Get caption for media/video
                 const filename = incomingMessage[messageType]?.filename; // Get filename for document

                 console.log(`Incoming ${messageType} message. Media ID: ${mediaId}, Caption: ${caption}, Filename: ${filename}`);

                 if (mediaId) {
                     console.log(`Attempting to fetch media URL for ID: ${mediaId}`);
                     const mediaUrl = await this.fetchMediaUrl(mediaId);
                     console.log(`Fetched media URL: ${mediaUrl}`);

                     if (mediaUrl) {
                         console.log(`Attempting to upload media from URL: ${mediaUrl} to Supabase`);
                         const uploadedUrl = await this.uploadMediaToSupabase(mediaUrl, mediaId, messageType);
                         console.log(`Supabase uploaded URL: ${uploadedUrl}`);

                         if (uploadedUrl) {
                            // Structure the content to match MessageBubble expectations
                             contentToStore = {
                                 [messageType]: {
                                     link: uploadedUrl,
                                     ...(caption && { caption }), // Add caption if it exists
                                     ...(filename && { filename }), // Add filename if it exists
                                     // WhatsApp may provide a mime_type and sha256 for verification
                                      ...(incomingMessage[messageType]?.mime_type && { mime_type: incomingMessage[messageType].mime_type }),
                                      ...(incomingMessage[messageType]?.sha256 && { sha256: incomingMessage[messageType].sha256 }),
                                      ...(incomingMessage[messageType]?.id && { id: incomingMessage[messageType].id }), // Keep original media ID
                                 }
                             };
                             storedMessageType = messageType; // Store the original type
                             console.log('Content structured for storage:', contentToStore);
                         } else {
                             console.error('Failed to upload media to Supabase for ID:', mediaId);
                             contentToStore = { text: { body: `[Error: Failed to process ${messageType}]` } };
                             storedMessageType = 'text';
                         }
                     } else {
                         console.error('Failed to fetch media URL for ID:', mediaId);
                          contentToStore = { text: { body: `[Error: Could not retrieve ${messageType} URL]` } };
                         storedMessageType = 'text';
                     }
                 } else {
                      console.warn(`Incoming ${messageType} message is missing ID:`, incomingMessage);
                       contentToStore = { text: { body: `[Error: Received ${messageType} without ID]` } };
                       storedMessageType = 'text';
                 }
              } else if (messageType === 'reaction') {
                  // Handle reactions - typically don't need to display as a separate bubble but save
                  console.log('Received reaction message:', incomingMessage);
                   // Store the reaction details
                   contentToStore = { reaction: { message_id: incomingMessage.reaction.message_id, emoji: incomingMessage.reaction.emoji } };
                   storedMessageType = 'reaction';
              } else {
                // Handle other message types or store the raw content
                console.warn('Received message of unhandled type:', messageType, incomingMessage);
                contentToStore = incomingMessage[messageType]; // Store the raw content for inspection
                storedMessageType = messageType; // Store the original type
              }

              // Only attempt to save if contentToStore is not null
               if (contentToStore !== null) {
                  // Determine the status of the incoming message
                   const messageStatus = 'received'; // Incoming messages are initially received

                  // Save the processed message to Supabase
                  console.log('Saving message to Supabase:', { message_id: incomingMessage.id, from_number: incomingMessage.from, type: storedMessageType, status: messageStatus, content: contentToStore });

                  const { error: insertError } = await supabase
                    .from('whatsapp_messages')
                    .insert({
                      message_id: incomingMessage.id,
                      from_number: incomingMessage.from,
                      to_number: change.value.metadata.phone_number_id, // Our phone number ID
                      type: storedMessageType, // Use the determined stored type
                      content: contentToStore, // Store the processed content
                      status: messageStatus,
                      created_at: new Date(parseInt(incomingMessage.timestamp, 10) * 1000).toISOString(), // Convert timestamp to ISO string
                    });

                  if (insertError) {
                    console.error('Error saving incoming message to Supabase:', insertError);
                  } else {
                      console.log('Successfully saved incoming message to Supabase.', incomingMessage.id);
                  }
               } else {
                   console.error('Skipping save for incoming message due to null content:', incomingMessage);
               }
            }
             // TODO: Handle changes.value.statuses for message status updates
             if (change.value.statuses && Array.isArray(change.value.statuses)) {
                 for (const statusUpdate of change.value.statuses) {
                     console.log('Received status update:', statusUpdate);
                      // Find the message in the database by message_id and update its status
                     const { data: updatedMessages, error: updateError } = await supabase
                         .from('whatsapp_messages')
                         .update({ status: statusUpdate.status })
                         .eq('message_id', statusUpdate.id);

                     if (updateError) {
                         console.error('Error updating message status in Supabase:', updateError);
                     } else {
                         console.log('Successfully updated message status:', statusUpdate.status, 'for message_id:', statusUpdate.id);
                     }
                 }
             }

             // TODO: Handle changes.value.contacts for new/updated contacts
             if (change.value.contacts && Array.isArray(change.value.contacts)) {
                 for (const contactUpdate of change.value.contacts) {
                     console.log('Received contact update:', contactUpdate);
                      // Upsert the contact information
                     const { data: upsertedContact, error: upsertError } = await supabase
                         .from('whatsapp_contacts')
                         .upsert({
                             wa_id: contactUpdate.wa_id,
                             profile: contactUpdate.profile,
                             // Add other contact fields as needed
                         }, { onConflict: 'wa_id' });

                     if (upsertError) {
                         console.error('Error upserting contact in Supabase:', upsertError);
                     } else {
                         console.log('Successfully upserted contact:', contactUpdate.wa_id);
                     }
                 }
             }

          }
        }
      }

      // Respond to Meta with a 200 OK
      return { status: 200, body: 'Event received' };

    } catch (error) {
      console.error('Error processing webhook payload:', error);
      // Respond with an error status if processing failed, though Meta usually expects 200 OK
       return { status: 500, body: 'Internal Server Error' };
    }
  }

  // Helper function to fetch media URL from WhatsApp API
  private async fetchMediaUrl(mediaId: string): Promise<string | null> {
      if (!WHATSAPP_ACCESS_TOKEN) {
          console.error('WHATSAPP_ACCESS_TOKEN is not set for fetching media.');
          return null;
      }

      console.log('Fetching media URL from WhatsApp API for ID:', mediaId);
      try {
          const response = await fetch(`${BASE_URL}/${mediaId}`, {
              headers: {
                  'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
              },
          });

          if (!response.ok) {
              const errorBody = await response.text();
              console.error('WhatsApp Media Fetch Error: Response not OK', { 
                  status: response.status, 
                  statusText: response.statusText, 
                  errorBody: errorBody.substring(0, 500), // Log a part of the body to avoid flooding logs
                  mediaId 
              });
              return null;
          }

          const data = await response.json();
           console.log('WhatsApp Media Fetch Response Data:', data);
          return data.url; // The URL to download the media

      } catch (error) {
          console.error('Error fetching media URL from WhatsApp API:', error, { mediaId });
          return null;
      }
  }

  // Helper function to download media and upload to Supabase Storage
  private async uploadMediaToSupabase(mediaUrl: string, mediaId: string, messageType: string): Promise<string | null> {
       const supabase = this.getSupabaseClient();
       if (!supabase) {
           console.error('Supabase client not available for media upload in webhook.');
           return null;
       }

       console.log('Downloading media from WhatsApp URL and uploading to Supabase:', mediaUrl);
       try {
           // Fetch the media data
           const mediaResponse = await fetch(mediaUrl, {
               headers: {
                   'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
               },
           });

           if (!mediaResponse.ok) {
               console.error('Failed to download media from WhatsApp:', { status: mediaResponse.status, mediaUrl });
               return null;
           }

           // Get the blob data
           const mediaBlob = await mediaResponse.blob();
            console.log('Downloaded media blob:', mediaBlob);

           // Determine file extension from mime type if available
            let fileExtension = '';
            if (mediaBlob.type) {
                const mimeParts = mediaBlob.type.split('/');
                if (mimeParts.length > 1) {
                    fileExtension = '.' + mimeParts[1];
                }
            }
             // Fallback extension based on message type if mime type is generic or missing
            if (!fileExtension) {
                switch(messageType) {
                    case 'image': fileExtension = '.jpg'; break; // Common fallback
                    case 'audio': fileExtension = '.mp3'; break; // Common fallback
                    case 'video': fileExtension = '.mp4'; break; // Common fallback
                    case 'document': fileExtension = '.bin'; break; // Generic binary fallback
                    default: fileExtension = '';
                }
            }

           // Define the storage path and filename
           // Using a simple path structure like `media/<messageType>/<mediaId>.<ext>`
           const filePath = `media/${messageType}/${mediaId}${fileExtension}`;
            console.log('Uploading media to Supabase path:', filePath);

           // Upload the blob to Supabase Storage
           const { data, error: uploadError } = await supabase.storage
               .from('whatsappt-multimedia') // Your Supabase bucket name
               .upload(filePath, mediaBlob, {
                   contentType: mediaBlob.type || undefined, // Include content type if known
               });

           if (uploadError) {
               console.error('Error uploading media blob to Supabase:', uploadError, { filePath });
               return null;
           }

           // Get the public URL
           const { data: publicUrlData } = supabase.storage
               .from('whatsappt-multimedia') // Your Supabase bucket name
               .getPublicUrl(filePath);

            if (!publicUrlData?.publicUrl) {
                console.error('Error getting public URL after upload:', { filePath });
                return null;
            }

           console.log('Successfully uploaded media to Supabase. Public URL:', publicUrlData.publicUrl);
           return publicUrlData.publicUrl;

       } catch (error) {
           console.error('Error in uploadMediaToSupabase:', error, { mediaUrl, mediaId, messageType });
           return null;
       }
  }

  // Helper function to upload media to WhatsApp Cloud API
  async uploadMediaToWhatsApp(file: File): Promise<string | null> {
    if (!WHATSAPP_PHONE_NUMBER_ID || !WHATSAPP_ACCESS_TOKEN) {
        console.error('WHATSAPP_PHONE_NUMBER_ID or WHATSAPP_ACCESS_TOKEN is not set for uploading media.');
        return null;
    }

    const formData = new FormData();
    formData.append('messaging_product', 'whatsapp');
    formData.append('file', file);
    // WhatsApp API requires the 'type' parameter which is the MIME type
     formData.append('type', file.type);

    console.log('Uploading media to WhatsApp API...', file.name, file.type);

    try {
         // The WhatsApp API expects multipart/form-data for media uploads
        const response = await fetch(`${BASE_URL}/${WHATSAPP_PHONE_NUMBER_ID}/media`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
                // Do NOT set Content-Type for FormData, fetch will set it automatically with boundary
            },
            body: formData,
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error('WhatsApp Media Upload Error: Response not OK', { 
                status: response.status, 
                statusText: response.statusText, 
                errorBody: errorBody.substring(0, 500) 
            });
            return null;
        }

        const data = await response.json();
        console.log('WhatsApp Media Upload Success Data:', data);
         // The response contains the media ID
        return data.id; 

    } catch (error) {
        console.error('Error uploading media to WhatsApp API:', error);
        return null;
    }
}
}

export const whatsappApi = WhatsAppAPI.getInstance() 