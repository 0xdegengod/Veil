import type { DashboardSummary } from '../../types/contracts.ts'
import { formatAmount } from '../../lib/utils/format.ts'
import { Skeleton } from '../shared/Skeleton.tsx'

type DashboardOverviewProps = {
  summary: DashboardSummary
  isLoading: boolean
}

export function DashboardOverview({ summary, isLoading }: DashboardOverviewProps) {
  if (isLoading) {
    return (
      <div className="grid gap-3 sm:grid-cols-3">
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-28 rounded-2xl" />
      </div>
    )
  }

  const net = summary.netPositionCents
  const netLabel =
    net > 0 ? 'Net credit' : net < 0 ? 'Net owed' : 'All settled up'
  const netAmount = formatAmount(Math.abs(net))
  const netTone =
    net > 0 ? 'text-positive' : net < 0 ? 'text-negative' : 'text-muted'

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <div className="rounded-2xl border border-border bg-surface p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">You owe</p>
        <p className="mt-2 font-mono text-2xl font-semibold tabular-nums text-negative">
          {formatAmount(summary.totalYouOweCents)}
        </p>
        <p className="mt-1 text-xs text-muted">Across {summary.balancesByGroup.length} groups</p>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">Owed to you</p>
        <p className="mt-2 font-mono text-2xl font-semibold tabular-nums text-positive">
          {formatAmount(summary.totalOwedToYouCents)}
        </p>
        <p className="mt-1 text-xs text-muted">
          {summary.creditsFromExpenses.length > 0
            ? `${summary.creditsFromExpenses.length} expenses with receivables`
            : 'From group balances'}
        </p>
      </div>

      <div className="rounded-2xl border border-accent/30 bg-accent/5 p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">{netLabel}</p>
        <p className={`mt-2 font-mono text-2xl font-semibold tabular-nums ${netTone}`}>
          {net === 0 ? formatAmount(0) : netAmount}
        </p>
        <p className="mt-1 text-xs text-muted">
          {summary.pendingPayCount + summary.pendingReceiveCount > 0
            ? `${summary.pendingPayCount} to pay, ${summary.pendingReceiveCount} awaiting`
            : 'No pending repayments'}
        </p>
      </div>
    </div>
  )
}
