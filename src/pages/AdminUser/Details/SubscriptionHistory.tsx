import { useState, useCallback, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

import { TableColumns } from '../../../common/types'
import SmartTable from '../../../components/common/table/SmartTable'
import { Icon } from '../../../components/common'
import { useUserSubscriptionHistory } from '../api'
import { calcWindowHeight } from '../../../utilities/calcHeight'

const SubscriptionHistory = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  // State for search, pagination, and sorting
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [sortColumn, setSortColumn] = useState('')
  const [sortType, setSortType] = useState<'asc' | 'desc'>('asc')

  // Debounce search to prevent excessive API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1) // Reset to first page when searching
    }, 300) // 300ms delay

    return () => clearTimeout(timer)
  }, [search])

  const { data, isFetching, error } = useUserSubscriptionHistory(id, {
    page,
    per_page: pageSize,
    search: debouncedSearch || undefined,
    ordering: sortColumn
      ? sortType === 'desc'
        ? `-${sortColumn}`
        : sortColumn
      : undefined,
  })

  const subscriptionHistory = data?.subscription_history || []
  const summary = data?.summary || {}

  // Handler functions
  const handleSearch = useCallback((value: string) => {
    setSearch(value)
  }, [])

  const handleSearchSubmit = useCallback((searchTerm?: string) => {
    setSearch(searchTerm || '')
  }, [])

  const handlePagination = useCallback((newPage: number) => {
    setPage(newPage)
  }, [])

  const handleRowsPerPage = useCallback((rows: number | string) => {
    setPageSize(Number(rows))
    setPage(1) // Reset to first page when changing page size
  }, [])

  const handleSort = useCallback(
    (column: string, direction: 'asc' | 'desc') => {
      setSortColumn(column)
      setSortType(direction)
      setPage(1) // Reset to first page when sorting
    },
    []
  )

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'completed':
        return 'bg-blue-100 text-blue-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      case 'paused':
        return 'bg-yellow-100 text-yellow-800'
      case 'expired':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return '--'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  const columns: TableColumns[] = [
    {
      title: 'Plan Name',
      field: 'plan_name',
      sortable: true,
      renderCell: (rowData: any) => {
        const displayValue = rowData.plan_name || '--'
        return {
          cell: displayValue,
          toolTip: displayValue,
        }
      },
      customCell: true,
      link: true,
      rowClick: (row: any) => {
        const subscriptionId = row.id
        if (subscriptionId) {
          navigate(`/subscriptions/${subscriptionId}`)
        }
      },
    },
    {
      title: 'Category',
      field: 'plan_category',
      sortable: true,
      renderCell: (rowData: any) => {
        const displayValue = rowData.plan_category || '--'
        return {
          cell: displayValue,
          toolTip: displayValue,
        }
      },
      customCell: true,
    },
    {
      title: 'Duration',
      field: 'plan_duration_days',
      sortable: true,
      renderCell: (rowData: any) => {
        const displayValue = rowData.plan_duration_days
          ? `${rowData.plan_duration_days} days`
          : '--'
        return {
          cell: displayValue,
          toolTip: displayValue,
        }
      },
      customCell: true,
    },
    {
      title: 'Fees',
      field: 'plan_fees',
      sortable: true,
      renderCell: (rowData: any) => {
        const displayValue = rowData.plan_fees ? `$${rowData.plan_fees}` : '--'
        return {
          cell: displayValue,
          toolTip: displayValue,
        }
      },
      customCell: true,
    },
    {
      title: 'Start Date',
      field: 'start_date',
      sortable: true,
      renderCell: (rowData: any) => {
        const displayValue = formatDate(rowData.start_date)
        return {
          cell: displayValue,
          toolTip: displayValue,
        }
      },
      customCell: true,
    },
    {
      title: 'End Date',
      field: 'end_date',
      sortable: true,
      renderCell: (rowData: any) => {
        const displayValue = formatDate(rowData.end_date)
        return {
          cell: displayValue,
          toolTip: displayValue,
        }
      },
      customCell: true,
    },
    {
      title: 'Status',
      field: 'status',
      sortable: true,
      renderCell: (rowData: any) => {
        const status = rowData.status
        if (!status) {
          return {
            cell: '--',
            toolTip: '--',
          }
        }
        const capitalizedStatus =
          status.charAt(0).toUpperCase() + status.slice(1)
        const colorClass = getStatusColor(status)
        return {
          cell: (
            <span
              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${colorClass}`}
            >
              {capitalizedStatus}
            </span>
          ),
          toolTip: capitalizedStatus,
        }
      },
      customCell: true,
    },
    {
      title: 'Days Remaining',
      field: 'days_remaining',
      sortable: true,
      renderCell: (rowData: any) => {
        const displayValue =
          rowData.days_remaining !== undefined ? rowData.days_remaining : '--'
        return {
          cell: displayValue,
          toolTip: displayValue,
        }
      },
      customCell: true,
    },
  ]

  if (!id) {
    return (
      <div className="p-6 text-center text-gray-500">
        <Icon name="alert-circle" className="w-12 h-12 mx-auto mb-4" />
        <p>User ID is required</p>
      </div>
    )
  }

  if (isFetching) {
    return (
      <div className="p-6 text-center text-gray-500">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primaryGreen mx-auto mb-4"></div>
        <p>Loading subscription history...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 text-center text-red-500">
        <Icon name="alert-circle" className="w-12 h-12 mx-auto mb-4" />
        <p>Failed to load subscription history</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="px-6 py-2">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-lg border p-4">
          <div className="text-sm text-gray-500 mb-1">Total Subscriptions</div>
          <div className="text-2xl font-bold text-gray-900">
            {summary.total_subscriptions || 0}
          </div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="text-sm text-gray-500 mb-1">Active</div>
          <div className="text-2xl font-bold text-green-600">
            {summary.active_subscriptions || 0}
          </div>
        </div>
        {/* <div className="bg-white rounded-lg border p-4">
          <div className="text-sm text-gray-500 mb-1">Completed</div>
          <div className="text-2xl font-bold text-blue-600">{summary.completed_subscriptions || 0}</div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="text-sm text-gray-500 mb-1">Cancelled</div>
          <div className="text-2xl font-bold text-red-600">{summary.cancelled_subscriptions || 0}</div>
        </div> */}
      </div>

      {/* Subscription History Table */}
      <div className="bg-white rounded-lg border">
        <SmartTable
          data={subscriptionHistory}
          dataRowKey="id"
          columns={columns}
          isLoading={isFetching}
          emptyTitle="No subscription history found"
          emptySubTitle="This user has no subscription records available."
          search={false}
          height={calcWindowHeight(390)}
          searchValue={search}
          onSearchChange={handleSearch}
          onSearch={handleSearchSubmit}
          searchPlaceholder="Search subscriptions..."
          toolbar={true}
          columnToggle={true}
          pagination={true}
          paginationProps={{
            total: summary.total_subscriptions || 0,
            currentPage: page,
            rowsPerPage: pageSize,
            onPagination: handlePagination,
            onRowsPerPage: handleRowsPerPage,
            dropOptions: [10, 20, 30, 50, 100],
          }}
          sortColumn={sortColumn}
          sortType={sortType}
          handleColumnSort={handleSort}
        />
      </div>
    </div>
  )
}

export default SubscriptionHistory
