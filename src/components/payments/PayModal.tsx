import { useEffect, useState } from 'react'
import type { GroupAction } from '../../types/contracts.ts'
import { formatAmount, formatHandle, truncateAddress } from '../../lib/utils/format.ts'
import { getEthUsdPrice } from '../../lib/payments/ethPrice.ts'
import { centsToEthWei, formatEthWei } from '../../lib/payments/centsToEth.ts'
import type { PayMethod } from '../../lib/constants/app.ts'

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
  onPay: (method: PayMethod) => void
}

const STATUS_COPY: Record<Exclude<PayStatus, 'idle'>, string> = {
  approving: 'Preparing payment…',
  encrypting: 'Recording repayment…',
  confirming: 'Confirm Sepolia ETH transfer in your wallet…',
  success: 'Payment sent to payee.',
}

export function PayModal({ action, status, onClose, onPay }: PayModalProps) {
  const [ethUsd, setEthUsd] = useState<number | null>(null)
  const method: PayMethod = 'SEPOLIA_ETH'

  useEffect(() => {
    if (!action) return
    void getEthUsdPrice().then(setEthUsd)
  }, [action])

  if (!action) return null

  const isBusy = status !== 'idle' && status !== 'success'
  const isDone = status === 'success'
  const ethWei =
    ethUsd != null ? centsToEthWei(action.amountCents, ethUsd) : null

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
          {method === 'SEPOLIA_ETH' && ethWei != null && ethWei > 0n && (
            <p className="mt-2 font-mono text-sm tabular-nums text-accent">
              ≈ {formatEthWei(ethWei)} ETH
              {ethUsd != null && (
                <span className="text-muted"> @ ${ethUsd.toLocaleString()} / ETH</span>
              )}
            </p>
          )}
        </div>

        {action.counterpartyAddress && (
          <div className="mb-4 rounded-lg border border-border-subtle bg-surface/60 px-3 py-2.5 text-left">
            <p className="text-[11px] uppercase tracking-wide text-muted">Payee receives</p>
            <p className="mt-0.5 font-mono text-xs text-foreground">
              {truncateAddress(action.counterpartyAddress)}
            </p>
          </div>
        )}

        {!isDone && (
          <div className="mb-6 rounded-xl border border-accent/30 bg-accent/5 px-4 py-3 text-left">
            <p className="text-sm font-medium text-foreground">Sepolia ETH</p>
            <p className="mt-1 text-xs text-muted">
              Repayments are sent as native ETH to the payee&apos;s wallet on Sepolia testnet.
            </p>
          </div>
        )}

        <div className="mb-5 flex items-start gap-2 rounded-lg border border-border-subtle bg-surface/60 p-3 text-left">
          <svg viewBox="0 0 20 20" fill="currentColor" className="mt-0.5 h-4 w-4 shrink-0 text-accent">
            <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
          </svg>
          <p className="text-xs leading-relaxed text-muted">
            The owed amount comes from your FHE-decrypted share. Sepolia ETH is sent directly to
            the payee&apos;s address; we verify the transaction before marking your share paid.
          </p>
        </div>

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
              onClick={() => onPay(method)}
              disabled={isBusy || method !== 'SEPOLIA_ETH'}
              className="veil-btn-primary flex-1"
            >
              {isBusy
                ? 'Processing…'
                : ethWei != null && method === 'SEPOLIA_ETH'
                  ? `Pay ${formatEthWei(ethWei)} ETH`
                  : `Pay ${formatAmount(action.amountCents)}`}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
