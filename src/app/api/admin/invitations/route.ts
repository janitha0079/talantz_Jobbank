import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { sendInvitationEmail } from '@/lib/email'
import { nanoid } from 'nanoid'

// GET /api/admin/invitations
export async function GET(req: NextRequest) {
  try {
    await requireAdmin()
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status') // pending | expired | accepted

    const now = new Date()
    const where: any = {}
    if (status === 'pending')  { where.acceptedAt = null; where.expiresAt = { gt: now } }
    if (status === 'expired')  { where.acceptedAt = null; where.expiresAt = { lte: now } }
    if (status === 'accepted') { where.acceptedAt = { not: null } }

    const invitations = await db.invitation.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        company: { select: { name: true, slug: true } },
        sender: { select: { email: true } },
      },
    })

    return NextResponse.json({ data: invitations })
  } catch (err: any) {
    if (err.name === 'AuthError') return NextResponse.json({ error: err.message }, { status: err.status })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/admin/invitations/:id/resend
// DELETE /api/admin/invitations/:id — revoke
