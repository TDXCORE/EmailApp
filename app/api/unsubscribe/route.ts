import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Create a server-side Supabase client with service role key for admin operations
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL ?? '',
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
  {
    auth: {
      persistSession: false
    }
  }
)

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const contactId = searchParams.get("contact")
  const campaignId = searchParams.get("campaign")
  const format = searchParams.get("format") || "html" // Default to HTML response

  // Enhanced logging for debugging
  console.log("Unsubscribe request received:", {
    contactId,
    campaignId,
    format,
    url: request.url,
    headers: Object.fromEntries(request.headers),
    timestamp: new Date().toISOString(),
  })

  if (!contactId || !campaignId) {
    console.error("Missing parameters in unsubscribe request:", { contactId, campaignId })

    if (format === "json") {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required parameters",
        },
        { status: 400 },
      )
    }

    return new NextResponse(generateErrorPage("Parámetros faltantes", "El enlace de desuscripción no es válido."), {
      status: 400,
      headers: { "Content-Type": "text/html" },
    })
  }

  try {
    // Get contact and campaign info using admin client
    const { data: contact, error: contactError } = await supabaseAdmin
      .from("contacts")
      .select("*")
      .eq("id", contactId)
      .single()

    if (contactError) {
      console.error("Error fetching contact:", contactError)

      if (format === "json") {
        return NextResponse.json(
          {
            success: false,
            error: "Contact not found",
          },
          { status: 404 },
        )
      }

      return new NextResponse(
        generateErrorPage("Contacto no encontrado", "No se pudo encontrar el contacto especificado."),
        {
          status: 404,
          headers: { "Content-Type": "text/html" },
        },
      )
    }

    const { data: campaign, error: campaignError } = await supabaseAdmin
      .from("campaigns")
      .select("*")
      .eq("id", campaignId)
      .single()

    if (campaignError) {
      console.error("Error fetching campaign:", campaignError)

      if (format === "json") {
        return NextResponse.json(
          {
            success: false,
            error: "Campaign not found",
          },
          { status: 404 },
        )
      }

      return new NextResponse(
        generateErrorPage("Campaña no encontrada", "No se pudo encontrar la campaña especificada."),
        {
          status: 404,
          headers: { "Content-Type": "text/html" },
        },
      )
    }

    if (!contact || !campaign) {
      console.error("Contact or campaign not found:", { contact: !!contact, campaign: !!campaign })

      if (format === "json") {
        return NextResponse.json(
          {
            success: false,
            error: "Required data not found",
          },
          { status: 404 },
        )
      }

      return new NextResponse(
        generateErrorPage("Datos no encontrados", "No se pudieron encontrar los datos necesarios."),
        {
          status: 404,
          headers: { "Content-Type": "text/html" },
        },
      )
    }

    // Check if already unsubscribed
    if (contact.status === "unsubscribed") {
      console.log("Contact already unsubscribed:", contact.email)

      if (format === "json") {
        return NextResponse.json({
          success: true,
          status: "already-unsubscribed",
          email: contact.email,
        })
      }

      return new NextResponse(generateAlreadyUnsubscribedPage(contact.email), {
        headers: { "Content-Type": "text/html" },
      })
    }

    // Start transaction-like operations
    const now = new Date().toISOString()

    // 1. Update contact status to unsubscribed
    const { error: updateContactError } = await supabaseAdmin
      .from("contacts")
      .update({
        status: "unsubscribed",
        updated_at: now,
      })
      .eq("id", contactId)

    if (updateContactError) {
      console.error("Error updating contact status:", updateContactError)
      throw new Error("Failed to update contact status")
    }

    // 2. Remove contact from all groups to prevent future emails
    const { error: removeFromGroupsError } = await supabaseAdmin
      .from("contact_groups")
      .delete()
      .eq("contact_id", contactId)

    if (removeFromGroupsError) {
      console.error("Error removing contact from groups:", removeFromGroupsError)
      // Don't throw here, log but continue - contact is still marked as unsubscribed
    }

    // 3. Update email metrics if exists
    const { error: updateMetricsError } = await supabaseAdmin
      .from("email_metrics")
      .update({
        unsubscribed_at: now,
      })
      .eq("contact_id", contactId)
      .eq("campaign_id", campaignId)

    if (updateMetricsError) {
      console.error("Error updating email metrics:", updateMetricsError)
      // Don't throw here, log but continue
    }

    // 4. Create unsubscribe log entry
    const { error: logError } = await supabaseAdmin.from("unsubscribe_logs").insert({
      contact_id: contactId,
      campaign_id: campaignId,
      email: contact.email,
      reason: "user_request",
      user_id: contact.user_id,
      unsubscribed_at: now,
    })

    if (logError) {
      console.error("Error creating unsubscribe log:", logError)
      // Don't throw here, log but continue - main operation succeeded
    }

    // Log successful unsubscription
    console.log("Successful unsubscription:", {
      contactId,
      campaignId,
      email: contact.email,
      timestamp: now,
    })

    // Return response based on format
    if (format === "json") {
      return NextResponse.json({
        success: true,
        status: "unsubscribed",
        email: contact.email,
        campaignName: campaign.name,
      })
    }

    // Return success page
    return new NextResponse(generateSuccessPage(contact.email, campaign.name), {
      headers: { "Content-Type": "text/html" },
    })
  } catch (error: any) {
    console.error("Unsubscribe error:", {
      error: error.message,
      stack: error.stack,
      contactId,
      campaignId,
      timestamp: new Date().toISOString(),
    })

    if (format === "json") {
      return NextResponse.json(
        {
          success: false,
          error: "Internal server error",
          message: error.message,
        },
        { status: 500 },
      )
    }

    return new NextResponse(
      generateErrorPage(
        "Error interno",
        "Ocurrió un error al procesar tu solicitud de desuscripción. Por favor, inténtalo de nuevo más tarde.",
      ),
      {
        status: 500,
        headers: { "Content-Type": "text/html" },
      },
    )
  }
}

function generateSuccessPage(email: string, campaignName: string): string {
  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Desuscripción Exitosa</title>
      <style>
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          max-width: 600px; 
          margin: 50px auto; 
          padding: 20px; 
          text-align: center;
          background-color: #f8fafc;
          line-height: 1.6;
        }
        .container {
          background: white;
          padding: 40px;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0,0,0,0.05);
          border: 1px solid #e2e8f0;
        }
        .success-icon {
          font-size: 64px;
          color: #10b981;
          margin-bottom: 24px;
          display: block;
        }
        h1 { 
          color: #1f2937; 
          margin-bottom: 16px;
          font-size: 28px;
          font-weight: 600;
        }
        p { 
          color: #6b7280; 
          margin-bottom: 16px;
          font-size: 16px;
        }
        .email { 
          background: #f1f5f9; 
          padding: 12px 16px; 
          border-radius: 8px; 
          font-family: 'SF Mono', Monaco, monospace;
          margin: 20px 0;
          color: #0f766e;
          font-weight: 500;
        }
        .campaign {
          background: #fef3c7;
          padding: 12px 16px;
          border-radius: 8px;
          margin: 20px 0;
          color: #92400e;
          font-weight: 500;
        }
        .footer {
          margin-top: 32px;
          padding-top: 24px;
          border-top: 1px solid #e5e7eb;
          font-size: 14px;
          color: #9ca3af;
        }
        .contact-info {
          margin-top: 24px;
          padding: 16px;
          background: #f8fafc;
          border-radius: 8px;
          font-size: 14px;
          color: #6b7280;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <span class="success-icon">✓</span>
        <h1>¡Desuscripción exitosa!</h1>
        <p>Tu solicitud de desuscripción ha sido procesada correctamente.</p>
        
        <div class="email">${email}</div>
        
        <p>Has sido removido de nuestra lista de correos y ya no recibirás emails de nuestras campañas de marketing.</p>
        
        <div class="campaign">Campaña: ${campaignName}</div>
        
        <div class="contact-info">
          <strong>¿Fue esto un error?</strong><br>
          Si te desuscribiste por error, puedes contactarnos para volver a suscribirte a nuestras comunicaciones.
        </div>
        
        <div class="footer">
          <p>Gracias por haber sido parte de nuestra comunidad.</p>
          <p style="font-size: 12px; margin-top: 16px;">
            TDX Transformación Digital SAS - ${new Date().getFullYear()}
          </p>
        </div>
      </div>
    </body>
    </html>
  `
}

function generateAlreadyUnsubscribedPage(email: string): string {
  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Ya estás desuscrito</title>
      <style>
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          max-width: 600px; 
          margin: 50px auto; 
          padding: 20px; 
          text-align: center;
          background-color: #f8fafc;
          line-height: 1.6;
        }
        .container {
          background: white;
          padding: 40px;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0,0,0,0.05);
          border: 1px solid #e2e8f0;
        }
        .info-icon {
          font-size: 64px;
          color: #3b82f6;
          margin-bottom: 24px;
          display: block;
        }
        h1 { 
          color: #1f2937; 
          margin-bottom: 16px;
          font-size: 28px;
          font-weight: 600;
        }
        p { 
          color: #6b7280; 
          margin-bottom: 16px;
          font-size: 16px;
        }
        .email { 
          background: #f1f5f9; 
          padding: 12px 16px; 
          border-radius: 8px; 
          font-family: 'SF Mono', Monaco, monospace;
          margin: 20px 0;
          color: #0f766e;
          font-weight: 500;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <span class="info-icon">ℹ️</span>
        <h1>Ya estás desuscrito</h1>
        <p>El email <span class="email">${email}</span> ya estaba desuscrito de nuestras comunicaciones.</p>
        <p>No recibirás más emails de nuestras campañas de marketing.</p>
      </div>
    </body>
    </html>
  `
}

function generateErrorPage(title: string, message: string): string {
  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Error - ${title}</title>
      <style>
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          max-width: 600px; 
          margin: 50px auto; 
          padding: 20px; 
          text-align: center;
          background-color: #f8fafc;
          line-height: 1.6;
        }
        .container {
          background: white;
          padding: 40px;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0,0,0,0.05);
          border: 1px solid #fecaca;
        }
        .error-icon {
          font-size: 64px;
          color: #ef4444;
          margin-bottom: 24px;
          display: block;
        }
        h1 { 
          color: #dc2626; 
          margin-bottom: 16px;
          font-size: 28px;
          font-weight: 600;
        }
        p { 
          color: #6b7280; 
          margin-bottom: 16px;
          font-size: 16px;
        }
        .contact-info {
          margin-top: 24px;
          padding: 16px;
          background: #fef2f2;
          border-radius: 8px;
          font-size: 14px;
          color: #991b1b;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <span class="error-icon">⚠️</span>
        <h1>${title}</h1>
        <p>${message}</p>
        <div class="contact-info">
          <strong>¿Necesitas ayuda?</strong><br>
          Si continúas teniendo problemas, por favor contacta a nuestro equipo de soporte.
        </div>
      </div>
    </body>
    </html>
  `
}
