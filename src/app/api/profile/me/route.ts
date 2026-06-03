export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { requireSeeker, auth } from '@/lib/auth'
import { validateCertificationEvidence } from '@/lib/ai'

const updateProfileSchema = z.object({
  fullName: z.string().min(1).max(100).optional(),
  headline: z.string().max(160).optional(),
  summary: z.string().max(2000).optional(),
  location: z.string().max(100).optional(),
  phone: z.string().max(20).optional().nullable(),
  avatarUrl: z.string().refine(
    (value) => value.startsWith('http://') || value.startsWith('https://') || value.startsWith('data:image/'),
    'Avatar must be an image URL or uploaded image data',
  ).optional().nullable(),
  linkedinUrl: z.string().url().optional().nullable(),
  availability: z.enum(['immediately', 'one_month', 'three_months', 'not_looking']).optional(),
  preferredSalary: z.object({
    min: z.number().int().positive(),
    max: z.number().int().positive(),
    currency: z.string().default('LKR'),
    period: z.enum(['monthly', 'annual']).default('monthly'),
  }).optional().nullable(),
  preferredTypes: z.array(z.string()).optional(),
  skills: z.array(z.string()).max(50).optional(),
  languages: z.array(z.object({
    language: z.string(),
    proficiency: z.enum(['native', 'fluent', 'intermediate', 'basic']),
  })).optional(),
  isPublic: z.boolean().optional(),
})

// ── GET /api/profile/me ──────────────────────────────────────────────

export async function GET() {
  try {
    const session = await requireSeeker()

    const profile = await db.seekerProfile.findUnique({
      where: { userId: session.user.id },
      include: {
        experiences: { orderBy: { sortOrder: 'asc' } },
        educations: true,
        certifications: true,
        portfolioLinks: true,
      },
    })

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const certifications = await Promise.all(
      profile.certifications.map(async (certification) => ({
        ...certification,
        validation: await validateCertificationEvidence({
          name: certification.name,
          issuer: certification.issuer,
          issuedDate: certification.issuedDate?.toISOString(),
          expiryDate: certification.expiryDate?.toISOString(),
          credentialUrl: certification.credentialUrl,
        }, session.user.id),
      })),
    )

    return NextResponse.json({
      data: {
        ...profile,
        certifications,
      },
    })
  } catch (err: any) {
    if (err.name === 'AuthError') return NextResponse.json({ error: err.message }, { status: err.status })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ── PUT /api/profile/me ──────────────────────────────────────────────

export async function PUT(req: NextRequest) {
  try {
    const session = await requireSeeker()
    const body = await req.json()
    const data = updateProfileSchema.parse(body)

    const profile = await db.seekerProfile.upsert({
      where: { userId: session.user.id },
      update: {
        ...data,
        preferredSalary: data.preferredSalary ?? undefined,
        languages: data.languages ?? undefined,
      },
      create: {
        userId: session.user.id,
        ...data,
        preferredSalary: data.preferredSalary ?? undefined,
        languages: data.languages ?? undefined,
      },
    })

    // Recalculate profile completeness score
    const score = calculateProfileScore(profile)
    const updated = await db.seekerProfile.update({
      where: { id: profile.id },
      data: { aiProfileScore: score },
    })

    return NextResponse.json({ data: updated })
  } catch (err: any) {
    if (err.name === 'AuthError') return NextResponse.json({ error: err.message }, { status: err.status })
    if (err.name === 'ZodError') return NextResponse.json({ error: 'Validation', issues: err.issues }, { status: 400 })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ── Score calculator ─────────────────────────────────────────────────

function calculateProfileScore(profile: any): number {
  let score = 0
  if (profile.fullName) score += 10
  if (profile.headline) score += 10
  if (profile.summary && profile.summary.length > 50) score += 15
  if (profile.location) score += 5
  if (profile.phone) score += 5
  if (profile.avatarUrl) score += 10
  if (profile.cvUrl) score += 10
  if (profile.linkedinUrl) score += 5
  if (profile.skills?.length >= 3) score += 10
  if (profile.availability) score += 5
  if (profile.preferredSalary) score += 5
  if (profile.languages?.length > 0) score += 5
  if (profile.preferredTypes?.length > 0) score += 5
  return Math.min(score, 100)
}
