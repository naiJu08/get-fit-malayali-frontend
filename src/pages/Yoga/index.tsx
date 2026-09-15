import SmartTable from '../../components/common/table/SmartTable'
import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useSnackbar } from 'notistack'
import { useQuery } from '@tanstack/react-query'

import { getData } from '../../apis/api.helpers'
import apiUrl from '../../apis/api.url'
import { TableColumns } from '../../common/types'
import InfoBox from '../../components/app/alertBox/infoBox'
import ListingHeader from '../../components/common/ListingTiles'
import Icons from '../../components/common/icons'
import { checkPermissions } from '../../layout/store'
import { useAuthStore } from '../../store/authStore'
import { useAdminUserFilterStore } from '../../store/filterSore/adminUserStore'
import { calcWindowHeight } from '../../utilities/calcHeight'
import { getSortedColumnName } from '../../utilities/parsers'
import { handleReturnEmptyMsg } from '../../utilities/validation'
import {
  getYogaDetails,
  useYogaList,
  DISABLE_NONLOGIN_APIS,
  deleteYoga,
} from './api'
import { getColumns } from './columns'
import CreateAdmin from './create'
import ConfirmDeleteModal from '../../components/common/modal/ConfirmDeleteModal'

export default function YogaMain() {
  const navigate = useNavigate()
  const { enqueueSnackbar } = useSnackbar()
  const [columns, setColumns] = useState<TableColumns[]>([])
  const [createOpen, setCreateOpen] = useState(false)
  const [viewMode, setViewMode] = useState(false)
  const [edit, setEdit] = useState(false)
  const [rowData, setRowData] = useState<any>()
  const [editViewIndicator, setEditViewIndicator] = useState(false)
  const [viewIndicator, setViewIndicator] = useState(false)
  const [searchDebounce, setSearchDebounce] = useState<any>(null)
  const [deleteYogaModal, setDeleteYogaModal] = useState(false)
  const [deleteYogaId, setDeleteYogaId] = useState<string>('')
  const [loader, setLoader] = useState(false)
  const { roleData } = useAuthStore()
  const isNutritionist = roleData?.name === 'nutritionist'
  const params = useParams()
  const location = useLocation()

  const { pageParams, setPageParams } = useAdminUserFilterStore()
  const { page, per_page, search, ordering, filters } = pageParams
  const searchParams = {
    page: page,
    per_page: per_page || 10,
    search: search,
    ordering: ordering,
    ...filters,
  }

  const { data, refetch, isFetching } = useYogaList(searchParams)
  useEffect(() => {
    if (pageParams?.search) {
      setPageParams({ ...pageParams, search: '', page: 1 })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const totalCount = data?.meta?.total_count
  const calculatedTotalPages =
    typeof totalCount === 'number'
      ? Math.max(1, Math.ceil(totalCount / Number(pageParams?.per_page ?? 10)))
      : null

  useEffect(() => {
    if (calculatedTotalPages !== null && !isFetching) {
      if ((pageParams?.page ?? 1) > calculatedTotalPages) {
        setPageParams({ ...pageParams, page: calculatedTotalPages })
      } else if ((pageParams?.page ?? 1) < 1) {
        setPageParams({ ...pageParams, page: 1 })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calculatedTotalPages, isFetching])
  // Refetch when filters/pagination/sort/search change (align with Notifications)
  useEffect(() => {
    refetch()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, per_page, search, ordering, JSON.stringify(filters)])

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
      const data = await getYogaDetails(String(row?.id))
      setRowData((data as any)?.yoga ?? data)
      setViewMode(true)
      setCreateOpen(true)
    }
  }
  useEffect(() => {
    setColumns(
      getColumns({
        onViewAction: onViewAction,
        onNameClick: (row: any) => navigate(`/yoga/${row?.id}`),
      })
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const currentParams = useAdminUserFilterStore.getState().pageParams
    useAdminUserFilterStore.getState().setPageParams({
      ...currentParams,
      page: 1,
      search: '',
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname])
  const handleEdit = async (rowData: any) => {
    if (rowData?.id) {
      const data = await getYogaDetails(String(rowData?.id))
      setRowData((data as any)?.yoga ?? data)
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
  const handleDeleteYoga = async () => {
    if (!deleteYogaId) return
    try {
      setLoader(true)
      const res: any = await deleteYoga(String(deleteYogaId))
      enqueueSnackbar(res?.message || 'Yoga deleted successfully', {
        variant: 'success',
      })
      setDeleteYogaModal(false)
      setDeleteYogaId('')
      refetch()
    } catch (error: any) {
      console.error('Delete yoga error:', error)

      // Extract error message from response
      let errorMessage = 'Failed to delete yoga'

      if (error?.response?.data?.errors) {
        // If response has errors array, use the first error
        errorMessage = error.response.data.errors[0]
      } else if (error?.response?.data?.message) {
        // If response has message field
        errorMessage = error.response.data.message
      } else if (error?.message) {
        // Fallback to error message
        errorMessage = error.message
      }

      // Show the error message to user
      enqueueSnackbar(errorMessage, { variant: 'error' })

      // Close the delete modal after showing error
      setDeleteYogaModal(false)
      setDeleteYogaId('')
    } finally {
      setLoader(false)
    }
  }
  const basicData = {
    title: 'Yoga',
    icon: 'yoga-icon',
  }
  const openDrawer = () => {
    setCreateOpen(true)
    setRowData({})
  }
  const headerProps = {
    actionTitle: 'Create Yoga',
  }
  const handleSort = (orderColumn: any, orderDirection: any) => {
    setPageParams({
      ...pageParams,
      sortColumn: orderColumn,
      sortType: orderDirection,
      ordering: getSortedColumnName(orderColumn, orderDirection),
    })
  }

  const intensityOptions = useMemo(() => ['Moderate', 'High', 'Low'], [])

  const { data: categoriesResponse, isLoading: categoriesLoading } = useQuery(
    ['yoga-filter-categories'],
    () => getData(`${apiUrl.CATEGORIES}?category_type=yoga`)
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

  const currentIntensity = (filters as any)?.intensity_level || ''
  const onIntensityChange = (val: string) => {
    const newFilters = { ...(filters || {}) }
    if (val) newFilters.intensity_level = val
    else delete (newFilters as any).intensity_level
    setPageParams({ ...pageParams, filters: newFilters, page: 1 })
  }

  const onCategoryChange = (val: string) => {
    const newFilters = { ...(filters || {}) }
    if (val) newFilters.category_id = Number(val)
    else delete (newFilters as any).category_id
    delete (newFilters as any).subcategory_ids
    setPageParams({ ...pageParams, filters: newFilters, page: 1 })
  }

  const onSubcategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value
    const newFilters = { ...(filters || {}) }
    if (val) newFilters.subcategory_ids = val
    else delete (newFilters as any).subcategory_ids
    setPageParams({ ...pageParams, filters: newFilters, page: 1 })
  }

  const capitalizeWords = (val?: string) => {
    if (!val) return ''
    return val.charAt(0).toUpperCase() + val.slice(1).toLowerCase()
  }

  const actions: any[] = []

  if (!isNutritionist) {
    actions.push(
      {
        icon: <Icons name="eye" />,
        action: (row: any) => navigate(`/yoga/${row?.id}`),
        title: 'View',
        toolTip: 'View',
      },
      {
        icon: <Icons name="edit" />,
        action: (row: any) => handleEdit(row),
        title: 'Edit',
        toolTip: 'Edit',
      },
      {
        icon: <Icons name="table-delete" />,
        action: (row: any) => {
          if (!row?.id) return
          setDeleteYogaId(String(row.id))
          setDeleteYogaModal(true)
        },
        title: 'Delete',
        toolTip: 'Delete',
      }
    )
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
            onActionClick={isNutritionist ? undefined : openDrawer}
            actionProps={headerProps}
            checkPermission={
              !isNutritionist && checkPermissions('Employee', 'create')
            }
          />
          <div className=" p-4">
            <SmartTable
              data={data?.yogas ?? []}
              dataRowKey="id"
              toolbar={true}
              toolbarExtra={
                <div className="flex items-end gap-3">
                  <div className="flex flex-col gap-1 ">
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
                (data?.yogas?.length ?? 0) === 0
                  ? calcWindowHeight(218)
                  : calcWindowHeight(150)
              }
              search={true}
              searchPlaceholder="Search Yoga Name"
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
                currentPage: pageParams?.page ?? 1,
                rowsPerPage: Number(
                  pageParams?.per_page ?? data?.meta?.per_page ?? 10
                ),
                onRowsPerPage: onChangeRowsPerPage,
                totalPages: calculatedTotalPages ?? 1,
                dropOptions: [10, 20, 30, 50, 100],
              }}
              actionProps={actions}
              columnToggle
              externalActions={true}
            />
          </div>
          <ConfirmDeleteModal
            isOpen={deleteYogaModal}
            onClose={() => setDeleteYogaModal(false)}
            onConfirm={() => handleDeleteYoga()}
            loading={loader}
            title={'Are you sure?'}
            subTitle={
              'Do you really want to delete this yoga? This process cannot be undone.'
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
