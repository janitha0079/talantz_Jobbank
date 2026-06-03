import Link from 'next/link'
import { notFound } from 'next/navigation'
import { db } from '@/lib/db'

export default async function AdminCompanyDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const company = await db.company.findUnique({
    where: { id: params.id },
    include: {
      members: { include: { user: { select: { email: true, role: true } } } },
      locations: true,
      jobs: {
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
      subscriptionHistory: {
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
    },
  })

  if (!company) notFound()

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface)' }}>
      <div className="container" style={{ paddingTop: '28px', paddingBottom: '48px' }}>
        <Link href="/admin/companies" style={{ fontSize: '0.85rem', color: 'var(--royal)' }}>← Back to companies</Link>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 320px', gap: '18px', marginTop: '16px' }}>
          <div style={{ display: 'grid', gap: '16px' }}>
            <div className="card" style={{ padding: '24px' }}>
              <h1 style={{ fontSize: '2rem', marginBottom: '10px' }}>{company.name}</h1>
              <p style={{ color: 'var(--ink-muted)', marginBottom: '12px' }}>
                {[company.industry, company.headquarters, company.subscriptionTier].filter(Boolean).join(' • ')}
              </p>
              <p style={{ color: 'var(--ink-soft)' }}>{company.description ?? 'No description added yet.'}</p>
            </div>

            <div className="card" style={{ padding: '24px' }}>
              <h2 style={{ fontSize: '1.35rem', marginBottom: '12px' }}>Team members</h2>
              <div style={{ display: 'grid', gap: '10px' }}>
                {company.members.map((member) => (
                  <div key={member.id} style={{ padding: '12px 14px', borderRadius: '12px', background: 'var(--surface)' }}>
                    <p style={{ fontWeight: 700 }}>{member.user.email}</p>
                    <p style={{ color: 'var(--ink-muted)', fontSize: '0.82rem' }}>{member.role}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="card" style={{ padding: '24px' }}>
              <h2 style={{ fontSize: '1.35rem', marginBottom: '12px' }}>Jobs</h2>
              <div style={{ display: 'grid', gap: '10px' }}>
                {company.jobs.map((job) => (
                  <Link key={job.id} href={`/jobs/${job.slug}`} style={{ textDecoration: 'none' }}>
                    <div style={{ padding: '12px 14px', borderRadius: '12px', background: 'var(--surface)' }}>
                      <p style={{ fontWeight: 700, color: 'var(--ink)' }}>{job.title}</p>
                      <p style={{ color: 'var(--ink-muted)', fontSize: '0.82rem' }}>{job.status} • {job.applicationsCount} applications</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gap: '16px', alignSelf: 'start' }}>
            <div className="card" style={{ padding: '20px' }}>
              <h3 style={{ fontSize: '1.05rem', marginBottom: '12px' }}>Account</h3>
              <div style={{ display: 'grid', gap: '8px', color: 'var(--ink-soft)', fontSize: '0.88rem' }}>
                <p>Tier: {company.subscriptionTier}</p>
                <p>Status: {company.subscriptionStatus}</p>
                <p>Verified: {company.isVerified ? 'Yes' : 'No'}</p>
                <p>Website: {company.website ?? '—'}</p>
              </div>
            </div>

            <div className="card" style={{ padding: '20px' }}>
              <h3 style={{ fontSize: '1.05rem', marginBottom: '12px' }}>Locations</h3>
              <div style={{ display: 'grid', gap: '8px' }}>
                {company.locations.length === 0 ? (
                  <p style={{ color: 'var(--ink-muted)' }}>No company locations added.</p>
                ) : (
                  company.locations.map((location) => (
                    <p key={location.id} style={{ color: 'var(--ink-soft)', fontSize: '0.88rem' }}>
                      {[location.city, location.country, location.address].filter(Boolean).join(', ')}
                    </p>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
