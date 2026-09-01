import { useMemo, useState } from 'react'
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

export default function AssignedClients() {
  const navigate = useNavigate()
  const location = useLocation()
  const role = roleFromPath(location.pathname)
  const label = ROLE_LABELS[role]
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
      await refetch()
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
        title: 'Client',
        field: 'user_name',
        customCell: true,
        renderCell: (row: any) => ({
          cell: (
            <div>
              <div className="font-medium text-gray-900">
                {row.user_name || '--'}
              </div>
              <div className="text-xs text-secondary">
                {row.user_email || '--'}
              </div>
            </div>
          ),
          toolTip: row.user_email || '',
        }),
        isVisible: true,
      },
      { title: 'Phone', field: 'user_phone', isVisible: true },
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
            <span className="capitalize">
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
    []
  )

  return (
    <div>
      <ListingHeader
        data={{ title: label + ' Assigned Clients', icon: 'user' }}
        checkPermission={false}
      />
      <TabContainer
        data={[
          { id: 'clients', label: 'Clients' },
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
              action: (row: any) => navigate(location.pathname + '/' + row.id),
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
