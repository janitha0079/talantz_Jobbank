import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { requireSeeker } from '@/lib/auth'

const experienceSchema = z.object({
  title: z.string().min(1).max(120),
  company: z.string().min(1).max(120),
  location: z.string().max(100).optional(),
  startDate: z.string().datetime().optional().nullable(),
  endDate: z.string().datetime().optional().nullable(),
  isCurrent: z.boolean().default(false),
  description: z.string().max(2000).optional(),
  sortOrder: z.number().int().default(0),
})

async function getProfile(userId: string) {
  const profile = await db.seekerProfile.findUnique({ where: { userId } })
  if (!profile) throw new Error('Profile not found')
  return profile
}

// GET /api/profile/experience
export async function GET() {
  try {
    const session = await requireSeeker()
    const profile = await getProfile(session.user.id)
    const experiences = await db.seekerExperience.findMany({
      where: { profileId: profile.id },
      orderBy: { sortOrder: 'asc' },
    })
    return NextResponse.json({ data: experiences })
  } catch (err: any) {
    if (err.name === 'AuthError') return NextResponse.json({ error: err.message }, { status: err.status })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/profile/experience
export async function POST(req: NextRequest) {
  try {
    const session = await requireSeeker()
    const profile = await getProfile(session.user.id)
    const body = await req.json()
    const data = experienceSchema.parse(body)

    const exp = await db.seekerExperience.create({
      data: {
        profileId: profile.id,
        ...data,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
      },
    })
    return NextResponse.json({ data: exp }, { status: 201 })
  } catch (err: any) {
    if (err.name === 'AuthError') return NextResponse.json({ error: err.message }, { status: err.status })
    if (err.name === 'ZodError') return NextResponse.json({ error: 'Validation', issues: err.issues }, { status: 400 })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
