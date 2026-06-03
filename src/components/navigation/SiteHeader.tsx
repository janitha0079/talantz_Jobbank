'use client'

import Link from 'next/link'
import { SignOutButton } from '@/components/auth/SignOutButton'

type Role = 'guest' | 'job_seeker' | 'employer' | 'admin'
type Theme = 'light' | 'dark'

export function SiteHeader({
  role = 'guest',
  theme = 'light',
  current = '',
  subtitle,
}: {
  role?: Role
  theme?: Theme
  current?: string
  subtitle?: string
}) {
  const isDark = theme === 'dark'
  const fg = isDark ? '#fff' : 'var(--ink)'
  const muted = isDark ? 'rgba(255,255,255,0.72)' : 'var(--ink-muted)'
  const border = isDark ? 'rgba(255,255,255,0.14)' : 'var(--border)'
  const brandBg = isDark ? 'rgba(255,255,255,0.12)' : 'linear-gradient(135deg, var(--royal), var(--electric))'

  const links =
    role === 'admin'
      ? [
          { href: '/', label: 'Home' },
          { href: '/jobs', label: 'Job search' },
          { href: '/admin', label: 'Admin' },
          { href: '/admin/companies', label: 'Companies' },
          { href: '/admin/users', label: 'Users' },
        ]
      : role === 'employer'
        ? [
            { href: '/', label: 'Home' },
            { href: '/jobs', label: 'Job search' },
            { href: '/employer', label: 'Dashboard' },
            { href: '/employer/jobs', label: 'Jobs' },
            { href: '/employer/jobs/new', label: 'Post job' },
            { href: '/employer/billing', label: 'Billing' },
          ]
        : role === 'job_seeker'
          ? [
              { href: '/', label: 'Home' },
              { href: '/jobs', label: 'Job search' },
              { href: '/profile', label: 'Profile' },
              { href: '/applications', label: 'Applications' },
            ]
          : [
              { href: '/', label: 'Home' },
              { href: '/jobs', label: 'Job search' },
              { href: '/login?audience=job_seeker', label: 'Job seeker login' },
              { href: '/login?audience=employer', label: 'Employer login' },
            ]

  return (
    <nav
      style={{
        background: isDark ? 'var(--royal-deep)' : '#fff',
        borderBottom: `1.5px solid ${border}`,
        padding: '0 1.5rem',
        position: 'sticky',
        top: 0,
        zIndex: 60,
      }}
    >
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: '64px', gap: '16px', flexWrap: 'wrap', paddingTop: '8px', paddingBottom: '8px' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <img src="/talantz-logo.png" alt="Talantz" style={{ height: '30px', width: 'auto', display: 'block' }} />
          {subtitle && <p style={{ fontSize: '0.75rem', color: muted }}>{subtitle}</p>}
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={current === link.href ? 'btn btn-primary' : 'btn btn-ghost'}
              style={{ fontSize: '0.82rem', padding: '6px 14px' }}
            >
              {link.label}
            </Link>
          ))}

          {role === 'guest' ? null : (
            <SignOutButton
              label={role === 'job_seeker' ? 'Switch account' : 'Sign out'}
              callbackUrl={role === 'job_seeker' ? '/login?audience=employer' : '/'}
              className="btn btn-ghost"
              style={{ fontSize: '0.82rem', padding: '6px 14px', color: fg }}
            />
          )}
        </div>
      </div>
    </nav>
  )
}
