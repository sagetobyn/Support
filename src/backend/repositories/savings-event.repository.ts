import prisma from '@/lib/db/prisma'

export class SavingsEventRepository {
  /**
   * Get all savings events for a brand.
   */
  async getByBrandId(brandId: string) {
    return await prisma.savingsEvent.findMany({
      where: { brandId },
      orderBy: { createdAt: 'desc' },
    })
  }

  /**
   * Record a new savings event.
   */
  async create(brandId: string, data: {
    type: string
    amount: number
    status?: string
  }) {
    return await prisma.savingsEvent.create({
      data: {
        type: data.type,
        amount: data.amount,
        status: data.status ?? 'estimated',
        brand: { connect: { id: brandId } },
      },
    })
  }

  /**
   * Sum total estimated savings for a brand.
   */
  async getTotalByBrandId(brandId: string) {
    const result = await prisma.savingsEvent.aggregate({
      where: { brandId },
      _sum: { amount: true },
    })
    return result._sum.amount ?? 0
  }

  /**
   * Sum savings grouped by type.
   */
  async getBreakdownByBrandId(brandId: string) {
    return await prisma.savingsEvent.groupBy({
      by: ['type'],
      where: { brandId },
      _sum: { amount: true },
      _count: { id: true },
    })
  }
}
