import { PrismaClient } from '@prisma/client'

declare global {
  // eslint-disable-next-line no-var
  var _prismaInstance: PrismaClient | undefined
}

/**
 * Returns a lazily-initialized PrismaClient singleton.
 * Using a getter so the client is only created on first use (not at module load).
 */
function getClient(): PrismaClient {
  if (!globalThis._prismaInstance) {
    globalThis._prismaInstance = new PrismaClient()
  }
  return globalThis._prismaInstance
}

/**
 * Proxy that forwards all property accesses to the lazily-created PrismaClient.
 * This ensures `new PrismaClient()` is never called at module-load time
 * (which would fail during Next.js static build evaluation).
 */
const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    return Reflect.get(getClient(), prop)
  },
  apply(_target, thisArg, args) {
    return Reflect.apply(getClient() as unknown as Function, thisArg, args)
  },
})

export default prisma
