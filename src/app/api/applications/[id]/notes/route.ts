import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/auth'

const noteSchema = z.object({
  body: z.string().min(1).max(2000),
})

async function getApplicationForEmployer(applicationId: string, userId: string, role: string) {
  const application = await db.application.findUnique({
    where: { id: applicationId },
    include: {
      job: { include: { company: { include: { members: true } } } },
    },
  })

  if (!application) {
    throw Object.assign(new Error('Application not found'), { name: 'NotFoundError', status: 404 })
  }

  if (role !== 'super_admin') {
    const isMember = application.job.company.members.some((member: { userId: string }) => member.userId === userId)
    if (!isMember) {
      throw Object.assign(new Error('Forbidden'), { name: 'AuthError', status: 403 })
    }
  }

  return application
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await requireRole(['employer_admin', 'employer_member', 'super_admin'])
    await getApplicationForEmployer(params.id, session.user.id, session.user.role)

    const notes = await db.applicationNote.findMany({
      where: { applicationId: params.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })

    return NextResponse.json({ data: notes })
  } catch (err: any) {
    if (err.name === 'AuthError') return NextResponse.json({ error: err.message }, { status: err.status ?? 403 })
    if (err.name === 'NotFoundError') return NextResponse.json({ error: err.message }, { status: 404 })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await requireRole(['employer_admin', 'employer_member', 'super_admin'])
    await getApplicationForEmployer(params.id, session.user.id, session.user.role)

    const body = await req.json()
    const data = noteSchema.parse(body)

    const note = await db.applicationNote.create({
      data: {
        applicationId: params.id,
        authorId: session.user.id,
        body: data.body,
      },
    })

    await db.applicationTimelineEvent.create({
      data: {
        applicationId: params.id,
        actorId: session.user.id,
        eventType: 'note.added',
        payload: { body: data.body.slice(0, 120) },
      },
    })

    return NextResponse.json({ data: note }, { status: 201 })
  } catch (err: any) {
    if (err.name === 'AuthError') return NextResponse.json({ error: err.message }, { status: err.status ?? 403 })
    if (err.name === 'NotFoundError') return NextResponse.json({ error: err.message }, { status: 404 })
    if (err.name === 'ZodError') return NextResponse.json({ error: 'Validation error', issues: err.issues }, { status: 400 })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
