import SmartTable from '../../components/common/table/SmartTable'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { TableColumns } from '../../common/types'
import InfoBox from '../../components/app/alertBox/infoBox'
import ResetPassword from '../../components/app/resetPassword'
import DialogModal from '../../components/common/modal/DialogModal'
import DynamicDropdown from '../../components/common/DynamicDropdown'
import FreezeUserModal from '../../components/common/modal/FreezeUserModal'
import ConfirmDeleteModal from '../../components/common/modal/ConfirmDeleteModal'
import Icons from '../../components/common/icons'
import ListingHeader from '../../components/common/ListingTiles'
import { useSnackbarManager } from '../../components/common/snackbar'
import { useAdminUserFilterStore } from '../../store/filterSore/adminUserStore'
import { calcWindowHeight } from '../../utilities/calcHeight'
import { getSortedColumnName } from '../../utilities/parsers'
import { handleReturnEmptyMsg } from '../../utilities/validation'
import { getData } from '../../apis/api.helpers'
import apiUrl from '../../apis/api.url'
import {
  getAdminDetails,
  useAdminUser,
  DISABLE_NONLOGIN_APIS,
  deleteAdmin,
  freezeUser,
  unfreezeUser,
} from './api'
import { getColumns } from './columns'
import CreateAdmin from './create'
export default function Subscriptions() {
  const navigate = useNavigate()
  const [columns, setColumns] = useState<TableColumns[]>([])
  const { enqueueSnackbar } = useSnackbarManager()
  const [createOpen, setCreateOpen] = useState(false)
  const [viewMode, setViewMode] = useState(false)
  const [edit, setEdit] = useState(false)
  const [rowData, setRowData] = useState<any>()
  const [changePassword, setChangePassword] = useState(false)
  const [userName, setUserName] = useState('')
  const [userId, setUserId] = useState('')
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
  const [selectedUnfreezeDates, setSelectedUnfreezeDates] = useState<string[]>(
    []
  )
  const [planIdFilter, setPlanIdFilter] = useState<string>('')
  const [planLabel, setPlanLabel] = useState<string>('All Plans')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [statusLabel, setStatusLabel] = useState<string>('All')
  const [plansCache, setPlansCache] = useState<Record<string, string>>({})
  const plansDropdownRef = useRef<{ id: any; value: string }[] | null>(null)
  const location = useLocation()
  const [editViewIndicator, setEditViewIndicator] = useState(false)
  const [viewIndicator, setViewIndicator] = useState(false)
  const [loader, setloader] = useState(false)

  const params = useParams()

  const { pageParams, setPageParams } = useAdminUserFilterStore()
  const { page, page_size, search, ordering, filters } = pageParams
  const searchParams = {
    page: page,
    per_page: page_size,
    search: search,
    ordering: ordering,
    ...filters,
  }
  useEffect(() => {
    if (pageParams?.search) {
      setPageParams({ ...pageParams, search: '', page: 1 })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  // Reset all filters once on initial mount (after a full refresh)
  const didInitRef = useRef(false)
  useEffect(() => {
    if (!didInitRef.current) {
      didInitRef.current = true
      setPlanIdFilter('')
      setStatusFilter('')
      setPlanLabel('All Plans')
      setStatusLabel('All')
      setPageParams({ ...pageParams, search: '', filters: {}, page: 1 })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Sync UI state with persisted filters so selections remain after refresh/navigation
  useEffect(() => {
    const planFromStore = (filters as any)?.plan_id
    setPlanIdFilter(planFromStore ? String(planFromStore) : '')
    const statusFromStore = (filters as any)?.status
    setStatusFilter(statusFromStore ? String(statusFromStore) : '')

    const s = statusFromStore ? String(statusFromStore) : ''
    setStatusLabel(
      s === 'active'
        ? 'Active'
        : s === 'paused'
          ? 'Paused'
          : s === 'expired'
            ? 'Expired'
            : 'All'
    )

    // Prefer cached label; otherwise resolve plan name so it shows after refresh
    if (planFromStore) {
      const cached = plansCache[String(planFromStore)]
      if (cached) {
        setPlanLabel(cached)
      } else {
        resolvePlanLabel(planFromStore)
      }
    } else {
      setPlanLabel('All Plans')
    }
  }, [filters])
  useEffect(() => {
    const nextFilters: any = { ...(pageParams?.filters || {}) }
    const hadPlanFilter = Object.prototype.hasOwnProperty.call(
      nextFilters,
      'plan_id'
    )
    if (hadPlanFilter) delete nextFilters.plan_id

    setPageParams({
      ...pageParams,
      page: 1,
      search: '',
      filters: nextFilters,
    })

    if (hadPlanFilter) {
      setPlanIdFilter('')
      setPlanLabel('All Plans')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, setPageParams])
  const resolvePlanLabel = async (id?: number | string) => {
    if (!id) {
      setPlanLabel('All Plans')
      return
    }
    // Keep previous label until we fetch the actual name; do not override with placeholders
    try {
      const res: any = await getData(`${apiUrl.PLANS}/${id}`)
      const name =
        res?.name ?? res?.plan_name ?? res?.data?.name ?? res?.data?.plan_name
      if (name) setPlanLabel(String(name))
    } catch {
      // ignore, keep current label
    }
  }

  const isFrozen = useCallback((rowData: any) => {
    const val = String(rowData?.status ?? '').toLowerCase()
    return val === 'suspended' || val === 'paused'
  }, [])

  const normalizeDate = (value: any) => {
    if (!value) return ''
    if (typeof value === 'number') return ''
    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) return ''
    return new Date(
      Date.UTC(parsed.getFullYear(), parsed.getMonth(), parsed.getDate())
    )
      .toISOString()
      .slice(0, 10)
  }

  const handleFreezeChange = ({
    name,
    value,
  }: {
    name: string
    value: any
  }) => {
    if (name === 'start_date' || name === 'end_date') {
      const normalized = normalizeDate(value)
      setFreezeForm((prev) => {
        const next = { ...prev, [name]: normalized }
        if (
          name === 'start_date' &&
          next.end_date &&
          normalized > next.end_date
        ) {
          next.end_date = normalized
        }
        if (
          name === 'end_date' &&
          next.start_date &&
          normalized &&
          normalized < next.start_date
        ) {
          next.start_date = normalized
        }
        return next
      })
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

  const freezeWindow = useMemo(
    () => ({
      start: normalizeDate(toggleFreezeRow?.start_date),
      end: normalizeDate(toggleFreezeRow?.end_date),
    }),
    [toggleFreezeRow]
  )

  const availableUnfreezeDates = useMemo(() => {
    if (!toggleFreezeRow) return []
    const unique = new Set<string>()

    const addDate = (value: any) => {
      const normalized = normalizeDate(value)
      if (normalized) unique.add(normalized)
    }

    const addFromString = (value: string) => {
      if (!value) return
      const matches = value.match(/\d{4}-\d{2}-\d{2}/g)
      if (matches?.length) {
        matches.forEach((m) => addDate(m))
        return
      }

      value
        .split(/[\s,]+/)
        .map((s) => s.trim())
        .filter(Boolean)
        .forEach((s) => addDate(s))
    }

    const pushValue = (value: any) => {
      if (value === null || value === undefined) return
      if (Array.isArray(value)) {
        value.forEach(pushValue)
        return
      }
      if (typeof value === 'string') {
        addFromString(value)
        return
      }
      if (value instanceof Date) {
        addDate(value)
        return
      }
      if (typeof value === 'object') {
        const maybeDate =
          (value as any)?.date ??
          (value as any)?.day ??
          (value as any)?.freeze_date ??
          (value as any)?.start_date ??
          (value as any)?.end_date
        if (maybeDate) addDate(maybeDate)
        Object.values(value).forEach(pushValue)
        return
      }

      addDate(value)
    }

    const directCandidates = [
      toggleFreezeRow?.freeze_dates,
      toggleFreezeRow?.freeze_date,
      toggleFreezeRow?.freeze_start_date,
      toggleFreezeRow?.freeze_start,
      toggleFreezeRow?.frozen_days,
      toggleFreezeRow?.paused_dates,
      toggleFreezeRow?.pause_dates,
    ]
    directCandidates.forEach(pushValue)

    Object.keys(toggleFreezeRow).forEach((k) => {
      const key = String(k).toLowerCase()
      if (
        !key.includes('freeze') &&
        !key.includes('frozen') &&
        !key.includes('pause')
      )
        return
      if (!key.includes('date') && key !== 'frozen_days') return
      pushValue((toggleFreezeRow as any)[k])
    })

    return Array.from(unique).sort()
  }, [toggleFreezeRow])

  useEffect(() => {
    if (!toggleFreezeRow) {
      setFreezeForm({ reason: '', start_date: '', end_date: '' })
      return
    }
    setFreezeForm((prev) => ({
      ...prev,
      reason: '',
      start_date: '',
      end_date: '',
    }))
  }, [freezeWindow.end, freezeWindow.start, toggleFreezeRow])

  useEffect(() => {
    if (!toggleFreezeOpen || !toggleFreezeRow || !isFrozen(toggleFreezeRow)) {
      setSelectedUnfreezeDates([])
      return
    }
    setSelectedUnfreezeDates([])
  }, [availableUnfreezeDates, isFrozen, toggleFreezeOpen, toggleFreezeRow])

  const closeFreezeDialog = useCallback(() => {
    setToggleFreezeOpen(false)
    setToggleFreezeRow(null)
    setSelectedUnfreezeDates([])
    setFreezeForm({ reason: '', start_date: '', end_date: '' })
  }, [])

  const handleToggleUnfreezeDate = (value: string) => {
    setSelectedUnfreezeDates((prev) => {
      if (prev.includes(value)) {
        return prev.filter((d) => d !== value)
      }
      return [...prev, value].sort()
    })
  }

  const formatDisplayDate = (value: string) => {
    if (!value) return ''
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return value
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const handleConfirmToggleFreeze = async () => {
    if (!toggleFreezeRow) return
    const rowIsFrozen = isFrozen(toggleFreezeRow)
    if (rowIsFrozen && selectedUnfreezeDates.length === 0) {
      enqueueSnackbar('Select at least one date to unfreeze', {
        variant: 'warning',
      })
      return
    }

    if (!rowIsFrozen) {
      const { reason, start_date, end_date } = freezeForm
      if (!reason || !start_date || !end_date) {
        enqueueSnackbar('Please fill reason, start date and end date', {
          variant: 'warning',
        })
        return
      }
    }

    try {
      setloader(true)
      if (rowIsFrozen) {
        await unfreezeUser(String(toggleFreezeRow.id), {
          unfreeze_dates: selectedUnfreezeDates,
        })
        enqueueSnackbar('Subscription unfrozen successfully', {
          variant: 'success',
        })
      } else {
        const { reason, start_date, end_date } = freezeForm
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
      closeFreezeDialog()
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
  const handleClientNameClick = useCallback(
    (row: any) => {
      if (row?.id) {
        navigate(`/subscriptions/${row.id}`)
      }
    },
    [navigate]
  )

  useEffect(() => {
    setColumns(getColumns(handleClientNameClick))
  }, [handleClientNameClick])

  const handleSeach = (key?: string) => {
    setPageParams({
      ...pageParams,
      search: key as string,
      page: 1,
    })
  }

  const applyPlanFilter = (val?: string) => {
    const value = typeof val === 'string' ? val : planIdFilter
    const nextFilters: any = { ...(pageParams?.filters || {}) }
    if (value?.trim()) {
      nextFilters.plan_id = Number(value)
    } else {
      delete nextFilters.plan_id
    }
    setPageParams({
      ...pageParams,
      filters: nextFilters,
      page: 1,
    })
  }

  const applyStatusFilter = (value: string) => {
    setStatusFilter(value)
    const nextFilters: any = { ...(pageParams?.filters || {}) }
    if (value?.trim()) {
      nextFilters.status = value
    } else {
      delete nextFilters.status
    }
    setPageParams({ ...pageParams, filters: nextFilters, page: 1 })
  }

  const getStatusDropdown = async () => {
    return [
      { id: null, value: 'All' },
      { id: 'active', value: 'Active' },
      { id: 'paused', value: 'Paused' },
      { id: 'expired', value: 'Expired' },
    ]
  }

  const getPlansDropdown = useCallback(async (search: string) => {
    if (!plansDropdownRef.current) {
      const params = new URLSearchParams()
      params.set('per_page', '1000')
      const url = `${apiUrl.PLANS}?${params.toString()}`
      const res = await getData(url)
      const items: any[] = Array.isArray(res)
        ? (res as any[])
        : (res?.items ?? res?.plans ?? [])
      const mapped = items.map((p: any) => ({
        id: p?.id,
        value: p?.name ?? p?.plan_name ?? 'Plan',
      }))
      plansDropdownRef.current = mapped
      // update local cache for instant label setting on selection
      setPlansCache((prev) => {
        const nextCache: Record<string, string> = { ...prev }
        for (const it of mapped) {
          if (it?.id != null) nextCache[String(it.id)] = it.value
        }
        return nextCache
      })
    }

    const source = plansDropdownRef.current ?? []
    const normalizedSearch = search?.trim().toLowerCase()
    const filtered = normalizedSearch
      ? source.filter((item) =>
          item?.value?.toLowerCase().includes(normalizedSearch)
        )
      : source

    // Prepend an 'All Plans' option so users can clear via the dropdown
    return [{ id: null, value: 'All Plans' }, ...filtered]
  }, [])

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
    title: 'Subscriptions',
    icon: 'subscription',
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
          <DialogModal
            isOpen={toggleFreezeOpen}
            onClose={closeFreezeDialog}
            title={
              isFrozen(toggleFreezeRow)
                ? 'Unfreeze Subscription'
                : 'Freeze Subscription'
            }
            onSubmit={handleConfirmToggleFreeze}
            secondaryAction={closeFreezeDialog}
            secondaryActionLabel="Cancel"
            actionLabel={isFrozen(toggleFreezeRow) ? 'Unfreeze' : 'Freeze'}
            actionLoader={loader}
            body={
              isFrozen(toggleFreezeRow) ? (
                availableUnfreezeDates.length ? (
                  <div className="flex flex-col gap-4">
                    {/* Description */}
                    <p className="text-sm text-gray-500">
                      Choose the frozen days you’d like to unfreeze.
                    </p>

                    {/* Dates container */}
                    <div className="max-h-60 overflow-y-auto rounded-xl border border-gray-200 bg-gray-50 p-3">
                      <div className="grid grid-cols-2 gap-3">
                        {availableUnfreezeDates.map((date) => {
                          const checked = selectedUnfreezeDates.includes(date)

                          return (
                            <label
                              key={date}
                              className={`flex items-center gap-3 rounded-lg border px-3 py-2 text-xs cursor-pointer transition
              ${
                checked
                  ? 'border-primary bg-white text-primary'
                  : 'border-gray-200 bg-white hover:border-primary/40 hover:bg-primary/5'
              }`}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => handleToggleUnfreezeDate(date)}
                                className="h-4 w-4 accent-primary"
                              />
                              <span className="font-medium">
                                {formatDisplayDate(date)}
                              </span>
                            </label>
                          )
                        })}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-xs">
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedUnfreezeDates(availableUnfreezeDates)
                        }
                        className="rounded-lg border border-primary/30 bg-primary/10 px-3 py-1 font-semibold text-gray-600
               hover:bg-primaryGreen/10 hover:border-primaryBlue hover:text-primaryBlue transition"
                      >
                        Select all
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedUnfreezeDates([])}
                        className="rounded-lg border border-gray-300 bg-white px-3 py-1 font-semibold text-gray-600
               hover:border-red-400 hover:text-red-600 hover:bg-red-50 transition"
                      >
                        Clear all
                      </button>
                    </div>
                  </div>
                ) : (
                  <InfoBox
                    content={'No freeze dates are available to unfreeze.'}
                  />
                )
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
                        min={freezeWindow.start || undefined}
                        max={
                          freezeForm.end_date || freezeWindow.end || undefined
                        }
                        placeholder="Select start date"
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
                        min={
                          freezeForm.start_date ||
                          freezeWindow.start ||
                          undefined
                        }
                        max={freezeWindow.end || undefined}
                        placeholder="Select end date"
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
              search={true}
              searchPlaceholder="Search"
              searchValue={pageParams?.search || ''}
              onSearchChange={(val) =>
                setPageParams({ ...pageParams, search: val, page: 1 })
              }
              onSearch={(val) => handleSeach(val)}
              toolbarExtra={
                <div className="flex items-end gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-gray-600">Plan</label>
                    <div className="w-64 flex flex-col gap-1 z-20 border p-[12px] rounded-lg bg-white text-xs">
                      <DynamicDropdown
                        key={`plan-dd-${planIdFilter || 'all'}-${planLabel}`}
                        tileItem={{ label: 'Plan', value: planLabel }}
                        value={planIdFilter}
                        getData={getPlansDropdown}
                        hideLoader
                        setUpdateCREId={(id: any) => {
                          const v = id ? String(id) : ''
                          setPlanIdFilter(v)
                          if (v) {
                            const cached = plansCache?.[v]
                            if (cached) setPlanLabel(cached)
                          } else {
                            setPlanLabel('All Plans')
                          }
                          applyPlanFilter(v)
                          if (v && !plansCache?.[v]) resolvePlanLabel(v)
                        }}
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 ">
                    <label className="text-xs text-gray-600">Status</label>
                    <div className="w-64 flex flex-col gap-1 z-20 border p-[12px] rounded-lg bg-white text-xs">
                      <DynamicDropdown
                        key={`status-dd-${statusFilter || 'all'}-${statusLabel}`}
                        tileItem={{ label: 'Status', value: statusLabel }}
                        value={statusFilter}
                        getData={getStatusDropdown as any}
                        hideSearch
                        hideLoader
                        setUpdateCREId={(id: any) => {
                          const v = id ? String(id) : ''
                          setStatusFilter(v)
                          setStatusLabel(
                            v === 'active'
                              ? 'Active'
                              : v === 'paused'
                                ? 'Paused'
                                : v === 'expired'
                                  ? 'Expired'
                                  : 'All'
                          )
                          applyStatusFilter(v)
                        }}
                      />
                    </div>
                  </div>
                </div>
              }
              height={
                data?.items?.length === 0
                  ? calcWindowHeight(150)
                  : calcWindowHeight(150)
              }
              isLoading={isFetching}
              sortType={pageParams.sortType as any}
              sortColumn={pageParams.sortColumn as any}
              handleColumnSort={handleSort}
              emptyTitle="No records to display"
              emptySubTitle={handleReturnEmptyMsg(search)}
              columns={columns}
              pagination={true}
              paginationProps={{
                onPagination: onChangePage,
                total: data?.total ?? 0,
                currentPage: pageParams?.page ?? 1,
                rowsPerPage: Number(pageParams?.page_size ?? 10),
                onRowsPerPage: onChangeRowsPerPage,
                dropOptions: [10, 20, 30, 50, 100],
              }}
              actionProps={[
                {
                  icon: <Icons name="eye" />,
                  action: (row) => navigate(`/subscriptions/${row?.id}`),
                  title: 'View',
                  toolTip: 'View Details',
                },
                {
                  title: 'Freeze',
                  action: (row) => {
                    setFreezeForm({ reason: '', start_date: '', end_date: '' })
                    setSelectedUnfreezeDates([])
                    setToggleFreezeRow(row)
                    setToggleFreezeOpen(true)
                  },
                  icon: <Icons name="lock-icon" />,
                  toolTip: 'Toggle Freeze',
                  hide: (rowData: any) =>
                    String(rowData?.status ?? '').toLowerCase() === 'active'
                      ? false
                      : true,
                },
                {
                  title: 'Unfreeze',
                  action: (row) => {
                    setFreezeForm({ reason: '', start_date: '', end_date: '' })
                    setSelectedUnfreezeDates([])
                    setToggleFreezeRow(row)
                    setToggleFreezeOpen(true)
                  },
                  icon: <Icons name="lock-icon" />,
                  toolTip: 'Toggle Freeze',
                  hide: (rowData: any) => (isFrozen(rowData) ? false : true),
                },
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

          <CreateAdmin
            isDrawerOpen={createOpen}
            rowData={rowData}
            edit={edit}
            viewMode={viewMode}
            paramsId={params?.id}
            handleClose={handleClose}
            handleRefresh={handleRefresh}
          />
        </>
      )}
    </div>
  )
}
