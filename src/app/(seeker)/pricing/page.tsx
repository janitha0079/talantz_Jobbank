'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { SiteHeader } from '@/components/navigation/SiteHeader'
import { PricingCard } from '@/components/features/FeaturePaywall'

export default function PricingPage() {
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const planDetails = {
    free: {
      name: 'Free',
      price: 0,
      billing: 'free',
      features: [
        '3 enhanced bullets/month',
        '1 skill suggestion/month',
        '1 cover letter/week',
        'Basic job search',
      ],
    },
    premium: {
      name: 'Premium',
      price: 999,
      billing: 'monthly',
      features: [
        'Unlimited bullet enhancements',
        'Unlimited skill suggestions',
        'Unlimited cover letters',
        '5 interview prep sessions/month',
        'Resume review AI feedback',
      ],
    },
    professional: {
      name: 'Professional',
      price: 2499,
      billing: 'monthly',
      features: [
        'Everything in Premium',
        'Unlimited interview prep',
        '1 career coaching session/month',
        'Salary benchmarking',
        'Priority job matching',
      ],
    },
  }

  useEffect(() => {
    fetch('/api/auth/session')
      .then((r) => r.json())
      .then((data) => setSession(data.user))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface)' }}>
      <SiteHeader role={session?.role === 'job_seeker' ? 'job_seeker' : 'guest'} current="/pricing" subtitle="Unlock AI features" />

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '48px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '56px' }}>
          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 800, marginBottom: '16px', fontFamily: 'var(--ff-serif)' }}>
            Accelerate Your Job Search
          </h1>
          <p style={{ fontSize: '1.125rem', color: 'var(--ink-muted)', maxWidth: '600px', margin: '0 auto' }}>
            AI-powered profile enhancement, interview prep, and more. Choose the plan that fits your needs.
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '24px',
            marginBottom: '48px',
          }}
        >
          {['free', 'premium', 'professional'].map((tier) => {
            const details = planDetails[tier as keyof typeof planDetails]
            return (
              <PricingCard
                key={tier}
                tier={tier}
                name={details.name}
                price={details.price}
                billing={details.billing}
                features={details.features}
                isPopular={tier === 'premium'}
                onSelect={() => {
                  window.location.href = `/checkout?tier=${tier}`
                }}
              />
            )
          })}
        </div>

        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '32px', textAlign: 'center' }}>
            Frequently Asked Questions
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[
              {
                q: 'Can I upgrade or downgrade anytime?',
                a: 'Yes! Change your plan anytime. Upgrades take effect immediately. Downgrades apply at the end of your billing cycle.',
              },
              {
                q: 'Do you offer refunds?',
                a: 'We offer a 7-day money-back guarantee if you\'re not satisfied. No questions asked.',
              },
              {
                q: 'Will my data be safe?',
                a: 'Absolutely. We use industry-leading encryption and never share your data with third parties.',
              },
              {
                q: 'Can I cancel anytime?',
                a: 'Yes, cancel anytime. You\'ll keep access until the end of your billing period.',
              },
              {
                q: 'What payment methods do you accept?',
                a: 'We accept PayHere, bank transfers, and other Sri Lankan payment methods.',
              },
            ].map((item, i) => (
              <div
                key={i}
                style={{
                  background: '#fff',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  padding: '20px 24px',
                }}
              >
                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '8px', color: 'var(--ink)' }}>
                  {item.q}
                </h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--ink-muted)', lineHeight: 1.6 }}>
                  {item.a}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
            background: 'linear-gradient(135deg, var(--royal), #2E5BFF)',
            borderRadius: '16px',
            padding: '40px 32px',
            textAlign: 'center',
            marginTop: '48px',
            color: '#fff',
          }}
        >
          <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '12px' }}>
            Ready to upgrade?
          </h3>
          <p style={{ marginBottom: '24px', fontSize: '1rem' }}>
            Start with Premium and unlock unlimited AI features today
          </p>
          <Link href="/checkout?tier=premium" style={{ textDecoration: 'none' }}>
            <button
              style={{
                padding: '14px 32px',
                background: '#fff',
                color: 'var(--royal)',
                border: 'none',
                borderRadius: '10px',
                fontSize: '1rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Upgrade Now
            </button>
          </Link>
        </div>
      </div>
    </div>
  )
}
