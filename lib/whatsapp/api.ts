import { WhatsAppMessage, WhatsAppConversation, WhatsAppContactProfile } from './types'

export class WhatsAppAPI {
  private apiKey: string
  private apiSecret: string

  constructor(apiKey: string, apiSecret: string) {
    this.apiKey = apiKey
    this.apiSecret = apiSecret
  }

  // Text messages
  async sendTextMessage(to: string, text: string): Promise<WhatsAppMessage> {
    // Implementación pendiente
    throw new Error('Not implemented')
  }

  // Media messages
  async sendImage(to: string, imageUrl: string, caption?: string): Promise<WhatsAppMessage> {
    // Implementación pendiente
    throw new Error('Not implemented')
  }

  // Contact management
  async getContactProfile(phoneNumber: string): Promise<WhatsAppContactProfile> {
    // Implementación pendiente
    throw new Error('Not implemented')
  }

  // Conversations
  async getConversations(): Promise<WhatsAppConversation[]> {
    // Implementación pendiente
    throw new Error('Not implemented')
  }
} 