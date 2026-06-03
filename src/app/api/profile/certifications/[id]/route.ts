import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { requireSeeker } from '@/lib/auth'
import { validateCertificationEvidence } from '@/lib/ai'

const certSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  issuer: z.string().max(200).optional().nullable(),
  issuedDate: z.string().optional().nullable(),
  expiryDate: z.string().optional().nullable(),
  credentialUrl: z.string().url().optional().nullable(),
})

async function getOwnedRecord(userId: string, id: string) {
  const profile = await db.seekerProfile.findUnique({ where: { userId } })
  if (!profile) throw Object.assign(new Error('Profile not found'), { name: 'NotFoundError', status: 404 })

  const cert = await db.seekerCertification.findFirst({ where: { id, profileId: profile.id } })
  if (!cert) throw Object.assign(new Error('Not found'), { name: 'NotFoundError', status: 404 })
  return cert
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

// PUT /api/profile/certifications/[id]
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireSeeker()
    await getOwnedRecord(session.user.id, params.id)
    const body = await req.json()
    const data = certSchema.parse(body)

    const updated = await db.seekerCertification.update({
      where: { id: params.id },
      data: {
        ...data,
        issuedDate: data.issuedDate !== undefined ? (data.issuedDate ? new Date(data.issuedDate) : null) : undefined,
        expiryDate: data.expiryDate !== undefined ? (data.expiryDate ? new Date(data.expiryDate) : null) : undefined,
      },
    })
    return NextResponse.json({ data: await serializeCertification(updated, session.user.id) })
  } catch (err: any) {
    if (err.name === 'AuthError') return NextResponse.json({ error: err.message }, { status: err.status ?? 401 })
    if (err.name === 'NotFoundError') return NextResponse.json({ error: err.message }, { status: 404 })
    if (err.name === 'ZodError') return NextResponse.json({ error: 'Validation error', issues: err.issues }, { status: 400 })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/profile/certifications/[id]
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireSeeker()
    await getOwnedRecord(session.user.id, params.id)

    await db.seekerCertification.delete({ where: { id: params.id } })
    return NextResponse.json({ message: 'Deleted' })
  } catch (err: any) {
    if (err.name === 'AuthError') return NextResponse.json({ error: err.message }, { status: err.status ?? 401 })
    if (err.name === 'NotFoundError') return NextResponse.json({ error: err.message }, { status: 404 })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
