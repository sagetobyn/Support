export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth/get-auth-context'
import { NDRCaseRepository } from '@/backend/repositories/ndr.repository'
import { ndrCaseUpdateSchema } from '@/backend/schemas/api.schema'

const ndrRepo = new NDRCaseRepository()

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await getAuthContext()
    if ('error' in ctx) return ctx.error

    const { id } = await params
    const ndrCase = await ndrRepo.getById(ctx.brandId, id)
    if (!ndrCase) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    return NextResponse.json({ case: ndrCase })
  } catch (error) {
    console.error('Failed to fetch NDR case:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await getAuthContext()
    if ('error' in ctx) return ctx.error

    const { id } = await params
    const body = await request.json()
    const parsed = ndrCaseUpdateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 422 })
    }

    const updated = await ndrRepo.updateStatus(ctx.brandId, id, parsed.data.status)
    return NextResponse.json({ case: updated })
  } catch (error) {
    console.error('Failed to update NDR case:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
