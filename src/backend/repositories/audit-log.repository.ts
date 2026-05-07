import prisma from '@/lib/db/prisma'
import { Prisma } from '@prisma/client'

export class AuditLogRepository {
  /**
   * Get recent audit logs for a brand (latest first, default limit 100).
   */
  async getByBrandId(brandId: string, limit = 100) {
    return await prisma.auditLog.findMany({
      where: { brandId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: { user: { select: { email: true, role: true } } },
    })
  }

  /**
   * Write an audit log entry.
   */
  async create(brandId: string, data: {
    action: string
    userId?: string | null
    targetId?: string | null
    details?: Record<string, unknown> | null
  }) {
    return await prisma.auditLog.create({
      data: {
        action: data.action,
        userId: data.userId ?? null,
        targetId: data.targetId ?? null,
        details: (data.details ?? undefined) as Prisma.InputJsonValue | undefined,
        brandId,
      },
    })
  }
}
