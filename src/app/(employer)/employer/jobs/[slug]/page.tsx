'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { SiteHeader } from '@/components/navigation/SiteHeader'

// ── Types ─────────────────────────────────────────────────────────────────────

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
  seeker: {
    fullName?: string | null
    headline?: string | null
    avatarUrl?: string | null
    certifications?: Array<{
      id: string
      name: string
      issuer?: string | null
      validation?: { status: 'validated' | 'review' | 'unverified'; score: number }
    }>
    user: { email: string }
  }
}

interface ApplicationNote {
  id: string
  body: string
  createdAt: string
}

interface Job {
  id: string
  title: string
  status: string
  slug: string
  jobType: string
  workMode: string
  location?: string | null
  createdAt: string
  applications?: Application[]
}

// ── Constants ─────────────────────────────────────────────────────────────────

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
  shortlist: { label: 'AI says shortlist', bg: '#dcfce7', color: '#166534' },
  review:    { label: 'AI says review',    bg: '#fef3c7', color: '#92400e' },
  pass:      { label: 'AI says pass',      bg: '#fee2e2', color: '#b91c1c' },
}

// Hiring view presets
type HiringView = 'all' | 'high_match' | 'verified_certs' | 'needs_review' | 'interview_ready'

const HIRING_VIEWS: Array<{ id: HiringView; label: string; color: string; bg: string }> = [
  { id: 'all',           label: 'All applicants',  color: 'var(--ink)',    bg: 'var(--surface)' },
  { id: 'high_match',    label: '✦ High match',    color: '#166534',       bg: '#dcfce7' },
  { id: 'verified_certs', label: '✓ Verified certs', color: '#0f766e',    bg: '#eefbf4' },
  { id: 'needs_review',  label: '◐ Needs review',  color: '#92400e',      bg: '#fef3c7' },
  { id: 'interview_ready', label: '▶ Interview ready', color: '#0369a1', bg: '#e0f2fe' },
]

function applyHiringView(applications: Application[], view: HiringView): Application[] {
  switch (view) {
    case 'high_match':
      return applications.filter(a => (a.aiMatchScore ?? 0) >= 75)
    case 'verified_certs':
      return applications.filter(a =>
        (a.seeker.certifications ?? []).some(c => c.validation?.status === 'validated')
      )
    case 'needs_review': {
      const score = (a: Application) => a.aiMatchScore ?? 0
      return applications.filter(a => score(a) >= 55 && score(a) < 75)
    }
    case 'interview_ready':
      return applications.filter(a => ['shortlisted', 'interview'].includes(a.status))
    default:
      return applications
  }
}

function scoreColor(score: number) {
  if (score >= 75) return '#16a34a'
  if (score >= 55) return '#d97706'
  return 'var(--coral)'
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// ── Compare Modal ─────────────────────────────────────────────────────────────

function CompareModal({
  applications,
  onClose,
}: {
  applications: Application[]
  onClose: () => void
}) {
  const rows: Array<{ label: string; render: (a: Application) => React.ReactNode }> = [
    {
      label: 'AI Match Score',
      render: a => a.aiMatchScore != null
        ? <span style={{ fontSize: '1.5rem', fontWeight: 800, color: scoreColor(a.aiMatchScore) }}>{a.aiMatchScore}</span>
        : <span style={{ color: 'var(--ink-muted)' }}>—</span>,
    },
    {
      label: 'AI Recommendation',
      render: a => {
        const rec = a.aiRecommendation ? RECOMMENDATION_META[a.aiRecommendation] : null
        return rec
          ? <span style={{ padding: '2px 10px', borderRadius: '999px', fontSize: '0.78rem', fontWeight: 600, background: rec.bg, color: rec.color }}>{rec.label}</span>
          : <span style={{ color: 'var(--ink-muted)' }}>No data</span>
      },
    },
    {
      label: 'Status',
      render: a => {
        const meta = STATUS_META[a.status] ?? STATUS_META.applied
        return <span style={{ padding: '2px 10px', borderRadius: '999px', fontSize: '0.78rem', fontWeight: 600, background: meta.bg, color: meta.color }}>{meta.label}</span>
      },
    },
    {
      label: 'AI Summary',
      render: a => a.aiSummary
        ? <p style={{ fontSize: '0.82rem', color: 'var(--ink)', lineHeight: 1.55, margin: 0 }}>{a.aiSummary}</p>
        : <span style={{ color: 'var(--ink-muted)', fontSize: '0.82rem' }}>Not yet screened</span>,
    },
    {
      label: 'Strengths',
      render: a => (a.aiStrengths?.length ?? 0) > 0
        ? <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {a.aiStrengths!.map((s, i) => (
              <li key={i} style={{ fontSize: '0.8rem', color: '#166534', display: 'flex', gap: '6px' }}>
                <span>✓</span><span>{s}</span>
              </li>
            ))}
          </ul>
        : <span style={{ color: 'var(--ink-muted)', fontSize: '0.82rem' }}>—</span>,
    },
    {
      label: 'Gaps',
      render: a => (a.aiGaps?.length ?? 0) > 0
        ? <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {a.aiGaps!.map((g, i) => (
              <li key={i} style={{ fontSize: '0.8rem', color: 'var(--coral)', display: 'flex', gap: '6px' }}>
                <span>✗</span><span>{g}</span>
              </li>
            ))}
          </ul>
        : <span style={{ color: 'var(--ink-muted)', fontSize: '0.82rem' }}>None identified</span>,
    },
    {
      label: 'Verified Certs',
      render: a => {
        const verified = (a.seeker.certifications ?? []).filter(c => c.validation?.status === 'validated')
        return verified.length > 0
          ? <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {verified.map(c => (
                <li key={c.id} style={{ fontSize: '0.8rem', color: '#0f766e', display: 'flex', gap: '6px' }}>
                  <span>✓</span><span>{c.name}</span>
                </li>
              ))}
            </ul>
          : <span style={{ fontSize: '0.82rem', color: 'var(--ink-muted)' }}>None</span>
      },
    },
  ]

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}
      onClick={onClose}
    >
      {/* Backdrop */}
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(8, 18, 79, 0.55)', backdropFilter: 'blur(4px)' }} />

      {/* Modal */}
      <div
        style={{
          position: 'relative', zIndex: 1, background: '#fff', borderRadius: '24px',
          boxShadow: '0 32px 100px rgba(0,0,0,0.28)', maxWidth: '900px', width: '100%',
          maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Modal header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>Compare candidates</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.3rem', cursor: 'pointer', color: 'var(--ink-muted)', lineHeight: 1 }}>✕</button>
        </div>

        {/* Candidate name headers */}
        <div style={{ display: 'grid', gridTemplateColumns: `180px repeat(${applications.length}, 1fr)`, gap: 0, borderBottom: '1px solid var(--border)' }}>
          <div style={{ padding: '14px 16px' }} />
          {applications.map(a => (
            <div key={a.id} style={{ padding: '14px 16px', borderLeft: '1px solid var(--border)' }}>
              <p style={{ fontWeight: 700, fontSize: '0.92rem', margin: '0 0 2px', color: 'var(--ink)' }}>
                {a.seeker.fullName ?? a.seeker.user.email}
              </p>
              {a.seeker.headline && (
                <p style={{ fontSize: '0.78rem', color: 'var(--ink-muted)', margin: 0 }}>{a.seeker.headline}</p>
              )}
            </div>
          ))}
        </div>

        {/* Comparison rows */}
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {rows.map(row => (
            <div
              key={row.label}
              style={{ display: 'grid', gridTemplateColumns: `180px repeat(${applications.length}, 1fr)`, borderBottom: '1px solid var(--border)' }}
            >
              <div style={{ padding: '14px 16px', background: 'var(--surface)' }}>
                <p style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-muted)', margin: 0 }}>{row.label}</p>
              </div>
              {applications.map(a => (
                <div key={a.id} style={{ padding: '14px 16px', borderLeft: '1px solid var(--border)', verticalAlign: 'top' }}>
                  {row.render(a)}
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Modal footer */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onClose} className="btn btn-ghost">Close</button>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function EmployerJobDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const [job, setJob] = useState<Job | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [statusFilter, setStatusFilter] = useState('')
  const [hiringView, setHiringView] = useState<HiringView>('all')

  // Shortlist comparison
  const [compareIds, setCompareIds] = useState<Set<string>>(new Set())
  const [showCompare, setShowCompare] = useState(false)

  // Inline notes
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [notesByApplication, setNotesByApplication] = useState<Record<string, ApplicationNote[]>>({})
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({})
  const [savingNoteId, setSavingNoteId] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      fetch(`/api/jobs/${slug}`).then(r => r.json()),
      fetch(`/api/jobs/${slug}/applications`).then(r => r.json()),
    ])
      .then(([jobData, appData]) => {
        if (jobData.data) {
          const applications = (appData.data ?? []).sort(
            (left: Application, right: Application) =>
              (right.aiMatchScore ?? -1) - (left.aiMatchScore ?? -1) ||
              new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
          )
          setJob({ ...jobData.data, applications })
        } else {
          setError('Job not found')
        }
        setLoading(false)
      })
      .catch(() => {
        setError('Failed to load job')
        setLoading(false)
      })
  }, [slug])

  async function updateStatus(applicationId: string, newStatus: string) {
    setUpdatingId(applicationId)
    const res = await fetch(`/api/applications/${applicationId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    if (res.ok && job) {
      setJob({
        ...job,
        applications: job.applications?.map(a =>
          a.id === applicationId ? { ...a, status: newStatus } : a,
        ),
      })
    }
    setUpdatingId(null)
  }

  async function loadNotes(applicationId: string) {
    if (notesByApplication[applicationId]) return
    const res = await fetch(`/api/applications/${applicationId}/notes`)
    const data = await res.json()
    if (res.ok) {
      setNotesByApplication(current => ({ ...current, [applicationId]: data.data ?? [] }))
    }
  }

  async function saveNote(applicationId: string) {
    const body = noteDrafts[applicationId]?.trim()
    if (!body) return
    setSavingNoteId(applicationId)
    const res = await fetch(`/api/applications/${applicationId}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body }),
    })
    const data = await res.json()
    if (res.ok) {
      setNotesByApplication(current => ({
        ...current,
        [applicationId]: [data.data, ...(current[applicationId] ?? [])],
      }))
      setNoteDrafts(current => ({ ...current, [applicationId]: '' }))
    }
    setSavingNoteId(null)
  }

  function toggleCompare(id: string) {
    setCompareIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else if (next.size < 3) {
        next.add(id)
      }
      return next
    })
  }

  const applications = job?.applications ?? []

  // Apply hiring view first, then status filter
  const viewFiltered = applyHiringView(applications, hiringView)
  const filtered = statusFilter
    ? viewFiltered.filter(a => a.status === statusFilter)
    : viewFiltered

  const compareApps = applications.filter(a => compareIds.has(a.id))

  const summary = useMemo(() => {
    const shortlistReady = applications.filter(a => (a.aiMatchScore ?? 0) >= 75).length
    const needsReview = applications.filter(a => {
      const score = a.aiMatchScore ?? 0
      return score >= 55 && score < 75
    }).length
    const verifiedCertificates = applications.reduce(
      (count, a) =>
        count + (a.seeker.certifications ?? []).filter(c => c.validation?.status === 'validated').length,
      0,
    )
    return {
      total: applications.length,
      shortlistReady,
      needsReview,
      verifiedCertificates,
      avgScore: applications.length > 0
        ? Math.round(applications.reduce((sum, a) => sum + (a.aiMatchScore ?? 0), 0) / applications.length)
        : 0,
    }
  }, [applications])

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--ink-muted)' }}>Loading...</p>
      </div>
    )
  }

  if (error || !job) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
        <p style={{ color: 'var(--coral)' }}>{error ?? 'Job not found'}</p>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #eef2ff 0%, #f6f8ff 32%, #ffffff 100%)' }}>
      <SiteHeader role="employer" theme="dark" current="/employer/jobs" subtitle="Employer workspace" />

      <div className="container" style={{ padding: '28px 1.5rem 80px' }}>

        {/* Hero */}
        <section className="card" style={{ padding: '28px', borderRadius: '26px', background: 'linear-gradient(145deg, #07114c 0%, #0d1a66 38%, #1432b2 100%)', color: '#fff', borderColor: 'rgba(255,255,255,0.08)', marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <div>
              <p style={{ fontSize: '0.78rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.72)', marginBottom: '8px' }}>
                Applicant review
              </p>
              <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3.2rem)', color: '#fff', marginBottom: '8px' }}>{job.title}</h1>
              <p style={{ color: 'rgba(255,255,255,0.8)', maxWidth: '58ch' }}>
                Review ranked applicants, scan verified certifications, and move strong candidates forward faster.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <a href="/employer/jobs" className="btn" style={{ background: '#fff', color: 'var(--royal-deep)' }}>Back to jobs</a>
              <a href={`/jobs/${job.slug}`} className="btn" style={{ background: 'rgba(255,255,255,0.12)', color: '#fff', border: '1px solid rgba(255,255,255,0.16)' }}>View public job</a>
            </div>
          </div>
        </section>

        {/* Summary stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '20px' }}>
          {[
            { label: 'Applicants',       value: summary.total,               tone: 'var(--royal-pale)', color: 'var(--royal)' },
            { label: 'Shortlist ready',  value: summary.shortlistReady,      tone: '#dcfce7',           color: '#166534' },
            { label: 'Needs review',     value: summary.needsReview,         tone: '#fef3c7',           color: '#92400e' },
            { label: 'Avg. AI score',    value: summary.avgScore,            tone: '#f3e8ff',           color: '#7c3aed' },
            { label: 'Verified certs',   value: summary.verifiedCertificates, tone: '#eefbf4',          color: '#0f766e' },
          ].map(item => (
            <div key={item.label} className="card" style={{ padding: '20px', borderRadius: '22px' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: item.tone, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '1.1rem', fontWeight: 800, color: item.color }}>{item.value}</span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--ink-muted)', margin: 0 }}>{item.label}</p>
            </div>
          ))}
        </div>

        {/* ── Hiring view preset pills ──────────────────────────────────────── */}
        <div style={{ marginBottom: '12px' }}>
          <p style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ink-muted)', marginBottom: '8px' }}>
            Hiring views
          </p>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {HIRING_VIEWS.map(view => (
              <button
                key={view.id}
                onClick={() => { setHiringView(view.id); setStatusFilter('') }}
                style={{
                  padding: '6px 16px', borderRadius: '999px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600,
                  background: hiringView === view.id ? view.bg : 'var(--surface)',
                  color: hiringView === view.id ? view.color : 'var(--ink-muted)',
                  border: hiringView === view.id ? `1.5px solid ${view.color}` : '1.5px solid var(--border)',
                  transition: 'all 0.15s',
                }}
              >
                {view.label}
                {view.id !== 'all' && (
                  <span style={{ marginLeft: '6px', opacity: 0.7 }}>
                    ({applyHiringView(applications, view.id).length})
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ── Status filter pills ───────────────────────────────────────────── */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
          <button
            onClick={() => setStatusFilter('')}
            style={{
              padding: '5px 14px', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
              background: !statusFilter ? 'var(--royal)' : 'var(--surface)',
              color: !statusFilter ? '#fff' : 'var(--ink-muted)',
              border: !statusFilter ? '1.5px solid var(--royal)' : '1.5px solid var(--border)',
            }}
          >
            All statuses
          </button>
          {Object.entries(STATUS_META).map(([key, meta]) => (
            <button
              key={key}
              onClick={() => setStatusFilter(statusFilter === key ? '' : key)}
              style={{
                padding: '5px 14px', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
                background: statusFilter === key ? meta.bg : 'var(--surface)',
                color: statusFilter === key ? meta.color : 'var(--ink-muted)',
                border: statusFilter === key ? `1.5px solid ${meta.color}` : '1.5px solid var(--border)',
              }}
            >
              {meta.label}
            </button>
          ))}
        </div>

        {/* ── Compare bar hint ─────────────────────────────────────────────── */}
        {compareIds.size > 0 && (
          <div style={{
            background: 'var(--royal-pale)', border: '1.5px solid var(--royal)', borderRadius: '12px',
            padding: '12px 18px', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap',
          }}>
            <p style={{ fontSize: '0.88rem', color: 'var(--royal)', fontWeight: 600, margin: 0 }}>
              {compareIds.size} candidate{compareIds.size > 1 ? 's' : ''} selected for comparison {compareIds.size < 2 ? '— select at least 2' : ''}
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn-ghost" style={{ fontSize: '0.82rem', padding: '6px 14px' }} onClick={() => setCompareIds(new Set())}>
                Clear
              </button>
              {compareIds.size >= 2 && (
                <button className="btn btn-primary" style={{ fontSize: '0.82rem', padding: '6px 14px' }} onClick={() => setShowCompare(true)}>
                  Compare side by side →
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── Results count ─────────────────────────────────────────────────── */}
        <p style={{ fontSize: '0.83rem', color: 'var(--ink-muted)', marginBottom: '12px' }}>
          {filtered.length} applicant{filtered.length !== 1 ? 's' : ''}
          {hiringView !== 'all' ? ` in "${HIRING_VIEWS.find(v => v.id === hiringView)?.label}"` : ''}
          {statusFilter ? ` · ${STATUS_META[statusFilter]?.label}` : ''}
        </p>

        {/* ── Applicant cards ───────────────────────────────────────────────── */}
        {filtered.length === 0 ? (
          <div className="card" style={{ padding: '48px', textAlign: 'center' }}>
            <p style={{ color: 'var(--ink-muted)' }}>No applicants match this view.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filtered.map(application => {
              const isExpanded = expandedId === application.id
              const isUpdating = updatingId === application.id
              const statusMeta = STATUS_META[application.status] ?? STATUS_META.applied
              const recMeta = application.aiRecommendation ? RECOMMENDATION_META[application.aiRecommendation] : null
              const score = application.aiMatchScore
              const verifiedCerts = (application.seeker.certifications ?? []).filter(c => c.validation?.status === 'validated')
              const isCompared = compareIds.has(application.id)

              return (
                <div
                  key={application.id}
                  className="card animate-in"
                  style={{
                    borderRadius: '20px', overflow: 'hidden',
                    border: isCompared ? '2px solid var(--royal)' : '1px solid var(--border)',
                    transition: 'border-color 0.15s',
                  }}
                >
                  {/* Card header row */}
                  <div style={{ padding: '20px 24px', display: 'flex', gap: '16px', alignItems: 'flex-start' }}>

                    {/* Compare checkbox */}
                    <div style={{ paddingTop: '2px' }}>
                      <input
                        type="checkbox"
                        checked={isCompared}
                        onChange={() => toggleCompare(application.id)}
                        disabled={!isCompared && compareIds.size >= 3}
                        title={compareIds.size >= 3 && !isCompared ? 'Max 3 candidates' : 'Add to comparison'}
                        style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: 'var(--royal)' }}
                      />
                    </div>

                    {/* Avatar */}
                    <div style={{
                      width: '48px', height: '48px', borderRadius: '50%', flexShrink: 0,
                      background: 'var(--royal-pale)', border: '2px solid var(--border)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '1.1rem', fontWeight: 700, color: 'var(--royal)',
                      overflow: 'hidden',
                    }}>
                      {application.seeker.avatarUrl
                        ? <img src={application.seeker.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : (application.seeker.fullName ?? application.seeker.user.email).charAt(0).toUpperCase()
                      }
                    </div>

                    {/* Name + meta */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '4px' }}>
                        <a
                          href={`/employer/jobs/${slug}/applicants/${application.id}`}
                          style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--ink)', textDecoration: 'none' }}
                        >
                          {application.seeker.fullName ?? application.seeker.user.email}
                        </a>
                        {recMeta && (
                          <span style={{ fontSize: '0.72rem', padding: '2px 10px', borderRadius: '999px', background: recMeta.bg, color: recMeta.color, fontWeight: 600 }}>
                            {recMeta.label}
                          </span>
                        )}
                        {verifiedCerts.length > 0 && (
                          <span style={{ fontSize: '0.72rem', padding: '2px 10px', borderRadius: '999px', background: '#eefbf4', color: '#0f766e', fontWeight: 600 }}>
                            ✓ {verifiedCerts.length} verified cert{verifiedCerts.length > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: '0.83rem', color: 'var(--ink-muted)', margin: '0 0 6px' }}>
                        {application.seeker.headline ?? application.seeker.user.email}
                      </p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--ink-muted)', margin: 0 }}>
                        Applied {formatDate(application.createdAt)}
                      </p>
                    </div>

                    {/* Score */}
                    {score != null && (
                      <div style={{
                        width: '56px', height: '56px', borderRadius: '50%', flexShrink: 0,
                        background: score >= 75 ? '#dcfce7' : score >= 55 ? '#fef3c7' : '#fee2e2',
                        border: `2px solid ${scoreColor(score)}`,
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <span style={{ fontSize: '1.1rem', fontWeight: 800, color: scoreColor(score), lineHeight: 1 }}>{score}</span>
                        <span style={{ fontSize: '0.5rem', color: scoreColor(score), fontWeight: 600, letterSpacing: '0.04em' }}>MATCH</span>
                      </div>
                    )}

                    {/* Status + expand */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end', flexShrink: 0 }}>
                      <span style={{ fontSize: '0.75rem', padding: '3px 12px', borderRadius: '999px', background: statusMeta.bg, color: statusMeta.color, fontWeight: 600, whiteSpace: 'nowrap' }}>
                        {statusMeta.label}
                      </span>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <a
                          href={`/employer/jobs/${slug}/applicants/${application.id}`}
                          className="btn btn-ghost"
                          style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                        >
                          Full profile →
                        </a>
                        <button
                          onClick={() => {
                            const next = isExpanded ? null : application.id
                            setExpandedId(next)
                            if (next) loadNotes(next)
                          }}
                          className="btn btn-ghost"
                          style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                        >
                          {isExpanded ? 'Collapse' : 'Details'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* AI summary snippet (always visible) */}
                  {application.aiSummary && !isExpanded && (
                    <div style={{ paddingLeft: '108px', paddingRight: '24px', paddingBottom: '16px' }}>
                      <p style={{ fontSize: '0.83rem', color: 'var(--ink-soft)', lineHeight: 1.55, margin: 0 }}>
                        {application.aiSummary.slice(0, 180)}{application.aiSummary.length > 180 ? '…' : ''}
                      </p>
                    </div>
                  )}

                  {/* Expanded details */}
                  {isExpanded && (
                    <div style={{ borderTop: '1px solid var(--border)', padding: '20px 24px', background: 'var(--surface)', display: 'flex', flexDirection: 'column', gap: '20px' }}>

                      {/* AI analysis */}
                      {(application.aiSummary || (application.aiStrengths?.length ?? 0) > 0 || (application.aiGaps?.length ?? 0) > 0) && (
                        <div>
                          <p style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--ink-muted)', marginBottom: '10px' }}>AI Analysis</p>
                          {application.aiSummary && (
                            <p style={{ fontSize: '0.88rem', color: 'var(--ink)', lineHeight: 1.6, marginBottom: '12px' }}>{application.aiSummary}</p>
                          )}
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            {(application.aiStrengths?.length ?? 0) > 0 && (
                              <div style={{ padding: '12px 14px', borderRadius: '10px', background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                                <p style={{ fontSize: '0.72rem', fontWeight: 700, color: '#166534', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>Strengths</p>
                                {application.aiStrengths!.map((s, i) => (
                                  <p key={i} style={{ fontSize: '0.82rem', color: '#15803d', margin: '0 0 4px', display: 'flex', gap: '6px' }}>
                                    <span>✓</span><span>{s}</span>
                                  </p>
                                ))}
                              </div>
                            )}
                            {(application.aiGaps?.length ?? 0) > 0 && (
                              <div style={{ padding: '12px 14px', borderRadius: '10px', background: '#fff1f2', border: '1px solid #fecdd3' }}>
                                <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--coral)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>Gaps</p>
                                {application.aiGaps!.map((g, i) => (
                                  <p key={i} style={{ fontSize: '0.82rem', color: 'var(--coral)', margin: '0 0 4px', display: 'flex', gap: '6px' }}>
                                    <span>✗</span><span>{g}</span>
                                  </p>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Status change */}
                      <div>
                        <p style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--ink-muted)', marginBottom: '8px' }}>Move to status</p>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          {Object.entries(STATUS_META).map(([key, meta]) => (
                            <button
                              key={key}
                              onClick={() => updateStatus(application.id, key)}
                              disabled={isUpdating || application.status === key}
                              style={{
                                padding: '4px 12px', borderRadius: '999px', fontSize: '0.78rem', fontWeight: 600,
                                background: application.status === key ? meta.bg : 'var(--surface)',
                                color: application.status === key ? meta.color : 'var(--ink-muted)',
                                border: application.status === key ? `1.5px solid ${meta.color}` : '1.5px solid var(--border)',
                                cursor: application.status === key ? 'default' : 'pointer',
                                opacity: isUpdating ? 0.5 : 1,
                              }}
                            >
                              {meta.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Inline notes */}
                      <div>
                        <p style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--ink-muted)', marginBottom: '8px' }}>Notes</p>
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                          <textarea
                            rows={2}
                            placeholder="Add a note…"
                            value={noteDrafts[application.id] ?? ''}
                            onChange={e => setNoteDrafts(prev => ({ ...prev, [application.id]: e.target.value }))}
                            style={{ flex: 1, padding: '8px 10px', border: '1.5px solid var(--border)', borderRadius: '8px', fontSize: '0.84rem', resize: 'none', fontFamily: 'inherit' }}
                          />
                          <button
                            className="btn btn-primary"
                            style={{ alignSelf: 'flex-end', padding: '8px 16px', fontSize: '0.82rem' }}
                            onClick={() => saveNote(application.id)}
                            disabled={savingNoteId === application.id || !(noteDrafts[application.id]?.trim())}
                          >
                            {savingNoteId === application.id ? '…' : 'Save'}
                          </button>
                        </div>
                        {(notesByApplication[application.id] ?? []).length > 0 && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {(notesByApplication[application.id] ?? []).map(note => (
                              <div key={note.id} style={{ padding: '10px 14px', background: '#fff', borderRadius: '8px', border: '1px solid var(--border)' }}>
                                <p style={{ fontSize: '0.85rem', color: 'var(--ink)', margin: '0 0 4px', lineHeight: 1.5 }}>{note.body}</p>
                                <p style={{ fontSize: '0.72rem', color: 'var(--ink-muted)', margin: 0 }}>
                                  {new Date(note.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Floating compare bar ─────────────────────────────────────────── */}
      {compareIds.size > 0 && (
        <div style={{
          position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
          background: 'var(--royal-deep)', borderRadius: '999px', padding: '12px 20px',
          display: 'flex', alignItems: 'center', gap: '16px',
          boxShadow: '0 8px 32px rgba(8,18,79,0.35)', zIndex: 100,
          color: '#fff',
        }}>
          <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>
            {compareIds.size} / 3 selected
          </span>
          <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.25)' }} />
          {compareIds.size >= 2 ? (
            <button
              onClick={() => setShowCompare(true)}
              style={{ background: '#fff', color: 'var(--royal-deep)', border: 'none', borderRadius: '999px', padding: '6px 18px', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}
            >
              Compare →
            </button>
          ) : (
            <span style={{ fontSize: '0.8rem', opacity: 0.75 }}>Select {2 - compareIds.size} more</span>
          )}
          <button
            onClick={() => setCompareIds(new Set())}
            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.65)', fontSize: '1rem', cursor: 'pointer', padding: '0 4px' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* ── Compare modal ────────────────────────────────────────────────── */}
      {showCompare && compareApps.length >= 2 && (
        <CompareModal applications={compareApps} onClose={() => setShowCompare(false)} />
      )}
    </div>
  )
}
