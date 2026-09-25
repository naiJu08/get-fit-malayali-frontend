import React, { useEffect, useState, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import NotificationItem from '../../layout/notifications/NotificationItem'
import NotificationLoader from '../../layout/notifications/notificationLoader'
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification as apiDeleteNotification,
  NotificationRecord,
} from '../../apis/notifications.api'
import { useNotificationStore } from '../../store/notificationStore'
import { useSnackbarManager } from '../../components/common/snackbar'

type TabType = 'new' | 'read' | 'all'

export default function MessageBoxView() {
  const navigate = useNavigate()
  const { enqueueSnackbar } = useSnackbarManager()
  const { setUnreadCount, decrementUnreadCount, refreshKey, triggerRefresh } =
    useNotificationStore()

  const [activeTab, setActiveTab] = useState<TabType>('new')
  const [notifications, setNotifications] = useState<NotificationRecord[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [typeFilter, setTypeFilter] = useState<string>('all')

  const fetchItems = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await getNotifications({ per_page: 100 })
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
    fetchItems()
  }, [fetchItems, refreshKey])

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
      const targetItem = notifications.find(
        (item) => String(item.id) === String(id)
      )
      if (targetItem && !targetItem.is_read) {
        await markNotificationAsRead(id)
        decrementUnreadCount()
      }
    } catch {
      // Non-blocking
    } finally {
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

  // Unique notification types for filter
  const notificationTypes = useMemo(() => {
    const types = new Set<string>()
    notifications.forEach((n) => {
      if (n.notification_type) types.add(n.notification_type)
    })
    return Array.from(types)
  }, [notifications])

  // Filter items
  const filteredNotifications = useMemo(() => {
    return notifications.filter((item) => {
      // Tab filter
      if (activeTab === 'new' && item.is_read) return false
      if (activeTab === 'read' && !item.is_read) return false

      // Type filter
      if (typeFilter !== 'all' && item.notification_type !== typeFilter) {
        return false
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const titleMatch = item.title?.toLowerCase().includes(q)
        const msgMatch = item.message?.toLowerCase().includes(q)
        const typeMatch = item.notification_type?.toLowerCase().includes(q)
        return titleMatch || msgMatch || typeMatch
      }

      return true
    })
  }, [notifications, activeTab, typeFilter, searchQuery])

  const newCount = useMemo(
    () => notifications.filter((n) => !n.is_read).length,
    [notifications]
  )
  const readCount = useMemo(
    () => notifications.filter((n) => n.is_read).length,
    [notifications]
  )

  return (
    <div className="w-full h-full flex flex-col p-6 space-y-6">
      {/* Top Header & Overview */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200/80 dark:border-gray-700">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Notification Center
            </h1>
            {newCount > 0 && (
              <span className="px-2.5 py-0.5 text-xs font-bold text-red-700 bg-red-100 dark:bg-red-900/60 dark:text-red-300 rounded-full">
                {newCount} New
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Stay on top of your assignments, plan updates, reviews, and client
            activity.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {newCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllAsRead}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/40 dark:text-blue-300 dark:hover:bg-blue-900/60 rounded-xl transition-all shadow-sm active:scale-95"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
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
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-700 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 rounded-xl transition-colors"
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
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Tabs & Filters Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-gray-800 px-6 py-4 rounded-2xl shadow-sm border border-gray-200/80 dark:border-gray-700">
        {/* Status Tabs */}
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setActiveTab('new')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'new'
                ? 'bg-[#0066CC] text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/60'
            }`}
          >
            <span>New</span>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                activeTab === 'new'
                  ? 'bg-white/20 text-white'
                  : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
              }`}
            >
              {newCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('read')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'read'
                ? 'bg-[#0066CC] text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/60'
            }`}
          >
            <span>Read</span>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                activeTab === 'read'
                  ? 'bg-white/20 text-white'
                  : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
              }`}
            >
              {readCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'all'
                ? 'bg-[#0066CC] text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/60'
            }`}
          >
            <span>All</span>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                activeTab === 'all'
                  ? 'bg-white/20 text-white'
                  : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
              }`}
            >
              {notifications.length}
            </span>
          </button>
        </div>

        {/* Search & Type filter */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {notificationTypes.length > 0 && (
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-none rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="all">All Types</option>
              {notificationTypes.map((t) => (
                <option key={t} value={t}>
                  {t
                    .replace(/_/g, ' ')
                    .replace(/\b\w/g, (c) => c.toUpperCase())}
                </option>
              ))}
            </select>
          )}

          <div className="relative w-full sm:w-64">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notifications..."
              className="w-full pl-9 pr-8 py-2 text-xs bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 rounded-xl border-none focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
            />
            <svg
              className="w-4 h-4 text-gray-400 absolute left-3 top-2.5"
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
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
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

      {/* Notifications Grid / List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(6)].map((_, idx) => (
              <NotificationLoader key={idx} />
            ))}
          </div>
        ) : filteredNotifications.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredNotifications.map((item) => (
              <NotificationItem
                key={item.id}
                item={item}
                onMarkAsRead={handleMarkAsRead}
                onNavigate={handleNavigate}
                onDelete={handleDelete}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center min-h-[340px] bg-white dark:bg-gray-800 rounded-2xl border border-gray-200/80 dark:border-gray-700 p-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center mb-4">
              <svg
                className="w-8 h-8"
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
            <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">
              {activeTab === 'new'
                ? 'No unread notifications'
                : activeTab === 'read'
                  ? 'No read notifications'
                  : 'No notifications found'}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
              {activeTab === 'new'
                ? "You're completely up to date! When new assignments or updates are sent to you, they'll appear here."
                : 'Archived and completed notifications will be stored here for your reference.'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
