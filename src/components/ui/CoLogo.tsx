'use client'

interface CoLogoProps {
  initial: string
  color?: string
  size?: number
  radius?: number
}

/**
 * Company logo tile
 * - Rounded square with gradient background
 * - White initial (weight 800)
 * - Soft shadow
 */
export function CoLogo({ initial, color = '#1B3DE0', size = 48, radius = 12 }: CoLogoProps) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        flexShrink: 0,
        display: 'grid',
        placeItems: 'center',
        background: `linear-gradient(140deg, ${color}, ${color}cc)`,
        color: '#fff',
        fontWeight: 800,
        fontSize: size * 0.42,
        boxShadow: `0 6px 16px ${color}3a`,
      }}
    >
      {initial}
    </div>
  )
}
