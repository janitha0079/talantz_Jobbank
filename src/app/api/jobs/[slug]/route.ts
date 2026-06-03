import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { auth, requireRole } from '@/lib/auth'
import { computeJobMatch } from '@/lib/matching'

// ── GET /api/jobs/:slug ───────────────────────────────────────────────

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } },
) {
  const job = await db.job.findUnique({
    where: { slug: params.slug, deletedAt: null },
    include: {
      company: {
        select: {
          id: true, name: true, slug: true, description: true,
          logoUrl: true, coverUrl: true, isVerified: true,
          website: true, linkedinUrl: true, industry: true,
          companySize: true, headquarters: true,
          _count: { select: { jobs: { where: { status: 'active', deletedAt: null } } } },
        },
      },
    },
  })

  if (!job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 })
  }

  // Increment view count (fire and forget)
  db.job.update({
    where: { id: job.id },
    data: { viewsCount: { increment: 1 } },
  }).catch(() => {})

  // If authenticated, include personal match score from cache
  const session = await auth()
  let matchScore = null
  if (session?.user?.id && session.user.role === 'job_seeker') {
    const seekerProfile = await db.seekerProfile.findUnique({
      where: { userId: session.user.id },
      include: {
        experiences: {
          select: {
            title: true,
            company: true,
            description: true,
            startDate: true,
            endDate: true,
            isCurrent: true,
          },
          orderBy: { sortOrder: 'asc' },
        },
        educations: {
          select: {
            degree: true,
            institution: true,
          },
        },
        certifications: {
          select: {
            name: true,
            issuer: true,
          },
        },
      },
    })
    if (seekerProfile) {
      const cached = await db.aiMatchScoreCache.findUnique({
        where: { seekerId_jobId: { seekerId: seekerProfile.id, jobId: job.id } },
      })

      if (cached) {
        const breakdown = (cached.breakdown ?? {}) as Record<string, unknown>
        matchScore = {
          score: cached.score,
          summary: cached.summary,
          strengths: Array.isArray(breakdown.strengths) ? breakdown.strengths : [],
          gaps: Array.isArray(breakdown.gaps) ? breakdown.gaps : [],
          skillsMatched: Array.isArray(breakdown.skillsMatched) ? breakdown.skillsMatched : [],
          skillsMissing: Array.isArray(breakdown.skillsMissing) ? breakdown.skillsMissing : [],
          breakdown: {
            skills: typeof breakdown.skills === 'number' ? breakdown.skills : 0,
            experience: typeof breakdown.experience === 'number' ? breakdown.experience : 0,
            title: typeof breakdown.title === 'number' ? breakdown.title : 0,
            location: typeof breakdown.location === 'number' ? breakdown.location : 0,
            education: typeof breakdown.education === 'number' ? breakdown.education : 0,
            profileCompleteness: typeof breakdown.profileCompleteness === 'number' ? breakdown.profileCompleteness : 0,
          },
        }
      } else {
        const computed = computeJobMatch(
          {
            id: job.id,
            title: job.title,
            skillsRequired: job.skillsRequired,
            skillsPreferred: job.skillsPreferred,
            experienceMin: job.experienceMin,
            educationLevel: job.educationLevel,
            location: job.location,
            workMode: job.workMode,
          },
          {
            id: seekerProfile.id,
            headline: seekerProfile.headline,
            summary: seekerProfile.summary,
            skills: seekerProfile.skills,
            location: seekerProfile.location,
            preferredTypes: seekerProfile.preferredTypes,
            experiences: seekerProfile.experiences,
            educations: seekerProfile.educations,
            certifications: seekerProfile.certifications,
          },
        )

        await db.aiMatchScoreCache.upsert({
          where: { seekerId_jobId: { seekerId: seekerProfile.id, jobId: job.id } },
          update: {
            score: computed.score,
            breakdown: {
              ...computed.breakdown,
              strengths: computed.strengths,
              gaps: computed.gaps,
              skillsMatched: computed.skillsMatched,
              skillsMissing: computed.skillsMissing,
            } as import('@prisma/client').Prisma.JsonObject,
            summary: computed.summary,
          },
          create: {
            seekerId: seekerProfile.id,
            jobId: job.id,
            score: computed.score,
            breakdown: {
              ...computed.breakdown,
              strengths: computed.strengths,
              gaps: computed.gaps,
              skillsMatched: computed.skillsMatched,
              skillsMissing: computed.skillsMissing,
            } as import('@prisma/client').Prisma.JsonObject,
            summary: computed.summary,
          },
        }).catch(() => {})

        matchScore = computed
      }
    }
  }

  return NextResponse.json({ data: job, matchScore })
}

// ── PUT /api/jobs/:slug ───────────────────────────────────────────────

const updateJobSchema = z.object({
  title: z.string().min(3).max(120).optional(),
  description: z.string().min(50).optional(),
  status: z.enum(['draft', 'active', 'paused', 'closed']).optional(),
  salaryMin: z.number().int().positive().nullable().optional(),
  salaryMax: z.number().int().positive().nullable().optional(),
  salaryVisible: z.boolean().optional(),
  closesAt: z.string().datetime().nullable().optional(),
}).partial()

export async function PUT(
  req: NextRequest,
  { params }: { params: { slug: string } },
) {
  try {
    const session = await requireRole(['employer_admin', 'employer_member', 'super_admin'])
    const body = await req.json()
    const data = updateJobSchema.parse(body)

    const job = await db.job.findUnique({
      where: { slug: params.slug, deletedAt: null },
      include: { company: { include: { members: true } } },
    })

    if (!job) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Check ownership (unless admin)
    if (session.user.role !== 'super_admin') {
      const isMember = job.company.members.some((m: { userId: string; role: string }) => m.userId === session.user.id)
      if (!isMember) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const updated = await db.job.update({
      where: { id: job.id },
      data: {
        ...data,
        closesAt: data.closesAt ? new Date(data.closesAt) : undefined,
      },
    })

    return NextResponse.json({ data: updated })
  } catch (err: any) {
    if (err.name === 'AuthError') return NextResponse.json({ error: err.message }, { status: err.status })
    console.error('[PUT /jobs/:slug]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ── DELETE /api/jobs/:slug — soft delete ──────────────────────────────

export async function DELETE(
  req: NextRequest,
  { params }: { params: { slug: string } },
) {
  try {
    const session = await requireRole(['employer_admin', 'super_admin'])

    const job = await db.job.findUnique({
      where: { slug: params.slug, deletedAt: null },
      include: { company: { include: { members: true } } },
    })

    if (!job) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    if (session.user.role !== 'super_admin') {
      const isAdmin = job.company.members.some(
        (m: { userId: string; role: string }) => m.userId === session.user.id && m.role === 'admin',
      )
      if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await db.job.update({
      where: { id: job.id },
      data: { deletedAt: new Date(), status: 'closed' },
    })

    return NextResponse.json({ message: 'Job deleted' })
  } catch (err: any) {
    if (err.name === 'AuthError') return NextResponse.json({ error: err.message }, { status: err.status })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
