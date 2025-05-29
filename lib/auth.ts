"use client"

import { getSupabaseClient } from "./supabase"
import type { Profile } from "./types"

// Add debugging helper
const debugLog = (message: string, data?: any) => {
  console.log(`[AUTH DEBUG] ${message}`, data || "")
}

export const signIn = async (email: string, password: string) => {
  try {
    const supabase = getSupabaseClient()
    debugLog("Starting sign in process", { email })

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      debugLog("Sign in error", error)
      return { data: null, error }
    }

    if (data.session) {
      debugLog("Sign in successful", {
        userId: data.session.user.id,
        email: data.session.user.email,
        accessToken: data.session.access_token ? "present" : "missing",
        refreshToken: data.session.refresh_token ? "present" : "missing",
      })

      // Store session data in localStorage as backup
      try {
        localStorage.setItem("supabase.auth.token", JSON.stringify(data.session))
        debugLog("Session stored in localStorage")
      } catch (storageError) {
        debugLog("Failed to store session in localStorage", storageError)
      }

      // Verify session was set correctly
      const { data: sessionCheck } = await supabase.auth.getSession()
      debugLog("Session verification", {
        sessionExists: !!sessionCheck.session,
        userId: sessionCheck.session?.user?.id,
      })
    } else {
      debugLog("No session returned from sign in")
    }

    return { data, error: null }
  } catch (error: any) {
    debugLog("Sign in exception", error)
    return { data: null, error: { message: "Error de conexión" } }
  }
}

export const signUp = async (email: string, password: string, fullName?: string) => {
  try {
    const supabase = getSupabaseClient()

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
  } catch (error: any) {
    console.error("Sign up exception:", error)
    return { data: null, error: { message: "Error de conexión" } }
  }
}

export const signOut = async () => {
  try {
    const supabase = getSupabaseClient()
    debugLog("Starting sign out process")

    // Clear localStorage backup
    try {
      localStorage.removeItem("supabase.auth.token")
      debugLog("Cleared localStorage session")
    } catch (storageError) {
      debugLog("Failed to clear localStorage", storageError)
    }

    const { error } = await supabase.auth.signOut()

    if (error) {
      debugLog("Sign out error", error)
    } else {
      debugLog("Sign out successful")
    }

    return { error }
  } catch (error: any) {
    debugLog("Sign out exception", error)
    return { error: { message: "Error de conexión" } }
  }
}

export const getCurrentUser = async () => {
  try {
    const supabase = getSupabaseClient()

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error) {
      debugLog("Get user error", error)
      return null
    }

    debugLog("Get user result", { userId: user?.id, email: user?.email })
    return user
  } catch (error: any) {
    debugLog("Get user exception", error)
    return null
  }
}

export const getSession = async () => {
  try {
    const supabase = getSupabaseClient()

    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()

    if (error) {
      debugLog("Get session error", error)
      return null
    }

    debugLog("Get session result", {
      sessionExists: !!session,
      userId: session?.user?.id,
      email: session?.user?.email,
    })

    return session
  } catch (error: any) {
    debugLog("Get session exception", error)
    return null
  }
}

export const getProfile = async (userId: string): Promise<Profile | null> => {
  try {
    const supabase = getSupabaseClient()

    const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single()

    if (error) {
      debugLog("Get profile error", error)
      return null
    }

    return data
  } catch (error: any) {
    debugLog("Get profile exception", error)
    return null
  }
}

export const createProfile = async (profile: Partial<Profile>) => {
  try {
    const supabase = getSupabaseClient()

    const { data, error } = await supabase.from("profiles").insert(profile).select().single()

    if (error) {
      debugLog("Create profile error", error)
    }

    return { data, error }
  } catch (error: any) {
    debugLog("Create profile exception", error)
    return { data: null, error: { message: "Error de conexión" } }
  }
}
