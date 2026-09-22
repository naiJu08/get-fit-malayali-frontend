import React, { useRef, useState } from 'react'
import { DialogModal } from '../../components/common'
import { useSnackbarManager } from '../../components/common/snackbar'
import Icons from '../../components/common/icons'
import TextArea from '../../components/common/inputs/TextArea'
import { getApiErrorMessage } from '../../utilities/commonUtilities'
import {
  submitRefundToSuperadmin,
  initiateAndSubmitRefundToSuperadmin,
} from './api'

interface SubmitToSuperadminModalProps {
  isOpen: boolean
  refund: any
  onClose: () => void
  onSuccess: () => void
}

export default function SubmitToSuperadminModal({
  isOpen,
  refund,
  onClose,
  onSuccess,
}: SubmitToSuperadminModalProps) {
  const { enqueueSnackbar } = useSnackbarManager()
  const [remarks, setRemarks] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  if (!refund) return null

  const handleSubmit = async () => {
    if (!remarks.trim()) {
      enqueueSnackbar('Please provide remarks for Superadmin review.', {
        variant: 'error',
      })
      return
    }
    if (!file) {
      enqueueSnackbar('Please upload a supporting document (PDF or image).', {
        variant: 'error',
      })
      return
    }

    try {
      setLoading(true)
      const formData = new FormData()
      formData.append('sales_remarks', remarks.trim())
      formData.append('supporting_document', file)

      if (refund.id) {
        await submitRefundToSuperadmin(refund.id, formData)
      } else {
        const subId = refund.subscription?.id || refund.subscription_id
        await initiateAndSubmitRefundToSuperadmin(subId, formData)
      }
      enqueueSnackbar('Refund request submitted to Superadmin successfully.', {
        variant: 'success',
      })
      setRemarks('')
      setFile(null)
      onSuccess()
      onClose()
    } catch (err: any) {
      enqueueSnackbar(
        getApiErrorMessage(err) || 'Failed to submit refund request.',
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
      title="Submit Refund Request to Superadmin"
      subTitle="Review assignee remarks and attach supporting documentation for Superadmin approval."
      actionLabel={loading ? 'Submitting...' : 'Submit to Superadmin'}
      actionLoader={loading}
      onSubmit={handleSubmit}
      secondaryAction={onClose}
      secondaryActionLabel="Cancel"
      small={false}
      body={
        <div className="space-y-4">
          {/* Summary Card */}
          <div className="rounded-xl border border-formBorder bg-cardWrapperBg/40 p-4 space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-secondary font-medium">Client:</span>
              <span className="font-semibold text-primaryText">
                {refund.client?.name} ({refund.client?.phone || 'No phone'})
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-secondary font-medium">Package:</span>
              <span className="font-semibold text-primaryText">
                {refund.subscription?.plan_name ||
                  `Sub #${refund.subscription?.id}`}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-secondary font-medium">Refund Amount:</span>
              <span className="text-sm font-bold text-emerald-700">
                ₹{Number(refund.amount || 0).toLocaleString()}
              </span>
            </div>
            {refund.initiation?.remarks && (
              <div className="pt-2 border-t border-formBorder/60">
                <span className="text-secondary block mb-1">
                  Assignee Reason (
                  {refund.initiation?.initiated_by?.name || 'Staff'}):
                </span>
                <p className="rounded-lg bg-white p-2.5 text-primaryText italic border border-formBorder/50">
                  &quot;{refund.initiation.remarks}&quot;
                </p>
              </div>
            )}
          </div>

          {/* Sales Remarks */}
          <TextArea
            id="sales-remarks"
            name="sales_remarks"
            label="Sales Remarks / Recommendation"
            required
            rows={3}
            placeholder="Provide verification notes and reasons for recommending refund approval..."
            value={remarks}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              setRemarks(e.target.value)
            }
          />

          {/* Document Upload */}
          <div>
            <label className="block labels label-text mb-1.5">
              Supporting Document <span className="text-error"> *</span>
            </label>
            <div
              className="rounded-xl border-2 border-dashed border-formBorder bg-cardWrapperBg/40 p-4 transition hover:border-primary/50 cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,application/pdf"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
              {file ? (
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                      <Icons name="attach-file" className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-primaryText truncate max-w-xs">
                        {file.name}
                      </p>
                      <p className="text-xs text-secondary">
                        {(file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setFile(null)
                    }}
                    className="text-xs text-red-500 hover:text-red-700 font-semibold shrink-0"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 py-2 text-center">
                  <Icons
                    name="file-upload"
                    className="h-8 w-8 text-secondary"
                  />
                  <p className="text-sm font-semibold text-primaryText">
                    Click to upload supporting document
                  </p>
                  <p className="text-xs text-secondary">
                    PDF, JPG, PNG or WEBP · Max 10MB
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      }
    />
  )
}
