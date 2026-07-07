import type { Expense } from '../../types/contracts.ts'
import { isExpenseYours, payerDisplayName } from '../../lib/utils/format.ts'
import { ExpenseStatusChip } from './ExpenseStatusChip.tsx'

type ExpenseCardProps = {
  expense: Expense
  currentUserAddress?: string
  onSelect: (expenseId: string) => void
  onFlag: (expenseId: string) => void
}

function expenseStatusBadge(expense: Expense): 'paid' | 'all_paid' | 'pending' | null {
  if (expense.isYourExpense) {
    if (
      expense.pendingReceivableCount === 0 &&
      expense.memberCount > 1
    ) {
      return 'all_paid'
    }
    return null
  }
  if (expense.yourShareStatus === 'paid') return 'paid'
  if (expense.yourShareStatus === 'pending') return 'pending'
  return null
}

export function ExpenseCard({ expense, currentUserAddress, onSelect, onFlag }: ExpenseCardProps) {
  const isYours = isExpenseYours(expense, currentUserAddress)
  const statusBadge = expenseStatusBadge(expense)

  return (
    <article className="group relative rounded-xl border border-border bg-surface-raised/30 transition hover:border-border-subtle hover:bg-surface-raised/60">
      <button
        type="button"
        onClick={() => onSelect(expense.id)}
        className="flex w-full items-start gap-3 p-4 text-left"
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium text-foreground">{expense.description}</p>
            {isYours && (
              <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent">
                Yours
              </span>
            )}
            {statusBadge && <ExpenseStatusChip status={statusBadge} />}
            {expense.pendingReceivableCount != null && expense.pendingReceivableCount > 0 && (
              <span className="rounded-full bg-negative/15 px-2 py-0.5 text-[10px] font-medium text-negative">
                {expense.pendingReceivableCount} unpaid
              </span>
            )}
          </div>
          <p className="mt-1.5 text-sm text-muted">
            Paid by {payerDisplayName(expense, currentUserAddress)}, {expense.memberCount} members
          </p>
          {isYours && expense.pendingReceivableCount !== 0 && (
            <p className="mt-1 text-xs text-muted">Tap to see who owes you</p>
          )}
        </div>
        <svg
          viewBox="0 0 20 20"
          fill="currentColor"
          className="mt-0.5 h-5 w-5 shrink-0 text-muted transition group-hover:text-foreground"
        >
          <path
            fillRule="evenodd"
            d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
            clipRule="evenodd"
          />
        </svg>
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onFlag(expense.id)
        }}
        className="absolute right-12 top-4 rounded-lg border border-transparent px-2 py-1 text-xs text-muted opacity-0 transition hover:border-border hover:text-foreground group-hover:opacity-100"
      >
        Flag
      </button>
    </article>
  )
}
