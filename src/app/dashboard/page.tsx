'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

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
    return <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0F1729 0%, #1a2540 100%)' }}>
      {/* Header */}
      <div style={{ padding: '24px 0', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ color: '#fff', margin: 0, fontSize: '28px', fontWeight: 700 }}>Talantz</h1>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <Link href="/profile" style={{ textDecoration: 'none' }}>
              <button style={{ padding: '10px 20px', background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' }}>
                My Profile
              </button>
            </Link>
            <Link href="/api/auth/signout" style={{ textDecoration: 'none' }}>
              <button style={{ padding: '10px 20px', background: '#EF4444', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' }}>
                Sign Out
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '60px 24px' }}>
        {/* Welcome Section */}
        <div style={{ marginBottom: '60px' }}>
          <h2 style={{ color: '#fff', fontSize: '48px', fontWeight: 800, marginBottom: '12px' }}>
            Welcome back, {session?.email?.split('@')[0]}! 👋
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '18px', marginBottom: '32px' }}>
            Build your AI-scored profile and land your dream job. Your profile is 0% complete.
          </p>
        </div>

        {/* Quick Actions Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '60px' }}>
          {/* Complete Profile */}
          <div style={{ background: 'linear-gradient(135deg, #1B3DE0 0%, #162FA0 100%)', borderRadius: '16px', padding: '32px', color: '#fff' }}>
            <div style={{ fontSize: '32px', marginBottom: '16px' }}>📋</div>
            <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>Complete Your Profile</h3>
            <p style={{ fontSize: '14px', marginBottom: '20px', opacity: 0.9 }}>
              Add your experience, education, and skills to get AI-scored and stand out to employers.
            </p>
            <Link href="/profile" style={{ textDecoration: 'none' }}>
              <button style={{ width: '100%', padding: '12px', background: '#fff', color: '#1B3DE0', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', fontSize: '14px' }}>
                Start Building
              </button>
            </Link>
          </div>

          {/* Browse Jobs */}
          <div style={{ background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', borderRadius: '16px', padding: '32px', color: '#fff' }}>
            <div style={{ fontSize: '32px', marginBottom: '16px' }}>🔍</div>
            <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>Browse Open Jobs</h3>
            <p style={{ fontSize: '14px', marginBottom: '20px', opacity: 0.9 }}>
              Find roles that match your skills. See your AI match score for each position.
            </p>
            <Link href="/jobs" style={{ textDecoration: 'none' }}>
              <button style={{ width: '100%', padding: '12px', background: '#fff', color: '#10B981', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', fontSize: '14px' }}>
                Explore Jobs
              </button>
            </Link>
          </div>

          {/* AI Features */}
          <div style={{ background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)', borderRadius: '16px', padding: '32px', color: '#fff' }}>
            <div style={{ fontSize: '32px', marginBottom: '16px' }}>✨</div>
            <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>AI Powered Tools</h3>
            <p style={{ fontSize: '14px', marginBottom: '20px', opacity: 0.9 }}>
              Get free AI-powered profile enhancements, cover letters, and interview prep.
            </p>
            <Link href="/pricing" style={{ textDecoration: 'none' }}>
              <button style={{ width: '100%', padding: '12px', background: '#fff', color: '#F59E0B', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', fontSize: '14px' }}>
                Learn More
              </button>
            </Link>
          </div>
        </div>

        {/* Features Section */}
        <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '16px', padding: '40px', border: '1px solid rgba(255,255,255,0.1)' }}>
          <h3 style={{ color: '#fff', fontSize: '24px', fontWeight: 700, marginBottom: '32px' }}>Why Talantz?</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px' }}>
            {[
              { icon: '🤖', title: 'AI Profile Scoring', desc: 'See exactly how you match each role' },
              { icon: '⚡', title: 'Instant Applications', desc: 'Apply in seconds with one click' },
              { icon: '📊', title: 'Match Analytics', desc: 'Track your performance across roles' },
              { icon: '💬', title: 'Interview Prep', desc: 'Practice with AI-powered coaching' },
            ].map((feature, i) => (
              <div key={i}>
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>{feature.icon}</div>
                <h4 style={{ color: '#fff', fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>{feature.title}</h4>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px' }}>{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
