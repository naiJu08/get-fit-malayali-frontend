import InfoBox from '../../../components/app/alertBox/infoBox'

function safeStr(v: any) {
  if (v === null || v === undefined || v === '') return '--'
  return String(v)
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
      <div className="text-sm">{safeStr(value)}</div>
    </div>
  )
}

export default function DetailsInfo({
  plan,
  loading,
  error,
}: {
  plan: any
  loading: boolean
  error: string
}) {
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <DetailItem label="Name" value={plan?.name} />
          <DetailItem label="Category" value={plan?.category} />
          <DetailItem label="Description" value={plan?.description} />
          <DetailItem
            label="Duration (days)"
            value={safeStr(plan?.duration_days)}
          />
          <DetailItem label="Active" value={mapActive(plan?.active)} />
          <DetailItem label="Fees" value={plan?.fees} />
          <DetailItem
            label="Workout Plans"
            value={safeStr(plan?.workout_plans_count)}
          />
          <DetailItem
            label="Diet Plans"
            value={safeStr(plan?.diet_plans_count)}
          />
          <DetailItem
            label="Subscribers"
            value={safeStr(plan?.subscribers_count)}
          />
          {/* <DetailItem label="Yoga" value={plan?.yoga_included} /> */}
          <div className="border rounded-lg p-3 bg-white">
            <div className="text-xs text-gray-500 mb-1">Thumbnail</div>
            <div className="text-sm">
              {plan?.thumbnail_url ? (
                <div className="w-[160px] h-[160px] overflow-hidden rounded-md border">
                  <img
                    className="w-full h-full object-cover"
                    src={plan.thumbnail_url}
                    alt="Plan thumbnail"
                  />
                </div>
              ) : (
                <span>--</span>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
