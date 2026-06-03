'use client'

interface MeshProps {
  soft?: boolean
}

/**
 * Animated mesh background for dark hero bands
 * - Two drifting blurred gradient circles
 * - Faint grid overlay with radial mask
 * - Uses drift1/drift2 animations from globals.css
 */
export function Mesh({ soft = false }: MeshProps) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
      }}
    >
      {/* Electric circle (blue) */}
      <div
        style={{
          position: 'absolute',
          top: '-40%',
          left: '-6%',
          width: 460,
          height: 460,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(79,110,255,.5), transparent 64%)',
          filter: 'blur(30px)',
          animation: 'drift1 17s ease-in-out infinite',
        }}
      />

      {/* Gold circle (soft on variants) */}
      <div
        style={{
          position: 'absolute',
          bottom: '-60%',
          right: '-4%',
          width: 520,
          height: 520,
          borderRadius: '50%',
          background: `radial-gradient(circle, rgba(245,184,0,${soft ? 0.14 : 0.24}), transparent 62%)`,
          filter: 'blur(34px)',
          animation: 'drift2 21s ease-in-out infinite',
        }}
      />

      {/* Grid overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.5,
          backgroundImage:
            'linear-gradient(rgba(255,255,255,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.04) 1px,transparent 1px)',
          backgroundSize: '52px 52px',
          maskImage: 'radial-gradient(circle at 60% 0%, #000 35%, transparent 80%)',
        }}
      />
    </div>
  )
}
