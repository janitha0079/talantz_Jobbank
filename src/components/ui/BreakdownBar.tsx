'use client'

import { useEffect, useState } from 'react'

interface BreakdownBarProps {
  label: string
  value: number
  delay?: number
}

/**
 * Horizontal factor bar for AI match breakdown
 * - Label (13px, weight 600) + value n% (13px, weight 800)
 * - Bar animates from 0 → value after mount (~1.3s)
 * - Fill color by value: ≥80 green, ≥60 royal, else amber
 */
export function BreakdownBar({ label, value, delay = 200 }: BreakdownBarProps) {
  const [w, setW] = useState(0)

  useEffect(() => {
    // Check for reduced motion
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (prefersReduced) {
      setW(value)
      return
    }

    const id = setTimeout(() => setW(value), delay)
    return () => clearTimeout(id)
  }, [value, delay])

  // Determine fill color based on value
  let fillColor = '#B4790B' // amber
  let fillGradient = `linear-gradient(90deg, #B4790B, #B4790B)`

  if (value >= 80) {
    fillColor = '#15803D'
    fillGradient = `linear-gradient(90deg, #15803D, #15803Daa)`
  } else if (value >= 60) {
    fillColor = '#1B3DE0'
    fillGradient = `linear-gradient(90deg, #1B3DE0, #1B3DE0aa)`
  }

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 8,
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 600, color: '#7580A0' }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 800, color: '#07080F' }}>{value}%</span>
      </div>
      <div className="bar-track">
        <div
          className="bar-fill"
          style={{
            width: `${w}%`,
            background: fillGradient,
          }}
        />
      </div>
    </div>
  )
}
