import SmartTable from '../../components/common/table/SmartTable'
import { useEffect, useState } from 'react'
import { useSnackbar } from 'notistack'

import Icons from '../../components/common/icons'
import ListingHeader from '../../components/common/ListingTiles'
import ConfirmDeleteModal from '../../components/common/modal/ConfirmDeleteModal'
import { checkPermissions } from '../../layout/store'
import { useAdminUserFilterStore } from '../../store/filterSore/adminUserStore'
import { useAuthStore } from '../../store/authStore'
import { calcWindowHeight } from '../../utilities/calcHeight'
import { getSortedColumnName } from '../../utilities/parsers'
import { useMealTimingList, deleteMealTiming, updateMealTiming } from './api'
import { getColumns } from './columns'
import CreateAdmin from './create/index'
import { useNavigate } from 'react-router-dom'

export default function MealTimingMain() {
  const roleName = useAuthStore((s) => s.roleData?.name?.toLowerCase?.())
  const isNutritionist = roleName === 'nutritionist'
  const [columns, setColumns] = useState<any[]>([])
  const [createOpen, setCreateOpen] = useState(false)
  const [viewMode, setViewMode] = useState(false)
  const [edit, setEdit] = useState(false)
  const [rowData, setRowData] = useState<any>()
  const [searchDebounce, setSearchDebounce] = useState<any>(null)
  const [deleteWorkoutModal, setDeleteWorkoutModal] = useState(false)
  const [deletingWorkout, setDeletingWorkout] = useState(false)
  const [workoutToDelete, setWorkoutToDelete] = useState<any>(null)
  const navigate = useNavigate()

  const { pageParams, setPageParams } = useAdminUserFilterStore()
  const { page, page_size, search, ordering, filters } = pageParams
  const cleanedFilters: any = { ...(filters || {}) }
  if (cleanedFilters.active === false || cleanedFilters.active === 'false') {
    delete cleanedFilters.active
  }

  const {
    data: mealTimingData,
    refetch,
    isFetching,
  } = useMealTimingList({
    page,
    page_size,
    search,
    ordering,
    ...cleanedFilters,
  })

  // Refetch when filters/pagination/sort/search change (same pattern as Meditation list)
  useEffect(() => {
    refetch()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, page_size, search, ordering, JSON.stringify(filters)])

  // Keep page within server-reported total pages (if provided)
  useEffect(() => {
    const totalPages = (mealTimingData as any)?.meta?.total_pages
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
  }, [(mealTimingData as any)?.meta?.total_pages])

  const handleColumnSort = (orderColumn: any, orderDirection: any) => {
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

  const handlePagination = (page: number) => {
    setPageParams({
      ...pageParams,
      page,
    })
  }

  const handleRowsPerPage = (rowsPerPage: string | number) => {
    setPageParams({
      ...pageParams,
      page_size: Number(rowsPerPage),
      page: 1,
    })
  }

  const handleCreate = () => {
    setCreateOpen(true)
    setEdit(false)
    setViewMode(false)
    setRowData(undefined)
  }

  // const onEditAction = (row: any) => {
  //   setRowData(row)
  //   setEdit(true)
  //   setViewMode(false)
  //   setCreateOpen(true)
  // }

  // const onDeleteAction = (row: any) => {
  //   setWorkoutToDelete(row)
  //   setDeleteWorkoutModal(true)
  // }

  const { enqueueSnackbar } = useSnackbar()

  const handleDeleteConfirm = async () => {
    if (!workoutToDelete) return

    setDeletingWorkout(true)
    try {
      await deleteMealTiming(workoutToDelete.id)
      enqueueSnackbar('Meal timing deleted successfully', {
        variant: 'success',
      })
      refetch()
    } catch (error: any) {
      console.error('Delete error:', error)
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to delete meal timing'
      enqueueSnackbar(errorMessage, { variant: 'error' })
    } finally {
      setDeletingWorkout(false)
      setDeleteWorkoutModal(false)
      setWorkoutToDelete(null)
    }
  }

  const handleClose = () => {
    setCreateOpen(false)
    setEdit(false)
    setViewMode(false)
    setRowData(undefined)
  }

  const handleRefresh = () => {
    refetch()
  }

  const totalCount =
    (mealTimingData as any)?.meta?.total_count ??
    (mealTimingData as any)?.count ??
    (mealTimingData as any)?.meta?.total ??
    (mealTimingData as any)?.meta?.totalCount ??
    (mealTimingData as any)?.meta?.total_items ??
    (mealTimingData?.meal_timings?.length ?? 0)

  const handleEdit = (row: any) => {
    setRowData(row)
    setEdit(true)
    setViewMode(false)
    setCreateOpen(true)
  }

  const handleToggleStatus = async (row: any) => {
    try {
      const currentStatus = row?.status || 'inactive'
      const newStatus =
        currentStatus.toLowerCase() === 'active' ? 'inactive' : 'active'

      await updateMealTiming(row.id, {
        ...row,
        status: newStatus,
      })

      refetch()
    } catch (error) {
      console.error('Error toggling status:', error)
    }
  }

  useEffect(() => {
    const cols = getColumns({
      onNameClick: (row: any) => navigate(`/mealtiming/${row?.id}`),
      disableNameLink: false,
    })
    setColumns(cols)
  }, [navigate])

  return (
    <>
      <div style={{ height: calcWindowHeight(180) }}>
        <ListingHeader
          data={{
            title: 'Meal Timing',
          }}
          onActionClick={handleCreate}
          actionProps={{
            actionTitle: 'Create Meal Timing',
            icon: 'plus',
          }}
          checkPermission={checkPermissions('MEAL_TIMING', 'create')}
        />

        <SmartTable
          data={mealTimingData?.meal_timings || []}
          dataRowKey="id"
          toolbar={true}
          height={
            (mealTimingData?.meal_timings?.length ?? 0) === 0
              ? calcWindowHeight(218)
              : calcWindowHeight(150)
          }
          search={true}
          searchPlaceholder="Search meal timing..."
          searchValue={search}
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
          handleColumnSort={handleColumnSort}
          emptyTitle="No records to display"
          columns={columns}
          pagination={true}
          paginationProps={{
            onPagination: handlePagination,
            total: Number(totalCount ?? 0) || 0,
            currentPage:
              typeof mealTimingData?.meta?.current_page === 'number'
                ? (mealTimingData?.meta?.current_page as number)
                : (pageParams?.page ?? 1),
            rowsPerPage: Number(pageParams?.page_size ?? 10),
            onRowsPerPage: handleRowsPerPage,
            totalPages: Math.max(
              1,
              Math.ceil(
                (Number(totalCount ?? 0) || 0) /
                  Number(pageParams?.page_size ?? 10)
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
                    action: (row: any) => navigate(`/mealtiming/${row?.id}`),
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
                    title: 'Activate',
                    action: (row: any) => handleToggleStatus(row),
                    icon: <Icons name="activate-icon" />,
                    toolTip: 'Activate',
                    variant: 'success',
                    hide: (row: any) => {
                      const v = row?.status
                      const isActive =
                        typeof v === 'string' && v.toLowerCase() === 'active'
                      return isActive
                    },
                  },
                  {
                    icon: <Icons name="table-delete" />,
                    action: (row: any) => {
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

      <CreateAdmin
        isDrawerOpen={createOpen}
        handleClose={handleClose}
        handleRefresh={handleRefresh}
        edit={edit}
        viewMode={viewMode}
        rowData={rowData}
        setEdit={setEdit}
      />

      <ConfirmDeleteModal
        isOpen={deleteWorkoutModal}
        onClose={() => {
          setDeleteWorkoutModal(false)
          setWorkoutToDelete(null)
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Meal Timing"
        subTitle={`Are you sure you want to delete "${workoutToDelete?.name}"?`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        loading={deletingWorkout}
      />
    </>
  )
}
