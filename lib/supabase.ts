import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

// Create a single instance for client-side usage
export const supabase = createClientComponentClient()

// Debug helper
const debugLog = (message: string, data?: any) => {
  console.log(`[SUPABASE DEBUG] ${message}`, data || "")
}

// Log when the client is created
debugLog("Creating client-side singleton")
