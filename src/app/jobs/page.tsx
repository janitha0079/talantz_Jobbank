import { Suspense } from 'react'
import { db } from '@/lib/db'
import { auth } from '@/lib/auth'
import Link from 'next/link'
import type { Metadata } from 'next'
import { SiteHeader } from '@/components/navigation/SiteHeader'
import { PageHero, CoLogo } from '@/components/ui'

export const metadata: Metadata = {
  title: 'Browse Jobs — TalentAI.lk',
  description: 'Find your next role in Sri Lanka',
}
export const dynamic = 'force-dynamic'

// ── Types ─────────────────────────────────────────────────────────────────────

interface SearchParams {
  q?: string
  jobType?: string
  workMode?: string
  location?: string
  page?: string
}

// Brand colors for company logos (add more as needed)
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

export default async function JobsPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const session = await auth()
  const page = Math.max(1, parseInt(searchParams.page ?? '1'))
  const per = 20
  const skip = (page - 1) * per

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = { deletedAt: null, status: 'active' }
  if (searchParams.q) {
    where.OR = [
      { title: { contains: searchParams.q, mode: 'insensitive' } },
      { description: { contains: searchParams.q, mode: 'insensitive' } },
    ]
  }
  if (searchParams.jobType) where.jobType = searchParams.jobType
  if (searchParams.workMode) where.workMode = searchParams.workMode
  if (searchParams.location) where.location = { contains: searchParams.location, mode: 'insensitive' }

  const [total, jobs] = await Promise.all([
    db.job.count({ where }),
    db.job.findMany({
      where,
      orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
      skip,
      take: per,
      include: {
        company: {
          select: { id: true, name: true, slug: true, logoUrl: true, isVerified: true, headquarters: true },
        },
      },
    }),
  ])

  const pages = Math.ceil(total / per)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface)' }}>
      <SiteHeader
        role={
          session?.user?.role === 'super_admin'
            ? 'admin'
            : session?.user?.role === 'employer_admin' || session?.user?.role === 'employer_member'
              ? 'employer'
              : session?.user?.role === 'job_seeker'
                ? 'job_seeker'
                : 'guest'
        }
        current="/jobs"
        subtitle="Sri Lanka job search"
      />

      {/* Hero with PageHero */}
      <PageHero eyebrow="For people looking for work" pad="34px 0 40px">
        <div>
          <h1 style={{ fontSize: 'clamp(2rem,3.6vw,3.1rem)', fontWeight: 800, marginBottom: '8px', lineHeight: 1.1, color: '#fff' }}>
            Discover jobs that <span style={{ fontFamily: 'var(--ff-serif)', fontStyle: 'italic', color: 'var(--gold-soft)' }}>fit</span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.72)', marginBottom: '28px', fontSize: '0.95rem' }}>
            {total.toLocaleString()} active roles · scored against your profile in real time
          </p>
          {/* Search form */}
          <form method="GET" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <input
              name="q"
              defaultValue={searchParams.q ?? ''}
              placeholder="Job title or keyword"
              className="search-field"
              style={{ flex: '1 1 300px', minWidth: '200px' }}
            />
            <select
              name="jobType"
              defaultValue={searchParams.jobType ?? ''}
              className="search-field"
              style={{ flex: '0 1 160px' }}
            >
              <option value="">All types</option>
              <option value="full_time">Full time</option>
              <option value="part_time">Part time</option>
              <option value="contract">Contract</option>
              <option value="internship">Internship</option>
              <option value="freelance">Freelance</option>
            </select>
            <select
              name="workMode"
              defaultValue={searchParams.workMode ?? ''}
              className="search-field"
              style={{ flex: '0 1 140px' }}
            >
              <option value="">All modes</option>
              <option value="onsite">Onsite</option>
              <option value="remote">Remote</option>
              <option value="hybrid">Hybrid</option>
            </select>
            <button type="submit" className="btn btn-gold" style={{ flex: '0 0 auto' }}>
              Search
            </button>
          </form>
        </div>
      </PageHero>

      {/* Results */}
      <div className="app-wrap" style={{ padding: '32px 28px', flex: 1 }}>
        {/* Result count and sort chips */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <p style={{ color: 'var(--ink-muted)', fontSize: '0.875rem' }}>
            {total > 0 ? (
              <>Showing <strong>{skip + 1}–{Math.min(skip + per, total)}</strong> of <strong>{total}</strong> jobs</>
            ) : 'No jobs found'}
          </p>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="chip on" style={{ pointerEvents: 'none' }}>Best match</button>
            <button className="chip" style={{ pointerEvents: 'none' }}>Featured</button>
          </div>
        </div>

        {/* Job cards */}
        <Suspense fallback={<div style={{ padding: '48px', textAlign: 'center', color: 'var(--ink-muted)' }}>Loading jobs...</div>}>
          {jobs.length === 0 ? (
            <div className="card" style={{ padding: '48px', textAlign: 'center', color: 'var(--ink-muted)' }}>
              <p style={{ fontSize: '1.1rem', marginBottom: '8px' }}>No jobs match your search</p>
              <p style={{ fontSize: '0.875rem' }}>Try adjusting your filters or search terms</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {jobs.map((job: any) => (
                <JobCard key={job.id} job={job} isLoggedIn={!!session} />
              ))}
            </div>
          )}
        </Suspense>

        {/* Pagination */}
        {pages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', paddingTop: '24px' }}>
            {page > 1 && (
              <Link
                href={buildUrl(searchParams, page - 1)}
                className="btn btn-ghost"
                style={{ fontSize: '0.8rem', padding: '6px 14px' }}
              >
                ← Previous
              </Link>
            )}
            <span style={{ display: 'flex', alignItems: 'center', fontSize: '0.875rem', color: 'var(--ink-muted)', padding: '0 8px' }}>
              Page {page} of {pages}
            </span>
            {page < pages && (
              <Link
                href={buildUrl(searchParams, page + 1)}
                className="btn btn-ghost"
                style={{ fontSize: '0.8rem', padding: '6px 14px' }}
              >
                Next →
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ── JobCard ───────────────────────────────────────────────────────────────────

function JobCard({ job, isLoggedIn }: { job: any; isLoggedIn: boolean }) {
  const typeLabels: Record<string, string> = {
    full_time: 'Full time', part_time: 'Part time', contract: 'Contract',
    internship: 'Internship', freelance: 'Freelance',
  }
  const modeLabels: Record<string, string> = {
    onsite: 'Onsite', remote: 'Remote', hybrid: 'Hybrid',
  }

  const postedAgo = timeAgo(new Date(job.createdAt))
  const companyColor = getCompanyColor(job.company?.name)
  // Stub match score for now (in future, call computeJobMatch)
  const matchScore = Math.floor(Math.random() * 30) + 70

  // Determine match pill color based on score
  let matchBg = '#EEF1FD'
  let matchColor = '#1B3DE0'
  let matchLabel = '—'

  if (matchScore >= 85) {
    matchBg = '#E7F8EF'
    matchColor = '#15803D'
    matchLabel = 'Match'
  } else if (matchScore >= 70) {
    matchBg = '#EEF1FD'
    matchColor = '#1B3DE0'
    matchLabel = 'Match'
  } else {
    matchBg = '#F5F5F5'
    matchColor = '#7580A0'
    matchLabel = 'View'
  }

  return (
    <Link
      href={`/jobs/${job.slug}`}
      style={{ textDecoration: 'none', display: 'block' }}
    >
      <div
        className="card card-hover"
        style={{
          padding: '20px 22px',
          borderColor: job.isFeatured ? 'rgba(245,184,0,.45)' : undefined,
          display: 'flex',
          gap: '16px',
          alignItems: 'center',
        }}
      >
        {/* Company logo */}
        <CoLogo
          initial={job.company?.name?.charAt(0) ?? '?'}
          color={companyColor}
          size={48}
          radius={12}
        />

        {/* Info column */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '4px' }}>
            <h3 style={{
              fontFamily: 'var(--ff)', fontWeight: 700, fontSize: '17px',
              color: 'var(--ink)', fontStyle: 'normal',
            }}>
              {job.title}
            </h3>
            {job.isFeatured && (
              <span className="badge badge-gold">★ Featured</span>
            )}
          </div>
          <p style={{ fontSize: '13.5px', color: 'var(--ink-muted)', marginBottom: '10px' }}>
            {job.company?.name}
            {job.company?.isVerified && <span style={{ color: 'var(--royal)', marginLeft: '4px' }}>✓</span>}
            {job.location && <span style={{ marginLeft: '8px' }}>· {job.location}</span>}
          </p>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span className="badge badge-royal">{typeLabels[job.jobType] ?? job.jobType}</span>
            <span className="badge badge-surface">{modeLabels[job.workMode] ?? job.workMode}</span>
            {job.salaryVisible && job.salaryMin && (
              <span className="badge badge-green">
                {job.salaryCurrency} {(job.salaryMin / 1000).toFixed(0)}k
                {job.salaryMax ? `–${(job.salaryMax / 1000).toFixed(0)}k` : '+'}
              </span>
            )}
            <span style={{ fontSize: '0.72rem', color: 'var(--ink-muted)', marginLeft: 'auto' }}>{postedAgo}</span>
          </div>
        </div>

        {/* Match cell - hidden on mobile */}
        <div style={{
          padding: '10px 16px',
          borderRadius: '14px',
          background: matchBg,
          textAlign: 'center',
          minWidth: '80px',
          flexShrink: 0,
        }}>
          <div style={{ fontSize: '22px', fontWeight: 800, color: matchColor, lineHeight: 1 }}>
            {matchScore}%
          </div>
          <div style={{ fontSize: '10px', fontWeight: 600, color: matchColor, marginTop: '2px', opacity: 0.7, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            {matchLabel}
          </div>
        </div>
      </div>
    </Link>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildUrl(params: SearchParams, page: number) {
  const p = new URLSearchParams()
  if (params.q) p.set('q', params.q)
  if (params.jobType) p.set('jobType', params.jobType)
  if (params.workMode) p.set('workMode', params.workMode)
  if (params.location) p.set('location', params.location)
  if (page > 1) p.set('page', String(page))
  const qs = p.toString()
  return `/jobs${qs ? '?' + qs : ''}`
}

function timeAgo(date: Date): string {
  const secs = Math.floor((Date.now() - date.getTime()) / 1000)
  if (secs < 60) return 'just now'
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`
  if (secs < 604800) return `${Math.floor(secs / 86400)}d ago`
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}
