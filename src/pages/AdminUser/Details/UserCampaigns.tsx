import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import SmartTable from '../../../components/common/table/SmartTable'
import Icons from '../../../components/common/icons'
import { calcWindowHeight } from '../../../utilities/calcHeight'
import { useUserMarketingCampaigns } from '../../Marketing/api'
import { useSnackbarManager } from '../../../components/common/snackbar'

const displayStatus = (value: any) =>
  String(value || 'draft')
    .replace(/_/g, ' ')
    .replace(/^./, (letter) => letter.toUpperCase())

const statusColor = (value: any) => {
  const s = String(value || '').toLowerCase()
  if (s === 'active') return 'bg-green-50 text-green-700 border-green-200'
  if (s === 'draft') return 'bg-yellow-50 text-yellow-700 border-yellow-200'
  if (s === 'inactive') return 'bg-gray-100 text-gray-600 border-gray-200'
  return 'bg-gray-100 text-gray-600 border-gray-200'
}

export default function UserCampaigns({ user }: { user: any }) {
  const navigate = useNavigate()
  const { enqueueSnackbar } = useSnackbarManager()
  const [params, setParams] = useState({ page: 1, per_page: 10, search: '' })

  const { data, isFetching } = useUserMarketingCampaigns(user?.id, params)

  const rows = data?.marketing_campaigns || []
  const meta = data?.meta || {}

  const columns: any[] = useMemo(
    () => [
      {
        title: 'Campaign Name',
        field: 'name',
        renderCell: (r: any) => ({
          cell: (
            <button
              type="button"
              className="text-blue-600 hover:underline font-medium text-left"
              onClick={() =>
                navigate(`/users/marketing/${user?.id}/campaigns/${r.id}`)
              }
            >
              {r.name}
            </button>
          ),
          toolTip: r.name,
        }),
        customCell: true,
        sortable: false,
        resizable: true,
        isVisible: true,
      },
      {
        title: 'Status',
        field: 'status',
        renderCell: (r: any) => ({
          cell: (
            <span
              className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusColor(
                r.status
              )}`}
            >
              {displayStatus(r.status)}
            </span>
          ),
          toolTip: displayStatus(r.status),
        }),
        customCell: true,
        sortable: false,
        resizable: true,
        isVisible: true,
      },
      {
        title: 'Form',
        field: 'marketing_form',
        renderCell: (r: any) => ({
          cell: r.marketing_form?.name || '-',
          toolTip: r.marketing_form?.name || '-',
        }),
        customCell: true,
        sortable: false,
        resizable: true,
        isVisible: true,
      },
      {
        title: 'Leads',
        field: 'leads_count',
        renderCell: (r: any) => ({
          cell: (
            <span className="font-semibold text-gray-900">
              {r.leads_count ?? 0}
            </span>
          ),
          toolTip: String(r.leads_count ?? 0),
        }),
        customCell: true,
        sortable: false,
        resizable: true,
        isVisible: true,
      },
      {
        title: 'Starts On',
        field: 'starts_on',
        renderCell: (r: any) => ({
          cell: r.starts_on || '-',
          toolTip: r.starts_on || '-',
        }),
        customCell: true,
        sortable: false,
        resizable: true,
        isVisible: true,
      },
      {
        title: 'Ends On',
        field: 'ends_on',
        renderCell: (r: any) => ({
          cell: r.ends_on || '-',
          toolTip: r.ends_on || '-',
        }),
        customCell: true,
        sortable: false,
        resizable: true,
        isVisible: true,
      },
      {
        title: 'Public URL',
        field: 'public_url',
        renderCell: (r: any) => ({
          cell: r.public_url ? (
            <button
              type="button"
              className="text-xs text-blue-600 hover:underline"
              onClick={(e) => {
                e.stopPropagation()
                navigator.clipboard.writeText(r.public_url)
                enqueueSnackbar('Public link copied to clipboard', {
                  variant: 'success',
                })
              }}
            >
              Copy link
            </button>
          ) : (
            '-'
          ),
          toolTip: r.public_url || '',
        }),
        customCell: true,
        sortable: false,
        resizable: true,
        isVisible: true,
      },
    ],
    [navigate, enqueueSnackbar, user?.id]
  )

  return (
    <div>
      <SmartTable
        data={rows}
        dataRowKey="id"
        columns={columns}
        search
        searchPlaceholder="Search campaigns"
        searchValue={params.search}
        onSearchChange={(value) =>
          setParams((prev) => ({ ...prev, search: value, page: 1 }))
        }
        isLoading={isFetching}
        height={calcWindowHeight(260)}
        emptyTitle="No campaigns found for this user"
        pagination
        paginationProps={{
          onPagination: (page) => setParams((prev) => ({ ...prev, page })),
          total: meta.total_count || rows.length,
          currentPage: meta.current_page || 1,
          rowsPerPage: params.per_page,
          onRowsPerPage: (per_page) =>
            setParams((prev) => ({
              ...prev,
              per_page: Number(per_page),
              page: 1,
            })),
          totalPages: meta.total_pages || 1,
          dropOptions: [10, 20, 30, 50],
        }}
        columnToggle
        externalActions
        actionProps={[
          {
            title: 'View Details',
            toolTip: 'View Campaign Details',
            icon: <Icons name="external-link" />,
            action: (row: any) =>
              navigate(`/users/marketing/${user?.id}/campaigns/${row.id}`),
          },
        ]}
      />
    </div>
  )
}
