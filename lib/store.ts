import { create } from "zustand"
import type { Campaign, Contact, Group, Config } from "./types"

interface AppState {
  // Campaigns
  campaigns: Campaign[]
  setCampaigns: (campaigns: Campaign[]) => void
  addCampaign: (campaign: Campaign) => void
  updateCampaign: (id: string, campaign: Partial<Campaign>) => void
  removeCampaign: (id: string) => void

  // Contacts
  contacts: Contact[]
  setContacts: (contacts: Contact[]) => void
  addContact: (contact: Contact) => void
  updateContact: (id: string, contact: Partial<Contact>) => void
  removeContact: (id: string) => void

  // Groups
  groups: Group[]
  setGroups: (groups: Group[]) => void
  addGroup: (group: Group) => void
  updateGroup: (id: string, group: Partial<Group>) => void
  removeGroup: (id: string) => void

  // Config
  configs: Config[]
  setConfigs: (configs: Config[]) => void
  addConfig: (config: Config) => void
  updateConfig: (id: string, config: Partial<Config>) => void
  removeConfig: (id: string) => void

  // UI State
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
  error: string | null
  setError: (error: string | null) => void
}

export const useAppStore = create<AppState>((set) => ({
  // Campaigns
  campaigns: [],
  setCampaigns: (campaigns) => set({ campaigns }),
  addCampaign: (campaign) => set((state) => ({ campaigns: [campaign, ...state.campaigns] })),
  updateCampaign: (id, updates) =>
    set((state) => ({
      campaigns: state.campaigns.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    })),
  removeCampaign: (id) => set((state) => ({ campaigns: state.campaigns.filter((c) => c.id !== id) })),

  // Contacts
  contacts: [],
  setContacts: (contacts) => set({ contacts }),
  addContact: (contact) => set((state) => ({ contacts: [contact, ...state.contacts] })),
  updateContact: (id, updates) =>
    set((state) => ({
      contacts: state.contacts.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    })),
  removeContact: (id) => set((state) => ({ contacts: state.contacts.filter((c) => c.id !== id) })),

  // Groups
  groups: [],
  setGroups: (groups) => set({ groups }),
  addGroup: (group) => set((state) => ({ groups: [group, ...state.groups] })),
  updateGroup: (id, updates) =>
    set((state) => ({
      groups: state.groups.map((g) => (g.id === id ? { ...g, ...updates } : g)),
    })),
  removeGroup: (id) => set((state) => ({ groups: state.groups.filter((g) => g.id !== id) })),

  // Config
  configs: [],
  setConfigs: (configs) => set({ configs }),
  addConfig: (config) => set((state) => ({ configs: [config, ...state.configs] })),
  updateConfig: (id, updates) =>
    set((state) => ({
      configs: state.configs.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    })),
  removeConfig: (id) => set((state) => ({ configs: state.configs.filter((c) => c.id !== id) })),

  // UI State
  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),
  error: null,
  setError: (error) => set({ error }),
}))
