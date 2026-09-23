import { Link } from 'react-router-dom'

import Icons from '../components/common/icons'
import { useAuthStore } from '../store/authStore'
import { useDomainManageStore } from '../store/domainManageStore'
import { useAccreditationFilterStore } from '../store/filterSore/accreditationStore'
import { useAdminUserFilterStore } from '../store/filterSore/adminUserStore'
import { useAssessorFilterStore } from '../store/filterSore/assessorStore'
import { useClearFilter } from '../store/filterSore/clearStore'
import { useOrganisationFilterStore } from '../store/filterSore/OrganisationStore'
import { useLayoutStore } from '../store/layoutStore'
import { useEffect } from 'react'
import HeaderMenu from './headerMenu'
import HeaderTab from './headerTab'
import NotificationList from './notificationList'
import { useNotificationStore } from '../store/notificationStore'

import { queryClient } from '../queryClient'

const HeaderTop = () => {
  const { layoutType, expand, setExpand } = useLayoutStore()
  const handleClear = useClearFilter()

  const {
    clearAuthenticated,
    userData,
    // impersonating,
    setImpersonating,
    setActualUser,
  } = useAuthStore()

  const handleLogout = () => {
    try {
      queryClient.clear()
      queryClient.removeQueries()
    } catch (e) {
      // ignore
    }

    useAdminUserFilterStore.getState().resetStore()
    useAssessorFilterStore.getState().resetStore()
    useOrganisationFilterStore.getState().resetStore()
    useAccreditationFilterStore.getState().resetStore()

    setActualUser({})
    setImpersonating(false)
    localStorage.clear()
    handleClear()
    localStorage.setItem('shouldReload', 'false')
    clearAuthenticated()
  }
  const { domainType } = useDomainManageStore()
  const { unreadCount, isDrawerOpen, setIsDrawerOpen, fetchCounts } =
    useNotificationStore()

  useEffect(() => {
    fetchCounts()
    const interval = setInterval(() => {
      fetchCounts()
    }, 45000)
    return () => clearInterval(interval)
  }, [fetchCounts])

  const handleReturnPath = () => {
    if (domainType === 'Organisation') {
      return '/myorganisation/profile'
    } else if (domainType === 'Assessor') {
      return '/assessors'
    } else {
      return '/admin-user'
    }
  }
  return (
    <>
      <div className="h-[64px] fixed w-full top-0 left-0 z-30 flex items-center justify-between bg-white border-formBorder border-b pe-5">
        <div className="w-[220px] ps-5 flex items-center justify-between">
          {layoutType === 'sideNav' ? (
            <button
              type="button"
              onClick={() => setExpand(!expand)}
              aria-label={expand ? 'Collapse sidebar' : 'Expand sidebar'}
              className="flex mr-2 h-8 w-8 items-center justify-center rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primaryBlue/40"
            >
              <div
                className={`transition-transform duration-200 ${expand ? 'rotate-180' : ''}`}
              >
                <Icons name="hamburger-icon" />
              </div>
            </button>
          ) : (
            ''
          )}
          {(layoutType !== 'sideNav' || expand) && (
            <Link to={handleReturnPath()}>
              <div className="flex items-center gap-2 w-auto">
                <img
                  className="h-10 w-auto object-contain"
                  src="/logo-hori.png"
                  alt="Get Fit Malayali"
                />
              </div>
            </Link>
          )}
        </div>
        {layoutType === 'headerNav' && <HeaderTab />}
        <div className="flex gap-3 items-center">
          {/* Notification Bell Button */}
          <button
            type="button"
            onClick={() => setIsDrawerOpen(true)}
            className="relative flex items-center justify-center w-9 h-9 rounded-full text-gray-700 hover:text-[#0066CC] hover:bg-blue-50 dark:text-gray-200 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            aria-label="Open notifications"
            title="Notifications"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-red-600 rounded-full shadow-sm ring-2 ring-white dark:ring-gray-900">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          <HeaderMenu userData={userData} handleLogout={handleLogout} />
        </div>
      </div>

      <NotificationList
        open={isDrawerOpen}
        handleClose={() => setIsDrawerOpen(false)}
      />
    </>
  )
}

export default HeaderTop
