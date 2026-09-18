import React, { useEffect, useRef, useState } from 'react'
import moment from 'moment'
import { DialogModal } from '../../components/common'
import { useSnackbarManager } from '../../components/common/snackbar'
import Icons from '../../components/common/icons'
import TextField from '../../components/common/inputs/TextField'
import TextArea from '../../components/common/inputs/TextArea'
import { getApiErrorMessage } from '../../utilities/commonUtilities'
import { completeRefundRequest } from './api'

interface CompleteRefundModalProps {
  isOpen: boolean
  refund: any
  onClose: () => void
  onSuccess: () => void
}

const RETURN_METHODS = [
  { value: 'upi', label: 'UPI' },
  { value: 'bank_transfer', label: 'Bank Transfer (NEFT/RTGS/IMPS)' },
  { value: 'card', label: 'Credit/Debit Card' },
  { value: 'cash', label: 'Cash' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'other', label: 'Other' },
]

export default function CompleteRefundModal({
  isOpen,
  refund,
  onClose,
  onSuccess,
}: CompleteRefundModalProps) {
  const { enqueueSnackbar } = useSnackbarManager()
  const [returnMethod, setReturnMethod] = useState('upi')
  const [amount, setAmount] = useState('')
  const [refundDate, setRefundDate] = useState(moment().format('YYYY-MM-DD'))
  const [transactionId, setTransactionId] = useState('')
  const [notes, setNotes] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (refund) {
      setAmount(String(refund.amount || ''))
      setReturnMethod('upi')
      setRefundDate(moment().format('YYYY-MM-DD'))
      setTransactionId('')
      setNotes('')
      setFile(null)
    }
  }, [refund])

  if (!refund) return null

  const handleSubmit = async () => {
    if (!returnMethod) {
      enqueueSnackbar('Please select the method of return.', {
        variant: 'error',
      })
      return
    }
    if (!amount || Number(amount) <= 0) {
      enqueueSnackbar('Please enter a valid refund amount.', {
        variant: 'error',
      })
      return
    }
    if (!refundDate) {
      enqueueSnackbar('Please enter the refund date.', { variant: 'error' })
      return
    }
    // Open the in-app confirmation popup instead of window.confirm
    setShowConfirm(true)
  }

  const handleConfirmedSubmit = async () => {
    setShowConfirm(false)
    try {
      setLoading(true)
      const formData = new FormData()
      formData.append('return_method', returnMethod)
      formData.append('amount', amount)
      formData.append('refund_date', refundDate)
      formData.append('transaction_id', transactionId.trim())
      formData.append('dispense_notes', notes.trim())
      if (file) {
        formData.append('refund_receipt', file)
      }

      await completeRefundRequest(refund.id, formData)
      enqueueSnackbar(
        'Refund marked as completed. Subscription has been cancelled.',
        {
          variant: 'success',
        }
      )
      onSuccess()
      onClose()
    } catch (err: any) {
      enqueueSnackbar(getApiErrorMessage(err) || 'Failed to complete refund.', {
        variant: 'error',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <DialogModal
        isOpen={isOpen}
        onClose={onClose}
        title="Complete Refund & Cancel Subscription"
        subTitle="Record the manual dispensing payment details for this approved refund."
        actionLabel={loading ? 'Processing...' : 'Mark Refund Completed'}
        actionLoader={loading}
        onSubmit={handleSubmit}
        secondaryAction={onClose}
        secondaryActionLabel="Cancel"
        small={false}
        body={
          <div className="space-y-4">
            {/* Warning Banner */}
            <div className="rounded-xl border border-red-200 bg-red-50/70 p-3 flex items-start gap-2.5 text-xs text-red-950">
              <Icons
                name="notification"
                className="h-4 w-4 text-red-600 shrink-0 mt-0.5"
              />
              <div>
                <strong className="font-semibold block">
                  Important: Subscription Cancellation
                </strong>
                Completing this refund will automatically update the
                subscription status to{' '}
                <span className="font-bold text-red-700 underline">
                  CANCELLED
                </span>{' '}
                and terminate all active service staff assignments for this
                cycle.
              </div>
            </div>

            {/* Form Fields Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Method of Return — native select styled to match label-text pattern */}
              <div>
                <label className="labels label-text">
                  Method of Return <span className="text-error"> *</span>
                </label>
                <select
                  className="w-full textfield mt-[3px]"
                  value={returnMethod}
                  onChange={(e) => setReturnMethod(e.target.value)}
                >
                  {RETURN_METHODS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Refund Amount */}
              <div>
                <label className="labels label-text">
                  Refund Amount (₹) <span className="text-error"> *</span>
                </label>
                <input
                  id="refund-amount"
                  type="number"
                  min="0"
                  step="any"
                  className="w-full textfield mt-[3px] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Amount refunded"
                />
              </div>

              {/* Refund Date */}
              <TextField
                id="refund-date"
                name="refund_date"
                label="Refund Date"
                type="date"
                required
                value={refundDate}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setRefundDate(e.target.value)
                }
              />

              {/* Transaction / Reference ID */}
              <TextField
                id="transaction-id"
                name="transaction_id"
                label="Transaction ID / UTR / Reference"
                type="text"
                value={transactionId}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setTransactionId(e.target.value)
                }
                placeholder="e.g. UPI-123456789"
              />
            </div>

            {/* Dispense Notes */}
            <TextArea
              id="dispense-notes"
              name="dispense_notes"
              label="Dispensing Notes / Remarks"
              rows={2}
              value={notes}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setNotes(e.target.value)
              }
              placeholder="Add any details about the payment return transfer..."
            />

            {/* Receipt Upload — dropzone */}
            <div>
              <label className="labels label-text mb-1.5 block">
                Refund Receipt / Transfer Proof{' '}
                <span className="text-secondary font-normal">(Optional)</span>
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
                      Click to upload receipt or proof of transfer
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

      {showConfirm && (
        <div className="fixed inset-0 z-[1500] flex items-center justify-center p-4">
          {/* Blurred backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowConfirm(false)}
          />

          {/* Confirm card */}
          <div className="relative z-10 w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl">
            {/* Red gradient header */}
            <div className="bg-gradient-to-br from-red-600 to-rose-700 px-6 pt-6 pb-8 text-white text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                <svg
                  className="h-7 w-7 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-bold tracking-tight">
                Confirm Refund Completion
              </h3>
              <p className="mt-1 text-sm text-red-100">
                This action is permanent and cannot be undone.
              </p>
            </div>

            {/* Card body */}
            <div className="bg-white px-6 py-5 space-y-4">
              <p className="text-sm text-gray-700 text-center">
                The client&apos;s subscription will be immediately marked as{' '}
                <span className="font-bold text-red-600">CANCELLED</span> and
                all service staff assignments for this cycle will be terminated.
              </p>

              {/* Summary chips */}
              <div className="flex items-center justify-center gap-3">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-800">
                  <svg
                    className="h-3.5 w-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  ₹{Number(amount || 0).toLocaleString()}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-200 px-3 py-1 text-xs font-semibold text-blue-800">
                  <svg
                    className="h-3.5 w-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                    />
                  </svg>
                  {RETURN_METHODS.find((m) => m.value === returnMethod)?.label}
                </span>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 rounded-xl border border-gray-200 bg-white py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition active:scale-[0.98]"
                >
                  Go Back
                </button>
                <button
                  type="button"
                  onClick={handleConfirmedSubmit}
                  disabled={loading}
                  className="flex-1 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 py-2.5 text-sm font-bold text-white shadow-sm hover:from-red-700 hover:to-rose-700 transition active:scale-[0.98] disabled:opacity-60"
                >
                  {loading ? 'Processing...' : 'Yes, Complete Refund'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
