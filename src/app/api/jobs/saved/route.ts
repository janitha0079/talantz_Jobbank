export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { requireSeeker } from '@/lib/auth'

// ── GET /api/jobs/saved — seeker's saved jobs ─────────────────────────

export async function GET() {
  try {
    const session = await requireSeeker()

    const seekerProfile = await db.seekerProfile.findUnique({
      where: { userId: session.user.id },
    })

    if (!seekerProfile) {
      return NextResponse.json({ data: [], meta: { total: 0 } })
    }

    const saved = await db.savedJob.findMany({
      where: { seekerId: seekerProfile.id },
      orderBy: { createdAt: 'desc' },
      include: {
        job: {
          include: {
            company: {
              select: { name: true, slug: true, logoUrl: true, isVerified: true },
            },
          },
        },
      },
    })

    return NextResponse.json({
      data: saved,
      meta: { total: saved.length },
    })
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AuthError') {
      return NextResponse.json({ error: err.message }, { status: (err as any).status ?? 401 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ── POST /api/jobs/saved — save a job ────────────────────────────────

const saveSchema = z.object({
  jobId: z.string().uuid(),
})

export async function POST(req: NextRequest) {
  try {
    const session = await requireSeeker()
    const body = await req.json()
    const { jobId } = saveSchema.parse(body)

    const seekerProfile = await db.seekerProfile.findUnique({
      where: { userId: session.user.id },
    })

    if (!seekerProfile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Check job exists
    const job = await db.job.findUnique({ where: { id: jobId, deletedAt: null } })
    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    // Upsert to avoid duplicates
    const saved = await db.savedJob.upsert({
      where: { seekerId_jobId: { seekerId: seekerProfile.id, jobId } },
      create: { seekerId: seekerProfile.id, jobId },
      update: {},
    })

    return NextResponse.json({ data: saved }, { status: 201 })
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AuthError') {
      return NextResponse.json({ error: err.message }, { status: (err as any).status ?? 401 })
    }
    if (err instanceof Error && err.name === 'ZodError') {
      return NextResponse.json({ error: 'Validation error' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ── DELETE /api/jobs/saved — unsave a job ────────────────────────────

export async function DELETE(req: NextRequest) {
  try {
    const session = await requireSeeker()
    const { jobId } = saveSchema.parse(await req.json())

    const seekerProfile = await db.seekerProfile.findUnique({
      where: { userId: session.user.id },
    })

    if (!seekerProfile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    await db.savedJob.deleteMany({
      where: { seekerId: seekerProfile.id, jobId },
    })

    return NextResponse.json({ message: 'Job removed from saved' })
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AuthError') {
      return NextResponse.json({ error: err.message }, { status: (err as any).status ?? 401 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
