import { type RefObject } from 'react'
import { useLandingScrollProgress } from '../../hooks/useLandingScrollProgress.ts'
import { LANDING_SECTIONS } from './landingSections.ts'

type MobileScrollProgressProps = {
  scrollRef: RefObject<HTMLElement | null>
}

/** Compact bottom progress bar for mobile and tablet */
export function MobileScrollProgress({ scrollRef }: MobileScrollProgressProps) {
  const { progress, activeId } = useLandingScrollProgress(scrollRef, [...LANDING_SECTIONS])
  const activeSection =
    LANDING_SECTIONS.find((s) => s.id === activeId) ?? LANDING_SECTIONS[0]

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 lg:hidden"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="pointer-events-none bg-gradient-to-t from-bg via-bg/95 to-transparent px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-6">
        <div className="flex items-center justify-between gap-3">
          <p className="min-w-0 truncate text-xs font-medium text-foreground">
            {activeSection.label}
          </p>
          <p className="shrink-0 font-mono text-[10px] tabular-nums text-muted">
            {Math.round(progress * 100)}%
          </p>
        </div>
        <div className="mt-2 h-0.5 overflow-hidden rounded-full bg-border/80">
          <div
            className="h-full rounded-full bg-accent transition-all duration-200 ease-out motion-reduce:transition-none"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      </div>
    </div>
  )
}
