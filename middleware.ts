import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Debug helper
const debugLog = (message: string, data?: any) => {
  console.log(`[MIDDLEWARE DEBUG] ${message}`, data || "")
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  debugLog(`Processing request for: ${pathname}`)

  // Define public routes that don't require authentication
  const publicRoutes = ["/login", "/unsubscribe", "/api/unsubscribe"]
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route))

  // Skip middleware for static files and most API routes
  if (
    pathname.startsWith("/_next/") ||
    (pathname.startsWith("/api/") && !pathname.startsWith("/api/unsubscribe")) ||
    pathname.includes(".") ||
    pathname === "/favicon.ico"
  ) {
    debugLog(`Skipping middleware for: ${pathname}`)
    return NextResponse.next()
  }

  // Get all possible session tokens from cookies
  const cookies = req.cookies
  const possibleTokens = [
    cookies.get("sb-localhost-auth-token")?.value,
    cookies.get("sb-auth-token")?.value,
    cookies.get("supabase-auth-token")?.value,
    cookies.get("sb-access-token")?.value,
  ].filter(Boolean)

  debugLog(`Found ${possibleTokens.length} potential session tokens`, {
    cookieNames: Array.from(cookies.keys()),
    hasTokens: possibleTokens.length > 0,
  })

  const hasSession = possibleTokens.length > 0

  // Handle authentication logic
  if (!hasSession && !isPublicRoute) {
    debugLog(`No session found, redirecting to login from: ${pathname}`)
    const redirectUrl = new URL("/login", req.url)
    return NextResponse.redirect(redirectUrl)
  }

  if (hasSession && pathname === "/login") {
    debugLog(`Session found, redirecting from login to dashboard`)
    const redirectUrl = new URL("/dashboard", req.url)
    return NextResponse.redirect(redirectUrl)
  }

  if (pathname === "/" && hasSession) {
    debugLog(`Session found, redirecting from root to dashboard`)
    const redirectUrl = new URL("/dashboard", req.url)
    return NextResponse.redirect(redirectUrl)
  }

  if (pathname === "/" && !hasSession) {
    debugLog(`No session found, redirecting from root to login`)
    const redirectUrl = new URL("/login", req.url)
    return NextResponse.redirect(redirectUrl)
  }

  debugLog(`Allowing request to: ${pathname}`)
  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)"],
}
