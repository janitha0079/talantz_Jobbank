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
}

const ERROR_MESSAGES: Record<string, string> = {
  CredentialsSignin: 'Invalid email or password.',
  OAuthSignin: 'OAuth sign-in failed. Please try again.',
  OAuthCallback: 'OAuth sign-in failed. Please try again.',
  Verification: 'Please verify your email address before signing in.',
  Default: 'Something went wrong. Please try again.',
}

const PACKAGE_LABELS: Record<Plan, string> = {
  single: '1 job launch',
  monthly: 'Monthly hiring',
  bulk: 'Bulk recruitment',
}

export function AuthShell({
  callbackUrl,
  error,
  defaultTab = 'login',
  audience: initialAudience = 'job_seeker',
  plan = 'single',
}: Props) {
  const router = useRouter()
  const [tab, setTab] = useState<'login' | 'register'>(defaultTab)
  const [audience, setAudience] = useState<Audience>(initialAudience)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const serverError = error ? (ERROR_MESSAGES[error] ?? ERROR_MESSAGES.Default) : null
  const displayError = localError ?? serverError
  const modeCopy = useMemo(() => audienceCopy(audience, plan), [audience, plan])

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
      router.push(callbackUrl ?? '/')
      router.refresh()
    }
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
        gridTemplateColumns: 'minmax(0, 1.15fr) minmax(360px, 480px)',
        background:
          'radial-gradient(circle at top left, rgba(79,110,255,0.22), transparent 28%), linear-gradient(145deg, #08124f 0%, #10216b 45%, #1B3DE0 100%)',
      }}
    >
      <div style={{ padding: '56px clamp(24px, 5vw, 72px)', color: '#fff', display: 'flex', alignItems: 'center' }}>
        <div style={{ maxWidth: '640px' }}>
          <a href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', color: '#fff', textDecoration: 'none', marginBottom: '28px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, var(--gold), #fff1a5)',
                color: 'var(--royal-deep)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
              }}
            >
              T
            </div>
            <span style={{ fontWeight: 700, fontSize: '1.05rem' }}>TalentAI.lk</span>
          </a>

          <div className="animate-in" style={{ marginBottom: '18px' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '7px 12px',
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.16)',
                borderRadius: '999px',
                fontSize: '0.78rem',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}
            >
              {modeCopy.badge}
            </span>
          </div>

          <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 4.6rem)', color: '#fff', marginBottom: '14px' }}>
            {modeCopy.title}
          </h1>
          <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.8)', maxWidth: '54ch', marginBottom: '26px' }}>
            {modeCopy.description}
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '30px' }}>
            {modeCopy.highlights.map((item) => (
              <div
                key={item}
                style={{
                  padding: '14px 16px',
                  borderRadius: '16px',
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  backdropFilter: 'blur(10px)',
                }}
              >
                <p style={{ fontSize: '0.88rem', color: '#fff', lineHeight: 1.55 }}>{item}</p>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn"
              onClick={() => {
                setAudience('job_seeker')
                setTab('register')
                setLocalError(null)
                setSuccessMessage(null)
              }}
              style={{
                background: audience === 'job_seeker' ? '#fff' : 'rgba(255,255,255,0.12)',
                color: audience === 'job_seeker' ? 'var(--royal-deep)' : '#fff',
                border: '1px solid rgba(255,255,255,0.18)',
              }}
            >
              I’m a job seeker
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => {
                setAudience('employer')
                setTab('register')
                setLocalError(null)
                setSuccessMessage(null)
              }}
              style={{
                background: audience === 'employer' ? '#fff' : 'rgba(255,255,255,0.12)',
                color: audience === 'employer' ? 'var(--royal-deep)' : '#fff',
                border: '1px solid rgba(255,255,255,0.18)',
              }}
            >
              I’m hiring
            </button>
          </div>
        </div>
      </div>

      <div style={{ padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div
          style={{
            width: '100%',
            maxWidth: '460px',
            background: 'rgba(255,255,255,0.98)',
            borderRadius: '26px',
            padding: '32px',
            boxShadow: '0 24px 80px rgba(0,0,0,0.22)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '18px' }}>
            <div>
              <p style={{ fontSize: '0.78rem', color: 'var(--ink-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>
                {audience === 'job_seeker' ? 'Candidate access' : 'Employer access'}
              </p>
              <h2 style={{ fontSize: '1.7rem', marginBottom: '4px' }}>
                {tab === 'login' ? modeCopy.loginTitle : modeCopy.registerTitle}
              </h2>
              <p style={{ fontSize: '0.88rem', color: 'var(--ink-muted)' }}>
                {tab === 'login' ? modeCopy.loginBlurb : modeCopy.registerBlurb}
              </p>
            </div>
            <a href="/" style={{ fontSize: '0.82rem', color: 'var(--royal)' }}>
              Back home
            </a>
          </div>

          <div
            style={{
              display: 'flex',
              background: 'var(--surface)',
              borderRadius: '12px',
              padding: '4px',
              marginBottom: '14px',
              gap: '4px',
            }}
          >
            {(['login', 'register'] as const).map((t) => (
              <button
                key={t}
                onClick={() => {
                  setTab(t)
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
                  background: tab === t ? '#fff' : 'transparent',
                  color: tab === t ? 'var(--royal)' : 'var(--ink-muted)',
                  boxShadow: tab === t ? '0 1px 8px rgba(27,61,224,0.12)' : 'none',
                }}
              >
                {t === 'login' ? 'Sign in' : 'Create account'}
              </button>
            ))}
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '8px',
              background: '#fff',
              border: '1.5px solid var(--border)',
              borderRadius: '14px',
              padding: '6px',
              marginBottom: '18px',
            }}
          >
            <button
              type="button"
              onClick={() => {
                setAudience('job_seeker')
                setLocalError(null)
                setSuccessMessage(null)
              }}
              style={audienceToggleStyle(audience === 'job_seeker')}
            >
              Job seeker
            </button>
            <button
              type="button"
              onClick={() => {
                setAudience('employer')
                setLocalError(null)
                setSuccessMessage(null)
              }}
              style={audienceToggleStyle(audience === 'employer')}
            >
              Employer
            </button>
          </div>

          {successMessage && (
            <div
              style={{
                background: 'var(--green-pale)',
                border: '1px solid #BBF7D0',
                borderRadius: '8px',
                padding: '10px 14px',
                marginBottom: '16px',
                fontSize: '0.83rem',
                color: '#15803D',
              }}
            >
              {successMessage}
            </div>
          )}

          {displayError && (
            <div
              style={{
                background: 'var(--coral-pale)',
                border: '1px solid rgba(255,79,110,0.2)',
                borderRadius: '8px',
                padding: '10px 14px',
                marginBottom: '16px',
                fontSize: '0.83rem',
                color: 'var(--coral)',
              }}
            >
              {displayError}
            </div>
          )}

          {tab === 'login' ? (
            <>
              {audience === 'job_seeker' && (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                    <OAuthButton
                      provider="linkedin"
                      label="Continue with LinkedIn"
                      helper="Import headline, skills, and experience in one step"
                      onClick={() => handleOAuth('linkedin')}
                      disabled={loading}
                    />
                    <OAuthButton
                      provider="google"
                      label="Continue with Google"
                      helper="Fast sign-in for returning candidates"
                      onClick={() => handleOAuth('google')}
                      disabled={loading}
                    />
                  </div>

                  <Divider />
                </>
              )}

              <form onSubmit={handleCredentials}>
                <FormField label={audience === 'employer' ? 'Work email' : 'Email address'}>
                  <input
                    className="input"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={audience === 'employer' ? 'hiring@company.lk' : 'you@example.com'}
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
                    placeholder="Enter your password"
                    required
                    autoComplete="current-password"
                    suppressHydrationWarning
                  />
                </FormField>
                <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '8px' }} disabled={loading}>
                  {loading ? 'Signing in...' : audience === 'employer' ? 'Open employer workspace' : 'Sign in'}
                </button>
              </form>
            </>
          ) : (
            <RegisterPanel
              audience={audience}
              plan={plan}
              onSuccess={(message, nextAudience, nextEmail) => {
                setSuccessMessage(message)
                setAudience(nextAudience)
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

function audienceToggleStyle(active: boolean): React.CSSProperties {
  return {
    padding: '10px 12px',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    fontFamily: 'var(--ff)',
    fontWeight: 700,
    fontSize: '0.84rem',
    background: active ? 'linear-gradient(135deg, var(--royal), var(--electric))' : 'transparent',
    color: active ? '#fff' : 'var(--ink-soft)',
  }
}

function audienceCopy(audience: Audience, plan: Plan) {
  if (audience === 'employer') {
    return {
      badge: `Hiring teams • ${PACKAGE_LABELS[plan]}`,
      title: 'Launch roles, review applicants, and grow into ATS workflows.',
      description:
        'Start with one job, switch to a monthly package, or activate a bulk hiring lane for multi-role campaigns. Your employer workspace is designed to move from posting to shortlist faster.',
      highlights: [
        'Post a single role in minutes with AI-assisted job descriptions.',
        'Use a company dashboard with application tracking and stage movement.',
        'Upgrade to monthly or bulk packages when your hiring volume increases.',
      ],
      loginTitle: 'Employer sign in',
      registerTitle: 'Create your employer account',
      loginBlurb: 'Access your company dashboard, active jobs, and applicant pipeline.',
      registerBlurb: 'Create your company workspace and pick the hiring package that fits now.',
    }
  }

  return {
    badge: 'Job seekers • LinkedIn import',
    title: 'Build your profile faster and discover roles that fit.',
    description:
      'Import from LinkedIn, polish your profile with AI, and apply to Sri Lankan roles with clearer match insights before you click apply.',
    highlights: [
      'Import headline, skills, and experience from LinkedIn in one step.',
      'See AI match signals before applying to a role.',
      'Track your applications and keep improving your profile.',
    ],
    loginTitle: 'Candidate sign in',
    registerTitle: 'Create your candidate account',
    loginBlurb: 'Continue to your profile, applications, and recommended jobs.',
    registerBlurb: 'Use LinkedIn for the fastest setup or create your account with email.',
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
        transition: 'all 0.18s',
      }}
    >
      <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', textAlign: 'left' }}>
        <span
          style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            background: colors[provider] ?? '#666',
            flexShrink: 0,
            marginTop: '5px',
          }}
        />
        <span>
          <span style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700 }}>{label}</span>
          <span style={{ display: 'block', fontSize: '0.76rem', color: 'var(--ink-muted)' }}>{helper}</span>
        </span>
      </div>
      <span style={{ fontSize: '1rem', color: 'var(--ink-muted)' }}>→</span>
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
      <label
        style={{
          display: 'block',
          fontSize: '0.78rem',
          fontWeight: 600,
          color: 'var(--ink-soft)',
          marginBottom: '5px',
        }}
      >
        {label}
      </label>
      {children}
    </div>
  )
}

function RegisterPanel({
  audience,
  plan,
  onSuccess,
  onOAuth,
  loading,
}: {
  audience: Audience
  plan: Plan
  onSuccess: (message: string, nextAudience: Audience, nextEmail: string) => void
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
    } else {
      onSuccess(data.message ?? 'Account created successfully.', audience, form.email)
    }
  }

  return (
    <>
      {audience === 'job_seeker' && (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
            <OAuthButton
              provider="linkedin"
              label="Sign up with LinkedIn"
              helper="Import profile details and get started faster"
              onClick={() => onOAuth('linkedin')}
              disabled={loading}
            />
            <OAuthButton
              provider="google"
              label="Sign up with Google"
              helper="Quick account creation for job seekers"
              onClick={() => onOAuth('google')}
              disabled={loading}
            />
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
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--ink-soft)', marginBottom: '5px' }}>Industry</label>
                <input className="input" type="text" value={form.industry} onChange={(e) => setForm((f) => ({ ...f, industry: e.target.value }))} placeholder="Banking, IT, BPO..." />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--ink-soft)', marginBottom: '5px' }}>Website</label>
                <input className="input" type="url" value={form.website} onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))} placeholder="https://company.lk" />
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
          {submitting ? 'Creating account...' : audience === 'employer' ? 'Create employer workspace ->' : 'Create account ->'}
        </button>
      </form>
    </>
  )
}
