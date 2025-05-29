"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, CheckCircle, AlertTriangle, Mail } from "lucide-react"

export function UnsubscribeClient() {
  const searchParams = useSearchParams()
  const contactId = searchParams.get("contact")
  const campaignId = searchParams.get("campaign")

  const [status, setStatus] = useState<"loading" | "success" | "error" | "already-unsubscribed">("loading")
  const [email, setEmail] = useState<string>("")
  const [errorMessage, setErrorMessage] = useState<string>("")

  useEffect(() => {
    if (!contactId || !campaignId) {
      setStatus("error")
      setErrorMessage("El enlace de desuscripción no es válido. Faltan parámetros necesarios.")
      return
    }

    const processUnsubscribe = async () => {
      try {
        const response = await fetch(`/api/unsubscribe?contact=${contactId}&campaign=${campaignId}`)

        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`Error ${response.status}: ${errorText}`)
        }

        const data = await response.json()

        if (data.status === "already-unsubscribed") {
          setStatus("already-unsubscribed")
          setEmail(data.email)
        } else {
          setStatus("success")
          setEmail(data.email)
        }
      } catch (error: any) {
        console.error("Unsubscribe error:", error)
        setStatus("error")
        setErrorMessage(error.message || "Ocurrió un error al procesar tu solicitud de desuscripción.")
      }
    }

    processUnsubscribe()
  }, [contactId, campaignId])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Desuscripción</CardTitle>
        </CardHeader>
        <CardContent>
          {status === "loading" && (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-12 w-12 text-teal-600 animate-spin mb-4" />
              <p className="text-gray-600">Procesando tu solicitud de desuscripción...</p>
            </div>
          )}

          {status === "success" && (
            <div className="flex flex-col items-center justify-center py-4">
              <CheckCircle className="h-12 w-12 text-green-600 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">¡Desuscripción exitosa!</h3>
              {email && (
                <div className="bg-gray-100 px-4 py-2 rounded-md text-sm font-mono text-gray-800 mb-4">{email}</div>
              )}
              <p className="text-gray-600 text-center mb-4">
                Has sido removido de nuestra lista de correos y ya no recibirás emails de nuestras campañas de
                marketing.
              </p>
              <Button variant="outline" asChild>
                <a href="/">Volver al inicio</a>
              </Button>
            </div>
          )}

          {status === "already-unsubscribed" && (
            <div className="flex flex-col items-center justify-center py-4">
              <Mail className="h-12 w-12 text-blue-600 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Ya estás desuscrito</h3>
              {email && (
                <div className="bg-gray-100 px-4 py-2 rounded-md text-sm font-mono text-gray-800 mb-4">{email}</div>
              )}
              <p className="text-gray-600 text-center mb-4">
                Este email ya estaba desuscrito de nuestras comunicaciones. No recibirás más emails de nuestras campañas
                de marketing.
              </p>
              <Button variant="outline" asChild>
                <a href="/">Volver al inicio</a>
              </Button>
            </div>
          )}

          {status === "error" && (
            <div className="flex flex-col items-center justify-center py-4">
              <AlertTriangle className="h-12 w-12 text-red-600 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Error al procesar la desuscripción</h3>
              <p className="text-gray-600 text-center mb-4">
                {errorMessage ||
                  "Ocurrió un error al procesar tu solicitud de desuscripción. Por favor, inténtalo de nuevo más tarde."}
              </p>
              <Button variant="outline" asChild>
                <a href="/">Volver al inicio</a>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
