export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth/get-auth-context'
import { ActionRepository } from '@/backend/repositories/action.repository'
import { actionCreateSchema } from '@/backend/schemas/api.schema'

const actionRepo = new ActionRepository()

export async function GET(request: Request) {
  try {
    const ctx = await getAuthContext()
    if ('error' in ctx) return ctx.error

    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get('orderId') ?? undefined
    const ndrCaseId = searchParams.get('ndrCaseId') ?? undefined

    const actions = await actionRepo.getByBrandId(ctx.brandId, { orderId, ndrCaseId })
    return NextResponse.json({ actions })
  } catch (error) {
    console.error('Failed to fetch actions:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await getAuthContext()
    if ('error' in ctx) return ctx.error

    const body = await request.json()
    const parsed = actionCreateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 422 })
    }

    const action = await actionRepo.create(ctx.brandId, parsed.data)
    return NextResponse.json({ action }, { status: 201 })
  } catch (error) {
    console.error('Failed to create action:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
