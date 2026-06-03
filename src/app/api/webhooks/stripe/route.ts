export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { db } from '@/lib/db'

let _stripe: Stripe | null = null
function getStripe() {
  if (!_stripe) _stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? 'sk_placeholder', { apiVersion: '2025-02-24.acacia' })
  return _stripe
}

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = getStripe().webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err: any) {
    console.error('[stripe-webhook] signature verification failed:', err.message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const companyId = (event.data.object as any)?.metadata?.companyId

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const tier = session.metadata?.tier
      if (companyId && tier) {
        await db.company.update({
          where: { id: companyId },
          data: { subscriptionTier: tier as any, subscriptionStatus: 'active' },
        })
        await db.subscriptionEvent.create({
          data: {
            companyId,
            fromTier: 'free',
            toTier: tier as any,
            fromStatus: 'free',
            toStatus: 'active',
            stripeEventId: event.id,
            notes: 'Stripe checkout completed',
          },
        })
      }
      break
    }

    case 'invoice.payment_succeeded': {
      if (companyId) {
        await db.company.update({
          where: { id: companyId },
          data: { subscriptionStatus: 'active' },
        })
      }
      break
    }

    case 'invoice.payment_failed': {
      if (companyId) {
        await db.company.update({
          where: { id: companyId },
          data: { subscriptionStatus: 'past_due' },
        })
      }
      break
    }

    case 'customer.subscription.deleted': {
      if (companyId) {
        await db.company.update({
          where: { id: companyId },
          data: { subscriptionTier: 'free', subscriptionStatus: 'cancelled' },
        })
        await db.subscriptionEvent.create({
          data: {
            companyId,
            fromTier: (event.data.object as any).metadata?.tier ?? 'growth',
            toTier: 'free',
            fromStatus: 'active',
            toStatus: 'cancelled',
            stripeEventId: event.id,
            notes: 'Subscription cancelled via Stripe',
          },
        })
      }
      break
    }

    default:
      break
  }

  return NextResponse.json({ received: true })
}
