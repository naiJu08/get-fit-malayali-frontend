import React, { useState, useEffect, useRef, useMemo } from 'react'
import moment from 'moment'
import {
  getStaffActiveAssignments,
  reassignStaffAssignment,
  bulkReassignStaffAssignments,
} from './api'
import { useSnackbarManager } from '../../components/common/snackbar'
import { getErrorMessage } from '../../utilities/parsers'

interface StaffMember {
  id: string | number
  name: string
  email?: string
  phone?: string
  role?: string
}

interface SearchableStaffSelectProps {
  value: string
  onChange: (value: string) => void
  options: StaffMember[]
  placeholder?: string
  roleName?: string
  disabled?: boolean
  className?: string
  size?: 'sm' | 'md'
}

const getInitials = (name?: string) => {
  if (!name) return 'ST'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function SearchableStaffSelect({
  value,
  onChange,
  options,
  placeholder,
  roleName = 'Staff',
  disabled = false,
  className = '',
  size = 'md',
}: SearchableStaffSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const selectedStaff = useMemo(
    () => options.find((opt) => String(opt.id) === String(value)),
    [options, value]
  )

  const filteredOptions = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    if (!term) return options
    return options.filter((opt) => {
      const name = String(opt.name || '').toLowerCase()
      const email = String(opt.email || '').toLowerCase()
      const phone = String(opt.phone || '').toLowerCase()
      return name.includes(term) || email.includes(term) || phone.includes(term)
    })
  }, [options, searchTerm])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen) {
      setSearchTerm('')
      setTimeout(() => {
        searchInputRef.current?.focus()
      }, 50)
    }
  }, [isOpen])

  const defaultPlaceholder = `Select ${roleName}`

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full flex items-center justify-between gap-2 border rounded-xl bg-white shadow-xs transition-all text-left ${
          size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-3.5 py-2 text-xs'
        } ${
          isOpen
            ? 'border-blue-500 ring-2 ring-blue-100 shadow-sm'
            : 'border-gray-200 hover:border-gray-300'
        } ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-50' : 'cursor-pointer'}`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {selectedStaff ? (
            <>
              <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[10px] flex-shrink-0">
                {getInitials(selectedStaff.name)}
              </div>
              <div className="truncate font-semibold text-gray-900">
                {selectedStaff.name}
              </div>
            </>
          ) : (
            <>
              <svg
                className="w-4 h-4 text-gray-400 flex-shrink-0"
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
              <span className="text-gray-400 font-medium truncate">
                {placeholder || defaultPlaceholder}
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          {selectedStaff && !disabled && (
            <span
              onClick={(e) => {
                e.stopPropagation()
                onChange('')
              }}
              className="p-0.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              title="Clear selection"
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
            </span>
          )}
          <svg
            className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-blue-500' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 right-0 z-50 mt-1.5 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden min-w-[240px] max-w-sm animate-in fade-in zoom-in-95 duration-150">
          {/* Search Bar */}
          <div className="p-2 border-b border-gray-100 bg-gray-50/70">
            <div className="relative flex items-center">
              <svg
                className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 pointer-events-none"
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
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={`Search ${roleName} name or email...`}
                className="w-full bg-white border border-gray-200 rounded-lg pl-8 pr-7 py-1.5 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 text-gray-400 hover:text-gray-600 p-0.5 rounded-full"
                >
                  <svg
                    className="w-3 h-3"
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

          {/* Options List */}
          <div className="max-h-56 overflow-y-auto p-1 divide-y divide-gray-50">
            {filteredOptions.length === 0 ? (
              <div className="py-6 px-4 text-center">
                <p className="text-xs text-gray-500 font-medium">
                  No {roleName} found
                </p>
                {searchTerm && (
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    matching &ldquo;{searchTerm}&rdquo;
                  </p>
                )}
              </div>
            ) : (
              filteredOptions.map((staff) => {
                const isSelected = String(staff.id) === String(value)
                return (
                  <button
                    key={staff.id}
                    type="button"
                    onClick={() => {
                      onChange(String(staff.id))
                      setIsOpen(false)
                    }}
                    className={`w-full flex items-center justify-between gap-3 px-3 py-2 text-left rounded-lg transition-colors text-xs ${
                      isSelected
                        ? 'bg-blue-50 text-blue-900 font-semibold'
                        : 'hover:bg-gray-50 text-gray-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[11px] flex-shrink-0 ${
                          isSelected
                            ? 'bg-blue-600 text-white'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {getInitials(staff.name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-gray-900 truncate">
                          {staff.name}
                        </div>
                        <div className="text-[11px] text-gray-500 truncate mt-0.5">
                          {staff.email || staff.phone || ''}
                        </div>
                      </div>
                    </div>

                    {isSelected && (
                      <svg
                        className="w-4 h-4 text-blue-600 flex-shrink-0"
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
                    )}
                  </button>
                )
              })
            )}
          </div>

          {/* Footer count */}
          <div className="px-3 py-1.5 bg-gray-50 border-t border-gray-100 text-[10px] text-gray-400 flex items-center justify-between">
            <span>
              {filteredOptions.length} of {options.length} {roleName}(s)
              available
            </span>
            {selectedStaff && (
              <span className="text-blue-600 font-medium">Selected</span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

interface StaffAssignmentsModalProps {
  isOpen: boolean
  onClose: () => void
  staffUser: any
  actionType: 'deactivate' | 'delete'
  onProceed: () => void
}

export default function StaffAssignmentsModal({
  isOpen,
  onClose,
  staffUser,
  actionType,
  onProceed,
}: StaffAssignmentsModalProps) {
  const { enqueueSnackbar } = useSnackbarManager()

  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<{
    user: any
    has_active_assignments: boolean
    assignments_count: number
    total_commitments: number
    assignments: any[]
    available_staff: StaffMember[]
  } | null>(null)

  const [bulkStaffId, setBulkStaffId] = useState<string>('')
  const defaultReassignReason =
    actionType === 'delete' ? 'Assignee deleted' : 'Assignee deactivated'
  const [bulkReason] = useState<string>(defaultReassignReason)
  const [isBulkLoading, setIsBulkLoading] = useState(false)

  const [reassignState, setReassignState] = useState<
    Record<string | number, { staffId: string; reason: string }>
  >({})
  const [reassigningId, setReassigningId] = useState<string | number | null>(
    null
  )

  const fetchAssignments = async () => {
    if (!staffUser?.id) return
    setLoading(true)
    try {
      const res: any = await getStaffActiveAssignments(staffUser.id)
      setData(res)
    } catch (err: any) {
      enqueueSnackbar(
        getErrorMessage(err) || 'Failed to fetch staff assignments',
        {
          variant: 'error',
        }
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen && staffUser?.id) {
      setData(null)
      setBulkStaffId('')
      setReassignState({})
      fetchAssignments()
    }
  }, [isOpen, staffUser?.id])

  if (!isOpen || !staffUser) return null

  const assignments = data?.assignments || []
  const availableStaff = data?.available_staff || []
  const roleTitle = String(staffUser?.role || 'Staff').replace(/_/g, ' ')
  const capitalizedRole = roleTitle.charAt(0).toUpperCase() + roleTitle.slice(1)

  const handleSingleReassign = async (assignment: any) => {
    const state = reassignState[assignment.id]
    const targetStaffId = state?.staffId
    if (!targetStaffId) {
      enqueueSnackbar(`Please select a replacement ${capitalizedRole}`, {
        variant: 'warning',
      })
      return
    }

    setReassigningId(assignment.id)
    try {
      const res: any = await reassignStaffAssignment(staffUser.id, {
        assignment_id: assignment.id,
        new_staff_id: targetStaffId,
        action_type: actionType,
        reason: state?.reason || defaultReassignReason,
      })
      enqueueSnackbar(res?.message || 'Client successfully reassigned', {
        variant: 'success',
      })

      if (res?.assignments) {
        setData((prev) =>
          prev
            ? {
                ...prev,
                has_active_assignments: res.has_active_assignments,
                assignments_count: res.assignments_count,
                assignments: res.assignments,
              }
            : null
        )
      } else {
        await fetchAssignments()
      }
    } catch (err: any) {
      enqueueSnackbar(getErrorMessage(err) || 'Failed to reassign client', {
        variant: 'error',
      })
    } finally {
      setReassigningId(null)
    }
  }

  const handleBulkReassign = async () => {
    if (!bulkStaffId) {
      enqueueSnackbar(
        `Please select a replacement ${capitalizedRole} for bulk reassignment`,
        {
          variant: 'warning',
        }
      )
      return
    }

    setIsBulkLoading(true)
    try {
      const res: any = await bulkReassignStaffAssignments(staffUser.id, {
        new_staff_id: bulkStaffId,
        action_type: actionType,
        reason: bulkReason || defaultReassignReason,
      })
      enqueueSnackbar(res?.message || 'All clients successfully reassigned', {
        variant: 'success',
      })
      setData((prev) =>
        prev
          ? {
              ...prev,
              has_active_assignments: false,
              assignments_count: 0,
              assignments: [],
            }
          : null
      )
    } catch (err: any) {
      enqueueSnackbar(
        getErrorMessage(err) || 'Failed to bulk reassign clients',
        {
          variant: 'error',
        }
      )
    } finally {
      setIsBulkLoading(false)
    }
  }

  const handleSetRowStaff = (
    assignmentId: string | number,
    staffId: string
  ) => {
    setReassignState((prev) => ({
      ...prev,
      [assignmentId]: {
        ...(prev[assignmentId] || {
          reason: `Reassigned prior to ${actionType}`,
        }),
        staffId,
      },
    }))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-amber-50 via-white to-amber-50">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-amber-100 text-amber-700 font-bold">
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
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                Active Client Assignments & Commitments
              </h3>
              <p className="text-xs text-gray-500">
                Cannot {actionType} {capitalizedRole}{' '}
                <span className="font-semibold text-gray-800">
                  {staffUser?.name}
                </span>{' '}
                until all active assignments are reassigned.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Staff Summary Card */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-base shadow-sm">
                {getInitials(staffUser?.name)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-gray-900">
                    {staffUser?.name}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                    {capitalizedRole}
                  </span>
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  {staffUser?.email}{' '}
                  {staffUser?.phone ? `• ${staffUser.phone}` : ''}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-center shadow-xs">
                <div className="text-xs font-medium text-gray-500">
                  Active Clients
                </div>
                <div className="text-base font-bold text-amber-600">
                  {assignments.length}
                </div>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-center shadow-xs">
                <div className="text-xs font-medium text-gray-500">
                  Upcoming Commitments
                </div>
                <div className="text-base font-bold text-indigo-600">
                  {assignments.reduce(
                    (acc, a) => acc + (a.upcoming_follow_ups_count || 0),
                    0
                  )}
                </div>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-3">
              <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-gray-500">
                Loading assignments and commitments...
              </p>
            </div>
          ) : assignments.length === 0 ? (
            /* All cleared state */
            <div className="py-8 px-6 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-4">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <svg
                  className="w-6 h-6"
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
              </div>
              <div>
                <h4 className="text-base font-bold text-emerald-900">
                  No Active Assignments Remaining
                </h4>
                <p className="text-xs text-emerald-700 mt-1 max-w-md mx-auto">
                  All client commitments and active cycles have been reassigned.
                  You can now safely proceed to {actionType} this user.
                </p>
              </div>
              <div className="pt-2">
                <button
                  onClick={onProceed}
                  className={`px-5 py-2.5 rounded-xl font-semibold text-white shadow-sm transition-all cursor-pointer ${
                    actionType === 'delete'
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-amber-600 hover:bg-amber-700'
                  }`}
                >
                  Proceed to{' '}
                  {actionType === 'delete' ? 'Delete User' : 'Deactivate User'}
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Bulk Reassign Option */}
              {availableStaff.length > 0 && assignments.length > 1 && (
                <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-bold text-indigo-900">
                        Bulk Reassign All Clients
                      </h4>
                      <p className="text-xs text-indigo-700 mt-0.5">
                        Transfer all {assignments.length} assigned clients and
                        upcoming follow-ups at once to an available{' '}
                        {capitalizedRole}.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-64">
                        <SearchableStaffSelect
                          value={bulkStaffId}
                          onChange={setBulkStaffId}
                          options={availableStaff}
                          roleName={capitalizedRole}
                          placeholder={`Select Replacement ${capitalizedRole}`}
                        />
                      </div>
                      <button
                        onClick={handleBulkReassign}
                        disabled={!bulkStaffId || isBulkLoading}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer h-9"
                      >
                        {isBulkLoading && (
                          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        )}
                        Reassign All ({assignments.length})
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* No replacement staff alert if availableStaff is empty */}
              {availableStaff.length === 0 && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-800 text-xs">
                  <svg
                    className="w-5 h-5 flex-shrink-0 text-red-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>
                    No other active {capitalizedRole} staff members are
                    available in the system. Please create or activate another{' '}
                    {capitalizedRole} first to reassign these clients.
                  </span>
                </div>
              )}

              {/* Assignments Breakdown List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold text-gray-500 uppercase tracking-wider px-1">
                  <span>Client & Package Details</span>
                  <span>Commitments & Reassignment</span>
                </div>

                <div className="space-y-3">
                  {assignments.map((assignment: any) => {
                    const rowState = reassignState[assignment.id] || {
                      staffId: '',
                      reason: `Reassigned prior to ${actionType}`,
                    }
                    const isRowReassigning = reassigningId === assignment.id
                    const followUps = assignment.upcoming_follow_ups || []

                    return (
                      <div
                        key={assignment.id}
                        className="bg-white border border-gray-200 hover:border-gray-300 rounded-xl p-4 shadow-xs transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                      >
                        {/* Client Info */}
                        <div className="flex items-start gap-3 min-w-[240px] flex-1">
                          <div className="w-10 h-10 rounded-full bg-gray-100 text-gray-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
                            {getInitials(assignment.client_name)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-bold text-gray-900">
                                {assignment.client_name}
                              </span>
                              <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-gray-100 text-gray-700 border border-gray-200">
                                {assignment.workflow_status?.replace(/_/g, ' ')}
                              </span>
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5">
                              {assignment.client_email}{' '}
                              {assignment.client_phone
                                ? `• ${assignment.client_phone}`
                                : ''}
                            </div>
                            <div className="mt-2 flex items-center gap-2 flex-wrap text-xs">
                              <span className="font-semibold text-gray-700">
                                {assignment.plan_name}
                              </span>
                              {assignment.start_date && assignment.end_date && (
                                <span className="text-gray-500 text-[11px]">
                                  (
                                  {moment(assignment.start_date).format(
                                    'DD MMM YYYY'
                                  )}{' '}
                                  –{' '}
                                  {moment(assignment.end_date).format(
                                    'DD MMM YYYY'
                                  )}
                                  )
                                </span>
                              )}
                              <span
                                className={`px-2 py-0.2 rounded-full text-[10px] font-semibold ${
                                  assignment.status === 'active'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {assignment.status}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Commitments & Reassignment Controls */}
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 border-t sm:border-t-0 pt-3 sm:pt-0">
                          {/* Follow-ups badge / commitments */}
                          {followUps.length > 0 ? (
                            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-2 text-left max-w-xs">
                              <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-900">
                                <svg
                                  className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                  />
                                </svg>
                                <span>
                                  {followUps.length} Scheduled Follow-up
                                </span>
                              </div>
                              <div className="text-[11px] text-indigo-700 mt-1">
                                Next:{' '}
                                {moment(followUps[0].scheduled_at).format(
                                  'DD MMM, hh:mm A'
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="text-xs text-gray-400 italic">
                              No scheduled follow-ups
                            </div>
                          )}

                          {/* Reassign Searchable Select & button */}
                          {availableStaff.length > 0 && (
                            <div className="flex items-center gap-2">
                              <div className="w-52">
                                <SearchableStaffSelect
                                  value={rowState.staffId}
                                  onChange={(val) =>
                                    handleSetRowStaff(assignment.id, val)
                                  }
                                  options={availableStaff}
                                  roleName={capitalizedRole}
                                  placeholder={`Select ${capitalizedRole}`}
                                  size="sm"
                                />
                              </div>

                              <button
                                onClick={() => handleSingleReassign(assignment)}
                                disabled={!rowState.staffId || isRowReassigning}
                                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors flex items-center gap-1 cursor-pointer h-8"
                              >
                                {isRowReassigning && (
                                  <div className="w-2.5 h-2.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                )}
                                Reassign
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-end">
          {assignments.length > 0 && (
            <p className="text-xs text-gray-500">
              Reassign all {assignments.length} client(s) to enable {actionType}
              .
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
