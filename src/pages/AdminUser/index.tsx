import SmartTable from '../../components/common/table/SmartTable'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'

import { TableColumns } from '../../common/types'
import InfoBox from '../../components/app/alertBox/infoBox'
import ResetPassword from '../../components/app/resetPassword'
import { DialogModal, TabContainer, TextField } from '../../components/common'
import Button from '../../components/common/buttons/Button'
// import FreezeUserModal from '../../components/common/modal/FreezeUserModal'
import ConfirmDeleteModal from '../../components/common/modal/ConfirmDeleteModal'
import Icons from '../../components/common/icons'
import ListingHeader from '../../components/common/ListingTiles'
import { useSnackbarManager } from '../../components/common/snackbar'
import { checkPermissions } from '../../layout/store'
import { useAdminUserFilterStore } from '../../store/filterSore/adminUserStore'
import { calcWindowHeight } from '../../utilities/calcHeight'
import { getSortedColumnName } from '../../utilities/parsers'
import { handleReturnEmptyMsg } from '../../utilities/validation'
import {
  activateAdmin,
  deActivateAdmin,
  getAdminDetails,
  sendAdminInvitation,
  useAdminUser,
  DISABLE_NONLOGIN_APIS,
  deleteAdmin,
  getStaffActiveAssignments,
  useUsersFilterOptions,
  // freezeUser,
  // unfreezeUser,
} from './api'
import { getColumns } from './columns'
import CreateAdmin from './create'
import AssignSalesModal from './AssignSalesModal'
import StaffAssignmentsModal from './StaffAssignmentsModal'
import UserAdvancedFilterDrawer, {
  FilterState,
} from './UserAdvancedFilterDrawer'
import { useAuthStore } from '../../store/authStore'

type StatusFilterValue = 'all' | 'active' | 'deactivated'
type UserRole =
  | 'user'
  | 'nutritionist'
  | 'physiotherapist'
  | 'yogist'
  | 'sales'
  | 'marketing'
  | 'inactive-user'
const ROLE_PATHS: Record<UserRole, string> = {
  user: '/users',
  nutritionist: '/users/nutritionist',
  physiotherapist: '/users/physiotherapist',
  yogist: '/users/yogist',
  sales: '/users/sales',
  marketing: '/users/marketing',
  'inactive-user': '/admin/inactive-users',
}
const ROLE_LABELS: Record<UserRole, string> = {
  user: 'Client',
  nutritionist: 'Nutritionist',
  physiotherapist: 'Physiotherapist',
  yogist: 'Yogist',
  sales: 'Sales',
  marketing: 'Marketing',
  'inactive-user': 'Inactive Users',
}
const ROLE_HEADER_LABELS: Record<UserRole, string> = {
  user: 'Clients',
  nutritionist: 'Nutritionists',
  physiotherapist: 'Physiotherapists',
  yogist: 'Yogists',
  sales: 'Sales',
  marketing: 'Marketing',
  'inactive-user': 'Inactive Clients',
}
const getRoleFromPath = (path: string): UserRole => {
  const matchedRole = (
    [
      'nutritionist',
      'physiotherapist',
      'yogist',
      'sales',
      'marketing',
    ] as UserRole[]
  ).find(
    (role) =>
      path === ROLE_PATHS[role] || path.startsWith(ROLE_PATHS[role] + '/')
  )
  return matchedRole || 'user'
}

const getSuccessMessage = (response: any, fallback: string) =>
  response?.message || response?.data?.message || fallback

export default function AdminUser() {
  const navigate = useNavigate()
  const loginRole = useAuthStore((s) => s.roleData?.name?.toLowerCase?.())
  const isYogist =
    loginRole === 'yogist' ||
    loginRole === 'yoga_trainer' ||
    loginRole === 'yoga'
  const isServiceStaffLogin = [
    'nutritionist',
    'physiotherapist',
    'yogist',
  ].includes(loginRole || '')
  const location = useLocation()
  const queryParams = new URLSearchParams(location.search)
  const isExplicitClientsTab = queryParams.get('tab') === 'clients'

  useEffect(() => {
    if (
      isServiceStaffLogin &&
      location.pathname === '/users' &&
      !isExplicitClientsTab &&
      loginRole
    ) {
      navigate(`/users/${loginRole}/assigned-clients`, { replace: true })
    }
  }, [
    isServiceStaffLogin,
    location.pathname,
    isExplicitClientsTab,
    loginRole,
    navigate,
  ])
  const [columns, setColumns] = useState<TableColumns[]>([])
  const { enqueueSnackbar } = useSnackbarManager()
  const [deleteItem, setDeleteItem] = useState('')
  const [status, setStatus] = useState('')
  const [deleteModal, setDeleteModal] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [viewMode, setViewMode] = useState(false)
  const [edit, setEdit] = useState(false)
  const [rowData, setRowData] = useState<any>()
  const [changePassword, setChangePassword] = useState(false)
  const [userName, setUserName] = useState('')
  const [userId, setUserId] = useState('')
  const [openConfirm, setOpenConfirm] = useState(false)
  const [deleteUserModal, setDeleteUserModal] = useState(false)
  const [deleteUserId, setDeleteUserId] = useState<string>('')
  const [editViewIndicator, setEditViewIndicator] = useState(false)
  const [viewIndicator, setViewIndicator] = useState(false)
  const [loader, setloader] = useState(false)
  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>('all')
  const [isAdvancedFilterOpen, setIsAdvancedFilterOpen] = useState(false)
  const [activePlanWarningOpen, setActivePlanWarningOpen] = useState(false)
  const [assignSalesModalUser, setAssignSalesModalUser] = useState<any>(null)
  const [staffAssignmentsModalData, setStaffAssignmentsModalData] = useState<{
    user: any
    actionType: 'deactivate' | 'delete'
  } | null>(null)
  const [pendingStatusChange, setPendingStatusChange] = useState<{
    id: string
    username: string
    status: string
  } | null>(null)

  const params = useParams()
  const activeRole = getRoleFromPath(location.pathname)
  const isClientTab = activeRole === 'user'

  const { pageParams, setPageParams, selectedRows, setSelectedRows } =
    useAdminUserFilterStore()
  const { page, page_size, search, ordering, filters } = pageParams

  // Advanced filters apply only for clients tab; other user tabs only receive status filter
  const effectiveFilters = isClientTab
    ? filters
    : filters?.status
      ? { status: filters.status }
      : {}

  const searchParams = {
    page: page,
    per_page: page_size,
    search: search,
    ordering: ordering,
    ...effectiveFilters,
    role: activeRole,
  }

  // Clear advanced filters and reset pagination whenever route/tab switches
  useEffect(() => {
    setStatusFilter('all')
    setIsAdvancedFilterOpen(false)
    setPageParams({
      ...pageParams,
      filters: { role: activeRole },
      page: 1,
      search: '',
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, activeRole])

  // Clear advanced filters on unmount so they do not leak to any other screens
  useEffect(() => {
    return () => {
      const storeState = useAdminUserFilterStore.getState()
      storeState.setPageParams({
        ...storeState.pageParams,
        filters: { role: 'user' },
        search: '',
        page: 1,
      })
    }
  }, [])

  const { data, refetch, isFetching } = useAdminUser(searchParams)
  const { data: filterOptionsData } = useUsersFilterOptions(
    activeRole === 'user'
  )

  useEffect(() => {
    const latestParams = useAdminUserFilterStore.getState().pageParams
    if (latestParams?.search) {
      setPageParams({ ...latestParams, search: '', page: 1 })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onChangePage = (row: number) => {
    setPageParams({
      ...pageParams,
      page: row,
    })
  }

  const onChangeRowsPerPage = (count: number | string) => {
    setPageParams({
      ...pageParams,
      page_size: count,
      page: 1,
    })
  }

  const onViewAction = async (row: any) => {
    setViewIndicator(true)
    if (row?.id) {
      const data = await getAdminDetails(row?.id)
      setRowData(data)
      setViewMode(true)
      setCreateOpen(true)
    }
  }

  useEffect(() => {
    setColumns(
      getColumns({
        onViewAction: onViewAction,
        onNameClick: (row: any) => {
          const base = ROLE_PATHS[activeRole]
          const suffix =
            loginRole === 'superadmin' && activeRole === 'user'
              ? '/subscriptions'
              : ''
          navigate(`${base}/${row?.id}${suffix}`, {
            state: { from: `${location.pathname}${location.search}` },
          })
        },
        activeRole,
      })
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRole])

  const handleSeach = (key?: string) => {
    setPageParams({
      ...pageParams,
      search: key as string,
      page: 1,
    })
  }

  const syncStatusFromParams = useCallback(
    (nextFilters?: Record<string, any>) => {
      const currentStatus = (
        nextFilters?.status as string | undefined
      )?.toLowerCase?.()
      if (currentStatus === 'active' || currentStatus === 'deactivated') {
        setStatusFilter(currentStatus)
      } else {
        setStatusFilter('all')
      }
    },
    []
  )

  useEffect(() => {
    syncStatusFromParams(pageParams?.filters)
  }, [pageParams?.filters, syncStatusFromParams])

  const handleStatusChange = (value: StatusFilterValue) => {
    setStatusFilter(value)
    const nextFilters = {
      ...(pageParams?.filters || {}),
      status: value === 'all' ? undefined : value,
    }

    if (!nextFilters.status) {
      delete nextFilters.status
    }

    setPageParams({
      ...pageParams,
      filters: nextFilters,
      page: 1,
    })
  }

  const activeFilterCount = useMemo(() => {
    if (activeRole !== 'user') return 0
    const ignoredKeys = ['role', 'page', 'page_size', 'ordering', 'search']
    return Object.keys(pageParams?.filters || {}).filter((k) => {
      if (ignoredKeys.includes(k)) return false
      const val = pageParams?.filters?.[k]
      return val !== undefined && val !== null && val !== '' && val !== 'all'
    }).length
  }, [pageParams?.filters, activeRole])

  const handleApplyAdvancedFilters = (newFilters: FilterState) => {
    const nextFilters = {
      ...newFilters,
      role: activeRole,
    }
    setPageParams({
      ...pageParams,
      filters: nextFilters,
      page: 1,
    })
    if (newFilters.status) {
      setStatusFilter(newFilters.status as StatusFilterValue)
    } else {
      setStatusFilter('all')
    }
  }

  const handleResetAdvancedFilters = () => {
    setPageParams({
      ...pageParams,
      filters: { role: activeRole },
      page: 1,
    })
    setStatusFilter('all')
  }

  const handleRemoveSingleFilter = (key: string) => {
    const updatedFilters = { ...(pageParams?.filters || {}) }
    delete updatedFilters[key]
    setPageParams({
      ...pageParams,
      filters: updatedFilters,
      page: 1,
    })
    if (key === 'status') {
      setStatusFilter('all')
    }
  }

  const getFilterChipLabel = (key: string, value: any) => {
    const rawOptions =
      (filterOptionsData as any)?.data || filterOptionsData || {}
    switch (key) {
      case 'gender': {
        const map: Record<string, string> = {
          male: 'Male',
          female: 'Female',
          other: 'Other',
        }
        return `Gender: ${map[String(value).toLowerCase()] || value}`
      }
      case 'language':
        return `Language: ${value}`
      case 'country':
        return `Country: ${value}`
      case 'state':
        return `State: ${value}`
      case 'occupation':
        return `Occupation: ${value}`
      case 'work_schedule':
        return `Schedule: ${value}`
      case 'age_min':
        return `Min Age: ${value}`
      case 'age_max':
        return `Max Age: ${value}`
      case 'dob_from':
        return `DOB From: ${value}`
      case 'dob_to':
        return `DOB To: ${value}`
      case 'bmi_min':
        return `Min BMI: ${value}`
      case 'bmi_max':
        return `Max BMI: ${value}`
      case 'plan_id': {
        const found = rawOptions?.plans?.find(
          (p: any) => String(p.id) === String(value)
        )
        return `Plan: ${found?.name || `#${value}`}`
      }
      case 'has_subscription': {
        const map: Record<string, string> = {
          active: 'Has Active Plan',
          none: 'No Active Plan',
          expired: 'Expired Plan',
        }
        return `Subscription: ${map[String(value).toLowerCase()] || value}`
      }
      case 'subscription_status': {
        const map: Record<string, string> = {
          active: 'Active',
          paused: 'Paused',
          expired: 'Expired',
          cancelled: 'Cancelled',
          pending: 'Pending',
        }
        return `Plan Status: ${map[String(value).toLowerCase()] || value}`
      }
      case 'plan_start_from':
        return `Plan Started From: ${value}`
      case 'plan_start_to':
        return `Plan Started To: ${value}`
      case 'plan_end_from':
        return `Plan Expires From: ${value}`
      case 'plan_end_to':
        return `Plan Expires To: ${value}`
      case 'sales_rep_id': {
        if (String(value) === 'unassigned') return 'Sales Rep: Unassigned'
        const found = rawOptions?.sales_reps?.find(
          (u: any) => String(u.id) === String(value)
        )
        const name = found?.name
          ? found.name.charAt(0).toUpperCase() + found.name.slice(1)
          : null
        return `Sales Rep: ${name || `Assigned`}`
      }
      case 'nutritionist_id': {
        if (String(value) === 'unassigned') return 'Nutritionist: Unassigned'
        const found = rawOptions?.nutritionists?.find(
          (u: any) => String(u.id) === String(value)
        )
        const name = found?.name
          ? found.name.charAt(0).toUpperCase() + found.name.slice(1)
          : null
        return `Nutritionist: ${name || `Assigned`}`
      }
      case 'physiotherapist_id': {
        if (String(value) === 'unassigned') return 'Physio: Unassigned'
        const found = rawOptions?.physiotherapists?.find(
          (u: any) => String(u.id) === String(value)
        )
        const name = found?.name
          ? found.name.charAt(0).toUpperCase() + found.name.slice(1)
          : null
        return `Physio: ${name || `Assigned`}`
      }
      case 'yogist_id': {
        if (String(value) === 'unassigned') return 'Yogist: Unassigned'
        const found = rawOptions?.yogists?.find(
          (u: any) => String(u.id) === String(value)
        )
        const name = found?.name
          ? found.name.charAt(0).toUpperCase() + found.name.slice(1)
          : null
        return `Yogist: ${name || `Assigned`}`
      }
      case 'food_preferences':
        return `Diet: ${value}`
      case 'food_allergies':
        return `Allergy: ${value}`
      case 'medical_conditions':
        return `Condition: ${value}`
      case 'lifestyle': {
        const map: Record<string, string> = {
          sedentary: 'Sedentary',
          lightly_active: 'Lightly Active',
          moderately_active: 'Moderately Active',
          very_active: 'Very Active',
          extremely_active: 'Extremely Active',
        }
        return `Lifestyle: ${map[String(value).toLowerCase()] || value}`
      }
      case 'goal':
        return `Goal: ${value}`
      case 'registration_source': {
        const map: Record<string, string> = {
          self_registered: 'Self Registered',
          superadmin_created: 'Admin Created',
          lead_conversion: 'Lead Conversion',
        }
        return `Source: ${map[String(value).toLowerCase()] || value}`
      }
      case 'campaign_id': {
        const found = rawOptions?.campaigns?.find(
          (c: any) => String(c.id) === String(value)
        )
        return `Campaign: ${found?.name || `#${value}`}`
      }
      case 'registered_from':
        return `Registered From: ${value}`
      case 'registered_to':
        return `Registered To: ${value}`
      case 'status':
        return `Status: ${String(value).charAt(0).toUpperCase() + String(value).slice(1)}`
      default:
        return `${key}: ${value}`
    }
  }

  const handleDeleteModel = async (
    id: string,
    username: string,
    status: string,
    hasActivePlan?: boolean,
    fullRow?: any
  ) => {
    const normalizedStatus = String(status || '').toLowerCase()
    if (normalizedStatus !== 'active') {
      handleDeleteAdmin({ id, status })
      return
    }

    const rowUser = fullRow || { id, email: username, status, role: activeRole }
    const roleStr = String(rowUser?.role || activeRole || '').toLowerCase()
    const isStaffWithAssignments = [
      'nutritionist',
      'physiotherapist',
      'yogist',
      'sales',
    ].includes(roleStr)

    if (isStaffWithAssignments) {
      setloader(true)
      try {
        const assignmentsRes: any = await getStaffActiveAssignments(id)
        setloader(false)
        if (assignmentsRes?.has_active_assignments) {
          setStaffAssignmentsModalData({
            user: { ...rowUser, name: rowUser.name || username },
            actionType: 'deactivate',
          })
          return
        }
      } catch (err: any) {
        setloader(false)
      }
    }

    if (normalizedStatus === 'active' && hasActivePlan) {
      setPendingStatusChange({ id, username, status })
      setActivePlanWarningOpen(true)
      return
    }
    handleDeleteAdmin({ id, status })
  }

  const confirmActivePlanWarning = () => {
    if (pendingStatusChange) {
      handleDeleteAdmin({
        id: pendingStatusChange.id,
        status: pendingStatusChange.status,
      })
    }
    setActivePlanWarningOpen(false)
    setPendingStatusChange(null)
  }

  const cancelActivePlanWarning = () => {
    setActivePlanWarningOpen(false)
    setPendingStatusChange(null)
  }

  const handleSendInvitation = () => {
    setloader(true)
    sendAdminInvitation(deleteItem ?? '')
      .then((res) => {
        enqueueSnackbar(
          res.message ? res.message : 'Invitation Send Successfully',
          {
            variant: 'success',
          }
        )
        setloader(false)
        refetch()
        setOpenConfirm(false)

        setSelectedRows(
          selectedRows?.filter((sel: any) => sel !== deleteItem) || []
        )
      })
      .catch((err: any) => {
        setloader(false)
        enqueueSnackbar(
          err?.response?.data?.error?.message || err?.response?.data?.message,
          { variant: 'error' }
        )
      })
  }

  const handleDeleteAdmin = (override?: { id: string; status: string }) => {
    const targetId = override?.id ?? deleteItem
    const targetStatus = override?.status ?? status
    if (!targetId) return
    setloader(true)
    const normalizedStatus = String(targetStatus || '').toLowerCase()
    const actionPromise =
      normalizedStatus === 'active'
        ? deActivateAdmin(targetId)
        : activateAdmin(targetId)
    actionPromise
      .then((res) => {
        enqueueSnackbar(
          res.message ? res.message : 'Status Updated successfully',
          {
            variant: 'success',
          }
        )
        setloader(false)
        refetch()
        setSelectedRows(
          selectedRows?.filter((sel: string | number) => sel !== targetId) || []
        )
        setDeleteModal(false)
        if (!override) {
          setDeleteItem('')
        }
        setStatus(targetStatus)
      })
      .catch((err) => {
        setloader(false)
        enqueueSnackbar(
          err?.response?.data?.error?.message || err?.response?.data?.message,
          { variant: 'error' }
        )
      })
  }
  const handleEdit = async (rowData: any) => {
    if (rowData?.id) {
      const data = await getAdminDetails(rowData?.id)
      setRowData(data)
      setCreateOpen(true)
      setViewMode(false)
      setEdit(true)
    }
  }
  const handleClose = () => {
    setCreateOpen(false)
    setViewMode(false)
    setEdit(false)
    if (viewIndicator && editViewIndicator) {
      setViewIndicator(false)
      setEditViewIndicator(false)
      onViewAction(rowData)
    }
  }

  const handleRefresh = () => {
    refetch()
  }
  const basicData = {
    title: ROLE_HEADER_LABELS[activeRole],
    icon: 'user',
  }
  const openDrawer = () => {
    setCreateOpen(true)
    setRowData({})
  }
  const headerProps = { actionTitle: 'Create ' + ROLE_LABELS[activeRole] }
  const handleSort = (orderColumn: any, orderDirection: any) => {
    setPageParams({
      ...pageParams,
      sortColumn: orderColumn,
      sortType: orderDirection,
      ordering: getSortedColumnName(orderColumn, orderDirection),
    })
  }

  const handleOpenDeleteUser = async (id: string, fullRow?: any) => {
    const rowUser = fullRow ||
      data?.items?.find((item: any) => String(item.id) === String(id)) || {
        id,
        role: activeRole,
      }
    const roleStr = String(rowUser?.role || activeRole || '').toLowerCase()
    const isStaffWithAssignments = [
      'nutritionist',
      'physiotherapist',
      'yogist',
      'sales',
    ].includes(roleStr)

    if (isStaffWithAssignments) {
      setloader(true)
      try {
        const assignmentsRes: any = await getStaffActiveAssignments(id)
        setloader(false)
        if (assignmentsRes?.has_active_assignments) {
          setStaffAssignmentsModalData({
            user: rowUser,
            actionType: 'delete',
          })
          return
        }
      } catch (err: any) {
        setloader(false)
      }
    }

    setDeleteUserId(id)
    setDeleteUserModal(true)
  }
  const handleDeleteUser = () => {
    setloader(true)
    deleteAdmin(deleteUserId)
      .then((res) => {
        enqueueSnackbar(getSuccessMessage(res, 'User deleted successfully'), {
          variant: 'success',
        })
        setloader(false)
        setDeleteUserModal(false)
        refetch()
      })
      .catch((err) => {
        setloader(false)
        enqueueSnackbar(
          err?.response?.data?.error?.message || err?.response?.data?.message,
          { variant: 'error' }
        )
      })
  }
  return (
    <div>
      {DISABLE_NONLOGIN_APIS ? (
        <div className="p-6">
          <InfoBox content={'This section is disabled for this build.'} />
        </div>
      ) : (
        <>
          <ListingHeader
            data={basicData}
            actionProps={headerProps}
            checkPermission={checkPermissions('Employee', 'create')}
          />
          {/* Clients keep the Client / Inactive Clients tabs; other roles are standalone pages. */}
          <div className="px-4">
            <div className="flex items-center justify-between">
              {activeRole === 'user' ? (
                <TabContainer
                  data={
                    isServiceStaffLogin
                      ? [
                          { id: 'clients', label: 'Accepted Clients' },
                          { id: 'assigned-clients', label: 'Assigned Clients' },
                          { id: 'inactive-clients', label: 'Inactive Clients' },
                        ]
                      : [
                          { id: 'clients', label: 'Client' },
                          { id: 'inactive-clients', label: 'Inactive Clients' },
                        ]
                  }
                  action={
                    loginRole === 'superadmin' &&
                    checkPermissions('Employee', 'create') ? (
                      <Button
                        className="bg-primaryGreen whitespace-nowrap px-3"
                        label={'Create ' + ROLE_LABELS[activeRole]}
                        icon={'plus'}
                        onClick={openDrawer}
                      />
                    ) : null
                  }
                  activeTab={isExplicitClientsTab ? 'clients' : 'clients'}
                  onClick={(tab) =>
                    navigate(
                      tab.id === 'clients'
                        ? '/users?tab=clients'
                        : tab.id === 'inactive-clients'
                          ? '/admin/inactive-users'
                          : '/users/' + loginRole + '/assigned-clients'
                    )
                  }
                >
                  {null}
                </TabContainer>
              ) : (
                <div />
              )}

              {activeRole !== 'user' &&
                loginRole === 'superadmin' &&
                checkPermissions('Employee', 'create') && (
                  <div className="mt-4 flex-shrink-0">
                    <Button
                      className="bg-primaryGreen whitespace-nowrap px-3"
                      label={'Create ' + ROLE_LABELS[activeRole]}
                      icon={'plus'}
                      onClick={openDrawer}
                    />
                  </div>
                )}
            </div>
          </div>
          {/* <PageTitle data={data?.total} isLoading={isFetching} /> */}
          <div className=" p-4">
            <div>
              {activeFilterCount > 0 && activeRole === 'user' && (
                <div className="mb-3.5 p-3 rounded-xl bg-gradient-to-r from-emerald-50/90 via-teal-50/70 to-emerald-50/90 border border-emerald-200/80 flex items-center justify-between gap-3 flex-wrap animate-fadeIn shadow-xs">
                  <div className="flex items-center gap-2 flex-wrap text-xs">
                    <span className="font-bold text-emerald-950 flex items-center gap-1.5 mr-1">
                      <svg
                        className="w-4 h-4 text-emerald-700"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                        />
                      </svg>
                      Applied Filters ({activeFilterCount}):
                    </span>
                    {Object.entries(pageParams?.filters || {})
                      .filter(
                        ([k, v]) =>
                          ![
                            'role',
                            'page',
                            'page_size',
                            'ordering',
                            'search',
                          ].includes(k) &&
                          v !== undefined &&
                          v !== null &&
                          v !== '' &&
                          v !== 'all'
                      )
                      .map(([k, v]) => (
                        <span
                          key={k}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-emerald-200 text-emerald-900 font-medium text-xs shadow-2xs hover:border-emerald-300 transition-colors"
                        >
                          <span>{getFilterChipLabel(k, v)}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveSingleFilter(k)}
                            className="p-0.5 rounded-full hover:bg-emerald-100 text-gray-400 hover:text-emerald-800 transition-colors"
                            title="Remove filter"
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
                        </span>
                      ))}
                  </div>

                  <button
                    type="button"
                    onClick={handleResetAdvancedFilters}
                    className="text-xs font-bold text-emerald-800 hover:text-red-600 underline transition-colors whitespace-nowrap ml-auto"
                  >
                    Clear All Filters
                  </button>
                </div>
              )}

              <SmartTable
                data={data?.items ?? []}
                dataRowKey="id"
                toolbarExtra={
                  <div className="flex items-end gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-gray-600">Status</label>
                      <select
                        className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white shadow-sm focus:outline-none focus:ring-0 focus:border-gray-200 w-36"
                        value={statusFilter}
                        onChange={(event) =>
                          handleStatusChange(
                            event.target.value as StatusFilterValue
                          )
                        }
                      >
                        <option value="all">All</option>
                        <option value="active">Active</option>
                        <option value="deactivated">Deactivated</option>
                      </select>
                    </div>

                    {/* {['superadmin', 'admin'].includes(loginRole || '') &&
                      activeRole === 'user' && (
                        <div className="flex flex-col gap-1">
                          <label className="text-xs text-transparent select-none">
                            Filters
                          </label>
                          <button
                            type="button"
                            onClick={() => setIsAdvancedFilterOpen(true)}
                            className={`flex items-center gap-2 px-3.5 py-2.5 text-sm font-semibold rounded-lg border transition-all shadow-sm h-[42px] cursor-pointer ${
                              activeFilterCount > 0
                                ? 'bg-emerald-50 border-emerald-400 text-emerald-900 hover:bg-emerald-100 hover:border-emerald-500 ring-2 ring-emerald-100'
                                : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300'
                            }`}
                          >
                            <svg
                              className={`w-4 h-4 ${
                                activeFilterCount > 0
                                  ? 'text-emerald-600'
                                  : 'text-gray-500'
                              }`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                              />
                            </svg>
                            <span className="whitespace-nowrap">
                              Advanced Filters
                            </span>
                            {activeFilterCount > 0 && (
                              <span className="px-1.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-600 text-white leading-none">
                                {activeFilterCount}
                              </span>
                            )}
                          </button>
                        </div>
                      )} */}
                  </div>
                }
                search={true}
                searchPlaceholder={
                  activeRole === 'user'
                    ? 'Search Client Name'
                    : 'Search ' + ROLE_LABELS[activeRole] + ' Name'
                }
                height={
                  data?.items?.length === 0
                    ? calcWindowHeight(218)
                    : calcWindowHeight(200)
                }
                isLoading={isFetching}
                sortType={pageParams.sortType}
                sortColumn={pageParams.sortColumn}
                handleColumnSort={handleSort}
                emptyTitle="No records to display"
                emptySubTitle={handleReturnEmptyMsg(search)}
                columns={columns}
                pagination={true}
                paginationProps={{
                  onPagination: onChangePage,
                  total: data?.total ?? 0,
                  currentPage: data?.current_page ?? pageParams?.page ?? 1,
                  rowsPerPage: Number(pageParams?.page_size ?? 10),
                  onRowsPerPage: onChangeRowsPerPage,
                  dropOptions: [10, 20, 30, 50, 100],
                }}
                actionProps={[
                  {
                    icon: <Icons name="eye" />,
                    action: (row) => {
                      const base = ROLE_PATHS[activeRole]
                      navigate(`${base}/${row?.id}`)
                    },
                    title: 'View',
                    toolTip: 'View',
                  },
                  {
                    icon: <Icons name="edit" />,
                    action: (row) => handleEdit(row),
                    title: 'Edit',
                    toolTip: 'Edit',
                  },
                  {
                    title: 'Deactivate',
                    action: (rowData) =>
                      handleDeleteModel(
                        rowData?.id,
                        rowData?.email,
                        rowData?.status,
                        !!rowData?.subscribed_plan,
                        rowData
                      ),
                    icon: <Icons name="deactivate-icon" />,
                    toolTip: 'Deactivate',
                    disabled: (rowData: any) =>
                      String(rowData?.status).toLowerCase() !== 'active',
                    variant: 'danger',
                    hide: () => isYogist,
                  },
                  {
                    title: 'Activate',
                    action: (rowData) =>
                      handleDeleteModel(
                        rowData?.id,
                        rowData?.email,
                        rowData?.status,
                        !!rowData?.subscribed_plan,
                        rowData
                      ),
                    icon: <Icons name="activate-icon" />,
                    toolTip: 'Activate',
                    disabled: (rowData: any) =>
                      String(rowData?.status).toLowerCase() === 'active',
                    variant: 'success',
                    hide: () => isYogist,
                  },
                  ...(activeRole === 'user' &&
                  ['superadmin', 'admin'].includes(loginRole || '')
                    ? [
                        {
                          title: 'Assign Sales',
                          action: (rowData: any) =>
                            setAssignSalesModalUser(rowData),
                          icon: <Icons name="user" />,
                          toolTip: 'Assign Sales Representative',
                        },
                      ]
                    : []),
                  {
                    title: 'Delete',
                    action: (rowData) =>
                      handleOpenDeleteUser(rowData?.id, rowData),
                    icon: <Icons name="delete" />,
                    toolTip: 'Delete',
                    hide: () =>
                      ['nutritionist', 'yogist', 'physiotherapist'].includes(
                        loginRole || ''
                      ),
                  },
                ]}
                searchValue={pageParams?.search}
                onSearchChange={(val: string) =>
                  setPageParams({ ...pageParams, search: val })
                }
                onSearch={(key?: string) => handleSeach(key)}
                columnToggle
                externalActions={true}
              />
            </div>
          </div>

          <AssignSalesModal
            isOpen={Boolean(assignSalesModalUser)}
            onClose={() => setAssignSalesModalUser(null)}
            user={assignSalesModalUser}
            onSuccess={() => refetch()}
          />

          <UserAdvancedFilterDrawer
            isOpen={isAdvancedFilterOpen}
            onClose={() => setIsAdvancedFilterOpen(false)}
            appliedFilters={pageParams?.filters || {}}
            onApplyFilters={handleApplyAdvancedFilters}
            onResetFilters={handleResetAdvancedFilters}
          />

          <StaffAssignmentsModal
            isOpen={Boolean(staffAssignmentsModalData)}
            onClose={() => setStaffAssignmentsModalData(null)}
            staffUser={staffAssignmentsModalData?.user}
            actionType={staffAssignmentsModalData?.actionType || 'deactivate'}
            onProceed={() => {
              const pending = staffAssignmentsModalData
              setStaffAssignmentsModalData(null)
              if (!pending?.user?.id) return
              if (pending.actionType === 'deactivate') {
                handleDeleteAdmin({ id: pending.user.id, status: 'active' })
              } else if (pending.actionType === 'delete') {
                setDeleteUserId(pending.user.id)
                setDeleteUserModal(true)
              }
            }}
          />

          <ConfirmDeleteModal
            isOpen={activePlanWarningOpen}
            onClose={cancelActivePlanWarning}
            onConfirm={confirmActivePlanWarning}
            title="Deactivate this user?"
            subTitle="This user currently has an active plan. Are you sure you want to continue with deactivation?"
            confirmLabel="Yes, Continue"
            cancelLabel="No"
          />
          <DialogModal
            isOpen={deleteModal}
            onClose={() => setDeleteModal(false)}
            // title={'Delete Admin User'}
            title={
              status == 'Active'
                ? 'Deactivate Admin User'
                : 'Activate Admin User'
            }
            onSubmit={() => handleDeleteAdmin()}
            secondaryAction={() => setDeleteModal(false)}
            secondaryActionLabel="Cancel"
            actionLabel={status == 'Active' ? 'Deactivate' : 'Activate'}
            actionLoader={loader}
            className="z-50"
            body={
              <>
                {/* <InfoBox content={'Are you sure to delete this admin user ?'} /> */}
                <p className="pb-4">
                  {status == 'Active'
                    ? 'Are you sure to deactivate this admin user ?'
                    : 'Are you sure to activate this admin user ?'}
                </p>
                <div className="flex flex-col gap-4">
                  <div className="w-full flex flex-col gap-2">
                    <TextField
                      id="1"
                      name="email"
                      value={userName ?? ''}
                      disabled={true}
                      label={'Admin Email id'}
                    />
                  </div>
                </div>
              </>
            }
          />
          <ConfirmDeleteModal
            isOpen={deleteUserModal}
            onClose={() => setDeleteUserModal(false)}
            onConfirm={() => handleDeleteUser()}
            loading={loader}
            title={'Are you sure?'}
            subTitle={
              'Do you really want to delete this user? This process cannot be undone.'
            }
            confirmLabel="Delete"
            cancelLabel="Cancel"
          />
          <ResetPassword
            changePassword={changePassword}
            setChangePassword={setChangePassword}
            userId={userId}
            setUserId={setUserId}
            from={'Admin'}
            userName={userName}
            setUserName={setUserName}
          />
          <CreateAdmin
            key={`${activeRole}-${edit ? 'edit' : 'create'}-${viewMode ? 'view' : 'form'}`}
            isDrawerOpen={createOpen}
            rowData={rowData}
            edit={edit}
            setViewMode={setViewMode}
            setEdit={setEdit}
            viewMode={viewMode}
            paramsId={params?.id}
            handleClose={handleClose}
            handleRefresh={handleRefresh}
            editViewIndicator={editViewIndicator}
            setEditViewIndicator={setEditViewIndicator}
            activeRole={activeRole}
          />
          <DialogModal
            isOpen={openConfirm}
            onClose={() => setOpenConfirm(false)}
            title={'Send Invitation'}
            onSubmit={() => handleSendInvitation()}
            secondaryAction={() => setOpenConfirm(false)}
            secondaryActionLabel="Cancel"
            actionLabel="Send"
            actionLoader={loader}
            body={
              <InfoBox
                content={'Are you sure you want to send the invitation?'}
              />
            }
          />
        </>
      )}
    </div>
  )
}
