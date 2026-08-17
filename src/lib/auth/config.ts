import type { NextAuthConfig } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import Google from 'next-auth/providers/google'
import LinkedIn from 'next-auth/providers/linkedin'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { loginSchema } from '@/lib/auth/schemas'

export const authConfig: NextAuthConfig = {
  providers: [
    // ── LinkedIn OAuth (only when credentials are configured) ──────
    ...(process.env.AUTH_LINKEDIN_ID && process.env.AUTH_LINKEDIN_SECRET
      ? [LinkedIn({
          clientId: process.env.AUTH_LINKEDIN_ID,
          clientSecret: process.env.AUTH_LINKEDIN_SECRET,
          authorization: { params: { scope: 'openid profile email' } },
        })]
      : []),

    // ── Google OAuth (only when credentials are configured) ────────
    ...(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET
      ? [Google({
          clientId: process.env.AUTH_GOOGLE_ID,
          clientSecret: process.env.AUTH_GOOGLE_SECRET,
          authorization: { params: { scope: 'openid profile email' } },
        })]
      : []),

    // ── Email / Password ───────────────────────────────────────────
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
    async jwt({ token, user, account, profile }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role

        // Store raw OAuth profile for AI parsing later
        if (account?.provider === 'linkedin' && profile) {
          token.linkedinProfile = profile
        }
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

    // ── SignIn: create/link accounts on OAuth ─────────────────────
    async signIn({ user, account, profile }) {
      if (!account || !user.email) return true
      // Credentials provider doesn't need OAuth account linking
      if (account.provider === 'credentials') return true

      const email = user.email.toLowerCase()

      // Find or create the user record
      let dbUser = await db.user.findUnique({
        where: { email },
      })

      if (!dbUser) {
        // New OAuth user → create as job seeker by default
        dbUser = await db.user.create({
          data: {
            email,
            emailVerified: true,
            role: 'job_seeker',
            oauthAccounts: {
              create: {
                provider: account.provider as any,
                providerId: account.providerAccountId,
                accessToken: account.access_token,
                refreshToken: account.refresh_token ?? null,
                rawProfile: profile as any,
              },
            },
          },
        })

        // Queue AI profile parsing for LinkedIn
        if (account.provider === 'linkedin' && profile) {
          const { inngest } = await import('@/inngest/client')
          await inngest.send({
            name: 'profile/linkedin.imported',
            data: { userId: dbUser.id, rawProfile: profile },
          })
        }
      } else {
        // Existing user — upsert the OAuth account
        await db.oAuthAccount.upsert({
          where: {
            provider_providerId: {
              provider: account.provider as any,
              providerId: account.providerAccountId,
            },
          },
          update: {
            accessToken: account.access_token,
            refreshToken: account.refresh_token ?? null,
            rawProfile: profile as any,
          },
          create: {
            userId: dbUser.id,
            provider: account.provider as any,
            providerId: account.providerAccountId,
            accessToken: account.access_token,
            refreshToken: account.refresh_token ?? null,
            rawProfile: profile as any,
          },
        })
      }

      // Embed DB id into the user object for JWT callback
      ;(user as any).id = dbUser.id
      ;(user as any).role = dbUser.role

      return true
    },
  },

  pages: {
    signIn: '/login',
    error: '/login',
  },

  session: { strategy: 'jwt' },
}
