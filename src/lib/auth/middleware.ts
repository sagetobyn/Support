import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { isLoginBypassEnabledForTesting } from './testing-bypass'

// True when real Supabase credentials are configured. When false (e.g. fresh
// local dev with no .env), the auth gate is bypassed so protected routes like
// /dashboard remain reachable for development. In production, env vars MUST be
// set, so this flag is true and full auth runs as expected.
const isAuthConfigured =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
  !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')

// Public routes are limited to the seller trust ladder: marketing proof,
// privacy-safe estimates, fictional demo data, pilot planning, and login.
// Everything else is an authenticated control-room, API, or future-locked
// architecture surface until the product proof gates say otherwise.
export const PUBLIC_TRUST_ROUTES = [
  '/',
  '/product',
  '/pricing',
  '/calculator',
  '/audit',
  '/sample-report',
  '/demo',
  '/pilot',
  '/login',
] as const

export const PUBLIC_TRUST_PREFIXES = ['/personas/', '/auth/', '/api/public'] as const

export function isPublicTrustRoute(pathname: string) {
  return (
    PUBLIC_TRUST_ROUTES.includes(pathname as (typeof PUBLIC_TRUST_ROUTES)[number]) ||
    PUBLIC_TRUST_PREFIXES.some((prefix) => pathname.startsWith(prefix))
  )
}

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  let supabaseResponse = NextResponse.next({
    request,
  })

  if (isLoginBypassEnabledForTesting()) {
    if (pathname === '/login') {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }

    return supabaseResponse
  }

  // Dev bypass: if Supabase isn't configured, let every request through so
  // local development isn't blocked behind a non-existent auth provider.
  if (!isAuthConfigured) {
    return supabaseResponse
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key',
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  if (isPublicTrustRoute(pathname)) return supabaseResponse

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user && pathname.startsWith('/api')) {
    // Return 401 for unauthorized API requests
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!user) {
    // Redirect unauthenticated users trying to access protected pages (e.g. /dashboard)
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
