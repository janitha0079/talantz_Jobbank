'use client'

import { useEffect, useState, useRef } from 'react'

interface ScoreRingProps {
  score: number
  size?: number
  stroke?: number
  label?: string
  dark?: boolean
}

/**
 * Animated circular score gauge
 * - Count-up: 0 → score over 1300ms with cubic easing
 * - Respects prefers-reduced-motion (jumps to final)
 */
export function ScoreRing({ score, size = 132, stroke = 11, label = 'AI MATCH', dark = true }: ScoreRingProps) {
  const [v, setV] = useState(0)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Check for reduced motion
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (prefersReduced) {
      // Jump to final
      setV(score)
      return
    }

    let raf: number
    const t0 = performance.now()
    const dur = 1300 // duration in ms

    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / dur)
      // Cubic easing: 1 - (1-p)^3
      const e = 1 - Math.pow(1 - p, 3)
      setV(Math.round(score * e))
      if (p < 1) raf = requestAnimationFrame(tick)
    }

    // Start animation after 220ms delay
    const id = setTimeout(() => {
      raf = requestAnimationFrame(tick)
    }, 220)

    return () => {
      clearTimeout(id)
      cancelAnimationFrame(raf)
    }
  }, [score])

  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const off = circ * (1 - v / 100)
  const gradId = `rg${size}`

  return (
    <div
      ref={ref}
      style={{
        position: 'relative',
        width: size,
        height: size,
        flexShrink: 0,
      }}
    >
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={dark ? 'rgba(255,255,255,.14)' : 'rgba(27,61,224,.12)'}
          strokeWidth={stroke}
        />
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#F5B800" />
            <stop offset="1" stopColor="#FFD34D" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={off}
          style={{
            transition: 'stroke-dashoffset .15s linear',
            filter: 'drop-shadow(0 0 6px rgba(245,184,0,.5))',
          }}
        />
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'grid',
          placeItems: 'center',
          textAlign: 'center',
        }}
      >
        <div>
          <div
            style={{
              fontSize: size * 0.3,
              fontWeight: 800,
              color: dark ? '#fff' : '#07080F',
              lineHeight: 1,
              letterSpacing: '-0.03em',
            }}
          >
            {v}
            <span style={{ fontSize: size * 0.14 }}>%</span>
          </div>
          <div
            style={{
              fontSize: 9.5,
              letterSpacing: '0.12em',
              color: dark ? 'rgba(255,255,255,.55)' : '#7580A0',
              fontWeight: 700,
              marginTop: 3,
            }}
          >
            {label}
          </div>
        </div>
      </div>
    </div>
  )
}
