import SmartTable from '../../components/common/table/SmartTable'
import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'

import { TableColumns } from '../../common/types'
import InfoBox from '../../components/app/alertBox/infoBox'
import Icons from '../../components/common/icons'
import ListingHeader from '../../components/common/ListingTiles'
import { useSnackbarManager } from '../../components/common/snackbar'
import { checkPermissions } from '../../layout/store'
import { useAuthStore } from '../../store/authStore'
import { useAdminUserFilterStore } from '../../store/filterSore/adminUserStore'
import { calcWindowHeight } from '../../utilities/calcHeight'
import { getSortedColumnName } from '../../utilities/parsers'
import { handleReturnEmptyMsg } from '../../utilities/validation'
import {
  getTemplateDetails,
  useTemplateList,
  DISABLE_NONLOGIN_APIS,
  deleteTemplate,
  duplicateTemplate,
} from './api'
import { useDietTemplateCategories } from '../DietTemplateCategories/api'
import { getColumns } from './columns'
import CreateAdmin from './create'
import ConfirmDeleteModal from '../../components/common/modal/ConfirmDeleteModal'

export default function DietTemplateMain() {
  const navigate = useNavigate()
  const [columns, setColumns] = useState<TableColumns[]>([])
  const [createOpen, setCreateOpen] = useState(false)
  const [viewMode, setViewMode] = useState(false)
  const [edit, setEdit] = useState(false)
  const [rowData, setRowData] = useState<any>()
  const [editViewIndicator, setEditViewIndicator] = useState(false)
  const [viewIndicator, setViewIndicator] = useState(false)
  const [searchDebounce, setSearchDebounce] = useState<any>(null)
  const [deleteTemplateModal, setDeleteTemplateModal] = useState(false)
  const [deleteTemplateId, setDeleteTemplateId] = useState<string>('')
  const [deleteTemplateError, setDeleteTemplateError] = useState<string | null>(
    null
  )
  const [duplicateTemplateLoader, setDuplicateTemplateLoader] = useState(false)
  const [loader, setLoader] = useState(false)
  const { roleData } = useAuthStore()
  const isNutritionist = roleData?.name === 'nutritionist'
  const { enqueueSnackbar } = useSnackbarManager()
  const params = useParams()

  const { pageParams, setPageParams } = useAdminUserFilterStore()
  const { page, per_page, search, ordering, filters } = pageParams
  const searchParams = {
    page: page,
    per_page: per_page || 10,
    search: search,
    ordering: ordering,
    ...filters,
  }
  const location = useLocation()
  const { data, refetch, isFetching } = useTemplateList(searchParams)
  const { data: dietTemplateCategoriesData } = useDietTemplateCategories({
    page: 1,
    per_page: 100,
    status: 'active',
  })
  const dietTemplateCategoryOptions = Array.isArray(
    dietTemplateCategoriesData?.diet_template_categories
  )
    ? dietTemplateCategoriesData.diet_template_categories
    : []
  const selectedDietTemplateCategory =
    (filters as any)?.diet_template_category_id || ''
  useEffect(() => {
    if (pageParams?.search) {
      setPageParams({ ...pageParams, search: '', page: 1 })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
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
  useEffect(() => {
    setPageParams({
      ...pageParams,
      page: 1,
      search: '',
      filters: {},
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, setPageParams])
  const onViewAction = async (row: any) => {
    setViewIndicator(true)
    if (row?.id) {
      const data = await getTemplateDetails(String(row?.id))
      setRowData((data as any)?.diet_plan_template ?? data)
      setViewMode(true)
      setCreateOpen(true)
    }
  }
  useEffect(() => {
    setColumns(
      getColumns({
        onViewAction: onViewAction,
        onNameClick: (row: any) => navigate(`/diet-template/${row?.id}`),
      })
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // const handleSeach = (key?: string) => {
  //   setPageParams({
  //     ...pageParams,
  //     search: key as string,
  //     page: 1,
  //   })
  // }

  const handleEdit = async (rowData: any) => {
    if (rowData?.id) {
      const data = await getTemplateDetails(String(rowData?.id))
      setRowData((data as any)?.diet_plan_template ?? data)
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
  const handleDeleteTemplate = async () => {
    if (!deleteTemplateId) return
    try {
      setLoader(true)
      await deleteTemplate(String(deleteTemplateId))
      setDeleteTemplateModal(false)
      setDeleteTemplateId('')
      setDeleteTemplateError(null)
      refetch()
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.errors?.[0] || 'Failed to delete template'
      setDeleteTemplateError(errorMessage)
      enqueueSnackbar(errorMessage, { variant: 'error' })
    } finally {
      setLoader(false)
    }
  }
  const handleDuplicateTemplate = async (row: any) => {
    if (!row?.id || duplicateTemplateLoader) return
    try {
      setDuplicateTemplateLoader(true)
      const response = await duplicateTemplate(String(row.id))
      const message =
        response?.data?.message ||
        response?.message ||
        'Diet template duplicated successfully'
      enqueueSnackbar(message, { variant: 'success' })
      refetch()
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.errors?.[0] ||
        error?.response?.data?.detail ||
        error?.response?.data?.message ||
        'Failed to duplicate template'
      enqueueSnackbar(errorMessage, { variant: 'error' })
    } finally {
      setDuplicateTemplateLoader(false)
    }
  }
  const basicData = {
    title: 'Diet Templates',
    icon: 'template-icon',
  }
  const openDrawer = () => {
    setCreateOpen(true)
    setRowData({})
  }
  const headerProps = {
    actionTitle: 'Create Template',
  }
  const handleSort = (orderColumn: any, orderDirection: any) => {
    setPageParams({
      ...pageParams,
      sortColumn: orderColumn,
      sortType: orderDirection,
      ordering: getSortedColumnName(orderColumn, orderDirection),
    })
  }

  const handleDietTemplateCategoryFilter = (value: string) => {
    const nextFilters = { ...(filters || {}) }
    if (value) {
      nextFilters.diet_template_category_id = value
    } else {
      delete (nextFilters as any).diet_template_category_id
    }
    setPageParams({ ...pageParams, filters: nextFilters, page: 1 })
  }

  // const intensityOptions = useMemo(() => ['Moderate', 'High', 'Low'], [])

  // const currentIntensity = (filters as any)?.intensity_level || ''
  // const onIntensityChange = (val: string) => {
  //   const newFilters = { ...(filters || {}) }
  //   if (val) newFilters.intensity_level = val
  //   else delete (newFilters as any).intensity_level
  //   setPageParams({ ...pageParams, filters: newFilters, page: 1 })
  // }

  const actions: any[] = []

  if (!isNutritionist) {
    actions.push(
      {
        icon: <Icons name="eye" />,
        action: (row: any) => navigate(`/diet-template/${row?.id}`),
        title: 'View',
        toolTip: 'View Details',
      },
      {
        icon: <Icons name="edit" />,
        action: (row: any) => handleEdit(row),
        title: 'Edit',
        toolTip: 'Edit',
      },
      {
        icon: <Icons name="duplicate-icon" />,
        action: (row: any) => handleDuplicateTemplate(row),
        title: 'Duplicate',
        toolTip: 'Duplicate Diet Template',
      },
      {
        icon: <Icons name="table-delete" />,
        action: (row: any) => {
          if (!row?.id) return
          setDeleteTemplateId(String(row.id))
          setDeleteTemplateModal(true)
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
              data={data?.diet_plan_templates ?? []}
              dataRowKey="id"
              toolbar={true}
              toolbarExtra={
                <div className="flex items-end gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-gray-600">
                      Diet Plan Category
                    </label>
                    <select
                      className="w-64 flex flex-col gap-1 z-20 border border-gray-300 p-[11px] rounded-lg bg-white text-xs focus:outline-none focus:ring-0 focus:border-gray-300"
                      value={selectedDietTemplateCategory}
                      onChange={(event) =>
                        handleDietTemplateCategoryFilter(event.target.value)
                      }
                    >
                      <option value="">All</option>
                      {dietTemplateCategoryOptions.map((category: any) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              }
              height={
                (data?.diet_plan_templates?.length ?? 0) === 0
                  ? calcWindowHeight(218)
                  : calcWindowHeight(150)
              }
              search={true}
              searchPlaceholder="Search Title"
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
              actionProps={actions}
              columnToggle
              externalActions={true}
            />
          </div>
          <ConfirmDeleteModal
            isOpen={deleteTemplateModal}
            onClose={() => {
              setDeleteTemplateModal(false)
              setDeleteTemplateError(null)
            }}
            onConfirm={() => handleDeleteTemplate()}
            loading={loader}
            title={'Are you sure?'}
            subTitle={
              deleteTemplateError ||
              'Do you really want to delete this diet template? This process cannot be undone.'
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
