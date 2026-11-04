import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react'
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
import { resolveNotificationUrl } from '../../utilities/notificationNavigation'
import { useAuthStore } from '../../store/authStore'
import { useScroll } from '../../layout/scrollcontext'

type TabType = 'new' | 'read' | 'all'

export default function MessageBoxView() {
  const navigate = useNavigate()
  const { enqueueSnackbar } = useSnackbarManager()
  const { setUnreadCount, decrementUnreadCount, refreshKey, triggerRefresh } =
    useNotificationStore()
  const mainScrollRef = useScroll()

  const [activeTab, setActiveTab] = useState<TabType>('new')
  const [notifications, setNotifications] = useState<NotificationRecord[]>([])
  const [page, setPage] = useState<number>(1)
  const [hasMore, setHasMore] = useState<boolean>(true)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [typeFilter, setTypeFilter] = useState<string>('all')

  const containerRef = useRef<HTMLDivElement | null>(null)
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  // Backend-provided global counts (unaffected by type/status filter)
  const [globalUnreadCount, setGlobalUnreadCount] = useState<number>(0)
  const [globalReadCount, setGlobalReadCount] = useState<number>(0)
  const [globalTotalCount, setGlobalTotalCount] = useState<number>(0)
  // All types available across all user's notifications (from backend)
  const [availableTypes, setAvailableTypes] = useState<string[]>([])

  // Load notifications by page, tab status, and type filter
  const loadNotifications = useCallback(
    async (
      targetPage: number,
      isInitial = false,
      tab: TabType = activeTab,
      type: string = typeFilter
    ) => {
      if (isInitial) {
        setIsLoading(true)
      } else {
        setIsLoadingMore(true)
      }

      try {
        const params: Parameters<typeof getNotifications>[0] = {
          page: targetPage,
          per_page: 10,
        }

        // Status filter
        if (tab === 'new') params.status = 'unread'
        else if (tab === 'read') params.status = 'read'

        // Type filter via backend
        if (type !== 'all') params.type = type

        const data = await getNotifications(params)
        const newItems = data?.notifications || []

        setNotifications((prev) => {
          if (targetPage === 1) {
            return newItems
          }
          const existingIds = new Set(prev.map((n) => String(n.id)))
          const uniqueNew = newItems.filter(
            (n) => !existingIds.has(String(n.id))
          )
          return [...prev, ...uniqueNew]
        })

        // Use global counts from backend (always the total, not filtered)
        setGlobalUnreadCount(data?.unread_count ?? 0)
        setGlobalReadCount(data?.read_count ?? 0)
        setGlobalTotalCount(data?.total_count ?? 0)
        setUnreadCount(data?.unread_count ?? 0)

        // Use backend-provided available_types if present
        if (data?.available_types && data.available_types.length > 0) {
          setAvailableTypes(data.available_types)
        }

        setPage(targetPage)

        if (data?.meta) {
          setHasMore(data.meta.next_page !== null)
        } else {
          setHasMore(newItems.length >= 10)
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
    [setUnreadCount, activeTab, typeFilter]
  )

  // Reset and load first page whenever tab, typeFilter, or refreshKey changes
  useEffect(() => {
    setPage(1)
    setHasMore(true)
    if (containerRef.current) {
      containerRef.current.scrollTop = 0
    }
    if (mainScrollRef?.current) {
      mainScrollRef.current.scrollTop = 0
    }
    loadNotifications(1, true, activeTab, typeFilter)
  }, [activeTab, typeFilter, refreshKey, loadNotifications, mainScrollRef])

  // Automatic trigger on container scroll position
  const handleContainerScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget
    const isNearBottom =
      target.scrollHeight - target.scrollTop - target.clientHeight <= 250

    if (isNearBottom && hasMore && !isLoading && !isLoadingMore) {
      loadNotifications(page + 1, false, activeTab, typeFilter)
    }
  }

  // Automatic trigger on main page / window scroll position
  useEffect(() => {
    const handleScrollCheck = (el: HTMLElement | Window) => {
      if (!hasMore || isLoading || isLoadingMore) return

      let scrollHeight = 0
      let scrollTop = 0
      let clientHeight = 0

      if (el === window) {
        scrollHeight = document.documentElement.scrollHeight
        scrollTop = window.scrollY || document.documentElement.scrollTop
        clientHeight = window.innerHeight
      } else {
        const htmlEl = el as HTMLElement
        scrollHeight = htmlEl.scrollHeight
        scrollTop = htmlEl.scrollTop
        clientHeight = htmlEl.clientHeight
      }

      if (scrollHeight - scrollTop - clientHeight <= 300) {
        loadNotifications(page + 1, false, activeTab, typeFilter)
      }
    }

    const onMainScroll = () => {
      if (mainScrollRef?.current) {
        handleScrollCheck(mainScrollRef.current)
      }
    }

    const onWindowScroll = () => {
      handleScrollCheck(window)
    }

    const mainEl = mainScrollRef?.current
    if (mainEl) {
      mainEl.addEventListener('scroll', onMainScroll, { passive: true })
    }
    window.addEventListener('scroll', onWindowScroll, { passive: true })

    return () => {
      if (mainEl) {
        mainEl.removeEventListener('scroll', onMainScroll)
      }
      window.removeEventListener('scroll', onWindowScroll)
    }
  }, [
    mainScrollRef,
    hasMore,
    isLoading,
    isLoadingMore,
    page,
    activeTab,
    typeFilter,
    loadNotifications,
  ])

  // Sentinel IntersectionObserver as a fallback for automatic detection
  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          hasMore &&
          !isLoading &&
          !isLoadingMore
        ) {
          loadNotifications(page + 1, false, activeTab, typeFilter)
        }
      },
      {
        rootMargin: '250px',
        threshold: 0.05,
      }
    )

    observer.observe(sentinel)

    return () => {
      observer.disconnect()
    }
  }, [
    hasMore,
    isLoading,
    isLoadingMore,
    page,
    activeTab,
    typeFilter,
    loadNotifications,
  ])

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
      setGlobalUnreadCount((c) => Math.max(0, c - 1))
      setGlobalReadCount((c) => c + 1)
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
      setGlobalReadCount((c) => c + globalUnreadCount)
      setGlobalUnreadCount(0)
      enqueueSnackbar('All notifications marked as read', {
        variant: 'success',
      })
    } catch {
      enqueueSnackbar('Failed to mark all as read', { variant: 'error' })
    }
  }

  // Handle Go to Page
  const handleNavigate = async (url: string, id: number | string) => {
    let resolvedUrl = url
    try {
      const targetItem = notifications.find(
        (item) => String(item.id) === String(id)
      )
      if (targetItem) {
        resolvedUrl = resolveNotificationUrl(
          targetItem.action_url || url,
          useAuthStore.getState().roleData?.name?.toLowerCase?.(),
          targetItem
        )
        if (!targetItem.is_read) {
          await markNotificationAsRead(id)
          decrementUnreadCount()
        }
      }
    } catch {
      // Non-blocking
    } finally {
      navigate(resolvedUrl)
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

  // Client-side search filter only (tab + type already filtered server-side)
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

  // Tab change handler — reset to first load
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab)
    setSearchQuery('')
  }

  // Type filter change — triggers re-fetch via useEffect
  const handleTypeFilterChange = (type: string) => {
    setTypeFilter(type)
  }

  return (
    <div className="w-full h-full flex flex-col p-6 space-y-6">
      {/* Top Header & Overview */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200/80 dark:border-gray-700">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Notification Center
            </h1>
            {globalUnreadCount > 0 && (
              <span className="px-2.5 py-0.5 text-xs font-bold text-red-700 bg-red-100 dark:bg-red-900/60 dark:text-red-300 rounded-full">
                {globalUnreadCount} New
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Stay on top of your assignments, plan updates, reviews, and client
            activity.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {globalUnreadCount > 0 && (
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
            onClick={() => loadNotifications(1, true, activeTab, typeFilter)}
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
            onClick={() => handleTabChange('new')}
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
              {globalUnreadCount.toLocaleString()}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('read')}
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
              {globalReadCount.toLocaleString()}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('all')}
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
              {globalTotalCount.toLocaleString()}
            </span>
          </button>
        </div>

        {/* Search & Type filter */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {availableTypes.length > 0 && (
            <select
              value={typeFilter}
              onChange={(e) => handleTypeFilterChange(e.target.value)}
              className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-none rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="all">All Types</option>
              {availableTypes.map((t) => (
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
              placeholder="Search notifications by name..."
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
      <div
        ref={containerRef}
        onScroll={handleContainerScroll}
        className="flex-1 overflow-y-auto"
      >
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(6)].map((_, idx) => (
              <NotificationLoader key={idx} />
            ))}
          </div>
        ) : filteredNotifications.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredNotifications.map((item) => (
                <NotificationItem
                  key={item.id}
                  item={item}
                  onMarkAsRead={handleMarkAsRead}
                  onNavigate={handleNavigate}
                  onDelete={handleDelete}
                  hideStatusBadge={activeTab !== 'all'}
                />
              ))}
            </div>

            {/* Scroll bottom trigger sentinel */}
            <div ref={sentinelRef} className="h-6 w-full" />

            {/* Loading more spinner */}
            {isLoadingMore && (
              <div className="flex items-center justify-center gap-2 py-4 my-2 text-xs font-medium text-gray-500 dark:text-gray-400 bg-white/60 dark:bg-gray-800/60 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 animate-pulse">
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <span>Loading balance notifications...</span>
              </div>
            )}

            {!hasMore && notifications.length > 6 && (
              <div className="text-center py-4 text-xs font-medium text-gray-400 dark:text-gray-500">
                ✓ All notifications loaded
              </div>
            )}
          </>
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
