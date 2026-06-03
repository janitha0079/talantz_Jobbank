import { db } from '@/lib/db'
import Link from 'next/link'
import type { Metadata } from 'next'
import { SiteHeader } from '@/components/navigation/SiteHeader'

export const metadata: Metadata = { title: 'Admin — TalentAI.lk' }

export default async function AdminPage() {
  const [userCount, companyCount, jobCount, applicationCount] = await Promise.all([
    db.user.count({ where: { deletedAt: null } }),
    db.company.count({ where: { deletedAt: null } }),
    db.job.count({ where: { deletedAt: null, status: 'active' } }),
    db.application.count(),
  ])

  const recentAuditLogs = await db.auditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10,
    include: { user: { select: { email: true, role: true } } },
  })

  const stats = [
    { label: 'Total users', value: userCount, color: 'var(--royal)' },
    { label: 'Companies', value: companyCount, color: 'var(--electric)' },
    { label: 'Active jobs', value: jobCount, color: 'var(--green)' },
    { label: 'Applications', value: applicationCount, color: 'var(--amber)' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface)' }}>
      <SiteHeader role="admin" theme="dark" current="/admin" subtitle="Admin workspace" />

      <div className="container" style={{ padding: '32px 1.5rem' }}>
        <h1 style={{ fontFamily: 'var(--ff-serif)', fontSize: 'clamp(1.5rem, 3vw, 2rem)', marginBottom: '28px' }}>Dashboard Overview</h1>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '14px', marginBottom: '32px' }}>
          {stats.map(({ label, value, color }) => (
            <div key={label} className="card" style={{ padding: '20px 24px' }}>
              <p style={{ fontSize: '2.2rem', fontWeight: 700, color, lineHeight: 1 }}>{value.toLocaleString()}</p>
              <p style={{ fontSize: '0.78rem', color: 'var(--ink-muted)', marginTop: '6px' }}>{label}</p>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '32px' }}>
          {[
            { href: '/admin/companies', label: '+ Create company', desc: 'Onboard a new employer', primary: true },
            { href: '/admin/users', label: 'Manage users', desc: 'View, deactivate, change roles', primary: false },
            { href: '/admin/ai-usage', label: 'AI usage stats', desc: 'Claude API costs & latency', primary: false },
            { href: '/admin/audit-log', label: 'Audit log', desc: 'All admin actions', primary: false },
          ].map(({ href, label, desc, primary }) => (
            <Link key={href} href={href} style={{ textDecoration: 'none' }}>
              <div className="card" style={{ padding: '18px 20px', transition: 'border-color 0.18s, box-shadow 0.18s', cursor: 'pointer' }}>
                <p style={{ fontWeight: 700, fontSize: '0.9rem', color: primary ? 'var(--royal)' : 'var(--ink)', marginBottom: '4px' }}>{label}</p>
                <p style={{ fontSize: '0.78rem', color: 'var(--ink-muted)' }}>{desc}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* Audit log */}
        <div>
          <h2 style={{ fontFamily: 'var(--ff)', fontWeight: 700, fontSize: '0.875rem', color: 'var(--ink-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>
            Recent activity
          </h2>
          <div className="card" style={{ overflow: 'hidden' }}>
            {(recentAuditLogs as any[]).length === 0 ? (
              <p style={{ padding: '24px', color: 'var(--ink-muted)', fontSize: '0.875rem' }}>No audit logs yet</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1.5px solid var(--border)' }}>
                    {['Action', 'User', 'Time'].map(h => (
                      <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--ink-muted)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(recentAuditLogs as any[]).map((log: any) => (
                    <tr key={log.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px 16px' }}>
                        <code style={{ fontSize: '0.8rem', background: 'var(--surface)', padding: '2px 7px', borderRadius: '4px', color: 'var(--ink-soft)' }}>
                          {log.action}
                        </code>
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--ink-muted)' }}>{log.user?.email}</td>
                      <td style={{ padding: '12px 16px', color: 'var(--ink-muted)' }}>
                        {new Date(log.createdAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
