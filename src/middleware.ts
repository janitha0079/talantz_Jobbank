import { NextRequest, NextResponse } from 'next/server'
import NextAuth from 'next-auth'
import { edgeAuthConfig } from '@/lib/auth/edge-config'

// Use edge-safe auth (no Node.js APIs / no Prisma) for middleware
const { auth } = NextAuth(edgeAuthConfig)

// Routes that require authentication
const PROTECTED: Record<string, string[]> = {
  '/profile':   ['job_seeker'],
  '/my-apps':   ['job_seeker'],
  '/employer':  ['employer_admin', 'employer_member'],
  '/onboarding':['employer_admin', 'employer_member'],
  '/admin':     ['super_admin'],
  '/api/profile':  ['job_seeker', 'super_admin'],
  '/api/applications': ['job_seeker', 'employer_admin', 'employer_member', 'super_admin'],
  '/api/admin': ['super_admin'],
  '/api/payments': ['employer_admin'],
}

// Public routes — never redirect
const PUBLIC = ['/', '/login', '/register', '/jobs', '/companies', '/api/auth', '/api/inngest']

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // ── Admin IP allowlist (production only) ─────────────────────────
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    if (process.env.NODE_ENV === 'production') {
      const allowlist = (process.env.ADMIN_IP_ALLOWLIST ?? '')
        .split(',')
        .map((ip) => ip.trim())
        .filter(Boolean)

      const ip =
        req.headers.get('x-real-ip') ??
        req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
        '0.0.0.0'

      if (allowlist.length > 0 && !allowlist.includes(ip)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }
  }

  // ── Skip public routes ────────────────────────────────────────────
  if (PUBLIC.some((pub) => pathname.startsWith(pub))) {
    return NextResponse.next()
  }

  // ── Auth check ────────────────────────────────────────────────────
  const protectedEntry = Object.entries(PROTECTED).find(([route]) =>
    pathname.startsWith(route),
  )

  if (protectedEntry) {
    const [, allowedRoles] = protectedEntry
    const session = await auth()

    // Not logged in → redirect to login
    if (!session?.user) {
      const loginUrl = new URL('/login', req.url)
      loginUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Wrong role → 403
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Forbidden — insufficient role' },
        { status: 403 },
      )
    }
  }

  return NextResponse.next()
}

export const config = {
  // Run on all routes except static files and Next.js internals
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|webp)$).*)'],
}
