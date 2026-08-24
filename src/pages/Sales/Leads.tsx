import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import SmartTable from '../../components/common/table/SmartTable'
import ListingHeader from '../../components/common/ListingTiles'
import Icons from '../../components/common/icons'
import { useSnackbarManager } from '../../components/common/snackbar'
import { calcWindowHeight } from '../../utilities/calcHeight'
import { getApiErrorMessage } from '../../utilities/commonUtilities'
import { acceptSalesLead, useSalesLeads } from './api'

const statusLabels: Record<string, string> = {
  assigned: 'Assigned',
  accepted: 'Accepted',
  contacted: 'Contacted',
  qualified: 'Qualified',
  lost: 'Lost',
  confirmation_pending: 'Confirmation pending',
  client_accepted: 'Client accepted',
  converted: 'Converted',
  new_lead: 'Assigned',
  client_confirmation: 'Confirmation pending',
}

const displayStatus = (value: any) =>
  statusLabels[String(value)] || String(value || 'Assigned')

export default function SalesLeads() {
  const navigate = useNavigate()
  const { enqueueSnackbar } = useSnackbarManager()
  const [params, setParams] = useState({
    page: 1,
    per_page: 20,
    search: '',
    status: '',
  })
  const { data, isFetching, refetch } = useSalesLeads(params)
  const leads = data?.leads || []

  const accept = async (row: any) => {
    try {
      await acceptSalesLead(row.id)
      enqueueSnackbar('Lead accepted successfully', { variant: 'success' })
      refetch()
    } catch (error: any) {
      enqueueSnackbar(getApiErrorMessage(error, 'Unable to accept lead'), {
        variant: 'error',
      })
    }
  }

  const columns: any[] = useMemo(
    () => [
      {
        title: 'Lead',
        field: 'first_name',
        customCell: true,
        renderCell: (row: any) => ({
          cell: (
            <button
              className="text-primary hover:underline font-medium"
              onClick={() => navigate(`/sales/leads/${row.id}`)}
            >
              {`${row.first_name || ''} ${row.last_name || ''}`.trim() ||
                `Lead #${row.id}`}
            </button>
          ),
          toolTip: row.email || '',
        }),
        isVisible: true,
      },
      {
        title: 'Campaign',
        field: 'campaign.name',
        customCell: true,
        renderCell: (row: any) => ({
          cell: row.campaign?.name || '--',
          toolTip: row.campaign?.name || '',
        }),
        isVisible: true,
      },
      {
        title: 'Status',
        field: 'status',
        customCell: true,
        renderCell: (row: any) => ({
          cell: <span className="capitalize">{displayStatus(row.status)}</span>,
          toolTip: displayStatus(row.status),
        }),
        isVisible: true,
      },
      { title: 'Phone', field: 'phone', isVisible: true },
      {
        title: 'Created At',
        field: 'created_at',
        customCell: true,
        renderCell: (row: any) => ({
          cell: row.created_at
            ? new Date(row.created_at).toLocaleDateString()
            : '--',
        }),
        isVisible: true,
      },
    ],
    [navigate]
  )

  return (
    <div>
      <ListingHeader
        data={{ title: 'Leads', icon: 'leads-icon' }}
        checkPermission={false}
      />
      <div className="p-4">
        <SmartTable
          data={leads}
          dataRowKey="id"
          columns={columns}
          toolbar
          search
          searchPlaceholder="Search leads"
          searchValue={params.search}
          onSearchChange={(search) => setParams({ ...params, search, page: 1 })}
          onSearch={() => refetch()}
          toolbarExtra={
            <select
              className="h-9 rounded border border-formBorder bg-white px-3 text-sm text-primaryText"
              value={params.status}
              onChange={(event) =>
                setParams({ ...params, status: event.target.value, page: 1 })
              }
            >
              <option value="">All statuses</option>
              <option value="assigned">Assigned</option>
              <option value="accepted">Accepted</option>
              <option value="contacted">Contacted</option>
              <option value="qualified">Qualified</option>
              <option value="lost">Lost</option>
              <option value="confirmation_pending">Confirmation pending</option>
              <option value="client_accepted">Client accepted</option>
              <option value="converted">Converted</option>
            </select>
          }
          actionProps={[
            {
              title: 'View',
              toolTip: 'View lead',
              icon: <Icons name="eye" />,
              action: (row: any) => navigate(`/sales/leads/${row.id}`),
            },
            {
              title: 'Accept',
              toolTip: 'Accept lead',
              icon: <Icons name="check-circle" />,
              variant: 'success',
              hide: (row: any) =>
                row.status !== 'assigned' && row.status !== 'new_lead',
              action: accept,
            },
            {
              title: 'Confirmation',
              toolTip: 'Open confirmation link flow',
              icon: <Icons name="link" />,
              hide: (row: any) =>
                ![
                  'accepted',
                  'contacted',
                  'qualified',
                  'confirmation_pending',
                ].includes(row.status),
              action: (row: any) => navigate(`/sales/leads/${row.id}`),
            },
            {
              title: 'Convert',
              toolTip: 'Open client conversion flow',
              icon: <Icons name="user" />,
              variant: 'primary',
              hide: (row: any) => row.status !== 'client_accepted',
              action: (row: any) => navigate(`/sales/leads/${row.id}`),
            },
          ]}
          externalActions
          columnToggle
          pagination
          isLoading={isFetching}
          height={calcWindowHeight(leads.length ? 150 : 218)}
          emptyTitle="No assigned leads found"
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
