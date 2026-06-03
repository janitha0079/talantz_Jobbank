export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { auth, requireRole } from '@/lib/auth'
import slugify from 'slugify'
import { nanoid } from 'nanoid'
import type { Prisma, JobStatus } from '@prisma/client'

// ── Validation ───────────────────────────────────────────────────────

const createJobSchema = z.object({
  title: z.string().min(3).max(120),
  description: z.string().min(50),
  requirements: z.array(z.string()).optional().default([]),
  responsibilities: z.array(z.string()).optional().default([]),
  skillsRequired: z.array(z.string()).min(1),
  skillsPreferred: z.array(z.string()).optional().default([]),
  jobType: z.enum(['full_time', 'part_time', 'contract', 'internship', 'freelance']),
  workMode: z.enum(['onsite', 'remote', 'hybrid']),
  location: z.string().optional(),
  salaryMin: z.number().int().positive().optional(),
  salaryMax: z.number().int().positive().optional(),
  salaryCurrency: z.string().default('LKR'),
  salaryVisible: z.boolean().default(false),
  experienceMin: z.number().int().min(0).optional(),
  experienceMax: z.number().int().optional(),
  educationLevel: z.string().optional(),
  closesAt: z.string().datetime().optional(),
  status: z.enum(['draft', 'active']).default('draft'),
  aiGeneratedJd: z.boolean().default(false),
})

const listJobsSchema = z.object({
  q: z.string().optional(),
  jobType: z.string().optional(),
  workMode: z.string().optional(),
  location: z.string().optional(),
  industry: z.string().optional(),
  experienceMin: z.coerce.number().optional(),
  salaryMin: z.coerce.number().optional(),
  salaryMax: z.coerce.number().optional(),
  page: z.coerce.number().default(1),
  per: z.coerce.number().max(50).default(20),
  sort: z.enum(['newest', 'salary', 'relevance']).default('newest'),
  companyId: z.string().optional(),
  status: z.string().optional(),
})

// ── GET /api/jobs — public search ────────────────────────────────────

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const params = Object.fromEntries(searchParams)
  const query = listJobsSchema.parse(params)

  const where: Prisma.JobWhereInput = {
    deletedAt: null,
    status: (query.status as JobStatus | undefined) ?? 'active',
  }

  // Full-text / keyword search
  if (query.q) {
    where.OR = [
      { title: { contains: query.q, mode: 'insensitive' } },
      { description: { contains: query.q, mode: 'insensitive' } },
      { skillsRequired: { has: query.q } },
    ]
  }

  if (query.jobType) where.jobType = query.jobType as any
  if (query.workMode) where.workMode = query.workMode as any
  if (query.location) where.location = { contains: query.location, mode: 'insensitive' }
  if (query.companyId) where.companyId = query.companyId
  if (query.salaryMin) where.salaryMax = { gte: query.salaryMin }
  if (query.salaryMax) where.salaryMin = { lte: query.salaryMax }
  if (query.experienceMin !== undefined) {
    where.experienceMin = { lte: query.experienceMin }
  }

  const orderBy: Prisma.JobOrderByWithRelationInput =
    query.sort === 'salary'
      ? { salaryMax: 'desc' }
      : { createdAt: 'desc' }

  const [total, jobs] = await Promise.all([
    db.job.count({ where }),
    db.job.findMany({
      where,
      orderBy,
      skip: (query.page - 1) * query.per,
      take: query.per,
      include: {
        company: {
          select: {
            id: true,
            name: true,
            slug: true,
            logoUrl: true,
            isVerified: true,
            headquarters: true,
          },
        },
      },
    }),
  ])

  return NextResponse.json({
    data: jobs,
    meta: {
      total,
      page: query.page,
      per: query.per,
      pages: Math.ceil(total / query.per),
    },
  })
}

// ── POST /api/jobs — create job (employer only) ───────────────────────

export async function POST(req: NextRequest) {
  try {
    const session = await requireRole(['employer_admin', 'employer_member'])
    const body = await req.json()
    const data = createJobSchema.parse(body)

    // Determine which company this user belongs to
    const membership = await db.companyMember.findFirst({
      where: { userId: session.user.id, company: { deletedAt: null } },
      include: { company: true },
    })

    if (!membership) {
      return NextResponse.json({ error: 'Not associated with any company' }, { status: 403 })
    }

    // Check job listing limit based on subscription tier
    const tier = membership.company.subscriptionTier as 'free' | 'growth' | 'enterprise'
    const limits: Record<string, number> = { free: 3, growth: 15, enterprise: Infinity }
    const limit = limits[tier] ?? 3

    const activeCount = await db.job.count({
      where: { companyId: membership.companyId, status: 'active', deletedAt: null },
    })

    if (activeCount >= limit) {
      return NextResponse.json(
        { error: `Your ${tier} plan allows ${limit} active listings. Upgrade to post more.` },
        { status: 403 },
      )
    }

    // Generate unique slug
    const baseSlug = slugify(data.title, { lower: true, strict: true })
    const slug = `${baseSlug}-${nanoid(6)}`

    const job = await db.job.create({
      data: {
        ...data,
        slug,
        companyId: membership.companyId,
        postedBy: session.user.id,
        closesAt: data.closesAt ? new Date(data.closesAt) : undefined,
      },
      include: {
        company: { select: { name: true, logoUrl: true, isVerified: true } },
      },
    })

    // Log audit
    await db.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'job.created',
        affectedTable: 'jobs',
        affectedId: job.id,
        payload: { title: job.title, status: job.status },
      },
    })

    return NextResponse.json({ data: job }, { status: 201 })
  } catch (err: any) {
    if (err.name === 'AuthError') {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    if (err.name === 'ZodError') {
      return NextResponse.json({ error: 'Validation error', issues: err.issues }, { status: 400 })
    }
    console.error('[POST /jobs]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
