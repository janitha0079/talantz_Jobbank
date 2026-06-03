import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/auth'
import { validateCertificationEvidence } from '@/lib/ai'
import { computeJobMatch } from '@/lib/matching'

// ── GET /api/jobs/:slug/applications — employer views applicants ──────

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } },
) {
  try {
    const session = await requireRole(['employer_admin', 'employer_member', 'super_admin'])

    // Find the job
    const job = await db.job.findUnique({
      where: { slug: params.slug, deletedAt: null },
      include: { company: { include: { members: true } } },
    })

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    // Verify the caller belongs to this company (unless super_admin)
    if (session.user.role !== 'super_admin') {
      const isMember = (job.company.members as Array<{ userId: string; role: string }>).some(
        (m) => m.userId === session.user.id,
      )
      if (!isMember) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') ?? '1')
    const per = Math.min(parseInt(searchParams.get('per') ?? '50'), 100)

    const where = {
      jobId: job.id,
      ...(status ? { status: status as import('@prisma/client').ApplicationStatus } : {}),
    }

    const [total, applications] = await Promise.all([
      db.application.count({ where }),
      db.application.findMany({
        where,
        orderBy: [{ aiMatchScore: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * per,
        take: per,
        include: {
          seeker: {
            select: {
              fullName: true,
              headline: true,
              summary: true,
              skills: true,
              location: true,
              avatarUrl: true,
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
                take: 5,
              },
              educations: {
                select: {
                  degree: true,
                  institution: true,
                },
              },
              certifications: {
                orderBy: { issuedDate: 'desc' },
              },
              user: { select: { email: true } },
            },
          },
        },
      }),
    ])

    const data = await Promise.all(
      applications.map(async (application) => {
        let aiMatchScore = application.aiMatchScore
        let aiSummary = application.aiSummary
        let aiStrengths = application.aiStrengths
        let aiGaps = application.aiGaps
        let aiRecommendation = application.aiRecommendation

        if (aiMatchScore == null) {
          const cached = await db.aiMatchScoreCache.findUnique({
            where: { seekerId_jobId: { seekerId: application.seekerId, jobId: application.jobId } },
          })

          if (cached) {
            const breakdown = (cached.breakdown ?? {}) as Record<string, unknown>
            aiMatchScore = cached.score
            aiSummary = cached.summary
            aiStrengths = Array.isArray(breakdown.strengths) ? breakdown.strengths.map(String) : []
            aiGaps = Array.isArray(breakdown.gaps) ? breakdown.gaps.map(String) : []
            aiRecommendation = cached.score >= 75 ? 'shortlist' : cached.score >= 55 ? 'review' : 'pass'
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
                id: application.seekerId,
                headline: application.seeker.headline,
                summary: application.seeker.summary,
                skills: application.seeker.skills,
                location: application.seeker.location,
                experiences: application.seeker.experiences,
                educations: application.seeker.educations,
                certifications: application.seeker.certifications,
              },
            )
            aiMatchScore = computed.score
            aiSummary = computed.summary
            aiStrengths = computed.strengths
            aiGaps = computed.gaps
            aiRecommendation = computed.score >= 75 ? 'shortlist' : computed.score >= 55 ? 'review' : 'pass'
          }
        }

        const certifications = await Promise.all(
          (application.seeker.certifications ?? []).map(async (certification) => ({
            ...certification,
            validation: await validateCertificationEvidence({
              name: certification.name,
              issuer: certification.issuer,
              issuedDate: certification.issuedDate?.toISOString(),
              expiryDate: certification.expiryDate?.toISOString(),
              credentialUrl: certification.credentialUrl,
            }, session.user.id),
          })),
        )

        return {
          ...application,
          aiMatchScore,
          aiSummary,
          aiStrengths,
          aiGaps,
          aiRecommendation,
          seeker: {
            ...application.seeker,
            certifications: certifications
              .sort((left, right) => Number(right.validation.employerVisible) - Number(left.validation.employerVisible))
              .slice(0, 4),
          },
        }
      }),
    )

    return NextResponse.json({
      data,
      meta: { total, page, per, pages: Math.ceil(total / per) },
    })
  } catch (err: any) {
    if (err.name === 'AuthError') {
      return NextResponse.json({ error: err.message }, { status: err.status ?? 401 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
