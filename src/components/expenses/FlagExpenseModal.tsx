import { DisputeFlag } from '../dispute/DisputeFlag.tsx'

type FlagExpenseModalProps = {
  expenseId: string | null
  expenseDescription?: string
  alreadyFlagged?: boolean
  isSubmitting: boolean
  onClose: () => void
  onSubmit: (expenseId: string, reason: string) => void
}

export function FlagExpenseModal({
  expenseId,
  expenseDescription,
  alreadyFlagged,
  isSubmitting,
  onClose,
  onSubmit,
}: FlagExpenseModalProps) {
  if (!expenseId) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 lg:items-center lg:p-4">
      <div className="w-full max-w-md rounded-t-2xl border border-border bg-surface-raised p-6 lg:rounded-2xl">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-medium text-foreground">Flag expense</h2>
            {expenseDescription && (
              <p className="mt-1 text-sm text-muted">{expenseDescription}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="text-muted transition hover:text-foreground disabled:opacity-50"
            aria-label="Close"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>

        {alreadyFlagged ? (
          <p className="rounded-lg border border-border-subtle bg-surface px-4 py-3 text-sm text-muted">
            You already have an open flag on this expense. The group admin has been notified.
          </p>
        ) : (
          <DisputeFlag
            expenseId={expenseId}
            onSubmit={(id: string, reason: string) => {
              if (!isSubmitting) onSubmit(id, reason)
            }}
          />
        )}
      </div>
    </div>
  )
}
