import { Link } from 'react-router-dom'
import type {
  ExpenseActivity,
  ExpenseCreditSnippet,
  GroupAction,
} from '../../types/contracts.ts'
import { ACTIVITY_PAGE_SIZE } from '../../lib/constants/listLimits.ts'
import { formatAmount, formatHandle, timeAgo } from '../../lib/utils/format.ts'
import { useVisibleCount } from '../../hooks/useVisibleCount.ts'
import { LoadMoreFooter } from '../shared/LoadMoreFooter.tsx'
import { Skeleton } from '../shared/Skeleton.tsx'

type ListProps = { isLoading: boolean }

function ListEmpty({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border-subtle px-4 py-8 text-center">
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="mt-1 text-xs text-muted">{description}</p>
    </div>
  )
}

type SliceProps = {
  limit?: number
  pageSize?: number
}

function resolveVisibleCount(
  total: number,
  limit: number | undefined,
  pageSize: number | undefined,
  pagination: ReturnType<typeof useVisibleCount>,
): number {
  if (limit != null) return Math.min(limit, total)
  if (pageSize != null) return pagination.showing
  return total
}

export function PayActionList({
  actions,
  isLoading,
  limit,
  pageSize = ACTIVITY_PAGE_SIZE,
}: ListProps & { actions: GroupAction[] } & SliceProps) {
  const pagination = useVisibleCount(actions.length, pageSize)
  const showPagination = limit == null && actions.length > 0

  if (isLoading) return <Skeleton className="h-16 rounded-xl" />
  if (actions.length === 0) {
    return (
      <ListEmpty
        title="Nothing to pay"
        description="No pending expense shares to repay."
      />
    )
  }

  const count = resolveVisibleCount(actions.length, limit, limit == null ? pageSize : undefined, pagination)
  const items = actions.slice(0, count)

  return (
    <>
      <ul className="space-y-2">
        {items.map((action) => (
          <li key={action.id}>
            <Link
              to={
                action.expenseId
                  ? `/groups/${action.groupId}?expense=${action.expenseId}`
                  : `/groups/${action.groupId}`
              }
              className="flex items-center justify-between rounded-xl border border-border-subtle bg-surface-raised/40 px-4 py-3.5 transition hover:border-negative/30 hover:bg-surface-raised/70"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">
                  Pay {formatHandle(action.counterpartyHandle)}
                  {action.expenseDescription && (
                    <span className="font-normal text-muted">
                      {', '}
                      {action.expenseDescription}
                    </span>
                  )}
                </p>
                <p className="mt-0.5 text-xs text-muted">
                  {action.expenseDescription ? 'Your share' : action.groupName}
                  {action.expenseDescription && `, ${action.groupName}`}
                </p>
              </div>
              <span className="ml-3 shrink-0 font-mono text-sm font-semibold tabular-nums text-negative">
                {formatAmount(action.amountCents)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
      {showPagination && (
        <LoadMoreFooter
          showing={pagination.showing}
          total={actions.length}
          hasMore={pagination.hasMore}
          onLoadMore={pagination.loadMore}
        />
      )}
    </>
  )
}

export function CreditsList({
  credits,
  isLoading,
  limit,
  pageSize = ACTIVITY_PAGE_SIZE,
}: ListProps & { credits: ExpenseCreditSnippet[] } & SliceProps) {
  const pagination = useVisibleCount(credits.length, pageSize)
  const showPagination = limit == null && credits.length > 0

  if (isLoading) return <Skeleton className="h-20 rounded-xl" />
  if (credits.length === 0) {
    return (
      <ListEmpty
        title="All caught up"
        description="No outstanding repayments on expenses you paid."
      />
    )
  }

  const count = resolveVisibleCount(credits.length, limit, limit == null ? pageSize : undefined, pagination)
  const items = credits.slice(0, count)

  return (
    <>
      <ul className="space-y-2">
        {items.map((credit) => (
          <li key={`${credit.groupId}-${credit.expenseId}`}>
            <Link
              to={`/groups/${credit.groupId}?expense=${credit.expenseId}`}
              className="block rounded-xl border border-border-subtle bg-surface/50 px-4 py-3.5 transition hover:border-accent/30 hover:bg-surface-raised/50"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {credit.description}
                  </p>
                  <p className="mt-0.5 text-xs text-muted">{credit.groupName}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-mono text-sm font-semibold tabular-nums text-accent">
                    {formatAmount(credit.pendingCents)}
                  </p>
                  <p className="text-[11px] text-muted">outstanding</p>
                </div>
              </div>
              <div className="mt-2.5 flex items-center gap-2">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface">
                  <div
                    className="h-full rounded-full bg-positive transition-all"
                    style={{
                      width: `${credit.totalCount > 0 ? (credit.paidCount / credit.totalCount) * 100 : 0}%`,
                    }}
                  />
                </div>
                <span className="shrink-0 text-[11px] text-muted">
                  {credit.paidCount}/{credit.totalCount} paid back
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
      {showPagination && (
        <LoadMoreFooter
          showing={pagination.showing}
          total={credits.length}
          hasMore={pagination.hasMore}
          onLoadMore={pagination.loadMore}
        />
      )}
    </>
  )
}

export function RecentActivityList({
  activity,
  isLoading,
  limit,
  pageSize = ACTIVITY_PAGE_SIZE,
}: ListProps & { activity: ExpenseActivity[] } & SliceProps) {
  const pagination = useVisibleCount(activity.length, pageSize)
  const showPagination = limit == null && activity.length > 0
  const count = resolveVisibleCount(activity.length, limit, limit == null ? pageSize : undefined, pagination)
  const items = activity.slice(0, count)

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-16 rounded-xl" />
        <Skeleton className="h-16 rounded-xl" />
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <ListEmpty
        title="No activity yet"
        description="Expenses from your groups will show up here."
      />
    )
  }

  return (
    <>
      <ul className="divide-y divide-border-subtle rounded-xl border border-border-subtle">
        {items.map((item) => (
          <li key={`${item.groupId}-${item.expenseId}-${item.kind ?? 'expense'}-${item.createdAt}`}>
            <Link
              to={`/groups/${item.groupId}?expense=${item.expenseId}`}
              className="flex items-center gap-3 px-4 py-3.5 transition hover:bg-surface-raised/40"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border-subtle bg-surface-raised text-xs font-medium text-muted">
                {item.kind === 'repayment' ? '↩' : item.groupName.charAt(0)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {item.description}
                </p>
                <p className="mt-0.5 text-xs text-muted">
                  <span className="text-foreground/80">{item.groupName}</span>
                  {', '}
                  {item.kind === 'repayment'
                    ? item.isYourRepayment
                      ? 'You repaid your share'
                      : item.isYourReceipt && item.participantHandle
                        ? `${formatHandle(item.participantHandle)} repaid you`
                        : 'Repayment recorded'
                    : item.isYourExpense
                      ? 'You paid'
                      : `${formatHandle(item.payerHandle)} paid`}
                  {', '}
                  {timeAgo(item.createdAt)}
                </p>
              </div>
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0 text-muted">
                <path
                  fillRule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </Link>
          </li>
        ))}
      </ul>
      {showPagination && (
        <LoadMoreFooter
          showing={pagination.showing}
          total={activity.length}
          hasMore={pagination.hasMore}
          onLoadMore={pagination.loadMore}
        />
      )}
    </>
  )
}
