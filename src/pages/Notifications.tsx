import type { ReactNode } from 'react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useNotifications } from '../hooks/useNotifications.ts'
import type { NotificationFilter } from '../lib/api/notifications.ts'
import { EmptyState } from '../components/shared/EmptyState.tsx'
import { LoadMoreFooter } from '../components/shared/LoadMoreFooter.tsx'
import { PageHeader } from '../components/shared/PageHeader.tsx'
import { Skeleton } from '../components/shared/Skeleton.tsx'
import type { Notification } from '../types/api.ts'

const TYPE_ICON: Record<Notification['type'], ReactNode> = {
  expense: (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.5">
      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  invite: (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.5">
      <path d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  dispute: (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 9v2m0 4h.01M5 19h14a2 2 0 001.84-2.75L13.74 4a2 2 0 00-3.5 0L3.16 16.25A2 2 0 005 19z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
}

const FILTERS: { id: NotificationFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'unread', label: 'Unread' },
]

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.round(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.round(hrs / 24)
  return `${days}d ago`
}

export function Notifications() {
  const navigate = useNavigate()
  const [filter, setFilter] = useState<NotificationFilter>('all')
  const {
    notifications,
    isLoading,
    isError,
    isEmpty,
    total,
    unreadCount,
    markRead,
    markAllRead,
    hasMore,
    loadMore,
    isLoadingMore,
  } = useNotifications(filter)

  const handleOpen = (n: Notification) => {
    if (!n.read) void markRead(n.id)
    if (n.link) navigate(n.link)
  }

  const description =
    filter === 'unread'
      ? `${total} unread notification${total === 1 ? '' : 's'}`
      : `${total} notification${total === 1 ? '' : 's'}${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`

  return (
    <div className="veil-page">
      <PageHeader
        title="Notifications"
        description="Repayment updates and group alerts. Amounts stay hidden from non-parties."
        action={
          unreadCount > 0 ? (
            <button
              type="button"
              onClick={() => void markAllRead()}
              className="veil-btn-secondary text-sm"
            >
              Mark all read
            </button>
          ) : undefined
        }
      />

      <div className="mb-6 flex gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={`rounded-lg px-3 py-1.5 text-sm transition ${
              filter === f.id
                ? 'bg-surface-raised font-medium text-foreground'
                : 'text-muted hover:bg-surface-raised/50 hover:text-foreground'
            }`}
          >
            {f.label}
            {f.id === 'unread' && unreadCount > 0 && (
              <span className="ml-1.5 text-xs text-accent">({unreadCount})</span>
            )}
          </button>
        ))}
      </div>

      <p className="mb-4 text-sm text-muted">{description}</p>

      {isLoading && (
        <div className="space-y-3">
          <Skeleton className="h-16 rounded-xl" />
          <Skeleton className="h-16 rounded-xl" />
        </div>
      )}

      {isError && (
        <p className="text-sm text-negative">Unable to load notifications.</p>
      )}

      {isEmpty && (
        <EmptyState
          icon={
            <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" stroke="currentColor" strokeWidth="1.5">
              <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          }
          title={filter === 'unread' ? 'All caught up' : 'No notifications'}
          description={
            filter === 'unread'
              ? 'You have no unread notifications.'
              : 'Repayment updates and group alerts will show up here.'
          }
        />
      )}

      {!isLoading && !isError && !isEmpty && (
        <>
          <ul className="space-y-2">
            {notifications.map((n) => (
              <li key={n.id}>
                <button
                  type="button"
                  onClick={() => handleOpen(n)}
                  className={`flex w-full items-center gap-4 rounded-xl border border-border bg-surface p-4 text-left transition hover:border-border-subtle hover:bg-surface-raised/50 ${
                    n.read ? 'opacity-70' : ''
                  }`}
                >
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border ${
                      n.read
                        ? 'border-border-subtle bg-surface-raised text-muted'
                        : 'border-accent/30 bg-accent/10 text-accent'
                    }`}
                  >
                    {TYPE_ICON[n.type]}
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className={`text-sm ${n.read ? 'text-muted' : 'text-foreground'}`}>
                      {n.message}
                    </p>
                    <p className="mt-0.5 text-xs text-muted">{timeAgo(n.createdAt)}</p>
                  </div>

                  {!n.read && (
                    <span className="h-2 w-2 shrink-0 rounded-full bg-accent" aria-label="Unread" />
                  )}
                  {n.link && (
                    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0 text-muted">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              </li>
            ))}
          </ul>
          <LoadMoreFooter
            showing={notifications.length}
            total={total}
            hasMore={hasMore}
            onLoadMore={loadMore}
            isLoading={isLoadingMore}
          />
        </>
      )}
    </div>
  )
}
