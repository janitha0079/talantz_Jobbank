export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'

const schema = z.object({
  token: z.string(),
  password: z.string().min(8).max(128),
})

const TTL = 60 * 60 * 1000 // 1 hour

// POST /api/auth/reset-password
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { token, password } = schema.parse(body)

    let userId: string
    let timestamp: number

    try {
      const decoded = Buffer.from(token, 'base64url').toString('utf-8')
      const parts = decoded.split(':')
      if (parts.length < 2) throw new Error('Malformed')
      userId = parts[0]
      timestamp = parseInt(parts[1])
    } catch {
      return NextResponse.json({ error: 'Invalid or expired reset link' }, { status: 400 })
    }

    if (Date.now() - timestamp > TTL) {
      return NextResponse.json({ error: 'Reset link has expired. Please request a new one.' }, { status: 400 })
    }

    const user = await db.user.findUnique({ where: { id: userId, deletedAt: null } })
    if (!user) {
      return NextResponse.json({ error: 'Invalid or expired reset link' }, { status: 400 })
    }

    const passwordHash = await bcrypt.hash(password, 12)
    await db.user.update({
      where: { id: userId },
      data: { passwordHash, emailVerified: true },
    })

    return NextResponse.json({ message: 'Password updated successfully. You can now sign in.' })
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'ZodError') {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }
    console.error('[reset-password]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
