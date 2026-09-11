import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import SmartTable from '../../../components/common/table/SmartTable'
import Icons from '../../../components/common/icons'
import { calcWindowHeight } from '../../../utilities/calcHeight'
import { useUserSalesClients } from '../api'

const accountStatusColor = (value: any) => {
  switch (String(value || '').toLowerCase()) {
    case 'active':
      return 'bg-green-100 text-green-800 border-green-200'
    case 'pending':
    case 'inactive':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    case 'suspended':
    case 'blocked':
      return 'bg-red-100 text-red-800 border-red-200'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

export default function UserSalesClients({ user }: { user: any }) {
  const navigate = useNavigate()
  const [params, setParams] = useState({
    page: 1,
    per_page: 10,
    search: '',
  })
  const { data, isFetching } = useUserSalesClients(user?.id, params)
  const clients = data?.sales_clients || data?.clients || []

  const columns: any[] = useMemo(
    () => [
      {
        title: 'Client',
        field: 'name',
        customCell: true,
        renderCell: (row: any) => ({
          cell: (
            <div>
              <button
                type="button"
                className="text-blue-600 hover:underline font-medium text-left"
                onClick={() =>
                  navigate('/sales/clients/' + row.id, {
                    state: { from: `/users/sales/${user?.id}/clients` },
                  })
                }
              >
                {row.name || 'Client #' + row.id}
              </button>
              <div className="text-xs text-secondary">{row.email || '--'}</div>
            </div>
          ),
          toolTip: row.email || '',
        }),
        isVisible: true,
      },
      { title: 'Phone', field: 'phone', isVisible: true },
      {
        title: 'Account Status',
        field: 'status',
        customCell: true,
        renderCell: (row: any) => ({
          cell: (
            <span
              className={
                'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ' +
                accountStatusColor(row.status)
              }
            >
              {row.status
                ? row.status.charAt(0).toUpperCase() + row.status.slice(1)
                : 'Unknown'}
            </span>
          ),
        }),
        isVisible: true,
      },
      {
        title: 'Profile',
        field: 'profile_completed',
        customCell: true,
        renderCell: (row: any) => ({
          cell: (
            <span
              className={
                'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ' +
                (row.profile_completed
                  ? 'bg-green-100 text-green-800 border-green-200'
                  : 'bg-yellow-100 text-yellow-800 border-yellow-200')
              }
            >
              {row.profile_completed ? 'Completed' : 'Not completed'}
            </span>
          ),
        }),
        isVisible: true,
      },
    ],
    [navigate, user?.id]
  )

  return (
    <SmartTable
      data={clients}
      dataRowKey="id"
      columns={columns}
      actionProps={[
        {
          title: 'View',
          toolTip: 'View client details',
          icon: <Icons name="eye" />,
          action: (row: any) =>
            navigate('/sales/clients/' + row.id, {
              state: { from: `/users/sales/${user?.id}/clients` },
            }),
        },
      ]}
      externalActions
      toolbar
      search
      searchPlaceholder="Search clients"
      searchValue={params.search}
      onSearchChange={(search) => setParams({ ...params, search, page: 1 })}
      columnToggle
      pagination
      height={calcWindowHeight(260)}
      emptyTitle="No clients found"
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
  )
}
