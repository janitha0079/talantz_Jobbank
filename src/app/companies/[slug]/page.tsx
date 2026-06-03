import Link from 'next/link'
import { notFound } from 'next/navigation'
import { db } from '@/lib/db'

export default async function CompanyPage({
  params,
}: {
  params: { slug: string }
}) {
  const company = await db.company.findFirst({
    where: { slug: params.slug, deletedAt: null, suspendedAt: null },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      industry: true,
      companySize: true,
      foundedYear: true,
      website: true,
      linkedinUrl: true,
      headquarters: true,
      isVerified: true,
      supportEmail: true,
      supportPhone: true,
      locations: true,
      jobs: {
        where: { status: 'active', deletedAt: null },
        orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
        select: {
          id: true,
          title: true,
          slug: true,
          location: true,
          jobType: true,
          workMode: true,
          createdAt: true,
        },
      },
    },
  })

  if (!company) notFound()

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface)' }}>
      <div style={{ background: 'linear-gradient(145deg, var(--royal-deep), var(--royal))', color: '#fff' }}>
        <div className="container" style={{ paddingTop: '24px', paddingBottom: '40px' }}>
          <Link href="/jobs" style={{ color: 'rgba(255,255,255,0.82)', fontSize: '0.85rem' }}>
            ← Back to jobs
          </Link>
          <div style={{ marginTop: '24px', maxWidth: '760px' }}>
            <p style={{ fontSize: '0.76rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.72)', marginBottom: '10px' }}>
              Company profile
            </p>
            <h1 style={{ fontSize: 'clamp(2.3rem, 5vw, 4rem)', color: '#fff', marginBottom: '10px' }}>
              {company.name}
            </h1>
            <p style={{ fontSize: '0.98rem', color: 'rgba(255,255,255,0.8)', marginBottom: '14px' }}>
              {[company.industry, company.headquarters].filter(Boolean).join(' • ')}
            </p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {company.isVerified && <span className="badge badge-gold">Verified employer</span>}
              {company.companySize && <span className="badge" style={{ background: 'rgba(255,255,255,0.12)', color: '#fff' }}>{company.companySize.replaceAll('_', ' ')}</span>}
              <span className="badge" style={{ background: 'rgba(255,255,255,0.12)', color: '#fff' }}>
                {company.jobs.length} active jobs
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="container" style={{ paddingTop: '32px', paddingBottom: '48px', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 320px', gap: '20px' }}>
        <div style={{ display: 'grid', gap: '16px' }}>
          <div className="card" style={{ padding: '24px' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '12px' }}>About {company.name}</h2>
            <p style={{ color: 'var(--ink-soft)', lineHeight: 1.75 }}>
              {company.description ?? 'This employer has not added a company description yet.'}
            </p>
          </div>

          <div className="card" style={{ padding: '24px' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '14px' }}>Open roles</h2>
            {company.jobs.length === 0 ? (
              <p style={{ color: 'var(--ink-muted)' }}>No active jobs at the moment.</p>
            ) : (
              <div style={{ display: 'grid', gap: '10px' }}>
                {company.jobs.map((job) => (
                  <Link key={job.id} href={`/jobs/${job.slug}`} style={{ textDecoration: 'none' }}>
                    <div className="card" style={{ padding: '16px 18px', transition: 'box-shadow 0.18s ease' }}>
                      <p style={{ fontWeight: 700, color: 'var(--ink)' }}>{job.title}</p>
                      <p style={{ color: 'var(--ink-muted)', fontSize: '0.82rem', marginTop: '4px' }}>
                        {[job.location, job.jobType.replace('_', ' '), job.workMode].filter(Boolean).join(' • ')}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'grid', gap: '16px', alignSelf: 'start' }}>
          <div className="card" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '1.05rem', marginBottom: '12px' }}>Company details</h3>
            <div style={{ display: 'grid', gap: '10px', fontSize: '0.88rem', color: 'var(--ink-soft)' }}>
              {company.foundedYear && <p>Founded: {company.foundedYear}</p>}
              {company.headquarters && <p>Headquarters: {company.headquarters}</p>}
              {company.supportEmail && <p>Contact: {company.supportEmail}</p>}
              {company.supportPhone && <p>Phone: {company.supportPhone}</p>}
            </div>
          </div>

          {(company.website || company.linkedinUrl || company.locations.length > 0) && (
            <div className="card" style={{ padding: '20px' }}>
              <h3 style={{ fontSize: '1.05rem', marginBottom: '12px' }}>Connect</h3>
              <div style={{ display: 'grid', gap: '10px' }}>
                {company.website && <a href={company.website} target="_blank" rel="noreferrer">Website ↗</a>}
                {company.linkedinUrl && <a href={company.linkedinUrl} target="_blank" rel="noreferrer">LinkedIn ↗</a>}
                {company.locations.slice(0, 3).map((location) => (
                  <p key={location.id} style={{ color: 'var(--ink-soft)', fontSize: '0.88rem' }}>
                    {[location.city, location.country, location.address].filter(Boolean).join(', ')}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
