import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import moment from 'moment'
import SmartTable from '../../components/common/table/SmartTable'
import ListingHeader from '../../components/common/ListingTiles'
import Icons from '../../components/common/icons'
import { calcWindowHeight } from '../../utilities/calcHeight'
import { useRenewalRequests } from './api'

const capitalizeFirst = (value: unknown) => {
  const text = String(value || '').trim()
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : ''
}

// ── Status badge ──────────────────────────────────────────────────────────────
const getStatusBadge = (status: string) => {
  switch (status) {
    case 'pending':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800 border border-amber-300">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
          Pending
        </span>
      )
    case 'proposed':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 border border-blue-200">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
          Package Proposed
        </span>
      )
    case 'confirmed':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
          <svg
            className="h-3 w-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
          Confirmed
        </span>
      )
    default:
      return (
        <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700 capitalize">
          {String(status).replace(/_/g, ' ')}
        </span>
      )
  }
}

// ── Detail Modal ──────────────────────────────────────────────────────────────
function RenewalDetailModal({
  row,
  onClose,
  onGoToPackages,
}: {
  row: any
  onClose: () => void
  onGoToPackages: () => void
}) {
  if (!row) return null
  return (
    <div className="fixed inset-0 z-[1400] flex items-center justify-center p-4">
      {/* Blurred backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Card */}
      <div className="relative z-10 w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-700 to-slate-800 px-6 py-5 text-white">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="text-base font-bold tracking-tight">
                  Renewal Request
                </h3>
                {getStatusBadge(row.status)}
              </div>
              <p className="mt-1 text-sm text-white/70">
                {row.client_name} · {row.plan_name}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-lg p-1.5 hover:bg-white/20 transition"
            >
              <svg
                className="h-4 w-4 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="bg-white px-6 py-5 space-y-4 max-h-[65vh] overflow-y-auto">
          {/* Key info grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-formBorder bg-cardWrapperBg/40 p-3">
              <p className="text-[11px] font-medium text-secondary uppercase tracking-wide">
                Client
              </p>
              <p className="mt-0.5 text-sm font-semibold text-primaryText">
                {row.client_name || '—'}
              </p>
            </div>
            <div className="rounded-xl border border-formBorder bg-cardWrapperBg/40 p-3">
              <p className="text-[11px] font-medium text-secondary uppercase tracking-wide">
                Current Package
              </p>
              <p className="mt-0.5 text-sm font-semibold text-primaryText">
                {row.plan_name || '—'}
              </p>
            </div>
            <div className="rounded-xl border border-formBorder bg-cardWrapperBg/40 p-3">
              <p className="text-[11px] font-medium text-secondary uppercase tracking-wide">
                Expiry Date
              </p>
              <p className="mt-0.5 text-sm font-semibold text-primaryText">
                {row.end_date
                  ? moment(row.end_date).format('DD MMM YYYY')
                  : '—'}
              </p>
            </div>
            <div className="rounded-xl border border-formBorder bg-cardWrapperBg/40 p-3">
              <p className="text-[11px] font-medium text-secondary uppercase tracking-wide">
                Suggested Start
              </p>
              <p className="mt-0.5 text-sm font-semibold text-primaryText">
                {row.suggested_start_date
                  ? moment(row.suggested_start_date).format('DD MMM YYYY')
                  : '—'}
              </p>
            </div>
            <div className="rounded-xl border border-formBorder bg-cardWrapperBg/40 p-3">
              <p className="text-[11px] font-medium text-secondary uppercase tracking-wide">
                Requested By
              </p>
              <p className="mt-0.5 text-sm font-semibold text-primaryText">
                {row.requested_by?.name || '—'}
              </p>
              {row.requested_by?.role && (
                <p className="text-xs text-secondary capitalize">
                  {row.requested_by.role}
                </p>
              )}
            </div>
            <div className="rounded-xl border border-formBorder bg-cardWrapperBg/40 p-3">
              <p className="text-[11px] font-medium text-secondary uppercase tracking-wide">
                Sales Owner
              </p>
              <p className="mt-0.5 text-sm font-semibold text-primaryText">
                {capitalizeFirst(row.sales_owner?.name) || 'Superadmin queue'}
              </p>
            </div>
          </div>

          {/* Renewal notes — full, scrollable */}
          {row.notes && (
            <div>
              <p className="text-xs font-semibold text-secondary mb-1.5 uppercase tracking-wide">
                Renewal Notes
              </p>
              <div className="rounded-xl border border-formBorder bg-amber-50/40 p-4 text-sm text-primaryText whitespace-pre-wrap leading-relaxed">
                {row.notes}
              </div>
            </div>
          )}

          {/* Requested at */}
          {row.created_at && (
            <p className="text-xs text-secondary text-right">
              Requested on{' '}
              <strong className="text-primaryText">
                {moment(row.created_at).format('DD MMM YYYY, h:mm A')}
              </strong>
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="bg-white border-t border-formBorder px-6 py-4 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-formBorder px-5 py-2 text-sm font-semibold text-secondary hover:bg-cardWrapperBg transition active:scale-[0.98]"
          >
            Close
          </button>
          <button
            type="button"
            onClick={onGoToPackages}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-slate-700 to-slate-800 px-5 py-2 text-sm font-bold text-white shadow-sm hover:from-slate-800 hover:to-slate-900 transition active:scale-[0.98]"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add New Subscription / Package
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function RenewalRequests() {
  const navigate = useNavigate()
  const [params, setParams] = useState({
    page: 1,
    per_page: 20,
    search: '',
    status: '',
  })
  const [detailRow, setDetailRow] = useState<any>(null)

  const { data, isFetching } = useRenewalRequests(params)
  const requests = data?.renewal_requests || []

  const goToPackages = (row: any) => {
    const query = new URLSearchParams({ tab: 'packages' })
    if (row.status === 'pending') {
      query.set('renewal_request_id', String(row.id))
      if (row.suggested_start_date)
        query.set('start_date', row.suggested_start_date)
    }
    navigate(`/sales/clients/${row.user_id}?${query}`)
  }

  const columns = useMemo<any[]>(
    () => [
      {
        title: 'Client',
        field: 'client_name',
        customCell: true,
        renderCell: (row: any) => ({
          cell: (
            <div>
              <button
                type="button"
                className="text-sm font-semibold text-blue-600 hover:underline text-left"
                onClick={() => setDetailRow(row)}
              >
                {row.client_name || '—'}
              </button>
              <div className="text-xs text-secondary">
                {row.client?.phone || row.client?.email || '--'}
              </div>
            </div>
          ),
        }),
        isVisible: true,
      },
      {
        title: 'Current Package',
        field: 'plan_name',
        customCell: true,
        renderCell: (row: any) => ({
          cell: (
            <div className="text-sm font-medium text-primaryText">
              {row.plan_name || '—'}
            </div>
          ),
        }),
        isVisible: true,
      },
      {
        title: 'Expiry Date',
        field: 'end_date',
        customCell: true,
        renderCell: (row: any) => ({
          cell: (
            <div>
              <div className="text-sm text-primaryText">
                {row.end_date
                  ? moment(row.end_date).format('DD MMM YYYY')
                  : '—'}
              </div>
              {row.end_date && (
                <div className="text-xs text-secondary">
                  {moment(row.end_date).fromNow()}
                </div>
              )}
            </div>
          ),
        }),
        isVisible: true,
      },
      {
        title: 'Requested By',
        field: 'requested_by',
        customCell: true,
        renderCell: (row: any) => ({
          cell: (
            <div>
              <div className="text-sm font-medium text-primaryText">
                {row.requested_by?.name || '—'}
              </div>
              {row.requested_by?.role && (
                <div className="text-xs text-secondary capitalize">
                  {row.requested_by.role}
                </div>
              )}
            </div>
          ),
        }),
        isVisible: true,
      },
      {
        title: 'Sales Owner',
        field: 'sales_owner',
        customCell: true,
        renderCell: (row: any) => ({
          cell: (
            <div className="text-sm text-primaryText">
              {capitalizeFirst(row.sales_owner?.name) || (
                <span className="text-secondary italic">Superadmin queue</span>
              )}
            </div>
          ),
        }),
        isVisible: true,
      },
      {
        title: 'Renewal Notes',
        field: 'notes',
        customCell: true,
        renderCell: (row: any) => ({
          cell: row.notes ? (
            <div className="max-w-[200px]">
              <p
                className="text-sm text-primaryText truncate"
                title={row.notes}
              >
                {row.notes}
              </p>
              {row.notes.length > 40 && (
                <p className="text-xs text-secondary italic">
                  Click view to read more
                </p>
              )}
            </div>
          ) : (
            <span className="text-xs text-secondary italic">No notes</span>
          ),
          toolTip: row.notes || '',
        }),
        isVisible: true,
      },
      {
        title: 'Status',
        field: 'status',
        customCell: true,
        renderCell: (row: any) => ({
          cell: getStatusBadge(row.status),
          toolTip: row.status,
        }),
        isVisible: true,
      },
    ],
    []
  )

  const actionProps = useMemo(
    () => [
      {
        title: 'View Details',
        toolTip: 'View full renewal request details',
        icon: <Icons name="eye" />,
        action: (row: any) => setDetailRow(row),
      },
      {
        title: 'Add Subscription',
        toolTip: 'Go to client packages to add a new subscription',
        icon: <Icons name="add" />,
        action: (row: any) => goToPackages(row),
      },
    ],
    []
  )

  return (
    <div>
      <ListingHeader
        data={{ title: 'Renewal Requests' }}
        checkPermission={false}
      />

      <div className="p-4">
        <SmartTable
          data={requests}
          dataRowKey="id"
          columns={columns}
          toolbar
          search
          searchPlaceholder="Search by client..."
          searchValue={params.search}
          onSearchChange={(search) => setParams({ ...params, search, page: 1 })}
          toolbarExtra={
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-600">Status</label>
              <select
                className="w-52 border border-gray-300 p-[11px] rounded-lg bg-white text-sm text-primaryText focus:outline-none focus:ring-0 focus:border-gray-300"
                value={params.status}
                onChange={(e) =>
                  setParams({ ...params, status: e.target.value, page: 1 })
                }
              >
                <option value="">All statuses</option>
                <option value="pending">Pending</option>
                <option value="proposed">Package Proposed</option>
                <option value="confirmed">Confirmed</option>
              </select>
            </div>
          }
          actionProps={actionProps}
          externalActions
          columnToggle
          pagination
          isLoading={isFetching}
          height={calcWindowHeight(requests.length ? 150 : 218)}
          emptyTitle="No renewal requests found"
          paginationProps={{
            currentPage: data?.meta?.current_page || 1,
            total: data?.meta?.total_count || 0,
            totalPages: data?.meta?.total_pages || 1,
            rowsPerPage: params.per_page,
            onPagination: (page) => setParams({ ...params, page }),
            onRowsPerPage: (rows) =>
              setParams({ ...params, per_page: Number(rows), page: 1 }),
            dropOptions: [10, 20, 50, 100],
          }}
        />
      </div>

      {/* Detail modal */}
      <RenewalDetailModal
        row={detailRow}
        onClose={() => setDetailRow(null)}
        onGoToPackages={() => {
          setDetailRow(null)
          if (detailRow) goToPackages(detailRow)
        }}
      />
    </div>
  )
}
