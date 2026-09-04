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

        <DetailItem label="Duration (Days)" value={template?.duration_days} />
        <DetailItem
          label="Diet Template Category"
          value={template?.diet_template_category_name}
        />
        {/* {(() => {
          const raw = template?.thumbnail_url
          const t = typeof raw === 'string' ? raw.trim() : ''
          const isUrl = typeof t === 'string' && /^https?:\/\/\S+$/i.test(t)
          if (!isUrl) return null

          return (
            <div className="">
              <div className="border rounded-lg p-3 bg-white ">
                <div className="text-xs text-gray-500 mb-2">Thumbnail</div>
                <div className="relative w-64">
                  <img
                    src={t}
                    alt="Diet template thumbnail"
                    className="w-[7.25rem] h-[7.25rem] object-cover rounded"
                    onError={(e) => {
                      ;(e.currentTarget as HTMLImageElement).style.display =
                        'none'
                    }}
                  />
                  <div className="mt-2 text-xs">
                    <a
                      href={t}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#2563eb' }}
                    >
                      Open thumbnail
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )
        })()} */}
        <div className="border rounded-lg p-3 bg-white md:col-span-2">
          <div className="text-xs text-gray-500 mb-1">Guideline Content</div>
          <div className="text-sm whitespace-pre-wrap">
            {template?.description || '--'}
          </div>
        </div>
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
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()
}
