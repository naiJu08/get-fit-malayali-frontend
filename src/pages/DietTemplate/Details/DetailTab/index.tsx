import React from 'react'

import InfoBox from '../../../../components/app/alertBox/infoBox'

interface DetailTabProps {
  template: any
  loading: boolean
  error: string
  onEdit?: () => void
}

export default function DetailTab({
  template,
  loading,
  error,
  onEdit,
}: DetailTabProps) {
  const canEdit = typeof onEdit === 'function' && Boolean(template?.id)
  if (loading) {
    return (
      <div className="p-6">
        <InfoBox content="Loading template details..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <InfoBox content={error} />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 mb-4">
      {canEdit && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => onEdit?.()}
            className="px-3 py-1.5 rounded-md bg-primaryGreen text-white text-sm font-medium hover:bg-primaryGreen/90 focus:outline-none focus:ring-2 focus:ring-primaryGreen/50"
          >
            Edit Template
          </button>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <DetailItem label="Name" value={capitalizeFirst(template?.name)} />
        <DetailItem label="Description" value={template?.description || '--'} />
        <DetailItem label="Duration (Days)" value={template?.duration_days} />
        {template?.thumbnail_url && (
          <DetailItem
            label="Thumbnail"
            value={
              template?.thumbnail_url ? (
                <div className="w-[120px] h-[120px] overflow-hidden rounded-md border bg-gray-50">
                  <img
                    className="w-full h-full object-cover"
                    src={template.thumbnail_url}
                    alt="Template thumbnail"
                  />
                </div>
              ) : (
                <span>--</span>
              )
            }
          />
        )}
      </div>
    </div>
  )
}

function DetailItem({ label, value }: { label: string; value: any }) {
  const isUrl = typeof value === 'string' && /^https?:\/\/\S+$/i.test(value)
  const content = React.isValidElement(value) ? (
    value
  ) : isUrl ? (
    <a
      href={value}
      target="_blank"
      rel="noopener noreferrer"
      style={{ color: '#2563eb' }}
    >
      {value}
    </a>
  ) : (
    safeStr(value)
  )
  return (
    <div className="border rounded-lg p-3 bg-white ">
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className="text-sm">{content}</div>
    </div>
  )
}

function safeStr(v: any) {
  if (v === null || v === undefined || v === '') return '--'
  return String(v)
}

function capitalizeFirst(v: any) {
  const s = safeStr(v)
  if (s === '--') return s
  return s.charAt(0).toUpperCase() + s.slice(1)
}
