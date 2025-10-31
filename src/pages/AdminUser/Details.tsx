import moment from 'moment'
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

import Icons from '../../components/common/icons'
import InfoBox from '../../components/app/alertBox/infoBox'
import { getAdminDetails } from './api'

export default function UserDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    let mounted = true
    const run = async () => {
      try {
        setLoading(true)
        const res = await getAdminDetails(String(id))
        if (!mounted) return
        setData(res)
      } catch (e: any) {
        if (!mounted) return
        setError(e?.response?.data?.message || 'Failed to load user')
      } finally {
        if (!mounted) return
        setLoading(false)
      }
    }
    if (id) run()
    return () => {
      mounted = false
    }
  }, [id])

  const user = data?.user || data || {}

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/users')} aria-label="Back">
            <Icons name="left-arrow-icon" />
          </button>
          <h1 className="text-xl font-semibold">User Details</h1>
        </div>
      </div>

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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DetailItem label="Name" value={user?.name} />
          <DetailItem label="Email" value={user?.email || user?.username} />
          <DetailItem label="Phone" value={user?.phone} />
          <DetailItem label="Role" value={mapRole(user?.role)} />
          <DetailItem label="Gender" value={mapGender(user?.gender)} />
          <DetailItem
            label="Date of Birth"
            value={formatDate(user?.date_of_birth)}
          />
          <DetailItem label="Height (cm)" value={safeStr(user?.height)} />
          <DetailItem label="Weight (kg)" value={safeStr(user?.weight)} />
          <DetailItem label="Lifestyle" value={user?.lifestyle} />
          <DetailItem label="Goal" value={user?.goal} />
          <DetailItem label="Food Preferences" value={user?.food_preferences} />
          <DetailItem
            label="Medical Conditions"
            value={user?.medical_conditions}
          />
          <DetailItem label="Ethnicity" value={user?.ethnicity} />
          <DetailItem label="Status" value={mapStatus(user?.status)} />
        </div>
      )}
    </div>
  )
}

function DetailItem({ label, value }: { label: string; value: any }) {
  return (
    <div className="border rounded-lg p-3 bg-white">
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className="text-sm">{safeStr(value)}</div>
    </div>
  )
}

function capitalizeWord(v: any) {
  const s = safeStr(v)
  if (s === '--') return s
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()
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
  return m.isValid() ? m.format('YYYY-MM-DD') : String(d)
}
function safeStr(v: any) {
  if (v === null || v === undefined || v === '') return '--'
  return String(v)
}
