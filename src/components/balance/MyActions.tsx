import { Link } from 'react-router-dom'
import type { GroupAction } from '../../types/contracts.ts'
import { MY_ACTIONS_PREVIEW } from '../../lib/constants/listLimits.ts'
import { formatAmount, formatHandle } from '../../lib/utils/format.ts'
import { EmptyState } from '../shared/EmptyState.tsx'
import { Skeleton } from '../shared/Skeleton.tsx'

type MyActionsProps = {
  actions: GroupAction[]
  isLoading: boolean
  isError: boolean
  isEmpty: boolean
  limit?: number
  seeAllHref?: string
  compactEmpty?: boolean
  onPay?: (action: GroupAction) => void
  onRemind?: (action: GroupAction) => void
}

export function MyActions({
  actions,
  isLoading,
  isError,
  isEmpty,
  limit = MY_ACTIONS_PREVIEW,
  seeAllHref,
  compactEmpty = false,
  onPay,
  onRemind,
}: MyActionsProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-14 rounded-xl" />
        <Skeleton className="h-14 rounded-xl" />
      </div>
    )
  }

  if (isError) {
    return (
      <p className="text-sm text-negative">Unable to load your actions.</p>
    )
  }

  if (isEmpty) {
    return (
      <EmptyState
        compact={compactEmpty}
        icon={
          <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" stroke="currentColor" strokeWidth="1.5">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        }
        title="All caught up"
        description="No pending expense shares to repay."
      />
    )
  }

  const capped = limit != null && actions.length > limit
  const visible = capped ? actions.slice(0, limit) : actions

  return (
    <>
      <ul className="space-y-2">
        {visible.map((action) => {
          const isPayable = action.direction === 'pay' && Boolean(onPay)

          const inner = (
            <>
              <span className="min-w-0">
                <span className="block text-sm text-foreground">
                  {action.direction === 'pay' ? 'Pay' : 'Receive from'}{' '}
                  {formatHandle(action.counterpartyHandle)}
                  {action.expenseDescription && (
                    <span className="font-normal text-muted">
                      {', '}
                      {action.expenseDescription}
                    </span>
                  )}
                </span>
                {isPayable && (
                  <span className="mt-0.5 block text-xs text-accent">Tap to pay</span>
                )}
              </span>
              <span className="flex items-center gap-3">
                <span
                  className={`font-mono text-sm font-medium tabular-nums ${
                    action.direction === 'receive' ? 'text-positive' : 'text-negative'
                  }`}
                >
                  {formatAmount(action.amountCents)}
                </span>
                {isPayable && (
                  <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-muted">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </span>
            </>
          )

          if (isPayable) {
            return (
              <li key={action.id}>
                <button
                  type="button"
                  onClick={() => onPay?.(action)}
                  className="flex w-full items-center justify-between rounded-xl border border-border-subtle bg-surface-raised/50 px-4 py-3.5 text-left transition hover:border-accent/40 hover:bg-surface-raised"
                >
                  {inner}
                </button>
              </li>
            )
          }

          return (
            <li
              key={action.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-border-subtle bg-surface-raised/50 px-4 py-3.5"
            >
              {inner}
              {action.direction === 'receive' && onRemind && (
                <button
                  type="button"
                  onClick={() => onRemind(action)}
                  className="shrink-0 rounded-lg border border-border px-3 py-1.5 text-xs text-muted transition hover:text-foreground"
                >
                  Remind
                </button>
              )}
            </li>
          )
        })}
      </ul>
      {capped && seeAllHref && (
        <div className="mt-3 border-t border-border-subtle pt-3 text-center">
          <Link to={seeAllHref} className="text-sm text-accent hover:underline">
            See all {actions.length} on Activity
          </Link>
        </div>
      )}
    </>
  )
}
