import React, { useEffect, useState, useMemo, useCallback } from 'react'
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

export default function NotificationList({
  open,
  handleClose,
}: NotificationListProps) {
  const navigate = useNavigate()
  const { enqueueSnackbar } = useSnackbarManager()
  const { setUnreadCount, decrementUnreadCount, refreshKey, triggerRefresh } =
    useNotificationStore()

  const [activeTab, setActiveTab] = useState<TabType>('new')
  const [notifications, setNotifications] = useState<NotificationRecord[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [searchQuery, setSearchQuery] = useState<string>('')

  // Fetch notifications
  const fetchItems = useCallback(async () => {
    setIsLoading(true)
    try {
      // Fetch notifications according to the tab or fetch all to count correctly
      const data = await getNotifications({ per_page: 50 })
      const list = data?.notifications || []
      setNotifications(list)

      const unread = list.filter((n) => !n.is_read).length
      setUnreadCount(data?.unread_count ?? unread)
    } catch (error) {
      console.error('Failed to load notifications:', error)
    } finally {
      setIsLoading(false)
    }
  }, [setUnreadCount])

  useEffect(() => {
    if (open) {
      fetchItems()
    }
  }, [open, refreshKey, fetchItems])

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
      setUnreadCount(0)
      enqueueSnackbar('All notifications marked as read', {
        variant: 'success',
      })
    } catch {
      enqueueSnackbar('Failed to mark all as read', { variant: 'error' })
    }
  }

  // Handle Go to Page
  const handleNavigate = async (url: string, id: number | string) => {
    try {
      // Auto mark as read when user clicks Go to Page
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

  // Filter items by active tab and search query
  const filteredNotifications = useMemo(() => {
    return notifications.filter((item) => {
      // Tab filter
      if (activeTab === 'new' && item.is_read) return false
      if (activeTab === 'read' && !item.is_read) return false

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const titleMatch = item.title?.toLowerCase().includes(q)
        const msgMatch = item.message?.toLowerCase().includes(q)
        const typeMatch = item.notification_type?.toLowerCase().includes(q)
        return titleMatch || msgMatch || typeMatch
      }
      return true
    })
  }, [notifications, activeTab, searchQuery])

  const newCount = useMemo(
    () => notifications.filter((n) => !n.is_read).length,
    [notifications]
  )
  const currentReadCount = useMemo(
    () => notifications.filter((n) => n.is_read).length,
    [notifications]
  )

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
            {newCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700 dark:bg-red-900/60 dark:text-red-300">
                {newCount} New
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {newCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/40 dark:text-blue-300 dark:hover:bg-blue-900/60 rounded-lg transition-colors"
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
              onClick={fetchItems}
              disabled={isLoading}
              className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
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
              onClick={() => setActiveTab('new')}
              className={`flex items-center gap-2 pb-2.5 px-3 text-sm font-semibold border-b-2 transition-all ${
                activeTab === 'new'
                  ? 'border-[#0066CC] text-[#0066CC] dark:text-blue-400 dark:border-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              <span>New</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-xs ${
                  activeTab === 'new'
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                }`}
              >
                {newCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('read')}
              className={`flex items-center gap-2 pb-2.5 px-3 text-sm font-semibold border-b-2 transition-all ${
                activeTab === 'read'
                  ? 'border-[#0066CC] text-[#0066CC] dark:text-blue-400 dark:border-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              <span>Read</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-xs ${
                  activeTab === 'read'
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                }`}
              >
                {currentReadCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`flex items-center gap-2 pb-2.5 px-3 text-sm font-semibold border-b-2 transition-all ${
                activeTab === 'all'
                  ? 'border-[#0066CC] text-[#0066CC] dark:text-blue-400 dark:border-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              <span>All</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-xs ${
                  activeTab === 'all'
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                }`}
              >
                {notifications.length}
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
                  className="absolute right-2.5 top-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
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

        {/* Notifications Scrollable List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {isLoading ? (
            <div className="flex flex-col gap-3 py-2">
              {[...Array(4)].map((_, idx) => (
                <NotificationLoader key={idx} />
              ))}
            </div>
          ) : filteredNotifications.length > 0 ? (
            filteredNotifications.map((item) => (
              <NotificationItem
                key={item.id}
                item={item}
                onMarkAsRead={handleMarkAsRead}
                onNavigate={handleNavigate}
                onDelete={handleDelete}
              />
            ))
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
                  : 'Notifications you have marked as read will be archived here.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </CustomDrawer>
  )
}
