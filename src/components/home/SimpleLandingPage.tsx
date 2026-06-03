import React from 'react'
import Link from 'next/link'

type Role = 'job_seeker' | 'employer_admin' | 'employer_member' | 'super_admin' | null

const S = {
  ff:    "'Outfit', system-ui, sans-serif",
  serif: "'Cormorant Garamond', Georgia, serif",
  royal: '#1B3DE0',
  deep:  '#091875',
  ink:   '#07080F',
  soft:  '#2E3345',
  muted: '#6B7280',
  gold:  '#F5B800',
  white: '#FFFFFF',
}

const pill = (extra?: React.CSSProperties): React.CSSProperties => ({
  display: 'inline-flex', alignItems: 'center', gap: 6,
  padding: '6px 14px', borderRadius: 999, fontSize: 12,
  fontWeight: 600, letterSpacing: '0.04em', ...extra,
})

const btn = (bg: string, color: string, extra?: React.CSSProperties): React.CSSProperties => ({
  display: 'inline-block', padding: '12px 28px', borderRadius: 10,
  background: bg, color, fontFamily: S.ff, fontSize: 14, fontWeight: 700,
  textDecoration: 'none', whiteSpace: 'nowrap', cursor: 'pointer', ...extra,
})

export function SimpleLandingPage({ role = null }: { role?: Role }) {
  const isSeeker   = role === 'job_seeker'
  const isEmployer = role === 'employer_admin' || role === 'employer_member'

  return (
    <div style={{ fontFamily: S.ff, background: '#F8F9FF', color: S.ink, minHeight: '100vh' }}>

      {/* ── NAV ──────────────────────────────────────────────────────── */}
      <nav style={{
        background: 'rgba(255,255,255,0.94)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(27,61,224,0.08)',
        padding: '0 2rem', position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 68 }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 11, textDecoration: 'none' }}>
            <div style={{
              width: 38, height: 38, borderRadius: 11,
              background: 'linear-gradient(135deg,#1B3DE0,#4F6EFF)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: S.white, fontWeight: 800, fontSize: 18,
              boxShadow: '0 4px 14px rgba(27,61,224,0.35)',
            }}>T</div>
            <div>
              <div style={{ fontWeight: 700, color: S.ink, fontSize: 15.5, lineHeight: 1.2 }}>TalentAI.lk</div>
              <div style={{ fontSize: 11, color: S.muted }}>AI-first hiring · Sri Lanka</div>
            </div>
          </Link>
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <Link href="/jobs"                  style={{ padding: '7px 14px', borderRadius: 8, color: S.soft, fontSize: 13.5, fontWeight: 500, textDecoration: 'none' }}>Browse jobs</Link>
            <Link href="/login?role=job_seeker" style={{ padding: '7px 14px', borderRadius: 8, color: S.soft, fontSize: 13.5, fontWeight: 500, textDecoration: 'none' }}>Job seeker login</Link>
            <Link href="/login?role=employer"   style={{ padding: '7px 14px', borderRadius: 8, color: S.soft, fontSize: 13.5, fontWeight: 500, textDecoration: 'none' }}>Employer login</Link>
            <Link href={isSeeker ? '/jobs' : isEmployer ? '/employer' : '/register?role=job_seeker'} style={{
              ...btn('linear-gradient(135deg,#1B3DE0,#4F6EFF)', S.white),
              padding: '8px 20px', fontSize: 13.5,
              boxShadow: '0 2px 12px rgba(27,61,224,0.3)',
            }}>
              {isSeeker ? 'Browse jobs' : isEmployer ? 'Dashboard' : 'Get started'}
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section style={{
        background: 'linear-gradient(140deg,#06103f 0%,#0c1a6b 45%,#1535c0 100%)',
        padding: '88px 2rem 128px', overflow: 'hidden', position: 'relative',
      }}>
        <div style={{ position: 'absolute', top: -120, left: -120, width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle,rgba(245,184,0,0.14),transparent 65%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -80, right: '5%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle,rgba(79,110,255,0.18),transparent 65%)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 420px', gap: 64, alignItems: 'center', position: 'relative' }}>
          {/* Left copy */}
          <div>
            <div style={pill({ background: 'rgba(245,184,0,0.15)', color: S.gold, border: '1px solid rgba(245,184,0,0.3)', marginBottom: 28 })}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: S.gold, display: 'inline-block' }} />
              AI-powered hiring platform for Sri Lanka
            </div>
            <h1 style={{ fontFamily: S.serif, fontSize: 'clamp(3.2rem,5.5vw,5.8rem)', lineHeight: 1.05, color: S.white, marginBottom: 24, fontWeight: 600 }}>
              Hire smarter.<br />
              Apply faster.<br />
              <span style={{ color: S.gold }}>Win together.</span>
            </h1>
            <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.78)', maxWidth: '52ch', lineHeight: 1.7, marginBottom: 36 }}>
              Sri Lanka&apos;s first AI-native job platform. Candidates build AI-scored profiles and apply with confidence. Employers manage the full hiring pipeline from one workspace.
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 40 }}>
              <Link href={isSeeker ? '/jobs' : '/register?role=job_seeker'} style={{ ...btn(S.gold, S.deep), boxShadow: '0 4px 20px rgba(245,184,0,0.4)', fontSize: 15 }}>
                {isSeeker ? 'Browse open roles' : 'Find your next job'}
              </Link>
              <Link href={isEmployer ? '/employer' : '/register?role=employer&plan=monthly'} style={{ ...btn('rgba(255,255,255,0.12)', S.white), border: '1.5px solid rgba(255,255,255,0.22)', fontSize: 15 }}>
                {isEmployer ? 'Open dashboard' : 'Post a job'}
              </Link>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>
              {['LinkedIn import', 'AI fit scoring', 'ATS pipeline', 'Free to apply'].map(t => (
                <span key={t} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <circle cx="7" cy="7" r="7" fill="rgba(245,184,0,0.2)" />
                    <path d="M4 7l2 2 4-4" stroke={S.gold} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* Right — UI mockup */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Job card */}
            <div style={{ background: 'rgba(255,255,255,0.97)', borderRadius: 18, padding: '20px 22px', boxShadow: '0 24px 64px rgba(0,0,0,0.22)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                <div>
                  <div style={{ fontWeight: 700, color: S.ink, fontSize: 15, marginBottom: 3 }}>Senior Product Designer</div>
                  <div style={{ fontSize: 13, color: S.muted }}>Dialog Axiata · Colombo</div>
                </div>
                <span style={pill({ background: '#EDFDF5', color: '#15803D', fontSize: 11 })}>Active</span>
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
                {['Figma', 'UX Research', 'Prototyping'].map(s => (
                  <span key={s} style={pill({ background: '#EEF1FD', color: S.royal, fontSize: 11 })}>{s}</span>
                ))}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: 13, color: S.muted }}>LKR 180k – 240k / month</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ fontSize: 12, color: S.royal, fontWeight: 600 }}>AI Match</div>
                  <div style={{ width: 48, height: 6, background: '#EEF1FD', borderRadius: 999 }}>
                    <div style={{ width: '78%', height: '100%', background: 'linear-gradient(90deg,#1B3DE0,#4F6EFF)', borderRadius: 999 }} />
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: S.royal }}>78%</div>
                </div>
              </div>
            </div>

            {/* Pipeline widget */}
            <div style={{ background: 'rgba(9,24,117,0.7)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 18, padding: '18px 22px', backdropFilter: 'blur(16px)' }}>
              <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.55)', marginBottom: 12, fontWeight: 600 }}>Hiring pipeline</div>
              <div style={{ display: 'flex', gap: 6 }}>
                {[{ label: 'Applied', n: 48, active: false }, { label: 'Shortlist', n: 12, active: true }, { label: 'Interview', n: 4, active: false }, { label: 'Offer', n: 1, active: false }].map(stage => (
                  <div key={stage.label} style={{ flex: 1, padding: '10px 8px', borderRadius: 10, textAlign: 'center', background: stage.active ? S.gold : 'rgba(255,255,255,0.08)', border: stage.active ? 'none' : '1px solid rgba(255,255,255,0.1)' }}>
                    <div style={{ fontSize: 17, fontWeight: 700, color: stage.active ? S.deep : S.white, lineHeight: 1 }}>{stage.n}</div>
                    <div style={{ fontSize: 10, color: stage.active ? S.deep : 'rgba(255,255,255,0.6)', marginTop: 4 }}>{stage.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Candidate row */}
            <div style={{ background: 'rgba(255,255,255,0.97)', borderRadius: 18, padding: '16px 22px', boxShadow: '0 8px 32px rgba(0,0,0,0.14)', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg,#1B3DE0,#4F6EFF)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: S.white, fontWeight: 700, fontSize: 16, flexShrink: 0 }}>K</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, color: S.ink, fontSize: 14 }}>Kavindra Perera</div>
                <div style={{ fontSize: 12, color: S.muted }}>UI/UX Designer · 3 yrs exp</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11, color: S.muted, marginBottom: 3 }}>Profile score</div>
                <div style={{ fontWeight: 700, color: S.royal, fontSize: 16 }}>91%</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ────────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 1200, margin: '-40px auto 0', padding: '0 2rem', position: 'relative', zIndex: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
          {[
            { n: '2,400+', label: 'Active job seekers' },
            { n: '340+',   label: 'Employers hiring' },
            { n: '5,800+', label: 'Applications placed' },
            { n: '91%',    label: 'Employer satisfaction' },
          ].map(s => (
            <div key={s.label} style={{ background: S.white, borderRadius: 16, padding: '18px 22px', boxShadow: '0 12px 40px rgba(27,61,224,0.1)', border: '1.5px solid rgba(27,61,224,0.07)', textAlign: 'center' }}>
              <div style={{ fontFamily: S.serif, fontSize: 28, fontWeight: 700, color: S.royal, lineHeight: 1 }}>{s.n}</div>
              <div style={{ fontSize: 12.5, color: S.muted, marginTop: 6 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────── */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '80px 2rem 48px' }}>
        <div style={{ textAlign: 'center', marginBottom: 52 }}>
          <div style={pill({ background: '#EEF1FD', color: S.royal, marginBottom: 16 })}>How it works</div>
          <h2 style={{ fontFamily: S.serif, fontSize: 'clamp(2rem,3.5vw,3rem)', color: S.ink, marginBottom: 12 }}>Simple for everyone</h2>
          <p style={{ color: S.muted, fontSize: 15, maxWidth: '50ch', margin: '0 auto' }}>Whether searching for a role or building a team, TalentAI.lk gets you there faster.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          {/* Seekers */}
          <div style={{ background: S.white, borderRadius: 20, border: '1.5px solid rgba(27,61,224,0.09)', padding: 36 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#1B3DE0,#4F6EFF)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" /></svg>
              </div>
              <div style={{ fontWeight: 700, color: S.ink, fontSize: 16 }}>For job seekers</div>
            </div>
            {[
              { n: '01', title: 'Build your profile',  body: 'Import from LinkedIn or fill manually. AI strengthens your headline, skills, and summary.' },
              { n: '02', title: 'See your fit score',   body: 'Before applying, see how well you match each role based on your profile and experience.' },
              { n: '03', title: 'Apply and track',      body: 'Apply in seconds and track every application from shortlist to offer in one dashboard.' },
            ].map(step => (
              <div key={step.n} style={{ display: 'flex', gap: 16, marginBottom: 22 }}>
                <div style={{ width: 32, height: 32, borderRadius: 9, background: '#EEF1FD', color: S.royal, fontWeight: 800, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{step.n}</div>
                <div>
                  <div style={{ fontWeight: 600, color: S.ink, fontSize: 14, marginBottom: 4 }}>{step.title}</div>
                  <div style={{ fontSize: 13.5, color: S.muted, lineHeight: 1.6 }}>{step.body}</div>
                </div>
              </div>
            ))}
            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <Link href="/register?role=job_seeker" style={btn('linear-gradient(135deg,#1B3DE0,#4F6EFF)', S.white, { fontSize: 13.5 })}>Create free account</Link>
              <Link href="/login?role=job_seeker"    style={btn('transparent', S.soft, { fontSize: 13.5, border: '1.5px solid rgba(27,61,224,0.2)' })}>Sign in</Link>
            </div>
          </div>

          {/* Employers */}
          <div style={{ background: 'linear-gradient(160deg,#06103f,#0f1f7a)', borderRadius: 20, border: '1px solid rgba(255,255,255,0.08)', padding: 36 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(245,184,0,0.2)', border: '1px solid rgba(245,184,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={S.gold} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-4 0v2M8 7V5a2 2 0 0 0-4 0v2" /></svg>
              </div>
              <div style={{ fontWeight: 700, color: S.white, fontSize: 16 }}>For employers</div>
            </div>
            {[
              { n: '01', title: 'Post your role',              body: 'Create a job posting manually or let AI draft and improve your description in seconds.' },
              { n: '02', title: 'Review AI-ranked applicants', body: 'Applicants are scored and ranked by profile strength, skills, and fit signals automatically.' },
              { n: '03', title: 'Manage the pipeline',         body: 'Move candidates from screening to shortlist, interview, and hire — all from one dashboard.' },
            ].map(step => (
              <div key={step.n} style={{ display: 'flex', gap: 16, marginBottom: 22 }}>
                <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(245,184,0,0.15)', color: S.gold, fontWeight: 800, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{step.n}</div>
                <div>
                  <div style={{ fontWeight: 600, color: S.white, fontSize: 14, marginBottom: 4 }}>{step.title}</div>
                  <div style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.65)', lineHeight: 1.6 }}>{step.body}</div>
                </div>
              </div>
            ))}
            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <Link href="/register?role=employer&plan=single" style={btn(S.gold, S.deep, { fontSize: 13.5 })}>Post a job</Link>
              <Link href="/login?role=employer"                style={btn('rgba(255,255,255,0.1)', S.white, { fontSize: 13.5, border: '1px solid rgba(255,255,255,0.2)' })}>Employer login</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────────────── */}
      <section style={{ background: S.white, padding: '64px 2rem' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div style={pill({ background: '#EEF1FD', color: S.royal, marginBottom: 16 })}>Platform highlights</div>
            <h2 style={{ fontFamily: S.serif, fontSize: 'clamp(1.8rem,3vw,2.8rem)', color: S.ink }}>Everything you need in one place</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20 }}>
            {[
              { icon: '🤖', title: 'AI-powered ranking',      body: 'Every applicant is automatically scored against role requirements so strong candidates surface faster.' },
              { icon: '📋', title: 'Full ATS pipeline',       body: 'Move candidates across Screening, Shortlist, Interview, Offer, and Hired — all in one workspace.' },
              { icon: '🔗', title: 'LinkedIn import',         body: 'Job seekers import their profile in one click, prefilling skills, experience, and headline.' },
              { icon: '📊', title: 'Applicant analytics',     body: 'See drop-off rates, time-in-stage, and hire velocity from the employer dashboard.' },
              { icon: '✅', title: 'Verified certifications', body: 'Candidates attach verified credentials employers can see directly inside applicant cards.' },
              { icon: '🌏', title: 'Built for Sri Lanka',     body: 'Local currency, local companies, and a platform designed around how hiring actually works here.' },
            ].map(f => (
              <div key={f.title} style={{ padding: '24px 26px', borderRadius: 16, background: '#F8F9FF', border: '1.5px solid rgba(27,61,224,0.07)' }}>
                <div style={{ fontSize: 28, marginBottom: 12 }}>{f.icon}</div>
                <div style={{ fontWeight: 700, color: S.ink, fontSize: 15, marginBottom: 8 }}>{f.title}</div>
                <div style={{ fontSize: 13.5, color: S.muted, lineHeight: 1.65 }}>{f.body}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ──────────────────────────────────────────────────── */}
      <section style={{ padding: '72px 2rem 80px', background: '#F0F3FF' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <div style={pill({ background: '#EEF1FD', color: S.royal, marginBottom: 16 })}>Employer pricing</div>
            <h2 style={{ fontFamily: S.serif, fontSize: 'clamp(1.8rem,3vw,2.8rem)', color: S.ink, marginBottom: 12 }}>Simple, transparent packages</h2>
            <p style={{ color: S.muted, fontSize: 15, maxWidth: '54ch', margin: '0 auto' }}>Competitive with local recruiter rates — with a cleaner, AI-first experience included.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20, alignItems: 'start' }}>
            {([
              { tag: 'One-off',      name: 'Launch 1 Job',     price: 'LKR 3,500',  per: 'per campaign',     featured: false, cta: 'Get started',        href: '/register?role=employer&plan=single',  tagBg: '#EEF1FD',             tagColor: S.royal,   cardBg: S.white, priceColor: S.ink,  checkFill: '#EEF1FD',             checkStroke: S.royal,   bodyColor: S.soft, points: ['One active job posting', 'AI job description builder', 'Applicant dashboard access', 'Standard screening tools'] },
              { tag: 'Most popular', name: 'Monthly Hiring',   price: 'LKR 7,500',  per: 'per month',        featured: true,  cta: 'Start monthly plan', href: '/register?role=employer&plan=monthly', tagBg: 'rgba(9,24,117,0.12)', tagColor: S.deep,    cardBg: S.gold,  priceColor: S.deep, checkFill: 'rgba(9,24,117,0.15)', checkStroke: S.deep,    bodyColor: S.deep, points: ['Unlimited job postings', 'Full ATS pipeline access', 'AI applicant ranking', 'Team collaboration tools'] },
              { tag: 'Enterprise',   name: 'Bulk Recruitment', price: 'LKR 13,500', per: 'starting package', featured: false, cta: 'Contact us',         href: '/register?role=employer&plan=bulk',    tagBg: '#EDFDF5',             tagColor: '#15803D', cardBg: S.white, priceColor: S.ink,  checkFill: '#EDFDF5',             checkStroke: '#15803D', bodyColor: S.soft, points: ['Multi-branch job campaigns', 'Recruiter team accounts', 'Bulk posting & management', 'Priority onboarding support'] },
            ] as const).map(pkg => (
              <div key={pkg.name} style={{
                background: pkg.cardBg, borderRadius: 22, padding: 32,
                border: pkg.featured ? `2px solid ${S.gold}` : '1.5px solid rgba(27,61,224,0.09)',
                boxShadow: pkg.featured ? '0 24px 64px rgba(245,184,0,0.2)' : '0 4px 20px rgba(27,61,224,0.06)',
                transform: pkg.featured ? 'scale(1.03)' : 'none',
                position: 'relative',
              }}>
                <span style={pill({ background: pkg.tagBg, color: pkg.tagColor, marginBottom: 20, fontSize: 11 })}>{pkg.tag}</span>
                <div style={{ fontFamily: S.serif, fontSize: 34, fontWeight: 700, color: pkg.priceColor, lineHeight: 1, marginBottom: 4 }}>{pkg.price}</div>
                <div style={{ fontSize: 13, color: pkg.featured ? 'rgba(9,24,117,0.6)' : S.muted, marginBottom: 8 }}>{pkg.per}</div>
                <div style={{ fontWeight: 700, color: pkg.priceColor, fontSize: 16, marginBottom: 22 }}>{pkg.name}</div>
                <div style={{ display: 'grid', gap: 10, marginBottom: 26 }}>
                  {pkg.points.map((p: string) => (
                    <div key={p} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, marginTop: 2 }}>
                        <circle cx="8" cy="8" r="8" fill={pkg.checkFill} />
                        <path d="M5 8l2 2 4-4" stroke={pkg.checkStroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span style={{ fontSize: 13.5, color: pkg.bodyColor, lineHeight: 1.5 }}>{p}</span>
                    </div>
                  ))}
                </div>
                <Link href={pkg.href} style={{
                  ...btn(pkg.featured ? S.deep : 'linear-gradient(135deg,#1B3DE0,#4F6EFF)', S.white),
                  display: 'block', textAlign: 'center', fontSize: 14,
                }}>
                  {pkg.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER CTA ───────────────────────────────────────────────── */}
      <section style={{ background: 'linear-gradient(140deg,#06103f 0%,#0c1a6b 50%,#1535c0 100%)', padding: '80px 2rem', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 700, height: 700, borderRadius: '50%', background: 'radial-gradient(circle,rgba(79,110,255,0.15),transparent 65%)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: 640, margin: '0 auto', position: 'relative' }}>
          <div style={pill({ background: 'rgba(245,184,0,0.15)', color: S.gold, border: '1px solid rgba(245,184,0,0.25)', marginBottom: 24 })}>
            Ready to get started?
          </div>
          <h2 style={{ fontFamily: S.serif, fontSize: 'clamp(2.2rem,4vw,3.8rem)', color: S.white, marginBottom: 16, lineHeight: 1.1 }}>
            The future of hiring<br />starts here.
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 16, marginBottom: 40, lineHeight: 1.65 }}>
            Join thousands of candidates and employers already using TalentAI.lk — the smarter way to hire and get hired in Sri Lanka.
          </p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/register?role=job_seeker" style={{ ...btn(S.gold, S.deep), boxShadow: '0 4px 20px rgba(245,184,0,0.35)', fontSize: 15 }}>Create candidate account</Link>
            <Link href="/register?role=employer"   style={{ ...btn('rgba(255,255,255,0.1)', S.white), border: '1.5px solid rgba(255,255,255,0.22)', fontSize: 15 }}>Post a job today</Link>
          </div>
          <div style={{ marginTop: 40, color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>
            Free for job seekers &nbsp;·&nbsp; No credit card required &nbsp;·&nbsp; Set up in minutes
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────── */}
      <footer style={{ background: '#040d32', padding: '28px 2rem' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: 'linear-gradient(135deg,#1B3DE0,#4F6EFF)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: S.white, fontWeight: 800, fontSize: 14 }}>T</div>
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>TalentAI.lk — AI-first hiring for Sri Lanka</span>
          </div>
          <div style={{ display: 'flex', gap: 24 }}>
            {[
              { href: '/jobs',                   label: 'Browse jobs' },
              { href: '/login?role=job_seeker',  label: 'Job seekers' },
              { href: '/login?role=employer',    label: 'Employers' },
              { href: '/register?role=employer', label: 'Post a job' },
            ].map(l => (
              <Link key={l.href} href={l.href} style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, textDecoration: 'none' }}>{l.label}</Link>
            ))}
          </div>
        </div>
      </footer>

    </div>
  )
}
