import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import SmartTable from '../../components/common/table/SmartTable'
import ListingHeader from '../../components/common/ListingTiles'
import Icons from '../../components/common/icons'
import { useSnackbarManager } from '../../components/common/snackbar'
import { calcWindowHeight } from '../../utilities/calcHeight'
import { useSalesClients } from './api'

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

export default function SalesClients() {
  const navigate = useNavigate()
  const { enqueueSnackbar } = useSnackbarManager()
  const [params, setParams] = useState({ page: 1, per_page: 20, search: '' })
  const { data, isFetching } = useSalesClients(params)
  const clients = data?.clients || []
  const copy = useCallback(
    async (url: string) => {
      try {
        await navigator.clipboard.writeText(url)
        enqueueSnackbar('Profile completion link copied', {
          variant: 'success',
        })
      } catch {
        enqueueSnackbar('Unable to copy profile completion link', {
          variant: 'error',
        })
      }
    },
    [enqueueSnackbar]
  )
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
                onClick={() => navigate('/sales/clients/' + row.id)}
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
              {row.status || 'Unknown'}
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
      {
        title: 'Registration Link',
        field: 'profile_completion_url',
        customCell: true,
        renderCell: (row: any) => ({
          cell: row.profile_completion_url ? (
            <button
              className="text-blue-600 hover:underline inline-flex items-center gap-1"
              onClick={() => copy(row.profile_completion_url)}
            >
              <Icons name="link" /> Copy link
            </button>
          ) : (
            'Completed'
          ),
        }),
        isVisible: true,
      },
    ],
    [copy, navigate]
  )
  return (
    <div>
      <ListingHeader
        data={{ title: 'Clients', icon: 'customer-icon' }}
        checkPermission={false}
      />
      <div className="p-4">
        <SmartTable
          data={clients}
          dataRowKey="id"
          columns={columns}
          actionProps={[
            {
              title: 'View',
              toolTip: 'View client details',
              icon: <Icons name="eye" />,
              action: (row: any) => navigate(`/sales/clients/${row.id}`),
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
          height={calcWindowHeight(clients.length ? 150 : 218)}
          emptyTitle="No converted clients found"
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
