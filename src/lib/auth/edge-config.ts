/**
 * Edge-safe auth config — no Node.js APIs, no database imports.
 * Used only in middleware (Edge runtime) to read the JWT token.
 * Full auth config with DB callbacks lives in ./config.ts
 */
import type { NextAuthConfig } from 'next-auth'

export const edgeAuthConfig: NextAuthConfig = {
  providers: [], // providers only needed at sign-in, not in middleware

  callbacks: {
    // Read role + id from JWT — no DB calls
    session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.role = token.role as string
      }
      return session
    },
  },

  pages: {
    signIn: '/login',
    error: '/login',
  },

  session: { strategy: 'jwt' },
}
