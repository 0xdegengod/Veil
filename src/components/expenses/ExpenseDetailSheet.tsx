import type { ExpenseDetail } from '../../types/contracts.ts'
import { formatAmount, formatHandle, timeAgo } from '../../lib/utils/format.ts'
import { ExpenseStatusChip } from './ExpenseStatusChip.tsx'

type ExpenseDetailSheetProps = {
  detail: ExpenseDetail | null
  isLoading: boolean
  onClose: () => void
  onRemind?: (memberAddress: string, handle: string) => void
  remindingAddress?: string | null
}

export function ExpenseDetailSheet({
  detail,
  isLoading,
  onClose,
  onRemind,
  remindingAddress,
}: ExpenseDetailSheetProps) {
  if (!detail && !isLoading) return null

  const isPayer = detail?.viewerRole === 'payer'
  const isParticipant = detail?.viewerRole === 'participant'
  const canSeeAmounts = isPayer || isParticipant

  const others = detail?.shares.filter((s) => s.memberHandle !== detail.payerHandle) ?? []
  const paidCount = others.filter((s) => s.status === 'paid').length
  const progress = others.length > 0 ? (paidCount / others.length) * 100 : 0

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 lg:items-center lg:p-4">
      <div
        className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-border bg-surface-raised lg:rounded-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="expense-detail-title"
      >
        <div className="flex items-center justify-between border-b border-border-subtle px-5 py-4">
          <h2 id="expense-detail-title" className="text-base font-medium text-foreground">
            Expense details
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted transition hover:bg-surface hover:text-foreground"
            aria-label="Close"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-5">
          {isLoading && (
            <div className="space-y-4">
              <div className="h-6 w-2/3 animate-pulse rounded bg-surface" />
              <div className="h-4 w-1/3 animate-pulse rounded bg-surface" />
              <div className="h-24 animate-pulse rounded-xl bg-surface" />
              <p className="text-xs text-muted">Decrypting authorized amounts…</p>
            </div>
          )}

          {!isLoading && detail && (
            <div className="space-y-6">
              <div>
                <p className="text-lg font-semibold text-foreground">{detail.description}</p>
                <p className="mt-1.5 text-sm text-muted">
                  Paid by {isPayer ? 'You' : formatHandle(detail.payerHandle)},{' '}
                  {timeAgo(detail.createdAt)}
                </p>
              </div>

              {canSeeAmounts && detail.totalCents > 0 && (
                <div className="rounded-xl border border-border-subtle bg-surface/60 p-4">
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm text-muted">Total</span>
                    <span className="font-mono text-xl font-semibold tabular-nums text-foreground">
                      {formatAmount(detail.totalCents)}
                    </span>
                  </div>
                  {isParticipant && !isPayer && detail.yourShareCents != null && (
                    <p className="mt-2 text-sm text-muted">
                      Your share:{' '}
                      <span className="font-mono font-medium text-foreground">
                        {formatAmount(detail.yourShareCents)}
                      </span>
                    </p>
                  )}
                </div>
              )}

              {!canSeeAmounts && (
                <div className="rounded-xl border border-border-subtle bg-surface/40 px-4 py-3">
                  <p className="text-sm text-muted">
                    Amounts are private. Only the payer and people in the split can see details.
                  </p>
                </div>
              )}

              {isPayer && others.length > 0 && detail.receivableCents > 0 && (
                <div>
                  <div className="mb-3 flex items-center justify-between text-sm">
                    <span className="text-muted">Collected from others</span>
                    <span className="font-mono tabular-nums text-foreground">
                      {formatAmount(detail.receivableCents - detail.pendingReceivableCents)}
                      <span className="text-muted"> / {formatAmount(detail.receivableCents)}</span>
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-surface">
                    <div
                      className="h-full rounded-full bg-positive transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="mt-1.5 text-xs text-muted">
                    {paidCount} of {others.length} paid back
                    {detail.pendingReceivableCents > 0 &&
                      `, ${formatAmount(detail.pendingReceivableCents)} still outstanding`}
                  </p>
                </div>
              )}

              {canSeeAmounts && detail.shares.length > 0 && (
                <div>
                  <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">
                    {isPayer ? 'Who owes what' : 'Your share'}
                  </h3>
                  <ul className="divide-y divide-border-subtle rounded-xl border border-border-subtle">
                    {detail.shares.map((share) => {
                      const isPayerRow = share.memberHandle === detail.payerHandle
                      return (
                        <li
                          key={share.memberAddress}
                          className="flex items-center gap-3 px-4 py-3.5 first:rounded-t-xl last:rounded-b-xl"
                        >
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border-subtle bg-surface-raised font-mono text-xs text-muted">
                            {share.memberHandle.replace(/^@/, '').charAt(0).toUpperCase()}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-foreground">
                              {isPayerRow && isPayer
                                ? 'You'
                                : formatHandle(share.memberHandle)}
                              {isPayerRow && (
                                <span className="ml-2 text-xs font-normal text-muted">(payer)</span>
                              )}
                            </p>
                            <p className="mt-0.5 font-mono text-sm tabular-nums text-foreground">
                              {share.amountCents > 0 ? (
                                formatAmount(share.amountCents)
                              ) : (
                                <span className="text-locked">Encrypted on-chain</span>
                              )}
                            </p>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            <ExpenseStatusChip status={share.status} />
                            {isPayer &&
                              !isPayerRow &&
                              share.status === 'pending' &&
                              onRemind && (
                                <button
                                  type="button"
                                  disabled={
                                    share.canRemind === false ||
                                    remindingAddress === share.memberAddress
                                  }
                                  title={
                                    share.canRemind === false
                                      ? 'Reminder already sent today'
                                      : undefined
                                  }
                                  onClick={() => onRemind(share.memberAddress, share.memberHandle)}
                                  className="rounded-lg border border-border px-2.5 py-1 text-[11px] text-muted transition hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                  {remindingAddress === share.memberAddress
                                    ? 'Sending…'
                                    : share.canRemind === false
                                      ? 'Reminded'
                                      : 'Remind'}
                                </button>
                              )}
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )}

              {isPayer && detail.pendingReceivableCents > 0 && (
                <p className="text-xs leading-relaxed text-muted">
                  Settlement payments are tracked per expense. When someone pays you back, their
                  status updates here.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
