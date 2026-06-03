export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { registerSchema } from '@/lib/auth/schemas'
import { sendVerificationEmail } from '@/lib/email'
import slugify from 'slugify'
import { nanoid } from 'nanoid'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = registerSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', issues: parsed.error.issues },
        { status: 400 },
      )
    }

    const { firstName, lastName, email, password } = parsed.data
    const normalised = email.toLowerCase()

    // Check existing user
    const existing = await db.user.findUnique({
      where: { email: normalised },
    })
    if (existing) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 },
      )
    }

    // Hash password (cost 12 per spec)
    const passwordHash = await bcrypt.hash(password, 12)

    // In dev (or when Resend isn't configured) skip email verification so
    // users can sign in immediately without needing a real email API key.
    const skipVerification =
      process.env.NODE_ENV !== 'production' ||
      !process.env.RESEND_API_KEY ||
      process.env.RESEND_API_KEY === ''

    const user = await db.$transaction(async (tx) => {
      if (parsed.data.audience === 'employer') {
        const newUser = await tx.user.create({
          data: {
            email: normalised,
            emailVerified: skipVerification,
            role: 'employer_admin',
            passwordHash,
          },
        })

        const baseSlug = slugify(parsed.data.companyName, { lower: true, strict: true }) || `company-${nanoid(6)}`
        let slug = baseSlug
        const existingCompany = await tx.company.findUnique({ where: { slug } })
        if (existingCompany) slug = `${baseSlug}-${nanoid(4)}`

        const tierMap = {
          single: 'free',
          monthly: 'growth',
          bulk: 'enterprise',
        } as const

        const statusMap = {
          single: 'free',
          monthly: 'trial',
          bulk: 'trial',
        } as const

        const company = await tx.company.create({
          data: {
            name: parsed.data.companyName,
            slug,
            industry: parsed.data.industry || undefined,
            companySize: parsed.data.companySize,
            website: parsed.data.website || undefined,
            supportEmail: normalised,
            subscriptionTier: tierMap[parsed.data.plan],
            subscriptionStatus: statusMap[parsed.data.plan],
            createdBy: newUser.id,
            onboardedAt: skipVerification ? new Date() : null,
          },
        })

        await tx.companyMember.create({
          data: {
            companyId: company.id,
            userId: newUser.id,
            role: 'admin',
            acceptedAt: skipVerification ? new Date() : null,
          },
        })

        return newUser
      }

      const newUser = await tx.user.create({
        data: {
          email: normalised,
          emailVerified: skipVerification,
          role: 'job_seeker',
          passwordHash,
        },
      })

      await tx.seekerProfile.create({
        data: {
          userId: newUser.id,
          fullName: `${firstName} ${lastName}`,
          isPublic: true,
        },
      })

      return newUser
    })

    // Send verification email (skip in dev / when Resend isn't configured)
    if (!skipVerification) {
      await sendVerificationEmail({
        to: normalised,
        name: `${firstName} ${lastName}`,
        userId: user.id,
      })
    }

    const accountLabel = parsed.data.audience === 'employer' ? 'Employer account' : 'Account'
    const message = skipVerification
      ? `${accountLabel} created. You can sign in now.`
      : `${accountLabel} created. Check your email to verify.`

    return NextResponse.json({ message }, { status: 201 })
  } catch (err) {
    console.error('[register]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
