import type { NextAuthConfig } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { loginSchema } from '@/lib/auth/schemas'

export const authConfig: NextAuthConfig = {
  providers: [
    // ── Email / Password (Primary) ─────────────────────────────────
    Credentials({
      async authorize(credentials) {
        try {
          const parsed = loginSchema.safeParse(credentials)
          if (!parsed.success) return null

          const { email, password } = parsed.data

          const user = await db.user.findUnique({
            where: { email: email.toLowerCase(), deletedAt: null },
          })

          if (!user || !user.passwordHash) return null
          if (!user.emailVerified) return null

          const valid = await bcrypt.compare(password, user.passwordHash)
          if (!valid) return null

          return {
            id: user.id,
            email: user.email,
            role: user.role,
            name: null,
            image: null,
          }
        } catch (err) {
          console.error('[auth-credentials]', err)
          return null
        }
      },
    }),
  ],

  callbacks: {
    // ── JWT: embed role + id into token ───────────────────────────
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role
      }

      // Always refresh role from DB (role may change)
      if (token.id) {
        const dbUser = await db.user.findUnique({
          where: { id: token.id as string },
          select: { role: true },
        })
        if (dbUser) token.role = dbUser.role
      }

      return token
    },

    // ── Session: expose role + id to client ────────────────────────
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.role = token.role as string
      }
      return session
    },

    // ── SignIn: credentials-only auth ─────────────────────────────
    async signIn({ user }) {
      // Credentials provider handles all auth
      // User is already validated by authorize()
      return !!user
    },
  },

  pages: {
    signIn: '/login',
    error: '/login',
  },

  session: { strategy: 'jwt' },
}
