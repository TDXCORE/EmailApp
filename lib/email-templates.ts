export const generateUnsubscribeLink = (contactId: string, campaignId: string): string => {
  // Use the NEXT_PUBLIC_APP_URL environment variable or fallback to localhost
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL 

  // Ensure baseUrl doesn't end with a slash
  const normalizedBaseUrl = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl

  // Construct the proper unsubscribe URL (ahora apunta a la página, no al API)
  return `${normalizedBaseUrl}/unsubscribe?contact=${contactId}&campaign=${campaignId}`
}

export const addUnsubscribeFooter = (htmlContent: string, contactId: string, campaignId: string): string => {
  const unsubscribeLink = generateUnsubscribeLink(contactId, campaignId)

  const footer = `
    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e5e5; font-size: 12px; color: #666; text-align: center; font-family: Arial, sans-serif;">
      <p style="margin: 0 0 10px 0;">Si no deseas recibir más emails como este, puedes <a href="${unsubscribeLink}" style="color: #0f766e; text-decoration: underline;" target="_blank">darte de baja aquí</a>.</p>
      <p style="margin: 10px 0 0 0; font-size: 11px; color: #999;">Este email fue enviado por Email Marketing App</p>
    </div>
  `

  // Insert footer before closing body tag, or append if no body tag
  if (htmlContent.includes("</body>")) {
    return htmlContent.replace("</body>", `${footer}</body>`)
  } else {
    return `${htmlContent}${footer}`
  }
}

export const createEmailTemplate = (content: string, contactId: string, campaignId: string): string => {
  const withFooter = addUnsubscribeFooter(content, contactId, campaignId)

  // Wrap in basic HTML structure if not already present
  if (!withFooter.includes("<html>")) {
    return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #ffffff;
    }
    img {
      max-width: 100%;
      height: auto;
    }
    a {
      color: #0f766e;
    }
  </style>
</head>
<body>
  ${withFooter}
</body>
</html>
    `
  }

  return withFooter
}

export const validateEmailTemplate = (content: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = []

  if (!content || content.trim().length === 0) {
    errors.push("El contenido del email no puede estar vacío")
  }

  if (content.length > 100000) {
    errors.push("El contenido del email es demasiado largo")
  }

  // Check for potentially problematic content
  if (content.includes("<script")) {
    errors.push("No se permite contenido JavaScript en los emails")
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}
