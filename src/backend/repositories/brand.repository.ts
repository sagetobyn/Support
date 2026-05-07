import prisma from '@/lib/db/prisma'

export class BrandRepository {
  /**
   * Get a brand by its ID.
   */
  async getById(id: string) {
    return await prisma.brand.findUnique({
      where: { id },
    })
  }

  /**
   * Create a new brand.
   */
  async create(name: string) {
    return await prisma.brand.create({
      data: {
        name,
      },
    })
  }

  /**
   * Update a brand's name.
   */
  async update(id: string, name: string) {
    return await prisma.brand.update({
      where: { id },
      data: { name },
    })
  }

  /**
   * Delete a brand and all associated records (handled by DB cascade).
   */
  async delete(id: string) {
    return await prisma.brand.delete({
      where: { id },
    })
  }
}
