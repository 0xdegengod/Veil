import type { TrustTier } from '../../types/contracts.ts'

const TIER_LABELS: Record<TrustTier, string> = {
  low: 'Low trust',
  medium: 'Medium trust',
  high: 'High trust',
}

const TIER_COLORS: Record<TrustTier, string> = {
  low: 'bg-negative',
  medium: 'bg-warning',
  high: 'bg-positive',
}

type TrustBadgeProps = {
  tier: TrustTier
}

export function TrustBadge({ tier }: TrustBadgeProps) {
  return (
    <span className="inline-flex items-center gap-2 text-sm text-locked">
      <span className={`h-2 w-2 rounded-full ${TIER_COLORS[tier]}`} />
      {TIER_LABELS[tier]}
    </span>
  )
}
