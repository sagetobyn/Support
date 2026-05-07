export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth/get-auth-context'
import { BrandRepository } from '@/backend/repositories/brand.repository'
import { brandUpdateSchema } from '@/backend/schemas/api.schema'

const brandRepo = new BrandRepository()

export async function GET() {
  try {
    const ctx = await getAuthContext()
    if ('error' in ctx) return ctx.error

    const brand = await brandRepo.getById(ctx.brandId)
    if (!brand) return NextResponse.json({ error: 'Brand not found' }, { status: 404 })

    return NextResponse.json({ brand })
  } catch (error) {
    console.error('Failed to fetch brand:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const ctx = await getAuthContext()
    if ('error' in ctx) return ctx.error

    const body = await request.json()
    const parsed = brandUpdateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 422 })
    }

    const updated = await brandRepo.update(ctx.brandId, parsed.data.name)
    return NextResponse.json({ brand: updated })
  } catch (error) {
    console.error('Failed to update brand:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
