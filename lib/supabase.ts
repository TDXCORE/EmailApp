import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Debug helper
const debugLog = (message: string, data?: any) => {
  console.log(`[SUPABASE DEBUG] ${message}`, data || "")
}

// Create a single instance for server-side usage
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== "undefined" ? window.localStorage : undefined,
  },
})

// Client-side singleton with enhanced configuration
let supabaseClient: ReturnType<typeof createClient> | null = null

export const getSupabaseClient = () => {
  if (typeof window === "undefined") {
    // Server-side: return a new instance
    debugLog("Creating server-side client")
    return createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    })
  }

  if (!supabaseClient) {
    debugLog("Creating client-side singleton")
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: {
          getItem: (key: string) => {
            try {
              const item = window.localStorage.getItem(key)
              debugLog(`Storage getItem: ${key}`, item ? "found" : "not found")
              return item
            } catch (error) {
              debugLog(`Storage getItem error for ${key}`, error)
              return null
            }
          },
          setItem: (key: string, value: string) => {
            try {
              window.localStorage.setItem(key, value)
              debugLog(`Storage setItem: ${key}`, "success")
            } catch (error) {
              debugLog(`Storage setItem error for ${key}`, error)
            }
          },
          removeItem: (key: string) => {
            try {
              window.localStorage.removeItem(key)
              debugLog(`Storage removeItem: ${key}`, "success")
            } catch (error) {
              debugLog(`Storage removeItem error for ${key}`, error)
            }
          },
        },
      },
    })

    // Add auth state change listener for debugging
    supabaseClient.auth.onAuthStateChange((event, session) => {
      debugLog(`Auth state change: ${event}`, {
        userId: session?.user?.id,
        email: session?.user?.email,
        hasAccessToken: !!session?.access_token,
        hasRefreshToken: !!session?.refresh_token,
      })
    })
  }

  return supabaseClient
}
