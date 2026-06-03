import path from 'node:path'
import { config as loadEnv } from 'dotenv'
import { defineConfig } from 'prisma/config'

// Prisma CLI doesn't automatically read .env.local (that's a Next.js convention).
// We load it explicitly here so DATABASE_URL / DIRECT_URL are available to the CLI.
loadEnv({ path: path.resolve(process.cwd(), '.env.local') })
loadEnv({ path: path.resolve(process.cwd(), '.env') }) // fallback

export default defineConfig({
  schema: path.join(import.meta.dirname, 'prisma', 'schema.prisma'),

  datasource: {
    // DIRECT_URL bypasses pgBouncer for migrations — use it if Supabase gives you one.
    // If you only have DATABASE_URL, both variables can point to the same connection string.
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? '',
  },

  migrate: {
    async adapter(env) {
      const { PrismaPg } = await import('@prisma/adapter-pg')
      const { Pool } = await import('pg')

      const connectionString = env.DIRECT_URL ?? env.DATABASE_URL
      if (!connectionString) {
        throw new Error(
          'DATABASE_URL (and optionally DIRECT_URL) must be set in .env.local or .env',
        )
      }

      const pool = new Pool({ connectionString })
      return new PrismaPg(pool)
    },
  },
})
