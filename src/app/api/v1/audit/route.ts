export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/auth/get-auth-context'
import { AuditLogRepository } from '@/backend/repositories/audit-log.repository'
import { auditLogCreateSchema } from '@/backend/schemas/api.schema'

const auditRepo = new AuditLogRepository()

export async function GET(request: Request) {
  try {
    const ctx = await getAuthContext()
    if ('error' in ctx) return ctx.error

    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '100', 10), 500)

    const logs = await auditRepo.getByBrandId(ctx.brandId, limit)
    return NextResponse.json({ logs })
  } catch (error) {
    console.error('Failed to fetch audit logs:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await getAuthContext()
    if ('error' in ctx) return ctx.error

    const body = await request.json()
    const parsed = auditLogCreateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 422 })
    }

    const log = await auditRepo.create(ctx.brandId, {
      ...parsed.data,
      userId: ctx.user.id,
    })
    return NextResponse.json({ log }, { status: 201 })
  } catch (error) {
    console.error('Failed to create audit log:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
