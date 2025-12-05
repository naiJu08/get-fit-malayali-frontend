import SmartTable from '../../components/common/table/SmartTable'
import { useEffect, useState } from 'react'

import { TableColumns } from '../../common/types'
import InfoBox from '../../components/app/alertBox/infoBox'
import ResetPassword from '../../components/app/resetPassword'
import { DialogModal, TextField } from '../../components/common'
import ConfirmDeleteModal from '../../components/common/modal/ConfirmDeleteModal'
// import SearchInput from '../../components/common/inputs/SearchInput'
import Icons from '../../components/common/icons'
import ListingHeader from '../../components/common/ListingTiles'
import { useSnackbarManager } from '../../components/common/snackbar'
import { checkPermissions } from '../../layout/store'
import { useAdminUserFilterStore } from '../../store/filterSore/adminUserStore'
import { useAuthStore } from '../../store/authStore'
import { getSortedColumnName } from '../../utilities/parsers'
import { calcWindowHeight } from '../../utilities/calcHeight'
import { useQueryClient } from '@tanstack/react-query'
import {
  deActivateAdmin,
  getAdminDetails,
  sendAdminInvitation,
  DISABLE_NONLOGIN_APIS,
  usePlans,
  deletePlan,
  useUpdatePlan,
} from './api'
import { getColumns } from './columns'
import CreatePlan from './create'
import { useNavigate, useLocation } from 'react-router-dom'

export default function Plans() {
  const [columns, setColumns] = useState<TableColumns[]>([])
  const { enqueueSnackbar } = useSnackbarManager()
  const roleName = useAuthStore((s) => s.roleData?.name?.toLowerCase?.())
  const isNutritionist = roleName === 'nutritionist'
  const [deleteItem] = useState('')
  const [status] = useState('')
  const [deleteModal, setDeleteModal] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [viewMode, setViewMode] = useState(false)
  const [edit, setEdit] = useState(false)
  const [rowData, setRowData] = useState<any>()
  const [changePassword, setChangePassword] = useState(false)
  const [userName, setUserName] = useState('')
  const [userId, setUserId] = useState('')
  const [openConfirm, setOpenConfirm] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [searchInput, setSearchInput] = useState<string>(
    (useAdminUserFilterStore.getState().pageParams?.search as string) || ''
  )
  const { mutate: updatePlanMutate } = useUpdatePlan()

  const [editViewIndicator, setEditViewIndicator] = useState(false)
  const [viewIndicator, setViewIndicator] = useState(false)
  const [loader, setloader] = useState(false)
  const navigate = useNavigate()
  const [deletePlanModal, setDeletePlanModal] = useState(false)
  const [deletingPlan, setDeletingPlan] = useState(false)
  const [planToDelete, setPlanToDelete] = useState<any>(null)
  const location = useLocation()

  const { pageParams, setPageParams, selectedRows, setSelectedRows } =
    useAdminUserFilterStore()
  useEffect(() => {
    if (pageParams?.search) {
      setPageParams({ ...pageParams, search: '', page: 1 })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Reset pagination when route/section changes so we always start from page 1
  useEffect(() => {
    setPageParams({
      ...pageParams,
      page: 1,
      search: '',
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, setPageParams])
  const { page, per_page, search, ordering } = pageParams
  const searchParams = {
    page,
    per_page: Number(per_page ?? 10),
    search,
    ordering,
    ...(statusFilter !== ''
      ? {
          active: statusFilter === 'true' ? true : false,
        }
      : {}),
  }

  const handleEditPlan = (row: any) => {
    setRowData({ plan: row })
    setEdit(true)
    setViewMode(false)
    setCreateOpen(true)
  }

  const handleDeletePlan = async (row: any) => {
    try {
      setDeletingPlan(true)
      await deletePlan(row?.id)
      enqueueSnackbar('Plan deleted successfully', { variant: 'success' })
      queryClient.invalidateQueries(['plans_list'])
      setDeletePlanModal(false)
      setPlanToDelete(null)
    } catch (err: any) {
      enqueueSnackbar(err?.response?.data?.message || 'Failed to delete plan', {
        variant: 'error',
      })
    } finally {
      setDeletingPlan(false)
    }
  }
  const getPlanId = (row: any) =>
    row?.id ?? row?.plan_id ?? row?._id ?? row?.uuid ?? row?.plan?.id
  const handleToggleStatus = async (row: any) => {
    console.log(row)
    const v = row?.active
    const isActive =
      (typeof v === 'boolean' && v === true) ||
      (typeof v === 'number' && v === 1) ||
      (typeof v === 'string' &&
        (v === '1' ||
          v.toLowerCase() === 'true' ||
          v.toLowerCase() === 'active'))
    const nextActiveFlag = !isActive
    const resolvedId = getPlanId(row)
    if (resolvedId == null) return
    updatePlanMutate({
      id: resolvedId,
      payload: { plan: { active: nextActiveFlag } },
    })
  }
  const { data, isFetching } = usePlans(searchParams)
  const queryClient = useQueryClient()
  // Clamp page to valid range when meta changes
  useEffect(() => {
    const totalPages = data?.meta?.total_pages
    if (typeof totalPages === 'number' && totalPages > 0) {
      if ((pageParams?.page ?? 1) > totalPages) {
        setPageParams({ ...pageParams, page: totalPages })
      } else if ((pageParams?.page ?? 1) < 1) {
        setPageParams({ ...pageParams, page: 1 })
      }
    } else if ((pageParams?.page ?? 1) < 1) {
      setPageParams({ ...pageParams, page: 1 })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.meta?.total_pages])
  const onChangePage = (pageNumber: number) => {
    // Use 1-based page numbers consistently with QbsTable and API
    setPageParams({
      ...pageParams,
      page: pageNumber,
    })
  }
  const onChangeRowsPerPage = (count: number | string) => {
    setPageParams({
      ...pageParams,
      per_page: Number(count),
      page: 1,
    })
  }
  const onViewAction = async (row: any) => {
    setViewIndicator(true)
    if (row?.user?.id) {
      const data = await getAdminDetails(row?.user?.id)
      setRowData(data)
      setViewMode(true)
      setCreateOpen(true)
    }
  }
  useEffect(() => {
    setColumns(
      getColumns({
        onNameClick: !isNutritionist
          ? (row: any) => {
              navigate(`/plans/${row?.id}`)
            }
          : undefined,
        disableNameLink: isNutritionist,
      })
    )
  }, [isNutritionist])

  const handleSeach = (key?: string) => {
    setPageParams({
      ...pageParams,
      search: key as string,
      page: 1,
    })
  }

  // Debounce the search input updates
  useEffect(() => {
    const t = setTimeout(() => {
      if (searchInput !== (pageParams?.search || '')) {
        handleSeach(searchInput)
      }
    }, 300)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput])

  // Keep local input in sync if store search changes elsewhere
  useEffect(() => {
    setSearchInput(pageParams?.search || '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageParams?.search])

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
        // refetch()
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

  const handleDeleteAdmin = () => {
    setloader(true)
    deActivateAdmin(deleteItem)
      .then(() => {
        enqueueSnackbar('Status Updated successfully', {
          variant: 'success',
        })
        setloader(false)
        // refetch()
        setSelectedRows(
          selectedRows?.filter((sel: string | number) => sel !== deleteItem) ||
            []
        )
        setDeleteModal(false)
      })
      .catch((err) => {
        setloader(false)
        enqueueSnackbar(
          err?.response?.data?.error?.message || err?.response?.data?.message,
          { variant: 'error' }
        )
      })
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
    // refetch()
  }
  const basicData = {
    title: 'Plans',
    icon: 'plan',
  }
  const openDrawer = () => {
    if (isNutritionist) return
    setCreateOpen(true)
    setRowData({})
  }
  const headerProps = {
    actionTitle: 'Create Plan',
  }
  const handleSort = (orderColumn: any, orderDirection: any) => {
    setPageParams({
      ...pageParams,
      sortColumn: orderColumn,
      sortType: orderDirection,
      ordering: getSortedColumnName(orderColumn, orderDirection),
    })
  }
  // const applyStatusFilter = (value: string) => {
  //   setStatusFilter(value)
  //   const nextFilters: any = { ...(pageParams?.filters || {}) }
  //   if (value?.trim()) {
  //     nextFilters.status = value
  //   } else {
  //     delete nextFilters.status
  //   }
  //   setPageParams({ ...pageParams, filters: nextFilters, page: 1 })
  // }
  const applyStatusFilter = (value: string) => {
    setStatusFilter(value)
    const nextFilters: any = { ...(pageParams?.filters || {}) }
    if (value?.trim()) {
      nextFilters.active = value === 'true' ? true : false
    } else {
      delete nextFilters.active
    }
    setPageParams({ ...pageParams, filters: nextFilters, page: 1 })
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
            onActionClick={!isNutritionist ? openDrawer : undefined}
            actionProps={!isNutritionist ? headerProps : undefined}
            checkPermission={
              !isNutritionist && checkPermissions('Employee', 'create')
            }
          />
          <div className=" p-4">
            <SmartTable
              // data={(data?.plans ?? []).filter((row: any) => {
              //   if (statusFilter === '') return true
              //   const v = row?.active
              //   const isActive =
              //     (typeof v === 'boolean' && v === true) ||
              //     (typeof v === 'number' && v === 1) ||
              //     (typeof v === 'string' &&
              //       (v === '1' ||
              //         v.toLowerCase() === 'true' ||
              //         v.toLowerCase() === 'active'))
              //   return statusFilter === 'true' ? isActive : !isActive
              // })}
              data={data?.plans ?? []}
              dataRowKey="id"
              toolbar={true}
              toolbarExtra={
                <div className="flex items-end gap-3">
                  <div className="flex flex-col gap-1 ">
                    <label className="text-xs text-gray-600">Status</label>
                    <select
                      className="textfield w-44 "
                      value={statusFilter}
                      onChange={(e) => applyStatusFilter(e.target.value)}
                    >
                      <option value="">All</option>
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
                    </select>
                  </div>
                </div>
              }
              height={
                (data?.plans?.length ?? 0) === 0
                  ? calcWindowHeight(218)
                  : calcWindowHeight(150)
              }
              search={true}
              searchPlaceholder="Search Plan Name"
              searchValue={pageParams?.search || ''}
              onSearchChange={(val) =>
                setPageParams({ ...pageParams, search: val, page: 1 })
              }
              onSearch={() => handleSeach(pageParams?.search || '')}
              isLoading={isFetching}
              sortType={pageParams.sortType}
              sortColumn={pageParams.sortColumn}
              handleColumnSort={handleSort}
              emptyTitle="No records to display"
              emptySubTitle={''}
              columns={columns}
              pagination={true}
              paginationProps={{
                onPagination: onChangePage,
                total: data?.meta?.total_count ?? 0,
                currentPage:
                  typeof data?.meta?.current_page === 'number'
                    ? (data?.meta?.current_page as number)
                    : (pageParams?.page ?? 1),
                rowsPerPage: Number(
                  pageParams?.per_page ?? data?.meta?.per_page ?? 10
                ),
                onRowsPerPage: onChangeRowsPerPage,
                totalPages: Math.max(
                  1,
                  Math.ceil(
                    (Number(data?.meta?.total_count ?? 0) || 0) /
                      Number(pageParams?.per_page ?? data?.meta?.per_page ?? 10)
                  )
                ),
                dropOptions: [10, 20, 30, 50, 100],
              }}
              actionProps={
                isNutritionist
                  ? []
                  : [
                      {
                        icon: <Icons name="eye" />,
                        action: (row: any) => navigate(`/plans/${row?.id}`),
                        title: 'view',
                        toolTip: 'View',
                      },
                      {
                        icon: <Icons name="edit" />,
                        action: (row: any) => handleEditPlan(row),
                        title: 'edit',
                        toolTip: 'Edit',
                      },
                      {
                        title: 'deactivate',
                        action: (row: any) => handleToggleStatus(row),
                        icon: <Icons name="deactivate-icon" />,
                        toolTip: 'deactivate',
                        hide: (row: any) => {
                          const v = row?.active
                          const isActive =
                            (typeof v === 'boolean' && v === true) ||
                            (typeof v === 'number' && v === 1) ||
                            (typeof v === 'string' &&
                              (v === '1' || v.toLowerCase() === 'true'))
                          return !isActive
                        },
                      },
                      {
                        title: 'activate',
                        action: (row: any) => handleToggleStatus(row),
                        icon: <Icons name="activate-icon" />,
                        toolTip: 'activate',
                        hide: (row: any) => {
                          const v = row?.active
                          const isActive =
                            (typeof v === 'boolean' && v === true) ||
                            (typeof v === 'number' && v === 1) ||
                            (typeof v === 'string' &&
                              (v === '1' || v.toLowerCase() === 'true'))
                          return isActive
                        },
                      },
                      {
                        icon: <Icons name="delete" />,
                        action: (row: any) => {
                          setPlanToDelete(row)
                          setDeletePlanModal(true)
                        },
                        title: 'delete',
                        toolTip: 'delete',
                      },
                    ]
              }
              columnToggle
              externalActions={true}
            />
          </div>

          <ConfirmDeleteModal
            isOpen={deletePlanModal}
            onClose={() => {
              if (!deletingPlan) {
                setDeletePlanModal(false)
                setPlanToDelete(null)
              }
            }}
            onConfirm={() => planToDelete && handleDeletePlan(planToDelete)}
            loading={deletingPlan}
            title={'Are you sure?'}
            subTitle={
              'Do you really want to delete this plan? This process cannot be undone.'
            }
            confirmLabel="Delete"
            cancelLabel="Cancel"
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
          <ResetPassword
            changePassword={changePassword}
            setChangePassword={setChangePassword}
            userId={userId}
            setUserId={setUserId}
            from={'Admin'}
            userName={userName}
            setUserName={setUserName}
          />

          <CreatePlan
            isDrawerOpen={createOpen}
            rowData={rowData}
            edit={edit}
            setViewMode={setViewMode}
            setEdit={setEdit}
            viewMode={viewMode}
            handleClose={handleClose}
            handleRefresh={handleRefresh}
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
