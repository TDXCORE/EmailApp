"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Don't log redirect errors
    if (error.message !== "NEXT_REDIRECT" && !error.message.includes("Redirect")) {
      console.error("Application error:", error)
    }
  }, [error])

  // Don't show error UI for redirects
  if (error.message === "NEXT_REDIRECT" || error.message.includes("Redirect")) {
    return null
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">¡Oops!</h1>
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Algo salió mal</h2>
        <p className="text-gray-600 mb-8">Ha ocurrido un error inesperado. Por favor, intenta de nuevo.</p>
        <div className="space-x-4">
          <Button onClick={reset}>Intentar de nuevo</Button>
          <Button variant="outline" onClick={() => (window.location.href = "/login")}>
            Ir al Login
          </Button>
        </div>
      </div>
    </div>
  )
}
