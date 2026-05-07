export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth/get-auth-context'
import { SavingsEventRepository } from '@/backend/repositories/savings-event.repository'
import { savingsEventCreateSchema } from '@/backend/schemas/api.schema'

const savingsRepo = new SavingsEventRepository()

export async function GET() {
  try {
    const ctx = await getAuthContext()
    if ('error' in ctx) return ctx.error

    const [events, total, breakdown] = await Promise.all([
      savingsRepo.getByBrandId(ctx.brandId),
      savingsRepo.getTotalByBrandId(ctx.brandId),
      savingsRepo.getBreakdownByBrandId(ctx.brandId),
    ])

    return NextResponse.json({ events, total, breakdown })
  } catch (error) {
    console.error('Failed to fetch savings events:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await getAuthContext()
    if ('error' in ctx) return ctx.error

    const body = await request.json()
    const parsed = savingsEventCreateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 422 })
    }

    const event = await savingsRepo.create(ctx.brandId, parsed.data)
    return NextResponse.json({ event }, { status: 201 })
  } catch (error) {
    console.error('Failed to record savings event:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
