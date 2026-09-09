import { useQueryClient } from '@tanstack/react-query'
import SmartTable from '../../components/common/table/SmartTable'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { TableColumns } from '../../common/types'
import ListingHeader from '../../components/common/ListingTiles'
import Icons from '../../components/common/icons'
import ConfirmDeleteModal from '../../components/common/modal/ConfirmDeleteModal'
import { useAdminUserFilterStore } from '../../store/filterSore/adminUserStore'
import { calcWindowHeight } from '../../utilities/calcHeight'
import { getSortedColumnName } from '../../utilities/parsers'
import { handleReturnEmptyMsg } from '../../utilities/validation'
import { useSnackbarManager } from '../../components/common/snackbar'
import { useAuthStore } from '../../store/authStore'
import {
  getYogaCategoriesDetails,
  useYogaCategoriesList,
  deleteYogaCategories,
} from './api'
import { getColumns } from './columns'
import CreateYogaCategory from './create'

export default function YogaCategoriesMain() {
  const navigate = useNavigate()
  const { enqueueSnackbar } = useSnackbarManager()
  const { roleData } = useAuthStore()
  const isNutritionist = roleData?.name === 'nutritionist'
  const queryClient = useQueryClient()
  const [columns, setColumns] = useState<TableColumns[]>([])
  const [createOpen, setCreateOpen] = useState(false)
  const [viewMode, setViewMode] = useState(false)
  const [edit, setEdit] = useState(false)
  const [rowData, setRowData] = useState<any>()
  const [editViewIndicator, setEditViewIndicator] = useState(false)
  const [deleteModal, setDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState<any>(null)
  const [searchDebounce, setSearchDebounce] = useState<NodeJS.Timeout>()

  const { pageParams, setPageParams } = useAdminUserFilterStore()
  const { page, per_page, search, ordering, filters } = pageParams
  const effectivePerPage = Number(per_page ?? 10)
  const searchParams = {
    page: page || 1,
    per_page: effectivePerPage,
    search: search,
    ...(ordering ? { ordering } : {}),
    ...(filters || {}),
  }

  const { data, refetch, isFetching } = useYogaCategoriesList(searchParams)

  useEffect(() => {
    if (pageParams?.search) {
      setPageParams({ ...pageParams, search: '', page: 1 })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const totalCount =
    typeof data?.meta?.total_count === 'number'
      ? data.meta.total_count
      : typeof data?.total_count === 'number'
        ? data.total_count
        : undefined

  const calculatedTotalPages =
    typeof totalCount === 'number'
      ? Math.max(1, Math.ceil(totalCount / effectivePerPage))
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

  const handleEdit = async (selectedRow: any) => {
    if (selectedRow?.id) {
      const details = await getYogaCategoriesDetails(String(selectedRow?.id))
      setRowData((details as any)?.category ?? details)
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
    setEditViewIndicator(false)
  }

  const handleRefresh = () => {
    refetch()
  }

  const basicData = {
    title: 'Yoga Categories',
    icon: 'category-header-icon',
  }

  const openDrawer = () => {
    setCreateOpen(true)
    setRowData(undefined)
  }

  const headerProps = {
    actionTitle: 'Create Yoga Category',
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

  const handleNavigateToDetails = (row: any) => {
    if (row?.id) {
      navigate(`/yoga-categories/${row.id}`)
    }
  }

  useEffect(() => {
    const cols = getColumns({
      onNameClick: (row: any) => handleNavigateToDetails(row),
    })
    setColumns(cols)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleDeleteCategory = async () => {
    if (!categoryToDelete?.id) return
    try {
      setDeleting(true)
      await deleteYogaCategories(categoryToDelete.id)
      enqueueSnackbar('Yoga category deleted successfully', {
        variant: 'success',
      })
      queryClient.invalidateQueries(['yoga_categories_list'])
      queryClient.invalidateQueries(['yoga-filter-categories'])
      setDeleteModal(false)
      setCategoryToDelete(null)
      refetch()
    } catch (err: any) {
      const errMsg =
        err?.response?.data?.errors?.[0] ||
        err?.response?.data?.message ||
        'Failed to delete yoga category'
      enqueueSnackbar(errMsg, { variant: 'error' })
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div>
      <ListingHeader
        data={basicData}
        onActionClick={!isNutritionist ? openDrawer : undefined}
        actionProps={!isNutritionist ? headerProps : undefined}
        checkPermission={!isNutritionist}
      />

      <div className="p-4">
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
          searchPlaceholder="Search Yoga Category Name"
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
            total: totalCount ?? data?.categories?.length ?? 0,
            currentPage: pageParams?.page ?? 1,
            rowsPerPage: effectivePerPage,
            onRowsPerPage: onChangeRowsPerPage,
            totalPages: calculatedTotalPages ?? 1,
            dropOptions: [10, 20, 30, 50, 100],
          }}
          actionProps={[
            {
              icon: <Icons name="eye" />,
              action: (row) => navigate(`/yoga-categories/${row?.id}`),
              title: 'View',
              toolTip: 'View',
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
                setCategoryToDelete(row)
                setDeleteModal(true)
              },
              title: 'Delete',
              toolTip: 'Delete',
            },
          ]}
          columnToggle
          externalActions={true}
        />
      </div>

      <CreateYogaCategory
        isDrawerOpen={createOpen}
        rowData={rowData}
        edit={edit}
        setViewMode={setViewMode}
        setEdit={setEdit}
        viewMode={viewMode}
        handleClose={handleClose}
        handleRefresh={handleRefresh}
        editViewIndicator={editViewIndicator}
        setEditViewIndicator={setEditViewIndicator}
      />

      <ConfirmDeleteModal
        isOpen={deleteModal}
        onClose={() => {
          if (!deleting) {
            setDeleteModal(false)
            setCategoryToDelete(null)
          }
        }}
        onConfirm={handleDeleteCategory}
        loading={deleting}
        title="Are you sure?"
        subTitle="Do you really want to delete this category? This process cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
      />
    </div>
  )
}
