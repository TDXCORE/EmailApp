"use client"

import { supabase } from "./supabase"
import type { Profile } from "./types"

export const signIn = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error("Sign in error:", error)
    }

    return { data, error }
  } catch (error) {
    console.error("Sign in exception:", error)
    return { data: null, error: { message: "Error de conexión" } }
  }
}

export const signUp = async (email: string, password: string, fullName?: string) => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    })

    if (error) {
      console.error("Sign up error:", error)
    }

    return { data, error }
  } catch (error) {
    console.error("Sign up exception:", error)
    return { data: null, error: { message: "Error de conexión" } }
  }
}

export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error("Sign out error:", error)
    }

    return { error }
  } catch (error) {
    console.error("Sign out exception:", error)
    return { error: { message: "Error de conexión" } }
  }
}

export const getCurrentUser = async () => {
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error) {
      console.error("Get user error:", error)
      return null
    }

    return user
  } catch (error) {
    console.error("Get user exception:", error)
    return null
  }
}

export const getProfile = async (userId: string): Promise<Profile | null> => {
  try {
    const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single()

    if (error) {
      console.error("Get profile error:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Get profile exception:", error)
    return null
  }
}

export const createProfile = async (profile: Partial<Profile>) => {
  try {
    const { data, error } = await supabase.from("profiles").insert(profile).select().single()

    if (error) {
      console.error("Create profile error:", error)
    }

    return { data, error }
  } catch (error) {
    console.error("Create profile exception:", error)
    return { data: null, error: { message: "Error de conexión" } }
  }
}
