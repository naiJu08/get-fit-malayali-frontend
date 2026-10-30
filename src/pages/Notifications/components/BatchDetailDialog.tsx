import React from 'react'
import InfoBox from '../../../components/app/alertBox/infoBox'
import DialogModal from '../../../components/common/modal/DialogModal'

type BatchUser = {
  id: string | number
  value: string
}

export type BatchDetailData = {
  id?: string | number
  name?: string
  description?: string
  createdBy?: string
  createdAt?: string
  updatedAt?: string
  userCount?: number
  users?: BatchUser[]
}

type BatchDetailDialogProps = {
  isOpen: boolean
  loading: boolean
  detail: BatchDetailData | null
  onClose: () => void
}

const formatDateTime = (value?: string) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleString()
}

const BatchDetailDialog = ({
  isOpen,
  loading,
  detail,
  onClose,
}: BatchDetailDialogProps) => {
  const bodyContent = (() => {
    if (loading) {
      return <InfoBox content={'Loading batch details...'} />
    }

    if (!detail) {
      return <InfoBox content={'Batch details not available.'} />
    }

    const users = detail.users ?? []

    return (
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 border border-gray-100 rounded-lg p-4">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-gray-500">
              Batch Name
            </span>
            <span className="text-base font-semibold text-gray-900">
              {detail.name || '-'}
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-gray-500">
              Created By
            </span>
            <span className="text-base font-semibold text-gray-900">
              {detail.createdBy || '-'}
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-gray-500">
              Created At
            </span>
            <span className="text-sm text-gray-700">
              {formatDateTime(detail.createdAt)}
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-gray-500">
              Updated At
            </span>
            <span className="text-sm text-gray-700">
              {formatDateTime(detail.updatedAt)}
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-gray-500">
              Total Users
            </span>
            <span className="text-base font-semibold text-gray-900">
              {detail.userCount ?? users.length}
            </span>
          </div>
          {detail.id ? (
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-gray-500">
                Batch ID
              </span>
              <span className="text-sm font-mono text-gray-700">
                {detail.id}
              </span>
            </div>
          ) : null}
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium text-gray-500">Description</span>
          <p className="text-sm text-gray-800 bg-gray-50 border border-gray-100 rounded-lg p-3 min-h-[72px]">
            {detail.description?.trim()
              ? detail.description
              : 'No description provided.'}
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">Users</span>
            {users.length ? (
              <span className="text-xs text-gray-400">
                Showing {users.length} user{users.length === 1 ? '' : 's'}
              </span>
            ) : null}
          </div>
          {users.length ? (
            <div className="flex flex-wrap gap-2">
              {users.map((user) => (
                <span
                  key={user.id}
                  className="inline-flex items-center gap-1 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700"
                >
                  {user.value}
                </span>
              ))}
            </div>
          ) : (
            <div className="border border-dashed border-gray-200 rounded-lg p-3 text-sm text-gray-500">
              No users attached to this batch.
            </div>
          )}
        </div>
      </div>
    )
  })()

  return (
    <DialogModal
      isOpen={isOpen}
      onClose={() => onClose()}
      title={'Batch Details'}
      secondaryAction={onClose}
      secondaryActionLabel="Close"
      small={false}
      body={<div className="py-2">{bodyContent}</div>}
    />
  )
}

export default BatchDetailDialog
