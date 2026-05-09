import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// True when real Supabase credentials are configured. When false (e.g. fresh
// local dev with no .env), the auth gate is bypassed so protected routes like
// /dashboard remain reachable for development. In production, env vars MUST be
// set, so this flag is true and full auth runs as expected.
const isAuthConfigured =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
  !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

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

  const pathname = request.nextUrl.pathname

  // Public marketing pages — no auth required
  const PUBLIC_EXACT = ['/', '/product', '/pricing', '/calculator', '/audit', '/sample-report', '/demo', '/pilot', '/login']
  const PUBLIC_PREFIX = ['/personas/', '/auth/', '/api/public']

  const isPublic =
    PUBLIC_EXACT.includes(pathname) ||
    PUBLIC_PREFIX.some((p) => pathname.startsWith(p))

  if (isPublic) return supabaseResponse

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
