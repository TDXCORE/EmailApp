"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Sidebar } from "@/components/layout/sidebar"
import { Toaster } from "@/components/ui/toaster"
import { getSupabaseClient } from "@/lib/supabase"
import type { User } from "@supabase/supabase-js"

// Debug helper
const debugLog = (message: string, data?: any) => {
  console.log(`[CLIENT LAYOUT DEBUG] ${message}`, data || "")
}

export function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [initializing, setInitializing] = useState(true)
  const pathname = usePathname()
  const router = useRouter()
  const supabase = getSupabaseClient()

  const isLoginPage = pathname === "/login"
  const isUnsubscribePage = pathname === "/unsubscribe" || pathname.startsWith("/unsubscribe")
  const isApiRoute = pathname.startsWith("/api/")
  const isRootPage = pathname === "/"

  debugLog(`Rendering layout for: ${pathname}`, {
    isLoginPage,
    isUnsubscribePage,
    isApiRoute,
    isRootPage,
  })

  useEffect(() => {
    let mounted = true
    debugLog("Starting auth initialization")

    const initializeAuth = async () => {
      try {
        debugLog("Getting initial session...")

        // Get initial session
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()

        if (error) {
          debugLog("Error getting initial session", error)
        }

        debugLog("Initial session result", {
          hasSession: !!session,
          userId: session?.user?.id,
          email: session?.user?.email,
        })

        if (mounted) {
          setUser(session?.user ?? null)
          setLoading(false)
          setInitializing(false)
          debugLog("Auth initialization complete", {
            hasUser: !!session?.user,
            currentPath: pathname,
          })
        }
      } catch (error) {
        debugLog("Auth initialization error", error)
        if (mounted) {
          setUser(null)
          setLoading(false)
          setInitializing(false)
        }
      }
    }

    initializeAuth()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      debugLog(`Auth state changed: ${event}`, {
        hasSession: !!session,
        userId: session?.user?.id,
        email: session?.user?.email,
        currentPath: pathname,
      })

      if (mounted) {
        setUser(session?.user ?? null)
        setLoading(false)

        // Handle auth state changes with delay to prevent race conditions
        setTimeout(() => {
          if (event === "SIGNED_OUT" || !session) {
            debugLog("Handling sign out, checking if redirect needed")
            if (!isLoginPage && !isUnsubscribePage && !isApiRoute) {
              debugLog("Redirecting to login after sign out")
              router.push("/login")
            }
          } else if (event === "SIGNED_IN" && session) {
            debugLog("Handling sign in, checking if redirect needed")
            if (isLoginPage || isRootPage) {
              debugLog("Redirecting to dashboard after sign in")
              router.push("/dashboard")
            }
          }
        }, 100)
      }
    })

    return () => {
      debugLog("Cleaning up auth listeners")
      mounted = false
      subscription.unsubscribe()
    }
  }, [isLoginPage, isUnsubscribePage, isApiRoute, isRootPage, router, supabase.auth, pathname])

  // Show loading spinner during initialization
  if (initializing) {
    debugLog("Showing initialization loading state")
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Inicializando aplicación...</p>
        </div>
      </div>
    )
  }

  // For login, unsubscribe, API routes, and root page, don't show sidebar
  if (isLoginPage || isUnsubscribePage || isApiRoute || isRootPage) {
    debugLog("Rendering without sidebar")
    return (
      <>
        {children}
        <Toaster />
      </>
    )
  }

  // Show loading for protected routes while checking auth
  if (loading) {
    debugLog("Showing auth verification loading state")
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verificando autenticación...</p>
        </div>
      </div>
    )
  }

  // Check if user should be on this protected route
  if (!user && !isLoginPage && !isUnsubscribePage && !isApiRoute) {
    debugLog("No user found for protected route, redirecting to login")
    router.push("/login")
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Redirigiendo a login...</p>
        </div>
      </div>
    )
  }

  debugLog("Rendering authenticated layout with sidebar")
  // For authenticated routes, show sidebar layout
  return (
    <>
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
          <main className="flex-1 overflow-auto p-6">{children}</main>
        </div>
      </div>
      <Toaster />
    </>
  )
}
