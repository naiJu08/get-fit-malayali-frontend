import SmartTable from '../../components/common/table/SmartTable'
import { AutoComplete } from 'qbs-core'
import { useEffect, useState } from 'react'
// import { useNavigate } from 'react-router-dom'

import { TableColumns } from '../../common/types'
import InfoBox from '../../components/app/alertBox/infoBox'
import ResetPassword from '../../components/app/resetPassword'
import DialogModal from '../../components/common/modal/DialogModal'
import TextField from '../../components/common/inputs/TextField'

import FreezeUserModal from '../../components/common/modal/FreezeUserModal'
import ConfirmDeleteModal from '../../components/common/modal/ConfirmDeleteModal'
import Icons from '../../components/common/icons'
import ListingHeader from '../../components/common/ListingTiles'
import { useSnackbarManager } from '../../components/common/snackbar'
import { useAdminUserFilterStore } from '../../store/filterSore/adminUserStore'
import { calcWindowHeight } from '../../utilities/calcHeight'
import { getSortedColumnName } from '../../utilities/parsers'
import { getData } from '../../apis/api.helpers'
import apiUrl from '../../apis/api.url'

import {
  deActivateAdmin,
  getAdminDetails,
  sendAdminInvitation,
  useAdminUser,
  DISABLE_NONLOGIN_APIS,
  deleteAdmin,
  freezeUser,
  unfreezeUser,
} from './api'
import { getColumns } from './columns'
import { useCreateNotification } from './api'

export default function Notifications() {
  // const navigate = useNavigate()
  const [columns, setColumns] = useState<TableColumns[]>([])
  const { enqueueSnackbar } = useSnackbarManager()
  const [deleteItem] = useState('')
  const [status] = useState('')
  const [deleteModal, setDeleteModal] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [rowData, setRowData] = useState<any>()
  const [changePassword, setChangePassword] = useState(false)
  const [userName, setUserName] = useState('')
  const [userId, setUserId] = useState('')
  const [openConfirm, setOpenConfirm] = useState(false)
  const [deleteUserModal, setDeleteUserModal] = useState(false)
  const [deleteUserId, setDeleteUserId] = useState<string>('')
  const [freezeModal, setFreezeModal] = useState(false)
  const [freezeUserId] = useState<string>('')
  const [freezeForm, setFreezeForm] = useState<{
    reason: string
    start_date: string
    end_date: string
  }>({
    reason: '',
    start_date: '',
    end_date: '',
  })
  const [unfreezeConfirm, setUnfreezeConfirm] = useState(false)
  const [searchDebounce, setSearchDebounce] = useState<any>(null)

  const [editViewIndicator, setEditViewIndicator] = useState(false)
  const [viewIndicator, setViewIndicator] = useState(false)
  const [loader, setloader] = useState(false)

  // Create Notification form state
  const [createForm, setCreateForm] = useState({
    selectedUsers: [] as any[],
    title: '',
    message: '',
    notification_type: 'reminder',
    scheduled_date: '',
    scheduled_time: '',
  })

  const handleCreateChange = (name: string, value: any) => {
    setCreateForm((prev) => ({ ...prev, [name]: value }))
  }

  const clearCreateForm = () => {
    setCreateForm({
      selectedUsers: [],
      title: '',
      message: '',
      notification_type: 'reminder',
      scheduled_date: '',
      scheduled_time: '',
    })
  }

  // Create notification hook
  const { mutate: createNotificationMutate, isLoading: isCreating } =
    useCreateNotification(() => {
      clearCreateForm()
      setCreateOpen(false)
      refetch()
    })

  const handleCreateSubmit = () => {
    // Collect selected user IDs
    const ids = (createForm.selectedUsers || [])
      .map((u: any) => Number(u?.id))
      .filter((n: number) => !Number.isNaN(n))

    // Basic required field validation
    if (!ids.length) {
      enqueueSnackbar('Please select at least one user', { variant: 'error' })
      return
    }
    if (!createForm.title?.trim()) {
      enqueueSnackbar('Please enter a title', { variant: 'error' })
      return
    }
    if (!createForm.message?.trim()) {
      enqueueSnackbar('Please enter a message', { variant: 'error' })
      return
    }
    if (!createForm.notification_type?.trim()) {
      enqueueSnackbar('Please select a type', { variant: 'error' })
      return
    }

    // Combine date and time into ISO if both provided
    let scheduledISO: string | undefined
    const hasDate = !!createForm.scheduled_date
    const hasTime = !!createForm.scheduled_time
    if (hasDate && hasTime) {
      // Build local datetime string and convert to ISO
      const datetimeLocal = `${createForm.scheduled_date}T${createForm.scheduled_time}`
      const dt = new Date(datetimeLocal)
      if (!isNaN(dt.getTime())) scheduledISO = dt.toISOString()
    } else if (hasDate || hasTime) {
      enqueueSnackbar('Please provide both date and time for scheduling', {
        variant: 'warning',
      })
      return
    }

    // Build payload and omit undefined/empty optional fields
    const notification: any = {
      user_ids: ids,
      title: createForm.title.trim(),
      message: createForm.message.trim(),
      notification_type: createForm.notification_type,
    }
    if (scheduledISO) notification.scheduled_at = scheduledISO

    const payload: any = { notification }

    createNotificationMutate(payload as any)
  }

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

  // No filtering UI/state

  const isFrozen = (rowData: any) => {
    const val = String(rowData?.status ?? '').toLowerCase()
    return val === 'suspended' || val === 'paused'
  }

  const handleFreezeChange = ({
    name,
    value,
  }: {
    name: string
    value: any
  }) => {
    if (name === 'start_date' || name === 'end_date') {
      const d = value ? new Date(value) : null
      const iso = d
        ? new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
            .toISOString()
            .slice(0, 10)
        : ''
      setFreezeForm((prev) => ({ ...prev, [name]: iso }))
    } else {
      setFreezeForm((prev) => ({ ...prev, [name]: value }))
    }
  }

  const handleSubmitFreeze = () => {
    if (!freezeUserId) return
    setloader(true)
    freezeUser(freezeUserId, freezeForm)
      .then(() => {
        enqueueSnackbar('Subscription frozen successfully', {
          variant: 'success',
        })
        setloader(false)
        setFreezeModal(false)
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

  const [toggleFreezeOpen, setToggleFreezeOpen] = useState(false)
  const [toggleFreezeRow, setToggleFreezeRow] = useState<any>(null)

  const handleConfirmToggleFreeze = async () => {
    if (!toggleFreezeRow) return
    try {
      setloader(true)
      if (isFrozen(toggleFreezeRow)) {
        await unfreezeUser(String(toggleFreezeRow.id))
        enqueueSnackbar('Subscription unfrozen successfully', {
          variant: 'success',
        })
      } else {
        const { reason, start_date, end_date } = freezeForm
        if (!reason || !start_date || !end_date) {
          enqueueSnackbar('Please fill reason, start date and end date', {
            variant: 'warning',
          })
          setloader(false)
          return
        }
        await freezeUser(String(toggleFreezeRow.id), {
          reason,
          start_date,
          end_date,
        })
        enqueueSnackbar('Subscription frozen successfully', {
          variant: 'success',
        })
      }
      refetch()
      setToggleFreezeOpen(false)
      setToggleFreezeRow(null)
    } catch (err: any) {
      enqueueSnackbar(
        err?.response?.data?.error?.message || err?.response?.data?.message,
        { variant: 'error' }
      )
    } finally {
      setloader(false)
    }
  }

  const handleSubmitUnfreeze = () => {
    if (!freezeUserId) return
    setloader(true)
    unfreezeUser(freezeUserId)
      .then(() => {
        enqueueSnackbar('Subscription unfrozen successfully', {
          variant: 'success',
        })
        setloader(false)
        setUnfreezeConfirm(false)
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

  const { data, refetch, isFetching } = useAdminUser(searchParams)
  useEffect(() => {
    refetch()
  }, [page, page_size, search, ordering, JSON.stringify(filters)])
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
    }
  }
  useEffect(() => {
    setColumns(getColumns())
  }, [])

  // const handleDeleteModel = (id: string, username: string, status: string) => {
  //   setDeleteItem(id)
  //   setDeleteModal(true)
  //   setUserName(username)
  //   setStatus(status)
  // }

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

  const handleDeleteAdmin = () => {
    setloader(true)
    deActivateAdmin(deleteItem)
      .then(() => {
        enqueueSnackbar('Status Updated successfully', {
          variant: 'success',
        })
        setloader(false)
        refetch()
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
    if (viewIndicator && editViewIndicator) {
      setViewIndicator(false)
      setEditViewIndicator(false)
      onViewAction(rowData)
    }
  }
  const basicData = {
    title: 'Notifications',
    icon: 'notification',
  }

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
      .then(() => {
        enqueueSnackbar('Subscription deleted successfully', {
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
          <ListingHeader data={basicData} checkPermission={false} />
          <div className="px-4 mt-2 flex justify-end">
            <button
              className="px-3 py-2 bg-primaryGreen text-white rounded"
              onClick={() => setCreateOpen(true)}
            >
              Create
            </button>
          </div>
          <DialogModal
            isOpen={toggleFreezeOpen}
            onClose={() => setToggleFreezeOpen(false)}
            title={
              isFrozen(toggleFreezeRow)
                ? 'Unfreeze Subscription'
                : 'Freeze Subscription'
            }
            onSubmit={handleConfirmToggleFreeze}
            secondaryAction={() => {
              setToggleFreezeOpen(false)
              setToggleFreezeRow(null)
            }}
            secondaryActionLabel="Cancel"
            actionLabel={isFrozen(toggleFreezeRow) ? 'Unfreeze' : 'Freeze'}
            actionLoader={loader}
            body={
              isFrozen(toggleFreezeRow) ? (
                <InfoBox
                  content={'Do you want to unfreeze this subscription?'}
                />
              ) : (
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-sm text-gray-600">Reason</label>
                    <input
                      className="textfield"
                      name="reason"
                      value={freezeForm.reason}
                      onChange={(e) =>
                        handleFreezeChange({
                          name: e.target.name,
                          value: e.target.value,
                        })
                      }
                      placeholder="Enter reason"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-sm text-gray-600">
                        Start date
                      </label>
                      <input
                        type="date"
                        className="textfield"
                        name="start_date"
                        value={freezeForm.start_date}
                        onChange={(e) =>
                          handleFreezeChange({
                            name: e.target.name,
                            value: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-sm text-gray-600">End date</label>
                      <input
                        type="date"
                        className="textfield"
                        name="end_date"
                        value={freezeForm.end_date}
                        onChange={(e) =>
                          handleFreezeChange({
                            name: e.target.name,
                            value: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                </div>
              )
            }
          />
          <div className=" p-4">
            <SmartTable
              data={data?.items ?? []}
              dataRowKey="id"
              toolbar={true}
              height={
                data?.items?.length === 0
                  ? calcWindowHeight(218)
                  : calcWindowHeight(200)
              }
              search={true}
              searchValue={pageParams.search || ''}
              onSearchChange={(val) => {
                setPageParams({ ...pageParams, search: val, page: 1 })
                if (searchDebounce) clearTimeout(searchDebounce)
                const t = setTimeout(() => refetch(), 300)
                setSearchDebounce(t)
              }}
              onSearch={() => refetch()}
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
                total: data?.total ?? 0,
                currentPage: pageParams?.page ?? 1,
                rowsPerPage: Number(pageParams?.page_size ?? 10),
                onRowsPerPage: onChangeRowsPerPage,
                totalPages: Math.max(
                  1,
                  Math.ceil(
                    (data?.total ?? 0) / Number(pageParams?.page_size ?? 10)
                  )
                ),
                dropOptions: [10, 20, 30, 50, 100],
              }}
              actionProps={[
                // {
                //   icon: <Icons name="eye" />,
                //   action: (row) => navigate(`/subscriptions/${row?.id}`),
                //   title: 'view',
                //   toolTip: 'View Details',
                // },
                // {
                //   title: 'Freeze/Unfreeze',
                //   action: (row) => {
                //     setToggleFreezeRow(row)
                //     setToggleFreezeOpen(true)
                //   },
                //   icon: <Icons name="lock-icon" />,
                //   toolTip: 'Toggle Freeze',
                // },
                // {
                //   title: 'Deactivate',
                //   action: (rowData) =>
                //     handleDeleteModel(
                //       rowData?.id,
                //       rowData?.email,
                //       rowData?.status
                //     ),
                //   icon: <Icons name="deactivate-icon" />,
                //   toolTip: 'Deactivate',
                //   hide: (rowData: any) =>
                //     String(rowData?.status ?? '').toLowerCase() === 'active'
                //       ? false
                //       : true,
                // },

                {
                  title: 'Delete',
                  action: (rowData) => handleOpenDeleteUser(rowData?.id),
                  icon: <Icons name="delete" />,
                  toolTip: 'Delete',
                },
              ]}
              columnToggle
              externalActions={true}
            />
          </div>

          {/* Create Notification Modal */}
          <DialogModal
            isOpen={createOpen}
            onClose={() => {
              handleClose()
              clearCreateForm()
            }}
            title={'Create Notification'}
            actionLabel={'Create'}
            actionLoader={isCreating}
            onSubmit={handleCreateSubmit}
            secondaryAction={() => {
              handleClose()
              clearCreateForm()
            }}
            secondaryActionLabel="Cancel"
            small={false}
            body={
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-sm text-gray-600">Users</label>
                  <AutoComplete
                    placeholder="Search users"
                    desc="value"
                    descId="id"
                    type={'auto_suggestion'}
                    isMultiple={true}
                    selectedItems={createForm.selectedUsers}
                    value={''}
                    async={true}
                    initialLoad={true}
                    paginationEnabled={true}
                    getData={async (key?: string, nextBlock?: number) => {
                      const params = new URLSearchParams()
                      if (key) params.set('search', key)
                      params.set('per_page', '10')
                      if (nextBlock) params.set('page', String(nextBlock))
                      const url = `${apiUrl.ADMIN_USER}?${params.toString()}`
                      const res: any = await getData(url)
                      const items: any[] = Array.isArray(res)
                        ? res
                        : res?.items ||
                          res?.users ||
                          res?.results ||
                          res?.data?.items ||
                          res?.data?.users ||
                          []
                      return items.map((u: any) => {
                        const nested = u?.user || {}
                        const fullName =
                          u?.full_name ||
                          [u?.first_name, u?.last_name]
                            .filter(Boolean)
                            .join(' ') ||
                          nested?.full_name ||
                          [nested?.first_name, nested?.last_name]
                            .filter(Boolean)
                            .join(' ')
                        const label =
                          u?.name ||
                          fullName ||
                          u?.username ||
                          nested?.username ||
                          u?.email ||
                          nested?.email ||
                          `User ${u?.id ?? ''}`
                        return {
                          id: u?.id ?? nested?.id,
                          value: label,
                        }
                      })
                    }}
                    name="users"
                    onChange={(value: any) =>
                      setCreateForm((prev) => ({
                        ...prev,
                        selectedUsers: value ?? [],
                      }))
                    }
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm text-gray-600">Title</label>
                  <input
                    className="textfield"
                    value={createForm.title}
                    onChange={(e) =>
                      handleCreateChange('title', e.target.value)
                    }
                    placeholder="Reminder"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm text-gray-600">Message</label>
                  <textarea
                    className="textfield"
                    value={createForm.message}
                    onChange={(e) =>
                      handleCreateChange('message', e.target.value)
                    }
                    placeholder="Don't forget your workout today"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-sm text-gray-600">Type</label>
                    <select
                      className="textfield"
                      value={createForm.notification_type}
                      onChange={(e) =>
                        handleCreateChange('notification_type', e.target.value)
                      }
                    >
                      <option value="reminder">reminder</option>
                      <option value="general">general</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-sm text-gray-600">
                      Scheduled Date
                    </label>
                    <input
                      type="date"
                      className="textfield"
                      value={createForm.scheduled_date}
                      onChange={(e) =>
                        handleCreateChange('scheduled_date', e.target.value)
                      }
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-sm text-gray-600">
                      Scheduled Time
                    </label>
                    <input
                      type="time"
                      className="textfield"
                      value={createForm.scheduled_time}
                      onChange={(e) =>
                        handleCreateChange('scheduled_time', e.target.value)
                      }
                    />
                  </div>
                </div>
              </div>
            }
          />

          <DialogModal
            isOpen={deleteModal}
            onClose={() => setDeleteModal(false)}
            title={
              status == 'Active'
                ? 'Deactivate Subscription'
                : 'Activate Subscription'
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
                    ? 'Are you sure to deactivate this subscription?'
                    : 'Are you sure to activate this subscription?'}
                </p>
                <div className="flex flex-col gap-4">
                  <div className="w-full flex flex-col gap-2">
                    <TextField
                      id="1"
                      name="email"
                      value={userName ?? ''}
                      disabled={true}
                      label={'Email id'}
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
              'Do you really want to delete this subscription? This process cannot be undone.'
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

          <FreezeUserModal
            isOpen={freezeModal}
            onClose={() => setFreezeModal(false)}
            onSubmit={handleSubmitFreeze}
            loading={loader}
            values={freezeForm}
            onChange={handleFreezeChange}
          />

          <ConfirmDeleteModal
            isOpen={unfreezeConfirm}
            onClose={() => setUnfreezeConfirm(false)}
            onConfirm={handleSubmitUnfreeze}
            loading={loader}
            title={'Are you sure?'}
            subTitle={'Do you really want to unfreeze this subscription?'}
            confirmLabel="Unfreeze"
            cancelLabel="Cancel"
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
