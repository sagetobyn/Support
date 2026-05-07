import { NextResponse } from 'next/server'
import { createClient } from '@/lib/auth/server'
import { NDRCaseRepository } from '@/backend/repositories/ndr.repository'

const ndrRepo = new NDRCaseRepository()

export async function GET(request: Request) {
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

    const cases = await ndrRepo.getByBrandId(brandId)

    return NextResponse.json({ cases })
  } catch (error) {
    console.error('Failed to fetch NDR cases:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
