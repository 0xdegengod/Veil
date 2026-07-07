import { useQueryClient } from '@tanstack/react-query'
import { formatUsdcUnits } from '../../lib/payments/centsToUsdc.ts'
import type {
  ConfidentialUsdcRevealStatus,
  ConfidentialUsdcUnwrapStatus,
} from '../../hooks/useConfidentialUsdc.ts'
import { toast } from '../../store/toast.ts'
import { LockIcon } from './LockIcon.tsx'

/** Ciphertext placeholder used across Veil when an amount is encrypted. */
export const ENCRYPTED_AMOUNT_PLACEHOLDER = '•••'

const UNWRAP_COPY = {
  requesting: 'Unwrapping…',
  decrypting: 'Decrypting…',
  finalizing: 'Releasing…',
} as const

type AccountMenuCusdProps = {
  units: bigint | null
  isRevealed: boolean
  hasEncryptedBalance: boolean
  revealStatus: ConfidentialUsdcRevealStatus
  unwrapStatus: ConfidentialUsdcUnwrapStatus
  isUnwrapping: boolean
  onReveal: () => void
  onUnwrap: () => Promise<bigint>
}

/** Compact cUSD balance + decrypt/unwrap controls for the account dropdown. */
export function AccountMenuCusd({
  units,
  isRevealed,
  hasEncryptedBalance,
  revealStatus,
  unwrapStatus,
  isUnwrapping,
  onReveal,
  onUnwrap,
}: AccountMenuCusdProps) {
  const queryClient = useQueryClient()

  if (!hasEncryptedBalance && !isRevealed) {
    return null
  }

  const handleUnwrap = async () => {
    try {
      const unwrapped = await onUnwrap()
      await queryClient.invalidateQueries()
      toast.success(`Unwrapped ${formatUsdcUnits(unwrapped)} USDC to your wallet`)
    } catch (err) {
      const code = err instanceof Error ? err.message : ''
      if (code === 'no_confidential_balance') {
        toast.error('No confidential cUSD to unwrap')
      } else if (code === 'wallet_not_connected') {
        toast.error('Connect your wallet first')
      } else {
        toast.error('Unwrap failed or was rejected')
      }
    }
  }

  const canUnwrap = isRevealed && units != null && units > 0n

  return (
    <div className="border-b border-border/60 px-3 py-2.5">
      <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted">
        <LockIcon className="text-[10px]" />
        Confidential cUSD
      </div>

      <p className="mt-1 font-mono text-lg font-medium tabular-nums text-foreground">
        {isRevealed && units != null ? (
          <>
            {formatUsdcUnits(units)}
            <span className="ml-1 text-sm font-normal text-muted">cUSD</span>
          </>
        ) : (
          <>
            <span className="tracking-widest text-muted">{ENCRYPTED_AMOUNT_PLACEHOLDER}</span>
            <span className="ml-1 text-sm font-normal text-muted">cUSD</span>
          </>
        )}
      </p>

      <div className="mt-2 flex gap-1.5">
        <button
          type="button"
          onClick={() => void onReveal()}
          disabled={revealStatus === 'signing' || isUnwrapping}
          className="flex-1 rounded-lg border border-border-subtle bg-surface px-2 py-1.5 text-xs font-medium text-foreground transition hover:bg-surface-raised disabled:cursor-not-allowed disabled:opacity-50"
        >
          {revealStatus === 'signing' ? 'Decrypting…' : 'Decrypt'}
        </button>
        <button
          type="button"
          onClick={() => void handleUnwrap()}
          disabled={!canUnwrap || isUnwrapping}
          className="flex-1 rounded-lg border border-accent/30 bg-accent/10 px-2 py-1.5 text-xs font-medium text-accent transition hover:bg-accent/20 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isUnwrapping
            ? UNWRAP_COPY[unwrapStatus as keyof typeof UNWRAP_COPY] ?? 'Unwrapping…'
            : 'Unwrap'}
        </button>
      </div>

      {revealStatus === 'error' && (
        <p className="mt-1.5 text-[11px] text-negative">Decrypt failed. Try again.</p>
      )}
    </div>
  )
}

/** Amount shown on the account menu trigger before the dropdown opens. */
export function AccountMenuCusdBadge({
  units,
  isRevealed,
  hasEncryptedBalance,
}: {
  units: bigint | null
  isRevealed: boolean
  hasEncryptedBalance: boolean
}) {
  if (!hasEncryptedBalance && !isRevealed) return null

  return (
    <span className="font-mono text-[11px] tabular-nums sm:text-xs">
      {isRevealed && units != null ? (
        <span className="text-accent">{formatUsdcUnits(units)} cUSD</span>
      ) : (
        <span className="inline-flex items-center gap-1 text-muted">
          <span className="tracking-widest">{ENCRYPTED_AMOUNT_PLACEHOLDER}</span>
          <span>cUSD</span>
        </span>
      )}
    </span>
  )
}
