import { Link } from 'react-router-dom'
import type { Group } from '../../types/contracts.ts'
import { groupAdminLabel } from '../../lib/utils/format.ts'
import { useWallet } from '../../hooks/useWallet.ts'
import { Skeleton } from '../shared/Skeleton.tsx'

type GroupCardProps = {
  group: Group | null
  isLoading: boolean
  isError: boolean
  onClick?: (groupId: string) => void
}

export function GroupCard({ group, isLoading, isError, onClick }: GroupCardProps) {
  const { address } = useWallet()

  if (isLoading) return <Skeleton className="h-24 rounded-2xl" />

  if (isError) {
    return (
      <p className="text-sm text-negative">Unable to load group.</p>
    )
  }

  if (!group) return null

  const content = (
    <>
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border-subtle bg-surface-raised font-mono text-sm text-muted">
        {group.name.charAt(0).toUpperCase()}
      </div>
      <div className="min-w-0 flex-1 text-left">
        <p className="truncate font-medium text-foreground">{group.name}</p>
        <p className="mt-0.5 text-sm text-muted">
          {groupAdminLabel(group, address)}, {group.memberCount}{' '}
          {group.memberCount === 1 ? 'member' : 'members'}
        </p>
      </div>
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 shrink-0 text-muted">
        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
      </svg>
    </>
  )

  const className =
    'group flex w-full items-center gap-4 rounded-2xl border border-border bg-surface p-4 text-left transition hover:border-border-subtle hover:bg-surface-raised/50'

  if (onClick) {
    return (
      <button type="button" onClick={() => onClick(group.id)} className={className}>
        {content}
      </button>
    )
  }

  return (
    <Link to={`/groups/${group.id}`} className={className}>
      {content}
    </Link>
  )
}
