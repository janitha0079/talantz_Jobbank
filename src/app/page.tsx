import { auth } from '@/lib/auth'
import { SimpleLandingPage } from '@/components/home/SimpleLandingPage'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const session = await auth()

  const role = (session?.user?.role ?? null) as 'job_seeker' | 'employer_admin' | 'employer_member' | 'super_admin' | null

  // Redirect job seekers to their dashboard
  if (role === 'job_seeker') {
    redirect('/dashboard')
  }

  // Redirect employers to their dashboard
  if (role === 'employer_admin' || role === 'employer_member') {
    redirect('/employer')
  }

  // Redirect admins to admin panel
  if (role === 'super_admin') {
    redirect('/admin')
  }

  // Public landing page for guests
  return <SimpleLandingPage role={role} />
}
