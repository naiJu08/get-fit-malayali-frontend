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
import { useMeals, useDeleteMeal, useBulkStatusChange } from './api'
import { getMealsColumns } from './columns'
import CreateMeal from './create'
import { useAuthStore } from '../../store/authStore'
import { Button } from '../../components/common'

export default function Meals() {
  const [columns, setColumns] = useState<TableColumns[]>([])
  const [createOpen, setCreateOpen] = useState(false)
  const [edit, setEdit] = useState(false)
  const [rowData, setRowData] = useState<any>()
  const [deleteMealModal, setDeleteMealModal] = useState(false)
  const [mealToDelete, setMealToDelete] = useState<any>(null)
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set())
  const [bulkChangeOpen, setBulkChangeOpen] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState<
    'active' | 'inactive' | ''
  >('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const { pageParams, setPageParams } = useAdminUserFilterStore()
  const navigate = useNavigate()
  const deleteMealMutation = useDeleteMeal()
  const bulkStatusChangeMutation = useBulkStatusChange()
  const location = useLocation()
  const roleName = useAuthStore((s) => s.roleData?.name?.toLowerCase?.())
  const isNutritionist = roleName === 'nutritionist'
  const { page, per_page, search, ordering } = pageParams
  const searchParams = {
    page,
    per_page: Number(per_page ?? 10),
    search,
    ordering,
    ...(statusFilter && { status: statusFilter }),
  }

  const headerProps = { actionTitle: 'Create Food' }

  // TODO: adjust this to your desired create flow
  const openDrawer = () => setCreateOpen(true)

  const handleRefresh = () => {
    setPageParams({ ...pageParams, page: 1 })
  }

  const applyStatusFilter = (value: string) => {
    setStatusFilter(value)
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
  const handleSelectItem = (id: number, checked: boolean) => {
    setSelectedItems((prev) => {
      const newSet = new Set(prev)
      if (checked) {
        newSet.add(id)
      } else {
        newSet.delete(id)
      }
      return newSet
    })
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = data?.meals?.map((meal: any) => meal.id) || []
      setSelectedItems(new Set(allIds))
    } else {
      setSelectedItems(new Set())
    }
  }

  const handleBulkChange = () => {
    if (selectedItems.size === 0) return
    setBulkChangeOpen(true)
  }

  const handleBulkChangeClose = () => {
    setBulkChangeOpen(false)
  }

  useEffect(() => {
    setColumns(
      getMealsColumns(
        (row: any) => {
          navigate(`/meals/${row?.id}`)
        },
        selectedItems,
        handleSelectItem,
        handleSelectAll
      )
    )
  }, [navigate, selectedItems])
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
        data={{ title: 'Food', icon: 'meal-icon' }}
        onActionClick={isNutritionist ? undefined : openDrawer}
        actionProps={isNutritionist ? undefined : headerProps}
        checkPermission={
          !isNutritionist && checkPermissions('Employee', 'create')
        }
        bulkChangeButton={
          !isNutritionist && selectedItems.size > 0 ? (
            <Button
              className="bg-primaryGreen"
              label={`Bulk Change (${selectedItems.size})`}
              onClick={handleBulkChange}
            />
          ) : null
        }
      />
      <div className="p-4">
        <SmartTable
          data={data?.meals ?? []}
          dataRowKey="id"
          toolbar
          toolbarExtra={
            <div className="flex items-end gap-3">
              <div className="flex flex-col gap-1 ">
                <label className="text-xs text-gray-600">Status</label>
                <select
                  className="w-64 flex flex-col gap-1 z-20 border border-gray-300 p-[11px] rounded-lg bg-white text-xs focus:outline-none focus:ring-0 focus:border-gray-300"
                  value={statusFilter}
                  onChange={(e) => applyStatusFilter(e.target.value)}
                >
                  <option value="">All</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          }
          height={
            data?.meals?.length === 0
              ? calcWindowHeight(218)
              : calcWindowHeight(150)
          }
          search
          searchPlaceholder="Search Food Name"
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
                    title: 'View',
                    toolTip: 'View',
                  },
                  {
                    icon: <Icons name="edit" />,
                    action: (row: any) => openEdit(row),
                    title: 'Edit',
                    toolTip: 'Edit',
                  },
                  {
                    icon: <Icons name="delete" />,
                    action: (row: any) => handleDelete(row),
                    title: 'Delete',
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
          'Do you really want to delete this Food? This process cannot be undone.'
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
      />

      {/* Bulk Change Modal */}
      {bulkChangeOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-lg w-full mx-4 border border-gray-100">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 7h10l-1 10H8l-1-10z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Bulk Status Change
              </h2>
              <p className="text-gray-600">
                You have selected{' '}
                <span className="font-semibold text-blue-600">
                  {selectedItems.size}
                </span>{' '}
                item(s) for bulk status change.
              </p>
            </div>

            {/* Status Selection */}
            <div className="mb-8">
              <label className="block text-lg font-semibold text-gray-700 mb-4 text-center">
                Choose New Status
              </label>
              <div className="space-y-3">
                <label className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all duration-200">
                  <input
                    type="checkbox"
                    checked={selectedStatus === 'active'}
                    onChange={(e) =>
                      setSelectedStatus(e.target.checked ? 'active' : '')
                    }
                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mr-4"
                  />
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                    <span className="text-lg font-medium">Active</span>
                  </div>
                  <span className="ml-auto text-sm text-gray-500">
                    Items will be visible
                  </span>
                </label>

                <label className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all duration-200">
                  <input
                    type="checkbox"
                    checked={selectedStatus === 'inactive'}
                    onChange={(e) =>
                      setSelectedStatus(e.target.checked ? 'inactive' : '')
                    }
                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mr-4"
                  />
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-gray-400 rounded-full mr-3"></div>
                    <span className="text-lg font-medium">Inactive</span>
                  </div>
                  <span className="ml-auto text-sm text-gray-500">
                    Items will be hidden
                  </span>
                </label>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={handleBulkChangeClose}
                disabled={bulkStatusChangeMutation.isLoading}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!selectedStatus) {
                    console.log('No status selected')
                    return
                  }
                  const payload = {
                    ids: Array.from(selectedItems),
                    status: selectedStatus,
                  }
                  bulkStatusChangeMutation.mutate(payload, {
                    onSuccess: () => {
                      console.log('Bulk status change successful')
                      setSelectedItems(new Set())
                      setSelectedStatus('')
                      handleBulkChangeClose()
                    },
                  })
                }}
                disabled={!selectedStatus || bulkStatusChangeMutation.isLoading}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {bulkStatusChangeMutation.isLoading ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Changing...
                  </span>
                ) : (
                  'Apply Changes'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
