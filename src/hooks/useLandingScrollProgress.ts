import { useCallback, useEffect, useState, type RefObject } from 'react'

export type LandingSection = {
  id: string
  label: string
}

export function useLandingScrollProgress(
  scrollRef: RefObject<HTMLElement | null>,
  sections: LandingSection[],
): { progress: number; activeId: string } {
  const [progress, setProgress] = useState(0)
  const [activeId, setActiveId] = useState(sections[0]?.id ?? '')

  const update = useCallback(() => {
    const container = scrollRef.current
    if (!container) return

    const maxScroll = container.scrollHeight - container.clientHeight
    const nextProgress = maxScroll > 0 ? container.scrollTop / maxScroll : 0
    setProgress(Math.min(1, Math.max(0, nextProgress)))

    const containerRect = container.getBoundingClientRect()
    const viewportCenter = containerRect.top + containerRect.height * 0.42

    let closest = sections[0]?.id ?? ''
    let minDistance = Infinity

    for (const section of sections) {
      const el = document.getElementById(section.id)
      if (!el) continue

      const rect = el.getBoundingClientRect()
      const sectionCenter = rect.top + rect.height / 2
      const distance = Math.abs(sectionCenter - viewportCenter)

      if (distance < minDistance) {
        minDistance = distance
        closest = section.id
      }
    }

    setActiveId(closest)
  }, [scrollRef, sections])

  useEffect(() => {
    const container = scrollRef.current
    if (!container) return

    update()

    container.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)

    return () => {
      container.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [scrollRef, update])

  return { progress, activeId }
}
