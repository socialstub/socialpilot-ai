import { PrismaClient } from '@prisma/client'

// Force re-creation of PrismaClient by clearing the cache
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// In development, always create a new instance to pick up schema changes
function createPrismaClient() {
  return new PrismaClient()
}

export const db = createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db
}
