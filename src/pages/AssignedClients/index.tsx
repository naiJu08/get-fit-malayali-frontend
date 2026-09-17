import { useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useLocation, useNavigate } from 'react-router-dom'
import Icons from '../../components/common/icons'
import ListingHeader from '../../components/common/ListingTiles'
import { TabContainer } from '../../components/common'
import SmartTable from '../../components/common/table/SmartTable'
import { calcWindowHeight } from '../../utilities/calcHeight'
import { acceptAssignedClient, useAssignedClientWorkflow } from './api'
import { useSnackbarManager } from '../../components/common/snackbar'
import { getErrorMessage } from '../../utilities/parsers'

const ROLE_LABELS: Record<string, string> = {
  nutritionist: 'Nutritionist',
  physiotherapist: 'Physiotherapist',
  yogist: 'Yogist',
}

const roleFromPath = (path: string) =>
  Object.keys(ROLE_LABELS).find((role) => path.includes('/' + role + '/')) ||
  'nutritionist'

const formatDate = (value?: string) =>
  value
    ? new Intl.DateTimeFormat('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date(value))
    : '--'

const statusLabel = (value?: string) =>
  (value || 'pending')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())

const getStatusBadgeClass = (status?: string) => {
  switch (status) {
    case 'accepted':
      return 'bg-green-100 text-green-800 border-green-200'
    case 'assessment_completed':
      return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'package_confirmed':
      return 'bg-purple-100 text-purple-800 border-purple-200'
    case 'follow_up_scheduled':
    case 'follow_up_pending':
      return 'bg-amber-100 text-amber-800 border-amber-200'
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    case 'completed':
      return 'bg-green-100 text-green-800 border-green-200'
    case 'inactive':
    case 'dropped_out':
      return 'bg-red-100 text-red-800 border-red-200'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

export default function AssignedClients() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const location = useLocation()
  const role = roleFromPath(location.pathname)
  const [params, setParams] = useState({ page: 1, per_page: 20, search: '' })
  const { data, isFetching, refetch } = useAssignedClientWorkflow(role, params)
  const { enqueueSnackbar } = useSnackbarManager()
  const [acceptingId, setAcceptingId] = useState<string | number | null>(null)
  const clients = data?.items || []

  const acceptFromList = async (row: any) => {
    try {
      setAcceptingId(row.id)
      const response = await acceptAssignedClient(row.id)
      enqueueSnackbar(response?.message || 'Client accepted successfully', {
        variant: 'success',
      })
      const refreshed = await refetch()
      await queryClient.invalidateQueries({
        queryKey: ['admin_user_list'],
        refetchType: 'all',
      })

      const totalPages = Math.max(
        Number(refreshed.data?.meta?.total_pages) || 1,
        1
      )
      if (params.page > totalPages) {
        setParams({ ...params, page: totalPages })
      }
    } catch (error: any) {
      enqueueSnackbar(
        getErrorMessage(error) ||
          error?.response?.data?.error ||
          'Unable to accept client',
        { variant: 'error' }
      )
    } finally {
      setAcceptingId(null)
    }
  }

  const columns = useMemo(
    () => [
      {
        title: 'Name',
        field: 'user_name',
        customCell: true,
        link: true,
        rowClick: (row: any) => navigate(location.pathname + '/' + row.id),
        renderCell: (row: any) => ({
          cell: row.user_name || '--',
          toolTip: row.user_name || '',
        }),
        isVisible: true,
      },
      { title: 'Phone Number', field: 'user_phone', isVisible: true },
      { title: 'Email', field: 'user_email', isVisible: true },
      {
        title: 'Anticipated package',
        field: 'anticipated_package',
        customCell: true,
        renderCell: (row: any) => ({
          cell: row.anticipated_package?.plan?.name || 'Not proposed',
          toolTip: row.anticipated_package?.plan?.name || '',
        }),
        isVisible: true,
      },
      {
        title: 'Status',
        field: 'workflow_status',
        customCell: true,
        renderCell: (row: any) => ({
          cell: (
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusBadgeClass(row.workflow_status)}`}
            >
              {statusLabel(row.workflow_status)}
            </span>
          ),
        }),
        isVisible: true,
      },
      {
        title: 'Next follow-up',
        field: 'next_follow_up',
        customCell: true,
        renderCell: (row: any) => ({
          cell: row.next_follow_up?.scheduled_at
            ? formatDate(row.next_follow_up.scheduled_at)
            : '--',
        }),
        isVisible: true,
      },
    ],
    [location.pathname, navigate]
  )

  return (
    <div>
      <ListingHeader
        data={{ title: 'Clients', icon: 'user' }}
        checkPermission={false}
      />
      <div className="px-4">
        <TabContainer
          data={[
            { id: 'clients', label: 'Accepted Clients' },
            { id: 'assigned-clients', label: 'Assigned Clients' },
            { id: 'inactive-clients', label: 'Inactive Clients' },
          ]}
          activeTab="assigned-clients"
          onClick={(tab) =>
            navigate(
              tab.id === 'clients'
                ? '/users'
                : tab.id === 'inactive-clients'
                  ? '/admin/inactive-users'
                  : '/users/' + role + '/assigned-clients'
            )
          }
        >
          {null}
        </TabContainer>
      </div>
      <div className="p-4">
        <SmartTable
          data={clients}
          dataRowKey="id"
          columns={columns}
          actionProps={[
            {
              title: 'View',
              toolTip: 'View assigned client',
              icon: <Icons name="eye" />,
              action: (row: any) =>
                navigate('/users/' + row.user_id + '/details', {
                  state: { from: location.pathname },
                }),
            },
            {
              title: 'Accept',
              toolTip: 'Accept assigned client',
              icon: <Icons name="check-circle" />,
              variant: 'success',
              action: acceptFromList,
              hide: (row: any) => row.workflow_status !== 'pending',
              disabled: (row: any) => acceptingId === row.id,
            },
          ]}
          externalActions
          toolbar
          search
          searchPlaceholder="Search assigned clients"
          searchValue={params.search}
          onSearchChange={(search) => setParams({ ...params, search, page: 1 })}
          columnToggle
          pagination
          height={calcWindowHeight(clients.length ? 170 : 230)}
          isLoading={isFetching}
          emptyTitle="No assigned clients found"
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
