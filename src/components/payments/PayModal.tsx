import type { GroupAction } from '../../types/contracts.ts'
import { usePaymentBalances } from '../../hooks/usePaymentBalances.ts'
import { formatAmount, formatHandle, truncateAddress } from '../../lib/utils/format.ts'
import { centsToUsdcUnits, formatUsdcUnits } from '../../lib/payments/centsToUsdc.ts'
import { TestTokenFaucet } from './TestTokenFaucet.tsx'

export type PayStatus =
  | 'idle'
  | 'approving'
  | 'encrypting'
  | 'confirming'
  | 'success'

type PayModalProps = {
  action: GroupAction | null
  status: PayStatus
  onClose: () => void
  onPay: () => void
}

const STATUS_COPY: Record<Exclude<PayStatus, 'idle'>, string> = {
  approving: 'Approving USDC for confidential wrap…',
  encrypting: 'Encrypting payment amount…',
  confirming: 'Confirm the transaction in your wallet…',
  success: 'Confidential payment sent to payee.',
}

export function PayModal({ action, status, onClose, onPay }: PayModalProps) {
  const { usdcBalance, isLoading: balancesLoading, isConnected } = usePaymentBalances()

  if (!action) return null

  const isBusy = status !== 'idle' && status !== 'success'
  const isDone = status === 'success'
  const usdcUnits = centsToUsdcUnits(action.amountCents)

  const hasEnoughUsdc =
    usdcBalance != null && usdcUnits > 0n && usdcBalance >= usdcUnits

  const canPay = isConnected && !balancesLoading && hasEnoughUsdc

  const insufficientMessage = !isConnected
    ? 'Connect your wallet to pay.'
    : balancesLoading
      ? 'Checking wallet balance…'
      : !hasEnoughUsdc
        ? `Need ${formatUsdcUnits(usdcUnits)} USDC to wrap and pay confidentially.`
        : null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 lg:items-center lg:p-4">
      <div className="w-full max-w-md rounded-t-2xl border border-border bg-surface-raised p-6 lg:rounded-2xl">
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-medium text-foreground">
              {isDone ? 'Payment sent' : 'Pay'} {formatHandle(action.counterpartyHandle)}
            </h2>
            <p className="mt-1 text-sm text-muted">
              {action.expenseDescription
                ? `Your share for ${action.expenseDescription}`
                : 'Expense share repayment'}
            </p>
          </div>
          {!isBusy && (
            <button
              type="button"
              onClick={onClose}
              className="text-muted transition hover:text-foreground"
              aria-label="Close"
            >
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
              </svg>
            </button>
          )}
        </div>

        <div className="mb-4 rounded-xl border border-border-subtle bg-surface p-4 text-center">
          <p className="text-xs uppercase tracking-wide text-muted">Amount due (decrypted)</p>
          <p className="mt-1 font-mono text-3xl font-semibold tabular-nums text-foreground">
            {formatAmount(action.amountCents)}
          </p>
          {usdcUnits > 0n && (
            <p className="mt-2 font-mono text-sm tabular-nums text-accent">
              {formatUsdcUnits(usdcUnits)} cUSD
            </p>
          )}
        </div>

        <div className="mb-4 flex items-center justify-between rounded-lg border border-border-subtle bg-surface/60 px-3 py-2.5">
          <p className="text-[11px] uppercase tracking-wide text-muted">Your USDC balance</p>
          <p className="font-mono text-sm tabular-nums text-foreground">
            {!isConnected
              ? '—'
              : balancesLoading || usdcBalance == null
                ? 'Checking…'
                : `${formatUsdcUnits(usdcBalance)} USDC`}
          </p>
        </div>

        {action.counterpartyAddress && (
          <div className="mb-4 rounded-lg border border-border-subtle bg-surface/60 px-3 py-2.5 text-left">
            <p className="text-[11px] uppercase tracking-wide text-muted">Payee address</p>
            <p className="mt-0.5 font-mono text-xs text-foreground">
              {truncateAddress(action.counterpartyAddress)}
            </p>
          </div>
        )}

        <div className="mb-5 flex items-start gap-2 rounded-lg border border-border-subtle bg-surface/60 p-3 text-left">
          <svg viewBox="0 0 20 20" fill="currentColor" className="mt-0.5 h-4 w-4 shrink-0 text-accent">
            <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
          </svg>
          <p className="text-xs leading-relaxed text-muted">
            Your USDC is wrapped into confidential cUSD and transferred encrypted. Only you and the
            payee can decrypt the amount on-chain.
          </p>
        </div>

        {insufficientMessage && !isDone && !isBusy && (
          <p className="mb-3 text-center text-sm text-negative">{insufficientMessage}</p>
        )}

        {!isDone && !isBusy && !canPay && isConnected && !balancesLoading && (
          <div className="mb-4">
            <TestTokenFaucet compact />
          </div>
        )}

        {status !== 'idle' && (
          <p
            className={`mb-4 text-center text-sm ${
              isDone ? 'text-positive' : 'text-muted'
            }`}
          >
            {STATUS_COPY[status]}
          </p>
        )}

        {isDone ? (
          <button type="button" onClick={onClose} className="veil-btn-primary w-full">
            Done
          </button>
        ) : (
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isBusy}
              className="veil-btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onPay}
              disabled={isBusy || !canPay}
              className="veil-btn-primary flex-1 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isBusy
                ? 'Processing…'
                : usdcUnits > 0n
                  ? `Pay ${formatUsdcUnits(usdcUnits)} cUSD`
                  : `Pay ${formatAmount(action.amountCents)}`}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
