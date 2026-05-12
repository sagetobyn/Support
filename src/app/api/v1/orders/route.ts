export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth/get-auth-context'
import { OrderRepository } from '@/backend/repositories/order.repository'

const orderRepo = new OrderRepository()

export async function GET() {
  try {
    const ctx = await getAuthContext()
    if ('error' in ctx) return ctx.error

    const orders = await orderRepo.getByBrandId(ctx.brandId)
    return NextResponse.json({ orders })
  } catch (error) {
    console.error('Failed to fetch orders:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
