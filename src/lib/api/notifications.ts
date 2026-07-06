import type { Notification } from '../../types/api.ts'
import type { PaginatedResult } from '../../types/pagination.ts'
import { NOTIFICATION_PAGE_SIZE } from '../constants/listLimits.ts'
import { apiFetch } from './client.ts'

type ApiNotification = {
  id: string
  type: string
  message: string
  read: boolean
  link: string | null
  createdAt: string
}

function mapNotification(row: ApiNotification): Notification {
  return {
    id: row.id,
    type: row.type as Notification['type'],
    message: row.message,
    read: row.read,
    createdAt: row.createdAt,
    link: row.link ?? undefined,
  }
}

export type NotificationFilter = 'all' | 'unread'

export async function listNotifications(opts?: {
  limit?: number
  offset?: number
  filter?: NotificationFilter
}): Promise<PaginatedResult<Notification>> {
  const limit = opts?.limit ?? NOTIFICATION_PAGE_SIZE
  const offset = opts?.offset ?? 0
  const filter = opts?.filter ?? 'all'
  const params = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
    filter,
  })
  const data = await apiFetch<PaginatedResult<ApiNotification>>(`/notifications?${params}`)
  return {
    ...data,
    items: data.items.map(mapNotification),
  }
}

export async function markNotificationRead(id: string): Promise<void> {
  await apiFetch(`/notifications/${id}/read`, { method: 'POST' })
}

export async function markAllNotificationsRead(): Promise<void> {
  await apiFetch('/notifications/read-all', { method: 'POST' })
}
