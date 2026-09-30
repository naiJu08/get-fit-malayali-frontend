import React, { useState } from 'react'
import { DialogModal } from '../../components/common'
import { useSnackbarManager } from '../../components/common/snackbar'
import { getApiErrorMessage } from '../../utilities/commonUtilities'
import { approveRefundRequest, rejectRefundRequest } from './api'

interface SuperadminReviewModalProps {
  isOpen: boolean
  refund: any
  onClose: () => void
  onSuccess: () => void
}

export default function SuperadminReviewModal({
  isOpen,
  refund,
  onClose,
  onSuccess,
}: SuperadminReviewModalProps) {
  const { enqueueSnackbar } = useSnackbarManager()
  const [remarks, setRemarks] = useState('')
  const [loading, setLoading] = useState(false)

  if (!refund) return null

  const handleDecision = async (action: 'approve' | 'reject') => {
    if (action === 'reject' && !remarks.trim()) {
      enqueueSnackbar(
        'Please provide a reason for rejecting the refund request.',
        {
          variant: 'error',
        }
      )
      return
    }

    try {
      setLoading(true)
      if (action === 'approve') {
        await approveRefundRequest(refund.id, remarks.trim())
        enqueueSnackbar(
          'Refund request approved. Sales can now dispense the refund.',
          {
            variant: 'success',
          }
        )
      } else {
        await rejectRefundRequest(refund.id, remarks.trim())
        enqueueSnackbar('Refund request rejected.', {
          variant: 'info',
        })
      }
      setRemarks('')
      onSuccess()
      onClose()
    } catch (err: any) {
      enqueueSnackbar(
        getApiErrorMessage(err) || `Failed to ${action} refund request.`,
        {
          variant: 'error',
        }
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <DialogModal
      isOpen={isOpen}
      onClose={onClose}
      title="Review Refund Request"
      subTitle="Inspect the justification and supporting documentation before making a decision."
      small={false}
      body={
        <div className="space-y-4">
          {/* Summary Card */}
          <div className="rounded-xl border border-formBorder bg-cardWrapperBg/40 p-4 space-y-2.5 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-secondary font-medium">Client:</span>
              <span className="font-semibold text-primaryText">
                {refund.client?.name} (
                {refund.client?.email || refund.client?.phone})
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-secondary font-medium">Package:</span>
              <span className="font-semibold text-primaryText">
                {refund.subscription?.plan_name}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-secondary font-medium">
                Amount to Refund:
              </span>
              <span className="text-sm font-bold text-emerald-700">
                ₹{Number(refund.amount || 0).toLocaleString()}
              </span>
            </div>

            {/* Assignee Remarks */}
            {refund.initiation?.remarks && (
              <div className="pt-2 border-t border-formBorder/60">
                <span className="text-secondary block mb-1">
                  1. Assignee Justification (
                  {refund.initiation?.initiated_by?.name}):
                </span>
                <p className="rounded-lg bg-white p-2.5 text-primaryText italic border border-formBorder/50">
                  &quot;{refund.initiation.remarks}&quot;
                </p>
              </div>
            )}

            {/* Sales Remarks */}
            {refund.sales_submission?.remarks && (
              <div className="pt-2 border-t border-formBorder/60">
                <span className="text-secondary block mb-1">
                  2. Sales Review & Notes (
                  {refund.sales_submission?.submitted_by?.name}):
                </span>
                <p className="rounded-lg bg-white p-2.5 text-primaryText italic border border-formBorder/50">
                  &quot;{refund.sales_submission.remarks}&quot;
                </p>
              </div>
            )}

            {/* Document Link */}
            {refund.sales_submission?.supporting_document_url && (
              <div className="pt-2 border-t border-formBorder/60">
                <div className="text-[11px] font-bold text-gray-800 uppercase tracking-wide mb-1.5">
                  ATTACHED SUPPORTING DOCUMENT:
                </div>
                <a
                  href={refund.sales_submission.supporting_document_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg border border-purple-200 bg-purple-50/50 px-4 py-2 text-xs font-semibold text-purple-800 hover:bg-purple-100/80 transition"
                >
                  <svg
                    className="h-4 w-4 text-purple-600 shrink-0"
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
                  <span className="break-all">
                    {refund.sales_submission.supporting_document_filename ||
                      'View Document'}
                  </span>
                  <svg
                    className="h-3.5 w-3.5 text-purple-500 shrink-0 ml-0.5"
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

          {/* Superadmin remarks input */}
          <div>
            <label className="block text-xs font-semibold text-primaryText mb-1.5">
              Superadmin Remarks (Required if rejecting)
            </label>
            <textarea
              className="w-full rounded-xl border border-formBorder p-3 text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              rows={3}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Enter decision notes or reasons for approval / rejection..."
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-formBorder">
            <button
              type="button"
              disabled={loading}
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-secondary hover:text-primaryText transition"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => handleDecision('reject')}
              className="px-4 py-2 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl transition"
            >
              {loading ? 'Processing...' : 'Reject Request'}
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => handleDecision('approve')}
              className="px-5 py-2 text-xs font-semibold text-white bg-primaryGreen hover:bg-emerald-600 rounded-xl shadow-xs transition"
            >
              {loading ? 'Processing...' : 'Approve Refund'}
            </button>
          </div>
        </div>
      }
    />
  )
}
