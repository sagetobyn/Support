export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getAuthContext, getAuthUser } from '@/lib/auth/get-auth-context'
import { createServiceRoleClient } from '@/lib/auth/service-role'
import { UserRepository } from '@/backend/repositories/user.repository'
import { BrandRepository } from '@/backend/repositories/brand.repository'
import { onboardSchema } from '@/backend/schemas/api.schema'

const userRepo = new UserRepository()
const brandRepo = new BrandRepository()

/**
 * GET /api/v1/users/me
 * Returns the current user's profile and brand.
 */
export async function GET() {
  try {
    const ctx = await getAuthContext()
    if ('error' in ctx) return ctx.error

    const user = await userRepo.getByAuthId(ctx.user.id)
    if (!user) return NextResponse.json({ error: 'User record not found. Complete onboarding.' }, { status: 404 })

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Failed to fetch user profile:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

/**
 * POST /api/v1/users/me
 * Onboarding: creates a Brand + User record for a newly signed-up Supabase user.
 * Idempotent — returns existing record if user is already onboarded.
 */
export async function POST(request: Request) {
  try {
    const authCtx = await getAuthUser()
    if ('error' in authCtx) return authCtx.error

    const { user } = authCtx

    // Idempotency: return existing user if already onboarded
    const existing = await userRepo.getByAuthId(user.id)
    if (existing) {
      return NextResponse.json({ user: existing, alreadyOnboarded: true })
    }

    const body = await request.json()
    const parsed = onboardSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 422 })
    }

    const { brandName } = parsed.data

    // Create brand first
    const brand = await brandRepo.create(brandName)

    // Create user record linked to brand
    const newUser = await userRepo.create(user.id, brand.id, user.email!, 'owner')

    // Stamp brandId onto the Supabase user's metadata (service role required)
    const adminClient = createServiceRoleClient()
    await adminClient.auth.admin.updateUserById(user.id, {
      user_metadata: { ...user.user_metadata, brandId: brand.id },
    })

    return NextResponse.json({ user: newUser }, { status: 201 })
  } catch (error) {
    console.error('Failed to onboard user:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
