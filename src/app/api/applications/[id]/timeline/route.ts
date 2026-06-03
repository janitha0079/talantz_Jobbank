export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/auth'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await requireRole(['employer_admin', 'employer_member', 'super_admin'])

    // Verify the application belongs to a company the user is a member of
    const application = await db.application.findUnique({
      where: { id: params.id },
      include: {
        job: { include: { company: { include: { members: true } } } },
      },
    })

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }

    if (session.user.role !== 'super_admin') {
      const isMember = application.job.company.members.some(
        (member: { userId: string }) => member.userId === session.user.id,
      )
      if (!isMember) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    const events = await db.applicationTimelineEvent.findMany({
      where: { applicationId: params.id },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ data: events })
  } catch (err: any) {
    if (err.name === 'AuthError') return NextResponse.json({ error: err.message }, { status: err.status ?? 403 })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
