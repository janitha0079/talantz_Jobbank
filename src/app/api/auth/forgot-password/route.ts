export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { sendEmail } from '@/lib/email'

const schema = z.object({
  email: z.string().email(),
})

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://talentai.lk'

// POST /api/auth/forgot-password
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email } = schema.parse(body)
    const normalised = email.toLowerCase()

    const user = await db.user.findUnique({
      where: { email: normalised, deletedAt: null },
    })

    // Always return 200 to prevent email enumeration
    if (!user || !user.passwordHash) {
      return NextResponse.json({ message: 'If that email exists, a reset link has been sent.' })
    }

    // Generate a token: base64url(userId:timestamp:hash)
    const payload = `${user.id}:${Date.now()}`
    const token = Buffer.from(payload).toString('base64url')
    const url = `${APP_URL}/api/auth/reset-password?token=${token}`

    await sendEmail({
      to: normalised,
      subject: 'Reset your TalentAI.lk password',
      template: 'magic-link',
      data: { url },
    })

    return NextResponse.json({ message: 'If that email exists, a reset link has been sent.' })
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
    }
    console.error('[forgot-password]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
