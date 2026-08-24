import { useState } from 'react'
import SmartTable from '../../components/common/table/SmartTable'
import ListingHeader from '../../components/common/ListingTiles'
import { calcWindowHeight } from '../../utilities/calcHeight'
import { useSalesPackages } from './api'

export default function SalesPackages() {
  const [params, setParams] = useState({ page: 1, per_page: 20, search: '' })
  const { data, isFetching } = useSalesPackages(params)
  const packages = data?.packages || []
  const columns: any[] = [
    { title: 'Package', field: 'name', isVisible: true },
    { title: 'Category', field: 'category', isVisible: true },
    {
      title: 'Duration',
      field: 'duration_days',
      customCell: true,
      renderCell: (row: any) => ({
        cell: row.duration_days ? `${row.duration_days} days` : '--',
      }),
      isVisible: true,
    },
    { title: 'Fees', field: 'fees', isVisible: true },
    {
      title: 'Status',
      field: 'active',
      customCell: true,
      renderCell: (row: any) => ({ cell: row.active ? 'Active' : 'Inactive' }),
      isVisible: true,
    },
  ]
  return (
    <div>
      <ListingHeader
        data={{ title: 'Packages', icon: 'plan' }}
        checkPermission={false}
      />
      <div className="p-4">
        <SmartTable
          data={packages}
          dataRowKey="id"
          columns={columns}
          toolbar
          search
          searchPlaceholder="Search packages"
          searchValue={params.search}
          onSearchChange={(search) => setParams({ ...params, search, page: 1 })}
          columnToggle
          pagination
          height={calcWindowHeight(packages.length ? 150 : 218)}
          emptyTitle="No packages found"
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
