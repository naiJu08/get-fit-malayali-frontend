import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { TableColumns } from '../../common/types'
import Icons from '../../components/common/icons'
import ListingHeader from '../../components/common/ListingTiles'
import SmartTable from '../../components/common/table/SmartTable'
import ConfirmDeleteModal from '../../components/common/modal/ConfirmDeleteModal'
import { useAdminUserFilterStore } from '../../store/filterSore/adminUserStore'
import { getSortedColumnName } from '../../utilities/parsers'
import { calcWindowHeight } from '../../utilities/calcHeight'
import { checkPermissions } from '../../layout/store'
import { useMeals, useDeleteMeal } from './api'
import { getMealsColumns } from './columns'
import CreateMeal from './create'
import { useAuthStore } from '../../store/authStore'

export default function Meals() {
  const [columns, setColumns] = useState<TableColumns[]>([])
  const [createOpen, setCreateOpen] = useState(false)
  const [edit, setEdit] = useState(false)
  const [rowData, setRowData] = useState<any>()
  const [deleteMealModal, setDeleteMealModal] = useState(false)
  const [mealToDelete, setMealToDelete] = useState<any>(null)
  const { pageParams, setPageParams } = useAdminUserFilterStore()
  const navigate = useNavigate()
  const deleteMealMutation = useDeleteMeal()
  const location = useLocation()
  const roleName = useAuthStore((s) => s.roleData?.name?.toLowerCase?.())
  const isNutritionist = roleName === 'nutritionist'
  const { page, per_page, search, ordering } = pageParams
  const searchParams = {
    page,
    per_page: Number(per_page ?? 10),
    search,
    ordering,
  }

  const headerProps = { actionTitle: 'Create Meal' }

  // TODO: adjust this to your desired create flow
  const openDrawer = () => setCreateOpen(true)

  const handleRefresh = () => {
    setPageParams({ ...pageParams, page: 1 })
  }

  const openEdit = (row: any) => {
    setRowData(row)
    setEdit(true)
    setCreateOpen(true)
  }
  const { data, isFetching } = useMeals(searchParams)
  useEffect(() => {
    if (pageParams?.search) {
      setPageParams({ ...pageParams, search: '', page: 1 })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  useEffect(() => {
    setColumns(
      getMealsColumns((row: any) => {
        navigate(`/meals/${row?.id}`)
      })
    )
  }, [navigate])
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

  // Clamp page to valid range when meta changes (same logic as Recipe)
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
    setPageParams({ ...pageParams, page: pageNumber })
  }

  const onChangeRowsPerPage = (count: number | string) => {
    setPageParams({ ...pageParams, per_page: Number(count), page: 1 })
  }

  const handleSort = (orderColumn: any, orderDirection: any) => {
    setPageParams({
      ...pageParams,
      sortColumn: orderColumn,
      sortType: orderDirection,
      ordering: getSortedColumnName(orderColumn, orderDirection),
    })
  }
  useEffect(() => {
    setPageParams({
      ...pageParams,
      page: 1,
      search: '',
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, setPageParams])
  const handleDelete = (row: any) => {
    if (!row?.id) return
    setMealToDelete(row)
    setDeleteMealModal(true)
  }

  const handleConfirmDeleteMeal = () => {
    if (!mealToDelete?.id) return
    deleteMealMutation.mutate(mealToDelete.id, {
      onSuccess: () => {
        handleRefresh()
        setDeleteMealModal(false)
        setMealToDelete(null)
      },
    } as any)
  }

  return (
    <div>
      <ListingHeader
        data={{ title: 'Meals', icon: 'meal-icon' }}
        onActionClick={isNutritionist ? undefined : openDrawer}
        actionProps={isNutritionist ? undefined : headerProps}
        checkPermission={
          !isNutritionist && checkPermissions('Employee', 'create')
        }
      />
      <div className="p-4">
        <SmartTable
          data={data?.meals ?? []}
          dataRowKey="id"
          toolbar
          height={
            data?.meals?.length === 0
              ? calcWindowHeight(218)
              : calcWindowHeight(150)
          }
          search
          searchPlaceholder="Search Meal Name"
          isLoading={isFetching}
          sortType={pageParams.sortType}
          sortColumn={pageParams.sortColumn}
          handleColumnSort={handleSort}
          emptyTitle="No records to display"
          columns={columns}
          pagination
          actionProps={
            isNutritionist
              ? []
              : [
                  {
                    icon: <Icons name="eye" />,
                    action: (row: any) => navigate(`/meals/${row?.id}`),
                    title: 'view',
                    toolTip: 'View',
                  },
                  {
                    icon: <Icons name="edit" />,
                    action: (row: any) => openEdit(row),
                    title: 'edit',
                    toolTip: 'Edit',
                  },
                  {
                    icon: <Icons name="delete" />,
                    action: (row: any) => handleDelete(row),
                    title: 'delete',
                    toolTip: 'Delete',
                  },
                ]
          }
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
            dropOptions: [10, 20, 30, 50, 100],
          }}
          searchValue={pageParams?.search}
          onSearchChange={(val: string) =>
            setPageParams({ ...pageParams, search: val })
          }
          onSearch={(key?: string) =>
            setPageParams({
              ...pageParams,
              search: String(key ?? ''),
              page: 1,
            })
          }
          columnToggle
          externalActions={true}
        />
      </div>
      <CreateMeal
        isDrawerOpen={createOpen}
        handleClose={() => {
          setCreateOpen(false)
          setEdit(false)
          setRowData(undefined)
        }}
        handleRefresh={handleRefresh}
        edit={edit}
        rowData={rowData}
      />
      <ConfirmDeleteModal
        isOpen={deleteMealModal}
        onClose={() => {
          if (!deleteMealMutation.isLoading) {
            setDeleteMealModal(false)
            setMealToDelete(null)
          }
        }}
        onConfirm={handleConfirmDeleteMeal}
        loading={deleteMealMutation.isLoading}
        title={'Are you sure?'}
        subTitle={
          'Do you really want to delete this meal? This process cannot be undone.'
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
      />
    </div>
  )
}
