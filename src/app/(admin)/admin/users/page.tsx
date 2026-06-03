'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface User {
  id: string
  email: string
  role: string
  emailVerified: boolean
  createdAt: string
  deletedAt: string | null
}

const ROLE_STYLE: Record<string, { bg: string; color: string }> = {
  super_admin:     { bg: '#F5F3FF', color: '#7C3AED' },
  employer_admin:  { bg: 'var(--royal-pale)', color: 'var(--royal)' },
  employer_member: { bg: 'var(--royal-pale)', color: 'var(--royal-light)' },
  job_seeker:      { bg: 'var(--surface)', color: 'var(--ink-muted)' },
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')

  useEffect(() => {
    const url = `/api/admin/users${q ? `?q=${encodeURIComponent(q)}` : ''}`
    fetch(url)
      .then(r => r.json())
      .then(data => {
        if (data.data) { setUsers(data.data); setTotal(data.meta?.total ?? data.data.length) }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [q])

  async function handleDeactivate(userId: string) {
    if (!confirm('Deactivate this user?')) return
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'deactivate' }),
    })
    if (res.ok) {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, deletedAt: new Date().toISOString() } : u))
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface)' }}>
      {/* Nav */}
      <nav style={{ background: 'var(--royal-deep)', padding: '0 1.5rem', position: 'sticky', top: 0, zIndex: 50 }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', height: '60px', gap: '16px' }}>
          <Link href="/admin" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '0.85rem' }}>← Admin</Link>
          <span style={{ color: '#fff', fontWeight: 700, fontSize: '0.9rem' }}>Users</span>
        </div>
      </nav>

      <div className="container" style={{ padding: '32px 1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h1 style={{ fontFamily: 'var(--ff-serif)', fontSize: '1.6rem' }}>
            Users <span style={{ color: 'var(--ink-muted)', fontSize: '1rem', fontFamily: 'var(--ff)', fontWeight: 400 }}>({total})</span>
          </h1>
          <input
            className="input"
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Search by email…"
            style={{ width: '260px' }}
          />
        </div>

        {loading ? (
          <p style={{ color: 'var(--ink-muted)', fontSize: '0.875rem' }}>Loading…</p>
        ) : (
          <div className="card" style={{ overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem' }}>
              <thead>
                <tr style={{ borderBottom: '1.5px solid var(--border)' }}>
                  {['Email', 'Role', 'Verified', 'Joined', 'Status', ''].map(h => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--ink-muted)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u: any) => {
                  const rs = ROLE_STYLE[u.role] ?? ROLE_STYLE.job_seeker
                  const isActive = !u.deletedAt
                  return (
                    <tr key={u.id} style={{ borderBottom: '1px solid var(--border)', opacity: isActive ? 1 : 0.5 }}>
                      <td style={{ padding: '12px 16px', color: 'var(--ink-soft)', fontWeight: 500 }}>{u.email}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ display: 'inline-flex', padding: '3px 9px', borderRadius: '5px', fontSize: '0.7rem', fontWeight: 700, background: rs.bg, color: rs.color }}>
                          {u.role.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ color: u.emailVerified ? 'var(--green)' : 'var(--ink-muted)', fontWeight: 600, fontSize: '0.8rem' }}>
                          {u.emailVerified ? '✓ Yes' : '— No'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--ink-muted)' }}>
                        {new Date(u.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: isActive ? 'var(--green)' : 'var(--coral)' }}>
                          {isActive ? 'Active' : 'Deactivated'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        {isActive && u.role !== 'super_admin' && (
                          <button
                            onClick={() => handleDeactivate(u.id)}
                            style={{ fontSize: '0.75rem', color: 'var(--coral)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px' }}
                          >
                            Deactivate
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {users.length === 0 && (
              <p style={{ padding: '32px', textAlign: 'center', color: 'var(--ink-muted)' }}>No users found</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
