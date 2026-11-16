import React from 'react'
import TextField from '../inputs/TextField'

type DropOutModalProps = {
  isOpen: boolean
  onClose: () => void
  onSubmit: () => void
  loading?: boolean
  reason: string
  onChangeReason: (value: string) => void
}

export default function DropOutModal({
  isOpen,
  onClose,
  onSubmit,
  loading,
  reason,
  onChangeReason,
}: DropOutModalProps) {
  if (!isOpen) return null

  const canSubmit = Boolean(reason?.trim?.())

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black opacity-50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-popupShadow w-[500px] max-h-[600px] max-w-full mx-4">
        <div className="p-5 border-b border-formBorder flex items-center justify-between">
          <h3 className="font-semibold text-l leading-7 text-blackAlt">
            Drop out
          </h3>
          <button
            type="button"
            className="w-8 h-8 inline-flex items-center justify-center text-primaryText"
            onClick={onClose}
            disabled={loading}
          >
            <span className="text-xl leading-none">×</span>
          </button>
        </div>
        <div className="p-5 flex flex-col gap-4">
          <TextField
            id="dropout-reason"
            name="reason"
            value={reason}
            onChange={(e: any) => onChangeReason(e.target.value)}
            label={'Reason'}
            maxLength={250}
            required
          />
        </div>
        <div className="p-5 pt-0 flex items-center justify-end gap-2">
          <button
            type="button"
            className="px-4 py-2 rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-70"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="button"
            className="px-4 py-2 rounded-md bg-primaryGreen text-white hover:bg-primary/90 disabled:opacity-70"
            onClick={onSubmit}
            disabled={loading || !canSubmit}
          >
            {loading ? 'Submitting...' : 'Drop out'}
          </button>
        </div>
      </div>
    </div>
  )
}
