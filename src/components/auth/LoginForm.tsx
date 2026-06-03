'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

interface Props {
  callbackUrl?: string
  error?: string
  defaultTab?: 'login' | 'register'
}

const ERROR_MESSAGES: Record<string, string> = {
  CredentialsSignin: 'Invalid email or password.',
  OAuthSignin: 'OAuth sign-in failed. Please try again.',
  OAuthCallback: 'OAuth sign-in failed. Please try again.',
  Verification: 'Please verify your email address before signing in.',
  Default: 'Something went wrong. Please try again.',
}

export function LoginForm({ callbackUrl, error, defaultTab = 'login' }: Props) {
  const router = useRouter()
  const [tab, setTab] = useState<'login' | 'register'>(defaultTab)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  const serverError = error ? (ERROR_MESSAGES[error] ?? ERROR_MESSAGES.Default) : null
  const displayError = localError ?? serverError

  async function handleCredentials(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setLocalError(null)

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    })

    if (result?.error) {
      setLocalError(ERROR_MESSAGES[result.error] ?? ERROR_MESSAGES.Default)
      setLoading(false)
    } else {
      router.push(callbackUrl ?? '/jobs')
      router.refresh()
    }
  }

  async function handleOAuth(provider: 'linkedin' | 'google') {
    setLoading(true)
    await signIn(provider, { callbackUrl: callbackUrl ?? '/profile' })
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      background: 'linear-gradient(135deg, var(--royal-deep) 0%, var(--royal-dark) 100%)',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '420px',
        background: '#fff',
        borderRadius: '20px',
        padding: '36px',
        boxShadow: '0 24px 80px rgba(0,0,0,0.25)',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '4px',
          }}>
            <div style={{
              width: '30px', height: '30px', borderRadius: '8px',
              background: 'linear-gradient(135deg, var(--royal), var(--electric))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: 700, fontSize: '0.9rem',
            }}>T</div>
            <span style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--ink)' }}>
              TalentAI<span style={{ color: 'var(--royal)' }}>.lk</span>
            </span>
          </div>
        </div>

        {/* Tab switcher */}
        <div style={{
          display: 'flex',
          background: 'var(--surface)',
          borderRadius: '10px',
          padding: '4px',
          marginBottom: '24px',
          gap: '4px',
        }}>
          {(['login', 'register'] as const).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setLocalError(null) }}
              style={{
                flex: 1, padding: '8px', borderRadius: '7px',
                border: 'none', cursor: 'pointer',
                fontFamily: 'var(--ff)', fontSize: '0.83rem', fontWeight: 600,
                background: tab === t ? '#fff' : 'transparent',
                color: tab === t ? 'var(--royal)' : 'var(--ink-muted)',
                boxShadow: tab === t ? '0 1px 8px rgba(27,61,224,0.12)' : 'none',
                transition: 'all 0.16s',
              }}
            >
              {t === 'login' ? 'Sign in' : 'Create account'}
            </button>
          ))}
        </div>

        {/* Error */}
        {displayError && (
          <div style={{
            background: 'var(--coral-pale)', border: '1px solid rgba(255,79,110,0.2)',
            borderRadius: '8px', padding: '10px 14px', marginBottom: '16px',
            fontSize: '0.83rem', color: 'var(--coral)',
          }}>
            {displayError}
          </div>
        )}

        {tab === 'login' ? (
          <>
            {/* OAuth */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
              <OAuthButton
                provider="linkedin"
                label="Continue with LinkedIn"
                onClick={() => handleOAuth('linkedin')}
                disabled={loading}
              />
              <OAuthButton
                provider="google"
                label="Continue with Google"
                onClick={() => handleOAuth('google')}
                disabled={loading}
              />
            </div>

            <Divider />

            {/* Credentials form */}
            <form onSubmit={handleCredentials}>
              <FormField label="Email address">
                <input
                  className="input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                />
              </FormField>
              <FormField label="Password">
                <input
                  className="input"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  suppressHydrationWarning
                />
              </FormField>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', marginTop: '8px' }}
                disabled={loading}
              >
                {loading ? 'Signing in…' : 'Sign in'}
              </button>
            </form>
          </>
        ) : (
          <RegisterPanel
            onSuccess={() => setTab('login')}
            onOAuth={handleOAuth}
            loading={loading}
          />
        )}
      </div>
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────

function OAuthButton({
  provider, label, onClick, disabled,
}: { provider: string; label: string; onClick: () => void; disabled: boolean }) {
  const colors: Record<string, string> = {
    linkedin: '#0A66C2',
    google: '#EA4335',
  }
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        width: '100%', padding: '10px 16px',
        border: '1.5px solid var(--border-md)', borderRadius: '9px',
        background: '#fff', cursor: 'pointer',
        fontFamily: 'var(--ff)', fontSize: '0.875rem', fontWeight: 600,
        color: 'var(--ink-soft)', display: 'flex', alignItems: 'center',
        justifyContent: 'center', gap: '10px', transition: 'all 0.18s',
      }}
    >
      <span style={{
        width: '8px', height: '8px', borderRadius: '50%',
        background: colors[provider] ?? '#666',
        flexShrink: 0,
      }} />
      {label}
    </button>
  )
}

function Divider() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '16px 0' }}>
      <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
      <span style={{ fontSize: '0.75rem', color: 'var(--ink-muted)', whiteSpace: 'nowrap' }}>
        or with email
      </span>
      <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
    </div>
  )
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '14px' }}>
      <label style={{
        display: 'block', fontSize: '0.78rem', fontWeight: 600,
        color: 'var(--ink-soft)', marginBottom: '5px',
      }}>
        {label}
      </label>
      {children}
    </div>
  )
}

function RegisterPanel({
  onSuccess, onOAuth, loading,
}: { onSuccess: () => void; onOAuth: (p: 'linkedin' | 'google') => void; loading: boolean }) {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '' })
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? 'Registration failed')
      setSubmitting(false)
    } else {
      onSuccess()
    }
  }

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
        <OAuthButton provider="linkedin" label="Sign up with LinkedIn" onClick={() => onOAuth('linkedin')} disabled={loading} />
        <OAuthButton provider="google" label="Sign up with Google" onClick={() => onOAuth('google')} disabled={loading} />
      </div>
      <Divider />
      {error && (
        <div style={{ background: 'var(--coral-pale)', borderRadius: '8px', padding: '10px 14px', marginBottom: '14px', fontSize: '0.83rem', color: 'var(--coral)' }}>
          {error}
        </div>
      )}
      <form onSubmit={handleRegister}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--ink-soft)', marginBottom: '5px' }}>First name</label>
            <input className="input" type="text" value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} placeholder="Nishani" required />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--ink-soft)', marginBottom: '5px' }}>Last name</label>
            <input className="input" type="text" value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} placeholder="K." required />
          </div>
        </div>
        <FormField label="Email address">
          <input className="input" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="you@example.com" required autoComplete="email" />
        </FormField>
        <FormField label="Password">
          <input className="input" type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Min. 8 characters" required autoComplete="new-password" suppressHydrationWarning />
        </FormField>
        <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '8px' }} disabled={submitting || loading}>
          {submitting ? 'Creating account…' : 'Create account →'}
        </button>
      </form>
    </>
  )
}
