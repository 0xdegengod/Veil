import type { ComponentPropsWithoutRef, PropsWithChildren } from 'react'
import { useRevealOnScroll } from '../../hooks/useRevealOnScroll.ts'

type RevealSectionProps = PropsWithChildren<
  ComponentPropsWithoutRef<'section'> & {
    className?: string
    delayMs?: number
    /** Full viewport panel with scroll snap */
    panel?: boolean
  }
>

export function RevealSection({
  className = '',
  children,
  delayMs = 0,
  panel = false,
  ...rest
}: RevealSectionProps) {
  const { ref, revealed } = useRevealOnScroll<HTMLElement>({ delayMs })

  const panelClass = panel
    ? 'min-h-[100dvh] flex flex-col justify-start px-0 pb-24 pt-[4.75rem] md:justify-center md:pb-16 md:pt-[4.5rem] lg:snap-start lg:snap-always lg:justify-center lg:pb-0 lg:pt-[72px]'
    : ''

  return (
    <section
      ref={ref}
      {...rest}
      className={`${panelClass} ${className} transition-all duration-[1100ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none motion-reduce:opacity-100 motion-reduce:translate-y-0 motion-reduce:blur-0 motion-reduce:scale-100 ${
        revealed
          ? 'opacity-100 translate-y-0 blur-0 scale-100'
          : 'opacity-0 translate-y-14 blur-[6px] scale-[0.98]'
      }`}
    >
      {children}
    </section>
  )
}

type RevealItemProps = PropsWithChildren<{
  className?: string
  delayMs?: number
}>

/** Staggered child reveal inside a panel */
export function RevealItem({ className = '', children, delayMs = 0 }: RevealItemProps) {
  const { ref, revealed } = useRevealOnScroll<HTMLDivElement>({
    delayMs,
    rootMargin: '0px 0px -8% 0px',
  })

  return (
    <div
      ref={ref}
      className={`${className} transition-all duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none motion-reduce:opacity-100 motion-reduce:translate-y-0 ${
        revealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
    >
      {children}
    </div>
  )
}
