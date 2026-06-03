'use client'

import { useEffect, useState } from 'react'
import { SiteHeader } from '@/components/navigation/SiteHeader'

// ── Types ─────────────────────────────────────────────────────────────────────

interface CompanyBilling {
  id: string
  name: string
  subscriptionTier: 'free' | 'growth' | 'enterprise'
  subscriptionStatus: 'free' | 'trial' | 'active' | 'past_due' | 'cancelled' | 'expired'
  subscriptionExpiresAt?: string | null
}

// ── Plan definitions ─────────────────────────────────────────────────────────

interface PlanFeature {
  label: string
  included: boolean
  note?: string
}

interface Plan {
  id: 'free' | 'growth' | 'enterprise'
  name: string
  tagline: string
  price: { monthly: number | null; annual: number | null }
  color: string
  bg: string
  border: string
  cta: string
  ctaTier?: 'growth' | 'enterprise'
  features: PlanFeature[]
}

const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    tagline: 'Get started at no cost',
    price: { monthly: 0, annual: 0 },
    color: 'var(--ink)',
    bg: 'var(--surface)',
    border: 'var(--border)',
    cta: 'Current plan',
    features: [
      { label: '3 active job posts', included: true },
      { label: 'Basic applicant list', included: true },
      { label: 'Manual status updates', included: true },
      { label: 'AI match scoring', included: false },
      { label: 'AI strengths & gaps analysis', included: false },
      { label: 'Certificate verification', included: false },
      { label: 'Shortlist comparison', included: false },
      { label: 'Candidate detail pages', included: false },
      { label: 'Interview prep generation', included: false },
      { label: 'Priority support', included: false },
    ],
  },
  {
    id: 'growth',
    name: 'Growth',
    tagline: 'For growing teams hiring actively',
    price: { monthly: 4900, annual: 3900 },
    color: 'var(--royal)',
    bg: 'var(--royal-pale)',
    border: 'var(--royal)',
    cta: 'Upgrade to Growth',
    ctaTier: 'growth',
    features: [
      { label: '20 active job posts', included: true },
      { label: 'AI match scoring for all applicants', included: true },
      { label: 'AI strengths & gaps analysis', included: true },
      { label: 'Certificate verification badges', included: true },
      { label: 'Shortlist comparison (up to 3)', included: true },
      { label: 'Full candidate detail pages', included: true },
      { label: 'Timeline & activity history', included: true },
      { label: 'Hiring view presets', included: true },
      { label: 'Interview prep generation', included: false },
      { label: 'Priority support', included: false },
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    tagline: 'For high-volume hiring at scale',
    price: { monthly: 14900, annual: 11900 },
    color: '#7c3aed',
    bg: '#f3e8ff',
    border: '#7c3aed',
    cta: 'Upgrade to Enterprise',
    ctaTier: 'enterprise',
    features: [
      { label: 'Unlimited job posts', included: true },
      { label: 'AI match scoring for all applicants', included: true },
      { label: 'AI strengths & gaps analysis', included: true },
      { label: 'Certificate verification badges', included: true },
      { label: 'Shortlist comparison (up to 3)', included: true },
      { label: 'Full candidate detail pages', included: true },
      { label: 'Timeline & activity history', included: true },
      { label: 'Hiring view presets', included: true },
      { label: 'AI interview prep generation', included: true },
      { label: 'Priority support & onboarding', included: true },
    ],
  },
]

// ── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: CompanyBilling['subscriptionStatus'] }) {
  const config: Record<string, { label: string; bg: string; color: string }> = {
    free:      { label: 'Free',      bg: 'var(--surface)', color: 'var(--ink-muted)' },
    trial:     { label: 'Trial',     bg: '#fef3c7',        color: '#92400e' },
    active:    { label: 'Active',    bg: '#dcfce7',        color: '#166534' },
    past_due:  { label: 'Past due',  bg: '#fee2e2',        color: '#b91c1c' },
    cancelled: { label: 'Cancelled', bg: '#f3f4f6',        color: 'var(--ink-muted)' },
    expired:   { label: 'Expired',   bg: '#fee2e2',        color: '#b91c1c' },
  }
  const meta = config[status] ?? config.free
  return (
    <span style={{ padding: '2px 12px', borderRadius: '999px', fontSize: '0.78rem', fontWeight: 600, background: meta.bg, color: meta.color }}>
      {meta.label}
    </span>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function BillingPage() {
  const [company, setCompany] = useState<CompanyBilling | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly')
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/employer/billing')
      .then(r => r.json())
      .then(data => {
        if (data.data) setCompany(data.data)
        else setError(data.error ?? 'Failed to load billing info')
      })
      .catch(() => setError('Network error. Please try again.'))
      .finally(() => setLoading(false))
  }, [])

  async function handleCheckout(tier: 'growth' | 'enterprise') {
    setCheckoutLoading(tier)
    try {
      const res = await fetch('/api/payments/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier, billingPeriod }),
      })
      const data = await res.json()
      if (res.ok && data.url) {
        window.location.href = data.url
      } else {
        alert(data.error ?? 'Checkout failed. Please try again.')
      }
    } catch {
      alert('Network error. Please try again.')
    } finally {
      setCheckoutLoading(null)
    }
  }

  const currentTier = company?.subscriptionTier ?? 'free'
  const currentStatus = company?.subscriptionStatus ?? 'free'

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #eef2ff 0%, #f6f8ff 28%, #fff 100%)' }}>
      <SiteHeader role="employer" theme="dark" current="/employer/billing" subtitle="Employer workspace" />

      <div className="container" style={{ padding: '28px 1.5rem 80px' }}>

        {/* Hero */}
        <section className="card" style={{ padding: '28px', borderRadius: '26px', background: 'linear-gradient(145deg, #07114c 0%, #0d1a66 38%, #1432b2 100%)', color: '#fff', borderColor: 'rgba(255,255,255,0.08)', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <div>
              <p style={{ fontSize: '0.78rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.7)', marginBottom: '8px' }}>
                Plan & billing
              </p>
              <h1 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)', color: '#fff', marginBottom: '8px' }}>Manage your plan</h1>
              <p style={{ color: 'rgba(255,255,255,0.8)', maxWidth: '54ch' }}>
                Upgrade to unlock AI-powered hiring tools — match scoring, strengths analysis, and certificate verification.
              </p>
            </div>
            <a href="/employer" className="btn" style={{ background: '#fff', color: 'var(--royal-deep)', alignSelf: 'flex-start' }}>
              Back to dashboard
            </a>
          </div>
        </section>

        {/* Current plan card */}
        {loading ? (
          <div className="card" style={{ padding: '24px', marginBottom: '24px', textAlign: 'center' }}>
            <p style={{ color: 'var(--ink-muted)' }}>Loading billing info…</p>
          </div>
        ) : error ? (
          <div className="card" style={{ padding: '24px', marginBottom: '24px', background: '#fff1f2', border: '1px solid #fecdd3' }}>
            <p style={{ color: 'var(--coral)', margin: 0 }}>{error}</p>
          </div>
        ) : company && (
          <div className="card" style={{ padding: '24px', marginBottom: '28px', borderRadius: '20px', display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <p style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ink-muted)', marginBottom: '4px' }}>
                Current plan — {company.name}
              </p>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--ink)', textTransform: 'capitalize' }}>
                  {currentTier}
                </span>
                <StatusBadge status={currentStatus} />
              </div>
              {company.subscriptionExpiresAt && (
                <p style={{ fontSize: '0.8rem', color: 'var(--ink-muted)', marginTop: '4px' }}>
                  {currentStatus === 'active' ? 'Renews' : 'Expires'}{' '}
                  {new Date(company.subscriptionExpiresAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
              )}
            </div>
            {(currentStatus === 'past_due' || currentStatus === 'cancelled' || currentStatus === 'expired') && (
              <div style={{ padding: '12px 16px', borderRadius: '10px', background: '#fef3c7', border: '1px solid #fde68a' }}>
                <p style={{ fontSize: '0.85rem', color: '#92400e', fontWeight: 600, margin: '0 0 4px' }}>
                  {currentStatus === 'past_due' ? 'Payment past due' : 'Subscription inactive'}
                </p>
                <p style={{ fontSize: '0.8rem', color: '#b45309', margin: 0 }}>
                  Renew or upgrade below to restore access to AI hiring tools.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Billing period toggle */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '28px' }}>
          <div style={{ display: 'inline-flex', borderRadius: '999px', background: 'var(--surface)', border: '1.5px solid var(--border)', padding: '3px', gap: '3px' }}>
            {(['monthly', 'annual'] as const).map(period => (
              <button
                key={period}
                onClick={() => setBillingPeriod(period)}
                style={{
                  padding: '7px 22px', borderRadius: '999px', border: 'none', cursor: 'pointer',
                  fontSize: '0.85rem', fontWeight: 600,
                  background: billingPeriod === period ? 'var(--royal)' : 'transparent',
                  color: billingPeriod === period ? '#fff' : 'var(--ink-muted)',
                  transition: 'all 0.15s',
                }}
              >
                {period === 'monthly' ? 'Monthly' : 'Annual'}
                {period === 'annual' && (
                  <span style={{ marginLeft: '6px', fontSize: '0.72rem', opacity: billingPeriod === 'annual' ? 0.85 : 0.6 }}>
                    Save ~20%
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Plan cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '40px' }}>
          {PLANS.map(plan => {
            const isCurrentPlan = plan.id === currentTier
            const isDowngrade = ['growth', 'enterprise'].indexOf(plan.id) < ['growth', 'enterprise'].indexOf(currentTier as 'growth' | 'enterprise')
            const priceVal = billingPeriod === 'monthly' ? plan.price.monthly : plan.price.annual
            const isCheckingOut = checkoutLoading === plan.ctaTier

            return (
              <div
                key={plan.id}
                className="card"
                style={{
                  borderRadius: '24px', padding: '28px',
                  border: isCurrentPlan ? `2px solid ${plan.color}` : `1px solid ${plan.id === 'growth' ? plan.border : 'var(--border)'}`,
                  background: isCurrentPlan ? plan.bg : '#fff',
                  position: 'relative',
                  transform: plan.id === 'growth' ? 'translateY(-6px)' : 'none',
                  boxShadow: plan.id === 'growth' ? '0 12px 40px rgba(27,61,224,0.15)' : undefined,
                }}
              >
                {plan.id === 'growth' && !isCurrentPlan && (
                  <div style={{
                    position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)',
                    background: 'var(--royal)', color: '#fff', fontSize: '0.72rem', fontWeight: 700,
                    padding: '3px 14px', borderRadius: '999px', whiteSpace: 'nowrap', letterSpacing: '0.04em',
                  }}>
                    MOST POPULAR
                  </div>
                )}

                {isCurrentPlan && (
                  <div style={{
                    position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)',
                    background: plan.color, color: plan.id === 'free' ? 'var(--ink)' : '#fff', fontSize: '0.72rem', fontWeight: 700,
                    padding: '3px 14px', borderRadius: '999px', whiteSpace: 'nowrap', letterSpacing: '0.04em',
                  }}>
                    YOUR PLAN
                  </div>
                )}

                {/* Plan header */}
                <div style={{ marginBottom: '20px' }}>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: plan.color, margin: '0 0 4px' }}>{plan.name}</h2>
                  <p style={{ fontSize: '0.83rem', color: 'var(--ink-muted)', margin: '0 0 16px' }}>{plan.tagline}</p>

                  {priceVal === 0 ? (
                    <p style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--ink)', margin: 0 }}>Free</p>
                  ) : (
                    <div>
                      <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--ink)' }}>
                        LKR {(priceVal! / 100).toLocaleString()}
                      </span>
                      <span style={{ fontSize: '0.85rem', color: 'var(--ink-muted)', marginLeft: '4px' }}>
                        /{billingPeriod === 'monthly' ? 'mo' : 'mo, billed annually'}
                      </span>
                    </div>
                  )}
                </div>

                {/* CTA button */}
                {isCurrentPlan ? (
                  <button
                    className="btn"
                    disabled
                    style={{ width: '100%', marginBottom: '20px', background: plan.bg, color: plan.color, border: `1.5px solid ${plan.color}`, opacity: 0.8, cursor: 'default' }}
                  >
                    Current plan
                  </button>
                ) : plan.id === 'free' ? (
                  <button
                    className="btn btn-ghost"
                    disabled
                    style={{ width: '100%', marginBottom: '20px', opacity: 0.5, cursor: 'not-allowed' }}
                  >
                    Downgrade
                  </button>
                ) : (
                  <button
                    className="btn btn-primary"
                    style={{
                      width: '100%', marginBottom: '20px',
                      background: plan.id === 'enterprise' ? '#7c3aed' : 'var(--royal)',
                      opacity: isCheckingOut ? 0.7 : 1,
                    }}
                    onClick={() => plan.ctaTier && handleCheckout(plan.ctaTier)}
                    disabled={isCheckingOut || !!checkoutLoading}
                  >
                    {isCheckingOut ? 'Redirecting to checkout…' : plan.cta}
                  </button>
                )}

                {/* Features */}
                <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {plan.features.map(feature => (
                    <li key={feature.label} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                      <span style={{ fontSize: '0.85rem', color: feature.included ? '#16a34a' : 'var(--ink-muted)', flexShrink: 0, marginTop: '1px' }}>
                        {feature.included ? '✓' : '✕'}
                      </span>
                      <span style={{ fontSize: '0.84rem', color: feature.included ? 'var(--ink)' : 'var(--ink-muted)' }}>
                        {feature.label}
                        {feature.note && <span style={{ fontSize: '0.75rem', color: 'var(--ink-muted)', marginLeft: '4px' }}>({feature.note})</span>}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>

        {/* FAQ / notes */}
        <div className="card" style={{ padding: '24px', borderRadius: '20px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '16px', color: 'var(--ink)' }}>Frequently asked questions</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            {[
              {
                q: 'Can I cancel anytime?',
                a: 'Yes. Cancel at any time from your billing portal and you\'ll retain access until the end of your current billing period.',
              },
              {
                q: 'What payment methods are accepted?',
                a: 'We accept all major credit and debit cards via Stripe. Local bank transfers are available for Enterprise plans on request.',
              },
              {
                q: 'Is there a free trial?',
                a: 'Growth plans come with a 14-day free trial. No credit card required to start. Enterprise trials are available upon request.',
              },
              {
                q: 'What happens to my data if I downgrade?',
                a: 'Your data is never deleted. AI analysis results will remain visible but new AI screenings will be paused until you upgrade.',
              },
            ].map(item => (
              <div key={item.q}>
                <p style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '4px' }}>{item.q}</p>
                <p style={{ fontSize: '0.83rem', color: 'var(--ink-soft)', lineHeight: 1.6, margin: 0 }}>{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
