'use client'

import { useState } from 'react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Something went wrong. Please try again.')
        return
      }

      setSent(true)
    } catch {
      setError('Network error. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1.1fr) minmax(360px, 470px)',
        background: 'linear-gradient(145deg, #08124f 0%, #10216b 45%, #1B3DE0 100%)',
      }}
    >
      {/* Left — branding panel */}
      <div style={{ padding: '56px clamp(24px, 5vw, 72px)', color: '#fff', display: 'flex', alignItems: 'center' }}>
        <div style={{ maxWidth: '620px' }}>
          <a href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', color: '#fff', textDecoration: 'none', marginBottom: '32px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, var(--gold), #fff1a5)', color: 'var(--royal-deep)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
              T
            </div>
            <span style={{ fontWeight: 700, fontSize: '1.05rem' }}>TalentAI.lk</span>
          </a>

          <p style={{ fontSize: '0.78rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.7)', marginBottom: '12px' }}>
            Account recovery
          </p>
          <h1 style={{ fontSize: 'clamp(2.2rem, 4vw, 3.6rem)', color: '#fff', marginBottom: '16px', lineHeight: 1.15 }}>
            Forgot your password?
          </h1>
          <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.82)', maxWidth: '50ch', marginBottom: '28px', lineHeight: 1.7 }}>
            No problem. Enter your email address and we&apos;ll send you a link to reset it.
            The link expires after 1 hour.
          </p>

          <div style={{ display: 'grid', gap: '10px', maxWidth: '480px' }}>
            {[
              'Reset link sent to your email',
              'Link is valid for 1 hour',
              'Your existing password stays active until you change it',
            ].map((item) => (
              <div key={item} style={{ padding: '12px 16px', borderRadius: '12px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', fontSize: '0.9rem', color: '#fff' }}>
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — form card */}
      <div style={{ padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: '460px', background: 'rgba(255,255,255,0.98)', borderRadius: '26px', padding: '36px', boxShadow: '0 24px 80px rgba(0,0,0,0.22)' }}>

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
            <div>
              <p style={{ fontSize: '0.78rem', color: 'var(--ink-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>
                Password reset
              </p>
              <h2 style={{ fontSize: '1.7rem', marginBottom: '4px' }}>
                {sent ? 'Check your inbox' : 'Reset password'}
              </h2>
              <p style={{ fontSize: '0.88rem', color: 'var(--ink-muted)' }}>
                {sent
                  ? `We sent a reset link to ${email}`
                  : 'Enter your email and we\'ll send a reset link.'}
              </p>
            </div>
            <a href="/login" style={{ fontSize: '0.82rem', color: 'var(--royal)' }}>Back to sign in</a>
          </div>

          {!sent ? (
            <>
              {error && (
                <div style={{ background: 'var(--coral-pale)', border: '1px solid rgba(255,79,110,0.2)', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', fontSize: '0.83rem', color: 'var(--coral)' }}>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--ink-soft)', marginBottom: '6px' }}>
                    Email address
                  </label>
                  <input
                    className="input"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    autoComplete="email"
                    autoFocus
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: '100%' }}
                  disabled={loading}
                >
                  {loading ? 'Sending...' : 'Send reset link'}
                </button>
              </form>

              <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.82rem', color: 'var(--ink-muted)' }}>
                Remember your password?{' '}
                <a href="/login" style={{ color: 'var(--royal)', fontWeight: 600 }}>
                  Sign in
                </a>
              </p>
            </>
          ) : (
            /* ── Sent state ── */
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '64px', height: '64px', borderRadius: '50%',
                background: 'var(--green-pale)', border: '2px solid #BBF7D0',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 20px',
                fontSize: '1.6rem',
              }}>
                ✓
              </div>

              <div style={{ background: 'var(--green-pale)', border: '1px solid #BBF7D0', borderRadius: '10px', padding: '14px 18px', marginBottom: '20px', fontSize: '0.88rem', color: '#15803D', lineHeight: 1.6 }}>
                If <strong>{email}</strong> is registered, you&apos;ll receive a reset link shortly.
                Check your spam folder if you don&apos;t see it within a few minutes.
              </div>

              <button
                onClick={() => { setSent(false); setEmail('') }}
                className="btn btn-ghost"
                style={{ width: '100%', marginBottom: '12px' }}
              >
                Try a different email
              </button>

              <a href="/login" className="btn btn-primary" style={{ width: '100%', display: 'flex' }}>
                Back to sign in
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
