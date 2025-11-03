import moment from 'moment'
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

import Icons from '../../components/common/icons'
import InfoBox from '../../components/app/alertBox/infoBox'
import { getAdminDetails } from './api'

export default function SubscriptionDetails() {
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
        setError(e?.response?.data?.message || 'Failed to load subscription')
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

  const item = data?.user || data || {}

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/subscriptions')} aria-label="Back">
            <Icons name="left-arrow-icon" />
          </button>
          <h1 className="text-xl font-semibold">Subscription Details</h1>
        </div>
      </div>

      {loading && (
        <div className="p-6">
          <InfoBox content="Loading subscription details..." />
        </div>
      )}
      {error && !loading && (
        <div className="p-6">
          <InfoBox content={error} />
        </div>
      )}
      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DetailItem label="Name" value={item?.name} />
          <DetailItem label="Email" value={item?.email || item?.username} />
          <DetailItem label="Phone" value={item?.phone} />
          <DetailItem label="Role" value={mapRole(item?.role)} />
          <DetailItem label="Gender" value={mapGender(item?.gender)} />
          <DetailItem
            label="Date of Birth"
            value={formatDate(item?.date_of_birth)}
          />
          <DetailItem label="Height (cm)" value={safeStr(item?.height)} />
          <DetailItem label="Weight (kg)" value={safeStr(item?.weight)} />
          <DetailItem label="Lifestyle" value={item?.lifestyle} />
          <DetailItem label="Goal" value={item?.goal} />
          <DetailItem label="Food Preferences" value={item?.food_preferences} />
          <DetailItem
            label="Medical Conditions"
            value={item?.medical_conditions}
          />
          <DetailItem label="Ethnicity" value={item?.ethnicity} />
          <DetailItem label="Status" value={mapStatus(item?.status)} />
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
