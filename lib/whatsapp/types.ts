export type WhatsAppMessageType =
  | 'text'
  | 'image'
  | 'video'
  | 'audio'
  | 'document'
  | 'sticker'
  | 'contact'
  | 'location'
  | 'reaction'
  | 'reply'

export interface WhatsAppMessage {
  id: string
  conversationId: string
  senderId: string
  senderName?: string
  type: WhatsAppMessageType
  text?: string
  mediaUrl?: string
  mediaMimeType?: string
  mediaFilename?: string
  mediaCaption?: string
  stickerUrl?: string
  stickerEmoji?: string
  contactName?: string
  contactPhone?: string
  locationName?: string
  latitude?: number
  longitude?: number
  reactionEmoji?: string
  reactedToMessageId?: string
  replyToMessageId?: string
  status: 'sent' | 'delivered' | 'read' | 'failed'
  timestamp: Date
  isOutgoing: boolean
}

export interface Contact {
  id: string;
  wa_id: string;
  profile?: { name?: string };
}

export interface WhatsAppConversation {
  id: string
  contactId: string
  contactName?: string
  contactProfilePic?: string
  isBlocked?: boolean
  lastMessage?: WhatsAppMessage
  unreadCount?: number
  isGroup?: boolean
  groupName?: string
  groupProfilePic?: string
  statusMessage?: string
}

export interface WhatsAppContactProfile {
  id: string
  name: string
  phone: string
  profilePicUrl?: string
  statusMessage?: string
  isBlocked?: boolean
} 