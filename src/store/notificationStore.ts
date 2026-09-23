import { create } from 'zustand'
import { getNotifications } from '../apis/notifications.api'

interface NotificationStoreType {
  unreadCount: number
  readCount: number
  totalCount: number
  isDrawerOpen: boolean
  refreshKey: number
  setUnreadCount: (count: number) => void
  setCounts: (counts: {
    unreadCount?: number
    readCount?: number
    totalCount?: number
  }) => void
  decrementUnreadCount: () => void
  setIsDrawerOpen: (open: boolean) => void
  triggerRefresh: () => void
  fetchCounts: () => Promise<void>
}

export const useNotificationStore = create<NotificationStoreType>((set) => ({
  unreadCount: 0,
  readCount: 0,
  totalCount: 0,
  isDrawerOpen: false,
  refreshKey: 0,
  setUnreadCount: (count) => set({ unreadCount: Math.max(0, count) }),
  setCounts: (counts) =>
    set((state) => ({
      unreadCount:
        counts.unreadCount !== undefined
          ? Math.max(0, counts.unreadCount)
          : state.unreadCount,
      readCount:
        counts.readCount !== undefined
          ? Math.max(0, counts.readCount)
          : state.readCount,
      totalCount:
        counts.totalCount !== undefined
          ? Math.max(0, counts.totalCount)
          : state.totalCount,
    })),
  decrementUnreadCount: () =>
    set((state) => ({
      unreadCount: Math.max(0, state.unreadCount - 1),
      readCount: state.readCount + 1,
    })),
  setIsDrawerOpen: (open) => set({ isDrawerOpen: open }),
  triggerRefresh: () => set((state) => ({ refreshKey: state.refreshKey + 1 })),
  fetchCounts: async () => {
    try {
      const data = await getNotifications({ per_page: 1 })
      set({
        unreadCount: data?.unread_count ?? 0,
        readCount: data?.read_count ?? 0,
        totalCount: data?.total_count ?? 0,
      })
    } catch {
      // Ignore if unauthenticated or network error
    }
  },
}))
