import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-lg px-3 py-2 text-sm transition ${
    isActive
      ? 'bg-surface-raised font-medium text-foreground'
      : 'text-muted hover:bg-surface-raised/50 hover:text-foreground'
  }`

const navLinkDisabled =
  'cursor-not-allowed rounded-lg px-3 py-2 text-sm text-muted/40 pointer-events-none'

export function NavTextItem({
  to,
  children,
  enabled,
  badge,
  className,
}: {
  to: string
  children: ReactNode
  enabled: boolean
  badge?: number
  className?: string
}) {
  if (!enabled) {
    return <span className={`${navLinkDisabled} ${className ?? ''}`.trim()}>{children}</span>
  }

  return (
    <NavLink
      to={to}
      className={({ isActive }) => `${navLinkClass({ isActive })} ${className ?? ''}`.trim()}
    >
      <span className="flex items-center gap-2">
        {children}
        {badge != null && badge > 0 && (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-[11px] font-semibold text-white">
            {badge > 9 ? '9+' : badge}
          </span>
        )}
      </span>
    </NavLink>
  )
}

const iconBtnBase =
  'relative flex size-10 shrink-0 items-center justify-center rounded-xl border border-border text-muted transition hover:bg-surface-raised hover:text-foreground'

const iconBtnClass = ({ isActive }: { isActive: boolean }) =>
  `${iconBtnBase} ${
    isActive
      ? 'border-accent/30 bg-accent/10 text-foreground'
      : ''
  }`

const iconBtnDisabled =
  'relative flex size-10 shrink-0 cursor-not-allowed items-center justify-center rounded-xl border border-border/60 text-muted/30'

export function NavActionButton({
  label,
  onClick,
  children,
}: {
  label: string
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={iconBtnBase}
      aria-label={label}
      title={label}
    >
      {children}
    </button>
  )
}

export function NavIconItem({
  to,
  label,
  enabled,
  badge,
  children,
}: {
  to: string
  label: string
  enabled: boolean
  badge?: number
  children: ReactNode
}) {
  if (!enabled) {
    return (
      <span className={iconBtnDisabled} aria-label={label} title={`${label} (complete setup first)`}>
        {children}
      </span>
    )
  }

  return (
    <NavLink
      to={to}
      className={iconBtnClass}
      aria-label={label}
      title={label}
    >
      {children}
      {badge != null && badge > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[9px] font-bold text-white">
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </NavLink>
  )
}

export function PlusIcon({ className = 'size-[18px]' }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className} aria-hidden>
      <path d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" />
    </svg>
  )
}

export function BellIcon({ className = 'size-[18px]' }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className} aria-hidden>
      <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
    </svg>
  )
}

export function UserIcon({ className = 'size-[18px]' }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className} aria-hidden>
      <path
        fillRule="evenodd"
        d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
        clipRule="evenodd"
      />
    </svg>
  )
}

export function SunIcon({ className = 'size-[18px]' }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className} aria-hidden>
      <path
        fillRule="evenodd"
        d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM10 18a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM3.34 7.05a1 1 0 011.414 0l.707.707a1 1 0 11-1.414 1.414l-.707-.707a1 1 0 010-1.414zM5.05 3.34a1 1 0 011.414 0l.707.707a1 1 0 01-1.414 1.414l-.707-.707a1 1 0 010-1.414zM17.66 7.05a1 1 0 00-1.414 0l-.707.707a1 1 0 101.414 1.414l.707-.707a1 1 0 000-1.414z"
        clipRule="evenodd"
      />
    </svg>
  )
}

export function MoonIcon({ className = 'size-[18px]' }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className} aria-hidden>
      <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
    </svg>
  )
}
