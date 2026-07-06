import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect } from 'react'
import { useApiReady } from './useApiReady.ts'
import { useWallet } from './useWallet.ts'
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationFilter,
} from '../lib/api/notifications.ts'
import { NOTIFICATION_PAGE_SIZE } from '../lib/constants/listLimits.ts'
import { useNotificationsStore } from '../store/notifications.ts'

export function useNotifications(filter: NotificationFilter = 'all') {
  const queryClient = useQueryClient()
  const { address } = useWallet()
  const setNotifications = useNotificationsStore((s) => s.setNotifications)
  const markReadLocal = useNotificationsStore((s) => s.markRead)
  const notifications = useNotificationsStore((s) => s.notifications)
  const unreadCount = useNotificationsStore((s) => s.unreadCount)

  const apiReady = useApiReady()

  const query = useInfiniteQuery({
    queryKey: ['notifications', address, filter],
    queryFn: ({ pageParam = 0 }) =>
      listNotifications({
        limit: NOTIFICATION_PAGE_SIZE,
        offset: pageParam,
        filter,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      const next = lastPage.offset + lastPage.items.length
      return next < lastPage.total ? next : undefined
    },
    enabled: apiReady && Boolean(address),
  })

  useEffect(() => {
    if (!query.data) return
    const items = query.data.pages.flatMap((p) => p.items)
    const unread = query.data.pages[0]?.unreadCount
    setNotifications(items, unread)
  }, [query.data, setNotifications])

  const total = query.data?.pages[0]?.total ?? 0

  const markRead = useCallback(
    async (id: string) => {
      markReadLocal(id)
      try {
        await markNotificationRead(id)
        await queryClient.invalidateQueries({ queryKey: ['notifications'] })
      } catch {
        await queryClient.invalidateQueries({ queryKey: ['notifications'] })
      }
    },
    [markReadLocal, queryClient],
  )

  const markAllRead = useCallback(async () => {
    const unread = notifications.filter((n) => !n.read)
    for (const n of unread) markReadLocal(n.id)
    try {
      await markAllNotificationsRead()
      await queryClient.invalidateQueries({ queryKey: ['notifications'] })
    } catch {
      await queryClient.invalidateQueries({ queryKey: ['notifications'] })
    }
  }, [markReadLocal, notifications, queryClient])

  return {
    notifications,
    unreadCount,
    total,
    filter,
    markRead,
    markAllRead,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    isEmpty: !query.isLoading && total === 0,
    hasMore: query.hasNextPage ?? false,
    loadMore: () => void query.fetchNextPage(),
    isLoadingMore: query.isFetchingNextPage,
  }
}

/** Unread badge for header — always uses "all" filter first page. */
export function useNotificationUnreadCount() {
  const { address } = useWallet()
  const apiReady = useApiReady()
  const storeUnread = useNotificationsStore((s) => s.unreadCount)

  const query = useInfiniteQuery({
    queryKey: ['notifications', address, 'badge'],
    queryFn: () => listNotifications({ limit: 1, offset: 0, filter: 'all' }),
    initialPageParam: 0,
    getNextPageParam: () => undefined,
    enabled: apiReady && Boolean(address),
    staleTime: 30_000,
  })

  return query.data?.pages[0]?.unreadCount ?? storeUnread
}
