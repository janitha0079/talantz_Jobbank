export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { sendInvitationEmail } from '@/lib/email'
import slugify from 'slugify'
import { nanoid } from 'nanoid'

const createCompanySchema = z.object({
  name: z.string().min(2).max(120),
  contactName: z.string().min(1).max(100),
  contactEmail: z.string().email(),
  industry: z.string().optional(),
  companySize: z.enum(['size_1_10','size_11_50','size_51_200','size_201_500','size_500_plus']).optional(),
  subscriptionTier: z.enum(['free','growth','enterprise']).default('free'),
  notes: z.string().optional(),
})

// ── GET /api/admin/companies ─────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    await requireAdmin()
    const { searchParams } = new URL(req.url)
    const q = searchParams.get('q') ?? ''
    const page = parseInt(searchParams.get('page') ?? '1')
    const per = Math.min(parseInt(searchParams.get('per') ?? '25'), 100)
    const tier = searchParams.get('tier')

    const where = {
      deletedAt: null,
      ...(tier ? { subscriptionTier: tier as any } : {}),
      ...(q ? {
        OR: [
          { name: { contains: q, mode: 'insensitive' as const } },
          { industry: { contains: q, mode: 'insensitive' as const } },
        ],
      } : {}),
    }

    const [total, companies] = await Promise.all([
      db.company.count({ where }),
      db.company.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * per,
        take: per,
        include: {
          _count: {
            select: {
              jobs: { where: { status: 'active', deletedAt: null } },
              members: true,
            },
          },
        },
      }),
    ])

    return NextResponse.json({
      data: companies,
      meta: { total, page, per, pages: Math.ceil(total / per) },
    })
  } catch (err: any) {
    if (err.name === 'AuthError') return NextResponse.json({ error: err.message }, { status: err.status })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ── POST /api/admin/companies — create company + send invitation ──────

export async function POST(req: NextRequest) {
  try {
    const session = await requireAdmin()
    const body = await req.json()
    const data = createCompanySchema.parse(body)

    // Generate unique slug
    const baseSlug = slugify(data.name, { lower: true, strict: true })
    let slug = baseSlug
    const existing = await db.company.findUnique({ where: { slug } })
    if (existing) slug = `${baseSlug}-${nanoid(4)}`

    // Create company + invitation in a transaction
    const { company, invitation } = await db.$transaction(async (tx) => {
      const company = await tx.company.create({
        data: {
          name: data.name,
          slug,
          industry: data.industry,
          companySize: data.companySize,
          subscriptionTier: data.subscriptionTier,
          createdBy: session.user.id,
        },
      })

      const token = nanoid(32)
      const invitation = await tx.invitation.create({
        data: {
          companyId: company.id,
          email: data.contactEmail,
          role: 'admin',
          token,
          sentBy: session.user.id,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        },
      })

      return { company, invitation }
    })

    // Send invitation email
    await sendInvitationEmail({
      to: data.contactEmail,
      contactName: data.contactName,
      companyName: data.name,
      token: invitation.token,
      subscriptionTier: data.subscriptionTier,
    })

    // Audit log
    await db.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'company.created',
        affectedTable: 'companies',
        affectedId: company.id,
        payload: { name: company.name, tier: data.subscriptionTier, contactEmail: data.contactEmail },
        ipAddress: req.headers.get('x-forwarded-for') ?? 'unknown',
      },
    })

    return NextResponse.json({ data: company, invitation }, { status: 201 })
  } catch (err: any) {
    if (err.name === 'AuthError') return NextResponse.json({ error: err.message }, { status: err.status })
    if (err.name === 'ZodError') return NextResponse.json({ error: 'Validation', issues: err.issues }, { status: 400 })
    console.error('[POST /admin/companies]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
