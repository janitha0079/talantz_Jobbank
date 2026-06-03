import { useEffect } from 'react'

/**
 * Scroll-reveal hook: Uses IntersectionObserver to add `.in` class to `.reveal` elements
 * Re-runs on dependency change (useful for route navigation)
 */
export function useReveal(dep?: unknown) {
  useEffect(() => {
    // Respect prefers-reduced-motion
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const els = document.querySelectorAll('.reveal:not(.in)')
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('in')
            io.unobserve(e.target)
          }
        })
      },
      { threshold: 0.12, rootMargin: '0px 0px -6% 0px' }
    )

    // If reduced motion, add .in immediately
    if (prefersReduced) {
      els.forEach((el) => el.classList.add('in'))
    } else {
      els.forEach((el) => io.observe(el))
    }

    return () => io.disconnect()
  }, [dep])
}
