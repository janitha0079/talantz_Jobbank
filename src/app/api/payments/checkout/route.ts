import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { z } from 'zod'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/auth'

// Lazy init — avoids crash at build time when STRIPE_SECRET_KEY is not set
let _stripe: Stripe | null = null
function getStripe() {
  if (!_stripe) _stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? 'sk_placeholder', { apiVersion: '2025-02-24.acacia' })
  return _stripe
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL!

// Stripe price IDs — set these in your Stripe dashboard + .env
const PRICES: Record<string, string> = {
  growth_monthly: process.env.STRIPE_PRICE_GROWTH_MONTHLY ?? 'price_growth_monthly',
  enterprise_monthly: process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY ?? 'price_enterprise_monthly',
}

const checkoutSchema = z.object({
  tier: z.enum(['growth', 'enterprise']),
  billingPeriod: z.enum(['monthly', 'annual']).default('monthly'),
})

// POST /api/payments/checkout
export async function POST(req: NextRequest) {
  try {
    const session = await requireRole(['employer_admin'])
    const body = await req.json()
    const { tier, billingPeriod } = checkoutSchema.parse(body)

    // Get the company this employer manages
    const membership = await db.companyMember.findFirst({
      where: { userId: session.user.id, role: 'admin' },
      include: { company: true },
    })
    if (!membership) {
      return NextResponse.json({ error: 'No company found' }, { status: 400 })
    }

    const priceKey = `${tier}_${billingPeriod}`
    const priceId = PRICES[priceKey]
    if (!priceId) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    const checkoutSession = await getStripe().checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${APP_URL}/employer/settings?upgrade=success`,
      cancel_url: `${APP_URL}/employer/settings?upgrade=cancelled`,
      customer_email: session.user.email,
      metadata: {
        companyId: membership.companyId,
        userId: session.user.id,
        tier,
      },
      subscription_data: {
        metadata: {
          companyId: membership.companyId,
          tier,
        },
      },
    })

    return NextResponse.json({ url: checkoutSession.url })
  } catch (err: any) {
    if (err.name === 'AuthError') return NextResponse.json({ error: err.message }, { status: err.status })
    console.error('[checkout]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
