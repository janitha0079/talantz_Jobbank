import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set')
  }
  const pool = new Pool({ connectionString })
  const adapter = new PrismaPg(pool)
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })
}

// Lazy singleton — client is only created on first property access,
// not at module import time. This prevents build-time DB connection attempts.
let _client: PrismaClient | undefined

function getClient(): PrismaClient {
  if (!_client) {
    _client = createPrismaClient()
  }
  return _client
}

export const db = new Proxy({} as PrismaClient, {
  get(_: PrismaClient, prop: string | symbol) {
    const client = getClient()
    const value = (client as any)[prop]
    return typeof value === 'function' ? value.bind(client) : value
  },
})
