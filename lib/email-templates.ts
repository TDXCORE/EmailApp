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
  <div style="
    margin-top: 40px;
    padding-top: 20px;
    border-top: 1px solid #e5e5e5;
    font-size: 12px;
    color: #666;
    text-align: center;
    font-family: Arial, sans-serif;
    line-height: 1.4;
  ">
    <!-- Logo centrado -->
    <div style="margin-bottom: 15px;">
      <img
        src="https://v0-email-marketing-app-tau.vercel.app/tdxNegro.png"
        alt="TDX Logo"
        width="120"
        height="40"
        style="display: block; margin: 0 auto;"
      />
    </div>

    <!-- Link de baja -->
    <p style="margin: 0 0 10px 0;">
      <a
        href="${unsubscribeLink}"
        style="color: #0f766e; text-decoration: underline;"
        target="_blank"
      >
        Cancelar suscripción
      </a>
      &nbsp;|&nbsp;
      Enviado por <strong>TDX Transformación Digital SAS</strong>
    </p>

    <!-- Dirección -->
    <p style="margin: 5px 0;">
      Calle 61 #56-51 • Medellín, Colombia • 050010
    </p>

    <!-- Redes / Contacto -->
    <p style="margin: 5px 0;">
      <a href="https://www.linkedin.com/company/tdxcore/" style="color: #0f766e; text-decoration: none;" target="_blank">
        LinkedIn
      </a>
      &nbsp;|&nbsp;
      <a href="https://www.instagram.com/tdxcore" style="color: #0f766e; text-decoration: none;" target="_blank">
        Instagram
      </a>
      &nbsp;|&nbsp;
      <a href="https://wa.me/573123626283" style="color: #0f766e; text-decoration: none;" target="_blank">
        WhatsApp
      </a>
    </p>
  </div>
`;

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
