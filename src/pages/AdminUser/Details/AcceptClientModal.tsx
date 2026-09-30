import React from 'react'

interface AcceptClientModalProps {
  isOpen: boolean
  onClose: () => void
  onAccept: () => void
  isLoading: boolean
  clientName?: string
  clientEmail?: string
  clientPhone?: string
  planName?: string
  roleTitle?: string
  onGoBack?: () => void
}

export default function AcceptClientModal({
  isOpen,
  onClose,
  onAccept,
  isLoading,
  clientName,
  clientEmail,
  clientPhone,
  planName,
  roleTitle = 'Specialist',
  onGoBack,
}: AcceptClientModalProps) {
  if (!isOpen) return null

  const getInitials = (name?: string) => {
    if (!name) return 'CL'
    const parts = name.trim().split(/\s+/)
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }

  return (
    <div
      className="fixed inset-0 z-[1500] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl border border-gray-100 transition-all transform animate-in zoom-in-95 duration-200">
        {/* Header gradient banner */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-primaryGreen px-6 py-5 text-white relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15 backdrop-blur-md border border-white/20 shadow-inner">
                <svg
                  className="h-6 w-6 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold leading-tight text-white tracking-tight">
                  New Client Assignment
                </h3>
                <p className="text-xs text-emerald-100 mt-0.5 font-medium">
                  Accept assignment to start consultation
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          {/* Client Card */}
          <div className="rounded-xl bg-slate-50 p-4 border border-slate-100/90 shadow-2xs">
            <div className="flex items-center gap-3.5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 font-bold text-sm shadow-inner border border-emerald-200/60">
                {getInitials(clientName)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-sm font-bold text-gray-900 truncate">
                    {clientName || 'Client'}
                  </h4>
                  <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                    Pending Acceptance
                  </span>
                </div>
                <div className="text-xs text-gray-500 mt-0.5 truncate">
                  {clientEmail || clientPhone || 'No contact details'}
                </div>
              </div>
            </div>

            {/* Assignment & Plan Details */}
            <div className="mt-3 pt-3 border-t border-slate-200/70 grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider">
                  Assigned As
                </span>
                <span className="font-semibold text-gray-800 capitalize mt-0.5 block">
                  {roleTitle}
                </span>
              </div>
              {planName ? (
                <div>
                  <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider">
                    Plan
                  </span>
                  <span className="font-semibold text-gray-800 truncate mt-0.5 block">
                    {planName}
                  </span>
                </div>
              ) : null}
            </div>
          </div>

          <div className="rounded-xl bg-emerald-50/60 border border-emerald-100 p-3 text-xs text-emerald-900 leading-relaxed">
            <div className="flex items-start gap-2">
              <svg
                className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4" />
                <path d="M12 8h.01" />
              </svg>
              <span>
                Please accept this client to view full health records, assign
                plans, track assessments, and start client communication.
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            {onGoBack ? (
              <button
                type="button"
                onClick={onGoBack}
                disabled={isLoading}
                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all disabled:opacity-50"
              >
                Go Back
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all disabled:opacity-50"
              >
                Remind Later
              </button>
            )}

            <button
              type="button"
              onClick={onAccept}
              disabled={isLoading}
              className="inline-flex items-center justify-center gap-2 px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-primaryGreen hover:from-emerald-700 hover:to-emerald-600 rounded-xl shadow-md hover:shadow-lg transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin h-3.5 w-3.5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span>Accepting...</span>
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span>Accept &amp; Continue</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
