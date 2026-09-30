import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
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
  searchPlaceholder?: string
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
  searchPlaceholder,
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
                placeholder={searchPlaceholder || `Search ${roleName}...`}
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
  const queryClient = useQueryClient()

  // Role detection: ONLY true for 'sales' role
  const roleStr = String(
    staffUser?.role?.name || staffUser?.role_name || staffUser?.role || ''
  )
    .toLowerCase()
    .trim()
  const isSales = roleStr === 'sales'

  const [salesStage, setSalesStage] = useState<'clients' | 'leads'>('clients')
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [assignments, setAssignments] = useState<any[]>([])
  const [availableStaff, setAvailableStaff] = useState<StaffMember[]>([])
  const [totalCount, setTotalCount] = useState<number>(0)
  const [clientsCount, setClientsCount] = useState<number>(0)
  const [leadsCount, setLeadsCount] = useState<number>(0)
  const [totalCommitments, setTotalCommitments] = useState<number>(0)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  // Multi-select state
  const [selectedIds, setSelectedIds] = useState<(string | number)[]>([])
  const [multiStaffId, setMultiStaffId] = useState<string>('')
  const [isMultiLoading, setIsMultiLoading] = useState(false)

  // Bulk all state
  const [bulkStaffId, setBulkStaffId] = useState<string>('')
  const defaultReassignReason =
    actionType === 'delete' ? 'Assignee deleted' : 'Assignee deactivated'
  const [bulkReason] = useState<string>(defaultReassignReason)
  const [isBulkLoading, setIsBulkLoading] = useState(false)

  // Single row state
  const [reassignState, setReassignState] = useState<
    Record<string | number, { staffId: string; reason: string }>
  >({})
  const [reassigningId, setReassigningId] = useState<string | number | null>(
    null
  )

  const sentinelRef = useRef<HTMLDivElement | null>(null)

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm)
    }, 350)
    return () => clearTimeout(timer)
  }, [searchTerm])

  // Fetch initial or refreshed page 1
  const fetchPage1 = useCallback(
    async (searchQuery = '', stageToFetch?: 'clients' | 'leads') => {
      if (!staffUser?.id) return
      setLoading(true)
      const currentStage = stageToFetch || salesStage
      try {
        const res: any = await getStaffActiveAssignments(staffUser.id, {
          page: 1,
          per_page: 20,
          search: searchQuery.trim(),
          stage: isSales ? currentStage : undefined,
        })

        const items = res?.assignments || []
        setAssignments(items)
        setAvailableStaff(res?.available_staff || [])

        if (isSales) {
          const cCount =
            typeof res?.clients_count === 'number' ? res.clients_count : 0
          const lCount =
            typeof res?.leads_count === 'number' ? res.leads_count : 0
          setClientsCount(cCount)
          setLeadsCount(lCount)
          const activeStageCount = currentStage === 'leads' ? lCount : cCount
          setTotalCount(activeStageCount)
        } else {
          const count =
            typeof res?.assignments_count === 'number'
              ? res.assignments_count
              : typeof res?.meta?.total_count === 'number'
                ? res.meta.total_count
                : items.length
          setTotalCount(count)
        }

        setTotalCommitments(res?.total_commitments || 0)
        setPage(1)
        const totalPages = res?.meta?.total_pages || 1
        setHasMore(totalPages > 1)
        setSelectedIds([])
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
    },
    [staffUser?.id, salesStage, isSales, enqueueSnackbar]
  )

  // Fetch next page for infinite scroll
  const fetchNextPage = async () => {
    if (!staffUser?.id || loading || loadingMore || !hasMore) return
    setLoadingMore(true)
    const nextPage = page + 1
    try {
      const res: any = await getStaffActiveAssignments(staffUser.id, {
        page: nextPage,
        per_page: 20,
        search: debouncedSearch.trim(),
        stage: isSales ? salesStage : undefined,
      })
      const newItems = res?.assignments || []
      setAssignments((prev) => {
        const existingIds = new Set(prev.map((i) => i.id))
        const filteredNew = newItems.filter((i: any) => !existingIds.has(i.id))
        return [...prev, ...filteredNew]
      })
      setPage(nextPage)
      const totalPages = res?.meta?.total_pages || 1
      setHasMore(nextPage < totalPages)
      if (isSales) {
        if (typeof res?.clients_count === 'number')
          setClientsCount(res.clients_count)
        if (typeof res?.leads_count === 'number') setLeadsCount(res.leads_count)
      }
    } catch (err: any) {
      enqueueSnackbar(
        getErrorMessage(err) || 'Failed to load more assignments',
        {
          variant: 'error',
        }
      )
    } finally {
      setLoadingMore(false)
    }
  }

  // Effect on modal open
  useEffect(() => {
    if (isOpen && staffUser?.id) {
      setSalesStage('clients')
      setAssignments([])
      setAvailableStaff([])
      setTotalCount(0)
      setClientsCount(0)
      setLeadsCount(0)
      setTotalCommitments(0)
      setSelectedIds([])
      setMultiStaffId('')
      setBulkStaffId('')
      setSearchTerm('')
      setDebouncedSearch('')
      setReassignState({})
      fetchPage1('', 'clients')
    }
  }, [isOpen, staffUser?.id])

  // Effect when debounced search query changes
  useEffect(() => {
    if (isOpen && staffUser?.id) {
      fetchPage1(debouncedSearch, salesStage)
    }
  }, [debouncedSearch])

  // Switch Sales Stage (Clients vs Leads)
  const handleSwitchStage = (stage: 'clients' | 'leads') => {
    if (stage === salesStage || loading) return
    setSalesStage(stage)
    setSelectedIds([])
    setMultiStaffId('')
    setBulkStaffId('')
    setSearchTerm('')
    setDebouncedSearch('')
    setReassignState({})
    fetchPage1('', stage)
  }

  // Intersection Observer for Infinite Scrolling
  useEffect(() => {
    if (!sentinelRef.current) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
          fetchNextPage()
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    )

    observer.observe(sentinelRef.current)
    return () => observer.disconnect()
  }, [hasMore, loading, loadingMore, page, debouncedSearch, salesStage])

  if (!isOpen || !staffUser) return null

  const roleTitle = String(
    staffUser?.role?.name || staffUser?.role_name || staffUser?.role || 'Staff'
  ).replace(/_/g, ' ')
  const capitalizedRole = roleTitle.charAt(0).toUpperCase() + roleTitle.slice(1)

  // Selection handlers
  const allVisibleSelected =
    assignments.length > 0 &&
    assignments.every((a) => selectedIds.includes(a.id))
  const someVisibleSelected =
    assignments.some((a) => selectedIds.includes(a.id)) && !allVisibleSelected

  const handleToggleSelectAll = () => {
    if (allVisibleSelected) {
      setSelectedIds([])
    } else {
      setSelectedIds(assignments.map((a) => a.id))
    }
  }

  const handleToggleRowSelect = (id: string | number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  // Invalidate queries after reassignments
  const invalidateRelevantQueries = () => {
    queryClient.invalidateQueries({
      queryKey: ['assigned_client_workflow'],
      refetchType: 'all',
    })
    queryClient.invalidateQueries({
      queryKey: ['assigned_client_workflow_client'],
      refetchType: 'all',
    })
    queryClient.invalidateQueries({
      queryKey: ['admin_user_list'],
      refetchType: 'all',
    })
    queryClient.invalidateQueries({
      queryKey: ['user_sales_clients'],
      refetchType: 'all',
    })
    queryClient.invalidateQueries({
      queryKey: ['user_sales_leads'],
      refetchType: 'all',
    })
    queryClient.invalidateQueries({
      queryKey: ['active_sales_team'],
      refetchType: 'all',
    })
  }

  // Single Reassign
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
        stage: isSales ? salesStage : undefined,
        assignment_type: isSales
          ? salesStage === 'leads'
            ? 'lead'
            : 'client'
          : undefined,
        is_lead: isSales && salesStage === 'leads',
      })
      enqueueSnackbar(res?.message || 'Assignment successfully reassigned', {
        variant: 'success',
      })
      invalidateRelevantQueries()

      if (isSales) {
        const cCount =
          typeof res?.clients_count === 'number'
            ? res.clients_count
            : clientsCount
        const lCount =
          typeof res?.leads_count === 'number' ? res.leads_count : leadsCount
        setClientsCount(cCount)
        setLeadsCount(lCount)
        setTotalCount(salesStage === 'leads' ? lCount : cCount)
      } else {
        const newRemainingCount =
          typeof res?.assignments_count === 'number'
            ? res.assignments_count
            : Math.max(0, totalCount - 1)
        setTotalCount(newRemainingCount)
      }

      setAssignments((prev) => prev.filter((a) => a.id !== assignment.id))
      setSelectedIds((prev) => prev.filter((id) => id !== assignment.id))

      if (assignments.length <= 1 && hasMore) {
        fetchPage1(debouncedSearch, salesStage)
      }
    } catch (err: any) {
      enqueueSnackbar(getErrorMessage(err) || 'Failed to reassign assignment', {
        variant: 'error',
      })
    } finally {
      setReassigningId(null)
    }
  }

  // Multi-Select Reassign
  const handleMultiReassign = async () => {
    if (selectedIds.length === 0) {
      enqueueSnackbar('Please select at least one item to reassign', {
        variant: 'warning',
      })
      return
    }

    if (!multiStaffId) {
      enqueueSnackbar(
        `Please select a replacement ${capitalizedRole} for selected items`,
        {
          variant: 'warning',
        }
      )
      return
    }

    setIsMultiLoading(true)
    try {
      const res: any = await bulkReassignStaffAssignments(staffUser.id, {
        new_staff_id: multiStaffId,
        assignment_ids: selectedIds,
        client_ids:
          !isSales || salesStage === 'clients' ? selectedIds : undefined,
        lead_ids: isSales && salesStage === 'leads' ? selectedIds : undefined,
        action_type: actionType,
        reason: defaultReassignReason,
        stage: isSales ? salesStage : undefined,
        assignment_type: isSales
          ? salesStage === 'leads'
            ? 'lead'
            : 'client'
          : undefined,
      })
      enqueueSnackbar(
        res?.message || `${selectedIds.length} item(s) successfully reassigned`,
        {
          variant: 'success',
        }
      )
      invalidateRelevantQueries()

      const reassignedIdsSet = new Set(
        res?.reassigned_ids || selectedIds.map(Number)
      )

      if (isSales) {
        const cCount =
          typeof res?.clients_count === 'number'
            ? res.clients_count
            : clientsCount
        const lCount =
          typeof res?.leads_count === 'number' ? res.leads_count : leadsCount
        setClientsCount(cCount)
        setLeadsCount(lCount)
        setTotalCount(salesStage === 'leads' ? lCount : cCount)
      } else {
        const newRemainingCount =
          typeof res?.assignments_count === 'number'
            ? res.assignments_count
            : Math.max(0, totalCount - selectedIds.length)
        setTotalCount(newRemainingCount)
      }

      setAssignments((prev) =>
        prev.filter(
          (a) =>
            !reassignedIdsSet.has(Number(a.id)) && !selectedIds.includes(a.id)
        )
      )
      setSelectedIds([])
      setMultiStaffId('')

      if (assignments.length <= selectedIds.length && hasMore) {
        fetchPage1(debouncedSearch, salesStage)
      }
    } catch (err: any) {
      enqueueSnackbar(
        getErrorMessage(err) || 'Failed to reassign selected items',
        {
          variant: 'error',
        }
      )
    } finally {
      setIsMultiLoading(false)
    }
  }

  // Bulk All Reassign for current stage
  const handleBulkReassignAll = async () => {
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
        stage: isSales ? salesStage : undefined,
        assignment_type: isSales
          ? salesStage === 'leads'
            ? 'lead'
            : 'client'
          : undefined,
      })
      enqueueSnackbar(res?.message || 'All items successfully reassigned', {
        variant: 'success',
      })
      invalidateRelevantQueries()

      if (isSales) {
        const cCount =
          typeof res?.clients_count === 'number' ? res.clients_count : 0
        const lCount =
          typeof res?.leads_count === 'number' ? res.leads_count : 0
        setClientsCount(cCount)
        setLeadsCount(lCount)
        setTotalCount(salesStage === 'leads' ? lCount : cCount)
      } else {
        setTotalCount(0)
      }

      setAssignments([])
      setSelectedIds([])
      setBulkStaffId('')
    } catch (err: any) {
      enqueueSnackbar(getErrorMessage(err) || 'Failed to bulk reassign items', {
        variant: 'error',
      })
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

  const isAllCleared =
    !loading &&
    (isSales ? clientsCount === 0 && leadsCount === 0 : totalCount === 0) &&
    !searchTerm

  const currentStageCount = isSales
    ? salesStage === 'leads'
      ? leadsCount
      : clientsCount
    : totalCount

  const currentStageLabel = isSales
    ? salesStage === 'leads'
      ? 'Marketing Leads'
      : 'Active Clients'
    : 'Active Clients'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl border border-gray-100 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-amber-50 via-white to-amber-50">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-amber-100 text-amber-700 font-bold flex-shrink-0">
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
                {isSales
                  ? 'Sales Active Assignments & Leads'
                  : 'Active Client Assignments & Commitments'}
              </h3>
              <p className="text-xs text-gray-500">
                Cannot {actionType} {capitalizedRole}{' '}
                <span className="font-semibold text-gray-800">
                  {staffUser?.name}
                </span>{' '}
                until all {isSales ? 'clients and leads' : 'active assignments'}{' '}
                are reassigned.
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
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Staff Summary Card */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-sm flex-shrink-0">
                {getInitials(staffUser?.name)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-gray-900">
                    {staffUser?.name}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                    {capitalizedRole}
                  </span>
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  {staffUser?.email}{' '}
                  {staffUser?.phone ? `• ${staffUser.phone}` : ''}
                </div>
              </div>
            </div>

            {/* Non-sales stats badge (for Nutritionist, Physio, Yoga, etc.) */}
            {!isSales && (
              <div className="flex items-center gap-2.5 flex-wrap">
                <div className="bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-center shadow-xs min-w-[90px]">
                  <div className="text-[10px] font-medium text-gray-500">
                    Active Clients
                  </div>
                  <div className="text-sm font-bold text-amber-600">
                    {totalCount}
                  </div>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-center shadow-xs min-w-[90px]">
                  <div className="text-[10px] font-medium text-gray-500">
                    Follow-ups
                  </div>
                  <div className="text-sm font-bold text-indigo-600">
                    {totalCommitments}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Minimal Height Sleek Stepper for Sales (ONLY rendered when isSales is true) */}
          {isSales && (
            <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-1.5 flex items-center gap-2 shadow-xs">
              {/* Step 1: Active Clients */}
              <button
                type="button"
                onClick={() => handleSwitchStage('clients')}
                className={`flex-1 flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg border text-left transition-all cursor-pointer ${
                  salesStage === 'clients'
                    ? 'bg-white border-blue-500 ring-2 ring-blue-100 shadow-xs'
                    : clientsCount === 0
                      ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                      : 'bg-white/60 border-gray-200 hover:bg-white text-gray-700'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] flex-shrink-0 ${
                      clientsCount === 0
                        ? 'bg-emerald-600 text-white'
                        : salesStage === 'clients'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    {clientsCount === 0 ? '✓' : '1'}
                  </span>
                  <span className="text-xs font-semibold truncate">
                    Stage 1: Clients
                  </span>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold whitespace-nowrap ${
                    clientsCount === 0
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {clientsCount === 0 ? 'Done' : `${clientsCount} Left`}
                </span>
              </button>

              {/* Step 2: Marketing Leads */}
              <button
                type="button"
                onClick={() => handleSwitchStage('leads')}
                className={`flex-1 flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg border text-left transition-all cursor-pointer ${
                  salesStage === 'leads'
                    ? 'bg-white border-indigo-500 ring-2 ring-indigo-100 shadow-xs'
                    : leadsCount === 0
                      ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                      : 'bg-white/60 border-gray-200 hover:bg-white text-gray-700'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] flex-shrink-0 ${
                      leadsCount === 0
                        ? 'bg-emerald-600 text-white'
                        : salesStage === 'leads'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    {leadsCount === 0 ? '✓' : '2'}
                  </span>
                  <span className="text-xs font-semibold truncate">
                    Stage 2: Leads
                  </span>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold whitespace-nowrap ${
                    leadsCount === 0
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-indigo-100 text-indigo-800'
                  }`}
                >
                  {leadsCount === 0 ? 'Done' : `${leadsCount} Left`}
                </span>
              </button>

              {/* Step 3: Action Ready */}
              <div
                className={`flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg border min-w-[130px] transition-all ${
                  clientsCount === 0 && leadsCount === 0
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900 shadow-xs'
                    : 'bg-gray-100/70 border-gray-200 text-gray-500'
                }`}
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] flex-shrink-0 ${
                      clientsCount === 0 && leadsCount === 0
                        ? 'bg-emerald-600 text-white'
                        : 'bg-gray-300 text-gray-600'
                    }`}
                  >
                    {clientsCount === 0 && leadsCount === 0 ? '✓' : '3'}
                  </span>
                  <span className="text-xs font-semibold truncate">
                    {actionType === 'delete' ? 'Delete' : 'Deactivate'}
                  </span>
                </div>
                <span
                  className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold whitespace-nowrap ${
                    clientsCount === 0 && leadsCount === 0
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {clientsCount === 0 && leadsCount === 0 ? 'Ready' : 'Locked'}
                </span>
              </div>
            </div>
          )}

          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-3">
              <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-gray-500">
                Loading{' '}
                {isSales
                  ? salesStage === 'leads'
                    ? 'marketing leads'
                    : 'active clients'
                  : 'assignments and commitments'}
                ...
              </p>
            </div>
          ) : isAllCleared ? (
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
                  {isSales
                    ? 'All Clients and Leads Successfully Reassigned'
                    : 'No Active Assignments Remaining'}
                </h4>
                <p className="text-xs text-emerald-700 mt-1 max-w-md mx-auto">
                  {isSales
                    ? 'All active clients (Stage 1) and unconverted marketing leads (Stage 2) have been reassigned. You can now safely proceed.'
                    : `All client commitments and active cycles have been reassigned. You can now safely proceed to ${actionType} this user.`}
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
              {/* Stage Progress Notice if current stage is cleared but other stage has items */}
              {isSales && currentStageCount === 0 && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
                      ✓
                    </div>
                    <div>
                      <div className="text-xs font-bold text-emerald-900">
                        {salesStage === 'clients'
                          ? 'Stage 1 (Clients) Complete'
                          : 'Stage 2 (Leads) Complete'}
                      </div>
                      <div className="text-[11px] text-emerald-700">
                        {salesStage === 'clients'
                          ? `Please proceed to Stage 2 to reassign the remaining ${leadsCount} lead(s).`
                          : `Please proceed to Stage 1 to reassign the remaining ${clientsCount} client(s).`}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      handleSwitchStage(
                        salesStage === 'clients' ? 'leads' : 'clients'
                      )
                    }
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold whitespace-nowrap cursor-pointer shadow-xs flex items-center gap-1"
                  >
                    <span>
                      Go to{' '}
                      {salesStage === 'clients'
                        ? 'Stage 2: Leads'
                        : 'Stage 1: Clients'}
                    </span>
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
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                </div>
              )}

              {/* Reassignment Action Bar (Multi-Select when checked, otherwise Bulk All) */}
              {availableStaff.length > 0 && currentStageCount > 0 && (
                <div>
                  {selectedIds.length > 0 ? (
                    /* Multi-Select Reassign Bar - Active when checkboxes selected */
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-400/80 rounded-xl p-3.5 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold">
                            {selectedIds.length}
                          </span>
                          <div>
                            <h4 className="text-xs font-bold text-blue-950">
                              Reassign Selected {currentStageLabel} (
                              {selectedIds.length})
                            </h4>
                            <p className="text-[11px] text-blue-700">
                              Transfer selected {selectedIds.length}{' '}
                              {isSales && salesStage === 'leads'
                                ? 'lead(s)'
                                : 'client(s)'}{' '}
                              to a chosen {capitalizedRole}.
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                          <div className="w-56">
                            <SearchableStaffSelect
                              value={multiStaffId}
                              onChange={setMultiStaffId}
                              options={availableStaff}
                              roleName={capitalizedRole}
                              placeholder="Select Replacement"
                              size="sm"
                            />
                          </div>
                          <button
                            onClick={handleMultiReassign}
                            disabled={!multiStaffId || isMultiLoading}
                            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer h-8"
                          >
                            {isMultiLoading && (
                              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            )}
                            Reassign Selected ({selectedIds.length})
                          </button>
                          <button
                            onClick={() => setSelectedIds([])}
                            className="px-2.5 py-1.5 text-xs text-gray-500 hover:text-gray-800 hover:bg-white/80 rounded-lg transition-colors cursor-pointer"
                          >
                            Clear
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : currentStageCount > 1 ? (
                    /* Bulk All Reassign Option - Active when no checkboxes selected */
                    <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-3.5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <h4 className="text-xs font-bold text-indigo-950">
                            Bulk Reassign All {currentStageLabel} (
                            {currentStageCount})
                          </h4>
                          <p className="text-[11px] text-indigo-700 mt-0.5">
                            Transfer all {currentStageCount}{' '}
                            {isSales && salesStage === 'leads'
                              ? 'leads'
                              : 'clients'}{' '}
                            at once to an available {capitalizedRole}.
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className="w-56">
                            <SearchableStaffSelect
                              value={bulkStaffId}
                              onChange={setBulkStaffId}
                              options={availableStaff}
                              roleName={capitalizedRole}
                              placeholder="Select Replacement"
                              size="sm"
                            />
                          </div>
                          <button
                            onClick={handleBulkReassignAll}
                            disabled={!bulkStaffId || isBulkLoading}
                            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer h-8"
                          >
                            {isBulkLoading && (
                              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            )}
                            Reassign All ({currentStageCount})
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : null}
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
                    {capitalizedRole} first to reassign these{' '}
                    {isSales ? 'records' : 'clients'}.
                  </span>
                </div>
              )}

              {/* Search and Filter toolbar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
                {/* Search input */}
                <div className="relative flex-1 max-w-sm">
                  <svg
                    className="w-4 h-4 text-gray-400 absolute left-3 top-2.5 pointer-events-none"
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
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder={`Search ${isSales ? (salesStage === 'leads' ? 'lead name, campaign, email, phone...' : 'client name, email, phone...') : 'assigned client name, email, phone...'}`}
                    className="w-full bg-gray-50/70 border border-gray-200 rounded-xl pl-9 pr-8 py-1.5 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() => setSearchTerm('')}
                      className="absolute right-2.5 top-2 text-gray-400 hover:text-gray-600 p-0.5"
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

                {/* Progress / count badge */}
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span className="bg-gray-100 text-gray-700 font-semibold px-2.5 py-1 rounded-lg border border-gray-200">
                    Loaded {assignments.length} of {currentStageCount}
                  </span>
                  {selectedIds.length > 0 && (
                    <span className="bg-blue-100 text-blue-800 font-semibold px-2.5 py-1 rounded-lg border border-blue-200">
                      {selectedIds.length} Selected
                    </span>
                  )}
                </div>
              </div>

              {/* Assignments Breakdown List */}
              <div className="space-y-2.5">
                {/* Header with Select All Checkbox */}
                <div className="flex items-center justify-between text-xs font-semibold text-gray-500 uppercase tracking-wider px-2 py-1 bg-gray-50/80 rounded-lg border border-gray-100">
                  <div className="flex items-center gap-2.5">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={allVisibleSelected}
                        ref={(el) => {
                          if (el) el.indeterminate = someVisibleSelected
                        }}
                        onChange={handleToggleSelectAll}
                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                      />
                      <span>Select All Loaded ({assignments.length})</span>
                    </label>
                  </div>
                  <span>
                    {isSales && salesStage === 'leads'
                      ? 'Lead Status & Reassignment'
                      : 'Reassignment & Commitments'}
                  </span>
                </div>

                {assignments.length === 0 ? (
                  <div className="py-10 text-center text-gray-400 text-xs bg-gray-50 rounded-xl border border-dashed border-gray-200">
                    {searchTerm
                      ? `No ${isSales ? (salesStage === 'leads' ? 'leads' : 'clients') : 'clients'} found matching "${searchTerm}"`
                      : `No ${isSales ? (salesStage === 'leads' ? 'active marketing leads' : 'active clients') : 'active assignments'} found`}
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {assignments.map((assignment: any) => {
                      const rowState = reassignState[assignment.id] || {
                        staffId: '',
                        reason: `Reassigned prior to ${actionType}`,
                      }
                      const isRowReassigning = reassigningId === assignment.id
                      const followUps = assignment.upcoming_follow_ups || []
                      const isSelected = selectedIds.includes(assignment.id)
                      const isLeadItem =
                        isSales &&
                        (assignment.is_lead || salesStage === 'leads')

                      return (
                        <div
                          key={assignment.id}
                          className={`border rounded-xl p-3.5 shadow-xs transition-all flex flex-col md:flex-row md:items-center justify-between gap-3.5 ${
                            isSelected
                              ? 'bg-blue-50/40 border-blue-300 ring-1 ring-blue-200'
                              : 'bg-white border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          {/* Left: Checkbox + Client / Lead Info */}
                          <div className="flex items-start gap-3 min-w-[240px] flex-1">
                            <div className="pt-2">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() =>
                                  handleToggleRowSelect(assignment.id)
                                }
                                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                              />
                            </div>
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                                isLeadItem
                                  ? 'bg-indigo-100 text-indigo-700'
                                  : 'bg-gray-100 text-gray-700'
                              }`}
                            >
                              {getInitials(assignment.client_name)}
                            </div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-bold text-gray-900">
                                  {assignment.client_name}
                                </span>
                                {isLeadItem ? (
                                  <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
                                    Lead:{' '}
                                    {assignment.workflow_status ||
                                      assignment.status}
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-gray-100 text-gray-700 border border-gray-200">
                                    {assignment.workflow_status?.replace(
                                      /_/g,
                                      ' '
                                    )}
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-gray-500 mt-0.5">
                                {assignment.client_email || 'No email'}{' '}
                                {assignment.client_phone
                                  ? `• ${assignment.client_phone}`
                                  : ''}
                              </div>

                              <div className="mt-1.5 flex items-center gap-2 flex-wrap text-xs">
                                {isLeadItem ? (
                                  <>
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                                      Campaign:{' '}
                                      {assignment.campaign_name ||
                                        assignment.plan_name ||
                                        'Marketing Campaign'}
                                    </span>
                                    {assignment.start_date && (
                                      <span className="text-gray-400 text-[11px]">
                                        Created:{' '}
                                        {moment(assignment.start_date).format(
                                          'DD MMM YYYY, hh:mm A'
                                        )}
                                      </span>
                                    )}
                                  </>
                                ) : (
                                  <>
                                    <span className="font-semibold text-gray-700">
                                      {assignment.plan_name}
                                    </span>
                                    {assignment.start_date &&
                                      assignment.end_date && (
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
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Right: Commitments & Single Reassignment */}
                          <div className="flex flex-col sm:flex-row sm:items-center gap-3 border-t sm:border-t-0 pt-2 sm:pt-0">
                            {/* Follow-ups badge (for clients) */}
                            {!isLeadItem &&
                              (followUps.length > 0 ? (
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
                                  <div className="text-[11px] text-indigo-700 mt-0.5">
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
                              ))}

                            {/* Single Reassign dropdown & button */}
                            {availableStaff.length > 0 && (
                              <div
                                className={`flex items-center gap-2 ${
                                  bulkStaffId
                                    ? 'opacity-50 pointer-events-none'
                                    : ''
                                }`}
                              >
                                <div className="w-48">
                                  <SearchableStaffSelect
                                    value={rowState.staffId}
                                    onChange={(val) =>
                                      handleSetRowStaff(assignment.id, val)
                                    }
                                    options={availableStaff}
                                    roleName={capitalizedRole}
                                    placeholder={`Select ${capitalizedRole}`}
                                    disabled={!!bulkStaffId}
                                    size="sm"
                                  />
                                </div>

                                <button
                                  onClick={() =>
                                    handleSingleReassign(assignment)
                                  }
                                  disabled={
                                    !rowState.staffId ||
                                    isRowReassigning ||
                                    !!bulkStaffId
                                  }
                                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-semibold shadow-xs transition-colors flex items-center gap-1 cursor-pointer h-8"
                                  title={
                                    bulkStaffId
                                      ? 'Individual reassignments are disabled while Bulk Reassign is active'
                                      : ''
                                  }
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
                )}

                {/* Infinite scroll sentinel & Loading Indicator */}
                <div
                  ref={sentinelRef}
                  className="py-4 flex flex-col items-center justify-center text-xs text-gray-400"
                >
                  {loadingMore ? (
                    <div className="flex items-center gap-2 text-blue-600 font-medium">
                      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      <span>Loading more assignments...</span>
                    </div>
                  ) : hasMore ? (
                    <button
                      type="button"
                      onClick={fetchNextPage}
                      className="px-4 py-1.5 text-xs text-blue-600 hover:bg-blue-50 rounded-lg font-medium transition-colors"
                    >
                      Load More ({assignments.length} of {currentStageCount})
                    </button>
                  ) : assignments.length > 0 ? (
                    <span className="text-gray-400">
                      All {currentStageCount}{' '}
                      {isSales
                        ? salesStage === 'leads'
                          ? 'leads'
                          : 'clients'
                        : 'assignments'}{' '}
                      loaded
                    </span>
                  ) : null}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
          <div className="text-xs text-gray-500">
            {isSales ? (
              clientsCount > 0 || leadsCount > 0 ? (
                <span>
                  Reassign all Stage 1 Clients (
                  <strong className="text-amber-700">{clientsCount}</strong>)
                  and Stage 2 Leads (
                  <strong className="text-indigo-700">{leadsCount}</strong>) to
                  proceed with {actionType}.
                </span>
              ) : (
                <span className="text-emerald-600 font-medium">
                  Ready to {actionType}
                </span>
              )
            ) : totalCount > 0 ? (
              <span>
                Reassign all{' '}
                <strong className="text-gray-800">{totalCount}</strong>{' '}
                client(s) to proceed with {actionType}.
              </span>
            ) : (
              <span className="text-emerald-600 font-medium">
                Ready to {actionType}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 hover:bg-gray-100 text-gray-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
