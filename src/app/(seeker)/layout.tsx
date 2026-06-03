import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'

export default async function SeekerLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  if (!session?.user) {
    redirect('/login?callbackUrl=' + encodeURIComponent('/jobs'))
  }

  // Employers who accidentally hit a seeker route → send to employer dashboard
  const role = session.user.role
  if (role === 'employer_admin' || role === 'employer_member') {
    redirect('/employer')
  }
  if (role === 'super_admin') {
    redirect('/admin')
  }

  return <>{children}</>
}
