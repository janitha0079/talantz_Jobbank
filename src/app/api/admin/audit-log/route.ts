import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    await requireAdmin()
    const { searchParams } = new URL(req.url)
    const q = searchParams.get('q') ?? ''
    const action = searchParams.get('action')
    const page = parseInt(searchParams.get('page') ?? '1')
    const per = Math.min(parseInt(searchParams.get('per') ?? '50'), 100)

    const where: any = {}
    if (action) where.action = action
    if (q) {
      where.OR = [
        { action: { contains: q, mode: 'insensitive' } },
        { affectedTable: { contains: q, mode: 'insensitive' } },
        { affectedId: { contains: q, mode: 'insensitive' } },
      ]
    }

    const [total, entries] = await Promise.all([
      db.auditLog.count({ where }),
      db.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * per,
        take: per,
        include: {
          user: { select: { email: true, role: true } },
        },
      }),
    ])

    return NextResponse.json({
      data: entries,
      meta: { total, page, per, pages: Math.ceil(total / per) },
    })
  } catch (err: any) {
    if (err.name === 'AuthError') return NextResponse.json({ error: err.message }, { status: err.status })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
