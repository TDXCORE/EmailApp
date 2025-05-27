"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Sidebar } from "@/components/layout/sidebar"
import { supabase } from "@/lib/supabase"
import { Toaster } from "@/components/ui/toaster"

export function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const pathname = usePathname()
  const router = useRouter()
  const isLoginPage = pathname === "/login"

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)

      if (!session && !isLoginPage) {
        router.push("/login")
      } else if (session && isLoginPage) {
        router.push("/dashboard")
      }
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null)

      if (!session && !isLoginPage) {
        router.push("/login")
      } else if (session && isLoginPage) {
        router.push("/dashboard")
      }
    })

    return () => subscription.unsubscribe()
  }, [isLoginPage, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-teal-600"></div>
      </div>
    )
  }

  return (
    <>
      {isLoginPage ? (
        children
      ) : (
        <div className="flex h-screen bg-gray-50">
          <Sidebar />
          <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
            <main className="flex-1 overflow-auto p-6">{children}</main>
          </div>
        </div>
      )}
      <Toaster />
    </>
  )
}
