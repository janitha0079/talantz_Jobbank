'use client'

import { useState } from 'react'
import Link from 'next/link'

interface FeaturePaywallProps {
  feature: string
  tier: 'free' | 'premium' | 'professional'
  remaining: number
  limit: number
  resetPeriod: string
  onUpgrade?: () => void
}

/**
 * Soft upsell paywall shown when user hits feature limit
 */
export function FeaturePaywall({
  feature,
  tier,
  remaining,
  limit,
  resetPeriod,
  onUpgrade,
}: FeaturePaywallProps) {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  const messages = {
    enhance_bullet:
      'You've enhanced 3 bullets! Upgrade to unlock unlimited professional enhancements across your entire profile.',
    suggest_skills:
      'Love the skill suggestions? Premium members get unlimited suggestions every month.',
    cover_letter:
      'Candidates who use multiple cover letters get 60% more interview calls. Upgrade for unlimited.',
    interview_prep:
      'Start preparing with AI interview coaching. Premium gets 5 sessions/month, Professional gets unlimited.',
  }

  const upgradeBenefits = {
    enhance_bullet: ['Unlimited bullets', 'Better AI suggestions', 'Professional polish'],
    suggest_skills: ['Unlimited suggestions', 'Trending skill insights', 'Career growth'],
    cover_letter: ['Unlimited letters', 'Personalized templates', 'Higher response rate'],
    interview_prep: ['Full interview prep', 'Mock interviews', 'Performance analytics'],
  }

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #EEF1FD 0%, #F5F8FF 100%)',
        border: '1px solid #D1DDF5',
        borderRadius: '12px',
        padding: '20px 24px',
        marginTop: '16px',
        position: 'relative',
      }}
    >
      {/* Close button */}
      <button
        onClick={() => setDismissed(true)}
        style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          background: 'transparent',
          border: 'none',
          color: '#7580A0',
          cursor: 'pointer',
          fontSize: '18px',
          padding: '4px',
        }}
      >
        ✕
      </button>

      {/* Content */}
      <div style={{ marginBottom: '12px' }}>
        <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1B3DE0', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Unlock Premium
        </p>
        <p style={{ fontSize: '1rem', fontWeight: 500, color: '#334159', marginBottom: '8px' }}>
          {messages[feature as keyof typeof messages] || 'Upgrade to unlock more features'}
        </p>
        <p style={{ fontSize: '0.78rem', color: '#7580A0' }}>
          Reset in {resetPeriod} • {remaining} of {limit} uses remaining
        </p>
      </div>

      {/* Benefits preview */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {(upgradeBenefits[feature as keyof typeof upgradeBenefits] || []).map((benefit, i) => (
          <div key={i} style={{ fontSize: '0.75rem', background: '#fff', padding: '4px 10px', borderRadius: '6px', color: '#1B3DE0', fontWeight: 500 }}>
            ✓ {benefit}
          </div>
        ))}
      </div>

      {/* CTA buttons */}
      <div style={{ display: 'flex', gap: '10px' }}>
        <Link href="/pricing" style={{ textDecoration: 'none' }}>
          <button
            style={{
              padding: '10px 16px',
              background: '#1B3DE0',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#162FA0')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#1B3DE0')}
            onClick={onUpgrade}
          >
            See Plans
          </button>
        </Link>
        <button
          onClick={() => setDismissed(true)}
          style={{
            padding: '10px 16px',
            background: 'transparent',
            color: '#1B3DE0',
            border: '1px solid #D1DDF5',
            borderRadius: '8px',
            fontSize: '0.875rem',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Later
        </button>
      </div>
    </div>
  )
}

/**
 * Show usage counter with progress indicator
 */
export function FeatureUsageCounter({ remaining, limit, resetPeriod }: { remaining: number; limit: number; resetPeriod: string }) {
  if (limit === 999999) return null // Unlimited

  const percent = Math.round(((limit - remaining) / limit) * 100)
  const isWarning = remaining <= 1
  const isDepleted = remaining === 0

  return (
    <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Progress bar */}
        <div style={{ height: '4px', background: '#E5E7EB', borderRadius: '2px', overflow: 'hidden' }}>
          <div
            style={{
              height: '100%',
              width: `${percent}%`,
              background: isDepleted ? '#EF4444' : isWarning ? '#F59E0B' : '#10B981',
              transition: 'width 0.3s ease',
            }}
          />
        </div>
      </div>
      <div style={{ fontSize: '0.75rem', fontWeight: 500, color: isWarning ? '#F59E0B' : isDepleted ? '#EF4444' : '#7580A0', whiteSpace: 'nowrap' }}>
        {remaining}/{limit}
      </div>
    </div>
  )
}

/**
 * Pricing card for the pricing page
 */
export function PricingCard({
  tier,
  name,
  price,
  billing,
  features,
  isPopular,
  onSelect,
}: {
  tier: string
  name: string
  price: number
  billing: string
  features: string[]
  isPopular?: boolean
  onSelect?: () => void
}) {
  return (
    <div
      style={{
        border: isPopular ? '2px solid #1B3DE0' : '1px solid #E5E7EB',
        borderRadius: '16px',
        padding: '24px',
        background: isPopular ? '#F0F4FF' : '#fff',
        position: 'relative',
        transition: 'transform 0.2s, box-shadow 0.2s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)'
        e.currentTarget.style.boxShadow = '0 10px 30px rgba(27, 61, 224, 0.15)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = isPopular ? '0 0 0 2px #1B3DE0' : 'none'
      }}
    >
      {isPopular && (
        <div
          style={{
            position: 'absolute',
            top: '-12px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#1B3DE0',
            color: '#fff',
            padding: '4px 12px',
            borderRadius: '999px',
            fontSize: '0.75rem',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          ⭐ Popular
        </div>
      )}

      <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '8px' }}>{name}</h3>

      <div style={{ marginBottom: '20px' }}>
        {price === 0 ? (
          <p style={{ fontSize: '1rem', color: '#7580A0' }}>Free forever</p>
        ) : (
          <>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#1B3DE0' }}>
              LKR {price.toLocaleString()}
            </div>
            <p style={{ fontSize: '0.875rem', color: '#7580A0', marginTop: '4px' }}>per {billing}</p>
          </>
        )}
      </div>

      <button
        onClick={onSelect}
        style={{
          width: '100%',
          padding: '12px 16px',
          background: isPopular ? '#1B3DE0' : '#F3F4F6',
          color: isPopular ? '#fff' : '#334159',
          border: 'none',
          borderRadius: '10px',
          fontSize: '0.875rem',
          fontWeight: 600',
          cursor: 'pointer',
          marginBottom: '20px',
          transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => {
          if (isPopular) {
            e.currentTarget.style.background = '#162FA0'
          }
        }}
        onMouseLeave={(e) => {
          if (isPopular) {
            e.currentTarget.style.background = '#1B3DE0'
          }
        }}
      >
        {price === 0 ? 'Currently Free' : 'Upgrade Now'}
      </button>

      <ul style={{ listStyle: 'none', padding: 0 }}>
        {features.map((feature, i) => (
          <li
            key={i}
            style={{
              fontSize: '0.875rem',
              color: '#334159',
              padding: '10px 0',
              borderBottom: i < features.length - 1 ? '1px solid #E5E7EB' : 'none',
              display: 'flex',
              gap: '10px',
              alignItems: 'flex-start',
            }}
          >
            <span style={{ color: '#10B981', fontWeight: 700, marginTop: '2px' }}>✓</span>
            <span>{feature}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
