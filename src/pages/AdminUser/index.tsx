import SmartTable from '../../components/common/table/SmartTable'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'

import { TableColumns } from '../../common/types'
import InfoBox from '../../components/app/alertBox/infoBox'
import ResetPassword from '../../components/app/resetPassword'
import { DialogModal, TextField } from '../../components/common'
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
  // freezeUser,
  // unfreezeUser,
} from './api'
import { getColumns } from './columns'
import CreateAdmin from './create'
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

const getSuccessMessage = (response: any, fallback: string) =>
  response?.message || response?.data?.message || fallback

export default function AdminUser() {
  const navigate = useNavigate()
  const loginRole = useAuthStore((s) => s.roleData?.name?.toLowerCase?.())
  const location = useLocation()
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
  const [activePlanWarningOpen, setActivePlanWarningOpen] = useState(false)
  const [pendingStatusChange, setPendingStatusChange] = useState<{
    id: string
    username: string
    status: string
  } | null>(null)

  const params = useParams()
  const [activeRole, setActiveRole] = useState<UserRole>('user')

  const { pageParams, setPageParams, selectedRows, setSelectedRows } =
    useAdminUserFilterStore()
  const { page, page_size, search, ordering, filters } = pageParams
  const searchParams = {
    page: page,
    per_page: page_size,
    search: search,
    ordering: ordering,
    ...filters,
  }
  useEffect(() => {
    const path = location.pathname || ''
    const role = (
      [
        'nutritionist',
        'physiotherapist',
        'yogist',
        'sales',
        'marketing',
        'inactive-user',
        'user',
      ] as UserRole[]
    ).find((key) => path.startsWith(ROLE_PATHS[key]))
    setActiveRole(role || 'user')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname])

  // Reset pagination when route/section changes so we always start from page 1
  useEffect(() => {
    setPageParams({
      ...pageParams,
      page: 1,
      search: '',
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, setPageParams])

  const { data, refetch, isFetching } = useAdminUser(searchParams)
  useEffect(() => {
    const latestParams = useAdminUserFilterStore.getState().pageParams
    if (latestParams?.search) {
      setPageParams({ ...latestParams, search: '', page: 1 })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  useEffect(() => {
    if (pageParams?.search) {
      setPageParams({ ...pageParams, search: '', page: 1 })
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
          navigate(`${base}/${row?.id}`)
        },
        activeRole,
      })
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRole])

  // If logged-in role is nutritionist, ensure the tab stays on 'user'
  useEffect(() => {
    if (loginRole === 'nutritionist' && activeRole !== 'user') {
      setActiveRole('user')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loginRole])

  // Ensure role filter follows active tab
  useEffect(() => {
    const nextFilters: Record<string, any> = {
      ...(pageParams?.filters || {}),
      role: activeRole,
    }
    if (nextFilters.status) {
      delete nextFilters.status
    }
    setStatusFilter('all')
    setPageParams({
      ...pageParams,
      filters: nextFilters,
      search: '',
      page: 1,
    })
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

  const handleDeleteModel = (
    id: string,
    username: string,
    status: string,
    hasActivePlan?: boolean
  ) => {
    const normalizedStatus = String(status || '').toLowerCase()
    if (normalizedStatus !== 'active') {
      handleDeleteAdmin({ id, status })
      return
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

  const handleOpenDeleteUser = (id: string) => {
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
                <div className="flex gap-4 border-b">
                  <button
                    type="button"
                    className={
                      'px-3 py-2 -mb-px ' +
                      (activeRole === 'user'
                        ? 'border-b-2 border-blue-600 text-blue-600'
                        : 'text-gray-600')
                    }
                    onClick={() => navigate('/users')}
                  >
                    Client
                  </button>
                  <button
                    type="button"
                    className={'px-3 py-2 -mb-px text-gray-600'}
                    onClick={() => navigate('/admin/inactive-users')}
                  >
                    Inactive Clients
                  </button>
                </div>
              ) : (
                <div />
              )}

              {loginRole !== 'nutritionist' &&
                checkPermissions('Employee', 'create') && (
                  <Button
                    className="bg-primaryGreen mt-4"
                    label={'Create ' + ROLE_LABELS[activeRole]}
                    icon={'plus'}
                    onClick={openDrawer}
                  />
                )}
            </div>
          </div>
          {/* <PageTitle data={data?.total} isLoading={isFetching} /> */}
          <div className=" p-4">
            <div>
              <SmartTable
                data={data?.items ?? []}
                dataRowKey="id"
                toolbarExtra={
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-gray-600">Status</label>
                    <select
                      className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white shadow-sm focus:outline-none focus:ring-0 focus:border-gray-200 w-40"
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
                    toolTip: 'View Details',
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
                        !!rowData?.subscribed_plan
                      ),
                    icon: <Icons name="deactivate-icon" />,
                    toolTip: 'Deactivate',
                    disabled: (rowData: any) =>
                      String(rowData?.status).toLowerCase() !== 'active',
                    variant: 'danger',
                  },
                  {
                    title: 'Activate',
                    action: (rowData) =>
                      handleDeleteModel(
                        rowData?.id,
                        rowData?.email,
                        rowData?.status,
                        !!rowData?.subscribed_plan
                      ),
                    icon: <Icons name="activate-icon" />,
                    toolTip: 'Activate',
                    disabled: (rowData: any) =>
                      String(rowData?.status).toLowerCase() === 'active',
                    variant: 'success',
                  },
                  {
                    title: 'Delete',
                    action: (rowData) => handleOpenDeleteUser(rowData?.id),
                    icon: <Icons name="delete" />,
                    toolTip: 'Delete',
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
