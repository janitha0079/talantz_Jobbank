import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export default async function ApplicationDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const session = await auth()

  if (!session?.user) {
    redirect(`/login?callbackUrl=/applications/${params.id}`)
  }

  const seekerProfile = await db.seekerProfile.findUnique({
    where: { userId: session.user.id },
  })

  if (!seekerProfile) notFound()

  const application = await db.application.findUnique({
    where: { id: params.id },
    include: {
      job: {
        select: {
          title: true,
          slug: true,
          location: true,
          workMode: true,
          jobType: true,
          company: { select: { name: true, slug: true } },
        },
      },
      timeline: {
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
    },
  })

  if (!application || application.seekerId !== seekerProfile.id) notFound()

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface)' }}>
      <div className="container" style={{ paddingTop: '28px', paddingBottom: '48px', maxWidth: '920px' }}>
        <Link href="/applications" style={{ fontSize: '0.85rem', color: 'var(--royal)' }}>
          ← Back to applications
        </Link>

        <div className="card" style={{ padding: '26px', marginTop: '16px', marginBottom: '16px' }}>
          <p style={{ fontSize: '0.78rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--royal)', marginBottom: '10px' }}>
            Application detail
          </p>
          <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>{application.job.title}</h1>
          <p style={{ color: 'var(--ink-muted)', marginBottom: '14px' }}>
            <Link href={`/companies/${application.job.company.slug}`}>{application.job.company.name}</Link>
            {application.job.location ? ` • ${application.job.location}` : ''}
          </p>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
            <span className="badge badge-royal">{application.status}</span>
            {application.aiMatchScore != null && <span className="badge badge-green">{application.aiMatchScore}% match</span>}
            {application.aiRecommendation && <span className="badge badge-gold">AI: {application.aiRecommendation}</span>}
          </div>
          {application.aiSummary && (
            <div style={{ padding: '14px 16px', borderRadius: '14px', background: 'var(--royal-pale)', marginBottom: '16px' }}>
              <p style={{ fontSize: '0.82rem', color: 'var(--royal)', fontWeight: 700, marginBottom: '6px' }}>AI summary</p>
              <p style={{ color: 'var(--ink-soft)' }}>{application.aiSummary}</p>
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <p style={{ fontSize: '0.82rem', color: 'var(--green)', fontWeight: 700, marginBottom: '8px' }}>Strengths</p>
              {application.aiStrengths.length === 0 ? (
                <p style={{ color: 'var(--ink-muted)' }}>No strengths generated yet.</p>
              ) : (
                <ul style={{ paddingLeft: '18px', display: 'grid', gap: '6px' }}>
                  {application.aiStrengths.map((item) => <li key={item}>{item}</li>)}
                </ul>
              )}
            </div>
            <div>
              <p style={{ fontSize: '0.82rem', color: 'var(--coral)', fontWeight: 700, marginBottom: '8px' }}>Gaps</p>
              {application.aiGaps.length === 0 ? (
                <p style={{ color: 'var(--ink-muted)' }}>No gaps generated yet.</p>
              ) : (
                <ul style={{ paddingLeft: '18px', display: 'grid', gap: '6px' }}>
                  {application.aiGaps.map((item) => <li key={item}>{item}</li>)}
                </ul>
              )}
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '26px' }}>
          <h2 style={{ fontSize: '1.35rem', marginBottom: '14px' }}>Timeline</h2>
          <div style={{ display: 'grid', gap: '12px' }}>
            {application.timeline.map((entry) => (
              <div key={entry.id} style={{ paddingLeft: '16px', borderLeft: '2px solid var(--border-md)' }}>
                <p style={{ fontWeight: 700, color: 'var(--ink)' }}>{entry.eventType}</p>
                <p style={{ fontSize: '0.82rem', color: 'var(--ink-muted)' }}>
                  {new Date(entry.createdAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
