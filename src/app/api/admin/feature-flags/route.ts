import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

// ── Feature Flags ────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    await requireAdmin()
    const flags = await db.featureFlag.findMany({ orderBy: { flagName: 'asc' } })
    return NextResponse.json({ data: flags })
  } catch (err: any) {
    if (err.name === 'AuthError') return NextResponse.json({ error: err.message }, { status: err.status })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

const flagSchema = z.object({
  enabledGlobally: z.boolean().optional(),
  enabledCompanyIds: z.array(z.string()).optional(),
})

export async function PUT(req: NextRequest) {
  try {
    const session = await requireAdmin()
    const { searchParams } = new URL(req.url)
    const flagName = searchParams.get('flag')
    if (!flagName) return NextResponse.json({ error: 'flag param required' }, { status: 400 })

    const body = await req.json()
    const data = flagSchema.parse(body)

    const updated = await db.featureFlag.upsert({
      where: { flagName },
      update: data,
      create: { flagName, ...data },
    })

    await db.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'feature_flag.updated',
        affectedTable: 'feature_flags',
        affectedId: flagName,
        payload: data,
        ipAddress: req.headers.get('x-forwarded-for') ?? 'unknown',
      },
    })

    return NextResponse.json({ data: updated })
  } catch (err: any) {
    if (err.name === 'AuthError') return NextResponse.json({ error: err.message }, { status: err.status })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
