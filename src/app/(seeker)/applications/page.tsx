'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { SiteHeader } from '@/components/navigation/SiteHeader'
import { PageHero, CoLogo } from '@/components/ui'

interface Application {
  id: string
  status: string
  createdAt: string
  aiMatchScore: number | null
  job: {
    id: string
    title: string
    slug: string
    jobType: string
    workMode: string
    location: string | null
    status: string
    company: { name: string; slug: string; logoUrl: string | null; isVerified: boolean }
  }
}

const STATUS_META: Record<string, { label: string; color: string; bg: string; badge: string; step: number }> = {
  applied:     { label: 'Applied',      color: '#2563EB', bg: 'var(--royal-pale)', badge: 'badge-royal', step: 1 },
  screening:   { label: 'Screening',    color: '#9333EA', bg: '#F5F3FF', badge: 'badge-violet', step: 2 },
  shortlisted: { label: 'Shortlisted',  color: '#15803D', bg: 'var(--green-pale)', badge: 'badge-sky', step: 3 },
  interview:   { label: 'Interview',    color: '#D97706', bg: 'var(--amber-pale)', badge: 'badge-cyan', step: 4 },
  assessment:  { label: 'Assessment',   color: '#EA580C', bg: '#FFF7ED', badge: 'badge-violet', step: 4 },
  offer:       { label: 'Offer',        color: '#15803D', bg: 'var(--green-pale)', badge: 'badge-green', step: 5 },
  hired:       { label: 'Hired 🎉',     color: '#15803D', bg: 'var(--green-pale)', badge: 'badge-green', step: 6 },
  rejected:    { label: 'Rejected',     color: '#DC2626', bg: 'var(--coral-pale)', badge: 'badge-coral', step: 0 },
  withdrawn:   { label: 'Withdrawn',    color: '#6B7280', bg: 'var(--surface)', badge: 'badge-surface', step: 0 },
}

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

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')

  useEffect(() => {
    setLoading(true)
    fetch('/api/applications')
      .then(r => r.json())
      .then(data => {
        let apps = data.data || []
        if (filter === 'active') {
          apps = apps.filter((a: Application) => !['rejected', 'withdrawn', 'hired'].includes(a.status))
        } else if (filter === 'closed') {
          apps = apps.filter((a: Application) => ['rejected', 'withdrawn', 'hired'].includes(a.status))
        }
        setApplications(apps)
        setTotal(data.meta?.total ?? data.data?.length ?? 0)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [filter])

  const active = applications.filter(a => !['rejected', 'withdrawn', 'hired'].includes(a.status))
  const closed = applications.filter(a => ['rejected', 'withdrawn', 'hired'].includes(a.status))
  const interviews = applications.filter(a => ['interview', 'assessment'].includes(a.status)).length
  const shortlisted = applications.filter(a => a.status === 'shortlisted').length

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface)' }}>
      <SiteHeader role="job_seeker" current="/applications" subtitle="Track your applications" />

      {/* Hero band */}
      <PageHero pad="34px 0 40px">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '24px', flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontSize: 'clamp(2rem,3.6vw,3.1rem)', fontWeight: 800, marginBottom: '8px', lineHeight: 1.1 }}>
              Track every <span style={{ fontFamily: 'var(--ff-serif)', fontStyle: 'italic', color: 'var(--gold-soft)' }}>application</span>
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.72)', fontSize: '0.95rem' }}>
              {total} application{total !== 1 ? 's' : ''} · {active.length} still active
            </p>
          </div>
          {/* Stat tiles */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ padding: '16px 20px', borderRadius: '14px', background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(8px)', border: '1.5px solid rgba(255,255,255,0.12)', minWidth: '140px', textAlign: 'center' }}>
              <p style={{ fontSize: '24px', fontWeight: 800, color: '#FFD34D', lineHeight: 1 }}>{interviews}</p>
              <p style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Interviews</p>
            </div>
            <div style={{ padding: '16px 20px', borderRadius: '14px', background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(8px)', border: '1.5px solid rgba(255,255,255,0.12)', minWidth: '140px', textAlign: 'center' }}>
              <p style={{ fontSize: '24px', fontWeight: 800, color: '#FFD34D', lineHeight: 1 }}>{shortlisted}</p>
              <p style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Shortlists</p>
            </div>
          </div>
        </div>
      </PageHero>

      <div className="app-wrap" style={{ padding: '32px 28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Filter chips */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button className={`chip ${filter === '' ? 'on' : ''}`} onClick={() => setFilter('')} style={{ pointerEvents: 'auto' }}>All</button>
          <button className={`chip ${filter === 'active' ? 'on' : ''}`} onClick={() => { /* handled in API fetch */ setFilter('active') }} style={{ pointerEvents: 'auto' }}>Active</button>
          <button className={`chip ${filter === 'closed' ? 'on' : ''}`} onClick={() => { /* handled in API fetch */ setFilter('closed') }} style={{ pointerEvents: 'auto' }}>Closed</button>
        </div>

        {loading ? (
          <p style={{ color: 'var(--ink-muted)', fontSize: '0.875rem' }}>Loading…</p>
        ) : applications.length === 0 ? (
          <div className="card" style={{ padding: '48px', textAlign: 'center' }}>
            <p style={{ color: 'var(--ink-soft)', fontSize: '1rem', marginBottom: '16px' }}>No applications yet</p>
            <Link href="/jobs" className="btn btn-primary">Browse jobs to apply</Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {applications.map(app => <AppCard key={app.id} app={app} />)}
          </div>
        )}
      </div>
    </div>
  )
}

function AppCard({ app }: { app: Application }) {
  const meta = STATUS_META[app.status] ?? { label: app.status, color: 'var(--ink)', bg: 'var(--surface)', badge: 'badge-surface', step: 0 }
  const isTerminal = ['rejected', 'withdrawn', 'hired'].includes(app.status)

  const stageLabels = ['Applied', 'Screening', 'Shortlist', 'Interview', 'Offer']

  return (
    <div className="card" style={{ padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Top row */}
      <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
        <CoLogo
          initial={app.job.company.name.charAt(0)}
          color={getCompanyColor(app.job.company.name)}
          size={46}
          radius={12}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <Link href={`/jobs/${app.job.slug}`} style={{ fontWeight: 700, fontSize: '15px', color: 'var(--ink)', textDecoration: 'none' }}>
            {app.job.title}
          </Link>
          <p style={{ fontSize: '13px', color: 'var(--ink-muted)', marginTop: '2px' }}>
            {app.job.company.name}
            {app.job.location && ` · ${app.job.location}`}
            <span style={{ marginLeft: '8px' }}>· Applied {new Date(app.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
          </p>
        </div>
        <div style={{ flexShrink: 0, textAlign: 'right' }}>
          <span className={`badge ${meta.badge}`} style={{ display: 'inline-block' }}>
            {meta.label}
          </span>
          {app.aiMatchScore != null && (
            <p style={{ fontSize: '13px', fontWeight: 800, color: 'var(--ink)', textAlign: 'right', marginTop: '4px' }}>
              {app.aiMatchScore}% match
            </p>
          )}
        </div>
      </div>

      {/* Stage track - hide for terminal states */}
      {!isTerminal && (
        <div style={{ marginLeft: '62px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0', paddingBottom: '8px' }}>
            {stageLabels.map((label, idx) => {
              const stepNum = idx + 1
              const isFilled = meta.step >= stepNum
              const isCurrent = meta.step === stepNum
              return (
                <div key={label} style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                  {/* Dot */}
                  <div
                    style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      background: isFilled ? 'var(--royal)' : '#E5E7EB',
                      position: 'relative',
                      zIndex: 2,
                      ...(isCurrent && { boxShadow: '0 0 0 4px rgba(27,61,224,.18)' })
                    }}
                  />
                  {/* Label */}
                  <span style={{ fontSize: '9.5px', fontWeight: 600, color: isFilled ? 'var(--royal)' : 'var(--ink-muted)', textAlign: 'center' }}>
                    {label}
                  </span>
                  {/* Connector */}
                  {idx < stageLabels.length - 1 && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '6px',
                        left: '50%',
                        width: '100%',
                        height: '1px',
                        background: isFilled ? 'var(--royal)' : '#E5E7EB',
                        zIndex: 1
                      }}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
