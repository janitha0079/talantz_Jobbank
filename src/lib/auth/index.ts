import NextAuth from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { authConfig } from './config'
import { db } from '@/lib/db'
import type { UserRole } from '@prisma/client'

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  ...authConfig,
})

// ── Auth helpers ────────────────────────────────────────────────────

/** Get session or throw 401 */
export async function requireAuth() {
  const session = await auth()
  if (!session?.user?.id) {
    throw new AuthError('Unauthorised', 401)
  }
  return session
}

/** Require a specific role */
export async function requireRole(role: UserRole | UserRole[]) {
  const session = await requireAuth()
  const roles = Array.isArray(role) ? role : [role]
  if (!roles.includes(session.user.role as UserRole)) {
    throw new AuthError('Forbidden', 403)
  }
  return session
}

/** Require super admin */
export const requireAdmin = () => requireRole('super_admin')

/** Require employer admin or member */
export const requireEmployer = () =>
  requireRole(['employer_admin', 'employer_member'])

/** Require job seeker */
export const requireSeeker = () => requireRole('job_seeker')

/** Auth error with HTTP status */
export class AuthError extends Error {
  constructor(
    message: string,
    public status: number = 401,
  ) {
    super(message)
    this.name = 'AuthError'
  }
}

// ── Type augmentation ───────────────────────────────────────────────
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
