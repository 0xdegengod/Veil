import type { ReactNode } from 'react'

type EmptyStateProps = {
  icon: ReactNode
  title: string
  description: string
  action?: ReactNode
  compact?: boolean
}

export function EmptyState({ icon, title, description, action, compact = false }: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center rounded-2xl border border-dashed border-border bg-surface/50 text-center ${
        compact ? 'px-4 py-8' : 'px-6 py-12'
      }`}
    >
      <div
        className={`flex items-center justify-center rounded-2xl border border-border-subtle bg-surface-raised text-muted ${
          compact ? 'mb-3 h-10 w-10' : 'mb-4 h-14 w-14'
        }`}
      >
        {icon}
      </div>
      <h3 className={`font-medium text-foreground ${compact ? 'text-sm' : 'text-base'}`}>{title}</h3>
      <p className={`mt-1.5 max-w-sm leading-relaxed text-muted ${compact ? 'text-xs' : 'mt-2 text-sm'}`}>
        {description}
      </p>
      {action && <div className={compact ? 'mt-4' : 'mt-6'}>{action}</div>}
    </div>
  )
}
