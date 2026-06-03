export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { requireSeeker } from '@/lib/auth'

const educationSchema = z.object({
  institution: z.string().min(1).max(200).optional(),
  degree: z.string().max(120).optional().nullable(),
  field: z.string().max(120).optional().nullable(),
  startYear: z.number().int().min(1950).max(2100).optional().nullable(),
  endYear: z.number().int().min(1950).max(2100).optional().nullable(),
  grade: z.string().max(50).optional().nullable(),
  description: z.string().max(1000).optional().nullable(),
})

async function getOwnedRecord(userId: string, id: string) {
  const profile = await db.seekerProfile.findUnique({ where: { userId } })
  if (!profile) throw Object.assign(new Error('Profile not found'), { name: 'NotFoundError', status: 404 })

  const edu = await db.seekerEducation.findFirst({ where: { id, profileId: profile.id } })
  if (!edu) throw Object.assign(new Error('Not found'), { name: 'NotFoundError', status: 404 })
  return edu
}

// PUT /api/profile/education/[id]
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireSeeker()
    await getOwnedRecord(session.user.id, params.id)
    const body = await req.json()
    const data = educationSchema.parse(body)

    const updated = await db.seekerEducation.update({
      where: { id: params.id },
      data,
    })
    return NextResponse.json({ data: updated })
  } catch (err: any) {
    if (err.name === 'AuthError') return NextResponse.json({ error: err.message }, { status: err.status ?? 401 })
    if (err.name === 'NotFoundError') return NextResponse.json({ error: err.message }, { status: 404 })
    if (err.name === 'ZodError') return NextResponse.json({ error: 'Validation error', issues: err.issues }, { status: 400 })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/profile/education/[id]
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireSeeker()
    await getOwnedRecord(session.user.id, params.id)

    await db.seekerEducation.delete({ where: { id: params.id } })
    return NextResponse.json({ message: 'Deleted' })
  } catch (err: any) {
    if (err.name === 'AuthError') return NextResponse.json({ error: err.message }, { status: err.status ?? 401 })
    if (err.name === 'NotFoundError') return NextResponse.json({ error: err.message }, { status: 404 })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
