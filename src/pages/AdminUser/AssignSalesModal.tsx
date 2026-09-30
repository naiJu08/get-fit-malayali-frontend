import { useState, useEffect, useMemo } from 'react'
import { assignSalesToClient, useActiveSalesTeam } from './api'
import { useSnackbarManager } from '../../components/common/snackbar'
import { getErrorMessage } from '../../utilities/parsers'

interface AssignSalesModalProps {
  isOpen: boolean
  onClose: () => void
  user: any
  onSuccess?: () => void
}

const getInitials = (name?: string) => {
  if (!name) return 'SR'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export default function AssignSalesModal({
  isOpen,
  onClose,
  user,
  onSuccess,
}: AssignSalesModalProps) {
  const { enqueueSnackbar } = useSnackbarManager()
  const { data: salesTeamData, isLoading: isTeamLoading } = useActiveSalesTeam()
  const salesTeam = salesTeamData?.users || []

  const currentRepId = user?.sales_rep?.id ? String(user.sales_rep.id) : ''
  const [selectedSalesRepId, setSelectedSalesRepId] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const pageSize = 4

  useEffect(() => {
    if (isOpen) {
      setSelectedSalesRepId(currentRepId)
      setSearchTerm('')
      setPage(1)
    }
  }, [isOpen, currentRepId])

  const filteredSalesTeam = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    if (!term) return salesTeam
    return salesTeam.filter((rep: any) =>
      [rep.name, rep.email, rep.phone].some((val) =>
        String(val || '')
          .toLowerCase()
          .includes(term)
      )
    )
  }, [salesTeam, searchTerm])

  const totalPages = Math.max(1, Math.ceil(filteredSalesTeam.length / pageSize))
  const visibleSalesTeam = useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredSalesTeam.slice(start, start + pageSize)
  }, [filteredSalesTeam, page, pageSize])

  if (!isOpen || !user) return null

  const handleSave = async () => {
    setLoading(true)
    try {
      const repIdToSend = selectedSalesRepId ? selectedSalesRepId : null
      const res: any = await assignSalesToClient(user.id, repIdToSend)
      const msg =
        res?.message ||
        (repIdToSend
          ? 'Sales representative assigned successfully'
          : 'Sales representative unassigned')
      enqueueSnackbar(msg, { variant: 'success' })
      onSuccess?.()
      onClose()
    } catch (err: any) {
      enqueueSnackbar(
        getErrorMessage(err) || 'Failed to assign sales representative',
        { variant: 'error' }
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[1400] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative z-10 w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-700 to-slate-800 px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/10">
              <svg
                className="w-5 h-5 text-blue-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-semibold leading-tight">
                Assign Sales Representative
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                Assign or change the Sales member responsible for this client
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
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

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Client summary box */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Client
                </div>
                <div className="text-sm font-semibold text-slate-800 mt-0.5">
                  {user.name || 'Unnamed Client'}
                </div>
                <div className="text-xs text-slate-500">
                  {user.email || '--'}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Current Sales
                </div>
                <div className="mt-0.5">
                  {user.sales_rep?.name ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                      {user.sales_rep.name}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                      Unassigned
                    </span>
                  )}
                </div>
              </div>
            </div>

            {user.lead_converted && user.lead && (
              <div className="flex items-center gap-1.5 text-[11px] text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg px-2.5 py-1 mt-2.5">
                <svg
                  className="w-3.5 h-3.5 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  />
                </svg>
                <span>
                  Client converted from Lead #{user.lead.id}
                  {user.lead.lead_source ? ` (${user.lead.lead_source})` : ''}
                </span>
              </div>
            )}
          </div>

          {/* Search bar */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Select an Active Sales Representative
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <input
                type="search"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setPage(1)
                }}
                placeholder="Search by name, email, or phone..."
                className="w-full pl-9 pr-8 py-2.5 text-sm rounded-xl border border-slate-200 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('')
                    setPage(1)
                  }}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-slate-400 hover:text-slate-600"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Full-width Cards List */}
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {isTeamLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-16 bg-slate-100 rounded-xl animate-pulse"
                  />
                ))}
              </div>
            ) : visibleSalesTeam.length > 0 ? (
              visibleSalesTeam.map((rep: any) => {
                const isCurrentAssignee =
                  Boolean(currentRepId) &&
                  String(currentRepId) === String(rep.id)
                const isSelected = String(selectedSalesRepId) === String(rep.id)

                return (
                  <button
                    key={rep.id}
                    type="button"
                    onClick={() =>
                      setSelectedSalesRepId((prev) =>
                        String(prev) === String(rep.id) ? '' : String(rep.id)
                      )
                    }
                    className={
                      'flex w-full items-center gap-3.5 rounded-xl border p-3 text-left transition-all ' +
                      (isSelected
                        ? 'border-blue-600 bg-blue-50/70 ring-2 ring-blue-500/20 shadow-sm'
                        : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50/80')
                    }
                  >
                    {/* Avatar */}
                    <span
                      className={
                        'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold text-xs transition-colors ' +
                        (isSelected
                          ? 'bg-blue-600 text-white'
                          : 'bg-blue-100 text-blue-700')
                      }
                    >
                      {getInitials(rep.name)}
                    </span>

                    {/* Info */}
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="truncate text-sm font-semibold text-slate-800">
                          {rep.name || 'Unnamed staff'}
                        </span>
                        {isCurrentAssignee && (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 border border-amber-300">
                            Currently Assigned
                          </span>
                        )}
                      </span>
                      <span className="flex flex-wrap items-center gap-x-2 text-xs text-slate-500 mt-0.5">
                        <span className="truncate">
                          {rep.email || 'Active team member'}
                        </span>
                        {rep.phone && (
                          <span className="text-slate-400">• {rep.phone}</span>
                        )}
                      </span>
                    </span>

                    {/* Selection Indicator */}
                    <div className="shrink-0">
                      {isSelected ? (
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white shadow-sm">
                          <svg
                            className="w-3 h-3"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={3}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </div>
                      ) : (
                        <div className="h-5 w-5 rounded-full border border-slate-300" />
                      )}
                    </div>
                  </button>
                )
              })
            ) : (
              <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
                {searchTerm
                  ? 'No sales team members match your search.'
                  : 'No active sales team members found.'}
              </div>
            )}
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
            <span>
              {filteredSalesTeam.length} active sales member
              {filteredSalesTeam.length === 1 ? '' : 's'}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 transition-colors"
              >
                Previous
              </button>
              <span className="font-medium text-slate-600">
                Page {Math.min(page, totalPages)} of {totalPages}
              </span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex items-center justify-between">
          <div>
            {(currentRepId || selectedSalesRepId) && (
              <button
                type="button"
                onClick={() => setSelectedSalesRepId('')}
                className="text-xs text-red-600 hover:text-red-700 font-medium hover:underline flex items-center gap-1 cursor-pointer"
              >
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                {selectedSalesRepId ? 'Clear Selection' : 'Clear Assignment'}
              </button>
            )}
          </div>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200/70 rounded-xl transition-colors cursor-pointer"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={loading || (!selectedSalesRepId && !currentRepId)}
              className="inline-flex items-center justify-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl shadow-md shadow-blue-500/25 transition-all duration-200 active:scale-95 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
            >
              {loading ? (
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
                  Saving...
                </>
              ) : selectedSalesRepId ? (
                'Save Assignment'
              ) : (
                'Unassign Representative'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
