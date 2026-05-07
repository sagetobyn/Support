import prisma from '@/lib/db/prisma'
import { Prisma } from '@prisma/client'

export class OrderRepository {
  /**
   * Get all orders for a specific brand.
   */
  async getByBrandId(brandId: string) {
    return await prisma.order.findMany({
      where: { brandId },
      orderBy: { createdAt: 'desc' },
    })
  }

  /**
   * Get a single order safely scoped to a brand.
   */
  async getById(brandId: string, orderId: string) {
    return await prisma.order.findUnique({
      where: {
        id: orderId,
        brandId, // Multi-tenant safety
      },
    })
  }

  /**
   * Create a new order for a brand.
   */
  async create(brandId: string, data: Omit<Prisma.OrderCreateInput, 'brand' | 'id' | 'createdAt' | 'updatedAt'>) {
    return await prisma.order.create({
      data: {
        ...data,
        brand: { connect: { id: brandId } }
      },
    })
  }

  /**
   * Update a single order (scoped to brand).
   */
  async update(brandId: string, id: string, data: Partial<{
    status: string
    awb: string | null
    customerPhone: string | null
    riskScore: number | null
    riskLevel: string | null
    codAmount: number | null
    paymentMode: string | null
  }>) {
    return await prisma.order.update({
      where: { id, brandId },
      data,
    })
  }

  /**
   * Batch upsert orders (useful for CSV imports).
   */
  async batchUpsert(brandId: string, orders: Array<Omit<Prisma.OrderCreateInput, 'brand' | 'id' | 'createdAt' | 'updatedAt'>>) {
    // Note: Prisma does not support createMany with duplicate handling out of the box in standard mode
    // efficiently without raw queries, but we can do a transaction for MVP.
    const operations = orders.map((order) =>
      prisma.order.upsert({
        where: {
          brandId_orderId: {
            brandId,
            orderId: order.orderId as string, // Cast assuming orderId is present
          },
        },
        create: {
          ...order,
          brand: { connect: { id: brandId } }
        },
        update: {
          ...order,
        },
      })
    )

    return await prisma.$transaction(operations)
  }
}
