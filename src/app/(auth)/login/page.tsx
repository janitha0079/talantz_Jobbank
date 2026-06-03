import type { Metadata } from 'next'
import { SimpleAuthShell } from '@/components/auth/SimpleAuthShell'

export const metadata: Metadata = { title: 'Sign in' }

export default function LoginPage({
  searchParams,
}: {
  searchParams: { callbackUrl?: string; error?: string; audience?: 'job_seeker' | 'employer'; plan?: 'single' | 'monthly' | 'bulk'; verified?: string }
}) {
  return (
    <SimpleAuthShell
      callbackUrl={searchParams.callbackUrl}
      error={searchParams.error}
      verified={searchParams.verified}
      audience={searchParams.audience}
      plan={searchParams.plan}
    />
  )
}
