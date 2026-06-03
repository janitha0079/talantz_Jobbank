import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { requireSeeker } from '@/lib/auth'

const educationSchema = z.object({
  institution: z.string().min(1).max(200),
  degree: z.string().max(120).optional().nullable(),
  field: z.string().max(120).optional().nullable(),
  startYear: z.number().int().min(1950).max(2100).optional().nullable(),
  endYear: z.number().int().min(1950).max(2100).optional().nullable(),
  grade: z.string().max(50).optional().nullable(),
  description: z.string().max(1000).optional().nullable(),
})

async function getProfile(userId: string) {
  const profile = await db.seekerProfile.findUnique({ where: { userId } })
  if (!profile) throw Object.assign(new Error('Profile not found'), { name: 'NotFoundError', status: 404 })
  return profile
}

// GET /api/profile/education
export async function GET() {
  try {
    const session = await requireSeeker()
    const profile = await getProfile(session.user.id)
    const education = await db.seekerEducation.findMany({
      where: { profileId: profile.id },
      orderBy: [{ endYear: 'desc' }, { startYear: 'desc' }],
    })
    return NextResponse.json({ data: education })
  } catch (err: any) {
    if (err.name === 'AuthError') return NextResponse.json({ error: err.message }, { status: err.status ?? 401 })
    if (err.name === 'NotFoundError') return NextResponse.json({ error: err.message }, { status: 404 })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/profile/education
export async function POST(req: NextRequest) {
  try {
    const session = await requireSeeker()
    const profile = await getProfile(session.user.id)
    const body = await req.json()
    const data = educationSchema.parse(body)

    const edu = await db.seekerEducation.create({
      data: { profileId: profile.id, ...data },
    })
    return NextResponse.json({ data: edu }, { status: 201 })
  } catch (err: any) {
    if (err.name === 'AuthError') return NextResponse.json({ error: err.message }, { status: err.status ?? 401 })
    if (err.name === 'NotFoundError') return NextResponse.json({ error: err.message }, { status: 404 })
    if (err.name === 'ZodError') return NextResponse.json({ error: 'Validation error', issues: err.issues }, { status: 400 })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
