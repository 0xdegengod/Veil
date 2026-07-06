import type { Expense } from '../../types/contracts.ts'
import { EmptyState } from '../shared/EmptyState.tsx'
import { LoadMoreFooter } from '../shared/LoadMoreFooter.tsx'
import { Skeleton } from '../shared/Skeleton.tsx'
import { ExpenseCard } from './ExpenseCard.tsx'

type ExpenseFeedProps = {
  expenses: Expense[]
  total: number
  currentUserAddress?: string
  isLoading: boolean
  isError: boolean
  isEmpty: boolean
  hasMore?: boolean
  isLoadingMore?: boolean
  onLoadMore?: () => void
  onSelect: (expenseId: string) => void
  onFlag: (expenseId: string) => void
}

export function ExpenseFeed({
  expenses,
  total,
  currentUserAddress,
  isLoading,
  isError,
  isEmpty,
  hasMore = false,
  isLoadingMore = false,
  onLoadMore,
  onSelect,
  onFlag,
}: ExpenseFeedProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
      </div>
    )
  }

  if (isError) {
    return (
      <p className="text-sm text-negative">Unable to load expenses.</p>
    )
  }

  if (isEmpty) {
    return (
      <EmptyState
        icon={
          <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" stroke="currentColor" strokeWidth="1.5">
            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        }
        title="No expenses yet"
        description="Add an expense to start splitting costs in this group."
      />
    )
  }

  return (
    <div className="space-y-3">
      {expenses.map((expense) => (
        <ExpenseCard
          key={expense.id}
          expense={expense}
          currentUserAddress={currentUserAddress}
          onSelect={onSelect}
          onFlag={onFlag}
        />
      ))}
      <LoadMoreFooter
        showing={expenses.length}
        total={total}
        hasMore={hasMore}
        onLoadMore={() => onLoadMore?.()}
        isLoading={isLoadingMore}
      />
    </div>
  )
}
