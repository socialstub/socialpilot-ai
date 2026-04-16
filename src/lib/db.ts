import { PrismaClient } from '@prisma/client'
import path from 'path'
import fs from 'fs'

// Ensure the database directory exists
function ensureDbDir() {
  try {
    const dbUrl = process.env.DATABASE_URL || 'file:./db/custom.db'
    const match = dbUrl.match(/file:(.+)/)
    if (match) {
      const dbPath = match[1].replace(/^\/\//, '')
      const dir = path.dirname(dbPath)
      if (dir && !fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
      }
    }
  } catch {
    // Non-critical, Prisma will handle the error
  }
}

// Global singleton to prevent multiple instances in development
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  ensureDbDir()
  return new PrismaClient()
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db
}
