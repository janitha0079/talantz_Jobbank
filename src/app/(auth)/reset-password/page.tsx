import { Suspense } from 'react'
import type { Metadata } from 'next'
import { ResetPasswordContent } from './ResetPasswordContent'

export const metadata: Metadata = { title: 'Reset password | TalentAI' }

// The Suspense boundary MUST be in a server component so Next.js can
// statically render the shell and client-render only the part that
// reads useSearchParams(), avoiding hydration mismatches.
export default function ResetPasswordPage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1.1fr) minmax(360px, 470px)',
        background: 'linear-gradient(145deg, #08124f 0%, #10216b 45%, #1B3DE0 100%)',
      }}
    >
      {/* Left — static branding panel (rendered on the server) */}
      <div style={{ padding: '56px clamp(24px, 5vw, 72px)', color: '#fff', display: 'flex', alignItems: 'center' }}>
        <div style={{ maxWidth: '620px' }}>
          <a href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', color: '#fff', textDecoration: 'none', marginBottom: '32px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #F5B800, #fff1a5)', color: '#091875', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
              T
            </div>
            <span style={{ fontWeight: 700, fontSize: '1.05rem' }}>TalentAI.lk</span>
          </a>

          <p style={{ fontSize: '0.78rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.7)', marginBottom: '12px' }}>
            Account security
          </p>
          <h1 style={{ fontSize: 'clamp(2.2rem, 4vw, 3.6rem)', color: '#fff', marginBottom: '16px', lineHeight: 1.15 }}>
            Choose a new password.
          </h1>
          <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.82)', maxWidth: '50ch', marginBottom: '28px', lineHeight: 1.7 }}>
            Pick a strong password you haven&apos;t used before.
            Your reset link is valid for 1 hour.
          </p>

          <div style={{ display: 'grid', gap: '10px', maxWidth: '480px' }}>
            {['At least 8 characters', 'Mix of uppercase and lowercase letters', 'At least one number or symbol'].map((item) => (
              <div key={item} style={{ padding: '12px 16px', borderRadius: '12px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', fontSize: '0.9rem', color: '#fff' }}>
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — form card (client-rendered inside Suspense) */}
      <div style={{ padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: '460px', background: 'rgba(255,255,255,0.98)', borderRadius: '26px', padding: '36px', boxShadow: '0 24px 80px rgba(0,0,0,0.22)' }}>
          <Suspense fallback={
            <div style={{ padding: '24px 0', textAlign: 'center' }}>
              <p style={{ color: 'var(--ink-muted)', fontSize: '0.9rem' }}>Loading...</p>
            </div>
          }>
            <ResetPasswordContent />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
