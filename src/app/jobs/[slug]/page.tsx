'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { CoLogo, ScoreRing, BreakdownBar, Check, PageHero } from '@/components/ui'

// ── Lightweight markdown renderer ─────────────────────────────────────────────
function MarkdownContent({ text }: { text: string }) {
  const lines = text.split('\n')
  const elements: React.ReactNode[] = []
  let listBuffer: string[] = []

  const flushList = (key: string) => {
    if (listBuffer.length === 0) return
    elements.push(
      <ul key={key} style={{ paddingLeft: '1.5rem', margin: '8px 0', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {listBuffer.map((item, i) => (
          <li key={i} style={{ fontSize: '0.9rem' }}>{renderInline(item)}</li>
        ))}
      </ul>
    )
    listBuffer = []
  }

  const renderInline = (s: string): React.ReactNode => {
    // bold + italic: ***text***
    // bold: **text**
    // italic: *text* or _text_
    const parts = s.split(/(\*\*\*.*?\*\*\*|\*\*.*?\*\*|\*.*?\*|_.*?_)/g)
    return parts.map((p, i) => {
      if (p.startsWith('***') && p.endsWith('***')) return <strong key={i}><em>{p.slice(3, -3)}</em></strong>
      if (p.startsWith('**') && p.endsWith('**')) return <strong key={i}>{p.slice(2, -2)}</strong>
      if ((p.startsWith('*') && p.endsWith('*')) || (p.startsWith('_') && p.endsWith('_'))) return <em key={i}>{p.slice(1, -1)}</em>
      return p
    })
  }

  lines.forEach((line, idx) => {
    const key = String(idx)
    if (/^#{1,6}\s/.test(line)) {
      flushList('list-' + key)
      const level = line.match(/^(#+)/)?.[1].length ?? 2
      const content = line.replace(/^#+\s/, '')
      const sizes: Record<number, string> = { 1: '1.15rem', 2: '1.05rem', 3: '1rem', 4: '0.95rem', 5: '0.9rem', 6: '0.875rem' }
      elements.push(
        <p key={key} style={{ fontWeight: 600, fontSize: sizes[level] ?? '1rem', margin: '16px 0 6px', color: 'var(--ink)' }}>
          {renderInline(content)}
        </p>
      )
    } else if (/^[-*]\s/.test(line)) {
      listBuffer.push(line.replace(/^[-*]\s/, ''))
    } else if (line.trim() === '') {
      flushList('list-' + key)
      elements.push(<br key={key} />)
    } else {
      flushList('list-' + key)
      elements.push(
        <p key={key} style={{ margin: '4px 0', fontSize: '0.9rem' }}>
          {renderInline(line)}
        </p>
      )
    }
  })
  flushList('list-end')

  return <div style={{ lineHeight: 1.75, color: 'var(--ink-soft)' }}>{elements}</div>
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface Job {
  id: string
  title: string
  slug: string
  description: string
  requirements: string[]
  responsibilities: string[]
  skillsRequired: string[]
  skillsPreferred: string[]
  jobType: string
  workMode: string
  location: string | null
  salaryMin: number | null
  salaryMax: number | null
  salaryCurrency: string
  salaryVisible: boolean
  experienceMin: number | null
  experienceMax: number | null
  educationLevel: string | null
  closesAt: string | null
  createdAt: string
  isFeatured: boolean
  applicationsCount: number
  company: {
    id: string
    name: string
    slug: string
    description: string | null
    logoUrl: string | null
    website: string | null
    linkedinUrl: string | null
    industry: string | null
    companySize: string | null
    headquarters: string | null
    isVerified: boolean
    _count: { jobs: number }
  }
}

interface MatchScore {
  score: number
  summary: string | null
  strengths: string[]
  gaps: string[]
  skillsMatched: string[]
  skillsMissing: string[]
  breakdown: {
    skills: number
    experience: number
    title: number
    location: number
    education: number
    profileCompleteness: number
  }
}

const TYPE_LABELS: Record<string, string> = {
  full_time: 'Full time', part_time: 'Part time', contract: 'Contract',
  internship: 'Internship', freelance: 'Freelance',
}
const MODE_LABELS: Record<string, string> = { onsite: 'Onsite', remote: 'Remote', hybrid: 'Hybrid' }

const companyColors: Record<string, string> = {
  'google': '#4285F4',
  'microsoft': '#00A4EF',
  'amazon': '#FF9900',
  'apple': '#000000',
  'facebook': '#1877F2',
  'meta': '#1877F2',
  'netflix': '#E50914',
  'uber': '#000000',
  'spotify': '#1DB954',
}

function getCompanyColor(companyName?: string): string {
  if (!companyName) return '#1B3DE0'
  const lower = companyName.toLowerCase()
  return companyColors[lower] || '#1B3DE0'
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function JobDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const router = useRouter()
  const [job, setJob] = useState<Job | null>(null)
  const [loading, setLoading] = useState(true)
  const [applying, setApplying] = useState(false)
  const [applied, setApplied] = useState(false)
  const [applyError, setApplyError] = useState<string | null>(null)
  const [coverLetter, setCoverLetter] = useState('')
  const [showApplyPanel, setShowApplyPanel] = useState(false)
  const [matchScore, setMatchScore] = useState<MatchScore | null>(null)

  useEffect(() => {
    fetch(`/api/jobs/${slug}`)
      .then(r => r.json())
      .then(data => {
        if (data.data) setJob(data.data)
        if (data.matchScore) setMatchScore(data.matchScore)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [slug])

  async function handleApply() {
    setApplying(true)
    setApplyError(null)
    const res = await fetch('/api/applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobId: job!.id, coverLetter: coverLetter || undefined }),
    })
    const data = await res.json()
    if (!res.ok) {
      if (res.status === 401) {
        router.push('/login?callbackUrl=/jobs/' + slug)
        return
      }
      setApplyError(data.error ?? 'Application failed')
    } else {
      setApplied(true)
      setShowApplyPanel(false)
    }
    setApplying(false)
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--ink-muted)', fontSize: '0.875rem' }}>Loading…</div>
      </div>
    )
  }

  if (!job) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '12px' }}>
        <p style={{ color: 'var(--ink-soft)', fontWeight: 600 }}>Job not found</p>
        <Link href="/jobs" className="btn btn-primary">Browse jobs</Link>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface)' }}>
      {/* Nav */}
      {/* Breadcrumb band */}
      <PageHero pad="18px 0">
        <Link href="/jobs" style={{ fontSize: '0.95rem', color: '#fff', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
          ← Back to jobs
        </Link>
      </PageHero>

      <div className="app-wrap detail-grid" style={{ padding: '32px 28px', display: 'grid', gridTemplateColumns: '1fr 320px', gap: '26px', alignItems: 'start' }}>
        {/* Main */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Header card */}
          <div className="card" style={{ padding: '28px' }}>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', marginBottom: '16px' }}>
              <CoLogo
                initial={job.company.name.charAt(0)}
                color={getCompanyColor(job.company.name)}
                size={60}
                radius={12}
              />
              <div>
                <h1 style={{ fontFamily: 'var(--ff-serif)', fontSize: 'clamp(1.6rem,3vw,2.2rem)', marginBottom: '4px', fontWeight: 800 }}>{job.title}</h1>
                <p style={{ fontSize: '0.9rem', color: 'var(--ink-muted)' }}>
                  <Link href={`/companies/${job.company.slug}`} style={{ color: 'var(--royal)', fontWeight: 700 }}>
                    {job.company.name}
                  </Link>
                  {job.company.isVerified && <span style={{ color: 'var(--royal)', marginLeft: '4px' }}>✓</span>}
                  {job.location && <> · {job.location}</>}
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
              <span className="badge badge-royal">{TYPE_LABELS[job.jobType] ?? job.jobType}</span>
              <span className="badge badge-surface">{MODE_LABELS[job.workMode] ?? job.workMode}</span>
              {job.salaryVisible && job.salaryMin && (
                <span className="badge badge-green">
                  {job.salaryCurrency} {(job.salaryMin / 1000).toFixed(0)}k{job.salaryMax ? `–${(job.salaryMax / 1000).toFixed(0)}k` : '+'}
                </span>
              )}
              {job.isFeatured && <span className="badge badge-gold">Featured</span>}
              {job.closesAt && (
                <span className="badge badge-amber">
                  Closes {new Date(job.closesAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {applied ? (
                <div className="btn" style={{ background: 'var(--green)', color: '#fff', cursor: 'default' }}>
                  ✓ Applied successfully
                </div>
              ) : (
                <button
                  className="btn btn-primary"
                  onClick={() => setShowApplyPanel(!showApplyPanel)}
                >
                  Apply now
                </button>
              )}
            </div>

            {/* Apply panel */}
            {showApplyPanel && !applied && (
              <div style={{ marginTop: '20px', padding: '20px', background: 'var(--royal-pale)', borderRadius: 'var(--r-md)', border: '1.5px solid var(--border-md)' }}>
                <h4 style={{ fontFamily: 'var(--ff)', fontSize: '0.9rem', fontWeight: 700, marginBottom: '12px' }}>
                  Apply for {job.title}
                </h4>
                {applyError && (
                  <div style={{ background: 'var(--coral-pale)', borderRadius: 'var(--r-sm)', padding: '10px', marginBottom: '12px', fontSize: '0.83rem', color: 'var(--coral)' }}>
                    {applyError}
                  </div>
                )}
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--ink-soft)', marginBottom: '6px' }}>
                  Cover letter (optional)
                </label>
                <textarea
                  className="input"
                  value={coverLetter}
                  onChange={e => setCoverLetter(e.target.value)}
                  placeholder="Tell them why you're a great fit…"
                  rows={4}
                  style={{ resize: 'vertical', marginBottom: '12px' }}
                />
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn btn-primary" onClick={handleApply} disabled={applying}>
                    {applying ? 'Submitting…' : 'Submit application'}
                  </button>
                  <button className="btn btn-ghost" onClick={() => setShowApplyPanel(false)}>
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* AI Match block */}
          {matchScore && (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              {/* Dark header */}
              <div style={{ background: 'radial-gradient(120% 130% at 85% 0%, #15309f, #06103f)', padding: '28px', color: '#fff', display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
                <ScoreRing score={matchScore.score} size={132} label="AI MATCH" dark={true} />
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.7)', marginBottom: '8px' }}>Your AI match</p>
                  <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.85)', lineHeight: 1.6 }}>
                    {matchScore.summary ?? 'Your profile has been compared against this role.'}
                  </p>
                </div>
              </div>

              {/* White body */}
              <div style={{ padding: '28px' }}>
                {/* Breakdown bars in 2 columns */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px 28px', marginBottom: '28px' }}>
                  {[
                    ['Skills', matchScore.breakdown.skills],
                    ['Experience', matchScore.breakdown.experience],
                    ['Title fit', matchScore.breakdown.title],
                    ['Location', matchScore.breakdown.location],
                    ['Education', matchScore.breakdown.education],
                    ['Profile', matchScore.breakdown.profileCompleteness],
                  ].map(([label, value], idx) => (
                    <BreakdownBar key={label} label={label as string} value={value as number} delay={200 + idx * 50} />
                  ))}
                </div>

                {/* Strengths & Gaps */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                  <div>
                    <p style={{ fontSize: '12px', fontWeight: 700, color: '#15803D', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>
                      Strengths
                    </p>
                    {matchScore.strengths.length === 0 ? (
                      <p style={{ fontSize: '0.85rem', color: 'var(--ink-muted)' }}>Add more profile detail to unlock stronger insights.</p>
                    ) : (
                      <ul style={{ paddingLeft: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {matchScore.strengths.map((item) => (
                          <li key={item} style={{ fontSize: '0.85rem', color: 'var(--ink-soft)', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                            <Check color="#15803D" size={16} />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div>
                    <p style={{ fontSize: '12px', fontWeight: 700, color: '#B4790B', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>
                      To improve
                    </p>
                    {matchScore.gaps.length === 0 ? (
                      <p style={{ fontSize: '0.85rem', color: 'var(--ink-muted)' }}>No major gaps were detected from your current profile.</p>
                    ) : (
                      <ul style={{ paddingLeft: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {matchScore.gaps.map((item) => (
                          <li key={item} style={{ fontSize: '0.85rem', color: 'var(--ink-soft)', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                            <span style={{ color: '#B4790B', fontWeight: 700 }}>!</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="card" style={{ padding: '28px' }}>
            <h2 style={{ fontFamily: 'var(--ff-serif)', fontSize: '1.2rem', marginBottom: '16px' }}>About this role</h2>
            <MarkdownContent text={job.description} />
          </div>

          {/* Requirements */}
          {job.requirements.length > 0 && (
            <div className="card" style={{ padding: '28px' }}>
              <h2 style={{ fontFamily: 'var(--ff-serif)', fontSize: '1.2rem', marginBottom: '16px' }}>Requirements</h2>
              <ul style={{ paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {job.requirements.map((req, i) => (
                  <li key={i} style={{ fontSize: '0.875rem', color: 'var(--ink-soft)' }}>{req}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Responsibilities */}
          {job.responsibilities.length > 0 && (
            <div className="card" style={{ padding: '28px' }}>
              <h2 style={{ fontFamily: 'var(--ff-serif)', fontSize: '1.2rem', marginBottom: '16px' }}>Responsibilities</h2>
              <ul style={{ paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {job.responsibilities.map((r, i) => (
                  <li key={i} style={{ fontSize: '0.875rem', color: 'var(--ink-soft)' }}>{r}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Skills */}
          {job.skillsRequired.length > 0 && (
            <div className="card" style={{ padding: '28px' }}>
              <h2 style={{ fontFamily: 'var(--ff-serif)', fontSize: '1.2rem', marginBottom: '16px' }}>Skills</h2>
              <div style={{ marginBottom: '12px' }}>
                <p style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--ink-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Required</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {job.skillsRequired.map((s) => (
                    <span key={s} className="badge badge-royal">{s}</span>
                  ))}
                </div>
              </div>
              {job.skillsPreferred.length > 0 && (
                <div>
                  <p style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--ink-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Nice to have</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {job.skillsPreferred.map((s) => (
                      <span key={s} className="badge badge-surface">{s}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'sticky', top: '82px', alignSelf: 'start' }}>
          {/* Company card */}
          <div className="card" style={{ padding: '20px' }}>
            <h3 style={{ fontFamily: 'var(--ff)', fontWeight: 700, fontSize: '0.875rem', marginBottom: '12px' }}>About the company</h3>
            <p style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--ink)' }}>{job.company.name}</p>
            {job.company.industry && <p style={{ fontSize: '0.8rem', color: 'var(--ink-muted)', marginTop: '2px' }}>{job.company.industry}</p>}
            {job.company.description && (
              <p style={{ fontSize: '0.83rem', color: 'var(--ink-soft)', marginTop: '8px', lineHeight: 1.6 }}>
                {job.company.description.slice(0, 160)}{job.company.description.length > 160 ? '…' : ''}
              </p>
            )}
            {job.company.website && (
              <a href={job.company.website} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '10px', fontSize: '0.8rem', color: 'var(--royal)' }}>
                Visit website ↗
              </a>
            )}
          </div>

          {/* Job details card */}
          <div className="card" style={{ padding: '20px' }}>
            <h3 style={{ fontFamily: 'var(--ff)', fontWeight: 700, fontSize: '0.875rem', marginBottom: '14px' }}>Job details</h3>
            <dl style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                ['Type', TYPE_LABELS[job.jobType] ?? job.jobType],
                ['Mode', MODE_LABELS[job.workMode] ?? job.workMode],
                ...(job.location ? [['Location', job.location]] : []),
                ...(job.experienceMin != null ? [['Experience', `${job.experienceMin}${job.experienceMax ? `–${job.experienceMax}` : '+'} years`]] : []),
                ...(job.educationLevel ? [['Education', job.educationLevel]] : []),
                ['Applications', String(job.applicationsCount)],
                ['Posted', new Date(job.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })],
              ].map(([label, value]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.83rem' }}>
                  <dt style={{ color: 'var(--ink-muted)' }}>{label}</dt>
                  <dd style={{ color: 'var(--ink-soft)', fontWeight: 600 }}>{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </div>
  )
}
