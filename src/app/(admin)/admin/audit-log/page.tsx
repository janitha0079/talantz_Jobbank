import Link from 'next/link'
import { db } from '@/lib/db'

export default async function AdminAuditLogPage() {
  const entries = await db.auditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: {
      user: { select: { email: true, role: true } },
    },
  })

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface)' }}>
      <div className="container" style={{ paddingTop: '28px', paddingBottom: '48px' }}>
        <Link href="/admin" style={{ fontSize: '0.85rem', color: 'var(--royal)' }}>← Back to admin</Link>
        <div className="card" style={{ padding: '24px', marginTop: '16px' }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>Audit log</h1>
          <p style={{ color: 'var(--ink-muted)', marginBottom: '18px' }}>Recent admin and workflow events across the platform.</p>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Time', 'Action', 'User', 'Target'].map((head) => (
                  <th key={head} style={{ textAlign: 'left', padding: '10px 12px', color: 'var(--ink-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>{head}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px' }}>{new Date(entry.createdAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                  <td style={{ padding: '12px' }}>{entry.action}</td>
                  <td style={{ padding: '12px' }}>{entry.user.email}</td>
                  <td style={{ padding: '12px' }}>{[entry.affectedTable, entry.affectedId].filter(Boolean).join(': ') || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
