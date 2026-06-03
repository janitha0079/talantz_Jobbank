export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { sendInvitationEmail } from '@/lib/email'
import { nanoid } from 'nanoid'

// POST /api/admin/invitations/:id/resend
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await requireAdmin()

    const invitation = await db.invitation.findUnique({
      where: { id: params.id },
      include: { company: true },
    })
    if (!invitation) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (invitation.acceptedAt) return NextResponse.json({ error: 'Already accepted' }, { status: 400 })

    // Generate a fresh token + extend expiry 7 days
    const newToken = nanoid(32)
    const updated = await db.invitation.update({
      where: { id: params.id },
      data: {
        token: newToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        sentBy: session.user.id,
      },
    })

    await sendInvitationEmail({
      to: invitation.email,
      contactName: invitation.email.split('@')[0],
      companyName: invitation.company.name,
      token: newToken,
      subscriptionTier: invitation.company.subscriptionTier,
    })

    await db.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'invitation.resent',
        affectedTable: 'invitations',
        affectedId: invitation.id,
        payload: { email: invitation.email },
        ipAddress: req.headers.get('x-forwarded-for') ?? 'unknown',
      },
    })

    return NextResponse.json({ data: updated, message: 'Invitation resent' })
  } catch (err: any) {
    if (err.name === 'AuthError') return NextResponse.json({ error: err.message }, { status: err.status })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/admin/invitations/:id — revoke
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await requireAdmin()

    const invitation = await db.invitation.findUnique({ where: { id: params.id } })
    if (!invitation) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (invitation.acceptedAt) return NextResponse.json({ error: 'Already accepted — cannot revoke' }, { status: 400 })

    await db.invitation.delete({
      where: { id: params.id },
    })

    await db.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'invitation.revoked',
        affectedTable: 'invitations',
        affectedId: params.id,
        payload: { email: invitation.email },
        ipAddress: req.headers.get('x-forwarded-for') ?? 'unknown',
      },
    })

    return NextResponse.json({ message: 'Invitation revoked' })
  } catch (err: any) {
    if (err.name === 'AuthError') return NextResponse.json({ error: err.message }, { status: err.status })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
