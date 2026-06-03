import type { Metadata } from 'next'
import { SimpleAuthShell } from '@/components/auth/SimpleAuthShell'

export const metadata: Metadata = { title: 'Create account | TalentAI' }

export default function RegisterPage({
  searchParams,
}: {
  searchParams: { callbackUrl?: string; error?: string; audience?: 'job_seeker' | 'employer'; plan?: 'single' | 'monthly' | 'bulk' }
}) {
  return (
    <SimpleAuthShell
      callbackUrl={searchParams.callbackUrl}
      error={searchParams.error}
      defaultTab="register"
      audience={searchParams.audience}
      plan={searchParams.plan}
    />
  )
}
