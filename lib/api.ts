import { supabase } from "./supabase"
import type { Campaign, Contact, Group, Config, CampaignMetrics } from "./types"
import { getCurrentUser } from "./auth"

// Groups API
export const getGroups = async (): Promise<Group[]> => {
  const { data, error } = await supabase
    .from("groups")
    .select(`
      *,
      contact_count:contact_groups(count)
    `)
    .order("created_at", { ascending: false })

  if (error) throw error
  return data || []
}

export const createGroup = async (group: Partial<Group>) => {
  const user = await getCurrentUser()
  if (!user) throw new Error("User not authenticated")

  const { data, error } = await supabase
    .from("groups")
    .insert({ ...group, user_id: user.id })
    .select()
    .single()

  if (error) throw error
  return data
}

export const updateGroup = async (id: string, updates: Partial<Group>) => {
  const { data, error } = await supabase.from("groups").update(updates).eq("id", id).select().single()

  if (error) throw error
  return data
}

export const deleteGroup = async (id: string) => {
  const { error } = await supabase.from("groups").delete().eq("id", id)
  if (error) throw error
}

// Contacts API
export const getContacts = async (): Promise<Contact[]> => {
  const { data, error } = await supabase
    .from("contacts")
    .select(`
      *,
      groups:contact_groups(
        group:groups(*)
      )
    `)
    .order("created_at", { ascending: false })

  if (error) throw error
  return (
    data?.map((contact) => ({
      ...contact,
      groups: contact.groups?.map((cg: any) => cg.group) || [],
    })) || []
  )
}

export const createContact = async (contact: Partial<Contact>) => {
  const user = await getCurrentUser()
  if (!user) throw new Error("User not authenticated")

  const { data, error } = await supabase
    .from("contacts")
    .insert({ ...contact, user_id: user.id })
    .select()
    .single()

  if (error) throw error
  return data
}

export const updateContact = async (id: string, updates: Partial<Contact>) => {
  const { data, error } = await supabase.from("contacts").update(updates).eq("id", id).select().single()

  if (error) throw error
  return data
}

export const deleteContact = async (id: string) => {
  const { error } = await supabase.from("contacts").delete().eq("id", id)
  if (error) throw error
}

export const addContactToGroup = async (contactId: string, groupId: string) => {
  const { error } = await supabase.from("contact_groups").insert({ contact_id: contactId, group_id: groupId })

  if (error) throw error
}

export const removeContactFromGroup = async (contactId: string, groupId: string) => {
  const { error } = await supabase.from("contact_groups").delete().eq("contact_id", contactId).eq("group_id", groupId)

  if (error) throw error
}

// Campaigns API
export const getCampaigns = async (): Promise<Campaign[]> => {
  const { data, error } = await supabase
    .from("campaigns")
    .select(`
      *,
      groups:campaign_groups(
        group:groups(*)
      )
    `)
    .order("created_at", { ascending: false })

  if (error) throw error
  return (
    data?.map((campaign) => ({
      ...campaign,
      groups: campaign.groups?.map((cg: any) => cg.group) || [],
    })) || []
  )
}

export const createCampaign = async (campaign: Partial<Campaign>) => {
  const user = await getCurrentUser()
  if (!user) throw new Error("User not authenticated")

  const { data, error } = await supabase
    .from("campaigns")
    .insert({ ...campaign, user_id: user.id })
    .select()
    .single()

  if (error) throw error
  return data
}

export const updateCampaign = async (id: string, updates: Partial<Campaign>) => {
  const { data, error } = await supabase.from("campaigns").update(updates).eq("id", id).select().single()

  if (error) throw error
  return data
}

export const deleteCampaign = async (id: string) => {
  const { error } = await supabase.from("campaigns").delete().eq("id", id)
  if (error) throw error
}

export const addCampaignToGroup = async (campaignId: string, groupId: string) => {
  const { error } = await supabase.from("campaign_groups").insert({ campaign_id: campaignId, group_id: groupId })

  if (error) throw error
}

export const removeCampaignFromGroup = async (campaignId: string, groupId: string) => {
  const { error } = await supabase
    .from("campaign_groups")
    .delete()
    .eq("campaign_id", campaignId)
    .eq("group_id", groupId)

  if (error) throw error
}

// Email Metrics API
export const createEmailMetric = async (metric: {
  campaign_id: string
  contact_id: string
  sent_at: string
}) => {
  const user = await getCurrentUser()
  if (!user) throw new Error("User not authenticated")

  const { data, error } = await supabase
    .from("email_metrics")
    .insert({ ...metric, user_id: user.id })
    .select()
    .single()

  if (error) throw error
  return data
}

export const updateEmailMetric = async (
  id: string,
  updates: {
    opened_at?: string
    clicked_at?: string
    bounced_at?: string
    unsubscribed_at?: string
  },
) => {
  const { data, error } = await supabase.from("email_metrics").update(updates).eq("id", id).select().single()

  if (error) throw error
  return data
}

// Metrics API
export const getCampaignMetrics = async (campaignId: string): Promise<CampaignMetrics> => {
  const { data, error } = await supabase.from("email_metrics").select("*").eq("campaign_id", campaignId)

  if (error) throw error

  const metrics = data || []
  const sent = metrics.length
  const opened = metrics.filter((m) => m.opened_at).length
  const clicked = metrics.filter((m) => m.clicked_at).length
  const bounced = metrics.filter((m) => m.bounced_at).length
  const unsubscribed = metrics.filter((m) => m.unsubscribed_at).length

  return {
    sent,
    opened,
    clicked,
    bounced,
    unsubscribed,
    open_rate: sent > 0 ? (opened / sent) * 100 : 0,
    click_rate: sent > 0 ? (clicked / sent) * 100 : 0,
    bounce_rate: sent > 0 ? (bounced / sent) * 100 : 0,
  }
}

export const getDashboardMetrics = async () => {
  const { data: campaigns } = await supabase.from("campaigns").select("id")
  const { data: contacts } = await supabase.from("contacts").select("id")
  const { data: groups } = await supabase.from("groups").select("id")
  const { data: metrics } = await supabase.from("email_metrics").select("*")

  const totalSent = metrics?.length || 0
  const totalOpened = metrics?.filter((m) => m.opened_at).length || 0
  const totalClicked = metrics?.filter((m) => m.clicked_at).length || 0
  const totalBounced = metrics?.filter((m) => m.bounced_at).length || 0

  return {
    totalCampaigns: campaigns?.length || 0,
    totalContacts: contacts?.length || 0,
    totalGroups: groups?.length || 0,
    totalSent,
    totalOpened,
    totalClicked,
    totalBounced,
    openRate: totalSent > 0 ? (totalOpened / totalSent) * 100 : 0,
    clickRate: totalSent > 0 ? (totalClicked / totalSent) * 100 : 0,
    bounceRate: totalSent > 0 ? (totalBounced / totalSent) * 100 : 0,
  }
}

// Config API
export const getConfigs = async (): Promise<Config[]> => {
  const { data, error } = await supabase.from("config").select("*").order("key")
  if (error) throw error
  return data || []
}

export const createConfig = async (config: Partial<Config>) => {
  const user = await getCurrentUser()
  if (!user) throw new Error("User not authenticated")

  const { data, error } = await supabase
    .from("config")
    .insert({ ...config, user_id: user.id })
    .select()
    .single()

  if (error) throw error
  return data
}

export const updateConfig = async (id: string, updates: Partial<Config>) => {
  const { data, error } = await supabase.from("config").update(updates).eq("id", id).select().single()

  if (error) throw error
  return data
}

export const deleteConfig = async (id: string) => {
  const { error } = await supabase.from("config").delete().eq("id", id)
  if (error) throw error
}

// Send Campaign API
export const sendCampaign = async (campaignId: string) => {
  const user = await getCurrentUser()
  if (!user) throw new Error("User not authenticated")

  // Get campaign with groups and contacts
  const { data: campaign, error: campaignError } = await supabase
    .from("campaigns")
    .select(`
      *,
      groups:campaign_groups(
        group:groups(
          contacts:contact_groups(
            contact:contacts(*)
          )
        )
      )
    `)
    .eq("id", campaignId)
    .single()

  if (campaignError) throw campaignError

  // Get all contacts from campaign groups
  const contacts: Contact[] = []
  campaign.groups?.forEach((cg: any) => {
    cg.group.contacts?.forEach((cc: any) => {
      if (cc.contact.status === "active") {
        contacts.push(cc.contact)
      }
    })
  })

  if (contacts.length === 0) {
    throw new Error("No active contacts found in campaign groups")
  }

  // Import email service
  const { emailService } = await import("./email-service")

  // Send emails
  const emails = contacts.map((contact) => ({
    to: contact.email,
    subject: campaign.subject,
    htmlBody: campaign.content,
  }))

  const result = await emailService.sendBulkEmail(emails)

  // Create email metrics for sent emails
  const now = new Date().toISOString()
  const metrics = contacts.map((contact) => ({
    campaign_id: campaignId,
    contact_id: contact.id,
    sent_at: now,
    user_id: user.id,
  }))

  await supabase.from("email_metrics").insert(metrics)

  // Update campaign status
  await updateCampaign(campaignId, {
    status: "sent",
    sent_at: now,
  })

  return {
    totalSent: result.success,
    totalFailed: result.failed,
    errors: result.errors,
  }
}
