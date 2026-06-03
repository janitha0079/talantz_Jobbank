'use client'

import { useMemo, useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

type Audience = 'job_seeker' | 'employer'
type Plan = 'single' | 'monthly' | 'bulk'

interface Props {
  callbackUrl?: string
  error?: string
  defaultTab?: 'login' | 'register'
  audience?: Audience
  plan?: Plan
  verified?: string
}

const ERROR_MESSAGES: Record<string, string> = {
  CredentialsSignin: 'Invalid email or password.',
  OAuthSignin: 'OAuth sign-in failed. Please try again.',
  OAuthCallback: 'OAuth sign-in failed. Please try again.',
  Verification: 'Please verify your email address before signing in.',
  Default: 'Something went wrong. Please try again.',
}

export function SimpleAuthShell({
  callbackUrl,
  error,
  defaultTab = 'login',
  audience = 'job_seeker',
  plan = 'single',
  verified = '',
}: Props) {
  const router = useRouter()
  const [tab, setTab] = useState<'login' | 'register'>(defaultTab)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(
    verified === '1' ? 'Email verified! You can now sign in.' : null
  )
  const serverError = error ? (ERROR_MESSAGES[error] ?? ERROR_MESSAGES.Default) : null
  const displayError = localError ?? serverError
  const copy = useMemo(() => getCopy(audience, plan), [audience, plan])

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
      return
    }

    router.push(callbackUrl ?? '/')
    router.refresh()
  }

  async function handleOAuth(provider: 'linkedin' | 'google') {
    setLoading(true)
    await signIn(provider, { callbackUrl: callbackUrl ?? '/' })
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
      <div style={{ padding: '56px clamp(24px, 5vw, 72px)', color: '#fff', display: 'flex', alignItems: 'center' }}>
        <div style={{ maxWidth: '620px' }}>
          <a href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', color: '#fff', textDecoration: 'none', marginBottom: '28px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, var(--gold), #fff1a5)', color: 'var(--royal-deep)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
              T
            </div>
            <span style={{ fontWeight: 700, fontSize: '1.05rem' }}>TalentAI.lk</span>
          </a>

          <p style={{ fontSize: '0.78rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.7)', marginBottom: '12px' }}>
            {copy.badge}
          </p>
          <h1 style={{ fontSize: 'clamp(2.4rem, 5vw, 4.2rem)', color: '#fff', marginBottom: '14px' }}>
            {copy.title}
          </h1>
          <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.82)', maxWidth: '54ch', marginBottom: '24px' }}>
            {copy.description}
          </p>

          <div style={{ display: 'grid', gap: '10px', maxWidth: '520px', marginBottom: '20px' }}>
            {copy.highlights.map((item) => (
              <div key={item} style={{ padding: '14px 16px', borderRadius: '16px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}>
                <p style={{ fontSize: '0.9rem', color: '#fff' }}>{item}</p>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <a href="/jobs" className="btn" style={{ background: 'rgba(255,255,255,0.12)', color: '#fff', border: '1px solid rgba(255,255,255,0.18)' }}>
              Job search
            </a>
            <a href="/" className="btn" style={{ background: 'rgba(255,255,255,0.12)', color: '#fff', border: '1px solid rgba(255,255,255,0.18)' }}>
              Back home
            </a>
          </div>
        </div>
      </div>

      <div style={{ padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: '460px', background: 'rgba(255,255,255,0.98)', borderRadius: '26px', padding: '32px', boxShadow: '0 24px 80px rgba(0,0,0,0.22)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '18px' }}>
            <div>
              <p style={{ fontSize: '0.78rem', color: 'var(--ink-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>
                {audience === 'job_seeker' ? 'Job seeker access' : 'Employer access'}
              </p>
              <h2 style={{ fontSize: '1.7rem', marginBottom: '4px' }}>
                {tab === 'login' ? copy.loginTitle : copy.registerTitle}
              </h2>
              <p style={{ fontSize: '0.88rem', color: 'var(--ink-muted)' }}>
                {tab === 'login' ? copy.loginBlurb : copy.registerBlurb}
              </p>
            </div>
            <a href="/" style={{ fontSize: '0.82rem', color: 'var(--royal)' }}>Back home</a>
          </div>

          <div style={{ display: 'flex', background: 'var(--surface)', borderRadius: '12px', padding: '4px', marginBottom: '18px', gap: '4px' }}>
            {(['login', 'register'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => {
                  setTab(mode)
                  setLocalError(null)
                  setSuccessMessage(null)
                }}
                style={{
                  flex: 1,
                  padding: '9px',
                  borderRadius: '9px',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'var(--ff)',
                  fontSize: '0.83rem',
                  fontWeight: 600,
                  background: tab === mode ? '#fff' : 'transparent',
                  color: tab === mode ? 'var(--royal)' : 'var(--ink-muted)',
                  boxShadow: tab === mode ? '0 1px 8px rgba(27,61,224,0.12)' : 'none',
                }}
              >
                {mode === 'login' ? 'Sign in' : 'Create account'}
              </button>
            ))}
          </div>

          {successMessage && (
            <div style={{ background: 'var(--green-pale)', border: '1px solid #BBF7D0', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', fontSize: '0.83rem', color: '#15803D' }}>
              {successMessage}
            </div>
          )}

          {displayError && (
            <div style={{ background: 'var(--coral-pale)', border: '1px solid rgba(255,79,110,0.2)', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', fontSize: '0.83rem', color: 'var(--coral)' }}>
              {displayError}
            </div>
          )}

          {tab === 'login' ? (
            <>
              {audience === 'job_seeker' && (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                    <OAuthButton provider="linkedin" label="Continue with LinkedIn" helper="Import headline, skills, and experience in one step" onClick={() => handleOAuth('linkedin')} disabled={loading} />
                    <OAuthButton provider="google" label="Continue with Google" helper="Fast sign-in for returning candidates" onClick={() => handleOAuth('google')} disabled={loading} />
                  </div>
                  <Divider />
                </>
              )}

              <form onSubmit={handleCredentials}>
                <FormField label={audience === 'employer' ? 'Work email' : 'Email address'}>
                  <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={audience === 'employer' ? 'hiring@company.lk' : 'you@example.com'} required autoComplete="email" />
                </FormField>
                <FormField label="Password">
                  <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" required autoComplete="current-password" suppressHydrationWarning />
                </FormField>
                <div style={{ textAlign: 'right', marginTop: '-8px', marginBottom: '16px' }}>
                  <a href="/forgot-password" style={{ fontSize: '0.78rem', color: 'var(--royal)', fontWeight: 500 }}>
                    Forgot password?
                  </a>
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                  {loading ? 'Signing in...' : audience === 'employer' ? 'Open employer workspace' : 'Sign in'}
                </button>
              </form>
            </>
          ) : (
            <SimpleRegisterPanel
              audience={audience}
              plan={plan}
              onSuccess={(message, nextEmail) => {
                setSuccessMessage(message)
                setEmail(nextEmail)
                setPassword('')
                setTab('login')
              }}
              onOAuth={handleOAuth}
              loading={loading}
            />
          )}
        </div>
      </div>
    </div>
  )
}

function getCopy(audience: Audience, plan: Plan) {
  if (audience === 'employer') {
    return {
      badge: `Hiring teams | ${plan === 'single' ? '1 job' : plan === 'monthly' ? 'Monthly package' : 'Bulk package'}`,
      title: 'Sign in to your employer workspace.',
      description: 'Manage jobs, review applicants, and keep your hiring workflow in one place.',
      highlights: [
        'Post jobs and keep roles organized.',
        'Review applicants inside your dashboard.',
        'Use one job, monthly, or bulk hiring plans.',
      ],
      loginTitle: 'Employer sign in',
      registerTitle: 'Create employer account',
      loginBlurb: 'Access your company dashboard and hiring tools.',
      registerBlurb: 'Create your company workspace and start posting jobs.',
    }
  }

  return {
    badge: 'Job seekers | LinkedIn import',
    title: 'Sign in to your job seeker account.',
    description: 'Build your profile, search jobs, and apply faster with a cleaner flow.',
    highlights: [
      'Import from LinkedIn to start faster.',
      'Track your profile and applications.',
      'Keep job search simple and focused.',
    ],
    loginTitle: 'Job seeker sign in',
    registerTitle: 'Create job seeker account',
    loginBlurb: 'Open your profile, applications, and job search.',
    registerBlurb: 'Use LinkedIn or email to create your account.',
  }
}

function OAuthButton({
  provider,
  label,
  helper,
  onClick,
  disabled,
}: {
  provider: string
  label: string
  helper: string
  onClick: () => void
  disabled: boolean
}) {
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
        width: '100%',
        padding: '12px 16px',
        border: '1.5px solid var(--border-md)',
        borderRadius: '12px',
        background: '#fff',
        cursor: 'pointer',
        fontFamily: 'var(--ff)',
        color: 'var(--ink-soft)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: '12px',
      }}
    >
      <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', textAlign: 'left' }}>
        <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: colors[provider] ?? '#666', flexShrink: 0, marginTop: '5px' }} />
        <span>
          <span style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700 }}>{label}</span>
          <span style={{ display: 'block', fontSize: '0.76rem', color: 'var(--ink-muted)' }}>{helper}</span>
        </span>
      </div>
      <span style={{ fontSize: '1rem', color: 'var(--ink-muted)' }}>-&gt;</span>
    </button>
  )
}

function Divider() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '16px 0' }}>
      <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
      <span style={{ fontSize: '0.75rem', color: 'var(--ink-muted)', whiteSpace: 'nowrap' }}>or with email</span>
      <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
    </div>
  )
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '14px' }}>
      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--ink-soft)', marginBottom: '5px' }}>
        {label}
      </label>
      {children}
    </div>
  )
}

function SimpleRegisterPanel({
  audience,
  plan,
  onSuccess,
  onOAuth,
  loading,
}: {
  audience: Audience
  plan: Plan
  onSuccess: (message: string, nextEmail: string) => void
  onOAuth: (p: 'linkedin' | 'google') => void
  loading: boolean
}) {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    companyName: '',
    companySize: 'size_1_10',
    industry: '',
    website: '',
    plan,
  })
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    const payload =
      audience === 'employer'
        ? {
            audience,
            firstName: form.firstName,
            lastName: form.lastName,
            email: form.email,
            password: form.password,
            companyName: form.companyName,
            companySize: form.companySize,
            industry: form.industry || undefined,
            website: form.website || undefined,
            plan: form.plan,
          }
        : {
            audience,
            firstName: form.firstName,
            lastName: form.lastName,
            email: form.email,
            password: form.password,
          }

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? 'Registration failed')
      setSubmitting(false)
      return
    }

    onSuccess(data.message ?? 'Account created successfully.', form.email)
  }

  return (
    <>
      {audience === 'job_seeker' && (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
            <OAuthButton provider="linkedin" label="Sign up with LinkedIn" helper="Import profile details and get started faster" onClick={() => onOAuth('linkedin')} disabled={loading} />
            <OAuthButton provider="google" label="Sign up with Google" helper="Quick account creation for job seekers" onClick={() => onOAuth('google')} disabled={loading} />
          </div>
          <Divider />
        </>
      )}

      {error && (
        <div style={{ background: 'var(--coral-pale)', borderRadius: '8px', padding: '10px 14px', marginBottom: '14px', fontSize: '0.83rem', color: 'var(--coral)' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleRegister}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--ink-soft)', marginBottom: '5px' }}>First name</label>
            <input className="input" type="text" value={form.firstName} onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))} placeholder="Nishani" required />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--ink-soft)', marginBottom: '5px' }}>Last name</label>
            <input className="input" type="text" value={form.lastName} onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))} placeholder="Perera" required />
          </div>
        </div>

        {audience === 'employer' && (
          <>
            <FormField label="Company name">
              <input className="input" type="text" value={form.companyName} onChange={(e) => setForm((f) => ({ ...f, companyName: e.target.value }))} placeholder="Acme Lanka (Pvt) Ltd" required />
            </FormField>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--ink-soft)', marginBottom: '5px' }}>Company size</label>
                <select className="input" value={form.companySize} onChange={(e) => setForm((f) => ({ ...f, companySize: e.target.value }))}>
                  <option value="size_1_10">1-10</option>
                  <option value="size_11_50">11-50</option>
                  <option value="size_51_200">51-200</option>
                  <option value="size_201_500">201-500</option>
                  <option value="size_500_plus">500+</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--ink-soft)', marginBottom: '5px' }}>Hiring plan</label>
                <select className="input" value={form.plan} onChange={(e) => setForm((f) => ({ ...f, plan: e.target.value as Plan }))}>
                  <option value="single">1 job</option>
                  <option value="monthly">Monthly package</option>
                  <option value="bulk">Bulk package</option>
                </select>
              </div>
            </div>
          </>
        )}

        <FormField label={audience === 'employer' ? 'Work email' : 'Email address'}>
          <input className="input" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder={audience === 'employer' ? 'hiring@company.lk' : 'you@example.com'} required autoComplete="email" />
        </FormField>
        <FormField label="Password">
          <input className="input" type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} placeholder="At least 8 chars, 1 uppercase, 1 number" required autoComplete="new-password" suppressHydrationWarning />
        </FormField>
        <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '8px' }} disabled={submitting || loading}>
          {submitting ? 'Creating account...' : audience === 'employer' ? 'Create employer workspace' : 'Create account'}
        </button>
      </form>
    </>
  )
}
