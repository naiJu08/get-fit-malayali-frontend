import SmartTable from '../../components/common/table/SmartTable'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { TableColumns } from '../../common/types'
import InfoBox from '../../components/app/alertBox/infoBox'
import {
  Button,
  DialogModal,
  TabContainer,
  TextField,
} from '../../components/common'
import ConfirmDeleteModal from '../../components/common/modal/ConfirmDeleteModal'
// import Icons from '../../components/common/icons'
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
  useInactiveUsers,
  DISABLE_NONLOGIN_APIS,
  // deleteAdmin,
} from './api'
import { getInactiveUserColumns } from './inactiveUserColumns'
import Icons from '../../components/common/icons'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import { useAuthStore } from '../../store/authStore'

export default function InactiveUsers() {
  const navigate = useNavigate()
  const loginRole = useAuthStore((state) =>
    state.roleData?.name?.toLowerCase?.()
  )
  const isServiceStaffLogin = [
    'nutritionist',
    'physiotherapist',
    'yogist',
  ].includes(loginRole || '')
  const [columns, setColumns] = useState<TableColumns[]>([])
  const { enqueueSnackbar } = useSnackbarManager()
  const [deleteItem, setDeleteItem] = useState('')
  const [status, setStatus] = useState('')
  const [deleteModal, setDeleteModal] = useState(false)
  const [loader, setloader] = useState(false)
  // const [deleteUserId, setDeleteUserId] = useState<string>('')
  // const [deleteUserModal, setDeleteUserModal] = useState(false)
  const [activePlanWarningOpen, setActivePlanWarningOpen] = useState(false)
  const [pendingStatusChange, setPendingStatusChange] = useState<{
    id: string
    username: string
    status: string
  } | null>(null)
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

  // Reset pagination when component mounts
  useEffect(() => {
    setPageParams({
      ...pageParams,
      page: 1,
      search: '',
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const { data, refetch, isFetching } = useInactiveUsers(searchParams)

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

  useEffect(() => {
    setColumns(
      getInactiveUserColumns({
        onNameClick: (row: any) => {
          navigate(`/users/${row?.id}/details`)
        },
      })
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSeach = (key?: string) => {
    setPageParams({
      ...pageParams,
      search: key as string,
      page: 1,
    })
  }

  // const handleDeleteModel = (
  //   id: string,
  //   username: string,
  //   status: string,
  //   hasActivePlan?: boolean
  // ) => {
  //   const normalizedStatus = String(status || '').toLowerCase()
  //   if (normalizedStatus !== 'active') {
  //     handleDeleteAdmin({ id, status })
  //     return
  //   }
  //   if (normalizedStatus === 'active' && hasActivePlan) {
  //     setPendingStatusChange({ id, username, status })
  //     setActivePlanWarningOpen(true)
  //     return
  //   }
  //   handleDeleteAdmin({ id, status })
  // }

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
  const handleDownloadExcel = () => {
    if (!data?.items || data.items.length === 0) {
      enqueueSnackbar('No data available to export', { variant: 'warning' })
      return
    }

    const exportData = data.items.map((item: any) => ({
      Name: item.name || '',
      Email: item.email || '',
      Phone: item.phone || '',
      'Days Inactive': item.days_inactive || 0,
      'Last Activity': item.last_activity_date || 'Never',
      'Subscription Plan': item.subscription?.plan_name || '—',
      'Last Login': item.last_login || 'Never',
    }))

    const worksheet = XLSX.utils.json_to_sheet(exportData)
    const workbook = XLSX.utils.book_new()

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Inactive Clients')

    const excelBuffer = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array',
    })

    const fileData = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8',
    })

    saveAs(fileData, 'InactiveUsers.xlsx')
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

  const basicData = {
    title: 'Clients',
    icon: 'user',
  }

  const handleSort = (orderColumn: any, orderDirection: any) => {
    setPageParams({
      ...pageParams,
      sortColumn: orderColumn,
      sortType: orderDirection,
      ordering: getSortedColumnName(orderColumn, orderDirection),
    })
  }

  // const handleOpenDeleteUser = (id: string) => {
  //   setDeleteUserId(id)
  //   setDeleteUserModal(true)
  // }

  // const handleDeleteUser = () => {
  //   setloader(true)
  //   deleteAdmin(deleteUserId)
  //     .then(() => {
  //       enqueueSnackbar('User deleted successfully', { variant: 'success' })
  //       setloader(false)
  //       setDeleteUserModal(false)
  //       refetch()
  //     })
  //     .catch((err) => {
  //       setloader(false)
  //       enqueueSnackbar(
  //         err?.response?.data?.error?.message || err?.response?.data?.message,
  //         { variant: 'error' }
  //       )
  //     })
  // }

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
            checkPermission={checkPermissions('Employee', 'view')}
          />

          {/* Role Tabs */}
          <div className="px-4">
            <TabContainer
              data={
                isServiceStaffLogin
                  ? [
                      { id: 'clients', label: 'Client' },
                      { id: 'assigned-clients', label: 'Assigned Clients' },
                      { id: 'inactive-clients', label: 'Inactive Clients' },
                    ]
                  : [
                      { id: 'clients', label: 'Client' },
                      { id: 'inactive-clients', label: 'Inactive Clients' },
                    ]
              }
              action={
                <Button
                  className="bg-primaryGreen whitespace-nowrap px-3"
                  label="Download Excel"
                  icon="download"
                  onClick={handleDownloadExcel}
                />
              }
              activeTab="inactive-clients"
              onClick={(tab) =>
                navigate(
                  tab.id === 'clients'
                    ? '/users'
                    : tab.id === 'assigned-clients'
                      ? '/users/' + loginRole + '/assigned-clients'
                      : '/admin/inactive-users'
                )
              }
            >
              {null}
            </TabContainer>
          </div>

          <div className="p-4">
            {/* <div className="mb-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center">
                  <Icons name="info" className="text-blue-600 mr-2" />
                  <div className="text-sm text-blue-800">
                    <span className="font-medium">Threshold: {data?.threshold_days || 5} days</span>
                    <span className="ml-2">- Users shown have been inactive for this period or more.</span>
                  </div>
                </div>
              </div>
            </div> */}
            <SmartTable
              data={data?.items ?? []}
              dataRowKey="id"
              search={false}
              searchPlaceholder="Search Inactive User Name"
              height={
                data?.items?.length === 0
                  ? calcWindowHeight(218)
                  : calcWindowHeight(200)
              }
              isLoading={isFetching}
              sortType={pageParams.sortType}
              sortColumn={pageParams.sortColumn}
              handleColumnSort={handleSort}
              emptyTitle="No inactive users to display"
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
                    navigate(`/users/${row?.id}/details`)
                  },
                  title: 'View',
                  toolTip: 'View',
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

          <ConfirmDeleteModal
            isOpen={activePlanWarningOpen}
            onClose={cancelActivePlanWarning}
            onConfirm={confirmActivePlanWarning}
            title="Activate this user?"
            subTitle="This user currently has an active plan. Are you sure you want to continue with activation?"
            confirmLabel="Yes, Continue"
            cancelLabel="No"
          />

          <DialogModal
            isOpen={deleteModal}
            onClose={() => setDeleteModal(false)}
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
                      value={deleteItem ?? ''}
                      disabled={true}
                      label={'Admin Email id'}
                    />
                  </div>
                </div>
              </>
            }
          />

          {/* <ConfirmDeleteModal
            isOpen={deleteUserModal}
            onClose={() => setDeleteUserModal(false)}
            // onConfirm={() => handleDeleteUser()}
            loading={loader}
            title={'Are you sure?'}
            subTitle={
              'Do you really want to delete this user? This process cannot be undone.'
            }
            confirmLabel="Delete"
            cancelLabel="Cancel"
          /> */}
        </>
      )}
    </div>
  )
}
