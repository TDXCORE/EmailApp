import { createClient } from '@supabase/supabase-js'

const WHATSAPP_API_VERSION = 'v18.0'
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN
const WHATSAPP_WEBHOOK_TOKEN = process.env.WHATSAPP_WEBHOOK_TOKEN

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

const BASE_URL = `https://graph.facebook.com/${WHATSAPP_API_VERSION}`

export interface WhatsAppMessage {
  messaging_product: 'whatsapp'
  recipient_type: 'individual'
  to: string
  type: 'text' | 'image' | 'document' | 'audio' | 'video' | 'sticker' | 'location' | 'contacts' | 'interactive' | 'reaction'
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
}

export class WhatsAppAPI {
  private static instance: WhatsAppAPI
  private supabase = createClient(
    SUPABASE_URL,
    SUPABASE_SERVICE_KEY,
    {
      auth: {
        persistSession: false
      }
    }
  )

  private constructor() {}

  static getInstance(): WhatsAppAPI {
    if (!WhatsAppAPI.instance) {
      WhatsAppAPI.instance = new WhatsAppAPI()
    }
    return WhatsAppAPI.instance
  }

  async sendMessage(message: WhatsAppMessage) {
    try {
      const response = await fetch(`${BASE_URL}/${WHATSAPP_PHONE_NUMBER_ID}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      })

      if (!response.ok) {
        throw new Error(`Failed to send message: ${response.statusText}`)
      }

      const data = await response.json()
      
      // Store message in Supabase
      await this.supabase
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
                // Store incoming message in Supabase
                const { data, error } = await this.supabase
                  .from('whatsapp_messages')
                  .insert({
                    message_id: message.id,
                    from_number: message.from,
                    to_number: message.to,
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
                  const { data: contactData, error: contactError } = await this.supabase
                    .from('whatsapp_contacts')
                    .upsert({
                      wa_id: contact.wa_id,
                      profile: {
                        name: contact.profile?.name,
                      },
                      updated_at: new Date().toISOString(),
                    })
                    
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