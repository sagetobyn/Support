export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth/get-auth-context'
import { OrderRepository } from '@/backend/repositories/order.repository'
import { orderUpdateSchema } from '@/backend/schemas/api.schema'

const orderRepo = new OrderRepository()

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await getAuthContext()
    if ('error' in ctx) return ctx.error

    const { id } = await params
    const order = await orderRepo.getById(ctx.brandId, id)
    if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    return NextResponse.json({ order })
  } catch (error) {
    console.error('Failed to fetch order:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await getAuthContext()
    if ('error' in ctx) return ctx.error

    const { id } = await params
    const body = await request.json()
    const parsed = orderUpdateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 422 })
    }

    const updated = await orderRepo.update(ctx.brandId, id, parsed.data)
    return NextResponse.json({ order: updated })
  } catch (error) {
    console.error('Failed to update order:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
