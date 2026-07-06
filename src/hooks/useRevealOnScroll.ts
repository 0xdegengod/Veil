import { useEffect, useRef, useState } from 'react'

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return true
  return window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false
}

function isInViewport(el: HTMLElement, rootMargin = '0px'): boolean {
  const margin = parseInt(rootMargin, 10) || 0
  const rect = el.getBoundingClientRect()
  return rect.top < window.innerHeight - margin && rect.bottom > margin
}

export function useRevealOnScroll<T extends HTMLElement = HTMLElement>(options?: {
  threshold?: number
  rootMargin?: string
  /** Delay before animation starts (ms) */
  delayMs?: number
}): { ref: React.RefObject<T | null>; revealed: boolean } {
  const ref = useRef<T | null>(null)
  const [revealed, setRevealed] = useState(() => prefersReducedMotion())

  useEffect(() => {
    if (revealed) return

    const el = ref.current
    if (!el) return

    const reveal = () => {
      const delay = options?.delayMs ?? 0
      if (delay > 0) {
        window.setTimeout(() => setRevealed(true), delay)
      } else {
        setRevealed(true)
      }
    }

    if (isInViewport(el)) {
      reveal()
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        if (entry?.isIntersecting) {
          reveal()
          observer.disconnect()
        }
      },
      {
        threshold: options?.threshold ?? 0.12,
        rootMargin: options?.rootMargin ?? '0px 0px -12% 0px',
      },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [options?.delayMs, options?.rootMargin, options?.threshold, revealed])

  return { ref, revealed }
}
