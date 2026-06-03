import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { requireRole, requireSeeker } from '@/lib/auth'
import { inngest } from '@/inngest/client'

const applySchema = z.object({
  jobId: z.string().uuid(),
  coverLetter: z.string().max(2000).optional(),
  cvSnapshotUrl: z.string().url().optional(),
})

// ── POST /api/applications — submit application ───────────────────────

export async function POST(req: NextRequest) {
  try {
    const session = await requireSeeker()
    const body = await req.json()
    const { jobId, coverLetter, cvSnapshotUrl } = applySchema.parse(body)

    // Get seeker profile
    const seekerProfile = await db.seekerProfile.findUnique({
      where: { userId: session.user.id },
    })
    if (!seekerProfile) {
      return NextResponse.json({ error: 'Complete your profile before applying' }, { status: 400 })
    }

    // Check job exists and is active
    const job = await db.job.findUnique({
      where: { id: jobId, status: 'active', deletedAt: null },
      include: { company: { select: { subscriptionTier: true } } },
    })
    if (!job) {
      return NextResponse.json({ error: 'Job not found or no longer accepting applications' }, { status: 404 })
    }

    // Check rate limit — max 10 applications per hour per seeker
    const recentCount = await db.application.count({
      where: {
        seekerId: seekerProfile.id,
        createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) },
      },
    })
    if (recentCount >= 10) {
      return NextResponse.json(
        { error: 'Too many applications. Please wait before applying again.' },
        { status: 429 },
      )
    }

    // Check not already applied
    const existing = await db.application.findUnique({
      where: { jobId_seekerId: { jobId, seekerId: seekerProfile.id } },
    })
    if (existing) {
      return NextResponse.json({ error: 'You have already applied for this job' }, { status: 409 })
    }

    // Create application + timeline event in one transaction
    const application = await db.$transaction(async (tx) => {
      const app = await tx.application.create({
        data: {
          jobId,
          seekerId: seekerProfile.id,
          coverLetter,
          cvSnapshotUrl: cvSnapshotUrl ?? seekerProfile.cvUrl ?? undefined,
          status: 'applied',
        },
      })

      await tx.applicationTimelineEvent.create({
        data: {
          applicationId: app.id,
          eventType: 'application.submitted',
          payload: { status: 'applied' },
        },
      })

      // Increment job application count
      await tx.job.update({
        where: { id: jobId },
        data: { applicationsCount: { increment: 1 } },
      })

      return app
    })

    // Trigger async AI screening (only for Growth/Enterprise companies)
    const tier = job.company.subscriptionTier
    if (tier === 'growth' || tier === 'enterprise') {
      await inngest.send({
        name: 'application/submitted',
        data: { applicationId: application.id },
      })
    }

    // Send confirmation notification
    await db.notification.create({
      data: {
        userId: session.user.id,
        type: 'application_submitted',
        title: 'Application submitted',
        body: `Your application for ${job.title} has been received.`,
        actionUrl: `/applications/${application.id}`,
      },
    })

    return NextResponse.json(
      {
        data: application,
        message: 'Application submitted successfully',
        referenceNumber: `TAI-${new Date().getFullYear()}-${application.id.slice(-6).toUpperCase()}`,
      },
      { status: 201 },
    )
  } catch (err: any) {
    if (err.name === 'AuthError') return NextResponse.json({ error: err.message }, { status: err.status })
    if (err.name === 'ZodError') return NextResponse.json({ error: 'Validation error', issues: err.issues }, { status: 400 })
    console.error('[POST /applications]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ── GET /api/applications — seeker's own applications ────────────────

export async function GET(req: NextRequest) {
  try {
    const session = await requireSeeker()
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') ?? '1')
    const per = Math.min(parseInt(searchParams.get('per') ?? '20'), 50)

    const seekerProfile = await db.seekerProfile.findUnique({
      where: { userId: session.user.id },
    })
    if (!seekerProfile) return NextResponse.json({ data: [], meta: { total: 0 } })

    const where = {
      seekerId: seekerProfile.id,
      ...(status ? { status: status as any } : {}),
    }

    const [total, applications] = await Promise.all([
      db.application.count({ where }),
      db.application.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * per,
        take: per,
        include: {
          job: {
            select: {
              id: true, title: true, slug: true, jobType: true,
              workMode: true, location: true, salaryMin: true,
              salaryMax: true, salaryCurrency: true, salaryVisible: true,
              closesAt: true, status: true,
              company: {
                select: { name: true, slug: true, logoUrl: true, isVerified: true },
              },
            },
          },
        },
      }),
    ])

    return NextResponse.json({
      data: applications,
      meta: { total, page, per, pages: Math.ceil(total / per) },
    })
  } catch (err: any) {
    if (err.name === 'AuthError') return NextResponse.json({ error: err.message }, { status: err.status })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
