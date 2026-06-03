import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { requireRole, auth } from '@/lib/auth'

// ── GET /api/companies/:slug — public company profile ────────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } },
) {
  const company = await db.company.findUnique({
    where: { slug: params.slug, deletedAt: null, suspendedAt: null },
    select: {
      id: true, name: true, slug: true, description: true,
      industry: true, companySize: true, foundedYear: true,
      website: true, logoUrl: true, coverUrl: true,
      headquarters: true, linkedinUrl: true, isVerified: true,
      onboardedAt: true,
      locations: { select: { address: true, city: true, country: true, isPrimary: true } },
      _count: {
        select: { jobs: { where: { status: 'active', deletedAt: null } } },
      },
    },
  })

  if (!company) {
    return NextResponse.json({ error: 'Company not found' }, { status: 404 })
  }

  return NextResponse.json({ data: company })
}

// ── PUT /api/companies/:slug — update company (employer admin only) ───

const updateCompanySchema = z.object({
  description: z.string().max(2000).optional(),
  industry: z.string().optional(),
  companySize: z.enum(['size_1_10','size_11_50','size_51_200','size_201_500','size_500_plus']).optional(),
  foundedYear: z.number().int().min(1800).max(new Date().getFullYear()).optional(),
  website: z.string().url().optional().nullable(),
  linkedinUrl: z.string().url().optional().nullable(),
  facebookUrl: z.string().url().optional().nullable(),
  supportEmail: z.string().email().optional().nullable(),
  supportPhone: z.string().optional().nullable(),
  headquarters: z.string().optional(),
})

export async function PUT(
  req: NextRequest,
  { params }: { params: { slug: string } },
) {
  try {
    const session = await requireRole(['employer_admin', 'super_admin'])
    const body = await req.json()
    const data = updateCompanySchema.parse(body)

    const company = await db.company.findUnique({
      where: { slug: params.slug, deletedAt: null },
      include: { members: true },
    })

    if (!company) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Non-admin users must be an admin member of this company
    if (session.user.role !== 'super_admin') {
      const isAdmin = company.members.some(
        (m: { userId: string; role: string }) => m.userId === session.user.id && m.role === 'admin',
      )
      if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const updated = await db.company.update({
      where: { id: company.id },
      data,
    })

    return NextResponse.json({ data: updated })
  } catch (err: any) {
    if (err.name === 'AuthError') return NextResponse.json({ error: err.message }, { status: err.status })
    if (err.name === 'ZodError') return NextResponse.json({ error: 'Validation', issues: err.issues }, { status: 400 })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
