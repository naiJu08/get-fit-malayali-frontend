import React from 'react'
import { useNavigate } from 'react-router-dom'
import moment from 'moment'
import { DialogModal } from '../../components/common'
import { useAuthStore } from '../../store/authStore'

interface RefundDetailsModalProps {
  isOpen: boolean
  refund: any
  onClose: () => void
}

export default function RefundDetailsModal({
  isOpen,
  refund,
  onClose,
}: RefundDetailsModalProps) {
  const navigate = useNavigate()
  const loginRole = useAuthStore((s) => s.roleData?.name?.toLowerCase?.())

  if (!refund) return null

  const getClientUrl = (clientId: string | number) => {
    if (loginRole === 'sales') return `/sales/clients/${clientId}`
    return `/users/${clientId}/details`
  }

  const getInitials = (name?: string) => {
    if (!name) return 'CL'
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('')
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'initiated':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 border border-blue-200 shadow-xs">
            <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
            Initiated (Pending Sales)
          </span>
        )
      case 'submitted_to_superadmin':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700 border border-purple-200 shadow-xs">
            <span className="h-2 w-2 rounded-full bg-purple-500 animate-pulse" />
            Under Superadmin Review
          </span>
        )
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800 border border-amber-300 shadow-xs">
            Approved (Pending Dispense)
          </span>
        )
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200 shadow-xs">
            <svg
              className="h-3.5 w-3.5 text-emerald-600"
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
            Completed & Cancelled
          </span>
        )
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 border border-red-200 shadow-xs">
            <svg
              className="h-3.5 w-3.5 text-red-600"
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
            Rejected
          </span>
        )
      default:
        return (
          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 capitalize">
            {status}
          </span>
        )
    }
  }

  // Calculate days before subscription start
  const startDate = refund.subscription?.start_date
  const daysUntilStart = startDate
    ? moment(startDate).diff(moment(), 'days')
    : null

  // Step indices
  const isInitiated = Boolean(refund.initiation?.initiated_at)
  const isSalesSubmitted = Boolean(refund.sales_submission?.submitted_at)
  const isDecided = Boolean(
    refund.superadmin_decision?.approved_at ||
      refund.superadmin_decision?.rejected_at
  )
  const isCompleted = Boolean(refund.completion?.completed_at)

  return (
    <DialogModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Refund Request #${refund.id}`}
      subTitle="Complete audit history, package details, and timeline of the refund lifecycle."
      small={false}
      className="w-full max-w-4xl"
      body={
        <div className="space-y-5 text-sm">
          {/* Top Client Profile & Action Bar */}
          <div className="rounded-2xl border border-formBorder bg-gradient-to-r from-blue-50/70 via-white to-cardWrapperBg/40 p-5 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white font-bold text-base shadow-sm">
                  {getInitials(refund.client?.name)}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-bold text-primaryText">
                      {refund.client?.name || 'Client'}
                    </h3>
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600">
                      ID #{refund.client?.id}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-secondary">
                    {refund.client?.email && (
                      <span className="flex items-center gap-1">
                        <svg
                          className="h-3.5 w-3.5 text-gray-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={1.75}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                          />
                        </svg>
                        {refund.client.email}
                      </span>
                    )}
                    {refund.client?.phone && (
                      <span className="flex items-center gap-1">
                        <svg
                          className="h-3.5 w-3.5 text-gray-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={1.75}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                          />
                        </svg>
                        {refund.client.phone}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {refund.client?.id && (
                <button
                  type="button"
                  onClick={() => {
                    onClose()
                    navigate(getClientUrl(refund.client.id))
                  }}
                  className="inline-flex items-center gap-2 rounded-xl bg-white border border-blue-300 px-3.5 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-50 hover:border-blue-400 transition shadow-xs active:scale-[0.98]"
                >
                  <svg
                    className="h-4 w-4 text-blue-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  <span>View Full Client Profile & Subscriptions</span>
                  <svg
                    className="h-3.5 w-3.5 text-blue-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {/* Metric 1: Amount & Status */}
            <div className="rounded-xl border border-formBorder bg-white p-4 shadow-2xs">
              <div className="text-xs font-medium text-secondary">
                Refund Amount Requested
              </div>
              <div className="mt-1 text-2xl font-black text-emerald-700">
                ₹{Number(refund.amount || 0).toLocaleString()}
              </div>
              <div className="mt-2.5">{getStatusBadge(refund.status)}</div>
            </div>

            {/* Metric 2: Package Plan */}
            <div className="rounded-xl border border-formBorder bg-white p-4 shadow-2xs">
              <div className="text-xs font-medium text-secondary">
                Linked Package / Plan
              </div>
              <div className="mt-1 text-base font-bold text-primaryText truncate">
                {refund.subscription?.plan_name || 'Assigned Plan'}
              </div>
              <div className="mt-2 text-xs text-secondary flex items-center gap-1.5">
                <span className="rounded-md bg-gray-100 px-2 py-0.5 font-medium text-gray-700">
                  Subscription #{refund.subscription?.id || '—'}
                </span>
                {refund.subscription?.duration_days && (
                  <span className="text-gray-500">
                    • {refund.subscription.duration_days} days
                  </span>
                )}
              </div>
            </div>

            {/* Metric 3: Timing & Eligibility */}
            <div className="rounded-xl border border-formBorder bg-white p-4 shadow-2xs">
              <div className="text-xs font-medium text-secondary">
                Subscription Schedule
              </div>
              <div className="mt-1 text-xs font-bold text-primaryText">
                {refund.subscription?.start_date
                  ? moment(refund.subscription.start_date).format('DD MMM YYYY')
                  : '--'}{' '}
                to{' '}
                {refund.subscription?.end_date
                  ? moment(refund.subscription.end_date).format('DD MMM YYYY')
                  : '--'}
              </div>
              <div className="mt-2">
                {daysUntilStart !== null && daysUntilStart >= 0 ? (
                  <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-800 border border-emerald-200">
                    <svg
                      className="h-3 w-3 text-emerald-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Starts in {daysUntilStart} day
                    {daysUntilStart === 1 ? '' : 's'} (Eligible)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-700">
                    Pre-start refund window
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Visual Lifecycle Stepper Header */}
          <div className="rounded-xl border border-formBorder/80 bg-cardWrapperBg/40 px-4 py-3">
            <div className="text-xs font-bold uppercase tracking-wider text-secondary mb-3">
              Refund Lifecycle Progress
            </div>
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              {/* Step 1 */}
              <div
                className={`p-2 rounded-lg border transition ${isInitiated ? 'bg-blue-50/80 border-blue-200 font-bold text-blue-900' : 'bg-white border-formBorder text-gray-400'}`}
              >
                <div className="text-[10px] uppercase font-semibold text-blue-700">
                  Step 1
                </div>
                <div>Assignee Initiated</div>
              </div>
              {/* Step 2 */}
              <div
                className={`p-2 rounded-lg border transition ${isSalesSubmitted ? 'bg-purple-50/80 border-purple-200 font-bold text-purple-900' : 'bg-white border-formBorder text-gray-400'}`}
              >
                <div className="text-[10px] uppercase font-semibold text-purple-700">
                  Step 2
                </div>
                <div>Sales Document</div>
              </div>
              {/* Step 3 */}
              <div
                className={`p-2 rounded-lg border transition ${isDecided ? (refund.status === 'rejected' ? 'bg-red-50/80 border-red-200 font-bold text-red-900' : 'bg-amber-50/80 border-amber-200 font-bold text-amber-900') : 'bg-white border-formBorder text-gray-400'}`}
              >
                <div className="text-[10px] uppercase font-semibold text-amber-700">
                  Step 3
                </div>
                <div>Superadmin Decision</div>
              </div>
              {/* Step 4 */}
              <div
                className={`p-2 rounded-lg border transition ${isCompleted ? 'bg-emerald-50/80 border-emerald-200 font-bold text-emerald-900' : 'bg-white border-formBorder text-gray-400'}`}
              >
                <div className="text-[10px] uppercase font-semibold text-emerald-700">
                  Step 4
                </div>
                <div>Dispensed & Cancelled</div>
              </div>
            </div>
          </div>

          {/* Timeline Stages Details */}
          <div className="space-y-3.5">
            {/* Stage 1: Initiation */}
            <div className="rounded-xl border border-blue-200 bg-white p-4 space-y-2 text-xs shadow-2xs">
              <div className="flex items-center justify-between gap-2 border-b border-gray-100 pb-2.5">
                <span className="font-bold text-primaryText flex items-center gap-2 text-sm">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-bold text-xs">
                    1
                  </span>
                  Initiated by Assigned Staff
                </span>
                <span className="text-secondary text-[11px] font-medium">
                  {refund.initiation?.initiated_at
                    ? moment(refund.initiation.initiated_at).format(
                        'DD MMM YYYY, h:mm A'
                      )
                    : '—'}
                </span>
              </div>
              <div className="text-secondary pt-1">
                Initiated by:{' '}
                <span className="font-semibold text-primaryText">
                  {refund.initiation?.initiated_by?.name || 'Staff User'}
                </span>{' '}
                <span className="capitalize rounded-md bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-700">
                  {refund.initiation?.initiated_by?.role || 'Assignee'}
                </span>
              </div>
              <div className="rounded-xl bg-blue-50/50 p-3 text-primaryText border border-blue-100/70">
                <div className="text-[11px] font-semibold text-blue-900 uppercase tracking-wider mb-1">
                  Assignee Remarks:
                </div>
                <div className="italic text-gray-800">
                  &quot;{refund.initiation?.remarks || 'No remarks recorded.'}
                  &quot;
                </div>
              </div>
            </div>

            {/* Stage 2: Sales Submission */}
            {refund.sales_submission?.submitted_at ? (
              <div className="rounded-xl border border-purple-200 bg-white p-4 space-y-2 text-xs shadow-2xs">
                <div className="flex items-center justify-between gap-2 border-b border-gray-100 pb-2.5">
                  <span className="font-bold text-primaryText flex items-center gap-2 text-sm">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-100 text-purple-700 font-bold text-xs">
                      2
                    </span>
                    Submitted to Superadmin by Sales
                  </span>
                  <span className="text-secondary text-[11px] font-medium">
                    {moment(refund.sales_submission.submitted_at).format(
                      'DD MMM YYYY, h:mm A'
                    )}
                  </span>
                </div>
                <div className="text-secondary pt-1">
                  Submitted by:{' '}
                  <span className="font-semibold text-primaryText">
                    {refund.sales_submission.submitted_by?.name ||
                      'Sales Staff'}
                  </span>
                </div>
                {refund.sales_submission.remarks && (
                  <div className="rounded-xl bg-purple-50/50 p-3 text-primaryText border border-purple-100/70">
                    <div className="text-[11px] font-semibold text-purple-900 uppercase tracking-wider mb-1">
                      Sales Remarks:
                    </div>
                    <div className="italic text-gray-800">
                      &quot;{refund.sales_submission.remarks}&quot;
                    </div>
                  </div>
                )}
                {refund.sales_submission.supporting_document_url && (
                  <div className="pt-2">
                    <div className="text-[11px] font-semibold text-secondary uppercase tracking-wider mb-1.5">
                      Attached Supporting Document:
                    </div>
                    <a
                      href={refund.sales_submission.supporting_document_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-xl border border-purple-200 bg-purple-50/80 px-3.5 py-2 text-xs font-semibold text-purple-800 hover:bg-purple-100 transition shadow-xs"
                    >
                      <svg
                        className="h-4 w-4 text-purple-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      <span>
                        {refund.sales_submission.supporting_document_filename ||
                          'Download Supporting Document'}
                      </span>
                      <svg
                        className="h-3.5 w-3.5 text-purple-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                        />
                      </svg>
                    </a>
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-formBorder bg-gray-50/70 p-3.5 text-xs text-secondary flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                  Stage 2: Pending Sales review and supporting document
                  submission
                </span>
                <span className="text-[11px] text-gray-400 italic">
                  Awaiting Sales
                </span>
              </div>
            )}

            {/* Stage 3: Superadmin Decision */}
            {refund.superadmin_decision?.approved_at ||
            refund.superadmin_decision?.rejected_at ? (
              <div
                className={`rounded-xl border p-4 space-y-2 text-xs shadow-2xs ${
                  refund.status === 'rejected'
                    ? 'border-red-200 bg-red-50/30'
                    : 'border-amber-200 bg-amber-50/30'
                }`}
              >
                <div className="flex items-center justify-between gap-2 border-b border-gray-100 pb-2.5">
                  <span className="font-bold text-primaryText flex items-center gap-2 text-sm">
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded-full font-bold text-xs ${
                        refund.status === 'rejected'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      3
                    </span>
                    Superadmin Decision:{' '}
                    <strong
                      className={
                        refund.status === 'rejected'
                          ? 'text-red-700'
                          : 'text-amber-800'
                      }
                    >
                      {refund.status === 'rejected' ? 'Rejected' : 'Approved'}
                    </strong>
                  </span>
                  <span className="text-secondary text-[11px] font-medium">
                    {moment(
                      refund.superadmin_decision.approved_at ||
                        refund.superadmin_decision.rejected_at
                    ).format('DD MMM YYYY, h:mm A')}
                  </span>
                </div>
                <div className="text-secondary pt-1">
                  Decided by:{' '}
                  <span className="font-semibold text-primaryText">
                    {refund.superadmin_decision.approved_by?.name ||
                      refund.superadmin_decision.rejected_by?.name ||
                      'Superadmin'}
                  </span>
                </div>
                {refund.superadmin_decision.remarks && (
                  <div
                    className={`rounded-xl p-3 border ${
                      refund.status === 'rejected'
                        ? 'bg-red-50 border-red-200 text-red-950'
                        : 'bg-amber-50 border-amber-200 text-amber-950'
                    }`}
                  >
                    <div className="text-[11px] font-semibold uppercase tracking-wider mb-1">
                      Superadmin Remarks:
                    </div>
                    <div className="italic">
                      &quot;{refund.superadmin_decision.remarks}&quot;
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-formBorder bg-gray-50/70 p-3.5 text-xs text-secondary flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-gray-300" />
                  Stage 3: Superadmin review & approval
                </span>
                <span className="text-[11px] text-gray-400 italic">
                  Pending
                </span>
              </div>
            )}

            {/* Stage 4: Completion */}
            {refund.completion?.completed_at ? (
              <div className="rounded-xl border border-emerald-300 bg-emerald-50/40 p-4 space-y-2.5 text-xs shadow-2xs">
                <div className="flex items-center justify-between gap-2 border-b border-emerald-200/70 pb-2.5">
                  <span className="font-bold text-emerald-950 flex items-center gap-2 text-sm">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-200 text-emerald-900 font-bold text-xs">
                      4
                    </span>
                    Refund Completed & Subscription Cancelled
                  </span>
                  <span className="text-secondary text-[11px] font-medium">
                    {moment(refund.completion.completed_at).format(
                      'DD MMM YYYY, h:mm A'
                    )}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-secondary pt-1">
                  <div>
                    <span className="text-gray-500">Method of Return:</span>{' '}
                    <span className="rounded-md bg-emerald-100 px-2 py-0.5 font-bold text-emerald-900 uppercase">
                      {refund.completion.return_method || '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Transaction Ref ID:</span>{' '}
                    <span className="font-mono font-bold text-primaryText">
                      {refund.completion.transaction_id || '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Refund Date:</span>{' '}
                    <strong className="text-primaryText font-semibold">
                      {refund.completion.refund_date
                        ? moment(refund.completion.refund_date).format(
                            'DD MMM YYYY'
                          )
                        : '—'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-gray-500">Dispensed by:</span>{' '}
                    <strong className="text-primaryText font-semibold">
                      {refund.completion.completed_by?.name || 'Sales Staff'}
                    </strong>
                  </div>
                </div>
                {refund.completion.dispense_notes && (
                  <div className="rounded-xl bg-white p-3 text-primaryText border border-emerald-200 mt-1">
                    <div className="text-[11px] font-semibold text-emerald-900 uppercase tracking-wider mb-1">
                      Dispensation Notes:
                    </div>
                    <div className="italic text-gray-800">
                      &quot;{refund.completion.dispense_notes}&quot;
                    </div>
                  </div>
                )}
                {refund.completion.refund_receipt_url && (
                  <div className="pt-2">
                    <div className="text-[11px] font-semibold text-secondary uppercase tracking-wider mb-1.5">
                      Attached Payment Receipt:
                    </div>
                    <a
                      href={refund.completion.refund_receipt_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-xl border border-emerald-300 bg-white px-3.5 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-50 transition shadow-xs"
                    >
                      <svg
                        className="h-4 w-4 text-emerald-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      <span>
                        {refund.completion.refund_receipt_filename ||
                          'Download Receipt Proof'}
                      </span>
                      <svg
                        className="h-3.5 w-3.5 text-emerald-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                        />
                      </svg>
                    </a>
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-formBorder bg-gray-50/70 p-3.5 text-xs text-secondary flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-gray-300" />
                  Stage 4: Refund dispensation and subscription cancellation
                </span>
                <span className="text-[11px] text-gray-400 italic">
                  Pending Dispense
                </span>
              </div>
            )}
          </div>

          {/* Cancellation Impact Info Banner */}
          <div className="rounded-xl bg-amber-50/80 border border-amber-200/90 p-3.5 text-xs text-amber-950 flex items-start gap-2.5">
            <svg
              className="h-4 w-4 text-amber-600 shrink-0 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <span className="font-bold">Subscription Impact: </span>
              {refund.status === 'completed' ? (
                <span>
                  Subscription #{refund.subscription?.id} was automatically
                  marked as <strong>CANCELLED</strong> and all package
                  assignments ended upon completion of this refund.
                </span>
              ) : (
                <span>
                  Once Sales completes the dispensation of ₹
                  {Number(refund.amount || 0).toLocaleString()}, Subscription #
                  {refund.subscription?.id} will immediately be marked as{' '}
                  <strong>CANCELLED</strong>.
                </span>
              )}
            </div>
          </div>

          {/* Action Footer */}
          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 text-xs font-semibold text-secondary hover:text-primaryText rounded-xl border border-formBorder hover:bg-cardWrapperBg transition active:scale-[0.98]"
            >
              Close
            </button>
          </div>
        </div>
      }
    />
  )
}
