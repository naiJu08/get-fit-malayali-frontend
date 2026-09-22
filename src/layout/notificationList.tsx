import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import CustomDrawer from '../components/common/drawer/index'
import NotificationItem from './notifications/NotificationItem'
import NotificationLoader from './notifications/notificationLoader'
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification as apiDeleteNotification,
  NotificationRecord,
} from '../apis/notifications.api'
import { useNotificationStore } from '../store/notificationStore'
import { useSnackbarManager } from '../components/common/snackbar'

interface NotificationListProps {
  open: boolean
  handleClose: () => void
}

type TabType = 'new' | 'read' | 'all'

const PAGE_SIZE = 20

export default function NotificationList({
  open,
  handleClose,
}: NotificationListProps) {
  const navigate = useNavigate()
  const { enqueueSnackbar } = useSnackbarManager()
  const {
    unreadCount,
    readCount,
    totalCount,
    setCounts,
    decrementUnreadCount,
    refreshKey,
    triggerRefresh,
  } = useNotificationStore()

  const [activeTab, setActiveTab] = useState<TabType>('new')
  const [notifications, setNotifications] = useState<NotificationRecord[]>([])
  const [page, setPage] = useState<number>(1)
  const [hasMore, setHasMore] = useState<boolean>(true)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false)
  const [searchQuery, setSearchQuery] = useState<string>('')

  const scrollContainerRef = useRef<HTMLDivElement | null>(null)

  // Fetch page of notifications for given tab
  const loadNotifications = useCallback(
    async (tab: TabType, targetPage: number, isInitial = false) => {
      if (isInitial) {
        setIsLoading(true)
      } else {
        setIsLoadingMore(true)
      }

      try {
        const statusParam = tab === 'all' ? undefined : tab
        const data = await getNotifications({
          status: statusParam,
          page: targetPage,
          per_page: PAGE_SIZE,
        })

        const newItems = data?.notifications || []

        setNotifications((prev) => {
          if (targetPage === 1) {
            return newItems
          }
          // Avoid duplicate items if any
          const existingIds = new Set(prev.map((n) => String(n.id)))
          const uniqueNew = newItems.filter(
            (n) => !existingIds.has(String(n.id))
          )
          return [...prev, ...uniqueNew]
        })

        // Update counts from backend response
        setCounts({
          unreadCount: data?.unread_count ?? 0,
          readCount: data?.read_count ?? 0,
          totalCount: data?.total_count ?? 0,
        })

        setPage(targetPage)

        if (data?.meta) {
          setHasMore(data.meta.next_page !== null)
        } else {
          setHasMore(newItems.length >= PAGE_SIZE)
        }
      } catch (error) {
        console.error('Failed to load notifications:', error)
      } finally {
        if (isInitial) {
          setIsLoading(false)
        } else {
          setIsLoadingMore(false)
        }
      }
    },
    [setCounts]
  )

  // Initial load when drawer opens or refreshKey changes
  useEffect(() => {
    if (open) {
      setPage(1)
      setHasMore(true)
      loadNotifications(activeTab, 1, true)
    }
  }, [open, refreshKey, activeTab, loadNotifications])

  // Handle Tab Switch
  const handleTabChange = (newTab: TabType) => {
    if (newTab === activeTab) return
    setActiveTab(newTab)
    setPage(1)
    setHasMore(true)
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0
    }
  }

  // Handle Scroll to load more (Infinite Scroll)
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget
    const isNearBottom =
      target.scrollHeight - target.scrollTop - target.clientHeight <= 140

    if (isNearBottom && hasMore && !isLoading && !isLoadingMore) {
      loadNotifications(activeTab, page + 1, false)
    }
  }

  // Handle Mark as Read for single item
  const handleMarkAsRead = async (id: number | string) => {
    try {
      await markNotificationAsRead(id)
      setNotifications((prev) =>
        prev.map((item) =>
          String(item.id) === String(id) ? { ...item, is_read: true } : item
        )
      )
      decrementUnreadCount()
      enqueueSnackbar('Marked as read', { variant: 'success' })
    } catch {
      enqueueSnackbar('Failed to mark as read', { variant: 'error' })
    }
  }

  // Handle Mark All as Read
  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead()
      setNotifications((prev) =>
        prev.map((item) => ({ ...item, is_read: true }))
      )
      setCounts({
        unreadCount: 0,
        readCount: totalCount,
      })
      enqueueSnackbar('All notifications marked as read', {
        variant: 'success',
      })
      if (activeTab === 'new') {
        // Refresh the new tab
        loadNotifications('new', 1, true)
      }
    } catch {
      enqueueSnackbar('Failed to mark all as read', { variant: 'error' })
    }
  }

  // Handle Go to Page
  const handleNavigate = async (url: string, id: number | string) => {
    try {
      const targetItem = notifications.find(
        (item) => String(item.id) === String(id)
      )
      if (targetItem && !targetItem.is_read) {
        await markNotificationAsRead(id)
        decrementUnreadCount()
      }
    } catch {
      // Non-blocking error
    } finally {
      handleClose()
      navigate(url)
    }
  }

  // Handle Delete
  const handleDelete = async (id: number | string) => {
    try {
      await apiDeleteNotification(id)
      setNotifications((prev) =>
        prev.filter((item) => String(item.id) !== String(id))
      )
      triggerRefresh()
      enqueueSnackbar('Notification removed', { variant: 'success' })
    } catch {
      enqueueSnackbar('Failed to delete notification', { variant: 'error' })
    }
  }

  // Client search filter across loaded items
  const filteredNotifications = useMemo(() => {
    if (!searchQuery.trim()) return notifications
    const q = searchQuery.toLowerCase()
    return notifications.filter((item) => {
      const titleMatch = item.title?.toLowerCase().includes(q)
      const msgMatch = item.message?.toLowerCase().includes(q)
      const typeMatch = item.notification_type?.toLowerCase().includes(q)
      return titleMatch || msgMatch || typeMatch
    })
  }, [notifications, searchQuery])

  return (
    <CustomDrawer
      className="formDrawer w-[520px] max-w-[95vw]"
      open={open}
      handleClose={handleClose}
      title="Message Box"
    >
      <div className="flex flex-col h-full w-full bg-gray-50/50 dark:bg-gray-900">
        {/* Top Control Bar: Header info & Mark all as read */}
        <div className="p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">
              Notifications
            </span>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700 dark:bg-red-900/60 dark:text-red-300">
                {unreadCount} New
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/40 dark:text-blue-300 dark:hover:bg-blue-900/60 rounded-lg transition-colors cursor-pointer"
                title="Mark all notifications as read"
              >
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span>Mark all as read</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => loadNotifications(activeTab, 1, true)}
              disabled={isLoading}
              className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors cursor-pointer"
              title="Refresh notifications"
            >
              <svg
                className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Message Box Tabs: New / Read / All */}
        <div className="px-4 pt-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-1 border-b border-transparent">
            <button
              type="button"
              onClick={() => handleTabChange('new')}
              className={`flex items-center gap-2 pb-2.5 px-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
                activeTab === 'new'
                  ? 'border-[#0066CC] text-[#0066CC] dark:text-blue-400 dark:border-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              <span>New</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-xs font-bold ${
                  activeTab === 'new'
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                }`}
              >
                {unreadCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('read')}
              className={`flex items-center gap-2 pb-2.5 px-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
                activeTab === 'read'
                  ? 'border-[#0066CC] text-[#0066CC] dark:text-blue-400 dark:border-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              <span>Read</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-xs font-bold ${
                  activeTab === 'read'
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                }`}
              >
                {readCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('all')}
              className={`flex items-center gap-2 pb-2.5 px-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
                activeTab === 'all'
                  ? 'border-[#0066CC] text-[#0066CC] dark:text-blue-400 dark:border-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              <span>All</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-xs font-bold ${
                  activeTab === 'all'
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                }`}
              >
                {totalCount}
              </span>
            </button>
          </div>

          {/* Search bar inside header */}
          <div className="py-2.5">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search notifications..."
                className="w-full pl-9 pr-8 py-1.5 text-xs bg-gray-100 dark:bg-gray-700/60 text-gray-900 dark:text-gray-100 placeholder-gray-400 rounded-lg border border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-gray-700 focus:outline-none transition-all"
              />
              <svg
                className="w-4 h-4 text-gray-400 absolute left-2.5 top-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
                >
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Notifications Scrollable List with onScroll load more */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-4 space-y-3"
        >
          {isLoading ? (
            <div className="flex flex-col gap-3 py-2">
              {[...Array(4)].map((_, idx) => (
                <NotificationLoader key={idx} />
              ))}
            </div>
          ) : filteredNotifications.length > 0 ? (
            <>
              {filteredNotifications.map((item) => (
                <NotificationItem
                  key={item.id}
                  item={item}
                  onMarkAsRead={handleMarkAsRead}
                  onNavigate={handleNavigate}
                  onDelete={handleDelete}
                />
              ))}

              {/* Bottom scroll loader / end of list message */}
              {isLoadingMore && (
                <div className="flex items-center justify-center gap-2 py-3 text-xs text-gray-500 dark:text-gray-400 bg-white/50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-700 animate-pulse">
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  <span>Loading more notifications...</span>
                </div>
              )}

              {!hasMore && notifications.length > 5 && (
                <div className="text-center py-3 text-[11px] font-medium text-gray-400 dark:text-gray-500">
                  ✓ You have reached the end of notifications
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-center p-6">
              <div className="w-14 h-14 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-500 flex items-center justify-center mb-3">
                <svg
                  className="w-7 h-7"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.5"
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
              </div>
              <h5 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1">
                {activeTab === 'new'
                  ? 'No new notifications'
                  : activeTab === 'read'
                    ? 'No read notifications'
                    : 'No notifications found'}
              </h5>
              <p className="text-xs text-gray-500 dark:text-gray-400 max-w-[240px]">
                {activeTab === 'new'
                  ? "You're all caught up! New assignments and alerts will appear here."
                  : activeTab === 'read'
                    ? 'Notifications you have marked as read will be archived here.'
                    : 'No notifications available at this time.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </CustomDrawer>
  )
}
