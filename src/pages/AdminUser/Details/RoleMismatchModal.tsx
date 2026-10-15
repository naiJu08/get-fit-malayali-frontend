import React from 'react'
import { useNavigate } from 'react-router-dom'

interface RoleMismatchModalProps {
  isOpen: boolean
  user: any
  actualRole: string
  actualRoleLabel: string
  actualRolePath?: string
  expectedRole: string
  expectedRoleLabel: string
  fallbackPath: string
  userId?: string | number
}

export default function RoleMismatchModal({
  isOpen,
  user,
  actualRoleLabel,
  actualRolePath,
  expectedRoleLabel,
  fallbackPath,
  userId,
}: RoleMismatchModalProps) {
  const navigate = useNavigate()

  if (!isOpen) return null

  const userName = user?.name || 'User'
  const userEmail = user?.email || ''
  const userPhone = user?.phone || ''

  const handleGoToActualRole = () => {
    if (actualRolePath && userId) {
      navigate(`${actualRolePath}/${userId}/details`)
    } else {
      navigate('/users')
    }
  }

  const handleBackToList = () => {
    navigate(fallbackPath || '/users')
  }

  return (
    <div
      className="fixed inset-0 z-[1600] flex items-center justify-center p-4 bg-slate-900/65 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl border border-gray-100 transition-all transform animate-in zoom-in-95 duration-200">
        {/* Top Decorative gradient glow */}
        <div className="h-2 w-full bg-gradient-to-r from-amber-400 via-rose-400 to-primaryGreen" />

        <div className="p-6 sm:p-7 text-center">
          {/* Oops Image Card */}
          <div className="relative mx-auto mb-4 w-36 h-36 rounded-2xl overflow-hidden bg-gradient-to-b from-amber-50 to-orange-50/40 p-2 border border-amber-100/80 shadow-inner flex items-center justify-center group">
            <img
              src="/images/oops-role.jpg"
              alt="Role Mismatch Oops"
              className="w-full h-full object-contain rounded-xl drop-shadow-md transition-transform duration-300 group-hover:scale-105"
              onError={(e) => {
                // Fallback SVG if image not found
                e.currentTarget.style.display = 'none'
              }}
            />
          </div>

          {/* Title & Subtitle */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200 mb-2">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
            Oops! Role Mismatch
          </div>

          <h3 className="text-xl font-extrabold text-gray-900 tracking-tight mb-1.5">
            Incorrect Role Page
          </h3>

          <p className="text-xs text-gray-500 leading-relaxed max-w-sm mx-auto mb-5">
            You are attempting to access{' '}
            <strong className="text-gray-800">{userName}</strong> under the{' '}
            <span className="font-semibold text-amber-700">
              {expectedRoleLabel}
            </span>{' '}
            module, but this account is registered under a different role.
          </p>

          {/* Role Comparison Badge Card */}
          <div className="rounded-2xl bg-gradient-to-br from-gray-50 via-slate-50 to-amber-50/30 border border-gray-200/80 p-3.5 mb-5 shadow-2xs text-left">
            <div className="flex items-center justify-between gap-2 mb-2.5 pb-2.5 border-b border-gray-200/60">
              <div className="min-w-0">
                <div className="text-xs font-bold text-gray-900 truncate">
                  {userName}
                </div>
                {(userEmail || userPhone) && (
                  <div className="text-[11px] text-gray-500 truncate">
                    {userEmail || userPhone}
                  </div>
                )}
              </div>
              <div className="shrink-0">
                <span className="text-[10px] font-semibold text-gray-400">
                  ID: #{userId}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="rounded-xl bg-amber-50/80 border border-amber-200/80 p-2">
                <div className="text-[10px] font-medium text-amber-700 uppercase tracking-wider mb-0.5">
                  Requested Under
                </div>
                <div className="text-xs font-bold text-amber-900 capitalize truncate">
                  {expectedRoleLabel}
                </div>
              </div>

              <div className="rounded-xl bg-emerald-50/80 border border-emerald-200/80 p-2">
                <div className="text-[10px] font-medium text-emerald-700 uppercase tracking-wider mb-0.5">
                  Actual Role
                </div>
                <div className="text-xs font-bold text-emerald-900 capitalize truncate">
                  {actualRoleLabel}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            {actualRolePath && (
              <button
                type="button"
                onClick={handleGoToActualRole}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-primaryGreen px-4 py-3 text-sm font-bold text-white shadow-md shadow-emerald-600/20 hover:from-emerald-700 hover:to-emerald-600 active:scale-[0.99] transition cursor-pointer"
              >
                <span>Go to {actualRoleLabel} Details</span>
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 12h14" />
                  <path d="M12 5l7 7-7 7" />
                </svg>
              </button>
            )}

            <button
              type="button"
              onClick={handleBackToList}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-xs font-bold text-gray-700 shadow-2xs hover:bg-gray-50 active:scale-[0.99] transition cursor-pointer"
            >
              Back to {expectedRoleLabel} Listing
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
