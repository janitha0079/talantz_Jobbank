import NextAuth from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { authConfig } from './config'
import { db } from '@/lib/db'
import type { UserRole } from '@prisma/client'

// NextAuth is initialised lazily — calling it at module level caused
// build-time failures when Vercel imported the module during page analysis.
let _auth: ReturnType<typeof NextAuth> | null = null

function getAuth(): ReturnType<typeof NextAuth> {
  if (!_auth) {
    _auth = NextAuth({
      adapter: PrismaAdapter(db as any),
      ...authConfig,
    })
  }
  return _auth
}

// Re-export the four NextAuth surfaces as thin wrappers
export const handlers = {
  GET:  (...args: any[]) => (getAuth().handlers as any).GET(...args),
  POST: (...args: any[]) => (getAuth().handlers as any).POST(...args),
}

export const auth     = (...args: any[]) => (getAuth().auth     as Function)(...args)
export const signIn   = (...args: any[]) => (getAuth().signIn   as Function)(...args)
export const signOut  = (...args: any[]) => (getAuth().signOut  as Function)(...args)

// ── Auth helpers ─────────────────────────────────────────────────────────────

export async function requireAuth() {
  const session = await auth()
  if (!(session as any)?.user?.id) throw new AuthError('Unauthorised', 401)
  return session as any
}

export async function requireRole(role: UserRole | UserRole[]) {
  const session = await requireAuth()
  const roles = Array.isArray(role) ? role : [role]
  if (!roles.includes(session.user.role as UserRole)) throw new AuthError('Forbidden', 403)
  return session
}

export const requireAdmin    = () => requireRole('super_admin')
export const requireEmployer = () => requireRole(['employer_admin', 'employer_member'])
export const requireSeeker   = () => requireRole('job_seeker')

export class AuthError extends Error {
  constructor(message: string, public status: number = 401) {
    super(message)
    this.name = 'AuthError'
  }
}

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      role: string
      name?: string | null
      image?: string | null
    }
  }
}
