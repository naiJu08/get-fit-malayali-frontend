import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import moment from 'moment'
import ListingHeader from '../../components/common/ListingTiles'
import SmartTable from '../../components/common/table/SmartTable'
import Icons from '../../components/common/icons'
import { calcWindowHeight } from '../../utilities/calcHeight'
import { useAuthStore } from '../../store/authStore'
import { useRefundRequests } from './api'
import SubmitToSuperadminModal from './SubmitToSuperadminModal'
import SuperadminReviewModal from './SuperadminReviewModal'
import CompleteRefundModal from './CompleteRefundModal'
import RefundDetailsModal from './RefundDetailsModal'

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'initiated':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 border border-blue-200">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
          Initiated
        </span>
      )
    case 'submitted_to_superadmin':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 px-2.5 py-0.5 text-xs font-semibold text-purple-700 border border-purple-200">
          Submitted to Superadmin
        </span>
      )
    case 'approved':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800 border border-amber-300">
          Approved
        </span>
      )
    case 'completed':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
          Completed
        </span>
      )
    case 'rejected':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-700 border border-red-200">
          Rejected
        </span>
      )
    default:
      return (
        <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700 capitalize">
          {status}
        </span>
      )
  }
}

export default function RefundsPage() {
  const navigate = useNavigate()
  const loginRole = useAuthStore((s) => s.roleData?.name?.toLowerCase?.())

  const getClientUrl = (clientId: string | number) => {
    if (loginRole === 'sales') return `/sales/clients/${clientId}`
    return `/users/${clientId}/details`
  }

  const [params, setParams] = useState({
    page: 1,
    per_page: 20,
    search: '',
    status: '',
  })

  const { data, isFetching, refetch } = useRefundRequests(params)
  const refunds = data?.refund_requests || data?.items || []

  // Modal states
  const [submitModalRefund, setSubmitModalRefund] = useState<any>(null)
  const [reviewModalRefund, setReviewModalRefund] = useState<any>(null)
  const [completeModalRefund, setCompleteModalRefund] = useState<any>(null)
  const [detailsModalRefund, setDetailsModalRefund] = useState<any>(null)

  const columns: any[] = useMemo(
    () => [
      {
        title: 'Client',
        field: 'client.name',
        customCell: true,
        renderCell: (row: any) => ({
          cell: (
            <div>
              <button
                type="button"
                className="text-blue-600 hover:underline font-semibold text-sm text-left"
                onClick={() => setDetailsModalRefund(row)}
              >
                {row.client?.name || 'Client #' + row.client?.id}
              </button>
              <div className="text-xs text-secondary">
                {row.client?.phone || row.client?.email || '--'}
              </div>
            </div>
          ),
          toolTip: row.client?.name || '',
        }),
        isVisible: true,
      },
      {
        title: 'Package / Subscription',
        field: 'subscription.plan_name',
        customCell: true,
        renderCell: (row: any) => ({
          cell: (
            <div>
              <div className="font-semibold text-primaryText text-sm">
                {row.subscription?.plan_name ||
                  `Plan #${row.subscription?.plan_id}`}
              </div>
              <div className="text-xs text-secondary">
                Starts:{' '}
                {row.subscription?.start_date
                  ? moment(row.subscription.start_date).format('DD-MM-YYYY')
                  : '--'}
              </div>
            </div>
          ),
          toolTip: row.subscription?.plan_name || '',
        }),
        isVisible: true,
      },
      {
        title: 'Refund Amount',
        field: 'amount',
        customCell: true,
        renderCell: (row: any) => ({
          cell: (
            <span className="font-bold text-sm text-emerald-700">
              ₹{Number(row.amount || 0).toLocaleString()}
            </span>
          ),
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
      {
        title: 'Initiated By',
        field: 'initiation.initiated_by.name',
        customCell: true,
        renderCell: (row: any) => ({
          cell: (
            <div>
              <div className="text-sm font-medium text-primaryText">
                {row.initiation?.initiated_by?.name || 'Staff'}
              </div>
              <div className="text-xs text-secondary">
                {row.initiation?.initiated_at
                  ? moment(row.initiation.initiated_at).format('DD-MM-YYYY')
                  : '--'}
              </div>
            </div>
          ),
        }),
        isVisible: true,
      },
    ],
    [navigate, loginRole]
  )

  const isSuperAdmin = loginRole === 'superadmin' || loginRole === 'super_admin'

  const actionProps = useMemo(
    () => [
      {
        title: 'View Details',
        toolTip: 'View audit trail and details',
        icon: <Icons name="eye" />,
        action: (row: any) => setDetailsModalRefund(row),
      },
      {
        title: 'Client Profile',
        toolTip: 'View full client profile & packages',
        icon: <Icons name="user" />,
        action: (row: any) => {
          if (row.client?.id) navigate(getClientUrl(row.client.id))
        },
      },
      {
        title: 'Submit to Superadmin',
        toolTip: 'Submit refund request to Superadmin',
        icon: <Icons name="send" />,
        variant: 'primary' as const,
        hide: (row: any) =>
          isSuperAdmin || !row.permissions?.can_submit_to_superadmin,
        action: (row: any) => setSubmitModalRefund(row),
      },
      {
        title: 'Review Decision',
        toolTip: 'Approve or reject refund request',
        icon: <Icons name="edit" />,
        variant: 'primary' as const,
        hide: (row: any) => !row.permissions?.can_approve_or_reject,
        action: (row: any) => setReviewModalRefund(row),
      },
      {
        title: 'Dispense Refund',
        toolTip: 'Record refund payment and cancel subscription',
        icon: <Icons name="check-circle" />,
        variant: 'success' as const,
        hide: (row: any) => isSuperAdmin || !row.permissions?.can_complete,
        action: (row: any) => setCompleteModalRefund(row),
      },
    ],
    [navigate, loginRole, isSuperAdmin]
  )

  return (
    <div>
      <ListingHeader
        data={{ title: 'Refund Requests', icon: 'paymentapproval-icon' }}
        checkPermission={false}
      />

      <div className="p-4">
        <SmartTable
          data={refunds}
          dataRowKey="id"
          columns={columns}
          toolbar
          search
          searchPlaceholder="Search refunds by client, plan, email..."
          searchValue={params.search}
          onSearchChange={(search) => setParams({ ...params, search, page: 1 })}
          onSearch={() => refetch()}
          toolbarExtra={
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-600">Status</label>
              <select
                className="w-64 border border-gray-300 p-[11px] rounded-lg bg-white text-sm text-primaryText focus:outline-none focus:ring-0 focus:border-gray-300"
                value={params.status}
                onChange={(event) =>
                  setParams({ ...params, status: event.target.value, page: 1 })
                }
              >
                <option value="">All statuses</option>
                <option value="initiated">Initiated (Pending Sales)</option>
                <option value="submitted_to_superadmin">
                  Submitted to Superadmin
                </option>
                <option value="approved">Approved (Pending Dispense)</option>
                <option value="completed">Completed</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          }
          actionProps={actionProps}
          externalActions
          columnToggle
          pagination
          isLoading={isFetching}
          height={calcWindowHeight(refunds.length ? 150 : 218)}
          emptyTitle="No refund requests found"
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

      {/* Modals */}
      <SubmitToSuperadminModal
        isOpen={Boolean(submitModalRefund)}
        refund={submitModalRefund}
        onClose={() => setSubmitModalRefund(null)}
        onSuccess={() => refetch()}
      />

      <SuperadminReviewModal
        isOpen={Boolean(reviewModalRefund)}
        refund={reviewModalRefund}
        onClose={() => setReviewModalRefund(null)}
        onSuccess={() => refetch()}
      />

      <CompleteRefundModal
        isOpen={Boolean(completeModalRefund)}
        refund={completeModalRefund}
        onClose={() => setCompleteModalRefund(null)}
        onSuccess={() => refetch()}
      />

      <RefundDetailsModal
        isOpen={Boolean(detailsModalRefund)}
        refund={detailsModalRefund}
        onClose={() => setDetailsModalRefund(null)}
        onSubmitToSuperadmin={(refund) => {
          setDetailsModalRefund(null)
          setSubmitModalRefund(refund)
        }}
        onReviewDecision={(refund) => {
          setDetailsModalRefund(null)
          setReviewModalRefund(refund)
        }}
        onDispenseRefund={(refund) => {
          setDetailsModalRefund(null)
          setCompleteModalRefund(refund)
        }}
      />
    </div>
  )
}
