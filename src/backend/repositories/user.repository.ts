import prisma from '@/lib/db/prisma'

export class UserRepository {
  /**
   * Get a user by their Supabase auth ID.
   */
  async getByAuthId(authId: string) {
    return await prisma.user.findUnique({
      where: { id: authId },
      include: { brand: true },
    })
  }

  /**
   * Get all users belonging to a brand.
   */
  async getByBrandId(brandId: string) {
    return await prisma.user.findMany({
      where: { brandId },
      orderBy: { createdAt: 'asc' },
    })
  }

  /**
   * Create a new user record (called after Supabase Auth signup).
   */
  async create(authId: string, brandId: string, email: string, role = 'member') {
    return await prisma.user.create({
      data: {
        id: authId,
        email,
        role,
        brand: { connect: { id: brandId } },
      },
    })
  }

  /**
   * Update a user's role (scoped to brand for safety).
   */
  async updateRole(brandId: string, userId: string, role: string) {
    return await prisma.user.update({
      where: { id: userId, brandId },
      data: { role },
    })
  }
}
