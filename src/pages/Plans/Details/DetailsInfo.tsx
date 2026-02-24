import React from 'react'
import InfoBox from '../../../components/app/alertBox/infoBox'

function safeStr(v: any) {
  if (v === null || v === undefined || v === '') return '--'
  return String(v)
}
function capitalizeFirst(v: any) {
  const s = safeStr(v)
  if (s === '--') return s
  return s.charAt(0).toUpperCase() + s.slice(1)
}
function mapActive(v: any) {
  if (v === true || v === 'true' || v === 1 || v === '1') return 'Active'
  if (v === false || v === 'false' || v === 0 || v === '0') return 'Inactive'
  return safeStr(v)
}

function DetailItem({ label, value }: { label: string; value: any }) {
  return (
    <div className="border rounded-lg p-3 bg-white">
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className="text-sm">
        {React.isValidElement(value) ? value : safeStr(value)}
      </div>
    </div>
  )
}

function renderFees(v: any) {
  const num = typeof v === 'number' ? v : Number(v ?? 0)
  if (Number.isNaN(num)) return '--'
  const formatted = num.toLocaleString('en-IN', { maximumFractionDigits: 2 })
  const label = `₹ ${formatted}`
  return (
    <span style={{ fontFamily: '"Roboto Condensed", sans-serif' }}>
      {label}
    </span>
  )
}

export default function DetailsInfo({
  plan,
  loading,
  error,
  onEdit,
}: {
  plan: any
  loading: boolean
  error: string
  onEdit?: () => void
}) {
  const canEdit = typeof onEdit === 'function' && Boolean(plan?.id)

  return (
    <>
      {loading && (
        <div className="p-6">
          <InfoBox content="Loading plan details..." />
        </div>
      )}
      {error && !loading && (
        <div className="p-6">
          <InfoBox content={error} />
        </div>
      )}
      {!loading && !error && (
        <div className="flex flex-col gap-4">
          {canEdit && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => onEdit?.()}
                className="px-3 py-1.5 rounded-md bg-primaryGreen text-white text-sm font-medium hover:bg-primaryGreen/90 focus:outline-none focus:ring-2 focus:ring-primaryGreen/50"
              >
                Edit plan
              </button>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <DetailItem label="Name" value={capitalizeFirst(plan?.name)} />
            <DetailItem label="Category" value={plan?.category} />
            <DetailItem label="Description" value={plan?.description} />
            <DetailItem
              label="Duration (days)"
              value={safeStr(plan?.duration_days)}
            />
            <DetailItem label="Active" value={mapActive(plan?.active)} />
            <DetailItem label="Fees" value={renderFees(plan?.fees)} />
            <DetailItem
              label="Workout Plans"
              value={safeStr(plan?.workout_plans_count)}
            />
            <DetailItem
              label="Yoga Plans"
              value={safeStr(plan?.yoga_plans_count)}
            />
            <DetailItem
              label="Meditation Plans"
              value={safeStr(plan?.meditations_count)}
            />
            <DetailItem
              label="Subscribers"
              value={safeStr(plan?.subscribers_count)}
            />
            {(() => {
              const raw = plan?.thumbnail_url
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
                        alt="Yoga thumbnail"
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
            })()}
          </div>
        </div>
      )}
    </>
  )
}
