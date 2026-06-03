'use client'

interface CheckProps {
  color?: string
  size?: number
}

/**
 * Green checkmark icon
 * - Filled circle background at 15% opacity
 * - Check path stroke on top
 */
export function Check({ color = '#15803D', size = 16 }: CheckProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
      <circle cx="8" cy="8" r="8" fill={color} opacity="0.15" />
      <path
        d="M5 8l2 2 4-4"
        stroke={color}
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
