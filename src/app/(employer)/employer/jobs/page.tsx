import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import Link from 'next/link'
import type { Metadata } from 'next'
import { SiteHeader } from '@/components/navigation/SiteHeader'

export const metadata: Metadata = { title: 'Manage Jobs — TalentAI.lk' }

export default async function EmployerJobsPage() {
  const session = await auth()
  if (!session?.user) return null

  // Get the company for this employer
  const membership = await db.companyMember.findFirst({
    where: { userId: session.user.id, company: { deletedAt: null } },
    include: { company: true },
  })

  const company = membership?.company

  const jobs = company ? await db.job.findMany({
    where: { companyId: company.id, deletedAt: null },
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: {
      _count: { select: { applications: true } },
    },
  }) : []

  const stats = {
    active: jobs.filter((j: any) => j.status === 'active').length,
    draft: jobs.filter((j: any) => j.status === 'draft').length,
    totalApplications: jobs.reduce((sum: number, j: any) => sum + (j._count?.applications ?? 0), 0),
  }

  const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
    active:  { bg: 'var(--green-pale)', color: '#15803D' },
    draft:   { bg: 'var(--surface)', color: 'var(--ink-muted)' },
    paused:  { bg: 'var(--amber-pale)', color: '#D97706' },
    closed:  { bg: 'var(--coral-pale)', color: 'var(--coral)' },
    expired: { bg: 'var(--coral-pale)', color: 'var(--coral)' },
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface)' }}>
      <SiteHeader role="employer" />

      <div className="container" style={{ padding: '32px 1.5rem' }}>
        {/* Header */}
        <div style={{ marginBottom: '28px' }}>
          <p style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--royal)', marginBottom: '8px' }}>Employer workspace</p>
          <h1 style={{ fontFamily: 'var(--ff-serif)', fontSize: 'clamp(1.5rem, 3vw, 2rem)', marginBottom: '4px' }}>Manage Jobs</h1>
          <p style={{ color: 'var(--ink-muted)', maxWidth: '60ch' }}>
            Review live roles, track incoming applications, and jump into each job to update candidate stages.
          </p>
          {company && (
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              <span className="badge badge-royal">{company.subscriptionTier}</span>
              {company.isVerified && <span className="badge badge-green">Verified</span>}
            </div>
          )}
        </div>

        {company && (
          <div className="card" style={{ padding: '18px 20px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div>
              <p style={{ fontWeight: 700, color: 'var(--ink)', marginBottom: '4px' }}>Need the full overview first?</p>
              <p style={{ color: 'var(--ink-muted)', fontSize: '0.85rem' }}>Open your employer dashboard for package status, pipeline summary, and quick actions.</p>
            </div>
            <Link href="/employer" className="btn btn-ghost">Open dashboard</Link>
          </div>
        )}

        {/* Stat cards */}
        {company && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '14px', marginBottom: '32px' }}>
            {[
              { label: 'Active jobs', value: stats.active, color: 'var(--green)' },
              { label: 'Draft jobs', value: stats.draft, color: 'var(--amber)' },
              { label: 'Total applications', value: stats.totalApplications, color: 'var(--royal)' },
            ].map(({ label, value, color }) => (
              <div key={label} className="card" style={{ padding: '20px 24px' }}>
                <p style={{ fontSize: '2rem', fontWeight: 700, color, lineHeight: 1 }}>{value}</p>
                <p style={{ fontSize: '0.78rem', color: 'var(--ink-muted)', marginTop: '6px' }}>{label}</p>
              </div>
            ))}
          </div>
        )}

        {/* No company state */}
        {!company && (
          <div className="card" style={{ padding: '48px', textAlign: 'center' }}>
            <p style={{ color: 'var(--ink-soft)', marginBottom: '8px', fontWeight: 600 }}>Your account isn&apos;t linked to a company yet</p>
            <p style={{ color: 'var(--ink-muted)', fontSize: '0.875rem' }}>
              Ask your super admin to send you a company invitation.
            </p>
          </div>
        )}

        {/* Jobs table */}
        {jobs.length > 0 && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h2 style={{ fontFamily: 'var(--ff)', fontWeight: 700, fontSize: '0.875rem', color: 'var(--ink-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Your job listings
              </h2>
              <Link href="/employer/jobs/new" className="btn btn-primary" style={{ fontSize: '0.8rem', padding: '6px 14px' }}>
                + Post new job
              </Link>
            </div>
            <div className="card" style={{ overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1.5px solid var(--border)' }}>
                    {['Job title', 'Type', 'Status', 'Applications', 'Posted', ''].map(h => (
                      <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--ink-muted)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((job: any) => {
                    const s = STATUS_STYLE[job.status] ?? STATUS_STYLE.draft
                    return (
                      <tr key={job.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '14px 16px' }}>
                          <Link href={`/employer/jobs/${job.slug}`} style={{ fontWeight: 600, color: 'var(--ink)', textDecoration: 'none' }}>
                            {job.title}
                          </Link>
                        </td>
                        <td style={{ padding: '14px 16px', color: 'var(--ink-muted)' }}>
                          {job.jobType?.replace('_', ' ')}
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{ display: 'inline-flex', padding: '3px 10px', borderRadius: '5px', fontSize: '0.72rem', fontWeight: 700, background: s.bg, color: s.color }}>
                            {job.status}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px', color: 'var(--ink-soft)', fontWeight: 600 }}>
                          {job._count?.applications ?? 0}
                        </td>
                        <td style={{ padding: '14px 16px', color: 'var(--ink-muted)' }}>
                          {new Date(job.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <Link href={`/employer/jobs/${job.slug}`} style={{ fontSize: '0.8rem', color: 'var(--royal)', textDecoration: 'none' }}>
                            View →
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {company && jobs.length === 0 && (
          <div className="card" style={{ padding: '48px', textAlign: 'center' }}>
            <p style={{ color: 'var(--ink-soft)', marginBottom: '16px' }}>No job listings yet</p>
            <Link href="/employer/jobs/new" className="btn btn-primary">Post your first job</Link>
          </div>
        )}
      </div>
    </div>
  )
}
