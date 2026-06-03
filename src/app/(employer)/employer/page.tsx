import Link from 'next/link'
import type { Metadata } from 'next'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { SiteHeader } from '@/components/navigation/SiteHeader'

export const metadata: Metadata = { title: 'Employer Dashboard - TalentAI.lk' }
export const dynamic = 'force-dynamic'

const planMeta = {
  free: {
    label: '1 Job Starter',
    note: 'Best for one active opening with core AI-assisted hiring tools.',
    accent: 'var(--royal)',
    tone: 'var(--royal-pale)',
  },
  growth: {
    label: 'Monthly Hiring',
    note: 'Built for ongoing recruitment with a fuller dashboard workflow.',
    accent: '#9A7200',
    tone: 'var(--gold-light)',
  },
  enterprise: {
    label: 'Bulk Recruitment',
    note: 'Made for multi-role hiring, collaboration, and high-volume campaigns.',
    accent: '#15803D',
    tone: 'var(--green-pale)',
  },
} as const

const statusMeta = {
  applied: { label: 'Applied', color: 'var(--ink-muted)', bg: 'var(--surface)' },
  screening: { label: 'Screening', color: 'var(--royal)', bg: 'var(--royal-pale)' },
  shortlisted: { label: 'Shortlisted', color: '#0369a1', bg: '#e0f2fe' },
  interview: { label: 'Interview', color: '#0891b2', bg: '#cffafe' },
  assessment: { label: 'Assessment', color: '#7c3aed', bg: '#f3e8ff' },
  offer: { label: 'Offer', color: '#16a34a', bg: '#dcfce7' },
  hired: { label: 'Hired', color: '#15803d', bg: '#bbf7d0' },
  rejected: { label: 'Rejected', color: 'var(--coral)', bg: '#fff1f2' },
  withdrawn: { label: 'Withdrawn', color: 'var(--ink-muted)', bg: 'var(--border)' },
} as const

export default async function EmployerRootPage() {
  const session = await auth()
  if (!session?.user) return null

  const membership = await db.companyMember.findFirst({
    where: { userId: session.user.id, company: { deletedAt: null } },
    include: { company: true },
  })

  const company = membership?.company ?? null

  if (!company) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--surface)' }}>
        <SiteHeader role="employer" current="/employer" subtitle="Employer workspace" />
        <div className="container" style={{ padding: '48px 1.5rem 72px' }}>
          <div className="card" style={{ padding: '40px', maxWidth: '720px' }}>
            <p style={{ fontSize: '0.78rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--royal)', marginBottom: '10px' }}>Employer workspace</p>
            <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', marginBottom: '12px' }}>Your account is ready, but it is not linked to a company yet.</h1>
            <p style={{ color: 'var(--ink-muted)', maxWidth: '56ch', marginBottom: '22px' }}>
              Ask your company admin to invite you, or create a new employer workspace to start posting jobs and reviewing applicants.
            </p>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <Link href="/register?audience=employer" className="btn btn-primary">Create employer workspace</Link>
              <Link href="/login?audience=employer" className="btn btn-ghost">Switch account</Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const [jobs, recentApplications] = await Promise.all([
    db.job.findMany({
      where: { companyId: company.id, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: 6,
      include: {
        _count: { select: { applications: true } },
      },
    }),
    db.application.findMany({
      where: { job: { companyId: company.id, deletedAt: null } },
      orderBy: { createdAt: 'desc' },
      take: 6,
      include: {
        job: { select: { title: true, slug: true } },
        seeker: {
          select: {
            fullName: true,
            headline: true,
            user: { select: { email: true } },
          },
        },
      },
    }),
  ])

  const plan = planMeta[company.subscriptionTier]
  const totalJobs = jobs.length
  const activeJobs = jobs.filter((job) => job.status === 'active').length
  const draftJobs = jobs.filter((job) => job.status === 'draft').length
  const totalApplications = jobs.reduce((sum, job) => sum + (job._count?.applications ?? 0), 0)
  const avgApplications = totalJobs > 0 ? Math.round(totalApplications / totalJobs) : 0
  const shortlistedCount = recentApplications.filter((app) => app.status === 'shortlisted').length
  const interviewCount = recentApplications.filter((app) => app.status === 'interview').length

  const pipelineCards = [
    { key: 'applied', count: recentApplications.filter((app) => app.status === 'applied').length },
    { key: 'screening', count: recentApplications.filter((app) => app.status === 'screening').length },
    { key: 'shortlisted', count: shortlistedCount },
    { key: 'interview', count: interviewCount },
    { key: 'offer', count: recentApplications.filter((app) => app.status === 'offer').length },
    { key: 'hired', count: recentApplications.filter((app) => app.status === 'hired').length },
  ] as const

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #eef2ff 0%, #f7f9ff 28%, #f4f6ff 100%)' }}>
      <section
        style={{
          position: 'relative',
          overflow: 'hidden',
          background:
            'radial-gradient(circle at top left, rgba(245,184,0,0.20), transparent 18%), radial-gradient(circle at 82% 14%, rgba(79,110,255,0.16), transparent 24%), linear-gradient(145deg, #07114c 0%, #0d1a66 38%, #1432b2 100%)',
          color: '#fff',
        }}
      >
        <div className="container" style={{ paddingTop: '22px', paddingBottom: '44px' }}>
          <SiteHeader role="employer" theme="dark" current="/employer" subtitle="Employer workspace" />
          <div style={{ height: '24px' }} />

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.1fr) minmax(290px, 0.9fr)', gap: '20px', alignItems: 'start' }}>
            <div className="animate-in">
              <div style={{ display: 'inline-flex', gap: '8px', alignItems: 'center', padding: '8px 14px', borderRadius: '999px', background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.14)', marginBottom: '18px', fontSize: '0.78rem', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                {company.isVerified ? 'Verified employer' : 'Employer setup'}
              </div>
              <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 4.5rem)', color: '#fff', marginBottom: '14px' }}>
                {company.name}
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.8)', maxWidth: '60ch', marginBottom: '22px' }}>
                Keep hiring momentum in one place. Track active roles, review your newest applicants, and move faster from first application to shortlist.
              </p>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '18px' }}>
                <Link href="/employer/jobs/new" className="btn btn-gold">Launch a new role</Link>
                <Link href="/employer/jobs" className="btn" style={{ background: '#fff', color: 'var(--royal-deep)' }}>Open hiring dashboard</Link>
              </div>
              <div style={{ display: 'flex', gap: '18px', flexWrap: 'wrap', color: 'rgba(255,255,255,0.82)', fontSize: '0.88rem' }}>
                <span>{activeJobs} active jobs</span>
                <span>{totalApplications} total applications</span>
                <span>{shortlistedCount} shortlisted recently</span>
              </div>
            </div>

            <div className="animate-in card" style={{ padding: '22px', borderRadius: '24px', background: 'rgba(255,255,255,0.92)', borderColor: 'rgba(255,255,255,0.16)' }}>
              <p style={{ fontSize: '0.76rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: plan.accent, marginBottom: '8px' }}>Current package</p>
              <h2 style={{ fontSize: '1.7rem', marginBottom: '8px' }}>{plan.label}</h2>
              <p style={{ color: 'var(--ink-muted)', marginBottom: '16px' }}>{plan.note}</p>
              <div style={{ display: 'grid', gap: '10px' }}>
                <div style={{ padding: '12px 14px', borderRadius: '14px', background: plan.tone }}>
                  <p style={{ fontSize: '0.84rem', color: 'var(--ink-soft)' }}>
                    Subscription status: <strong>{company.subscriptionStatus}</strong>
                  </p>
                </div>
                <div style={{ padding: '12px 14px', borderRadius: '14px', background: 'var(--surface)' }}>
                  <p style={{ fontSize: '0.84rem', color: 'var(--ink-soft)' }}>
                    Recommended next move: {company.subscriptionTier === 'free' ? 'upgrade to Monthly Hiring for ongoing recruitment.' : company.subscriptionTier === 'growth' ? 'use Bulk Recruitment when you need multi-role or branch hiring.' : 'keep using ATS workflows for high-volume hiring.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container" style={{ paddingTop: '28px', paddingBottom: '52px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginTop: '-28px', marginBottom: '28px' }}>
          {[
            { label: 'Active jobs', value: activeJobs, tone: 'var(--green-pale)', color: '#15803D' },
            { label: 'Draft jobs', value: draftJobs, tone: 'var(--gold-light)', color: '#9A7200' },
            { label: 'Total applications', value: totalApplications, tone: 'var(--royal-pale)', color: 'var(--royal)' },
            { label: 'Avg. applicants per role', value: avgApplications, tone: '#eefbf4', color: '#0f766e' },
          ].map((card) => (
            <div key={card.label} className="card" style={{ padding: '22px', borderRadius: '22px', boxShadow: '0 18px 44px rgba(20,50,178,0.08)' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '14px', background: card.tone, marginBottom: '14px' }} />
              <p style={{ fontSize: '2rem', lineHeight: 1, fontWeight: 700, color: card.color, marginBottom: '6px' }}>{card.value}</p>
              <p style={{ fontSize: '0.82rem', color: 'var(--ink-muted)' }}>{card.label}</p>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(280px, 0.8fr)', gap: '18px', alignItems: 'start', marginBottom: '18px' }}>
          <div className="card" style={{ padding: '26px', borderRadius: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '18px' }}>
              <div>
                <p style={{ fontSize: '0.76rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--royal)', marginBottom: '8px' }}>Hiring pipeline</p>
                <h2 style={{ fontSize: '2rem' }}>Latest applicant movement</h2>
              </div>
              <Link href="/employer/jobs" className="btn btn-ghost">Review all applicants</Link>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '18px' }}>
              {pipelineCards.map((item) => {
                const meta = statusMeta[item.key]
                return (
                  <div key={item.key} style={{ padding: '14px', borderRadius: '18px', background: meta.bg }}>
                    <p style={{ fontSize: '0.78rem', color: meta.color, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px', fontWeight: 700 }}>
                      {meta.label}
                    </p>
                    <p style={{ fontSize: '1.9rem', lineHeight: 1, fontWeight: 700, color: 'var(--ink)' }}>{item.count}</p>
                  </div>
                )
              })}
            </div>
            {recentApplications.length === 0 ? (
              <div style={{ padding: '18px', borderRadius: '18px', background: 'var(--surface)' }}>
                <p style={{ color: 'var(--ink-muted)' }}>No applications have arrived yet. Post a role to start your pipeline.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '10px' }}>
                {recentApplications.map((application) => {
                  const meta = statusMeta[application.status]
                  return (
                    <Link
                      key={application.id}
                      href={`/employer/jobs/${application.job.slug}`}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'minmax(0, 1fr) auto',
                        gap: '14px',
                        alignItems: 'center',
                        padding: '14px 16px',
                        borderRadius: '18px',
                        background: '#fff',
                        border: '1px solid var(--border)',
                        textDecoration: 'none',
                      }}
                    >
                      <div>
                        <p style={{ fontWeight: 700, color: 'var(--ink)' }}>
                          {application.seeker.fullName ?? application.seeker.user.email}
                        </p>
                        <p style={{ fontSize: '0.84rem', color: 'var(--ink-muted)' }}>
                          {application.job.title}
                          {application.seeker.headline ? ` - ${application.seeker.headline}` : ''}
                        </p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ display: 'inline-flex', padding: '4px 10px', borderRadius: '999px', background: meta.bg, color: meta.color, fontSize: '0.72rem', fontWeight: 700 }}>
                          {meta.label}
                        </span>
                        <p style={{ fontSize: '0.74rem', color: 'var(--ink-muted)', marginTop: '6px' }}>
                          {new Date(application.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                        </p>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gap: '18px' }}>
            <div className="card" style={{ padding: '24px', borderRadius: '24px', background: 'linear-gradient(180deg, #ffffff, #f8fbff)' }}>
              <p style={{ fontSize: '0.76rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--royal)', marginBottom: '10px' }}>Quick actions</p>
              <h2 style={{ fontSize: '1.8rem', marginBottom: '14px' }}>What do you want to do next?</h2>
              <div style={{ display: 'grid', gap: '10px' }}>
                {[
                  { label: 'Post a new role', href: '/employer/jobs/new', body: 'Launch a job with AI-assisted description help.' },
                  { label: 'Manage live jobs', href: '/employer/jobs', body: 'Review statuses, applications, and posting performance.' },
                  { label: 'View company profile', href: `/companies/${company.slug}`, body: 'See the public-facing employer page job seekers will open.' },
                ].map((item) => (
                  <Link key={item.label} href={item.href} style={{ padding: '14px 16px', borderRadius: '16px', border: '1px solid var(--border)', background: '#fff', textDecoration: 'none' }}>
                    <p style={{ fontWeight: 700, color: 'var(--ink)', marginBottom: '4px' }}>{item.label}</p>
                    <p style={{ fontSize: '0.82rem', color: 'var(--ink-muted)' }}>{item.body}</p>
                  </Link>
                ))}
              </div>
            </div>

            <div className="card" style={{ padding: '24px', borderRadius: '24px' }}>
              <p style={{ fontSize: '0.76rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--royal)', marginBottom: '10px' }}>Package fit</p>
              <h2 style={{ fontSize: '1.8rem', marginBottom: '10px' }}>Choose the right hiring mode</h2>
              <div style={{ display: 'grid', gap: '10px', marginBottom: '14px' }}>
                {[
                  { name: '1 Job', body: 'For one immediate opening or testing the platform.', current: company.subscriptionTier === 'free' },
                  { name: 'Monthly', body: 'For consistent hiring with a broader dashboard workflow.', current: company.subscriptionTier === 'growth' },
                  { name: 'Bulk', body: 'For branch hiring, multiple campaigns, and volume recruitment.', current: company.subscriptionTier === 'enterprise' },
                ].map((item) => (
                  <div key={item.name} style={{ padding: '12px 14px', borderRadius: '16px', background: item.current ? plan.tone : 'var(--surface)', border: item.current ? `1px solid ${plan.accent}` : '1px solid transparent' }}>
                    <p style={{ fontWeight: 700, color: 'var(--ink)', marginBottom: '4px' }}>{item.name}{item.current ? ' - Current plan' : ''}</p>
                    <p style={{ fontSize: '0.82rem', color: 'var(--ink-muted)' }}>{item.body}</p>
                  </div>
                ))}
              </div>
              <Link href="/register?audience=employer&plan=monthly" className="btn btn-primary" style={{ width: '100%' }}>
                Explore packages
              </Link>
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '26px', borderRadius: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap', marginBottom: '18px' }}>
            <div>
              <p style={{ fontSize: '0.76rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--royal)', marginBottom: '8px' }}>Recent jobs</p>
              <h2 style={{ fontSize: '2rem' }}>Your newest listings</h2>
            </div>
            <Link href="/employer/jobs" className="btn btn-ghost">Open job manager</Link>
          </div>
          {jobs.length === 0 ? (
            <div style={{ padding: '18px', borderRadius: '18px', background: 'var(--surface)' }}>
              <p style={{ color: 'var(--ink-muted)', marginBottom: '12px' }}>You have not posted any jobs yet.</p>
              <Link href="/employer/jobs/new" className="btn btn-primary">Post your first job</Link>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '10px' }}>
              {jobs.map((job) => (
                <Link
                  key={job.id}
                  href={`/employer/jobs/${job.slug}`}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'minmax(0, 1fr) auto auto',
                    gap: '12px',
                    alignItems: 'center',
                    padding: '14px 16px',
                    borderRadius: '18px',
                    background: '#fff',
                    border: '1px solid var(--border)',
                    textDecoration: 'none',
                  }}
                >
                  <div>
                    <p style={{ fontWeight: 700, color: 'var(--ink)' }}>{job.title}</p>
                    <p style={{ fontSize: '0.82rem', color: 'var(--ink-muted)' }}>
                      {[job.jobType.replace('_', ' '), job.workMode, job.location].filter(Boolean).join(' - ')}
                    </p>
                  </div>
                  <span className={`badge ${job.status === 'active' ? 'badge-green' : job.status === 'draft' ? 'badge-surface' : job.status === 'paused' ? 'badge-amber' : 'badge-coral'}`}>
                    {job.status}
                  </span>
                  <p style={{ fontSize: '0.82rem', color: 'var(--ink-soft)', fontWeight: 700 }}>{job._count?.applications ?? 0} applicants</p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
