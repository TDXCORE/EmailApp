export interface Profile {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  role: "admin" | "user"
  created_at: string
  updated_at: string
}

export interface Group {
  id: string
  name: string
  description?: string
  user_id: string
  created_at: string
  updated_at: string
  contact_count?: number
}

export interface Contact {
  id: string
  email: string
  first_name?: string
  last_name?: string
  phone?: string
  status: "active" | "unsubscribed" | "bounced"
  user_id: string
  created_at: string
  updated_at: string
  groups?: Group[]
}

export interface Campaign {
  id: string
  name: string
  subject: string
  content: string
  status: "draft" | "sent" | "scheduled" | "paused"
  scheduled_at?: string
  sent_at?: string
  user_id: string
  created_at: string
  updated_at: string
  groups?: Group[]
  metrics?: CampaignMetrics
}

export interface CampaignMetrics {
  sent: number
  opened: number
  clicked: number
  bounced: number
  unsubscribed: number
  open_rate: number
  click_rate: number
  bounce_rate: number
}

export interface EmailMetric {
  id: string
  campaign_id: string
  contact_id: string
  sent_at: string
  opened_at?: string
  clicked_at?: string
  bounced_at?: string
  unsubscribed_at?: string
  user_id: string
}

export interface Config {
  id: string
  key: string
  value: string
  description?: string
  user_id: string
  created_at: string
  updated_at: string
}
