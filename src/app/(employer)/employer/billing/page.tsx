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

// ── Plan definitions (matches home-page pricing) ─────────────────────────────

interface Package {
  name: string
  price: string
  cadence: string
  featured: boolean
  ctaTier: 'growth' | 'enterprise' | null
  points: string[]
}

const PACKAGES: Package[] = [
  {
    name: 'Launch 1 Job',
    price: 'LKR 3,500',
    cadence: 'per campaign',
    featured: false,
    ctaTier: 'growth',
    points: [
      'Best for one immediate opening',
      'AI-assisted job description builder',
      'Application dashboard and shortlist basics',
    ],
  },
  {
    name: 'Monthly Hiring',
    price: 'LKR 7,500',
    cadence: 'per month',
    featured: true,
    ctaTier: 'growth',
    points: [
      'Ideal for active recruiting teams',
      'Multiple live jobs in one workspace',
      'ATS views, candidate tracking, and richer analytics',
    ],
  },
  {
    name: 'Bulk Recruitment',
    price: 'LKR 13,500',
    cadence: 'starting package',
    featured: false,
    ctaTier: 'enterprise',
    points: [
      'For branch hiring and volume recruitment',
      'Bulk posting support and recruiter collaboration',
      'Priority onboarding for ATS workflow setup',
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
        body: JSON.stringify({ tier, billingPeriod: 'monthly' }),
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

        {/* Package cards — same format as home page */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '20px', marginBottom: '40px' }} className="price-grid">
          {PACKAGES.map((pkg, i) => {
            const isCheckingOut = checkoutLoading === pkg.ctaTier

            return (
              <div
                key={pkg.name}
                className="card price-card card-hover"
                style={{
                  padding: 32, position: 'relative',
                  ...(pkg.featured
                    ? { border: '2px solid var(--gold)', boxShadow: '0 20px 60px rgba(245,184,0,.18)' }
                    : {}),
                }}
              >
                {pkg.featured && (
                  <div style={{
                    position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)',
                    background: 'var(--gold)', color: 'var(--royal-deep)', fontSize: 12,
                    fontWeight: 700, padding: '4px 18px', borderRadius: 999, whiteSpace: 'nowrap',
                  }}>
                    Most popular
                  </div>
                )}

                {/* Name */}
                <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '.08em', color: pkg.featured ? '#9A7200' : 'var(--royal)', marginBottom: 8, fontWeight: 700 }}>
                  {pkg.name}
                </div>

                {/* Price */}
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 20 }}>
                  <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--ink)', fontFamily: 'var(--ff)' }}>{pkg.price}</div>
                  <div style={{ fontSize: 13, color: 'var(--ink-muted)' }}>{pkg.cadence}</div>
                </div>

                {/* Bullet points */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
                  {pkg.points.map(p => (
                    <div key={p} style={{ display: 'flex', gap: 9, alignItems: 'flex-start', fontSize: 13.5, color: 'var(--ink-soft)', lineHeight: 1.5 }}>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
                        <circle cx="8" cy="8" r="8" fill="var(--royal)" opacity=".12" />
                        <path d="M5 8l2 2 4-4" stroke="var(--royal)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      {p}
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <button
                  className={pkg.featured ? 'btn btn-gold' : 'btn btn-royal'}
                  style={{ width: '100%', justifyContent: 'center', opacity: isCheckingOut ? 0.7 : 1 }}
                  onClick={() => pkg.ctaTier && handleCheckout(pkg.ctaTier)}
                  disabled={isCheckingOut || !!checkoutLoading}
                >
                  {isCheckingOut ? 'Redirecting…' : pkg.featured ? 'Start hiring' : 'Choose package'}
                </button>
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
