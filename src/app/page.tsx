import { auth } from '@/lib/auth'
import { SimpleLandingPage } from '@/components/home/SimpleLandingPage'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const session = await auth()

  const role = (session?.user?.role ?? null) as 'job_seeker' | 'employer_admin' | 'employer_member' | 'super_admin' | null

  // Public landing page for Talantz
  return <SimpleLandingPage role={role} />
}
