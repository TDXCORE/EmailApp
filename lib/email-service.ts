import AWS from "aws-sdk"
import { getConfigs } from "./api"

interface EmailParams {
  to: string[]
  subject: string
  htmlBody: string
  textBody?: string
  fromEmail?: string
  fromName?: string
}

interface SESConfig {
  accessKeyId: string
  secretAccessKey: string
  region: string
  fromEmail: string
  fromName: string
}

export class EmailService {
  private ses: AWS.SES | null = null
  private config: SESConfig | null = null

  async initialize() {
    try {
      const configs = await getConfigs()
      const configMap = configs.reduce(
        (acc, config) => {
          acc[config.key] = config.value
          return acc
        },
        {} as Record<string, string>,
      )

      this.config = {
        accessKeyId: configMap["AWS_SES_ACCESS_KEY"] || "AKIAVKTSUAJG47TR34TF",
        secretAccessKey: configMap["AWS_SES_SECRET_KEY"] || "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",
        region: configMap["AWS_SES_REGION"] || "us-east-1",
        fromEmail: configMap["FROM_EMAIL"] || "ventas@tdxcore.com",
        fromName: configMap["FROM_NAME"] || "Email Marketing App",
      }

      AWS.config.update({
        accessKeyId: this.config.accessKeyId,
        secretAccessKey: this.config.secretAccessKey,
        region: this.config.region,
      })

      this.ses = new AWS.SES({ apiVersion: "2010-12-01" })
      return true
    } catch (error) {
      console.error("Error initializing SES:", error)
      return false
    }
  }

  async sendEmail(params: EmailParams): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.ses || !this.config) {
      const initialized = await this.initialize()
      if (!initialized) {
        return { success: false, error: "Failed to initialize SES" }
      }
    }

    try {
      const sesParams: AWS.SES.SendEmailRequest = {
        Source: `${params.fromName || this.config!.fromName} <${params.fromEmail || this.config!.fromEmail}>`,
        Destination: {
          ToAddresses: params.to,
        },
        Message: {
          Subject: {
            Data: params.subject,
            Charset: "UTF-8",
          },
          Body: {
            Html: {
              Data: params.htmlBody,
              Charset: "UTF-8",
            },
            Text: {
              Data: params.textBody || this.stripHtml(params.htmlBody),
              Charset: "UTF-8",
            },
          },
        },
      }

      const result = await this.ses!.sendEmail(sesParams).promise()
      return { success: true, messageId: result.MessageId }
    } catch (error: any) {
      console.error("Error sending email:", error)
      return { success: false, error: error.message }
    }
  }

  async sendBulkEmail(
    emails: { to: string; subject: string; htmlBody: string; textBody?: string }[],
    fromEmail?: string,
    fromName?: string,
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    let success = 0
    let failed = 0
    const errors: string[] = []

    for (const email of emails) {
      const result = await this.sendEmail({
        to: [email.to],
        subject: email.subject,
        htmlBody: email.htmlBody,
        textBody: email.textBody,
        fromEmail,
        fromName,
      })

      if (result.success) {
        success++
      } else {
        failed++
        errors.push(`${email.to}: ${result.error}`)
      }

      // Add small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 100))
    }

    return { success, failed, errors }
  }

  private stripHtml(html: string): string {
    return html
      .replace(/<[^>]*>/g, "")
      .replace(/\s+/g, " ")
      .trim()
  }

  async verifyEmail(email: string): Promise<{ success: boolean; error?: string }> {
    if (!this.ses) {
      const initialized = await this.initialize()
      if (!initialized) {
        return { success: false, error: "Failed to initialize SES" }
      }
    }

    try {
      await this.ses!.verifyEmailIdentity({ EmailAddress: email }).promise()
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }
}

export const emailService = new EmailService()
