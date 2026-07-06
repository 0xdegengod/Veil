import { type RefObject } from 'react'
import {
  useLandingScrollProgress,
  type LandingSection,
} from '../../hooks/useLandingScrollProgress.ts'
import { LANDING_SECTIONS } from './landingSections.ts'

const sections: LandingSection[] = [...LANDING_SECTIONS]

const TRACK_HEIGHT_REM = 16

type ScrollTimelineProps = {
  scrollRef: RefObject<HTMLElement | null>
}

export function ScrollTimeline({ scrollRef }: ScrollTimelineProps) {
  const { progress, activeId } = useLandingScrollProgress(scrollRef, sections)
  const activeIndex = Math.max(
    0,
    sections.findIndex((s) => s.id === activeId),
  )
  const activeSection = sections[activeIndex] ?? sections[0]

  const nodeTop = (index: number) =>
    sections.length <= 1 ? 50 : (index / (sections.length - 1)) * 100

  const activeTop = nodeTop(activeIndex)

  return (
    <aside
      aria-label="Page progress"
      className="pointer-events-none fixed right-8 top-1/2 z-40 hidden -translate-y-1/2 lg:block"
    >
      <div
        className="pointer-events-auto relative flex items-center gap-5"
        style={{ minHeight: `${TRACK_HEIGHT_REM}rem` }}
      >
        <div
          className="relative w-[9.5rem] shrink-0"
          style={{ minHeight: `${TRACK_HEIGHT_REM}rem` }}
        >
          <div
            className="absolute right-0 -translate-y-1/2 text-right transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
            style={{ top: `${activeTop}%` }}
          >
            <p className="text-sm font-medium tracking-tight text-foreground">
              {activeSection.label}
            </p>
          </div>
        </div>

        <div
          className="relative w-4 shrink-0"
          style={{ minHeight: `${TRACK_HEIGHT_REM}rem` }}
        >
          <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-foreground/10" />

          <div
            className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 origin-top bg-accent/70 transition-transform duration-200 ease-out motion-reduce:transition-none"
            style={{ transform: `scaleY(${progress})` }}
            aria-hidden
          />

          <span className="absolute top-0 left-1/2 block size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground/20" />
          <span className="absolute bottom-0 left-1/2 block size-1.5 -translate-x-1/2 translate-y-1/2 rounded-full bg-foreground/20" />

          <span
            className="absolute left-1/2 block size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent shadow-[0_0_12px_rgba(124,92,252,0.4)] transition-[top] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
            style={{ top: `${activeTop}%` }}
            aria-hidden
          />
        </div>
      </div>
    </aside>
  )
}
