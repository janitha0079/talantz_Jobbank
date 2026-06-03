import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'

export default async function EmployerLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  if (!session?.user) {
    redirect('/login?callbackUrl=/employer')
  }

  const role = session.user.role
  if (role !== 'employer_admin' && role !== 'employer_member' && role !== 'super_admin') {
    redirect('/jobs')
  }

  return <>{children}</>
}
