import { NextResponse } from 'next/server'
import { createClient } from '@/lib/auth/server'
import { OrderRepository } from '@/backend/repositories/order.repository'

const orderRepo = new OrderRepository()

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // In a real app, user metadata or a separate DB call would resolve the user's active brandId.
    // For MVP, we assume the brandId is attached to the user metadata.
    const brandId = user.user_metadata?.brandId

    if (!brandId) {
      return NextResponse.json({ error: 'Brand context missing' }, { status: 400 })
    }

    const orders = await orderRepo.getByBrandId(brandId)

    return NextResponse.json({ orders })
  } catch (error) {
    console.error('Failed to fetch orders:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
