import type { ReactNode } from 'react'

type SectionCardProps = {
  title?: string
  description?: string
  action?: ReactNode
  children: ReactNode
  className?: string
}

export function SectionCard({
  title,
  description,
  action,
  children,
  className = '',
}: SectionCardProps) {
  return (
    <section
      className={`rounded-2xl border border-border bg-surface p-5 sm:p-6 ${className}`}
    >
      {(title || action) && (
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            {title && (
              <h2 className="text-base font-medium text-foreground">{title}</h2>
            )}
            {description && (
              <p className="mt-1 text-sm text-muted">{description}</p>
            )}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  )
}
