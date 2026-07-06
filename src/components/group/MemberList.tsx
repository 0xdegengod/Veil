import { Link } from 'react-router-dom'
import type { Member, TrustTier } from '../../types/contracts.ts'
import { MEMBER_SCROLL_THRESHOLD } from '../../lib/constants/listLimits.ts'
import { formatHandle } from '../../lib/utils/format.ts'
import { EmptyState } from '../shared/EmptyState.tsx'
import { Skeleton } from '../shared/Skeleton.tsx'

type MemberListProps = {
  members: Member[]
  adminAddress?: string
  currentUserAddress?: string
  isLoading: boolean
  isError: boolean
  isEmpty: boolean
  scrollAfter?: number
  settingsHref?: string
}

const TIER_DOT: Record<TrustTier, string> = {
  low: 'bg-negative',
  medium: 'bg-warning',
  high: 'bg-positive',
}

const TIER_LABEL: Record<TrustTier, string> = {
  low: 'Low trust',
  medium: 'Medium trust',
  high: 'High trust',
}

function isSameAddress(a: string | undefined, b: string | undefined): boolean {
  if (!a || !b) return false
  return a.toLowerCase() === b.toLowerCase()
}

function initial(handle: string): string {
  return handle.replace(/^@/, '').charAt(0).toUpperCase() || '?'
}

export function MemberList({
  members,
  adminAddress,
  currentUserAddress,
  isLoading,
  isError,
  isEmpty,
  scrollAfter = MEMBER_SCROLL_THRESHOLD,
  settingsHref,
}: MemberListProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-12 rounded-lg" />
        <Skeleton className="h-12 rounded-lg" />
        <Skeleton className="h-12 rounded-lg" />
      </div>
    )
  }

  if (isError) {
    return <p className="text-sm text-negative">Unable to load members.</p>
  }

  if (isEmpty) {
    return (
      <EmptyState
        icon={
          <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" stroke="currentColor" strokeWidth="1.5">
            <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        }
        title="No members yet"
        description="Invite people to join this group."
      />
    )
  }

  const needsScroll = members.length > scrollAfter

  return (
    <>
      <ul
        className={`divide-y divide-border-subtle ${
          needsScroll ? 'max-h-72 overflow-y-auto pr-1' : ''
        }`}
      >
        {members.map((member) => {
        const isYou = isSameAddress(member.address, currentUserAddress)
        const isAdmin = isSameAddress(member.address, adminAddress)

        return (
          <li key={member.address} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border-subtle bg-surface-raised font-mono text-sm text-muted"
              aria-hidden
            >
              {initial(member.handle)}
            </span>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-medium text-foreground">
                  {isYou ? 'You' : formatHandle(member.handle)}
                </p>
                {isAdmin && (
                  <span className="shrink-0 rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent">
                    Admin
                  </span>
                )}
              </div>
              <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted">
                <span className={`h-1.5 w-1.5 rounded-full ${TIER_DOT[member.trustTier]}`} />
                {TIER_LABEL[member.trustTier]}
              </p>
            </div>
          </li>
        )
      })}
      </ul>
      {needsScroll && settingsHref && (
        <div className="mt-3 border-t border-border-subtle pt-3 text-center">
          <Link to={settingsHref} className="text-sm text-accent hover:underline">
            Manage all {members.length} members
          </Link>
        </div>
      )}
    </>
  )
}
