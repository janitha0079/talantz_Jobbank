export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { db } from '@/lib/db'

// PayHere webhook — handles local LKR payments for Sri Lankan companies
export async function POST(req: NextRequest) {
  const body = await req.formData()

  const merchantId = body.get('merchant_id') as string
  const orderId = body.get('order_id') as string
  const paymentId = body.get('payment_id') as string
  const payherAmount = body.get('payhere_amount') as string
  const payhereCurrency = body.get('payhere_currency') as string
  const statusCode = body.get('status_code') as string
  const md5sig = body.get('md5sig') as string

  // Verify signature
  const secret = process.env.PAYHERE_SECRET!
  const secretHash = crypto.createHash('md5').update(secret).digest('hex').toUpperCase()
  const sigString = `${merchantId}${orderId}${payherAmount}${payhereCurrency}${statusCode}${secretHash}`
  const expectedSig = crypto.createHash('md5').update(sigString).digest('hex').toUpperCase()

  if (md5sig !== expectedSig) {
    console.error('[payhere] invalid signature')
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  // orderId format: {companyId}_{tier}_{timestamp}
  const [companyId, tier] = orderId.split('_')

  if (statusCode === '2') {
    // Payment successful
    await db.company.update({
      where: { id: companyId },
      data: {
        subscriptionTier: tier as any,
        subscriptionStatus: 'active',
      },
    })

    await db.subscriptionEvent.create({
      data: {
        companyId,
        fromTier: 'free',
        toTier: tier as any,
        fromStatus: 'free',
        toStatus: 'active',
        stripeEventId: paymentId,
        notes: `PayHere payment successful — ${payhereCurrency} ${payherAmount}`,
      },
    })
  } else if (statusCode === '-1' || statusCode === '-2') {
    // Payment cancelled or failed
    await db.company.update({
      where: { id: companyId },
      data: { subscriptionStatus: 'past_due' },
    })
  }

  return NextResponse.json({ received: true })
}
