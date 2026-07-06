import { useEffect } from 'react'
import { formatAmount } from '../../lib/utils/format.ts'
import { useBalanceStore } from '../../store/balance.ts'
import { LockIcon } from '../shared/LockIcon.tsx'
import { Skeleton } from '../shared/Skeleton.tsx'
import { RevealButton, type RevealStatus } from './RevealButton.tsx'

type BalanceCardProps = {
  isLoading: boolean
  isError: boolean
  revealStatus: RevealStatus
  onReveal: () => void
  className?: string
}

function LockedPulseBars() {
  return (
    <div className="flex flex-col items-center gap-2.5">
      <div className="h-3 w-36 animate-pulse rounded-full bg-locked" />
      <div className="h-3 w-28 animate-pulse rounded-full bg-locked" />
      <div className="h-3 w-32 animate-pulse rounded-full bg-locked" />
    </div>
  )
}

function formatCountdown(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export function BalanceCard({
  isLoading,
  isError,
  revealStatus,
  onReveal,
  className = '',
}: BalanceCardProps) {
  const revealed = useBalanceStore((s) => s.revealed)
  const countdownSeconds = useBalanceStore((s) => s.countdownSeconds)
  const tickCountdown = useBalanceStore((s) => s.tickCountdown)

  useEffect(() => {
    if (!revealed) return
    const interval = setInterval(tickCountdown, 1000)
    return () => clearInterval(interval)
  }, [revealed, tickCountdown])

  if (isLoading) {
    return <Skeleton className={`min-h-[17.5rem] rounded-2xl ${className}`} />
  }

  if (isError) {
    return (
      <div
        className={`flex min-h-[17.5rem] w-full items-center justify-center rounded-2xl border border-border bg-locked-bg p-8 text-center ${className}`}
      >
        <p className="text-sm text-negative">Unable to load balance.</p>
      </div>
    )
  }

  const isRevealed = revealStatus === 'revealed' && revealed

  return (
    <div
      className={`flex h-full min-h-[17.5rem] w-full flex-col rounded-2xl border border-border bg-locked-bg p-6 text-center sm:p-8 ${className}`}
    >
      <div className="mb-1 flex items-center justify-center gap-2 text-xs font-medium uppercase tracking-wider text-muted">
        <LockIcon className="text-sm" />
        Your balance
      </div>

      <div className="flex flex-1 flex-col items-center justify-center">
        <div className="mb-6 flex min-h-[4rem] items-center justify-center">
        {isRevealed ? (
          <p className="animate-fade-in font-mono text-4xl font-medium tabular-nums tracking-tight text-foreground sm:text-5xl">
            {formatAmount(revealed.amountCents)}
          </p>
        ) : (
          <LockedPulseBars />
        )}
        </div>

        {isRevealed && (
          <p className="mb-5 font-mono text-xs tabular-nums text-muted">
            Auto-locks in {formatCountdown(countdownSeconds)}
          </p>
        )}
      </div>

      <RevealButton status={revealStatus} onReveal={onReveal} />
    </div>
  )
}
