import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { useProfile } from '../pages/profile/api'
import ChangePassword from '../pages/profile/password'

type Props = {
  userData?: any
  handleLogout: () => void
}

export default function HeaderMenu({
  userData: initialUserData,
  handleLogout,
}: Props) {
  const [openMenu, setOpenMenu] = useState(false)
  const [changePassword, setChangePassword] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const navigate = useNavigate()

  const { userData: storeUserData, roleData } = useAuthStore()
  const { data: profileQueryData } = useProfile()

  // Match store user ID with profile query user ID so stale queries from other users are never used
  const isProfileMatchingStore =
    Boolean(profileQueryData?.user?.id) &&
    Boolean(storeUserData?.id) &&
    String(profileQueryData?.user?.id) === String(storeUserData?.id)

  const liveUser =
    (isProfileMatchingStore ? profileQueryData?.user : null) ||
    storeUserData ||
    initialUserData ||
    profileQueryData?.user ||
    {}

  const userName = liveUser?.name || 'User'
  const userEmail = liveUser?.email || ''
  const userRole = liveUser?.role || roleData?.name || 'Member'
  const avatarUrl = liveUser?.avatar_url || null
  const initialLetter = userName.charAt(0).toUpperCase()

  const toggleMenu = () => {
    setOpenMenu((prev) => !prev)
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const navigateToProfile = () => {
    setOpenMenu(false)
    navigate('/profile')
  }

  const handleOpenResetPassword = () => {
    setOpenMenu(false)
    setChangePassword(true)
  }

  const handleClosePasswordModal = () => {
    setChangePassword(false)
  }

  return (
    <div ref={menuRef} className="relative inline-block text-left">
      {/* Header Profile Card */}
      <button
        type="button"
        onClick={toggleMenu}
        aria-expanded={openMenu}
        className={`group flex items-center gap-2.5 p-1.5 sm:px-3 sm:py-1.5 rounded-full sm:rounded-2xl border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer select-none ${
          openMenu
            ? 'bg-blue-50/80 border-blue-200 dark:bg-gray-800 dark:border-blue-500/40 shadow-sm'
            : 'bg-gray-50/90 hover:bg-white border-gray-200 dark:bg-gray-800/80 dark:hover:bg-gray-800 dark:border-gray-700 hover:border-gray-300 shadow-sm hover:shadow'
        }`}
      >
        {/* Avatar */}
        <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white font-bold text-xs shadow-inner">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={userName}
              className="w-full h-full object-cover"
            />
          ) : (
            <span>{initialLetter}</span>
          )}
        </div>

        {/* User Details Stack */}
        <div className="hidden sm:flex flex-col text-left leading-tight max-w-[140px] md:max-w-[170px]">
          <span className="text-xs font-bold text-gray-800 dark:text-gray-100 truncate group-hover:text-blue-600 transition-colors capitalize">
            {userName}
          </span>
          <span className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
            {userEmail || userRole}
          </span>
        </div>

        {/* Down Arrow Chevron */}
        <div className="flex items-center justify-center w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:text-gray-400 transition-colors">
          <svg
            className={`w-3.5 h-3.5 transform transition-transform duration-200 ${
              openMenu ? 'rotate-180 text-blue-600 dark:text-blue-400' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.5"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </button>

      {/* Dropdown Menu */}
      {openMenu && (
        <div className="absolute right-0 mt-2 w-64 origin-top-right rounded-2xl bg-white dark:bg-gray-800 shadow-2xl ring-1 ring-black/5 dark:ring-white/10 border border-gray-100 dark:border-gray-700 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
          {/* Top User Info Section */}
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700/60 flex items-center gap-3 bg-gradient-to-r from-gray-50/50 to-transparent dark:from-gray-800">
            <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white font-extrabold text-sm shadow-md">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={userName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{initialLetter}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-gray-900 dark:text-white truncate capitalize">
                {userName}
              </p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                {userEmail}
              </p>
              <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-100 dark:border-blue-800">
                {userRole}
              </span>
            </div>
          </div>

          {/* Action List */}
          <div className="p-1 space-y-0.5">
            {/* My Profile */}
            <button
              type="button"
              onClick={navigateToProfile}
              className="w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-blue-50/70 hover:text-blue-600 dark:hover:bg-gray-700/60 dark:hover:text-blue-400 rounded-xl transition-colors text-left group"
            >
              <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <span>My Profile</span>
            </button>

            {/* Reset Password */}
            <button
              type="button"
              onClick={handleOpenResetPassword}
              className="w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-amber-50/70 hover:text-amber-600 dark:hover:bg-gray-700/60 dark:hover:text-amber-400 rounded-xl transition-colors text-left group"
            >
              <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                  />
                </svg>
              </div>
              <span>Reset Password</span>
            </button>
          </div>

          <div className="my-1 border-t border-gray-100 dark:border-gray-700/60" />

          {/* Logout */}
          <div className="p-1">
            <button
              type="button"
              onClick={() => {
                setOpenMenu(false)
                handleLogout()
              }}
              className="w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl transition-colors text-left group"
            >
              <div className="w-7 h-7 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
              </div>
              <span>Log out</span>
            </button>
          </div>
        </div>
      )}

      {/* Change Password Dialog Modal */}
      <ChangePassword
        isOpen={changePassword}
        handleClose={handleClosePasswordModal}
      />
    </div>
  )
}
