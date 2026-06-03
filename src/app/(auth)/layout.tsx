import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  // Already logged in — send to the right dashboard
  if (session?.user) {
    const role = session.user.role
    if (role === 'super_admin') redirect('/admin')
    if (role === 'employer_admin' || role === 'employer_member') redirect('/employer')
    redirect('/jobs')
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface)' }}>
      {children}
    </div>
  )
}
