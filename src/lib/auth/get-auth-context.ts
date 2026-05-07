import { createClient } from '@/lib/auth/server'
import { NextResponse } from 'next/server'

/**
 * Resolves the authenticated user and their brandId from the session.
 * Returns { user, brandId } on success or { error: NextResponse } on failure.
 */
export async function getAuthContext() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  const brandId = user.user_metadata?.brandId as string | undefined
  if (!brandId) {
    return { error: NextResponse.json({ error: 'Brand context missing. Complete onboarding first.' }, { status: 400 }) }
  }

  return { user, brandId }
}

/**
 * Same as getAuthContext but does NOT require brandId.
 * Used for the onboarding endpoint where brandId doesn't exist yet.
 */
export async function getAuthUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  return { user }
}
