import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

// GET /api/admin/users
export async function GET(req: NextRequest) {
  try {
    await requireAdmin()
    const { searchParams } = new URL(req.url)
    const q = searchParams.get('q') ?? ''
    const role = searchParams.get('role')
    const page = parseInt(searchParams.get('page') ?? '1')
    const per = Math.min(parseInt(searchParams.get('per') ?? '25'), 100)

    const where = {
      deletedAt: null,
      ...(role ? { role: role as any } : {}),
      ...(q ? {
        OR: [
          { email: { contains: q, mode: 'insensitive' as const } },
        ],
      } : {}),
    }

    const [total, users] = await Promise.all([
      db.user.count({ where }),
      db.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * per,
        take: per,
        select: {
          id: true, email: true, role: true,
          emailVerified: true, createdAt: true,
          seekerProfile: { select: { fullName: true, aiProfileScore: true } },
          companyMemberships: {
            select: { role: true, company: { select: { name: true } } },
          },
        },
      }),
    ])

    return NextResponse.json({
      data: users,
      meta: { total, page, per, pages: Math.ceil(total / per) },
    })
  } catch (err: any) {
    if (err.name === 'AuthError') return NextResponse.json({ error: err.message }, { status: err.status })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/admin/users/:id — deactivate / reset password / change role
const updateUserSchema = z.object({
  deletedAt: z.string().datetime().nullable().optional(),
  role: z.enum(['job_seeker', 'employer_admin', 'employer_member', 'super_admin']).optional(),
  emailVerified: z.boolean().optional(),
})
