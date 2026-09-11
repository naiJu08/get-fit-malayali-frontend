import { useState } from 'react'
import SmartTable from '../../components/common/table/SmartTable'
import ListingHeader from '../../components/common/ListingTiles'
import { calcWindowHeight } from '../../utilities/calcHeight'
import { useSalesPayments } from './api'

export default function SalesPayments() {
  const [params, setParams] = useState({
    page: 1,
    per_page: 20,
    status: '',
    search: '',
  })
  const { data, isFetching } = useSalesPayments(params)
  const payments = data?.payments || []
  const columns: any[] = [
    {
      title: 'Client',
      field: 'client.name',
      customCell: true,
      renderCell: (row: any) => ({
        cell: (
          <div>
            <div className="font-medium text-primaryText">
              {row.client?.name || '--'}
            </div>
            <div className="text-xs text-secondary">
              {row.client?.email || '--'}
            </div>
          </div>
        ),
      }),
      isVisible: true,
    },
    {
      title: 'Package',
      field: 'package.name',
      customCell: true,
      renderCell: (row: any) => ({ cell: row.package?.name || '--' }),
      isVisible: true,
    },
    { title: 'Amount', field: 'amount', isVisible: true },
    {
      title: 'Status',
      field: 'status',
      customCell: true,
      renderCell: (row: any) => ({
        cell: (
          <span className="capitalize">
            {String(row.status || '--').replace(/_/g, ' ')}
          </span>
        ),
      }),
      isVisible: true,
    },
    {
      title: 'Period',
      field: 'start_date',
      customCell: true,
      renderCell: (row: any) => ({
        cell: `${row.start_date || '--'} – ${row.end_date || '--'}`,
      }),
      isVisible: true,
    },
  ]
  return (
    <div>
      <ListingHeader
        data={{ title: 'Payments', icon: 'payment-icon' }}
        checkPermission={false}
      />
      <div className="p-4">
        <SmartTable
          data={payments}
          dataRowKey="id"
          columns={columns}
          toolbar
          search
          searchPlaceholder="Search payments"
          searchValue={params.search}
          onSearchChange={(search) => setParams({ ...params, search, page: 1 })}
          toolbarExtra={
            <select
              className="h-9 rounded border border-formBorder bg-white px-3 text-sm text-primaryText"
              value={params.status}
              onChange={(event) =>
                setParams({ ...params, status: event.target.value, page: 1 })
              }
            >
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="expired">Expired</option>
              <option value="dropped_out">Dropped out</option>
            </select>
          }
          columnToggle
          pagination
          height={calcWindowHeight(payments.length ? 150 : 218)}
          emptyTitle="No payment records found"
          isLoading={isFetching}
          paginationProps={{
            currentPage: data?.meta?.current_page ?? 1,
            total: data?.meta?.total_count ?? 0,
            rowsPerPage: params.per_page,
            totalPages: data?.meta?.total_pages ?? 1,
            onPagination: (page) => setParams({ ...params, page }),
            onRowsPerPage: (rows) =>
              setParams({ ...params, per_page: Number(rows), page: 1 }),
            dropOptions: [10, 20, 30, 50, 100],
          }}
        />
      </div>
    </div>
  )
}
