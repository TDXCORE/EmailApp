"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { Sidebar } from "@/components/layout/sidebar"
import { Toaster } from "@/components/ui/toaster"

export function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [loading, setLoading] = useState(true)
  const pathname = usePathname()
  const isLoginPage = pathname === "/login"
  const isUnsubscribePage = pathname === "/unsubscribe" || pathname.startsWith("/unsubscribe")
  const isApiRoute = pathname.startsWith("/api/")
  const isRootPage = pathname === "/"

  useEffect(() => {
    // Only show loading state for a short time to prevent flicker
    const timer = setTimeout(() => {
      setLoading(false)
    }, 500)

    return () => clearTimeout(timer)
  }, [])

  // For login, unsubscribe, API routes, and root page, don't show sidebar
  if (isLoginPage || isUnsubscribePage || isApiRoute || isRootPage) {
    return (
      <>
        {loading ? (
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
          </div>
        ) : (
          children
        )}
        <Toaster />
      </>
    )
  }

  // For authenticated routes, show sidebar layout
  return (
    <>
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
          <main className="flex-1 overflow-auto p-6">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
              </div>
            ) : (
              children
            )}
          </main>
        </div>
      </div>
      <Toaster />
    </>
  )
}
