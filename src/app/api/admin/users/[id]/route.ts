import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

const updateSchema = z.object({
  role: z.enum(['job_seeker','employer_admin','employer_member','super_admin']).optional(),
  emailVerified: z.boolean().optional(),
  deactivate: z.boolean().optional(),
})

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await requireAdmin()
    const body = await req.json()
    const data = updateSchema.parse(body)

    // Prevent admin from deactivating themselves
    if (data.deactivate && params.id === session.user.id) {
      return NextResponse.json({ error: 'Cannot deactivate your own account' }, { status: 400 })
    }

    const user = await db.user.update({
      where: { id: params.id },
      data: {
        ...(data.role ? { role: data.role } : {}),
        ...(data.emailVerified !== undefined ? { emailVerified: data.emailVerified } : {}),
        ...(data.deactivate ? { deletedAt: new Date() } : {}),
      },
      select: { id: true, email: true, role: true, deletedAt: true },
    })

    await db.auditLog.create({
      data: {
        userId: session.user.id,
        action: data.deactivate ? 'user.deactivated' : 'user.updated',
        affectedTable: 'users',
        affectedId: params.id,
        payload: data,
        ipAddress: req.headers.get('x-forwarded-for') ?? 'unknown',
      },
    })

    return NextResponse.json({ data: user })
  } catch (err: any) {
    if (err.name === 'AuthError') return NextResponse.json({ error: err.message }, { status: err.status })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
