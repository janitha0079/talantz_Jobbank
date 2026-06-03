'use client'

import { useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

export function ResetPasswordContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const token = searchParams.get('token') ?? ''

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)

  const hasToken = token.length > 0

  function validate() {
    if (password.length < 8) return 'Password must be at least 8 characters.'
    if (password !== confirm) return 'Passwords do not match.'
    return null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const ve = validate()
    if (ve) { setValidationError(ve); return }
    setValidationError(null)
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Something went wrong. Please request a new reset link.'); return }
      setSuccess(true)
      setTimeout(() => router.push('/login'), 3000)
    } catch {
      setError('Network error. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  const strength = getStrength(password)

  // ── Card content only (shell is rendered in server page) ──────────

  if (success) {
    return (
      <>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div>
            <p style={{ fontSize: '0.78rem', color: 'var(--ink-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>New password</p>
            <h2 style={{ fontSize: '1.7rem', marginBottom: '4px' }}>Password updated!</h2>
            <p style={{ fontSize: '0.88rem', color: 'var(--ink-muted)' }}>Redirecting you to sign in...</p>
          </div>
          <a href="/login" style={{ fontSize: '0.82rem', color: 'var(--royal)' }}>Sign in</a>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--green-pale)', border: '2px solid #BBF7D0', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: '1.6rem' }}>✓</div>
          <div style={{ background: 'var(--green-pale)', border: '1px solid #BBF7D0', borderRadius: '10px', padding: '14px 18px', marginBottom: '20px', fontSize: '0.88rem', color: '#15803D', lineHeight: 1.6 }}>
            Your password has been updated. You&apos;ll be redirected to the sign in page in a moment.
          </div>
          <a href="/login" className="btn btn-primary" style={{ display: 'flex', width: '100%' }}>Sign in now</a>
        </div>
      </>
    )
  }

  if (!hasToken) {
    return (
      <>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div>
            <p style={{ fontSize: '0.78rem', color: 'var(--ink-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>New password</p>
            <h2 style={{ fontSize: '1.7rem', marginBottom: '4px' }}>Link invalid</h2>
            <p style={{ fontSize: '0.88rem', color: 'var(--ink-muted)' }}>Please request a new reset link.</p>
          </div>
          <a href="/login" style={{ fontSize: '0.82rem', color: 'var(--royal)' }}>Sign in</a>
        </div>
        <div style={{ textAlign: 'center', padding: '16px 0' }}>
          <div style={{ fontSize: '2rem', marginBottom: '12px' }}>⚠️</div>
          <p style={{ color: 'var(--ink-muted)', fontSize: '0.9rem', marginBottom: '20px', lineHeight: 1.6 }}>
            This link is invalid or has expired. Please request a new password reset link.
          </p>
          <a href="/forgot-password" className="btn btn-primary" style={{ display: 'flex', width: '100%' }}>Request new link</a>
        </div>
      </>
    )
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <p style={{ fontSize: '0.78rem', color: 'var(--ink-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>New password</p>
          <h2 style={{ fontSize: '1.7rem', marginBottom: '4px' }}>Set new password</h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--ink-muted)' }}>Enter a new password for your account.</p>
        </div>
        <a href="/login" style={{ fontSize: '0.82rem', color: 'var(--royal)' }}>Sign in</a>
      </div>

      {(error || validationError) && (
        <div style={{ background: 'var(--coral-pale)', border: '1px solid rgba(255,79,110,0.2)', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', fontSize: '0.83rem', color: 'var(--coral)' }}>
          {error ?? validationError}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--ink-soft)', marginBottom: '6px' }}>New password</label>
          <input
            className="input"
            type="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setValidationError(null) }}
            placeholder="At least 8 characters"
            required
            autoComplete="new-password"
            autoFocus
            suppressHydrationWarning
          />
          {password.length > 0 && (
            <div style={{ marginTop: '8px' }}>
              <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
                {[1, 2, 3, 4].map((n) => (
                  <div key={n} style={{ flex: 1, height: '3px', borderRadius: '2px', background: n <= strength.score ? (strength.score <= 1 ? 'var(--coral)' : strength.score === 2 ? 'var(--amber)' : 'var(--green)') : 'var(--border)', transition: 'background 0.2s' }} />
                ))}
              </div>
              <p style={{ fontSize: '0.72rem', color: 'var(--ink-muted)' }}>{strength.label}</p>
            </div>
          )}
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--ink-soft)', marginBottom: '6px' }}>Confirm password</label>
          <input
            className="input"
            type="password"
            value={confirm}
            onChange={(e) => { setConfirm(e.target.value); setValidationError(null) }}
            placeholder="Re-enter your password"
            required
            autoComplete="new-password"
            suppressHydrationWarning
            style={{ borderColor: confirm.length > 0 && confirm !== password ? 'var(--coral)' : undefined }}
          />
          {confirm.length > 0 && confirm !== password && (
            <p style={{ fontSize: '0.72rem', color: 'var(--coral)', marginTop: '4px' }}>Passwords don&apos;t match</p>
          )}
        </div>

        <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading || password.length < 8 || password !== confirm}>
          {loading ? 'Updating...' : 'Update password'}
        </button>
      </form>

      <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '0.82rem', color: 'var(--ink-muted)' }}>
        Link expired?{' '}
        <a href="/forgot-password" style={{ color: 'var(--royal)', fontWeight: 600 }}>Request a new one</a>
      </p>
    </>
  )
}

// ── Password strength helper ──────────────────────────────────────────

function getStrength(password: string): { score: number; label: string } {
  if (password.length === 0) return { score: 0, label: '' }
  let score = 0
  if (password.length >= 8) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++
  return { score, label: ['', 'Weak', 'Fair', 'Good', 'Strong'][score] ?? '' }
}
