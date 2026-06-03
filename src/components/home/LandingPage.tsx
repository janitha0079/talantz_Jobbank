import Link from 'next/link'
import { SignOutButton } from '@/components/auth/SignOutButton'

type Role = 'job_seeker' | 'employer_admin' | 'employer_member' | 'super_admin' | null

const packages = [
  {
    name: 'Launch 1 Job',
    price: 'LKR 3,500',
    cadence: 'per campaign',
    href: '/register?audience=employer&plan=single',
    tone: 'var(--royal-pale)',
    accent: 'var(--royal)',
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
    href: '/register?audience=employer&plan=monthly',
    tone: 'var(--gold-light)',
    accent: '#9A7200',
    featured: true,
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
    href: '/register?audience=employer&plan=bulk',
    tone: 'var(--green-pale)',
    accent: '#15803D',
    points: [
      'For branch hiring and volume recruitment',
      'Bulk posting support and recruiter collaboration',
      'Priority onboarding for ATS workflow setup',
    ],
  },
]

const highlights = [
  {
    title: 'For job seekers',
    body: 'Import from LinkedIn, sharpen your profile with AI, and see role-fit signals before applying.',
    href: '/register?audience=job_seeker',
    cta: 'Create candidate account',
  },
  {
    title: 'For employers',
    body: 'Start with one job or set up a full hiring workspace with ATS-style applicant tracking.',
    href: '/register?audience=employer',
    cta: 'Create employer workspace',
  },
]

const employerFeatures = [
  'Post jobs manually or use AI to draft and improve descriptions',
  'Review applicants inside a dashboard instead of by email',
  'Move candidates across screening, shortlist, interview, and offer stages',
  'Upgrade from one-off hiring to monthly or bulk recruitment plans',
]

const seekerFeatures = [
  'LinkedIn import to prefill headline, skills, and experience',
  'Clean profile editing with AI assistance',
  'Smarter role discovery with fit signals and application tracking',
  'Built for fast, mobile-first job hunting in Sri Lanka',
]

export function LandingPage({ role = null }: { role?: Role }) {
  const primaryHref =
    role === 'super_admin'
      ? '/admin'
      : role === 'employer_admin' || role === 'employer_member'
      ? '/employer'
      : role === 'job_seeker'
      ? '/jobs'
      : '/register?audience=job_seeker'

  const primaryLabel =
    role === 'super_admin'
      ? 'Open admin'
      : role === 'employer_admin' || role === 'employer_member'
      ? 'Open employer dashboard'
      : role === 'job_seeker'
      ? 'Continue to jobs'
      : 'Get started'

  return (
    <div style={{ minHeight: '100vh', background: '#f4f7ff' }}>
      <section
        style={{
          position: 'relative',
          overflow: 'hidden',
          background:
            'radial-gradient(circle at top left, rgba(245,184,0,0.22), transparent 18%), radial-gradient(circle at 80% 10%, rgba(79,110,255,0.28), transparent 24%), linear-gradient(145deg, #07114c 0%, #0d1a66 38%, #1432b2 100%)',
          color: '#fff',
        }}
      >
        <div className="container" style={{ paddingTop: '24px', paddingBottom: '72px' }}>
          <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', marginBottom: '64px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '11px', background: 'linear-gradient(135deg, var(--gold), #fff1a5)', color: 'var(--royal-deep)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                T
              </div>
              <div>
                <p style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>TalentAI.lk</p>
                <p style={{ fontSize: '0.76rem', color: 'rgba(255,255,255,0.7)' }}>AI-first hiring for Sri Lanka</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <Link href="/jobs" className="btn" style={{ background: 'rgba(255,255,255,0.12)', color: '#fff', border: '1px solid rgba(255,255,255,0.14)' }}>
                Browse jobs
              </Link>
              {role ? (
                <SignOutButton
                  label={role === 'job_seeker' ? 'Switch account' : 'Sign out'}
                  callbackUrl={role === 'job_seeker' ? '/login?audience=employer' : '/login'}
                  className="btn"
                  style={{ background: 'rgba(255,255,255,0.12)', color: '#fff', border: '1px solid rgba(255,255,255,0.14)' }}
                />
              ) : (
                <Link href="/login?audience=employer" className="btn" style={{ background: 'rgba(255,255,255,0.12)', color: '#fff', border: '1px solid rgba(255,255,255,0.14)' }}>
                  Employer sign in
                </Link>
              )}
              <Link href={primaryHref} className="btn btn-gold">
                {primaryLabel}
              </Link>
            </div>
          </nav>

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.15fr) minmax(300px, 0.85fr)', gap: '28px', alignItems: 'center' }}>
            <div className="animate-in">
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: '999px', padding: '8px 14px', marginBottom: '18px', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                AI-powered matching, applicant screening, and ATS workflows
              </div>
              <h1 style={{ fontSize: 'clamp(2.8rem, 6vw, 5.6rem)', color: '#fff', marginBottom: '16px' }}>
                One home page.
                <br />
                Two clear paths.
                <br />
                Better hiring outcomes.
              </h1>
              <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.82)', maxWidth: '60ch', marginBottom: '26px' }}>
                Candidates can build their profile fast with LinkedIn import and apply with confidence. Employers can start with a single job, move into monthly hiring, or unlock bulk recruitment with a structured dashboard.
              </p>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '22px' }}>
                <Link href={role === 'job_seeker' ? '/jobs' : '/register?audience=job_seeker'} className="btn btn-gold">
                  {role === 'job_seeker' ? 'Continue as candidate' : 'I’m looking for a job'}
                </Link>
                <Link href={role === 'employer_admin' || role === 'employer_member' ? '/employer' : '/register?audience=employer&plan=monthly'} className="btn" style={{ background: '#fff', color: 'var(--royal-deep)' }}>
                  {role === 'employer_admin' || role === 'employer_member' ? 'Open employer dashboard' : 'I’m hiring talent'}
                </Link>
              </div>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', color: 'rgba(255,255,255,0.82)', fontSize: '0.88rem' }}>
                <span>LinkedIn-powered profile setup</span>
                <span>AI fit signals</span>
                <span>ATS-ready employer workspace</span>
              </div>
            </div>

            <div className="animate-in" style={{ display: 'grid', gap: '14px' }}>
              {highlights.map((item, index) => (
                <div
                  key={item.title}
                  style={{
                    padding: '22px',
                    borderRadius: '24px',
                    background: index === 0 ? 'rgba(255,255,255,0.92)' : 'rgba(16,28,93,0.48)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    color: index === 0 ? 'var(--ink)' : '#fff',
                    backdropFilter: 'blur(12px)',
                    boxShadow: index === 0 ? '0 18px 60px rgba(0,0,0,0.12)' : 'none',
                  }}
                >
                  <p style={{ fontSize: '0.76rem', textTransform: 'uppercase', letterSpacing: '0.07em', color: index === 0 ? 'var(--royal)' : 'rgba(255,255,255,0.65)', marginBottom: '8px' }}>
                    {item.title}
                  </p>
                  <h2 style={{ fontSize: '1.45rem', color: index === 0 ? 'var(--ink)' : '#fff', marginBottom: '10px' }}>{item.title === 'For job seekers' ? 'Start with your profile' : 'Start with your hiring plan'}</h2>
                  <p style={{ fontSize: '0.92rem', color: index === 0 ? 'var(--ink-muted)' : 'rgba(255,255,255,0.74)', marginBottom: '14px' }}>{item.body}</p>
                  <Link href={item.href} className="btn" style={{ background: index === 0 ? 'linear-gradient(135deg, var(--royal), var(--electric))' : '#fff', color: index === 0 ? '#fff' : 'var(--royal-deep)' }}>
                    {item.cta}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="container" style={{ paddingTop: '32px', paddingBottom: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '18px', marginTop: '-48px' }}>
          {[
            ['Candidates', 'Import from LinkedIn, sharpen your profile, and apply with fit signals.'],
            ['Employers', 'Launch jobs and manage applicants inside one hiring workspace.'],
            ['Packages', 'Choose one-off hiring, monthly recruiting, or a bulk plan for volume needs.'],
          ].map(([title, body]) => (
            <div key={title} className="card" style={{ padding: '22px', borderRadius: '20px', boxShadow: '0 18px 50px rgba(20,50,178,0.09)' }}>
              <p style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--royal)', marginBottom: '8px' }}>{title}</p>
              <p style={{ fontSize: '0.92rem', color: 'var(--ink-soft)' }}>{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container" style={{ paddingTop: '44px', paddingBottom: '28px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '18px' }}>
          <div className="card" style={{ padding: '28px', borderRadius: '24px' }}>
            <p style={{ fontSize: '0.76rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--royal)', marginBottom: '10px' }}>Job seekers</p>
            <h2 style={{ fontSize: '2rem', marginBottom: '12px' }}>A cleaner path from profile to application</h2>
            <div style={{ display: 'grid', gap: '10px' }}>
              {seekerFeatures.map((item) => (
                <div key={item} style={{ padding: '12px 14px', borderRadius: '14px', background: 'var(--surface)' }}>
                  <p style={{ fontSize: '0.88rem', color: 'var(--ink-soft)' }}>{item}</p>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '16px' }}>
              <Link href="/register?audience=job_seeker" className="btn btn-primary">
                Register as candidate
              </Link>
              <Link href="/login?audience=job_seeker" className="btn btn-ghost">
                Candidate sign in
              </Link>
            </div>
          </div>

          <div className="card" style={{ padding: '28px', borderRadius: '24px', background: 'linear-gradient(180deg, #ffffff, #f8fbff)' }}>
            <p style={{ fontSize: '0.76rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--royal)', marginBottom: '10px' }}>Employers</p>
            <h2 style={{ fontSize: '2rem', marginBottom: '12px' }}>A hiring dashboard built to scale with your team</h2>
            <div style={{ display: 'grid', gap: '10px' }}>
              {employerFeatures.map((item) => (
                <div key={item} style={{ padding: '12px 14px', borderRadius: '14px', background: '#fff', border: '1px solid var(--border)' }}>
                  <p style={{ fontSize: '0.88rem', color: 'var(--ink-soft)' }}>{item}</p>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '16px' }}>
              <Link href="/register?audience=employer&plan=single" className="btn btn-primary">
                Register as employer
              </Link>
              <Link href="/login?audience=employer" className="btn btn-ghost">
                Employer sign in
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="container" style={{ paddingTop: '36px', paddingBottom: '64px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', gap: '16px', flexWrap: 'wrap', marginBottom: '20px' }}>
          <div>
            <p style={{ fontSize: '0.76rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--royal)', marginBottom: '8px' }}>Employer pricing</p>
            <h2 style={{ fontSize: '2.2rem', marginBottom: '8px' }}>Competitive packages for Sri Lankan hiring teams</h2>
            <p style={{ fontSize: '0.92rem', color: 'var(--ink-muted)', maxWidth: '68ch' }}>
              Suggested package positioning designed to stay competitive with local recruiter pricing while keeping a cleaner AI-first story. Start with one role, move to monthly hiring, or use a bulk plan for multi-location campaigns.
            </p>
          </div>
          <div style={{ padding: '12px 14px', borderRadius: '14px', background: 'var(--card)', border: '1px solid var(--border)' }}>
            <p style={{ fontSize: '0.78rem', color: 'var(--ink-muted)' }}>Market anchor</p>
            <p style={{ fontSize: '0.9rem', color: 'var(--ink-soft)' }}>XpressJobs publicly lists recruiter packages from LKR 4,000 upward.</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
          {packages.map((item) => (
            <div
              key={item.name}
              className="card"
              style={{
                padding: '24px',
                borderRadius: '24px',
                borderColor: item.featured ? 'var(--gold)' : 'var(--border)',
                boxShadow: item.featured ? '0 20px 60px rgba(245,184,0,0.16)' : 'none',
              }}
            >
              {item.featured && (
                <div style={{ display: 'inline-flex', padding: '5px 10px', borderRadius: '999px', background: 'var(--gold-light)', color: '#9A7200', fontSize: '0.72rem', fontWeight: 700, marginBottom: '12px' }}>
                  Recommended
                </div>
              )}
              <p style={{ fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: item.accent, marginBottom: '6px' }}>{item.name}</p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '12px' }}>
                <p style={{ fontSize: '2.1rem', fontWeight: 700, color: 'var(--ink)' }}>{item.price}</p>
                <p style={{ fontSize: '0.82rem', color: 'var(--ink-muted)' }}>{item.cadence}</p>
              </div>
              <div style={{ display: 'grid', gap: '8px', marginBottom: '16px' }}>
                {item.points.map((point) => (
                  <div key={point} style={{ padding: '10px 12px', borderRadius: '12px', background: item.tone }}>
                    <p style={{ fontSize: '0.84rem', color: 'var(--ink-soft)' }}>{point}</p>
                  </div>
                ))}
              </div>
              <Link href={item.href} className={item.featured ? 'btn btn-gold' : 'btn btn-primary'} style={{ width: '100%' }}>
                Choose this package
              </Link>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
