import type { Metadata } from 'next'
import { auth } from '@/lib/auth'
import SessionProviderWrapper from '@/components/providers/SessionProviderWrapper'
import './globals.css'
import './components.css'

export const metadata: Metadata = {
  title: { default: 'TalentAI.lk', template: '%s — TalentAI.lk' },
  description: "Sri Lanka's first AI-native job platform. Find your next role or hire your next team member.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://talentai.lk'),
}
export const dynamic = 'force-dynamic'

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500;1,600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <SessionProviderWrapper session={session}>
          {children}
        </SessionProviderWrapper>
      </body>
    </html>
  )
}
