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
  }
}

export class WhatsAppAPI {
  private static instance: WhatsAppAPI
  // Remove top-level supabase client initialization
  // private supabase = createClient(...) 

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

    console.log('Received webhook payload:', JSON.stringify(payload, null, 2));
    try {
      const { object, entry } = payload

      if (object !== 'whatsapp_business_account') {
        console.log('Payload object is not whatsapp_business_account, ignoring.');
        return
      }

      for (const entryItem of entry) {
        console.log('Processing entry item:', JSON.stringify(entryItem, null, 2));
        const { changes } = entryItem
        for (const change of changes) {
          console.log('Processing change:', JSON.stringify(change, null, 2));
          if (change.field === 'messages') {
            console.log('Found messages change.');
            const { value } = change
            console.log('Messages value:', JSON.stringify(value, null, 2));
            const { messages, contacts } = value

            if (messages && messages.length > 0) {
              for (const message of messages) {
                console.log('Processing message:', JSON.stringify(message, null, 2));
                
                // Extract the 'to' number from metadata for incoming messages
                const toPhoneNumber = value.metadata.phone_number_id;

                // Store incoming message in Supabase
                const { data, error } = await supabase
                  .from('whatsapp_messages')
                  .insert({
                    message_id: message.id,
                    from_number: message.from,
                    to_number: toPhoneNumber, // Use the extracted 'to' number
                    type: message.type,
                    content: message,
                    status: 'received',
                    created_at: new Date().toISOString(),
                  })

                if (error) {
                  console.error('Error inserting incoming message into Supabase:', error);
                } else {
                  console.log('Successfully inserted incoming message:', data);
                }

                // Store contact if new
                if (contacts && contacts.length > 0) {
                  const contact = contacts[0]
                  console.log('Processing contact:', JSON.stringify(contact, null, 2));
                  const { data: contactData, error: contactError } = await supabase
                    .from('whatsapp_contacts')
                    .upsert({
                      wa_id: contact.wa_id,
                      profile: {
                        name: contact.profile?.name,
                      },
                      updated_at: new Date().toISOString(),
                    }, { onConflict: 'wa_id' })
                    
                  if (contactError) {
                    console.error('Error upserting contact into Supabase:', contactError);
                  } else {
                    console.log('Successfully upserted contact:', contactData);
                  }
                }
              }
            } else {
              console.log('No messages found in the change value.');
            }
          }
        }
      }
    } catch (error) {
      console.error('Unhandled error handling webhook:', error);
      throw error; // Re-throw the error so the route handler catches it
    }
  }
}

export const whatsappApi = WhatsAppAPI.getInstance() 