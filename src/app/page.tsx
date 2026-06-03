import { auth } from '@/lib/auth'
import { SimpleLandingPage } from '@/components/home/SimpleLandingPage'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const session = await auth()

  const role = (session?.user?.role ?? null) as 'job_seeker' | 'employer_admin' | 'employer_member' | 'super_admin' | null

  // Public landing — serve the static SPA until Next.js pages are built out
  return <SimpleLandingPage role={role} />
}
