'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { SignOutButton } from '@/components/auth/SignOutButton'

type Role = 'job_seeker' | 'employer_admin' | 'employer_member' | 'super_admin' | null

function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll<Element>('.reveal:not(.in)')
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('in')
            io.unobserve(e.target)
          }
        })
      },
      { threshold: 0.12, rootMargin: '0px 0px -6% 0px' }
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])
}

function Mesh({ soft = false }: { soft?: boolean }) {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      <div style={{
        position: 'absolute', top: '-40%', left: '-6%', width: 460, height: 460,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(79,110,255,.5), transparent 64%)',
        filter: 'blur(30px)', animation: 'drift1 17s ease-in-out infinite',
      }} />
      <div style={{
        position: 'absolute', bottom: '-30%', right: '-4%', width: 520, height: 520,
        borderRadius: '50%',
        background: `radial-gradient(circle, rgba(245,184,0,${soft ? .14 : .24}), transparent 62%)`,
        filter: 'blur(34px)', animation: 'drift2 21s ease-in-out infinite',
      }} />
      <div style={{
        position: 'absolute', inset: 0, opacity: .28,
        backgroundImage: 'linear-gradient(rgba(255,255,255,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.06) 1px,transparent 1px)',
        backgroundSize: '52px 52px',
      }} />
    </div>
  )
}

export function SimpleLandingPage({ role = null }: { role?: Role }) {
  useReveal()

  const isSeeker   = role === 'job_seeker'
  const isEmployer = role === 'employer_admin' || role === 'employer_member'

  const defaultSide = isEmployer ? 'employer' : 'seeker'
  const [side, setSide] = useState<'seeker' | 'employer'>(defaultSide)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface)', fontFamily: 'var(--ff)' }}>

      {/* ── NAV ─────────────────────────────────────────────────────── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 90,
        background: 'rgba(6,11,46,.88)', backdropFilter: 'blur(18px) saturate(140%)',
        borderBottom: '1px solid rgba(255,255,255,.09)',
      }}>
        <div className="wrap" style={{ height: 66, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20 }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/talantz-logo.png" alt="Talantz" style={{ height: 30, width: 'auto', display: 'block' }} />
          </Link>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Link href="/jobs" className="btn btn-sm" style={{ background: 'rgba(255,255,255,.08)', color: 'rgba(255,255,255,.85)', border: '1px solid rgba(255,255,255,.14)' }}>
              Browse jobs
            </Link>
            {role ? (
              <SignOutButton
                label="Sign out"
                callbackUrl="/"
                className="btn btn-sm"
                style={{ background: 'rgba(255,255,255,.08)', color: 'rgba(255,255,255,.85)', border: '1px solid rgba(255,255,255,.14)' }}
              />
            ) : (
              <Link href="/login?audience=employer" className="btn btn-sm" style={{ background: 'rgba(255,255,255,.08)', color: 'rgba(255,255,255,.85)', border: '1px solid rgba(255,255,255,.14)' }}>
                Sign in
              </Link>
            )}
            <Link
              href={isSeeker ? '/jobs' : isEmployer ? '/employer' : '/register?audience=job_seeker'}
              className="btn btn-gold btn-sm"
            >
              {isSeeker ? 'Find jobs' : isEmployer ? 'Dashboard' : 'Get started'}
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ────────────────────────────────────────────────────── */}
      <section style={{
        position: 'relative', overflow: 'hidden',
        background: 'radial-gradient(120% 130% at 78% -10%, var(--space-2) 0%, var(--space-1) 46%, var(--space-0) 100%)',
        color: '#fff', padding: '96px 0 140px',
      }}>
        <Mesh />
        <div className="wrap" style={{ position: 'relative' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 460px', gap: 64, alignItems: 'center' }} className="hero-grid">

            {/* ── Left copy ── */}
            <div>
              {/* Segmented toggle */}
              <div style={{ marginBottom: 20 }}>
                <div className="seg" style={{ display: 'inline-flex' }}>
                  <button
                    className={side === 'seeker' ? 'on seeker' : ''}
                    onClick={() => setSide('seeker')}
                    style={{ padding: '11px 24px', fontSize: 14.5, fontWeight: 700 }}
                  >
                    Looking for work
                  </button>
                  <button
                    className={side === 'employer' ? 'on employer' : ''}
                    onClick={() => setSide('employer')}
                    style={{ padding: '11px 24px', fontSize: 14.5, fontWeight: 700 }}
                  >
                    Hiring talent
                  </button>
                </div>
              </div>

              {/* Dynamic eyebrow tag */}
              <div key={side + '-tag'} className="tag swap-in" style={{
                display: 'inline-flex', background: 'rgba(10,8,3,.55)', color: 'var(--gold-soft)',
                border: '1px solid rgba(245,184,0,.35)', marginBottom: 22,
              }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--gold)', display: 'inline-block', flexShrink: 0 }} />
                {side === 'seeker' ? 'For people looking for work' : 'For employers & recruiters'}
              </div>

              {/* Mixed-font headline */}
              <h1 key={side + '-h1'} className="swap-in" style={{
                fontFamily: 'var(--ff)', fontSize: 'clamp(3rem,5.2vw,5.4rem)',
                lineHeight: 1.05, color: '#fff', marginBottom: 20, fontWeight: 800,
                letterSpacing: '-0.02em',
              }}>
                {side === 'seeker' ? (
                  <>
                    Find work that{' '}
                    <span style={{ fontFamily: 'var(--ff-serif)', fontStyle: 'italic', fontWeight: 600, color: 'var(--gold-soft)', letterSpacing: 0 }}>fits</span>
                    <br />— before you apply.
                  </>
                ) : (
                  <>
                    Hire the right{' '}
                    <span style={{ fontFamily: 'var(--ff-serif)', fontStyle: 'italic', fontWeight: 600, color: 'var(--gold-soft)', letterSpacing: 0 }}>person</span>
                    <br />— faster than ever.
                  </>
                )}
              </h1>

              <p key={side + '-p'} className="swap-in" style={{ fontSize: 17, color: 'rgba(255,255,255,.72)', maxWidth: '48ch', lineHeight: 1.65, marginBottom: 32 }}>
                {side === 'seeker'
                  ? 'Build one AI-scored profile. See exactly how you match every role. Apply in seconds, track every step.'
                  : 'Post a role in minutes, get AI-ranked applicants, and run your whole pipeline from one clean workspace.'}
              </p>

              <div key={side + '-btns'} className="swap-in" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 28 }}>
                {side === 'seeker' ? (
                  <>
                    <Link href={isSeeker ? '/profile' : '/register?audience=job_seeker'} className="btn btn-gold">
                      Build your profile
                    </Link>
                    <Link href="/jobs" className="btn" style={{ background: 'rgba(255,255,255,.13)', color: '#fff', border: '1.5px solid rgba(255,255,255,.22)' }}>
                      Browse open roles
                    </Link>
                  </>
                ) : (
                  <>
                    <Link href={isEmployer ? '/employer/jobs/new' : '/register?audience=employer'} className="btn btn-gold">
                      Post a job
                    </Link>
                    <Link href="#pricing" className="btn" style={{ background: 'rgba(255,255,255,.13)', color: '#fff', border: '1.5px solid rgba(255,255,255,.22)' }}>
                      See pricing
                    </Link>
                  </>
                )}
              </div>

              {/* Gold checkmarks */}
              <div key={side + '-checks'} className="swap-in" style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                {(side === 'seeker'
                  ? ['LinkedIn import', 'Instant fit score', 'Free forever']
                  : ['AI applicant ranking', 'Full ATS pipeline', 'Team workspace']
                ).map((t) => (
                  <span key={t} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13.5, color: 'rgba(255,255,255,.72)', fontWeight: 500 }}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <circle cx="8" cy="8" r="8" fill="var(--gold)" opacity=".22" />
                      <path d="M4.5 8l2.5 2.5 4.5-4.5" stroke="var(--gold)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {/* ── Right cards — switch by side ── */}
            {side === 'seeker' ? (
              <div key="seeker-cards" className="swap-in" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

                {/* Job card */}
                <div style={{ background: '#fff', borderRadius: 20, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,.22)' }}>
                  {/* Card header */}
                  <div style={{ padding: '20px 22px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6 }}>
                      <div style={{ fontWeight: 700, color: 'var(--ink)', fontSize: 15.5 }}>Senior Product Designer</div>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700, color: '#15803D', flexShrink: 0, marginLeft: 8 }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22C55E', display: 'inline-block' }} />
                        Open
                      </span>
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--ink-muted)', marginBottom: 12 }}>Dialog Axiata · Colombo · Hybrid</div>
                    <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                      {['Figma', 'UX Research', 'Prototyping'].map((s) => (
                        <span key={s} style={{ padding: '4px 11px', borderRadius: 999, fontSize: 12, fontWeight: 600, background: 'var(--royal-pale)', color: 'var(--royal)' }}>{s}</span>
                      ))}
                    </div>
                  </div>

                  {/* Dark AI match band */}
                  <div style={{ background: 'linear-gradient(135deg,#06103f,#0f1f7a)', padding: '16px 22px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.1em', color: 'rgba(255,255,255,.55)', textTransform: 'uppercase' }}>Your AI Match</span>
                      <span style={{ fontSize: 22, fontWeight: 800, color: 'var(--gold-soft)', letterSpacing: '-.02em' }}>92<span style={{ fontSize: 13 }}>%</span></span>
                    </div>
                    <div style={{ height: 8, borderRadius: 999, background: 'rgba(255,255,255,.12)', overflow: 'hidden', marginBottom: 10 }}>
                      <div style={{ height: '100%', width: '92%', borderRadius: 999, background: 'linear-gradient(90deg,#F5B800,#FFD34D)', boxShadow: '0 0 12px rgba(245,184,0,.5)' }} />
                    </div>
                    <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,.55)', lineHeight: 1.5 }}>
                      Strong on design systems · add 1 research case study to reach 96%
                    </div>
                  </div>
                </div>

                {/* Profile strength card */}
                <div style={{ background: '#fff', borderRadius: 16, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14, boxShadow: '0 8px 28px rgba(0,0,0,.14)' }}>
                  <div className="av" style={{ width: 40, height: 40, fontSize: 16, flexShrink: 0 }}>K</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, color: 'var(--ink)', fontSize: 14 }}>Profile strength</div>
                    <div style={{ fontSize: 12.5, color: 'var(--ink-muted)' }}>3 quick wins to stand out</div>
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--royal)', letterSpacing: '-.02em' }}>91<span style={{ fontSize: 13 }}>%</span></div>
                </div>

              </div>
            ) : (
              <div key="employer-cards" className="swap-in" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

                {/* Pipeline card */}
                <div style={{ background: 'rgba(255,255,255,.07)', borderRadius: 20, border: '1px solid rgba(255,255,255,.12)', padding: '18px 20px', boxShadow: '0 8px 32px rgba(0,0,0,.2)' }}>
                  <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.1em', color: 'rgba(255,255,255,.45)', textTransform: 'uppercase', marginBottom: 14 }}>
                    Hiring Pipeline · Product Designer
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
                    {[
                      { n: 48, label: 'Applied',    active: false },
                      { n: 12, label: 'Shortlist',  active: true  },
                      { n: 4,  label: 'Interview',  active: false },
                      { n: 1,  label: 'Offer',      active: false },
                    ].map((stage) => (
                      <div key={stage.label} style={{
                        padding: '12px 8px', borderRadius: 12, textAlign: 'center',
                        background: stage.active ? 'var(--gold)' : 'rgba(255,255,255,.08)',
                        border: `1px solid ${stage.active ? 'var(--gold)' : 'rgba(255,255,255,.1)'}`,
                      }}>
                        <div style={{ fontSize: 22, fontWeight: 800, color: stage.active ? 'var(--royal-deep)' : '#fff', lineHeight: 1 }}>{stage.n}</div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: stage.active ? 'var(--royal-deep)' : 'rgba(255,255,255,.5)', marginTop: 4 }}>{stage.label}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Ranked applicants card */}
                <div style={{ background: '#fff', borderRadius: 20, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,.22)' }}>
                  <div style={{ padding: '14px 18px 10px', borderBottom: '1px solid rgba(27,61,224,.07)' }}>
                    <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.1em', color: 'var(--ink-muted)', textTransform: 'uppercase' }}>AI-Ranked Applicants</div>
                  </div>
                  {[
                    { i: 'A', n: 'Amara Silva',   r: 'Sr. Designer · 6y',      s: 96, top: true },
                    { i: 'N', n: 'Nuwan Jay',      r: 'Product Designer · 4y',  s: 88, top: false },
                    { i: 'R', n: 'Rashmi Fer.',    r: 'UI Designer · 3y',       s: 81, top: false },
                  ].map((cand) => (
                    <div key={cand.n} style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '12px 18px',
                      borderBottom: '1px solid rgba(27,61,224,.06)',
                      ...(cand.top ? { background: 'rgba(245,184,0,.07)', borderLeft: '3px solid var(--gold)' } : { borderLeft: '3px solid transparent' }),
                    }}>
                      <div className="av" style={{ width: 36, height: 36, fontSize: 14 }}>{cand.i}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, color: 'var(--ink)', fontSize: 13.5, lineHeight: 1.2 }}>{cand.n}</div>
                        <div style={{ fontSize: 12, color: 'var(--ink-muted)' }}>{cand.r}</div>
                      </div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: cand.top ? '#15803D' : 'var(--royal)', letterSpacing: '-.01em' }}>
                        {cand.s} <span style={{ fontSize: 11, fontWeight: 600 }}>%</span>
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            )}

          </div>
        </div>

        {/* Curved bottom divider */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 52, pointerEvents: 'none' }}>
          <svg viewBox="0 0 1440 52" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }}>
            <path d="M0,52 L0,26 Q720,-18 1440,26 L1440,52 Z" fill="var(--surface)" />
          </svg>
        </div>
      </section>

      {/* ── STATS BAR ───────────────────────────────────────────────── */}
      <section style={{ maxWidth: 1200, margin: '-8px auto 0', padding: '0 28px', position: 'relative', zIndex: 10 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }} className="stats-grid">
          {[
            { n: '2,400+', label: 'Active job seekers' },
            { n: '340+',   label: 'Employers hiring' },
            { n: '5,800+', label: 'Applications placed' },
            { n: '91%',    label: 'Employer satisfaction' },
          ].map((s, i) => (
            <div key={s.label} className="card reveal" data-d={String(i + 1)} style={{ padding: '20px 24px', textAlign: 'center', boxShadow: '0 8px 30px rgba(27,61,224,.07)' }}>
              <div style={{ fontFamily: 'var(--ff-serif)', fontSize: 30, fontWeight: 700, color: 'var(--royal)', lineHeight: 1 }}>{s.n}</div>
              <div style={{ fontSize: 12.5, color: 'var(--ink-muted)', marginTop: 6 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ────────────────────────────────────────────── */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '88px 28px 64px' }}>
        <div className="reveal" style={{ textAlign: 'center', marginBottom: 52 }}>
          <div className="badge badge-royal" style={{ display: 'inline-flex', marginBottom: 14 }}>How it works</div>
          <h2 style={{ fontFamily: 'var(--ff-serif)', fontSize: 'clamp(2.2rem,3.5vw,3.2rem)', color: 'var(--ink)', marginBottom: 12, fontWeight: 600 }}>
            Simple for everyone
          </h2>
          <p style={{ color: 'var(--ink-muted)', fontSize: 15, maxWidth: '50ch', margin: '0 auto' }}>
            Whether you&apos;re searching for a role or building a team, Talantz gets you there faster.
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }} className="steps-grid">

          {/* Seekers */}
          <div className="card step-card reveal" style={{ padding: 36, transition: 'transform .28s cubic-bezier(.22,.68,0,1), box-shadow .28s, border-color .28s' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
              <div style={{ width: 38, height: 38, borderRadius: 11, background: 'linear-gradient(135deg,var(--royal),#4F6EFF)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                </svg>
              </div>
              <div style={{ fontWeight: 700, color: 'var(--ink)', fontSize: 16 }}>For job seekers</div>
            </div>
            {[
              { n: '01', title: 'Build your profile',  body: 'Import from LinkedIn or fill manually. AI strengthens your headline, skills, and summary.' },
              { n: '02', title: 'See your fit score',   body: 'Before applying, see how well you match each role based on your profile and experience.' },
              { n: '03', title: 'Apply and track',      body: 'Apply in seconds and track every application from shortlist to offer in one dashboard.' },
            ].map((step) => (
              <div key={step.n} style={{ display: 'flex', gap: 14, marginBottom: 20 }}>
                <div style={{ width: 32, height: 32, borderRadius: 9, background: 'var(--royal-pale)', color: 'var(--royal)', fontWeight: 800, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{step.n}</div>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--ink)', fontSize: 14, marginBottom: 4 }}>{step.title}</div>
                  <div style={{ fontSize: 13.5, color: 'var(--ink-muted)', lineHeight: 1.6 }}>{step.body}</div>
                </div>
              </div>
            ))}
            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <Link href="/register?audience=job_seeker" className="btn btn-royal btn-sm">Create free account</Link>
              <Link href="/login?audience=job_seeker" className="btn btn-ghost btn-sm">Sign in</Link>
            </div>
          </div>

          {/* Employers */}
          <div className="step-card reveal" style={{ background: 'linear-gradient(160deg,#06103f,#0f1f7a)', borderRadius: 20, border: '1px solid rgba(255,255,255,.08)', padding: 36, transition: 'transform .28s cubic-bezier(.22,.68,0,1), box-shadow .28s' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
              <div style={{ width: 38, height: 38, borderRadius: 11, background: 'rgba(245,184,0,.2)', border: '1px solid rgba(245,184,0,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--gold-soft)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-4 0v2M8 7V5a2 2 0 0 0-4 0v2" />
                </svg>
              </div>
              <div style={{ fontWeight: 700, color: '#fff', fontSize: 16 }}>For employers</div>
            </div>
            {[
              { n: '01', title: 'Post your role',              body: 'Create a job posting manually or let AI draft and improve your description in seconds.' },
              { n: '02', title: 'Review AI-ranked applicants', body: 'Applicants are scored and ranked by profile strength, skills, and fit signals automatically.' },
              { n: '03', title: 'Manage the pipeline',         body: 'Move candidates from screening to shortlist, interview, and hire — all from one dashboard.' },
            ].map((step) => (
              <div key={step.n} style={{ display: 'flex', gap: 14, marginBottom: 20 }}>
                <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(245,184,0,.15)', color: 'var(--gold-soft)', fontWeight: 800, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{step.n}</div>
                <div>
                  <div style={{ fontWeight: 600, color: '#fff', fontSize: 14, marginBottom: 4 }}>{step.title}</div>
                  <div style={{ fontSize: 13.5, color: 'rgba(255,255,255,.65)', lineHeight: 1.6 }}>{step.body}</div>
                </div>
              </div>
            ))}
            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <Link href="/register?audience=employer" className="btn btn-gold btn-sm">Post a job</Link>
              <Link href="/login?audience=employer" className="btn btn-sm" style={{ background: 'rgba(255,255,255,.1)', color: '#fff', border: '1px solid rgba(255,255,255,.2)' }}>Employer login</Link>
            </div>
          </div>

        </div>
      </section>

      {/* ── FEATURES ────────────────────────────────────────────────── */}
      <section style={{ background: '#fff', padding: '72px 28px 80px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div className="reveal" style={{ textAlign: 'center', marginBottom: 48 }}>
            <div className="badge badge-royal" style={{ display: 'inline-flex', marginBottom: 14 }}>Platform highlights</div>
            <h2 style={{ fontFamily: 'var(--ff-serif)', fontSize: 'clamp(2rem,3vw,2.8rem)', color: 'var(--ink)', fontWeight: 600 }}>
              Everything you need in one place
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20 }} className="steps-grid">
            {[
              { icon: '🤖', title: 'AI-powered ranking',      body: 'Every applicant is automatically scored against role requirements so strong candidates surface faster.' },
              { icon: '📋', title: 'Full ATS pipeline',       body: 'Move candidates across Screening, Shortlist, Interview, Offer, and Hired — all in one workspace.' },
              { icon: '🔗', title: 'LinkedIn import',         body: 'Job seekers import their profile in one click, prefilling skills, experience, and headline.' },
              { icon: '📊', title: 'Applicant analytics',     body: 'See drop-off rates, time-in-stage, and hire velocity from the employer dashboard.' },
              { icon: '✅', title: 'Verified certifications', body: 'Candidates attach verified credentials employers can see directly inside applicant cards.' },
              { icon: '🌏', title: 'Built for Sri Lanka',     body: 'Local currency, local companies, and a platform designed around how hiring actually works here.' },
            ].map((f, i) => (
              <div key={f.title} className="card card-hover reveal" data-d={String((i % 3) + 1)} style={{ padding: '26px 28px' }}>
                <div style={{ fontSize: 28, marginBottom: 14 }}>{f.icon}</div>
                <div style={{ fontWeight: 700, color: 'var(--ink)', fontSize: 15, marginBottom: 8 }}>{f.title}</div>
                <div style={{ fontSize: 13.5, color: 'var(--ink-muted)', lineHeight: 1.65 }}>{f.body}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ─────────────────────────────────────────────────── */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '88px 28px 72px' }}>
        <div className="reveal" style={{ textAlign: 'center', marginBottom: 52 }}>
          <div className="badge badge-gold" style={{ display: 'inline-flex', marginBottom: 14 }}>Employer pricing</div>
          <h2 style={{ fontFamily: 'var(--ff-serif)', fontSize: 'clamp(2rem,3vw,2.8rem)', color: 'var(--ink)', fontWeight: 600, marginBottom: 12 }}>
            Simple packages for Sri Lankan hiring teams
          </h2>
          <p style={{ color: 'var(--ink-muted)', fontSize: 15, maxWidth: '52ch', margin: '0 auto' }}>
            Start with one role, upgrade to monthly hiring, or use a bulk plan for volume campaigns.
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20 }} className="price-grid">
          {[
            {
              name: 'Launch 1 Job', price: 'LKR 3,500', cadence: 'per campaign',
              href: '/register?audience=employer&plan=single', featured: false,
              points: ['Best for one immediate opening', 'AI-assisted job description builder', 'Application dashboard and shortlist basics'],
            },
            {
              name: 'Monthly Hiring', price: 'LKR 7,500', cadence: 'per month',
              href: '/register?audience=employer&plan=monthly', featured: true,
              points: ['Ideal for active recruiting teams', 'Multiple live jobs in one workspace', 'ATS views, candidate tracking, and richer analytics'],
            },
            {
              name: 'Bulk Recruitment', price: 'LKR 13,500', cadence: 'starting package',
              href: '/register?audience=employer&plan=bulk', featured: false,
              points: ['For branch hiring and volume recruitment', 'Bulk posting support and recruiter collaboration', 'Priority onboarding for ATS workflow setup'],
            },
          ].map((pkg, i) => (
            <div
              key={pkg.name}
              className="card price-card card-hover reveal"
              data-d={String(i + 1)}
              style={{
                padding: 32, position: 'relative',
                ...(pkg.featured ? { border: '2px solid var(--gold)', boxShadow: '0 20px 60px rgba(245,184,0,.18)' } : {}),
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
              <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '.08em', color: pkg.featured ? '#9A7200' : 'var(--royal)', marginBottom: 8, fontWeight: 700 }}>
                {pkg.name}
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 20 }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--ink)', fontFamily: 'var(--ff)' }}>{pkg.price}</div>
                <div style={{ fontSize: 13, color: 'var(--ink-muted)' }}>{pkg.cadence}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
                {pkg.points.map((p) => (
                  <div key={p} style={{ display: 'flex', gap: 9, alignItems: 'flex-start', fontSize: 13.5, color: 'var(--ink-soft)', lineHeight: 1.5 }}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
                      <circle cx="8" cy="8" r="8" fill="var(--royal)" opacity=".12" />
                      <path d="M5 8l2 2 4-4" stroke="var(--royal)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {p}
                  </div>
                ))}
              </div>
              <Link href={pkg.href} className={pkg.featured ? 'btn btn-gold' : 'btn btn-royal'} style={{ width: '100%', justifyContent: 'center' }}>
                {pkg.featured ? 'Start hiring' : 'Choose package'}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ── FOOTER CTA ──────────────────────────────────────────────── */}
      <section style={{
        position: 'relative', overflow: 'hidden',
        background: 'radial-gradient(120% 130% at 78% -10%, var(--space-2) 0%, var(--space-1) 46%, var(--space-0) 100%)',
        padding: '100px 28px 112px', color: '#fff',
      }}>
        <Mesh soft />
        <div className="wrap" style={{ position: 'relative', maxWidth: 640, margin: '0 auto', textAlign: 'center' }}>
          <div className="tag reveal in" style={{ display: 'inline-flex', background: 'rgba(245,184,0,.13)', color: 'var(--gold-soft)', border: '1px solid rgba(245,184,0,.3)', marginBottom: 24 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--gold)', animation: 'pulse 2s infinite', display: 'inline-block' }} />
            Ready to get started?
          </div>
          <h2 className="reveal" data-d="1" style={{ fontFamily: 'var(--ff-serif)', fontSize: 'clamp(2.4rem,4vw,4rem)', color: '#fff', marginBottom: 16, lineHeight: 1.08, fontWeight: 600 }}>
            The future of hiring<br />starts here.
          </h2>
          <p className="reveal" data-d="2" style={{ color: 'rgba(255,255,255,.7)', fontSize: 16, marginBottom: 40, lineHeight: 1.7 }}>
            Join thousands of candidates and employers already using Talantz — the smarter way to hire and get hired in Sri Lanka.
          </p>
          <div className="reveal" data-d="3" style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/register?audience=job_seeker" className="btn btn-gold">Create candidate account</Link>
            <Link href="/register?audience=employer" className="btn btn-glass">Post a job today</Link>
          </div>
          <div className="reveal" data-d="4" style={{ marginTop: 36, color: 'rgba(255,255,255,.38)', fontSize: 13 }}>
            Free for job seekers &nbsp;·&nbsp; No credit card required &nbsp;·&nbsp; Set up in minutes
          </div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────── */}
      <footer style={{ background: 'var(--space-0)', padding: '26px 28px', borderTop: '1px solid rgba(255,255,255,.07)' }}>
        <div className="wrap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/talantz-mark.png" alt="Talantz" style={{ width: 26, height: 26, display: 'block' }} />
            <span style={{ color: 'rgba(255,255,255,.5)', fontSize: 13 }}>Talantz — AI-first hiring for Sri Lanka</span>
          </div>
          <div style={{ display: 'flex', gap: 22 }}>
            <Link href="/jobs" className="footlink" style={{ color: 'rgba(255,255,255,.5)', fontSize: 13 }}>Browse jobs</Link>
            <Link href="/register?audience=job_seeker" className="footlink" style={{ color: 'rgba(255,255,255,.5)', fontSize: 13 }}>For candidates</Link>
            <Link href="/register?audience=employer" className="footlink" style={{ color: 'rgba(255,255,255,.5)', fontSize: 13 }}>For employers</Link>
          </div>
        </div>
      </footer>

    </div>
  )
}
