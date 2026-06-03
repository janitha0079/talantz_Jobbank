'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Company {
  id: string
  name: string
  slug: string
  industry: string | null
  subscriptionTier: string
  subscriptionStatus: string
  isVerified: boolean
  createdAt: string
  deletedAt: string | null
  _count: { jobs: number; members: number }
}

export default function AdminCompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', contactName: '', contactEmail: '', industry: '', subscriptionTier: 'free' })
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [createSuccess, setCreateSuccess] = useState<string | null>(null)

  useEffect(() => {
    const url = `/api/admin/companies${q ? `?q=${encodeURIComponent(q)}` : ''}`
    fetch(url)
      .then(r => r.json())
      .then(data => {
        if (data.data) { setCompanies(data.data); setTotal(data.meta?.total ?? data.data.length) }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [q])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    setCreateError(null)
    setCreateSuccess(null)
    const res = await fetch('/api/admin/companies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (!res.ok) {
      setCreateError(data.error ?? 'Failed to create company')
    } else {
      setCreateSuccess(`Company created! Invitation sent to ${form.contactEmail}`)
      setForm({ name: '', contactName: '', contactEmail: '', industry: '', subscriptionTier: 'free' })
      setShowForm(false)
      // Refresh list
      fetch('/api/admin/companies').then(r => r.json()).then(d => { if (d.data) { setCompanies(d.data); setTotal(d.meta?.total ?? d.data.length) } })
    }
    setCreating(false)
  }

  const TIER_STYLE: Record<string, { bg: string; color: string }> = {
    free:       { bg: 'var(--surface)', color: 'var(--ink-muted)' },
    growth:     { bg: 'var(--royal-pale)', color: 'var(--royal)' },
    enterprise: { bg: 'var(--gold-light)', color: '#92400E' },
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface)' }}>
      {/* Nav */}
      <nav style={{ background: 'var(--royal-deep)', padding: '0 1.5rem', position: 'sticky', top: 0, zIndex: 50 }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', height: '60px', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Link href="/admin" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '0.85rem' }}>← Admin</Link>
            <span style={{ color: '#fff', fontWeight: 700, fontSize: '0.9rem' }}>Companies</span>
          </div>
          <button className="btn btn-gold" onClick={() => setShowForm(s => !s)} style={{ fontSize: '0.83rem', padding: '6px 14px' }}>
            {showForm ? 'Cancel' : '+ New company'}
          </button>
        </div>
      </nav>

      <div className="container" style={{ padding: '32px 1.5rem' }}>
        {createSuccess && (
          <div style={{ background: 'var(--green-pale)', border: '1px solid #BBF7D0', borderRadius: 'var(--r-sm)', padding: '12px 16px', marginBottom: '16px', fontSize: '0.875rem', color: '#15803D' }}>
            {createSuccess}
          </div>
        )}

        {/* Create company form */}
        {showForm && (
          <form onSubmit={handleCreate} className="card" style={{ padding: '24px', marginBottom: '24px' }}>
            <h2 style={{ fontFamily: 'var(--ff)', fontWeight: 700, fontSize: '1rem', marginBottom: '16px' }}>Create company & send invitation</h2>
            {createError && (
              <div style={{ background: 'var(--coral-pale)', borderRadius: 'var(--r-sm)', padding: '10px', marginBottom: '12px', fontSize: '0.83rem', color: 'var(--coral)' }}>{createError}</div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
              {[
                { key: 'name', label: 'Company name *', placeholder: 'Commercial Bank of Ceylon' },
                { key: 'contactName', label: 'Contact name *', placeholder: 'Saman Perera' },
                { key: 'contactEmail', label: 'Contact email *', placeholder: 'saman@company.lk', type: 'email' },
                { key: 'industry', label: 'Industry', placeholder: 'Banking & Finance' },
              ].map(({ key, label, placeholder, type = 'text' }) => (
                <div key={key}>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--ink-soft)', marginBottom: '5px' }}>{label}</label>
                  <input
                    className="input"
                    type={type}
                    value={(form as any)[key]}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    placeholder={placeholder}
                    required={label.endsWith('*')}
                  />
                </div>
              ))}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--ink-soft)', marginBottom: '5px' }}>Subscription tier</label>
                <select className="input" value={form.subscriptionTier} onChange={e => setForm(f => ({ ...f, subscriptionTier: e.target.value }))}>
                  <option value="free">Free</option>
                  <option value="growth">Growth</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>
            </div>
            <button type="submit" className="btn btn-primary" disabled={creating} style={{ marginTop: '16px', fontSize: '0.875rem' }}>
              {creating ? 'Creating…' : 'Create company & send invitation'}
            </button>
          </form>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h1 style={{ fontFamily: 'var(--ff-serif)', fontSize: '1.6rem' }}>
            Companies <span style={{ color: 'var(--ink-muted)', fontSize: '1rem', fontFamily: 'var(--ff)', fontWeight: 400 }}>({total})</span>
          </h1>
          <input
            className="input"
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Search companies…"
            style={{ width: '240px' }}
          />
        </div>

        {loading ? (
          <p style={{ color: 'var(--ink-muted)', fontSize: '0.875rem' }}>Loading…</p>
        ) : (
          <div className="card" style={{ overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem' }}>
              <thead>
                <tr style={{ borderBottom: '1.5px solid var(--border)' }}>
                  {['Company', 'Industry', 'Tier', 'Jobs', 'Members', 'Created', ''].map(h => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--ink-muted)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {companies.map((c: any) => {
                  const ts = TIER_STYLE[c.subscriptionTier] ?? TIER_STYLE.free
                  return (
                    <tr key={c.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 700, color: 'var(--ink)' }}>{c.name}</div>
                        {c.isVerified && <span style={{ fontSize: '0.7rem', color: 'var(--green)', fontWeight: 700 }}>✓ Verified</span>}
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--ink-muted)' }}>{c.industry ?? '—'}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ display: 'inline-flex', padding: '3px 9px', borderRadius: '5px', fontSize: '0.7rem', fontWeight: 700, background: ts.bg, color: ts.color }}>
                          {c.subscriptionTier}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--ink-soft)', fontWeight: 600 }}>{c._count?.jobs ?? 0}</td>
                      <td style={{ padding: '12px 16px', color: 'var(--ink-soft)', fontWeight: 600 }}>{c._count?.members ?? 0}</td>
                      <td style={{ padding: '12px 16px', color: 'var(--ink-muted)' }}>
                        {new Date(c.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <Link href={`/admin/companies/${c.id}`} style={{ fontSize: '0.8rem', color: 'var(--royal)' }}>Open</Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {companies.length === 0 && (
              <p style={{ padding: '32px', textAlign: 'center', color: 'var(--ink-muted)' }}>No companies found</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
