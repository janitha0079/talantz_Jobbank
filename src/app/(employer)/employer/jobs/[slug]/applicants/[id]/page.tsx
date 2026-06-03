'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { SiteHeader } from '@/components/navigation/SiteHeader'

// ── Types ────────────────────────────────────────────────────────────────────

interface Certification {
  id: string
  name: string
  issuer?: string | null
  issuedDate?: string | null
  expiryDate?: string | null
  credentialUrl?: string | null
  validation?: { status: 'validated' | 'review' | 'unverified'; score: number } | null
}

interface Experience {
  id: string
  title: string
  company: string
  location?: string | null
  startDate?: string | null
  endDate?: string | null
  isCurrent: boolean
  description?: string | null
}

interface Education {
  id: string
  institution: string
  degree?: string | null
  field?: string | null
  startYear?: number | null
  endYear?: number | null
  grade?: string | null
}

interface PortfolioLink {
  id: string
  label?: string | null
  url: string
}

interface SeekerProfile {
  id: string
  fullName?: string | null
  headline?: string | null
  summary?: string | null
  location?: string | null
  phone?: string | null
  avatarUrl?: string | null
  cvUrl?: string | null
  linkedinUrl?: string | null
  skills: string[]
  languages: Array<{ language: string; proficiency?: string }>
  user: { id: string; name?: string | null; email: string; image?: string | null }
  experiences: Experience[]
  educations: Education[]
  certifications: Certification[]
  portfolioLinks: PortfolioLink[]
}

interface Note {
  id: string
  body: string
  createdAt: string
  author?: { id: string; name?: string | null; image?: string | null }
}

interface Application {
  id: string
  status: string
  createdAt: string
  coverLetter?: string | null
  aiMatchScore?: number | null
  aiSummary?: string | null
  aiStrengths?: string[]
  aiGaps?: string[]
  aiRecommendation?: 'shortlist' | 'review' | 'pass' | null
  seeker: SeekerProfile
  notes: Note[]
  job: { id: string; title: string; slug: string; company: { name: string } }
}

interface TimelineEvent {
  id: string
  eventType: string
  payload: Record<string, unknown>
  createdAt: string
  actor?: { id: string; name?: string | null; image?: string | null } | null
}

// ── Constants ────────────────────────────────────────────────────────────────

const STATUS_OPTIONS = [
  'applied', 'screening', 'shortlisted', 'interview',
  'assessment', 'offer', 'hired', 'rejected', 'withdrawn',
]

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  applied:     { label: 'Applied',     color: 'var(--ink-muted)', bg: 'var(--surface)' },
  screening:   { label: 'Screening',   color: 'var(--royal)',     bg: 'var(--royal-pale)' },
  shortlisted: { label: 'Shortlisted', color: '#0369a1',          bg: '#e0f2fe' },
  interview:   { label: 'Interview',   color: '#0891b2',          bg: '#cffafe' },
  assessment:  { label: 'Assessment',  color: '#7c3aed',          bg: '#f3e8ff' },
  offer:       { label: 'Offer',       color: '#16a34a',          bg: '#dcfce7' },
  hired:       { label: 'Hired',       color: '#15803d',          bg: '#bbf7d0' },
  rejected:    { label: 'Rejected',    color: 'var(--coral)',     bg: '#fff1f2' },
  withdrawn:   { label: 'Withdrawn',   color: 'var(--ink-muted)', bg: 'var(--border)' },
}

const RECOMMENDATION_META: Record<string, { label: string; bg: string; color: string }> = {
  shortlist: { label: '✦ AI: Shortlist', bg: '#dcfce7', color: '#166534' },
  review:    { label: '◐ AI: Review',    bg: '#fef3c7', color: '#92400e' },
  pass:      { label: '✕ AI: Pass',      bg: '#fee2e2', color: '#b91c1c' },
}

function scoreColor(score: number) {
  if (score >= 75) return '#16a34a'
  if (score >= 55) return '#d97706'
  return 'var(--coral)'
}

function scoreRing(score: number) {
  if (score >= 75) return '#dcfce7'
  if (score >= 55) return '#fef3c7'
  return '#fee2e2'
}

function formatDate(iso: string | null | undefined) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

function formatYear(year: number | null | undefined) {
  return year ? String(year) : 'Present'
}

function timelineLabel(event: TimelineEvent): string {
  const p = event.payload as Record<string, string>
  switch (event.eventType) {
    case 'status.changed':
      return `Status changed: ${p.from ?? '?'} → ${p.to ?? '?'}`
    case 'note.added':
      return `Note added${p.body ? `: "${p.body.slice(0, 60)}${p.body.length > 60 ? '…' : ''}"` : ''}`
    case 'ai.screened':
      return 'AI screening completed'
    case 'ai.interview_prep':
      return 'AI interview prep generated'
    default:
      return event.eventType.replace('.', ' ')
  }
}

function timelineIcon(eventType: string) {
  switch (eventType) {
    case 'status.changed':   return '⇄'
    case 'note.added':       return '✎'
    case 'ai.screened':      return '✦'
    case 'ai.interview_prep': return '▶'
    default:                 return '•'
  }
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function CandidateDetailPage() {
  const { slug, id } = useParams<{ slug: string; id: string }>()
  const router = useRouter()

  const [app, setApp] = useState<Application | null>(null)
  const [timeline, setTimeline] = useState<TimelineEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [currentStatus, setCurrentStatus] = useState('')
  const [updatingStatus, setUpdatingStatus] = useState(false)

  const [noteDraft, setNoteDraft] = useState('')
  const [savingNote, setSavingNote] = useState(false)
  const [notes, setNotes] = useState<Note[]>([])

  const [activeTab, setActiveTab] = useState<'ai' | 'experience' | 'cover'>('ai')
  const [rightTab, setRightTab] = useState<'timeline' | 'notes'>('timeline')

  useEffect(() => {
    async function load() {
      try {
        const [appRes, tlRes] = await Promise.all([
          fetch(`/api/applications/${id}`),
          fetch(`/api/applications/${id}/timeline`),
        ])

        if (!appRes.ok) {
          const d = await appRes.json()
          setError(d.error ?? 'Failed to load application')
          return
        }

        const appData = await appRes.json()
        const tlData = tlRes.ok ? await tlRes.json() : { data: [] }

        setApp(appData.data)
        setCurrentStatus(appData.data.status)
        setNotes(appData.data.notes ?? [])
        setTimeline(tlData.data ?? [])
      } catch {
        setError('Network error. Please try again.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  async function handleStatusChange(newStatus: string) {
    if (newStatus === currentStatus || updatingStatus) return
    setUpdatingStatus(true)
    try {
      const res = await fetch(`/api/applications/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) return
      setCurrentStatus(newStatus)
      // Refresh timeline
      const tlRes = await fetch(`/api/applications/${id}/timeline`)
      if (tlRes.ok) {
        const tlData = await tlRes.json()
        setTimeline(tlData.data ?? [])
      }
    } finally {
      setUpdatingStatus(false)
    }
  }

  async function handleSaveNote() {
    if (!noteDraft.trim() || savingNote) return
    setSavingNote(true)
    try {
      const res = await fetch(`/api/applications/${id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: noteDraft.trim() }),
      })
      if (!res.ok) return
      const data = await res.json()
      setNotes(prev => [data.data, ...prev])
      setNoteDraft('')
      // Refresh timeline
      const tlRes = await fetch(`/api/applications/${id}/timeline`)
      if (tlRes.ok) {
        const tlData = await tlRes.json()
        setTimeline(tlData.data ?? [])
      }
    } finally {
      setSavingNote(false)
    }
  }

  if (loading) {
    return (
      <>
        <SiteHeader />
        <div style={{ padding: '80px 24px', textAlign: 'center', color: 'var(--ink-muted)' }}>
          Loading candidate…
        </div>
      </>
    )
  }

  if (error || !app) {
    return (
      <>
        <SiteHeader />
        <div style={{ padding: '80px 24px', textAlign: 'center' }}>
          <p style={{ color: 'var(--coral)', marginBottom: '16px' }}>{error ?? 'Application not found'}</p>
          <button className="btn btn-ghost" onClick={() => router.back()}>Go back</button>
        </div>
      </>
    )
  }

  const seeker = app.seeker
  const name = seeker.fullName ?? seeker.user.name ?? seeker.user.email
  const statusMeta = STATUS_META[currentStatus] ?? STATUS_META.applied
  const recMeta = app.aiRecommendation ? RECOMMENDATION_META[app.aiRecommendation] : null
  const score = app.aiMatchScore

  return (
    <>
      <SiteHeader />

      {/* ── Hero bar ──────────────────────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(145deg, #08124f 0%, #10216b 45%, #1B3DE0 100%)',
        padding: '28px clamp(16px, 4vw, 48px)',
        color: '#fff',
      }}>
        {/* Breadcrumb */}
        <div style={{ marginBottom: '16px', display: 'flex', gap: '6px', alignItems: 'center', fontSize: '0.8rem', opacity: 0.75 }}>
          <a href={`/employer/jobs/${slug}`} style={{ color: 'inherit', textDecoration: 'none' }}>
            ← {app.job.title}
          </a>
          <span>/</span>
          <span>{name}</span>
        </div>

        <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          {/* Avatar */}
          <div style={{
            width: '64px', height: '64px', borderRadius: '50%', flexShrink: 0,
            background: 'rgba(255,255,255,0.15)', border: '2px solid rgba(255,255,255,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.5rem', fontWeight: 700, color: '#fff',
            overflow: 'hidden',
          }}>
            {seeker.avatarUrl
              ? <img src={seeker.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : name.charAt(0).toUpperCase()
            }
          </div>

          {/* Name + headline + badges */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '4px' }}>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff', margin: 0 }}>{name}</h1>
              {recMeta && (
                <span style={{ fontSize: '0.75rem', padding: '2px 10px', borderRadius: '999px', background: recMeta.bg, color: recMeta.color, fontWeight: 600 }}>
                  {recMeta.label}
                </span>
              )}
              <span style={{ fontSize: '0.75rem', padding: '2px 10px', borderRadius: '999px', background: statusMeta.bg, color: statusMeta.color, fontWeight: 600 }}>
                {statusMeta.label}
              </span>
            </div>
            {seeker.headline && (
              <p style={{ fontSize: '0.92rem', color: 'rgba(255,255,255,0.8)', margin: '0 0 6px' }}>{seeker.headline}</p>
            )}
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '0.8rem', color: 'rgba(255,255,255,0.65)' }}>
              {seeker.location && <span>📍 {seeker.location}</span>}
              <span>Applied {formatDate(app.createdAt)}</span>
              <span>{seeker.user.email}</span>
            </div>
          </div>

          {/* AI score ring */}
          {score != null && (
            <div style={{
              width: '72px', height: '72px', borderRadius: '50%', flexShrink: 0,
              background: scoreRing(score), border: `3px solid ${scoreColor(score)}`,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontSize: '1.35rem', fontWeight: 800, color: scoreColor(score), lineHeight: 1 }}>{score}</span>
              <span style={{ fontSize: '0.55rem', color: scoreColor(score), fontWeight: 600, letterSpacing: '0.04em' }}>MATCH</span>
            </div>
          )}

          {/* CV link */}
          {seeker.cvUrl && (
            <a
              href={`/api/cv/${seeker.id}`}
              target="_blank"
              rel="noreferrer"
              className="btn btn-ghost"
              style={{ color: '#fff', border: '1px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.08)', alignSelf: 'center' }}
            >
              View CV
            </a>
          )}
        </div>
      </div>

      {/* ── Body ─────────────────────────────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '300px 1fr 300px',
        gap: '0',
        minHeight: 'calc(100vh - 200px)',
        background: 'var(--surface)',
      }}>

        {/* ── Left sidebar ─────────────────────────────────────────────── */}
        <div style={{ borderRight: '1px solid var(--border)', padding: '24px 20px', background: '#fff', overflowY: 'auto' }}>

          {/* Skills */}
          {seeker.skills.length > 0 && (
            <section style={{ marginBottom: '28px' }}>
              <h3 style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ink-muted)', marginBottom: '10px' }}>
                Skills
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {seeker.skills.map(skill => (
                  <span key={skill} className="badge" style={{ fontSize: '0.77rem' }}>{skill}</span>
                ))}
              </div>
            </section>
          )}

          {/* Languages */}
          {seeker.languages?.length > 0 && (
            <section style={{ marginBottom: '28px' }}>
              <h3 style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ink-muted)', marginBottom: '10px' }}>
                Languages
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {seeker.languages.map((l, i) => (
                  <div key={i} style={{ fontSize: '0.85rem', color: 'var(--ink)' }}>
                    {l.language}{l.proficiency ? <span style={{ color: 'var(--ink-muted)', marginLeft: '6px' }}>· {l.proficiency}</span> : null}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Education */}
          {seeker.educations.length > 0 && (
            <section style={{ marginBottom: '28px' }}>
              <h3 style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ink-muted)', marginBottom: '10px' }}>
                Education
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {seeker.educations.map(edu => (
                  <div key={edu.id}>
                    <p style={{ fontSize: '0.88rem', fontWeight: 600, margin: '0 0 2px', color: 'var(--ink)' }}>
                      {edu.institution}
                    </p>
                    {(edu.degree || edu.field) && (
                      <p style={{ fontSize: '0.8rem', margin: '0 0 2px', color: 'var(--ink-soft)' }}>
                        {[edu.degree, edu.field].filter(Boolean).join(' · ')}
                      </p>
                    )}
                    <p style={{ fontSize: '0.75rem', color: 'var(--ink-muted)', margin: 0 }}>
                      {formatYear(edu.startYear)} — {formatYear(edu.endYear)}
                      {edu.grade ? ` · ${edu.grade}` : ''}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Portfolio links */}
          {seeker.portfolioLinks?.length > 0 && (
            <section style={{ marginBottom: '28px' }}>
              <h3 style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ink-muted)', marginBottom: '10px' }}>
                Portfolio / Links
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {seeker.portfolioLinks.map(link => (
                  <a key={link.id} href={link.url} target="_blank" rel="noreferrer" style={{ fontSize: '0.83rem', color: 'var(--royal)', textDecoration: 'none' }}>
                    {link.label ?? link.url}
                  </a>
                ))}
                {seeker.linkedinUrl && (
                  <a href={seeker.linkedinUrl} target="_blank" rel="noreferrer" style={{ fontSize: '0.83rem', color: 'var(--royal)', textDecoration: 'none' }}>
                    LinkedIn
                  </a>
                )}
              </div>
            </section>
          )}

          {/* Summary */}
          {seeker.summary && (
            <section>
              <h3 style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ink-muted)', marginBottom: '10px' }}>
                About
              </h3>
              <p style={{ fontSize: '0.84rem', color: 'var(--ink-soft)', lineHeight: 1.65, margin: 0 }}>{seeker.summary}</p>
            </section>
          )}
        </div>

        {/* ── Main content ─────────────────────────────────────────────── */}
        <div style={{ padding: '24px', overflowY: 'auto' }}>

          {/* Tab nav */}
          <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', borderBottom: '1px solid var(--border)', paddingBottom: '0' }}>
            {([['ai', 'AI Analysis'], ['experience', 'Experience'], ['cover', 'Cover Letter']] as const).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                style={{
                  padding: '8px 16px', background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: '0.88rem', fontWeight: activeTab === key ? 700 : 500,
                  color: activeTab === key ? 'var(--royal)' : 'var(--ink-muted)',
                  borderBottom: activeTab === key ? '2px solid var(--royal)' : '2px solid transparent',
                  marginBottom: '-1px',
                  transition: 'all 0.15s',
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* AI Analysis tab */}
          {activeTab === 'ai' && (
            <div className="animate-in">
              {/* Summary */}
              {app.aiSummary ? (
                <div className="card" style={{ marginBottom: '16px', padding: '20px' }}>
                  <h3 style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--ink-muted)', marginBottom: '10px' }}>
                    AI Summary
                  </h3>
                  <p style={{ fontSize: '0.9rem', color: 'var(--ink)', lineHeight: 1.7, margin: 0 }}>{app.aiSummary}</p>
                </div>
              ) : (
                <div className="card" style={{ marginBottom: '16px', padding: '20px', textAlign: 'center' }}>
                  <p style={{ color: 'var(--ink-muted)', fontSize: '0.88rem' }}>AI screening has not run yet.</p>
                </div>
              )}

              {/* Strengths + Gaps */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div className="card" style={{ padding: '20px' }}>
                  <h3 style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#16a34a', marginBottom: '12px' }}>
                    ✓ Strengths
                  </h3>
                  {app.aiStrengths && app.aiStrengths.length > 0 ? (
                    <ul style={{ margin: 0, paddingLeft: '16px', listStyle: 'none' }}>
                      {app.aiStrengths.map((s, i) => (
                        <li key={i} style={{ fontSize: '0.86rem', color: 'var(--ink)', marginBottom: '8px', lineHeight: 1.5, display: 'flex', gap: '8px' }}>
                          <span style={{ color: '#16a34a', flexShrink: 0 }}>✓</span>
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p style={{ color: 'var(--ink-muted)', fontSize: '0.85rem', margin: 0 }}>No data yet</p>
                  )}
                </div>

                <div className="card" style={{ padding: '20px' }}>
                  <h3 style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--coral)', marginBottom: '12px' }}>
                    ✗ Gaps
                  </h3>
                  {app.aiGaps && app.aiGaps.length > 0 ? (
                    <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                      {app.aiGaps.map((g, i) => (
                        <li key={i} style={{ fontSize: '0.86rem', color: 'var(--ink)', marginBottom: '8px', lineHeight: 1.5, display: 'flex', gap: '8px' }}>
                          <span style={{ color: 'var(--coral)', flexShrink: 0 }}>✗</span>
                          <span>{g}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p style={{ color: 'var(--ink-muted)', fontSize: '0.85rem', margin: 0 }}>No gaps identified</p>
                  )}
                </div>
              </div>

              {/* Certifications */}
              {seeker.certifications.length > 0 && (
                <div className="card" style={{ padding: '20px' }}>
                  <h3 style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--ink-muted)', marginBottom: '14px' }}>
                    Certifications
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {seeker.certifications.map(cert => {
                      const v = cert.validation
                      const vcColor = v?.status === 'validated' ? '#16a34a' : v?.status === 'review' ? '#d97706' : 'var(--ink-muted)'
                      const vcBg = v?.status === 'validated' ? '#dcfce7' : v?.status === 'review' ? '#fef3c7' : 'var(--surface)'
                      const vcLabel = v?.status === 'validated' ? '✓ Verified' : v?.status === 'review' ? '⟳ Under review' : '— Unverified'
                      return (
                        <div key={cert.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', padding: '12px', borderRadius: '10px', background: 'var(--surface)' }}>
                          <div>
                            <p style={{ fontSize: '0.88rem', fontWeight: 600, margin: '0 0 2px', color: 'var(--ink)' }}>
                              {cert.credentialUrl
                                ? <a href={cert.credentialUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--royal)', textDecoration: 'none' }}>{cert.name}</a>
                                : cert.name
                              }
                            </p>
                            <p style={{ fontSize: '0.78rem', color: 'var(--ink-muted)', margin: 0 }}>
                              {cert.issuer ?? ''}
                              {cert.issuedDate ? ` · ${formatDate(cert.issuedDate)}` : ''}
                              {cert.expiryDate ? ` · Expires ${formatDate(cert.expiryDate)}` : ''}
                            </p>
                          </div>
                          <span style={{ fontSize: '0.72rem', padding: '2px 10px', borderRadius: '999px', background: vcBg, color: vcColor, fontWeight: 600, flexShrink: 0, whiteSpace: 'nowrap' }}>
                            {vcLabel}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Experience tab */}
          {activeTab === 'experience' && (
            <div className="animate-in">
              {seeker.experiences.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {seeker.experiences.map(exp => (
                    <div key={exp.id} className="card" style={{ padding: '20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', marginBottom: '8px' }}>
                        <div>
                          <p style={{ fontSize: '0.97rem', fontWeight: 700, margin: '0 0 2px', color: 'var(--ink)' }}>{exp.title}</p>
                          <p style={{ fontSize: '0.85rem', color: 'var(--ink-soft)', margin: 0 }}>{exp.company}{exp.location ? ` · ${exp.location}` : ''}</p>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <p style={{ fontSize: '0.78rem', color: 'var(--ink-muted)', margin: 0 }}>
                            {exp.startDate ? formatDate(exp.startDate) : '?'} — {exp.isCurrent ? 'Present' : exp.endDate ? formatDate(exp.endDate) : '?'}
                          </p>
                          {exp.isCurrent && (
                            <span style={{ fontSize: '0.7rem', padding: '1px 8px', borderRadius: '999px', background: '#e0f2fe', color: '#0369a1', fontWeight: 600 }}>Current</span>
                          )}
                        </div>
                      </div>
                      {exp.description && (
                        <p style={{ fontSize: '0.85rem', color: 'var(--ink-soft)', lineHeight: 1.65, margin: 0 }}>{exp.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="card" style={{ padding: '32px', textAlign: 'center' }}>
                  <p style={{ color: 'var(--ink-muted)', fontSize: '0.88rem' }}>No experience listed on profile.</p>
                </div>
              )}
            </div>
          )}

          {/* Cover letter tab */}
          {activeTab === 'cover' && (
            <div className="animate-in">
              {app.coverLetter ? (
                <div className="card" style={{ padding: '24px' }}>
                  <h3 style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--ink-muted)', marginBottom: '14px' }}>
                    Cover Letter
                  </h3>
                  <p style={{ fontSize: '0.9rem', color: 'var(--ink)', lineHeight: 1.75, margin: 0, whiteSpace: 'pre-wrap' }}>
                    {app.coverLetter}
                  </p>
                </div>
              ) : (
                <div className="card" style={{ padding: '32px', textAlign: 'center' }}>
                  <p style={{ color: 'var(--ink-muted)', fontSize: '0.88rem' }}>No cover letter submitted.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Right panel ──────────────────────────────────────────────── */}
        <div style={{ borderLeft: '1px solid var(--border)', padding: '24px 20px', background: '#fff', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Status selector */}
          <div>
            <h3 style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ink-muted)', marginBottom: '10px' }}>
              Application status
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {STATUS_OPTIONS.map(st => {
                const meta = STATUS_META[st]
                const isActive = st === currentStatus
                return (
                  <button
                    key={st}
                    onClick={() => handleStatusChange(st)}
                    disabled={updatingStatus}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: isActive ? `1.5px solid ${meta.color}` : '1.5px solid transparent',
                      background: isActive ? meta.bg : 'transparent',
                      color: isActive ? meta.color : 'var(--ink-soft)',
                      fontWeight: isActive ? 700 : 500,
                      fontSize: '0.83rem',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s',
                    }}
                  >
                    {meta.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Timeline / Notes tabs */}
          <div>
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: '14px' }}>
              {(['timeline', 'notes'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setRightTab(tab)}
                  style={{
                    flex: 1, padding: '8px 0', background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: '0.82rem', fontWeight: rightTab === tab ? 700 : 500,
                    color: rightTab === tab ? 'var(--royal)' : 'var(--ink-muted)',
                    borderBottom: rightTab === tab ? '2px solid var(--royal)' : '2px solid transparent',
                    marginBottom: '-1px',
                    textTransform: 'capitalize',
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Timeline */}
            {rightTab === 'timeline' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                {timeline.length === 0 ? (
                  <p style={{ fontSize: '0.83rem', color: 'var(--ink-muted)', textAlign: 'center', padding: '16px 0' }}>No activity yet.</p>
                ) : (
                  timeline.map((event, i) => (
                    <div key={event.id} style={{ display: 'flex', gap: '10px', paddingBottom: '16px', position: 'relative' }}>
                      {/* Connector line */}
                      {i < timeline.length - 1 && (
                        <div style={{ position: 'absolute', left: '11px', top: '22px', width: '1px', bottom: 0, background: 'var(--border)' }} />
                      )}
                      {/* Icon dot */}
                      <div style={{
                        width: '22px', height: '22px', borderRadius: '50%', flexShrink: 0,
                        background: event.eventType.startsWith('ai.') ? '#f3e8ff' : event.eventType === 'status.changed' ? 'var(--royal-pale)' : 'var(--surface)',
                        border: '1px solid var(--border)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.65rem', color: 'var(--ink-soft)',
                        position: 'relative', zIndex: 1,
                      }}>
                        {timelineIcon(event.eventType)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: '0.82rem', color: 'var(--ink)', margin: '0 0 2px', lineHeight: 1.45 }}>
                          {timelineLabel(event)}
                        </p>
                        <p style={{ fontSize: '0.72rem', color: 'var(--ink-muted)', margin: 0 }}>
                          {event.actor?.name ?? 'System'} · {formatDate(event.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Notes */}
            {rightTab === 'notes' && (
              <div>
                {/* Note input */}
                <textarea
                  value={noteDraft}
                  onChange={e => setNoteDraft(e.target.value)}
                  placeholder="Add a note about this candidate…"
                  rows={3}
                  style={{
                    width: '100%', boxSizing: 'border-box', padding: '10px 12px',
                    border: '1.5px solid var(--border)', borderRadius: '8px',
                    fontSize: '0.84rem', color: 'var(--ink)', resize: 'vertical',
                    fontFamily: 'inherit', lineHeight: 1.5,
                    outline: 'none', marginBottom: '8px',
                  }}
                />
                <button
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '8px', fontSize: '0.84rem' }}
                  onClick={handleSaveNote}
                  disabled={savingNote || !noteDraft.trim()}
                >
                  {savingNote ? 'Saving…' : 'Add note'}
                </button>

                {/* Notes list */}
                <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {notes.length === 0 ? (
                    <p style={{ fontSize: '0.83rem', color: 'var(--ink-muted)', textAlign: 'center', padding: '12px 0' }}>No notes yet.</p>
                  ) : (
                    notes.map(note => (
                      <div key={note.id} style={{ padding: '12px 14px', borderRadius: '10px', background: 'var(--surface)', border: '1px solid var(--border)' }}>
                        <p style={{ fontSize: '0.85rem', color: 'var(--ink)', lineHeight: 1.6, margin: '0 0 6px' }}>{note.body}</p>
                        <p style={{ fontSize: '0.72rem', color: 'var(--ink-muted)', margin: 0 }}>
                          {note.author?.name ?? 'You'} · {formatDate(note.createdAt)}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
