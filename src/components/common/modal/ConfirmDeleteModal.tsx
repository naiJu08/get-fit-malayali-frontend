import React from 'react'
import DialogModal from './DialogModal'

type ConfirmDeleteModalProps = {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  loading?: boolean
  title?: string
  subTitle?: string
  confirmLabel?: string
  cancelLabel?: string
}

export default function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  loading,
  title = 'Are you sure?',
  subTitle = 'Do you really want to delete these records? This process cannot be undone.',
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
}: ConfirmDeleteModalProps) {
  return (
    <DialogModal
      isOpen={isOpen}
      onClose={() => onClose()}
      title={undefined}
      small
      headborder={false}
      isCloseIcon
      actionBody={
        <div className="flex flex-col items-center">
          <div className="flex items-center justify-center mb-4 mt-2">
            <div className="w-16 h-16 rounded-full border-2 border-rose-500 flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="28"
                height="28"
                viewBox="0 0 24 24"
                className="text-rose-500"
              >
                <path
                  fill="currentColor"
                  d="M16.192 6.344L12 10.536L7.808 6.344L6.394 7.758L10.586 11.95L6.394 16.142L7.808 17.556L12 13.364L16.192 17.556L17.606 16.142L13.414 11.95L17.606 7.758z"
                />
              </svg>
            </div>
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2 text-center">
            {title}
          </h3>
          <p className="text-sm text-gray-500 mb-5 text-center max-w-xs">
            {subTitle}
          </p>
          <div className="flex gap-3 w-full justify-center">
            <button
              type="button"
              className="px-4 py-2 rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300"
              onClick={onClose}
              disabled={loading}
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              className="px-4 py-2 rounded-md bg-rose-500 text-white hover:bg-rose-600 disabled:opacity-70"
              onClick={onConfirm}
              disabled={loading}
            >
              {loading ? 'Deleting...' : confirmLabel}
            </button>
          </div>
        </div>
      }
    />
  )
}
