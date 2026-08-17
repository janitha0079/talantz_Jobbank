'use client'

import { ChangeEvent, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { SiteHeader } from '@/components/navigation/SiteHeader'

interface Experience {
  id: string
  title: string
  company: string
  location: string | null
  startDate: string | null
  endDate: string | null
  isCurrent: boolean
  description: string | null
}

interface Education {
  id: string
  institution: string
  degree: string | null
  field: string | null
  startYear: number | null
  endYear: number | null
}

interface Certification {
  id: string
  name: string
  issuer: string | null
  issuedDate: string | null
  expiryDate: string | null
  credentialUrl: string | null
  validation?: {
    status: 'validated' | 'review' | 'unverified'
    score: number
    summary: string
    issuerConfidence: 'high' | 'medium' | 'low'
    validationMethod: 'ai' | 'heuristic'
    employerVisible: boolean
  }
}

interface Profile {
  fullName: string | null
  headline: string | null
  summary: string | null
  location: string | null
  phone: string | null
  avatarUrl: string | null
  linkedinUrl: string | null
  availability: string | null
  skills: string[]
  aiProfileScore: number | null
  isPublic?: boolean
  experiences: Experience[]
  educations: Education[]
  certifications: Certification[]
}

const AVAILABILITY_LABELS: Record<string, string> = {
  immediately: 'Available immediately',
  one_month: 'Available in 1 month',
  three_months: 'Available in 3 months',
  not_looking: 'Not actively looking',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.78rem',
  fontWeight: 600,
  color: 'var(--ink-soft)',
  marginBottom: '5px',
}

export function ProfileScreen() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [form, setForm] = useState<Partial<Profile>>({})
  const [skillInput, setSkillInput] = useState('')
  const [enhancing, setEnhancing] = useState(false)
  const [avatarError, setAvatarError] = useState<string | null>(null)
  const [certForm, setCertForm] = useState({
    name: '',
    issuer: '',
    issuedDate: '',
    expiryDate: '',
    credentialUrl: '',
  })
  const [certSaving, setCertSaving] = useState(false)
  const [certError, setCertError] = useState<string | null>(null)
  const [removingCertId, setRemovingCertId] = useState<string | null>(null)

  async function loadProfile() {
    const res = await fetch('/api/profile/me')
    const data = await res.json()
    if (data.data) {
      setProfile(data.data)
      setForm(data.data)
    }
  }

  useEffect(() => {
    loadProfile()
      .finally(() => setLoading(false))
  }, [])

  async function handleAddCertification() {
    if (!certForm.name.trim()) {
      setCertError('Certificate name is required.')
      return
    }

    setCertSaving(true)
    setCertError(null)
    const res = await fetch('/api/profile/certifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: certForm.name.trim(),
        issuer: certForm.issuer.trim() || null,
        issuedDate: certForm.issuedDate || null,
        expiryDate: certForm.expiryDate || null,
        credentialUrl: certForm.credentialUrl.trim() || null,
      }),
    })
    const data = await res.json()
    if (!res.ok) {
      setCertError(data.error ?? 'Could not save certification.')
    } else {
      const nextCertifications = [data.data, ...(profile?.certifications ?? [])]
      const nextProfile = profile ? { ...profile, certifications: nextCertifications } : null
      if (nextProfile) {
        setProfile(nextProfile)
        setForm((current) => ({ ...current, certifications: nextCertifications }))
      }
      setCertForm({ name: '', issuer: '', issuedDate: '', expiryDate: '', credentialUrl: '' })
    }
    setCertSaving(false)
  }

  async function handleDeleteCertification(id: string) {
    setRemovingCertId(id)
    const res = await fetch(`/api/profile/certifications/${id}`, { method: 'DELETE' })
    if (res.ok) {
      const nextCertifications = (profile?.certifications ?? []).filter((cert) => cert.id !== id)
      const nextProfile = profile ? { ...profile, certifications: nextCertifications } : null
      if (nextProfile) {
        setProfile(nextProfile)
        setForm((current) => ({ ...current, certifications: nextCertifications }))
      }
    }
    setRemovingCertId(null)
  }

  useEffect(() => {
    setCertError(null)
  }, [certForm.name, certForm.issuer, certForm.issuedDate, certForm.expiryDate, certForm.credentialUrl])

  async function handleSave() {
    setSaving(true)
    setSaveError(null)
    const res = await fetch('/api/profile/me', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (!res.ok) {
      setSaveError(data.error ?? 'Save failed')
    } else {
      const next = { ...profile, ...form, ...(data.data ?? {}) } as Profile
      setProfile(next)
      setForm(next)
      setEditing(false)
    }
    setSaving(false)
  }

  async function handleAiSkills() {
    setEnhancing(true)
    const res = await fetch('/api/profile/ai-enhance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'suggest_skills' }),
    })
    const data = await res.json()
    if (res.ok && data.data?.suggestions) {
      const existing = new Set(form.skills ?? [])
      const merged = [...(form.skills ?? []), ...data.data.suggestions.filter((s: string) => !existing.has(s))]
      setForm((f) => ({ ...f, skills: merged }))
    }
    setEnhancing(false)
  }

  function addSkill() {
    const nextSkill = skillInput.trim()
    if (nextSkill && !(form.skills ?? []).includes(nextSkill)) {
      setForm((f) => ({ ...f, skills: [...(f.skills ?? []), nextSkill] }))
    }
    setSkillInput('')
  }

  function removeSkill(skill: string) {
    setForm((f) => ({ ...f, skills: (f.skills ?? []).filter((s) => s !== skill) }))
  }

  function handleAvatarChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setAvatarError('Please choose an image file.')
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      setAvatarError('Profile image must be under 2MB.')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : ''
      setForm((current) => ({ ...current, avatarUrl: result }))
      setAvatarError(null)
    }
    reader.onerror = () => setAvatarError('Could not read that image. Please try a different file.')
    reader.readAsDataURL(file)
  }

  const checklist = useMemo(() => {
    if (!profile) return []
    return [
      { label: 'Profile image added', done: !!profile.avatarUrl },
      { label: 'Headline added', done: !!profile.headline },
      { label: 'Summary written', done: !!profile.summary && profile.summary.length > 40 },
      { label: 'LinkedIn added', done: !!profile.linkedinUrl },
      { label: '3+ skills listed', done: (profile.skills?.length ?? 0) >= 3 },
      { label: 'Experience added', done: (profile.experiences?.length ?? 0) > 0 },
      {
        label: 'Validated certificate added',
        done: (profile.certifications ?? []).some((certification) => certification.validation?.employerVisible),
      },
    ]
  }, [profile])

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--ink-muted)', fontSize: '0.875rem' }}>Loading profile...</p>
      </div>
    )
  }

  const displayProfile = editing ? form : profile
  const completedCount = checklist.filter((item) => item.done).length

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #eef2ff 0%, #f7f9ff 24%, #ffffff 100%)' }}>
      <SiteHeader role="job_seeker" current="/profile" subtitle="Job seeker profile" />

      <div className="container" style={{ padding: '28px 1.5rem 52px', maxWidth: '1120px' }}>
        <div style={{ display: 'grid', gap: '18px', marginBottom: '22px' }}>
          <section className="card" style={{ padding: '28px', borderRadius: '28px', background: 'linear-gradient(145deg, #07114c 0%, #0d1a66 38%, #1432b2 100%)', color: '#fff', borderColor: 'rgba(255,255,255,0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px', flexWrap: 'wrap' }}>
              {profile?.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={profile.fullName || 'Profile image'}
                  style={{ width: '72px', height: '72px', borderRadius: '24px', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.2)' }}
                />
              ) : (
                <div style={{ width: '72px', height: '72px', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.12)', fontSize: '1.5rem', fontWeight: 700 }}>
                  {(profile?.fullName || 'P').slice(0, 1).toUpperCase()}
                </div>
              )}
              <div>
                <p style={{ fontSize: '0.76rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.72)', marginBottom: '6px' }}>Candidate profile</p>
                <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.78)' }}>
                  Add a profile image and validated certificates to strengthen employer trust.
                </p>
              </div>
            </div>
            <h1 style={{ fontFamily: 'var(--ff-serif)', fontSize: 'clamp(2rem, 4vw, 3rem)', marginBottom: '8px', color: '#fff' }}>
              {profile?.fullName || 'Complete your profile'}
            </h1>
            <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.82)', marginBottom: '14px' }}>
              {profile?.headline || 'Add a strong headline so employers understand the kind of role you want next.'}
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '18px' }}>
              {profile?.location && <span className="badge" style={{ background: 'rgba(255,255,255,0.12)', color: '#fff' }}>{profile.location}</span>}
              {profile?.availability && <span className="badge" style={{ background: 'rgba(255,255,255,0.12)', color: '#fff' }}>{AVAILABILITY_LABELS[profile.availability]}</span>}
              <span className="badge" style={{ background: 'rgba(255,255,255,0.12)', color: '#fff' }}>{profile?.isPublic === false ? 'Private profile' : 'Public profile'}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
              <div style={{ flex: 1, maxWidth: '240px', height: '7px', background: 'rgba(255,255,255,0.18)', borderRadius: '100px', overflow: 'hidden' }}>
                <div style={{ width: `${profile?.aiProfileScore ?? 0}%`, height: '100%', background: 'linear-gradient(90deg, #f5b800, #fff1a5)', borderRadius: '100px' }} />
              </div>
              <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.82)' }}>{profile?.aiProfileScore ?? 0}% complete</span>
            </div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {!editing ? (
                <button className="btn btn-gold" onClick={() => { setEditing(true); setSaveError(null) }}>
                  Edit profile
                </button>
              ) : (
                <>
                  <button className="btn btn-gold" onClick={handleSave} disabled={saving}>
                    {saving ? 'Saving...' : 'Save changes'}
                  </button>
                  <button className="btn" onClick={() => { setEditing(false); setForm(profile ?? {}); setSaveError(null) }} style={{ background: 'rgba(255,255,255,0.12)', color: '#fff', border: '1px solid rgba(255,255,255,0.16)' }}>
                    Cancel
                  </button>
                </>
              )}
              <Link href="/jobs" className="btn" style={{ background: '#fff', color: 'var(--royal-deep)' }}>Browse jobs</Link>
            </div>
          </section>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '18px' }}>
            <section className="card" style={{ padding: '22px', borderRadius: '24px' }}>
              <p style={{ fontSize: '0.76rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--royal)', marginBottom: '10px' }}>Profile checklist</p>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '12px' }}>{completedCount}/{checklist.length} key items done</h2>
              <div style={{ display: 'grid', gap: '8px' }}>
                {checklist.map((item) => (
                  <div key={item.label} style={{ padding: '10px 12px', borderRadius: '14px', background: item.done ? 'var(--green-pale)' : 'var(--surface)', color: item.done ? '#15803D' : 'var(--ink-soft)', fontSize: '0.86rem', fontWeight: 600 }}>
                    {item.done ? 'Done' : 'Pending'}: {item.label}
                  </div>
                ))}
              </div>
            </section>

            <section className="card" style={{ padding: '22px', borderRadius: '24px', background: 'linear-gradient(180deg, #ffffff, #f8fbff)' }}>
              <p style={{ fontSize: '0.76rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--royal)', marginBottom: '10px' }}>Quick actions</p>
              <div style={{ display: 'grid', gap: '10px' }}>
                <ActionCard title={profile?.linkedinUrl ? 'Update LinkedIn link' : 'Add LinkedIn profile'} body="Adding your LinkedIn URL helps complete your profile faster." onClick={() => setEditing(true)} />
                <ActionCard title={profile?.avatarUrl ? 'Refresh profile image' : 'Add profile image'} body="Upload a photo directly from your device and preview it instantly." onClick={() => setEditing(true)} />
                <ActionCard title="Manage experience" body="Add or update your work history in one place." href="/profile/experience" />
                <ActionCard title="View applications" body="See where you have applied and track progress." href="/applications" />
              </div>
            </section>
          </div>
        </div>

        {saveError && (
          <div style={{ background: 'var(--coral-pale)', border: '1px solid rgba(255,79,110,0.2)', borderRadius: 'var(--r-sm)', padding: '12px 16px', marginBottom: '16px', fontSize: '0.875rem', color: 'var(--coral)' }}>
            {saveError}
          </div>
        )}

        <div style={{ display: 'grid', gap: '16px' }}>
          <section className="card" style={{ padding: '24px', borderRadius: '24px' }}>
            <SectionHeader title="About you" eyebrow="Personal information" />
            {editing ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
              {[
                { key: 'fullName', label: 'Full name', placeholder: 'Nishani Kumari' },
                { key: 'headline', label: 'Headline', placeholder: 'Senior Software Engineer' },
                { key: 'location', label: 'Location', placeholder: 'Colombo, Sri Lanka' },
                { key: 'phone', label: 'Phone', placeholder: '+94 77 000 0000' },
                { key: 'linkedinUrl', label: 'LinkedIn URL', placeholder: 'https://linkedin.com/in/...' },
              ].map(({ key, label, placeholder }) => (
                  <div key={key}>
                    <label style={labelStyle}>{label}</label>
                    <input className="input" value={(form as Record<string, string | undefined>)[key] ?? ''} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))} placeholder={placeholder} />
                  </div>
                ))}
                <div>
                  <label style={labelStyle}>Availability</label>
                  <select className="input" value={form.availability ?? ''} onChange={(e) => setForm((f) => ({ ...f, availability: e.target.value || null }))}>
                    <option value="">Not specified</option>
                    {Object.entries(AVAILABILITY_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
                <div style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: '112px minmax(0, 1fr)', gap: '16px', alignItems: 'center', padding: '16px', borderRadius: '18px', background: 'var(--surface)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {form.avatarUrl ? (
                      <img
                        src={form.avatarUrl}
                        alt="Profile preview"
                        style={{ width: '88px', height: '88px', objectFit: 'cover', borderRadius: '22px' }}
                      />
                    ) : (
                      <div style={{ width: '88px', height: '88px', borderRadius: '22px', background: '#dbe7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--royal)', fontSize: '1.8rem', fontWeight: 700 }}>
                        {(form.fullName || 'P').slice(0, 1).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div>
                    <label style={labelStyle}>Profile image</label>
                    <input type="file" accept="image/*" onChange={handleAvatarChange} />
                    <p style={{ marginTop: '8px', fontSize: '0.8rem', color: 'var(--ink-muted)' }}>
                      JPG, PNG, or WebP up to 2MB.
                    </p>
                    {avatarError && <p style={{ marginTop: '6px', fontSize: '0.8rem', color: 'var(--coral)' }}>{avatarError}</p>}
                  </div>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={labelStyle}>Summary</label>
                  <textarea className="input" value={form.summary ?? ''} onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))} placeholder="Write a short professional summary..." rows={4} style={{ resize: 'vertical' }} />
                </div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                <InfoCard label="Name" value={displayProfile?.fullName || 'Add your full name'} />
                <InfoCard label="Headline" value={displayProfile?.headline || 'Add your professional headline'} />
                <InfoCard label="Location" value={displayProfile?.location || 'Add your location'} />
                <InfoCard label="Phone" value={displayProfile?.phone || 'Add your phone'} />
                <InfoCard label="Profile image" value={displayProfile?.avatarUrl ? 'Image added' : 'Add a profile image'} />
                <InfoCard label="Availability" value={displayProfile?.availability ? AVAILABILITY_LABELS[displayProfile.availability] : 'Set your availability'} />
                <InfoCard label="LinkedIn" value={displayProfile?.linkedinUrl || 'Add your LinkedIn URL'} />
                <div className="card" style={{ gridColumn: '1 / -1', padding: '18px', background: 'var(--surface)' }}>
                  <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--ink-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>Summary</p>
                  <p style={{ fontSize: '0.9rem', color: 'var(--ink-soft)', lineHeight: 1.7 }}>
                    {displayProfile?.summary || 'Add a summary to introduce your background, strengths, and what kinds of roles you want next.'}
                  </p>
                </div>
              </div>
            )}
          </section>

          <section className="card" style={{ padding: '24px', borderRadius: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap' }}>
              <SectionHeader title="Skills" eyebrow="What you are strong at" />
              {editing && (
                <button className="btn btn-ghost" onClick={handleAiSkills} disabled={enhancing} style={{ fontSize: '0.78rem', padding: '5px 12px' }}>
                  {enhancing ? 'Generating...' : 'AI suggest skills'}
                </button>
              )}
            </div>
            {editing ? (
              <>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
                  <input className="input" value={skillInput} onChange={(e) => setSkillInput(e.target.value)} placeholder="Add a skill..." onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())} style={{ flex: 1, minWidth: '220px' }} />
                  <button className="btn btn-ghost" onClick={addSkill}>Add</button>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {(form.skills ?? []).map((skill) => (
                    <span key={skill} className="badge badge-royal" style={{ cursor: 'pointer', paddingRight: '8px' }} onClick={() => removeSkill(skill)}>
                      {skill} <span style={{ marginLeft: '4px', opacity: 0.65 }}>x</span>
                    </span>
                  ))}
                </div>
              </>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {(displayProfile?.skills ?? []).length === 0
                  ? <p style={{ fontSize: '0.9rem', color: 'var(--ink-muted)' }}>No skills added yet.</p>
                  : (displayProfile?.skills ?? []).map((skill) => <span key={skill} className="badge badge-royal">{skill}</span>)
                }
              </div>
            )}
          </section>

          <section className="card" style={{ padding: '24px', borderRadius: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap' }}>
              <SectionHeader title="Experience" eyebrow="Your recent work history" />
              <Link href="/profile/experience" className="btn btn-ghost" style={{ fontSize: '0.8rem', padding: '6px 14px' }}>Manage experience</Link>
            </div>
            {(displayProfile?.experiences ?? []).length === 0 ? (
              <EmptyState message="No experience added yet." ctaHref="/profile/experience" ctaLabel="Add experience" />
            ) : (
              <div style={{ display: 'grid', gap: '12px' }}>
                {(displayProfile?.experiences ?? []).map((exp) => (
                  <div key={exp.id} className="card" style={{ padding: '18px', background: 'var(--surface)' }}>
                    <p style={{ fontWeight: 700, fontSize: '0.98rem', color: 'var(--ink)' }}>{exp.title}</p>
                    <p style={{ fontSize: '0.86rem', color: 'var(--royal)', marginTop: '3px' }}>{exp.company}</p>
                    <p style={{ fontSize: '0.8rem', color: 'var(--ink-muted)', marginTop: '4px' }}>
                      {formatMonthYear(exp.startDate)} - {exp.isCurrent ? 'Present' : formatMonthYear(exp.endDate)}
                      {exp.location ? ` | ${exp.location}` : ''}
                    </p>
                    {exp.description && <p style={{ fontSize: '0.88rem', color: 'var(--ink-soft)', marginTop: '8px', lineHeight: 1.7 }}>{exp.description}</p>}
                  </div>
                ))}
              </div>
            )}
          </section>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            <section className="card" style={{ padding: '24px', borderRadius: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap' }}>
                <SectionHeader title="Education" eyebrow="Academic background" />
              </div>
              {(displayProfile?.educations ?? []).length === 0 ? (
                <p style={{ fontSize: '0.9rem', color: 'var(--ink-muted)' }}>No education added yet.</p>
              ) : (
                <div style={{ display: 'grid', gap: '10px' }}>
                  {(displayProfile?.educations ?? []).map((education) => (
                    <div key={education.id} style={{ padding: '14px', borderRadius: '16px', background: 'var(--surface)' }}>
                      <p style={{ fontWeight: 700, color: 'var(--ink)' }}>{education.institution}</p>
                      <p style={{ fontSize: '0.86rem', color: 'var(--ink-soft)' }}>
                        {[education.degree, education.field].filter(Boolean).join(' | ') || 'Education details added'}
                      </p>
                      <p style={{ fontSize: '0.78rem', color: 'var(--ink-muted)', marginTop: '4px' }}>
                        {[education.startYear, education.endYear].filter(Boolean).join(' - ') || 'Dates not set'}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="card" style={{ padding: '24px', borderRadius: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap' }}>
                <SectionHeader title="Certifications" eyebrow="Extra credentials" />
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--ink-muted)', marginBottom: '14px' }}>
                AI checks the certificate details you provide. Employers only see certificates that pass validation.
              </p>
              <div style={{ display: 'grid', gap: '10px', marginBottom: '16px' }}>
                <input
                  className="input"
                  value={certForm.name}
                  onChange={(e) => setCertForm((current) => ({ ...current, name: e.target.value }))}
                  placeholder="Certificate name"
                />
                <input
                  className="input"
                  value={certForm.issuer}
                  onChange={(e) => setCertForm((current) => ({ ...current, issuer: e.target.value }))}
                  placeholder="Issuing body"
                />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
                  <input
                    className="input"
                    type="date"
                    value={certForm.issuedDate}
                    onChange={(e) => setCertForm((current) => ({ ...current, issuedDate: e.target.value }))}
                  />
                  <input
                    className="input"
                    type="date"
                    value={certForm.expiryDate}
                    onChange={(e) => setCertForm((current) => ({ ...current, expiryDate: e.target.value }))}
                  />
                </div>
                <input
                  className="input"
                  value={certForm.credentialUrl}
                  onChange={(e) => setCertForm((current) => ({ ...current, credentialUrl: e.target.value }))}
                  placeholder="Credential or verification URL"
                />
                {certError && <p style={{ fontSize: '0.82rem', color: 'var(--coral)' }}>{certError}</p>}
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <p style={{ fontSize: '0.8rem', color: 'var(--ink-muted)' }}>
                    Add industry certifications here. Verification links improve employer visibility.
                  </p>
                  <button className="btn btn-primary" type="button" onClick={handleAddCertification} disabled={certSaving}>
                    {certSaving ? 'Validating...' : 'Add certificate'}
                  </button>
                </div>
              </div>

              {(displayProfile?.certifications ?? []).length === 0 ? (
                <p style={{ fontSize: '0.9rem', color: 'var(--ink-muted)' }}>No certifications added yet.</p>
              ) : (
                <div style={{ display: 'grid', gap: '10px' }}>
                  {(displayProfile?.certifications ?? []).map((certification) => (
                    <div key={certification.id} style={{ padding: '14px', borderRadius: '16px', background: 'var(--surface)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                        <div>
                          <p style={{ fontWeight: 700, color: 'var(--ink)' }}>{certification.name}</p>
                          <p style={{ fontSize: '0.86rem', color: 'var(--ink-soft)' }}>{certification.issuer || 'Issuer not added'}</p>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                          <ValidationBadge validation={certification.validation} showEmployerVisibility />
                          <button
                            type="button"
                            className="btn btn-ghost"
                            onClick={() => handleDeleteCertification(certification.id)}
                            disabled={removingCertId === certification.id}
                            style={{ fontSize: '0.78rem', padding: '4px 10px' }}
                          >
                            {removingCertId === certification.id ? 'Removing...' : 'Remove'}
                          </button>
                        </div>
                      </div>
                      <p style={{ fontSize: '0.78rem', color: 'var(--ink-muted)', marginTop: '6px' }}>
                        {certification.issuedDate ? `Issued ${formatMonthYear(certification.issuedDate)}` : 'Issue date not set'}
                        {certification.expiryDate ? ` | Expires ${formatMonthYear(certification.expiryDate)}` : ' | No expiry date'}
                      </p>
                      {certification.credentialUrl && (
                        <p style={{ fontSize: '0.8rem', color: 'var(--royal)', marginTop: '6px', wordBreak: 'break-all' }}>
                          {certification.credentialUrl}
                        </p>
                      )}
                      {certification.validation && (
                        <p style={{ fontSize: '0.82rem', color: 'var(--ink-soft)', marginTop: '8px', lineHeight: 1.6 }}>
                          {certification.validation.summary} Validation score: {certification.validation.score}/100. {certification.validation.employerVisible ? 'Employers can see this certificate.' : 'This certificate is currently marked not verified for employers.'}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* AI Tools Section */}
              <div style={{ marginTop: '48px', paddingTop: '32px', borderTop: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap' }}>
                  <SectionHeader title="AI Tools" eyebrow="Powered by Claude" />
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--ink-muted)', marginBottom: '16px' }}>
                  Enhance your profile with AI. Get cover letters, practice interviews, and more. Free tier includes limited access.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
                  <ActionCard
                    title="Profile Enhancement"
                    body="AI-powered suggestions to improve your bullet points"
                    href="/pricing"
                  />
                  <ActionCard
                    title="Cover Letter Generator"
                    body="Create personalized cover letters in seconds"
                    href="/pricing"
                  />
                  <ActionCard
                    title="Interview Prep"
                    body="Practice with AI-powered mock interviews"
                    href="/pricing"
                  />
                  <ActionCard
                    title="Skill Suggestions"
                    body="AI recommends skills based on your experience"
                    href="/pricing"
                  />
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--ink-muted)', marginTop: '16px' }}>
                  <Link href="/pricing" style={{ color: 'var(--royal)', textDecoration: 'none', fontWeight: 600 }}>View pricing plans</Link> to unlock unlimited AI features
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}

function SectionHeader({ title, eyebrow }: { title: string; eyebrow: string }) {
  return (
    <div>
      <p style={{ fontSize: '0.76rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--royal)', marginBottom: '8px' }}>{eyebrow}</p>
      <h2 style={{ fontSize: '1.6rem' }}>{title}</h2>
    </div>
  )
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="card" style={{ padding: '18px', background: 'var(--surface)' }}>
      <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--ink-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>{label}</p>
      <p style={{ fontSize: '0.9rem', color: 'var(--ink-soft)' }}>{value}</p>
    </div>
  )
}

function ActionCard({
  title,
  body,
  href,
  onClick,
}: {
  title: string
  body: string
  href?: string
  onClick?: () => void
}) {
  if (href) {
    return (
      <Link href={href} style={{ padding: '14px 16px', borderRadius: '16px', border: '1px solid var(--border)', background: '#fff', textDecoration: 'none' }}>
        <p style={{ fontWeight: 700, color: 'var(--ink)', marginBottom: '4px' }}>{title}</p>
        <p style={{ fontSize: '0.82rem', color: 'var(--ink-muted)' }}>{body}</p>
      </Link>
    )
  }

  return (
    <button type="button" onClick={onClick} style={{ textAlign: 'left', padding: '14px 16px', borderRadius: '16px', border: '1px solid var(--border)', background: '#fff', cursor: 'pointer', fontFamily: 'var(--ff)' }}>
      <p style={{ fontWeight: 700, color: 'var(--ink)', marginBottom: '4px' }}>{title}</p>
      <p style={{ fontSize: '0.82rem', color: 'var(--ink-muted)' }}>{body}</p>
    </button>
  )
}

function EmptyState({ message, ctaHref, ctaLabel }: { message: string; ctaHref: string; ctaLabel: string }) {
  return (
    <div style={{ padding: '18px', borderRadius: '18px', background: 'var(--surface)' }}>
      <p style={{ fontSize: '0.9rem', color: 'var(--ink-muted)', marginBottom: '10px' }}>{message}</p>
      <Link href={ctaHref} className="btn btn-primary" style={{ fontSize: '0.82rem' }}>{ctaLabel}</Link>
    </div>
  )
}

function ValidationBadge({
  validation,
  showEmployerVisibility = false,
}: {
  validation?: Certification['validation']
  showEmployerVisibility?: boolean
}) {
  if (!validation) {
    return <span className="badge">Pending review</span>
  }

  const palette = validation.status === 'validated'
    ? { bg: '#dcfce7', color: '#166534', label: showEmployerVisibility ? 'Verified' : 'Validated', icon: '✓' }
    : validation.status === 'review'
      ? { bg: '#fef3c7', color: '#92400e', label: 'Needs review', icon: '!' }
      : { bg: '#fee2e2', color: '#b91c1c', label: showEmployerVisibility ? 'Not verified' : 'Unverified', icon: '×' }

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '4px 10px',
        borderRadius: '999px',
        background: palette.bg,
        color: palette.color,
        fontSize: '0.76rem',
        fontWeight: 700,
      }}
    >
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '18px',
          height: '18px',
          borderRadius: '999px',
          background: 'rgba(255,255,255,0.72)',
          color: palette.color,
          fontSize: '0.72rem',
          lineHeight: 1,
        }}
      >
        {palette.icon}
      </span>
      {palette.label}
    </span>
  )
}

function formatMonthYear(value: string | null | undefined) {
  if (!value) return 'Date not set'
  return new Date(value).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
}
