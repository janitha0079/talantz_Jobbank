'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

type Experience = {
  id: string
  title: string
  company: string
  location: string | null
  startDate: string | null
  endDate: string | null
  isCurrent: boolean
  description: string | null
}

export default function ProfileExperiencePage() {
  const [items, setItems] = useState<Experience[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    title: '',
    company: '',
    location: '',
    startDate: '',
    endDate: '',
    isCurrent: false,
    description: '',
  })

  async function loadItems() {
    setLoading(true)
    const res = await fetch('/api/profile/experience')
    const data = await res.json()
    setItems(data.data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    loadItems().catch(() => setLoading(false))
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const res = await fetch('/api/profile/experience', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        location: form.location || null,
        startDate: form.startDate || null,
        endDate: form.isCurrent ? null : form.endDate || null,
        description: form.description || null,
      }),
    })

    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? 'Failed to save experience')
    } else {
      setForm({
        title: '',
        company: '',
        location: '',
        startDate: '',
        endDate: '',
        isCurrent: false,
        description: '',
      })
      await loadItems()
    }
    setSaving(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface)' }}>
      <div className="container" style={{ paddingTop: '28px', paddingBottom: '48px', maxWidth: '920px' }}>
        <Link href="/profile" style={{ fontSize: '0.85rem', color: 'var(--royal)' }}>
          ← Back to profile
        </Link>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(300px, 360px)', gap: '18px', marginTop: '16px' }}>
          <div className="card" style={{ padding: '24px' }}>
            <h1 style={{ fontSize: '1.9rem', marginBottom: '14px' }}>Experience history</h1>
            {loading ? (
              <p style={{ color: 'var(--ink-muted)' }}>Loading experience...</p>
            ) : items.length === 0 ? (
              <p style={{ color: 'var(--ink-muted)' }}>No experience records yet.</p>
            ) : (
              <div style={{ display: 'grid', gap: '12px' }}>
                {items.map((item) => (
                  <div key={item.id} style={{ paddingLeft: '16px', borderLeft: '2px solid var(--border-md)' }}>
                    <p style={{ fontWeight: 700 }}>{item.title}</p>
                    <p style={{ color: 'var(--royal)', fontSize: '0.88rem' }}>{item.company}</p>
                    <p style={{ color: 'var(--ink-muted)', fontSize: '0.8rem' }}>
                      {[item.startDate?.slice(0, 10), item.isCurrent ? 'Present' : item.endDate?.slice(0, 10), item.location].filter(Boolean).join(' • ')}
                    </p>
                    {item.description && <p style={{ marginTop: '6px', color: 'var(--ink-soft)' }}>{item.description}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card" style={{ padding: '24px' }}>
            <h2 style={{ fontSize: '1.35rem', marginBottom: '12px' }}>Add experience</h2>
            {error && <div style={{ background: 'var(--coral-pale)', color: 'var(--coral)', padding: '10px 12px', borderRadius: '10px', marginBottom: '12px' }}>{error}</div>}
            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '12px' }}>
              <input className="input" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Job title" required />
              <input className="input" value={form.company} onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))} placeholder="Company" required />
              <input className="input" value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} placeholder="Location" />
              <input className="input" type="date" value={form.startDate} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))} />
              {!form.isCurrent && <input className="input" type="date" value={form.endDate} onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))} />}
              <label style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '0.88rem', color: 'var(--ink-soft)' }}>
                <input type="checkbox" checked={form.isCurrent} onChange={(e) => setForm((f) => ({ ...f, isCurrent: e.target.checked }))} />
                I currently work here
              </label>
              <textarea className="input" rows={5} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Describe your responsibilities and achievements" />
              <button className="btn btn-primary" type="submit" disabled={saving}>
                {saving ? 'Saving...' : 'Save experience'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
