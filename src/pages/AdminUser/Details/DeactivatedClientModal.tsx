import React from 'react'

interface DeactivatedClientModalProps {
  isOpen: boolean
  onClose: () => void
  clientName?: string
  clientEmail?: string
  clientPhone?: string
  clientStatus?: string
}

export default function DeactivatedClientModal({
  isOpen,
  onClose,
  clientName,
  clientEmail,
  clientPhone,
  clientStatus = 'Deactivated',
}: DeactivatedClientModalProps) {
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
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl border border-rose-100 transition-all transform animate-in zoom-in-95 duration-200">
        {/* Header gradient banner */}
        <div className="bg-gradient-to-r from-rose-600 via-red-600 to-amber-600 px-6 py-5 text-white relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/20 backdrop-blur-md border border-white/25 shadow-inner">
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
                    d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold leading-tight text-white tracking-tight">
                  Client Deactivated
                </h3>
                <p className="text-xs text-rose-100 mt-0.5 font-medium">
                  All actions & plan edits are restricted
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="text-white/80 hover:text-white rounded-lg p-1 hover:bg-white/10 transition-colors"
              aria-label="Close"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          {/* Client Card */}
          <div className="rounded-xl bg-slate-50 p-4 border border-slate-200/80 shadow-2xs">
            <div className="flex items-center gap-3.5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-800 font-bold text-sm shadow-inner border border-rose-200/60">
                {getInitials(clientName)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-sm font-bold text-gray-900 truncate">
                    {clientName || 'Client'}
                  </h4>
                  <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 shrink-0">
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                    {clientStatus}
                  </span>
                </div>
                <div className="text-xs text-gray-500 mt-0.5 truncate">
                  {clientEmail || clientPhone || 'No contact details available'}
                </div>
              </div>
            </div>
          </div>

          {/* Warning explanation */}
          <div className="rounded-xl bg-amber-50/80 border border-amber-200/80 p-3.5 flex items-start gap-3 text-amber-900">
            <svg
              className="w-5 h-5 text-amber-600 shrink-0 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <div className="text-xs leading-relaxed">
              <span className="font-semibold block text-amber-950 mb-0.5">
                Actions are disabled
              </span>
              This client account is currently deactivated. Updating daily
              plans, assigning or changing workout, yoga, and diet templates,
              and modifying package schedules are restricted until the client is
              reactivated.
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 text-xs font-semibold rounded-lg bg-gray-900 text-white hover:bg-gray-800 transition-colors shadow-xs"
          >
            Understood
          </button>
        </div>
      </div>
    </div>
  )
}
