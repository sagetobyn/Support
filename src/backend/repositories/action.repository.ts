import prisma from '@/lib/db/prisma'

export class ActionRepository {
  /**
   * Get all actions for a brand, optionally filtered by order or NDR case.
   */
  async getByBrandId(brandId: string, filters?: { orderId?: string; ndrCaseId?: string }) {
    return await prisma.action.findMany({
      where: {
        brandId,
        ...(filters?.orderId ? { orderId: filters.orderId } : {}),
        ...(filters?.ndrCaseId ? { ndrCaseId: filters.ndrCaseId } : {}),
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  /**
   * Get a single action scoped to a brand.
   */
  async getById(brandId: string, id: string) {
    return await prisma.action.findUnique({
      where: { id, brandId },
    })
  }

  /**
   * Create a new action.
   */
  async create(brandId: string, data: {
    type: string
    status: string
    orderId?: string | null
    ndrCaseId?: string | null
  }) {
    return await prisma.action.create({
      data: {
        brandId,
        type: data.type,
        status: data.status,
        orderId: data.orderId ?? null,
        ndrCaseId: data.ndrCaseId ?? null,
      },
    })
  }

  /**
   * Update an action's status (scoped to brand).
   */
  async updateStatus(brandId: string, id: string, status: string) {
    return await prisma.action.update({
      where: { id, brandId },
      data: { status },
    })
  }
}
