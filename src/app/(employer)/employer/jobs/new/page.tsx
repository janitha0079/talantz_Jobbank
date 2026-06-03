'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface FormData {
  title: string
  description: string
  requirements: string
  responsibilities: string
  skillsRequired: string
  skillsPreferred: string
  jobType: string
  workMode: string
  location: string
  salaryMin: string
  salaryMax: string
  salaryVisible: boolean
  experienceMin: string
  experienceMax: string
  educationLevel: string
  closesAt: string
  status: 'draft' | 'active'
}

const INITIAL: FormData = {
  title: '', description: '', requirements: '', responsibilities: '',
  skillsRequired: '', skillsPreferred: '', jobType: 'full_time', workMode: 'onsite',
  location: '', salaryMin: '', salaryMax: '', salaryVisible: false,
  experienceMin: '', experienceMax: '', educationLevel: '', closesAt: '', status: 'draft',
}

export default function NewJobPage() {
  const router = useRouter()
  const [form, setForm] = useState<FormData>(INITIAL)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [generatingJd, setGeneratingJd] = useState(false)

  function set(key: keyof FormData, value: string | boolean) {
    setForm(f => ({ ...f, [key]: value }))
  }

  async function handleAiJd() {
    if (!form.title || !form.jobType) {
      setError('Enter a job title and type first')
      return
    }
    setGeneratingJd(true)
    setError(null)
    const res = await fetch('/api/jobs/ai-jd', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: form.title,
        jobType: form.jobType,
        workMode: form.workMode,
        location: form.location || undefined,
        skillsRequired: form.skillsRequired ? form.skillsRequired.split(',').map(s => s.trim()).filter(Boolean) : [],
        experienceMin: form.experienceMin ? parseInt(form.experienceMin) : undefined,
      }),
    })
    const data = await res.json()
    if (res.ok && data.data) {
      const jd = data.data
      setForm(f => ({
        ...f,
        description: jd.description ?? f.description,
        requirements: (jd.requirements ?? []).join('\n'),
        responsibilities: (jd.responsibilities ?? []).join('\n'),
        skillsRequired: (jd.skillsRequired ?? f.skillsRequired.split(',').map((s: string) => s.trim()).filter(Boolean)).join(', '),
        skillsPreferred: (jd.skillsPreferred ?? []).join(', '),
      }))
    } else {
      setError(data.error ?? 'AI generation failed')
    }
    setGeneratingJd(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const payload = {
      title: form.title,
      description: form.description,
      requirements: form.requirements.split('\n').filter(Boolean),
      responsibilities: form.responsibilities.split('\n').filter(Boolean),
      skillsRequired: form.skillsRequired.split(',').map(s => s.trim()).filter(Boolean),
      skillsPreferred: form.skillsPreferred.split(',').map(s => s.trim()).filter(Boolean),
      jobType: form.jobType,
      workMode: form.workMode,
      location: form.location || undefined,
      salaryMin: form.salaryMin ? parseInt(form.salaryMin) : undefined,
      salaryMax: form.salaryMax ? parseInt(form.salaryMax) : undefined,
      salaryVisible: form.salaryVisible,
      experienceMin: form.experienceMin ? parseInt(form.experienceMin) : undefined,
      experienceMax: form.experienceMax ? parseInt(form.experienceMax) : undefined,
      educationLevel: form.educationLevel || undefined,
      closesAt: form.closesAt ? new Date(form.closesAt).toISOString() : undefined,
      status: form.status,
    }

    const res = await fetch('/api/jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? 'Failed to create job')
      setLoading(false)
    } else {
      router.push('/employer/jobs')
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface)' }}>
      {/* Nav */}
      <nav style={{ background: '#fff', borderBottom: '1.5px solid var(--border)', padding: '0 1.5rem', position: 'sticky', top: 0, zIndex: 50 }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', height: '60px', justifyContent: 'space-between' }}>
          <Link href="/employer/jobs" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '7px', background: 'linear-gradient(135deg, var(--royal), var(--electric))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '0.85rem' }}>T</div>
            <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--ink)' }}>TalentAI<span style={{ color: 'var(--royal)' }}>.lk</span></span>
          </Link>
          <Link href="/employer/jobs" style={{ fontSize: '0.85rem', color: 'var(--royal)' }}>← Back</Link>
        </div>
      </nav>

      <div className="container" style={{ padding: '32px 1.5rem', maxWidth: '760px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h1 style={{ fontFamily: 'var(--ff-serif)', fontSize: 'clamp(1.4rem, 3vw, 1.9rem)' }}>Post a new job</h1>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={handleAiJd}
            disabled={generatingJd}
            style={{ fontSize: '0.83rem' }}
          >
            {generatingJd ? '✨ Generating…' : '✨ AI write JD'}
          </button>
        </div>

        {error && (
          <div style={{ background: 'var(--coral-pale)', border: '1px solid rgba(255,79,110,0.2)', borderRadius: 'var(--r-sm)', padding: '12px 16px', marginBottom: '16px', fontSize: '0.875rem', color: 'var(--coral)' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Basic info */}
          <section className="card" style={{ padding: '24px' }}>
            <h2 style={{ fontFamily: 'var(--ff)', fontWeight: 700, fontSize: '0.78rem', color: 'var(--ink-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '16px' }}>Basic information</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={lbl}>Job title *</label>
                <input className="input" value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Senior Software Engineer" required />
              </div>
              <div>
                <label style={lbl}>Job type *</label>
                <select className="input" value={form.jobType} onChange={e => set('jobType', e.target.value)} required>
                  <option value="full_time">Full time</option>
                  <option value="part_time">Part time</option>
                  <option value="contract">Contract</option>
                  <option value="internship">Internship</option>
                  <option value="freelance">Freelance</option>
                </select>
              </div>
              <div>
                <label style={lbl}>Work mode *</label>
                <select className="input" value={form.workMode} onChange={e => set('workMode', e.target.value)} required>
                  <option value="onsite">Onsite</option>
                  <option value="remote">Remote</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </div>
              <div>
                <label style={lbl}>Location</label>
                <input className="input" value={form.location} onChange={e => set('location', e.target.value)} placeholder="Colombo, Sri Lanka" />
              </div>
              <div>
                <label style={lbl}>Closes on</label>
                <input className="input" type="date" value={form.closesAt} onChange={e => set('closesAt', e.target.value)} />
              </div>
            </div>
          </section>

          {/* Description */}
          <section className="card" style={{ padding: '24px' }}>
            <h2 style={{ fontFamily: 'var(--ff)', fontWeight: 700, fontSize: '0.78rem', color: 'var(--ink-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '16px' }}>Description *</h2>
            <textarea
              className="input"
              value={form.description}
              onChange={e => set('description', e.target.value)}
              placeholder="Describe the role, team, and company culture…"
              rows={7}
              style={{ resize: 'vertical' }}
              required
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginTop: '14px' }}>
              <div>
                <label style={lbl}>Requirements (one per line)</label>
                <textarea className="input" value={form.requirements} onChange={e => set('requirements', e.target.value)} placeholder="3+ years of React experience&#10;Strong TypeScript skills" rows={4} style={{ resize: 'vertical' }} />
              </div>
              <div>
                <label style={lbl}>Responsibilities (one per line)</label>
                <textarea className="input" value={form.responsibilities} onChange={e => set('responsibilities', e.target.value)} placeholder="Build and maintain frontend&#10;Code reviews" rows={4} style={{ resize: 'vertical' }} />
              </div>
            </div>
          </section>

          {/* Skills */}
          <section className="card" style={{ padding: '24px' }}>
            <h2 style={{ fontFamily: 'var(--ff)', fontWeight: 700, fontSize: '0.78rem', color: 'var(--ink-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '16px' }}>Skills</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={lbl}>Required skills * (comma-separated)</label>
                <input className="input" value={form.skillsRequired} onChange={e => set('skillsRequired', e.target.value)} placeholder="React, TypeScript, Node.js" required />
              </div>
              <div>
                <label style={lbl}>Preferred skills (comma-separated)</label>
                <input className="input" value={form.skillsPreferred} onChange={e => set('skillsPreferred', e.target.value)} placeholder="GraphQL, AWS, Docker" />
              </div>
            </div>
          </section>

          {/* Salary & Experience */}
          <section className="card" style={{ padding: '24px' }}>
            <h2 style={{ fontFamily: 'var(--ff)', fontWeight: 700, fontSize: '0.78rem', color: 'var(--ink-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '16px' }}>Compensation & Experience</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '14px' }}>
              <div>
                <label style={lbl}>Min salary (LKR)</label>
                <input className="input" type="number" value={form.salaryMin} onChange={e => set('salaryMin', e.target.value)} placeholder="80000" />
              </div>
              <div>
                <label style={lbl}>Max salary (LKR)</label>
                <input className="input" type="number" value={form.salaryMax} onChange={e => set('salaryMax', e.target.value)} placeholder="150000" />
              </div>
              <div>
                <label style={lbl}>Min experience (yrs)</label>
                <input className="input" type="number" value={form.experienceMin} onChange={e => set('experienceMin', e.target.value)} placeholder="2" />
              </div>
              <div>
                <label style={lbl}>Max experience (yrs)</label>
                <input className="input" type="number" value={form.experienceMax} onChange={e => set('experienceMax', e.target.value)} placeholder="6" />
              </div>
            </div>
            <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                id="salaryVisible"
                checked={form.salaryVisible}
                onChange={e => set('salaryVisible', e.target.checked)}
                style={{ width: '16px', height: '16px', cursor: 'pointer' }}
              />
              <label htmlFor="salaryVisible" style={{ fontSize: '0.83rem', color: 'var(--ink-soft)', cursor: 'pointer' }}>
                Show salary range to candidates
              </label>
            </div>
          </section>

          {/* Submit */}
          <div style={{ display: 'flex', gap: '10px', paddingBottom: '32px' }}>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              onClick={() => set('status', 'active')}
            >
              {loading ? 'Publishing…' : 'Publish job'}
            </button>
            <button
              type="submit"
              className="btn btn-ghost"
              disabled={loading}
              onClick={() => set('status', 'draft')}
            >
              Save as draft
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const lbl: React.CSSProperties = {
  display: 'block', fontSize: '0.78rem', fontWeight: 600,
  color: 'var(--ink-soft)', marginBottom: '5px',
}
