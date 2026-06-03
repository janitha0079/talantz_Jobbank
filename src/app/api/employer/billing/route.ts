import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/auth'

// GET /api/employer/billing
// Returns the current company's subscription state for the billing page.
export async function GET() {
  try {
    const session = await requireRole(['employer_admin', 'employer_member'])

    const membership = await db.companyMember.findFirst({
      where: { userId: session.user.id },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            subscriptionTier: true,
            subscriptionStatus: true,
            subscriptionExpiresAt: true,
          },
        },
      },
    })

    if (!membership) {
      return NextResponse.json({ error: 'No company found for this user' }, { status: 404 })
    }

    return NextResponse.json({ data: membership.company })
  } catch (err: any) {
    if (err.name === 'AuthError') return NextResponse.json({ error: err.message }, { status: err.status ?? 403 })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
