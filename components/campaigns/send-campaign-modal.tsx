"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { sendCampaign } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import type { Campaign } from "@/lib/types"
import { Loader2, Send, AlertTriangle, CheckCircle } from "lucide-react"

interface SendCampaignModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  campaign: Campaign
  onCampaignSent: () => void
}

export function SendCampaignModal({ open, onOpenChange, campaign, onCampaignSent }: SendCampaignModalProps) {
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<{
    totalSent: number
    totalFailed: number
    errors: string[]
  } | null>(null)
  const { toast } = useToast()

  const handleSend = async () => {
    setLoading(true)
    setProgress(0)
    setResult(null)

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 90))
      }, 200)

      const sendResult = await sendCampaign(campaign.id)

      clearInterval(progressInterval)
      setProgress(100)
      setResult(sendResult)

      if (sendResult.totalFailed === 0) {
        toast({
          title: "Campaña enviada",
          description: `Se enviaron ${sendResult.totalSent} emails correctamente`,
        })
        onCampaignSent()
      } else {
        toast({
          title: "Campaña enviada con errores",
          description: `${sendResult.totalSent} enviados, ${sendResult.totalFailed} fallaron`,
          variant: "destructive",
        })
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo enviar la campaña",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      onOpenChange(false)
      setResult(null)
      setProgress(0)
    }
  }

  const totalContacts =
    campaign.groups?.reduce((total, group) => {
      return total + (group.contact_count || 0)
    }, 0) || 0

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Send className="mr-2 h-5 w-5" />
            Enviar Campaña
          </DialogTitle>
          <DialogDescription>¿Estás seguro de que quieres enviar esta campaña?</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium">{campaign.name}</h4>
            <p className="text-sm text-gray-600">{campaign.subject}</p>
            <p className="text-sm text-gray-500 mt-2">
              Se enviará a aproximadamente {totalContacts} contactos en {campaign.groups?.length || 0} grupos
            </p>
          </div>

          {loading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Enviando emails...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}

          {result && (
            <Alert
              className={result.totalFailed === 0 ? "border-green-200 bg-green-50" : "border-yellow-200 bg-yellow-50"}
            >
              {result.totalFailed === 0 ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
              )}
              <AlertDescription>
                <div className="space-y-1">
                  <p>
                    <strong>Enviados:</strong> {result.totalSent}
                  </p>
                  {result.totalFailed > 0 && (
                    <>
                      <p>
                        <strong>Fallaron:</strong> {result.totalFailed}
                      </p>
                      {result.errors.length > 0 && (
                        <details className="mt-2">
                          <summary className="cursor-pointer text-sm">Ver errores</summary>
                          <div className="mt-1 text-xs max-h-20 overflow-y-auto">
                            {result.errors.map((error, index) => (
                              <p key={index}>{error}</p>
                            ))}
                          </div>
                        </details>
                      )}
                    </>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {campaign.status !== "draft" && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Esta campaña ya fue enviada anteriormente. Enviarla nuevamente duplicará los emails.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            {result ? "Cerrar" : "Cancelar"}
          </Button>
          {!result && (
            <Button onClick={handleSend} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enviar Campaña
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
