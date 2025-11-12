import React from 'react'
import TextField from '../inputs/TextField'
import CommonDatePicker from '../inputs/DatePicker'

type FreezeForm = {
  reason: string
  start_date: string
  end_date: string
}

type FreezeUserModalProps = {
  isOpen: boolean
  onClose: () => void
  onSubmit: () => void
  loading?: boolean
  values: FreezeForm
  onChange: (arg: { name: string; value: any }) => void
}

export default function FreezeUserModal({
  isOpen,
  onClose,
  onSubmit,
  loading,
  values,
  onChange,
}: FreezeUserModalProps) {
  if (!isOpen) return null

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const startDateVal = values.start_date ? new Date(values.start_date) : null
  const endMinDate = startDateVal ? new Date(startDateVal) : undefined
  if (endMinDate) endMinDate.setHours(0, 0, 0, 0)

  const handleStartDateChange = (data: { name: string; value: any }) => {
    onChange(data)
    onChange({ name: 'end_date', value: null })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black opacity-50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-popupShadow w-[500px] max-h-[600px] max-w-full mx-4">
        <div className="p-5 border-b border-formBorder flex items-center justify-between">
          <h3 className="font-semibold text-l leading-7 text-blackAlt">
            Freeze User
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
            id="freeze-reason"
            name="reason"
            value={values.reason}
            onChange={(e: any) =>
              onChange({ name: 'reason', value: e.target.value })
            }
            label={'Reason'}
          />
          <CommonDatePicker
            name="start_date"
            label="Start Date"
            value={values.start_date}
            onChange={handleStartDateChange}
            minDate={tomorrow}
          />
          <CommonDatePicker
            name="end_date"
            label="End Date"
            value={values.end_date}
            onChange={onChange}
            minDate={endMinDate}
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
            disabled={loading}
          >
            {loading ? 'Freezing...' : 'Freeze'}
          </button>
        </div>
      </div>
    </div>
  )
}
