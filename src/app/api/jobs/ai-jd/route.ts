import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/auth'
import { generateJobDescription } from '@/lib/ai'

const schema = z.object({
  title: z.string().min(2).max(120),
  requirements: z.array(z.string()).min(1),
  workMode: z.enum(['onsite', 'remote', 'hybrid']),
  location: z.string().optional(),
})

// POST /api/jobs/ai-jd
export async function POST(req: NextRequest) {
  try {
    const session = await requireRole(['employer_admin', 'employer_member'])
    const body = await req.json()
    const data = schema.parse(body)

    // Check feature flag
    const flag = await db.featureFlag.findUnique({ where: { flagName: 'ai_jd_builder' } })
    if (!flag?.enabledGlobally) {
      return NextResponse.json({ error: 'AI JD builder is not enabled' }, { status: 403 })
    }

    // Get company info for context
    const membership = await db.companyMember.findFirst({
      where: { userId: session.user.id },
      include: { company: { select: { name: true, industry: true } } },
    })

    const result = await generateJobDescription({
      title: data.title,
      company: membership?.company.name ?? 'Our company',
      industry: membership?.company.industry ?? 'Technology',
      requirements: data.requirements,
      workMode: data.workMode,
      location: data.location,
      userId: session.user.id,
    })

    return NextResponse.json({ data: result })
  } catch (err: any) {
    if (err.name === 'AuthError') return NextResponse.json({ error: err.message }, { status: err.status })
    if (err.name === 'ZodError') return NextResponse.json({ error: 'Validation', issues: err.issues }, { status: 400 })
    console.error('[ai-jd]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
