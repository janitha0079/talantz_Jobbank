export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireSeeker } from '@/lib/auth'
import { enhanceBulletPoint, suggestProfileSkills } from '@/lib/ai'
import { db } from '@/lib/db'
import { checkAIFeatureAccess, recordAIFeatureUsage } from '@/lib/features/access-control'

const enhanceSchema = z.object({
  action: z.enum(['enhance_bullet', 'suggest_skills']),
  bullet: z.string().max(500).optional(),
  title: z.string().optional(),
  company: z.string().optional(),
})

// POST /api/profile/ai-enhance
export async function POST(req: NextRequest) {
  try {
    const session = await requireSeeker()
    const body = await req.json()
    const { action, bullet, title, company } = enhanceSchema.parse(body)

    // Check feature access
    const access = await checkAIFeatureAccess(session.user.id, action as any)

    if (!access.allowed) {
      return NextResponse.json(
        {
          error: 'Limit reached',
          message: access.message,
          feature: action,
          remaining: access.remaining,
          limit: access.limit,
          shouldShowUpsell: access.shouldShowUpsell,
          nextResetDate: access.nextResetDate,
        },
        { status: 429 }
      )
    }

    if (action === 'enhance_bullet') {
      if (!bullet || !title || !company) {
        return NextResponse.json({ error: 'bullet, title and company required' }, { status: 400 })
      }
      const suggestions = await enhanceBulletPoint(bullet, { title, company }, session.user.id)

      // Record usage
      await recordAIFeatureUsage(session.user.id, 'enhance_bullet')

      return NextResponse.json({
        data: suggestions,
        remaining: access.remaining - 1,
        limit: access.limit,
      })
    }

    if (action === 'suggest_skills') {
      const profile = await db.seekerProfile.findUnique({
        where: { userId: session.user.id },
        include: { experiences: { take: 5, orderBy: { sortOrder: 'asc' } } },
      })
      if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

      const suggestions = await suggestProfileSkills({
        headline: profile.headline ?? '',
        experiences: profile.experiences,
        currentSkills: profile.skills,
        userId: session.user.id,
      })

      // Record usage
      await recordAIFeatureUsage(session.user.id, 'suggest_skills')

      return NextResponse.json({
        data: suggestions,
        remaining: access.remaining - 1,
        limit: access.limit,
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (err: any) {
    if (err.name === 'AuthError') return NextResponse.json({ error: err.message }, { status: err.status })
    if (err.name === 'ZodError') return NextResponse.json({ error: 'Validation', issues: err.issues }, { status: 400 })
    console.error('[ai-enhance]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
