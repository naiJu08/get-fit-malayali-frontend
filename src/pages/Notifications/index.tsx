import SmartTable from '../../components/common/table/SmartTable'
import { AutoComplete } from 'qbs-core'
import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Icons from '../../components/common/icons'

import { TableColumns } from '../../common/types'
import InfoBox from '../../components/app/alertBox/infoBox'
import ResetPassword from '../../components/app/resetPassword'
import DialogModal from '../../components/common/modal/DialogModal'
import CreateBatchDialog from './components/CreateBatchDialog'
import TextField from '../../components/common/inputs/TextField'

import FreezeUserModal from '../../components/common/modal/FreezeUserModal'
import ConfirmDeleteModal from '../../components/common/modal/ConfirmDeleteModal'
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
  freezeUser,
  unfreezeUser,
} from './api'
import { getColumns } from './columns'
import {
  useCreateNotification,
  useCreateUserBatch,
  useDeleteUserBatch,
  useUpdateUserBatch,
  getUserBatchDetail,
} from './api'
import { checkPermissions } from '../../layout/store'

export default function Notifications() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
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
  const location = useLocation()
  const [editViewIndicator, setEditViewIndicator] = useState(false)
  const [viewIndicator, setViewIndicator] = useState(false)
  const [loader, setloader] = useState(false)
  const [activeTab, setActiveTab] = useState<'current' | 'history'>(() =>
    pathname.includes('/notifications/history') ? 'history' : 'current'
  )
  // const formatHistoryDate = (value?: string) => {
  //   if (!value) return '-'
  //   const date = new Date(value)
  //   if (Number.isNaN(date.getTime())) return '-'
  //   return date.toLocaleString()
  // }
  const [historyTable, setHistoryTable] = useState({
    items: [] as any[],
    total: 0,
    isLoading: false,
  })
  const [historyColumns] = useState<TableColumns[]>([
    {
      title: 'Batch Name',
      field: 'name',
      renderCell: (row: any) => ({
        cell: row?.name ?? '-',
        toolTip: row?.name ?? '',
      }),
      customCell: true,
      sortable: false,
      resizable: true,
      isVisible: true,
    },
    {
      title: 'Description',
      field: 'description',
      renderCell: (row: any) => ({
        cell: row?.description ?? '-',
        toolTip: row?.description ?? '',
      }),
      customCell: true,
      sortable: false,
      resizable: true,
      isVisible: true,
    },
    {
      title: 'Users',
      field: 'users_count',
      renderCell: (row: any) => {
        const count =
          row?.users_count ??
          row?.user_count ??
          (Array.isArray(row?.user_ids) ? row.user_ids.length : 0)
        return {
          cell: count,
          toolTip: String(count ?? 0),
        }
      },
      customCell: true,
      sortable: false,
      resizable: true,
      isVisible: true,
    },
    {
      title: 'Created By',
      field: 'created_by',
      renderCell: (row: any) => ({
        cell: row?.created_by ?? '-',
        toolTip: row?.created_by ?? '',
      }),
      customCell: true,
      sortable: false,
      resizable: true,
      isVisible: true,
    },
    // {
    //   title: 'Created At',
    //   field: 'created_at',
    //   renderCell: (row: any) => {
    //     const value = formatHistoryDate(row?.created_at)
    //     return {
    //       cell: value,
    //       toolTip: value,
    //     }
    //   },
    //   customCell: true,
    //   sortable: false,
    //   resizable: true,
    //   isVisible: true,
    // },
  ])
  const [isCreateBatchOpen, setIsCreateBatchOpen] = useState(false)
  const [historySearch, setHistorySearch] = useState('')
  const [historyDebounce, setHistoryDebounce] = useState<any>(null)
  const [historyPagination, setHistoryPagination] = useState({
    page: 1,
    per_page: 10,
  })
  const createBatchFormDefaults = () => ({
    selectedUsers: [] as any[],
    name: '',
    description: '',
  })
  const filterNonNull = <T,>(item: T | null | undefined): item is T =>
    item !== null && item !== undefined
  const buildUserOption = (user: any, fallbackId?: any) => {
    if (!user && fallbackId === undefined) return null
    const base = user || {}
    const nested = base?.user || {}
    const resolvedId =
      base?.id ??
      base?.user_id ??
      base?.userId ??
      base?.uuid ??
      base?.user_uuid ??
      nested?.id ??
      nested?.user_id ??
      fallbackId
    if (resolvedId === undefined || resolvedId === null) {
      return null
    }
    const firstName = base?.first_name ?? nested?.first_name ?? ''
    const lastName = base?.last_name ?? nested?.last_name ?? ''
    const fullName =
      base?.full_name ??
      nested?.full_name ??
      [firstName, lastName].filter(Boolean).join(' ')
    const label =
      base?.name ??
      fullName ??
      base?.username ??
      nested?.username ??
      base?.email ??
      nested?.email ??
      `User ${resolvedId}`
    return { id: resolvedId, value: label }
  }
  const resolveBatchUserOptions = (batchData: any) => {
    if (!batchData) return []
    const selectedFromUsers = Array.isArray(batchData?.users)
      ? batchData.users
          .map((u: any) => buildUserOption(u))
          .filter(filterNonNull)
      : []
    const selectedFromMembers =
      !selectedFromUsers.length && Array.isArray(batchData?.user_batch_members)
        ? batchData.user_batch_members
            .map((member: any) => buildUserOption(member?.user ?? member))
            .filter(filterNonNull)
        : []
    const selectedFromIds =
      !selectedFromUsers.length &&
      !selectedFromMembers.length &&
      Array.isArray(batchData?.user_ids)
        ? batchData.user_ids
            .map((uid: any) => buildUserOption(null, uid))
            .filter(filterNonNull)
        : []
    return selectedFromUsers.length
      ? selectedFromUsers
      : selectedFromMembers.length
        ? selectedFromMembers
        : selectedFromIds
  }
  const [batchForm, setBatchForm] = useState(createBatchFormDefaults)
  const [editingBatchId, setEditingBatchId] = useState<string | null>(null)
  const [isBatchDetailLoading, setIsBatchDetailLoading] = useState(false)
  const [deleteBatchId, setDeleteBatchId] = useState<string | null>(null)
  const [isDeleteBatchOpen, setIsDeleteBatchOpen] = useState(false)

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

  useEffect(() => {
    setActiveTab(
      pathname.includes('/notifications/history') ? 'history' : 'current'
    )
  }, [pathname])

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

  const { mutate: createNotificationMutate, isLoading: isCreating } =
    useCreateNotification(() => {
      clearCreateForm()
      setCreateOpen(false)
      refetch()
    })

  const fetchHistory = async ({
    page,
    per_page,
    search,
  }: {
    page: number
    per_page: number
    search?: string
  }) => {
    try {
      setHistoryTable((prev) => ({ ...prev, isLoading: true }))
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('per_page', String(per_page))
      if (search) params.set('search', search)
      const url = `${apiUrl.USER_BATCHES}?${params.toString()}`
      const response: any = await getData(url)
      const rawItems =
        response?.user_batches ??
        response?.items ??
        (Array.isArray(response) ? response : (response?.data?.items ?? []))
      const items = Array.isArray(rawItems) ? rawItems : []
      const total =
        response?.meta?.total_count ??
        response?.total ??
        response?.count ??
        items.length
      setHistoryTable({ items, total: total ?? 0, isLoading: false })
    } catch (err) {
      setHistoryTable((prev) => ({ ...prev, isLoading: false }))
      enqueueSnackbar('Failed to load batches', { variant: 'error' })
    }
  }

  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistory({
        page: historyPagination.page,
        per_page: historyPagination.per_page,
        search: historySearch,
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    activeTab,
    historyPagination.page,
    historyPagination.per_page,
    historySearch,
  ])

  const handleCloseCreateBatch = () => {
    setIsCreateBatchOpen(false)
    setEditingBatchId(null)
    setIsBatchDetailLoading(false)
    setBatchForm(createBatchFormDefaults())
  }

  const handleBatchFormChange = (
    field: 'selectedUsers' | 'name' | 'description',
    value: any
  ) => {
    setBatchForm((prev) => ({ ...prev, [field]: value }))
  }

  const getUserOptions = async (key?: string, nextBlock?: number) => {
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
    return items.map((u: any) => buildUserOption(u)).filter(filterNonNull)
  }

  const { mutate: createUserBatchMutate, isLoading: isBatchCreating } =
    useCreateUserBatch(() => {
      handleCloseCreateBatch()
      fetchHistory({
        page: historyPagination.page,
        per_page: historyPagination.per_page,
        search: historySearch,
      })
    })

  const { mutate: updateUserBatchMutate, isLoading: isBatchUpdating } =
    useUpdateUserBatch(() => {
      handleCloseCreateBatch()
      fetchHistory({
        page: historyPagination.page,
        per_page: historyPagination.per_page,
        search: historySearch,
      })
    })

  const { mutate: deleteUserBatchMutate, isLoading: isBatchDeleting } =
    useDeleteUserBatch(() => {
      setIsDeleteBatchOpen(false)
      setDeleteBatchId(null)
      fetchHistory({
        page: historyPagination.page,
        per_page: historyPagination.per_page,
        search: historySearch,
      })
    })

  const handleCreateBatch = () => {
    if (isBatchDetailLoading) {
      return
    }
    const ids = (batchForm.selectedUsers || [])
      .map((u: any) => Number(u?.id))
      .filter((n: number) => !Number.isNaN(n))
    if (!batchForm.name.trim()) {
      enqueueSnackbar('Please enter a batch name', { variant: 'error' })
      return
    }
    if (!ids.length) {
      enqueueSnackbar('Please select at least one user', { variant: 'error' })
      return
    }
    const payload = {
      user_batch: {
        name: batchForm.name.trim(),
        description: batchForm.description.trim(),
        user_ids: ids,
      },
    }
    if (editingBatchId) {
      updateUserBatchMutate({ id: editingBatchId, payload })
    } else {
      createUserBatchMutate(payload)
    }
  }

  const handleEditBatch = async (row: any) => {
    const targetId = row?.id
    if (!targetId) return
    const id = String(targetId)
    setEditingBatchId(id)
    setBatchForm(createBatchFormDefaults())
    setIsCreateBatchOpen(true)
    setIsBatchDetailLoading(true)
    try {
      const detail = await getUserBatchDetail(id)
      const batchData = detail?.user_batch ?? detail ?? {}
      const selectedUsers = resolveBatchUserOptions(batchData)
      setBatchForm({
        name: batchData?.name ?? '',
        description: batchData?.description ?? '',
        selectedUsers,
      })
    } catch (error) {
      enqueueSnackbar('Failed to load batch details', { variant: 'error' })
      handleCloseCreateBatch()
    } finally {
      setIsBatchDetailLoading(false)
    }
  }

  const handleViewBatch = (row: any) => {
    const targetId = row?.id
    if (!targetId) return
    navigate(`/notifications/history/${targetId}`)
  }

  const handleDeleteBatch = (row: any) => {
    const targetId = row?.id
    if (!targetId) return
    setDeleteBatchId(String(targetId))
    setIsDeleteBatchOpen(true)
  }

  const handleConfirmDeleteBatch = () => {
    if (!deleteBatchId) return
    deleteUserBatchMutate(deleteBatchId)
  }

  const canCreateNotification =
    activeTab === 'current' && checkPermissions('Employee', 'create')
  const canCreateBatch =
    activeTab === 'history' && checkPermissions('Employee', 'create')
  const canEditBatchPermission = checkPermissions('Employee', 'edit')
  const canDeleteBatchPermission = checkPermissions('Employee', 'delete')

  const historyActions = [
    {
      icon: <Icons name="eye" />,
      action: (row: any) => {
        handleViewBatch(row)
      },
      title: 'view',
      toolTip: 'View Details',
    },
    ...(canEditBatchPermission
      ? [
          {
            icon: <Icons name="edit" />,
            action: (row: any) => {
              handleEditBatch(row)
            },
            title: 'edit',
            toolTip: 'Edit',
          },
        ]
      : []),
    ...(canDeleteBatchPermission
      ? [
          {
            icon: <Icons name="delete" />,
            action: (row: any) => {
              handleDeleteBatch(row)
            },
            title: 'delete',
            toolTip: 'Delete',
            variant: 'danger' as const,
          },
        ]
      : []),
  ]

  const handleCreateSubmit = () => {
    const ids = (createForm.selectedUsers || [])
      .map((u: any) => Number(u?.id))
      .filter((n: number) => !Number.isNaN(n))

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
  useEffect(() => {
    setPageParams({
      ...pageParams,
      page: 1,
      search: '',
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, setPageParams])
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
    title: 'Broadcast',
    icon: 'notification',
  }
  const headerProps =
    activeTab === 'current'
      ? { actionTitle: 'Create Notification' }
      : { actionTitle: 'Create Batch' }
  const openDrawer = () => setCreateOpen(true)
  const openBatchDialog = () => {
    setEditingBatchId(null)
    setIsBatchDetailLoading(false)
    setBatchForm(createBatchFormDefaults())
    setIsCreateBatchOpen(true)
  }

  const handleSort = (orderColumn: any, orderDirection: any) => {
    setPageParams({
      ...pageParams,
      sortColumn: orderColumn,
      sortType: orderDirection,
      ordering: getSortedColumnName(orderColumn, orderDirection),
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
            onActionClick={
              activeTab === 'current'
                ? canCreateNotification
                  ? openDrawer
                  : undefined
                : openBatchDialog
            }
            actionProps={{
              actionTitle: headerProps.actionTitle,
            }}
            checkPermission={
              activeTab === 'current' ? canCreateNotification : canCreateBatch
            }
          />

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
            <div className="mb-4 border-b border-gray-200">
              <nav className="flex gap-4" aria-label="Broadcast tabs">
                <button
                  type="button"
                  className={`py-2 px-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'history'
                      ? 'border-primaryBlue text-primaryBlue'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => {
                    setActiveTab('history')
                    navigate('/notifications/history')
                  }}
                >
                  Batch
                </button>
                <button
                  type="button"
                  className={`py-2 px-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'current'
                      ? 'border-primaryBlue text-primaryBlue'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => {
                    setActiveTab('current')
                    navigate('/notifications')
                  }}
                >
                  Notifications
                </button>
              </nav>
            </div>

            {activeTab === 'current' && (
              <SmartTable
                data={data?.items ?? []}
                dataRowKey="id"
                toolbar={true}
                height={
                  data?.items?.length === 0
                    ? calcWindowHeight(218)
                    : calcWindowHeight(150)
                }
                // search={true}
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
                actionProps={[]}
                columnToggle
                externalActions={true}
              />
            )}

            {activeTab === 'history' && (
              <div className="flex flex-col gap-4">
                <SmartTable
                  data={historyTable.items}
                  dataRowKey="id"
                  toolbar={true}
                  height={
                    historyTable.items.length === 0
                      ? calcWindowHeight(218)
                      : calcWindowHeight(150)
                  }
                  searchValue={historySearch}
                  onSearchChange={(val) => {
                    setHistorySearch(val)
                    if (historyDebounce) clearTimeout(historyDebounce)
                    const t = setTimeout(() => {
                      setHistoryPagination((prev) => ({ ...prev, page: 1 }))
                    }, 300)
                    setHistoryDebounce(t)
                  }}
                  onSearch={() =>
                    fetchHistory({
                      page: 1,
                      per_page: historyPagination.per_page,
                      search: historySearch,
                    })
                  }
                  isLoading={historyTable.isLoading}
                  columns={historyColumns}
                  pagination={true}
                  paginationProps={{
                    onPagination: (page) =>
                      setHistoryPagination((prev) => ({ ...prev, page })),
                    total: historyTable.total,
                    currentPage: historyPagination.page,
                    rowsPerPage: historyPagination.per_page,
                    onRowsPerPage: (count: number | string) =>
                      setHistoryPagination({
                        page: 1,
                        per_page: Number(count),
                      }),
                    totalPages: Math.max(
                      1,
                      Math.ceil(historyTable.total / historyPagination.per_page)
                    ),
                    dropOptions: [10, 20, 30, 50, 100],
                  }}
                  actionProps={historyActions}
                  externalActions={true}
                />
              </div>
            )}
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
          {/* <ConfirmDeleteModal
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
          /> */}
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

          <CreateBatchDialog
            isOpen={isCreateBatchOpen}
            loading={editingBatchId ? isBatchUpdating : isBatchCreating}
            form={batchForm}
            getUsers={getUserOptions}
            onClose={handleCloseCreateBatch}
            onSubmit={handleCreateBatch}
            onChange={handleBatchFormChange}
            title={editingBatchId ? 'Update Batch' : 'Create Batch'}
            actionLabel={editingBatchId ? 'Update' : 'Create'}
          />

          <ConfirmDeleteModal
            isOpen={isDeleteBatchOpen}
            onClose={() => {
              setIsDeleteBatchOpen(false)
              setDeleteBatchId(null)
            }}
            onConfirm={handleConfirmDeleteBatch}
            loading={isBatchDeleting}
            title={'Delete Batch?'}
            subTitle={'This action will remove the batch for all members.'}
            confirmLabel="Delete"
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
