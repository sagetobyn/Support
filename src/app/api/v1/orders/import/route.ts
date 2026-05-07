import { NextResponse } from 'next/server'
import { createClient } from '@/lib/auth/server'
import { OrderRepository } from '@/backend/repositories/order.repository'
import { orderImportSchema } from '@/backend/schemas/api.schema'

const orderRepo = new OrderRepository()

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const brandId = user.user_metadata?.brandId
    if (!brandId) {
      return NextResponse.json({ error: 'Brand context missing' }, { status: 400 })
    }

    const body = await request.json()
    const parsed = orderImportSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload', details: parsed.error.errors }, { status: 400 })
    }

    // Process chunked upsert
    await orderRepo.batchUpsert(brandId, parsed.data.orders)

    return NextResponse.json({ success: true, count: parsed.data.orders.length })
  } catch (error) {
    console.error('Failed to import orders:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
