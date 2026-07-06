import { create } from 'zustand'
import type { Notification } from '../types/api.ts'
import { sortByLatest } from '../lib/utils/sort.ts'

type NotificationsStore = {
  notifications: Notification[]
  unreadCount: number
  setNotifications: (notifications: Notification[], serverUnread?: number) => void
  markRead: (id: string) => void
}

export const useNotificationsStore = create<NotificationsStore>((set) => ({
  notifications: [],
  unreadCount: 0,

  setNotifications: (notifications, serverUnread) =>
    set({
      notifications: sortByLatest(notifications),
      unreadCount:
        serverUnread ?? notifications.filter((n) => !n.read).length,
    }),

  markRead: (id) =>
    set((state) => {
      const notifications = state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n,
      )
      return {
        notifications,
        unreadCount: notifications.filter((n) => !n.read).length,
      }
    }),
}))
