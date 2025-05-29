"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { signIn } from "@/lib/auth"
import { Loader2, Mail, Lock } from "lucide-react"

// Debug helper
const debugLog = (message: string, data?: any) => {
  console.log(`[LOGIN FORM DEBUG] ${message}`, data || "")
}

export function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    debugLog("Starting login submission", { email })

    try {
      const { data, error: signInError } = await signIn(email, password)

      if (signInError) {
        debugLog("Login failed", signInError)
        setError(signInError.message || "Error al iniciar sesión")
        setLoading(false)
        return
      }

      if (data?.session) {
        debugLog("Login successful, preparing redirect", {
          userId: data.session.user.id,
          email: data.session.user.email,
        })

        // Wait a moment for the session to be fully established
        await new Promise((resolve) => setTimeout(resolve, 500))

        debugLog("Redirecting to dashboard")
        // Use window.location for a hard redirect to ensure middleware picks up the session
        window.location.href = "/dashboard"
      } else {
        debugLog("No session returned from login")
        setError("No se pudo establecer la sesión")
        setLoading(false)
      }
    } catch (err: any) {
      debugLog("Login exception", err)
      setError("Error inesperado al iniciar sesión")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-teal-900 to-slate-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Email Marketing</CardTitle>
          <CardDescription className="text-center">Inicia sesión en tu cuenta</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm text-gray-600">
            <p>¿No tienes cuenta? Contacta al administrador</p>
          </div>

          {/* Debug info in development */}
          {process.env.NODE_ENV === "development" && (
            <div className="mt-4 p-2 bg-gray-100 rounded text-xs">
              <p>Debug: Check browser console for detailed logs</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
