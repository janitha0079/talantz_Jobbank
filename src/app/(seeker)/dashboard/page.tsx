'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { SiteHeader } from '@/components/navigation/SiteHeader'

export default function CandidateDashboard() {
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/auth/session')
      .then((r) => r.json())
      .then((data) => setSession(data.user))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center', minHeight: '100vh', background: 'var(--surface)' }}>Loading...</div>
  }

  const firstName = session?.email?.split('@')[0] || 'Candidate'

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface)' }}>
      <SiteHeader role="job_seeker" current="/dashboard" />

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '48px 24px' }}>
        {/* Welcome Section */}
        <div style={{ marginBottom: '56px' }}>
          <h1 style={{
            fontSize: 'clamp(2rem, 5vw, 3.5rem)',
            fontWeight: 800,
            marginBottom: '16px',
            fontFamily: 'var(--ff-serif)',
            color: 'var(--ink)',
          }}>
            Welcome back, {firstName}!
          </h1>
          <p style={{
            fontSize: '1.125rem',
            color: 'var(--ink-muted)',
            maxWidth: '600px',
          }}>
            Your AI-scored profile helps you stand out to employers. Build your profile, explore jobs, and apply with confidence.
          </p>
        </div>

        {/* Quick Action Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '24px',
          marginBottom: '56px',
        }}>
          {/* Build Profile Card */}
          <Link href="/profile" style={{ textDecoration: 'none' }}>
            <div style={{
              background: '#fff',
              border: '1px solid var(--border)',
              borderRadius: '16px',
              padding: '32px',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 10px 30px rgba(27, 61, 224, 0.15)'
              e.currentTarget.style.transform = 'translateY(-4px)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = 'none'
              e.currentTarget.style.transform = 'translateY(0)'
            }}>
              <div style={{ fontSize: '32px', marginBottom: '16px' }}>📋</div>
              <h3 style={{
                fontSize: '20px',
                fontWeight: 700,
                marginBottom: '12px',
                color: 'var(--ink)',
              }}>
                Build Your Profile
              </h3>
              <p style={{
                fontSize: '14px',
                color: 'var(--ink-muted)',
                marginBottom: '20px',
                lineHeight: 1.6,
              }}>
                Add your experience, education, and skills. Get AI-scored to see how well you match jobs.
              </p>
              <div style={{
                color: 'var(--royal)',
                fontWeight: 600,
                fontSize: '14px',
              }}>
                Start building →
              </div>
            </div>
          </Link>

          {/* Browse Jobs Card */}
          <Link href="/jobs" style={{ textDecoration: 'none' }}>
            <div style={{
              background: '#fff',
              border: '1px solid var(--border)',
              borderRadius: '16px',
              padding: '32px',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 10px 30px rgba(27, 61, 224, 0.15)'
              e.currentTarget.style.transform = 'translateY(-4px)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = 'none'
              e.currentTarget.style.transform = 'translateY(0)'
            }}>
              <div style={{ fontSize: '32px', marginBottom: '16px' }}>🔍</div>
              <h3 style={{
                fontSize: '20px',
                fontWeight: 700,
                marginBottom: '12px',
                color: 'var(--ink)',
              }}>
                Browse Jobs
              </h3>
              <p style={{
                fontSize: '14px',
                color: 'var(--ink-muted)',
                marginBottom: '20px',
                lineHeight: 1.6,
              }}>
                Find roles that match your skills. See your AI match score for each position.
              </p>
              <div style={{
                color: 'var(--royal)',
                fontWeight: 600,
                fontSize: '14px',
              }}>
                Explore jobs →
              </div>
            </div>
          </Link>

          {/* AI Features Card */}
          <Link href="/pricing" style={{ textDecoration: 'none' }}>
            <div style={{
              background: '#fff',
              border: '1px solid var(--border)',
              borderRadius: '16px',
              padding: '32px',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 10px 30px rgba(27, 61, 224, 0.15)'
              e.currentTarget.style.transform = 'translateY(-4px)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = 'none'
              e.currentTarget.style.transform = 'translateY(0)'
            }}>
              <div style={{ fontSize: '32px', marginBottom: '16px' }}>✨</div>
              <h3 style={{
                fontSize: '20px',
                fontWeight: 700,
                marginBottom: '12px',
                color: 'var(--ink)',
              }}>
                AI Features
              </h3>
              <p style={{
                fontSize: '14px',
                color: 'var(--ink-muted)',
                marginBottom: '20px',
                lineHeight: 1.6,
              }}>
                Enhance your profile, get interview prep, and write cover letters with AI.
              </p>
              <div style={{
                color: 'var(--royal)',
                fontWeight: 600,
                fontSize: '14px',
              }}>
                Learn more →
              </div>
            </div>
          </Link>
        </div>

        {/* Applications Section */}
        <div style={{
          background: '#fff',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          padding: '32px',
          marginBottom: '56px',
        }}>
          <h2 style={{
            fontSize: '24px',
            fontWeight: 700,
            marginBottom: '24px',
            color: 'var(--ink)',
          }}>
            Recent Applications
          </h2>
          <p style={{
            color: 'var(--ink-muted)',
            marginBottom: '24px',
          }}>
            Track your applications and interview updates in one place.
          </p>
          <Link href="/applications" style={{ textDecoration: 'none' }}>
            <button style={{
              padding: '12px 24px',
              background: 'var(--royal)',
              color: '#fff',
              border: 'none',
              borderRadius: '10px',
              fontWeight: 600,
              fontSize: '14px',
              cursor: 'pointer',
            }}>
              View Applications
            </button>
          </Link>
        </div>

        {/* Tips Section */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(27, 61, 224, 0.05) 0%, rgba(27, 61, 224, 0.02) 100%)',
          border: '1px solid rgba(27, 61, 224, 0.1)',
          borderRadius: '16px',
          padding: '32px',
        }}>
          <h2 style={{
            fontSize: '24px',
            fontWeight: 700,
            marginBottom: '24px',
            color: 'var(--ink)',
          }}>
            Quick Tips
          </h2>
          <ul style={{
            listStyle: 'none',
            padding: 0,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '16px',
          }}>
            {[
              { icon: '⭐', title: 'Complete Your Profile', desc: 'Higher completion = better job matches' },
              { icon: '🎯', title: 'Check Your AI Score', desc: 'See how you match each role' },
              { icon: '📝', title: 'Apply to Multiple Jobs', desc: 'More applications = more opportunities' },
              { icon: '⚡', title: 'Use AI Tools', desc: 'Enhance your profile and ace interviews' },
            ].map((tip, i) => (
              <li key={i} style={{ padding: '16px' }}>
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>{tip.icon}</div>
                <h4 style={{
                  color: 'var(--ink)',
                  fontSize: '16px',
                  fontWeight: 600,
                  marginBottom: '4px',
                }}>
                  {tip.title}
                </h4>
                <p style={{
                  color: 'var(--ink-muted)',
                  fontSize: '14px',
                  margin: 0,
                }}>
                  {tip.desc}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
