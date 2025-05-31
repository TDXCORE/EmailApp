import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Debug helper
const debugLog = (message: string, data?: any) => {
  console.log(`[MIDDLEWARE DEBUG] ${message}`, data || "")
}

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  // Obtén la sesión
  const { data: { session } } = await supabase.auth.getSession()

  // Rutas públicas
  const publicRoutes = ["/login", "/unsubscribe", "/api/unsubscribe"]
  const { pathname } = req.nextUrl
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route))

  // Skip middleware for static files and most API routes
  if (
    pathname.startsWith("/_next/") ||
    (pathname.startsWith("/api/") && !pathname.startsWith("/api/unsubscribe")) ||
    pathname.includes(".") ||
    pathname === "/favicon.ico"
  ) {
    debugLog(`Skipping middleware for: ${pathname}`)
    return res
  }

  // Handle authentication logic
  if (!session && !isPublicRoute) {
    debugLog(`No session found, redirecting to login from: ${pathname}`)
    return NextResponse.redirect(new URL('/login', req.url))
  }

  if (session && pathname === '/login') {
    debugLog(`Session found, redirecting from login to dashboard`)
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  if (pathname === "/" && session) {
    debugLog(`Session found, redirecting from root to dashboard`)
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  if (pathname === "/" && !session) {
    debugLog(`No session found, redirecting from root to login`)
    return NextResponse.redirect(new URL('/login', req.url))
  }

  debugLog(`Allowing request to: ${pathname}`)
  return res
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)"],
}
