export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth/get-auth-context'
import { ActionRepository } from '@/backend/repositories/action.repository'
import { actionUpdateSchema } from '@/backend/schemas/api.schema'

const actionRepo = new ActionRepository()

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await getAuthContext()
    if ('error' in ctx) return ctx.error

    const { id } = await params
    const action = await actionRepo.getById(ctx.brandId, id)
    if (!action) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    return NextResponse.json({ action })
  } catch (error) {
    console.error('Failed to fetch action:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await getAuthContext()
    if ('error' in ctx) return ctx.error

    const { id } = await params
    const body = await request.json()
    const parsed = actionUpdateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 422 })
    }

    const updated = await actionRepo.updateStatus(ctx.brandId, id, parsed.data.status)
    return NextResponse.json({ action: updated })
  } catch (error) {
    console.error('Failed to update action:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
