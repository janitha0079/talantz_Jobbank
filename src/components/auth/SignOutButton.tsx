'use client'

import { signOut } from 'next-auth/react'

export function SignOutButton({
  callbackUrl = '/',
  label = 'Sign out',
  className,
  style,
}: {
  callbackUrl?: string
  label?: string
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <button
      type="button"
      className={className}
      style={style}
      onClick={() => signOut({ callbackUrl })}
    >
      {label}
    </button>
  )
}
