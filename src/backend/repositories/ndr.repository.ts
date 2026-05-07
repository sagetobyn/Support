import prisma from '@/lib/db/prisma'
import { Prisma } from '@prisma/client'

export class NDRCaseRepository {
  /**
   * Get all NDR cases for a brand.
   */
  async getByBrandId(brandId: string) {
    return await prisma.nDRCase.findMany({
      where: { brandId },
      include: {
        order: true, // often need the order details with NDR
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  /**
   * Get a single NDR case scoped to a brand.
   */
  async getById(brandId: string, id: string) {
    return await prisma.nDRCase.findUnique({
      where: { id, brandId },
      include: { order: true },
    })
  }

  /**
   * Create an NDR case for an existing order.
   */
  async create(brandId: string, orderId: string, reason: string, status: string = 'open') {
    return await prisma.nDRCase.create({
      data: {
        reason,
        status,
        brand: { connect: { id: brandId } },
        order: { connect: { id: orderId } },
      },
    })
  }

  /**
   * Update an NDR case status.
   */
  async updateStatus(brandId: string, id: string, status: string) {
    return await prisma.nDRCase.update({
      where: {
        id,
        brandId, // Enforce multi-tenant safety
      },
      data: {
        status,
      },
    })
  }
}
