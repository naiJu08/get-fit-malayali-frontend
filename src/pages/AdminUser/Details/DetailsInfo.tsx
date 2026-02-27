import moment from 'moment'
import InfoBox from '../../../components/app/alertBox/infoBox'

function capitalizeWord(v: any) {
  const s = safeStr(v)
  if (s === '--') return s
  return s
    .toLowerCase()
    .replace(/\b([a-z])/gi, (letter) => letter.toUpperCase())
}
function mapGender(g: any) {
  if (g === 0 || g === '0') return 'Male'
  if (g === 1 || g === '1') return 'Female'
  if (g === 2 || g === '2') return 'Other'
  return capitalizeWord(g)
}
function mapRole(g: any) {
  if (g === 1 || g === '1') return 'Admin'
  if (g === 2 || g === '2') return 'Nutritionist'
  if (g === 3 || g === '3') return 'User'
  const s = String(g || '').toLowerCase()
  if (s === 'superadmin' || s === 'super admin') return 'Super Admin'
  return capitalizeWord(g)
}
function mapStatus(s: any) {
  if (s === 0 || s === '0') return 'Active'
  if (s === 1 || s === '1') return 'Suspended'
  return capitalizeWord(s)
}
function formatDate(d: any) {
  if (!d) return '--'
  const m = moment(d)
  return m.isValid() ? m.format('DD-MM-YYYY') : String(d)
}
function safeStr(v: any) {
  if (v === null || v === undefined || v === '') return '--'
  return String(v)
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
  user,
  loading,
  error,
  isNutritionist,
  onEdit,
}: {
  user: any
  loading: boolean
  error: string
  isNutritionist: boolean
  onEdit?: () => void
}) {
  const canEdit = typeof onEdit === 'function' && Boolean(user?.id)
  return (
    <>
      {loading && (
        <div className="p-6">
          <InfoBox content="Loading user details..." />
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
                Edit details
              </button>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DetailItem label="Name" value={capitalizeWord(user?.name)} />
            <DetailItem label="Email" value={user?.email || user?.username} />
            <DetailItem label="Phone" value={user?.phone} />
            <DetailItem label="Role" value={mapRole(user?.role)} />
            <DetailItem label="Gender" value={mapGender(user?.gender)} />
            <DetailItem
              label="Date of Birth"
              value={formatDate(user?.date_of_birth)}
            />
            {!isNutritionist && (
              <>
                <DetailItem label="Height (cm)" value={safeStr(user?.height)} />
                <DetailItem label="Weight (kg)" value={safeStr(user?.weight)} />
                <DetailItem label="Lifestyle" value={user?.lifestyle} />
                <DetailItem label="Goal" value={user?.goal} />
                <DetailItem
                  label="Food Preferences"
                  value={user?.food_preferences}
                />
                <DetailItem
                  label="Medical Conditions"
                  value={capitalizeWord(user?.medical_conditions)}
                />
                <DetailItem
                  label="Food Allergies"
                  value={user?.food_allergies}
                />
                <DetailItem
                  label="Nationality"
                  value={capitalizeWord(user?.ethnicity)}
                />
                <DetailItem label="State" value={capitalizeWord(user?.state)} />
              </>
            )}
            <DetailItem label="Status" value={mapStatus(user?.status)} />
          </div>
        </div>
      )}
    </>
  )
}
