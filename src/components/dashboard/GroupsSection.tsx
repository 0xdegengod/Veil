import { Link } from 'react-router-dom'
import type { Group } from '../../types/contracts.ts'
import { formatAmount, groupAdminLabel } from '../../lib/utils/format.ts'
import { useWallet } from '../../hooks/useWallet.ts'
import { SectionCard } from '../shared/SectionCard.tsx'
import { Skeleton } from '../shared/Skeleton.tsx'

type GroupsSectionProps = {
  groups: Group[]
  balancesByGroup: { groupId: string; groupName: string; netCents: number }[]
  isLoading: boolean
  limit?: number
  /** Wrap in SectionCard for dashboard grid */
  embedded?: boolean
}

export function GroupsSection({
  groups,
  balancesByGroup,
  isLoading,
  limit,
  embedded = false,
}: GroupsSectionProps) {
  const { address } = useWallet()
  const balanceMap = new Map(balancesByGroup.map((b) => [b.groupId, b.netCents]))
  const visibleGroups = limit ? groups.slice(0, limit) : groups
  const showSeeAll = limit != null && groups.length > limit

  const listContent = (
    <>
      {isLoading && (
        <div className="space-y-2">
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
        </div>
      )}

      {!isLoading && visibleGroups.length === 0 && (
        <p className="rounded-xl border border-dashed border-border-subtle px-4 py-8 text-center text-sm text-muted">
          No groups yet. Use <span className="text-foreground">New group</span> in the header.
        </p>
      )}

      {!isLoading && visibleGroups.length > 0 && (
        <ul className="space-y-2">
          {visibleGroups.map((group) => {
            const net = balanceMap.get(group.id) ?? 0
            const netLabel =
              net > 0
                ? `+${formatAmount(net)}`
                : net < 0
                  ? `-${formatAmount(Math.abs(net))}`
                  : 'Settled'
            const netTone =
              net > 0 ? 'text-positive' : net < 0 ? 'text-negative' : 'text-muted'

            return (
              <li key={group.id}>
                <Link
                  to={`/groups/${group.id}`}
                  className="flex items-center gap-4 rounded-xl border border-border bg-surface/50 px-4 py-3.5 transition hover:border-border-subtle hover:bg-surface-raised/50"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border-subtle bg-surface-raised font-mono text-sm text-muted">
                    {group.name.charAt(0)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-foreground">{group.name}</p>
                    <p className="text-xs text-muted">
                      {groupAdminLabel(group, address)}, {group.memberCount}{' '}
                      {group.memberCount === 1 ? 'member' : 'members'}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className={`font-mono text-sm font-semibold tabular-nums ${netTone}`}>
                      {netLabel}
                    </p>
                    <p className="text-[11px] text-muted">your net</p>
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </>
  )

  if (!embedded) {
    return listContent
  }

  return (
    <SectionCard
      title="Your groups"
      description="Jump into a group"
      action={
        showSeeAll ? (
          <Link to="/groups" className="text-sm text-accent hover:underline">
            See all
          </Link>
        ) : undefined
      }
    >
      {listContent}
    </SectionCard>
  )
}
