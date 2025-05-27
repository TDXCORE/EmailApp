"use client"

import { supabase } from "./supabase"
import type { Profile } from "./types"

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  return { data, error }
}

export const signUp = async (email: string, password: string, fullName?: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  })
  return { data, error }
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  return { error }
}

export const getCurrentUser = async () => {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}

export const getProfile = async (userId: string): Promise<Profile | null> => {
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single()

  if (error) return null
  return data
}

export const createProfile = async (profile: Partial<Profile>) => {
  const { data, error } = await supabase.from("profiles").insert(profile).select().single()

  return { data, error }
}
