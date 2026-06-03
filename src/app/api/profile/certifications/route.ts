export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { requireSeeker } from '@/lib/auth'
import { validateCertificationEvidence } from '@/lib/ai'

const certSchema = z.object({
  name: z.string().min(1).max(200),
  issuer: z.string().max(200).optional().nullable(),
  issuedDate: z.string().optional().nullable(), // ISO date string YYYY-MM-DD
  expiryDate: z.string().optional().nullable(),
  credentialUrl: z.string().url().optional().nullable(),
})

async function getProfile(userId: string) {
  const profile = await db.seekerProfile.findUnique({ where: { userId } })
  if (!profile) throw Object.assign(new Error('Profile not found'), { name: 'NotFoundError', status: 404 })
  return profile
}

async function serializeCertification(cert: {
  name: string
  issuer: string | null
  issuedDate: Date | null
  expiryDate: Date | null
  credentialUrl: string | null
} & Record<string, unknown>, userId: string) {
  return {
    ...cert,
    validation: await validateCertificationEvidence({
      name: cert.name,
      issuer: cert.issuer,
      issuedDate: cert.issuedDate?.toISOString(),
      expiryDate: cert.expiryDate?.toISOString(),
      credentialUrl: cert.credentialUrl,
    }, userId),
  }
}

// GET /api/profile/certifications
export async function GET() {
  try {
    const session = await requireSeeker()
    const profile = await getProfile(session.user.id)
    const certs = await db.seekerCertification.findMany({
      where: { profileId: profile.id },
      orderBy: { issuedDate: 'desc' },
    })
    const serialized = await Promise.all(certs.map((cert) => serializeCertification(cert, session.user.id)))
    return NextResponse.json({ data: serialized })
  } catch (err: any) {
    if (err.name === 'AuthError') return NextResponse.json({ error: err.message }, { status: err.status ?? 401 })
    if (err.name === 'NotFoundError') return NextResponse.json({ error: err.message }, { status: 404 })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/profile/certifications
export async function POST(req: NextRequest) {
  try {
    const session = await requireSeeker()
    const profile = await getProfile(session.user.id)
    const body = await req.json()
    const data = certSchema.parse(body)

    const cert = await db.seekerCertification.create({
      data: {
        profileId: profile.id,
        name: data.name,
        issuer: data.issuer ?? null,
        issuedDate: data.issuedDate ? new Date(data.issuedDate) : null,
        expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
        credentialUrl: data.credentialUrl ?? null,
      },
    })
    return NextResponse.json({ data: await serializeCertification(cert, session.user.id) }, { status: 201 })
  } catch (err: any) {
    if (err.name === 'AuthError') return NextResponse.json({ error: err.message }, { status: err.status ?? 401 })
    if (err.name === 'NotFoundError') return NextResponse.json({ error: err.message }, { status: 404 })
    if (err.name === 'ZodError') return NextResponse.json({ error: 'Validation error', issues: err.issues }, { status: 400 })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
