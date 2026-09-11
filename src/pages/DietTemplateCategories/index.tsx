import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'

import { TableColumns } from '../../common/types'
import Icons from '../../components/common/icons'
import ListingHeader from '../../components/common/ListingTiles'
import ConfirmDeleteModal from '../../components/common/modal/ConfirmDeleteModal'
import SmartTable from '../../components/common/table/SmartTable'
import { checkPermissions } from '../../layout/store'
import { useAuthStore } from '../../store/authStore'
import { useAdminUserFilterStore } from '../../store/filterSore/adminUserStore'
import { calcWindowHeight } from '../../utilities/calcHeight'
import { getSortedColumnName } from '../../utilities/parsers'
import { handleReturnEmptyMsg } from '../../utilities/validation'
import { useDeleteDietTemplateCategory, useDietTemplateCategories } from './api'
import { getDietTemplateCategoryColumns } from './columns'
import CreateDietTemplateCategory from './create'

export default function DietTemplateCategories() {
  const [columns, setColumns] = useState<TableColumns[]>([])
  const [createOpen, setCreateOpen] = useState(false)
  const [edit, setEdit] = useState(false)
  const [rowData, setRowData] = useState<any>()
  const [categoryToDelete, setCategoryToDelete] = useState<any>(null)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState('')
  const [searchDebounce, setSearchDebounce] = useState<any>(null)
  const roleName = useAuthStore((s) => s.roleData?.name?.toLowerCase?.())
  const isNutritionist = roleName === 'nutritionist'
  const location = useLocation()
  const { pageParams, setPageParams } = useAdminUserFilterStore()
  const { page, per_page, search, ordering } = pageParams

  const searchParams = {
    page,
    per_page: Number(per_page ?? 10),
    search,
    ordering,
    ...(statusFilter ? { status: statusFilter } : {}),
  }

  const { data, refetch, isFetching } = useDietTemplateCategories(searchParams)
  const deleteMutation = useDeleteDietTemplateCategory()

  useEffect(() => {
    setColumns(getDietTemplateCategoryColumns())
  }, [])

  useEffect(() => {
    setPageParams({
      ...pageParams,
      page: 1,
      search: '',
      sortColumn: undefined,
      sortType: undefined,
      ordering: undefined,
    })
    setStatusFilter('')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, setPageParams])

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

  const openDrawer = () => {
    setRowData(undefined)
    setEdit(false)
    setCreateOpen(true)
  }

  const openEdit = (row: any) => {
    setRowData(row)
    setEdit(true)
    setCreateOpen(true)
  }

  const onChangePage = (pageNumber: number) => {
    setPageParams({ ...pageParams, page: pageNumber })
  }

  const onChangeRowsPerPage = (count: number | string) => {
    setPageParams({ ...pageParams, per_page: Number(count), page: 1 })
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

  const applyStatusFilter = (value: string) => {
    setStatusFilter(value)
    setPageParams({ ...pageParams, page: 1 })
  }

  const confirmDelete = () => {
    if (!categoryToDelete?.id) return
    deleteMutation.mutate(categoryToDelete.id, {
      onSuccess: () => {
        setDeleteModalOpen(false)
        setCategoryToDelete(null)
      },
    } as any)
  }

  return (
    <div>
      <ListingHeader
        data={{
          title: 'Diet Plan Categories',
          icon: 'category-header-icon',
        }}
        onActionClick={isNutritionist ? undefined : openDrawer}
        actionProps={
          isNutritionist
            ? undefined
            : { actionTitle: 'Create Diet Plan Category' }
        }
        checkPermission={
          !isNutritionist && checkPermissions('Employee', 'create')
        }
      />
      <div className="p-4">
        <SmartTable
          data={data?.diet_template_categories ?? []}
          dataRowKey="id"
          toolbar
          toolbarExtra={
            <div className="flex items-end gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-600">Status</label>
                <select
                  className="w-64 flex flex-col gap-1 z-20 border border-gray-300 p-[11px] rounded-lg bg-white text-xs focus:outline-none focus:ring-0 focus:border-gray-300"
                  value={statusFilter}
                  onChange={(event) => applyStatusFilter(event.target.value)}
                >
                  <option value="">All</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          }
          height={
            (data?.diet_template_categories?.length ?? 0) === 0
              ? calcWindowHeight(218)
              : calcWindowHeight(150)
          }
          search
          searchPlaceholder="Search Diet Plan Category"
          searchValue={pageParams?.search || ''}
          onSearchChange={(val) => {
            setPageParams({ ...pageParams, search: val, page: 1 })
            if (searchDebounce) clearTimeout(searchDebounce)
            const timer = setTimeout(() => refetch(), 300)
            setSearchDebounce(timer)
          }}
          onSearch={() => refetch()}
          isLoading={isFetching}
          sortType={pageParams.sortType}
          sortColumn={pageParams.sortColumn}
          handleColumnSort={handleSort}
          emptyTitle="No records to display"
          emptySubTitle={handleReturnEmptyMsg(search)}
          columns={columns}
          pagination
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
                    icon: <Icons name="edit" />,
                    action: (row: any) => openEdit(row),
                    title: 'Edit',
                    toolTip: 'Edit',
                  },
                  {
                    icon: <Icons name="delete" />,
                    action: (row: any) => {
                      setCategoryToDelete(row)
                      setDeleteModalOpen(true)
                    },
                    title: 'Delete',
                    toolTip: 'Delete',
                  },
                ]
          }
          columnToggle
          externalActions
        />
      </div>
      <CreateDietTemplateCategory
        isDrawerOpen={createOpen}
        handleClose={() => {
          setCreateOpen(false)
          setEdit(false)
          setRowData(undefined)
        }}
        edit={edit}
        rowData={rowData}
      />
      <ConfirmDeleteModal
        isOpen={deleteModalOpen}
        onClose={() => {
          if (!deleteMutation.isLoading) {
            setDeleteModalOpen(false)
            setCategoryToDelete(null)
          }
        }}
        onConfirm={confirmDelete}
        loading={deleteMutation.isLoading}
        title={'Are you sure?'}
        subTitle={
          'Do you really want to delete this diet plan category? This process cannot be undone.'
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
      />
    </div>
  )
}
