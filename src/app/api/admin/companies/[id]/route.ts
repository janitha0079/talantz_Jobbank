import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

const adminUpdateSchema = z.object({
  isVerified: z.boolean().optional(),
  subscriptionTier: z.enum(['free', 'growth', 'enterprise']).optional(),
  subscriptionStatus: z.enum(['free','trial','active','past_due','cancelled','expired']).optional(),
  suspendedAt: z.string().datetime().optional().nullable(),
  notes: z.string().optional(),
})

// GET /api/admin/companies/:id
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await requireAdmin()
    const company = await db.company.findUnique({
      where: { id: params.id },
      include: {
        members: { include: { user: { select: { id: true, email: true, role: true } } } },
        locations: true,
        jobs: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: { id: true, title: true, status: true, applicationsCount: true, createdAt: true },
        },
        subscriptionHistory: { orderBy: { createdAt: 'desc' }, take: 10 },
        _count: {
          select: {
            jobs: true,
            members: true,
            invitations: true,
          },
        },
      },
    })

    if (!company) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ data: company })
  } catch (err: any) {
    if (err.name === 'AuthError') return NextResponse.json({ error: err.message }, { status: err.status })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/admin/companies/:id
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await requireAdmin()
    const body = await req.json()
    const data = adminUpdateSchema.parse(body)

    const company = await db.company.findUnique({ where: { id: params.id } })
    if (!company) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const updated = await db.company.update({
      where: { id: params.id },
      data: {
        ...data,
        suspendedAt: data.suspendedAt === null
          ? null
          : data.suspendedAt
          ? new Date(data.suspendedAt)
          : undefined,
      },
    })

    // Log subscription changes
    if (data.subscriptionTier && data.subscriptionTier !== company.subscriptionTier) {
      await db.subscriptionEvent.create({
        data: {
          companyId: company.id,
          fromTier: company.subscriptionTier,
          toTier: data.subscriptionTier,
          fromStatus: company.subscriptionStatus,
          toStatus: data.subscriptionStatus ?? company.subscriptionStatus,
          actorId: session.user.id,
          notes: 'Manual tier change by admin',
        },
      })
    }

    // Audit log
    await db.auditLog.create({
      data: {
        userId: session.user.id,
        action: data.suspendedAt ? 'company.suspended' : data.isVerified ? 'company.verified' : 'company.updated',
        affectedTable: 'companies',
        affectedId: company.id,
        payload: data,
        ipAddress: req.headers.get('x-forwarded-for') ?? 'unknown',
      },
    })

    return NextResponse.json({ data: updated })
  } catch (err: any) {
    if (err.name === 'AuthError') return NextResponse.json({ error: err.message }, { status: err.status })
    if (err.name === 'ZodError') return NextResponse.json({ error: 'Validation', issues: err.issues }, { status: 400 })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
