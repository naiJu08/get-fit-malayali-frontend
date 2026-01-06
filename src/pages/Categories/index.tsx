import SmartTable from '../../components/common/table/SmartTable'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { TableColumns } from '../../common/types'
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
  getCategoriesDetails,
  useCategoriesList,
  DISABLE_NONLOGIN_APIS,
  deleteCategories,
} from './api'
import { getColumns } from './columns'
import CreateAdmin from './create'
import { useLocation } from 'react-router-dom'

export default function CategoriesMain() {
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

  const { data, refetch, isFetching } = useCategoriesList(searchParams)
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
  const onViewAction = async (row: any) => {
    setViewIndicator(true)
    if (row?.id) {
      const data = await getCategoriesDetails(String(row?.id))
      setRowData((data as any)?.workout ?? data)
      setViewMode(true)
      setCreateOpen(true)
    }
  }

  const handleDelete = async (rowData: any) => {
    if (!rowData?.id) return
    try {
      setDeletingWorkout(true)
      await deleteCategories(String(rowData.id))
      enqueueSnackbar('Category deleted successfully', { variant: 'success' })
      setDeleteWorkoutModal(false)
      setWorkoutToDelete(null)
      refetch()
    } catch (err: any) {
      enqueueSnackbar(
        err?.response?.data?.message || 'Failed to delete category',
        { variant: 'error' }
      )
    } finally {
      setDeletingWorkout(false)
    }
  }
  useEffect(() => {
    setColumns(
      getColumns({
        onNameClick: (row: any) => navigate(`/categories/${row?.id}`),
        disableNameLink: false,
      })
    )
  }, [isNutritionist])
  useEffect(() => {
    setPageParams({
      ...pageParams,
      page: 1,
      search: '',
      sortColumn: undefined,
      sortType: undefined,
      ordering: undefined,
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
      const data = await getCategoriesDetails(String(rowData?.id))
      setRowData((data as any)?.category ?? data)
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
    title: 'Categories',
    icon: 'category-header-icon',
  }
  const openDrawer = () => {
    if (isNutritionist) return
    setCreateOpen(true)
    setRowData({})
  }
  const headerProps = {
    actionTitle: 'Create Category',
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
              data={data?.categories ?? []}
              dataRowKey="id"
              toolbar={true}
              height={
                (data?.categories?.length ?? 0) === 0
                  ? calcWindowHeight(218)
                  : calcWindowHeight(150)
              }
              search={true}
              searchPlaceholder="Search Category Name"
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
                        action: (row) => navigate(`/categories/${row?.id}`),
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
              'Do you really want to delete this category? This process cannot be undone.'
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
