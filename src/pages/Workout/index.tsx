import SmartTable from '../../components/common/table/SmartTable'
import { ChangeEvent, useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'

import { TableColumns } from '../../common/types'
import { getData } from '../../apis/api.helpers'
import apiUrl from '../../apis/api.url'
import InfoBox from '../../components/app/alertBox/infoBox'
import Icons from '../../components/common/icons'
import ListingHeader from '../../components/common/ListingTiles'
import ConfirmDeleteModal from '../../components/common/modal/ConfirmDeleteModal'
import { checkPermissions } from '../../layout/store'
import { useAdminUserFilterStore } from '../../store/filterSore/adminUserStore'
import { useAuthStore } from '../../store/authStore'
import { calcWindowHeight } from '../../utilities/calcHeight'
import { getSortedColumnName } from '../../utilities/parsers'
import { handleReturnEmptyMsg } from '../../utilities/validation'
import { useSnackbarManager } from '../../components/common/snackbar'
import {
  getWorkoutDetails,
  useWorkoutList,
  DISABLE_NONLOGIN_APIS,
  deleteWorkout,
} from './api'
import { getColumns } from './columns'
import CreateAdmin from './create'
import { useLocation, useNavigate, useParams } from 'react-router-dom'

export default function WorkoutMain() {
  const navigate = useNavigate()
  const location = useLocation()
  const { enqueueSnackbar } = useSnackbarManager()
  const roleName = useAuthStore((s) => s.roleData?.name?.toLowerCase?.())
  const isNutritionist = roleName === 'nutritionist'
  const [columns, setColumns] = useState<TableColumns[]>([])
  const [createOpen, setCreateOpen] = useState(false)
  const [viewMode, setViewMode] = useState(false)
  const [edit, setEdit] = useState(false)
  const [rowData, setRowData] = useState<any>()
  const [editViewIndicator, setEditViewIndicator] = useState(false)
  const [viewIndicator, setViewIndicator] = useState(false)
  const [searchDebounce, setSearchDebounce] = useState<any>(null)
  const [deleteWorkoutModal, setDeleteWorkoutModal] = useState(false)
  const [deletingWorkout, setDeletingWorkout] = useState(false)
  const [workoutToDelete, setWorkoutToDelete] = useState<any>(null)

  const params = useParams()

  const { pageParams, setPageParams } = useAdminUserFilterStore()
  const { page, per_page, search, ordering, filters } = pageParams
  const cleanedFilters: any = { ...(filters || {}) }
  if (cleanedFilters.active === false || cleanedFilters.active === 'false') {
    delete cleanedFilters.active
  }
  const searchParams = {
    page: page,
    per_page: per_page,
    search: search,
    ...(ordering ? { ordering } : {}),
    ...cleanedFilters,
  }

  const { data, refetch, isFetching } = useWorkoutList(searchParams)
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
  const onChangePage = (row: number) => {
    setPageParams({
      ...pageParams,
      page: row,
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
    if (row?.id) {
      const data = await getWorkoutDetails(String(row?.id))
      setRowData((data as any)?.workout ?? data)
      setViewMode(true)
      setCreateOpen(true)
    }
  }

  const handleDelete = async (rowData: any) => {
    if (!rowData?.id) return
    try {
      setDeletingWorkout(true)
      await deleteWorkout(String(rowData.id))
      enqueueSnackbar('Workout deleted successfully', { variant: 'success' })
      setDeleteWorkoutModal(false)
      setWorkoutToDelete(null)
      refetch()
    } catch (err: any) {
      enqueueSnackbar(
        err?.response?.data?.message || 'Failed to delete workout',
        { variant: 'error' }
      )
    } finally {
      setDeletingWorkout(false)
    }
  }
  useEffect(() => {
    setColumns(
      getColumns({
        onNameClick: (row: any) => navigate(`/workout/${row?.id}`),
        disableNameLink: false,
      })
    )
  }, [isNutritionist, navigate])
  useEffect(() => {
    const sanitizedFilters = { ...(pageParams?.filters || {}) }
    delete (sanitizedFilters as any).category_id
    delete (sanitizedFilters as any).subcategory_ids

    setPageParams({
      ...pageParams,
      page: 1,
      search: '',
      sortColumn: undefined,
      sortType: undefined,
      ordering: undefined,
      filters: sanitizedFilters,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, setPageParams])
  // const handleSeach = (key?: string) => {
  //   setPageParams({
  //     ...pageParams,
  //     search: key as string,
  //     page: 1,
  //   })
  // }

  const handleEdit = async (rowData: any) => {
    if (rowData?.id) {
      setRowData(undefined)
      const data = await getWorkoutDetails(String(rowData?.id))
      setRowData((data as any)?.workout ?? data)
      setCreateOpen(true)
      setViewMode(false)
      setEdit(true)
    }
  }

  const handleClose = () => {
    setCreateOpen(false)
    setViewMode(false)
    setEdit(false)
    setRowData(undefined)
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
    title: 'Workouts',
    icon: 'workout',
  }
  const openDrawer = () => {
    if (isNutritionist) return
    setRowData(undefined)
    setCreateOpen(true)
  }
  const headerProps = {
    actionTitle: 'Create Workout',
  }
  const handleSort = (orderColumn: any, orderDirection: any) => {
    if (!orderColumn || !orderDirection) {
      setPageParams({
        ...pageParams,
        sortColumn: undefined,
        sortType: undefined,
        ordering: undefined,
      })
      return
    }
    setPageParams({
      ...pageParams,
      sortColumn: orderColumn,
      sortType: orderDirection,
      ordering: getSortedColumnName(orderColumn, orderDirection),
    })
  }

  const intensityOptions = useMemo(() => ['Moderate', 'High', 'Low'], [])

  const currentIntensity = (filters as any)?.intensity_level || ''
  const onIntensityChange = (val: string) => {
    const newFilters = { ...(filters || {}) }
    if (val) newFilters.intensity_level = val
    else delete (newFilters as any).intensity_level
    setPageParams({ ...pageParams, filters: newFilters, page: 1 })
  }

  const { data: categoriesResponse, isLoading: categoriesLoading } = useQuery(
    ['workout-filter-categories'],
    () => getData(apiUrl.CATEGORIES)
  )

  const categoryOptions = useMemo(
    () =>
      (categoriesResponse?.categories ?? []).map((category: any) => ({
        id: category?.id,
        name: category?.name ?? '-',
        subcategories: Array.isArray(category?.subcategories)
          ? category.subcategories
          : [],
      })),
    [categoriesResponse?.categories]
  )

  const currentCategoryId =
    (filters as any)?.category_id !== undefined &&
    (filters as any)?.category_id !== null
      ? String((filters as any)?.category_id)
      : ''

  const currentSubcategoryIds = useMemo(() => {
    const raw = (filters as any)?.subcategory_ids
    if (!raw) return []
    if (Array.isArray(raw)) return raw.map((item) => String(item))
    return String(raw)
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
  }, [filters])

  const currentSubcategoryValue = currentSubcategoryIds[0] ?? ''

  const selectedCategory = useMemo(
    () =>
      categoryOptions.find(
        (category: { id?: number }) =>
          String(category?.id) === currentCategoryId
      ),
    [categoryOptions, currentCategoryId]
  )

  const subcategoryOptions: { id?: number; name?: string }[] =
    selectedCategory?.subcategories ?? []

  const onCategoryChange = (val: string) => {
    const newFilters = { ...(filters || {}) }
    if (val) newFilters.category_id = Number(val)
    else delete (newFilters as any).category_id
    delete (newFilters as any).subcategory_ids
    setPageParams({ ...pageParams, filters: newFilters, page: 1 })
  }

  const onSubcategoryChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = event.target.value
    const newFilters = { ...(filters || {}) }
    if (selectedValue) newFilters.subcategory_ids = selectedValue
    else delete (newFilters as any).subcategory_ids
    setPageParams({ ...pageParams, filters: newFilters, page: 1 })
  }
  const capitalizeWords = (text: string) =>
    text?.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase())

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
              data={data?.workouts ?? []}
              dataRowKey="id"
              toolbar={true}
              toolbarExtra={
                <div className="flex flex-wrap items-end gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-gray-600">Intensity</label>
                    <select
                      className="w-64 flex flex-col gap-1 z-20 border border-gray-300 p-[11px] rounded-xl bg-white text-xs outline-none focus:outline-none focus:ring-0 focus:border-gray-300"
                      value={currentIntensity}
                      onChange={(e) => onIntensityChange(e.target.value)}
                    >
                      <option value="">All</option>
                      {intensityOptions.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-gray-600">Category</label>
                    <select
                      className="w-64 flex flex-col gap-1 z-20 border border-gray-300 p-[11px] rounded-xl bg-white text-xs outline-none focus:outline-none focus:ring-0 focus:border-gray-300 disabled:bg-gray-100"
                      value={currentCategoryId}
                      onChange={(e) => onCategoryChange(e.target.value)}
                      disabled={categoriesLoading}
                    >
                      <option value="">All</option>
                      {categoryOptions.map((category: any) => (
                        <option key={category.id} value={category.id}>
                          {capitalizeWords(category.name)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-gray-600">Subcategory</label>
                    <select
                      className="w-64 flex flex-col gap-1 z-20 border border-gray-300 p-[11px] rounded-xl bg-white text-xs outline-none focus:outline-none focus:ring-0 focus:border-gray-300 disabled:bg-gray-100"
                      value={currentSubcategoryValue}
                      onChange={onSubcategoryChange}
                      disabled={
                        !currentCategoryId ||
                        (subcategoryOptions?.length ?? 0) === 0
                      }
                    >
                      <option value="" disabled hidden>
                        Select subcategory
                      </option>
                      {subcategoryOptions.length === 0 ? (
                        <option value="" disabled>
                          No subcategories found
                        </option>
                      ) : (
                        subcategoryOptions.map((subcategory) => (
                          <option key={subcategory.id} value={subcategory.id}>
                            {subcategory.name}
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                </div>
              }
              height={
                (data?.workouts?.length ?? 0) === 0
                  ? calcWindowHeight(218)
                  : calcWindowHeight(150)
              }
              search={true}
              searchPlaceholder="Search Workout Name"
              searchValue={pageParams?.search || ''}
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
              emptySubTitle={handleReturnEmptyMsg(search)}
              columns={columns}
              pagination={true}
              paginationProps={{
                onPagination: onChangePage,
                total: data?.meta?.total_count ?? 0,
                currentPage:
                  typeof data?.meta?.current_page === 'number'
                    ? (data?.meta?.current_page as number)
                    : (pageParams?.page ?? 1),
                rowsPerPage: Number(pageParams?.per_page ?? 10),
                onRowsPerPage: onChangeRowsPerPage,
                totalPages: Math.max(
                  1,
                  Math.ceil(
                    (Number(data?.meta?.total_count ?? 0) || 0) /
                      Number(pageParams?.per_page ?? 10)
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
                        action: (row) => navigate(`/workout/${row?.id}`),
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
                        icon: <Icons name="delete" />,
                        action: (row) => {
                          setWorkoutToDelete(row)
                          setDeleteWorkoutModal(true)
                        },
                        title: 'Delete',
                        toolTip: 'Delete',
                      },
                    ]
              }
              columnToggle
              externalActions={true}
            />
          </div>
          <ConfirmDeleteModal
            isOpen={deleteWorkoutModal}
            onClose={() => {
              if (!deletingWorkout) {
                setDeleteWorkoutModal(false)
                setWorkoutToDelete(null)
              }
            }}
            onConfirm={() => workoutToDelete && handleDelete(workoutToDelete)}
            loading={deletingWorkout}
            title={'Are you sure?'}
            subTitle={
              'Do you really want to delete this workout? This process cannot be undone.'
            }
            confirmLabel="Delete"
            cancelLabel="Cancel"
          />
          <CreateAdmin
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
          />
        </>
      )}
    </div>
  )
}
