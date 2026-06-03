import { db } from '@/lib/db'
import Link from 'next/link'

export default async function AdminAiUsagePage() {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  const byFunction = await db.aiUsageLog.groupBy({
    by: ['functionName'],
    where: { createdAt: { gte: since } },
    _count: { id: true },
    _sum: { inputTokens: true, outputTokens: true },
    _avg: { latencyMs: true },
    orderBy: { _count: { id: 'desc' } },
  })

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface)' }}>
      <div className="container" style={{ paddingTop: '28px', paddingBottom: '48px' }}>
        <Link href="/admin" style={{ fontSize: '0.85rem', color: 'var(--royal)' }}>← Back to admin</Link>
        <div className="card" style={{ padding: '24px', marginTop: '16px' }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>AI usage stats</h1>
          <p style={{ color: 'var(--ink-muted)', marginBottom: '18px' }}>Last 30 days of tracked AI usage across platform functions.</p>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Function', 'Calls', 'Input tokens', 'Output tokens', 'Avg latency'].map((head) => (
                  <th key={head} style={{ textAlign: 'left', padding: '10px 12px', color: 'var(--ink-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>{head}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {byFunction.map((row) => (
                <tr key={row.functionName} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px' }}>{row.functionName}</td>
                  <td style={{ padding: '12px' }}>{row._count.id}</td>
                  <td style={{ padding: '12px' }}>{row._sum.inputTokens ?? 0}</td>
                  <td style={{ padding: '12px' }}>{row._sum.outputTokens ?? 0}</td>
                  <td style={{ padding: '12px' }}>{Math.round(row._avg.latencyMs ?? 0)} ms</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
