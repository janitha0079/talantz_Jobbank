export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/auth/verify-email?token=...
// Token format: base64url(userId:timestamp) — sent by sendVerificationEmail()
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')

  if (!token) {
    return NextResponse.redirect(new URL('/login?error=InvalidToken', req.url))
  }

  let userId: string
  let timestamp: number

  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf-8')
    const parts = decoded.split(':')
    if (parts.length < 2) throw new Error('Malformed token')
    userId = parts[0]
    timestamp = parseInt(parts[1])
  } catch {
    return NextResponse.redirect(new URL('/login?error=InvalidToken', req.url))
  }

  // Token expires after 24 hours
  const TTL = 24 * 60 * 60 * 1000
  if (Date.now() - timestamp > TTL) {
    return NextResponse.redirect(new URL('/login?error=TokenExpired', req.url))
  }

  const user = await db.user.findUnique({ where: { id: userId } })
  if (!user) {
    return NextResponse.redirect(new URL('/login?error=InvalidToken', req.url))
  }

  if (user.emailVerified) {
    // Already verified — just redirect to login
    return NextResponse.redirect(new URL('/login?verified=1', req.url))
  }

  await db.user.update({
    where: { id: userId },
    data: { emailVerified: true },
  })

  return NextResponse.redirect(new URL('/login?verified=1', req.url))
}
