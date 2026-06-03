'use client'

import { ReactNode } from 'react'
import { Mesh } from './Mesh'

interface PageHeroProps {
  eyebrow?: string
  children: ReactNode
  soft?: boolean
  pad?: string
}

/**
 * Dark hero band wrapper with mesh background
 * - Optional gold "eyebrow" pill with pulsing dot
 * - Mesh background with drifting blobs
 * - Wraps content in .app-wrap
 */
export function PageHero({ eyebrow, children, soft, pad = '34px 0 40px' }: PageHeroProps) {
  return (
    <div className="page-hero">
      <Mesh soft={soft} />
      <div className="app-wrap" style={{ position: 'relative', padding: pad }}>
        {eyebrow && (
          <div
            className="reveal in"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 7,
              padding: '7px 15px',
              borderRadius: '999px',
              background: 'rgba(245,184,0,.13)',
              color: '#FFD34D',
              border: '1px solid rgba(245,184,0,.3)',
              marginBottom: 16,
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: '0.04em',
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: '#F5B800',
                animation: 'pulse 2s infinite',
              }}
            />
            {eyebrow}
          </div>
        )}
        {children}
      </div>
    </div>
  )
}
