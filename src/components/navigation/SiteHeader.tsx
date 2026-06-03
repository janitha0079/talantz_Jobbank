'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { SignOutButton } from '@/components/auth/SignOutButton'

type Role = 'guest' | 'job_seeker' | 'employer' | 'admin'

const NAV_LINKS: Record<Role, { href: string; label: string }[]> = {
  guest: [
    { href: '/jobs',                    label: 'Browse jobs' },
  ],
  job_seeker: [
    { href: '/jobs',                    label: 'Find jobs' },
    { href: '/applications',            label: 'Applications' },
    { href: '/profile',                 label: 'Profile' },
  ],
  employer: [
    { href: '/employer',                label: 'Dashboard' },
    { href: '/employer/jobs',           label: 'Jobs' },
    { href: '/employer/jobs/new',       label: 'Post job' },
    { href: '/employer/billing',        label: 'Billing' },
  ],
  admin: [
    { href: '/jobs',                    label: 'Job search' },
    { href: '/admin',                   label: 'Admin' },
    { href: '/admin/companies',         label: 'Companies' },
    { href: '/admin/users',             label: 'Users' },
  ],
}

const PRIMARY: Record<Role, { href: string; label: string }> = {
  guest:      { href: '/register?audience=job_seeker', label: 'Get started' },
  job_seeker: { href: '/jobs',                         label: 'Find jobs' },
  employer:   { href: '/employer/jobs/new',            label: 'Post a job' },
  admin:      { href: '/admin',                        label: 'Admin' },
}

export function SiteHeader({
  role = 'guest',
  subtitle,
}: {
  role?: Role
  theme?: string   // kept for backward-compat — ignored, always dark
  current?: string // kept for backward-compat — ignored, uses pathname
  subtitle?: string
}) {
  const pathname = usePathname()
  const links = NAV_LINKS[role]
  const primary = PRIMARY[role]

  return (
    <nav style={{
      position: 'sticky',
      top: 0,
      zIndex: 90,
      background: 'rgba(6,11,46,.92)',
      backdropFilter: 'blur(18px) saturate(140%)',
      borderBottom: '1px solid rgba(255,255,255,.09)',
    }}>
      <div className="wrap" style={{
        height: 66,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
      }}>
        {/* Logo */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', flexShrink: 0 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/talantz-logo.png" alt="Talantz" style={{ height: 30, width: 'auto', display: 'block' }} />
          {subtitle && (
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,.5)', borderLeft: '1px solid rgba(255,255,255,.15)', paddingLeft: 10, marginLeft: 2 }}>
              {subtitle}
            </span>
          )}
        </Link>

        {/* Nav links + actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {/* Role-based nav links */}
          {links.map((link) => {
            const active = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href))
            return (
              <Link
                key={link.href}
                href={link.href}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '8px 16px',
                  borderRadius: 999,
                  fontSize: 14,
                  fontWeight: active ? 700 : 500,
                  color: active ? '#fff' : 'rgba(255,255,255,.7)',
                  background: active ? 'rgba(255,255,255,.12)' : 'transparent',
                  border: active ? '1px solid rgba(255,255,255,.18)' : '1px solid transparent',
                  textDecoration: 'none',
                  transition: 'all .18s',
                  whiteSpace: 'nowrap',
                }}
                className="nav-pill"
              >
                {link.label}
              </Link>
            )
          })}

          {/* Separator */}
          {role !== 'guest' && (
            <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,.12)', margin: '0 4px' }} />
          )}

          {/* Sign out / Sign in */}
          {role === 'guest' ? (
            <Link
              href="/login"
              style={{
                display: 'inline-flex', alignItems: 'center',
                padding: '8px 18px', borderRadius: 999,
                fontSize: 14, fontWeight: 600,
                color: 'rgba(255,255,255,.8)',
                background: 'rgba(255,255,255,.08)',
                border: '1px solid rgba(255,255,255,.14)',
                textDecoration: 'none', whiteSpace: 'nowrap',
                transition: 'all .18s',
              }}
            >
              Sign in
            </Link>
          ) : (
            <SignOutButton
              label="Sign out"
              callbackUrl="/"
              style={{
                display: 'inline-flex', alignItems: 'center',
                padding: '8px 18px', borderRadius: 999,
                fontSize: 14, fontWeight: 600,
                color: 'rgba(255,255,255,.7)',
                background: 'rgba(255,255,255,.07)',
                border: '1px solid rgba(255,255,255,.12)',
                cursor: 'pointer', whiteSpace: 'nowrap',
                transition: 'all .18s', fontFamily: 'var(--ff)',
              }}
            />
          )}

          {/* Primary CTA */}
          <Link
            href={primary.href}
            style={{
              display: 'inline-flex', alignItems: 'center',
              padding: '9px 20px', borderRadius: 999,
              fontSize: 14, fontWeight: 700,
              color: 'var(--royal-deep)',
              background: 'var(--gold)',
              boxShadow: '0 4px 18px rgba(245,184,0,.35)',
              textDecoration: 'none', whiteSpace: 'nowrap',
              transition: 'transform .18s, box-shadow .18s',
            }}
            className="nav-cta"
          >
            {primary.label}
          </Link>
        </div>
      </div>
    </nav>
  )
}
