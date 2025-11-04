// import moment from 'moment'
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

import Icons from '../../../../components/common/icons'
import InfoBox from '../../../../components/app/alertBox/infoBox'
import { getDietPlanDetails } from './api'

export default function DietPlanDetails() {
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
        const res = await getDietPlanDetails(String(id))
        if (!mounted) return
        setData(res)
      } catch (e: any) {
        if (!mounted) return
        setError(e?.response?.data?.message || 'Failed to load diet plan')
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

  const dp = data?.diet_plan || data || {}

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/plans/${dp?.plan_id}`)}
            aria-label="Back"
          >
            <Icons name="left-arrow-icon" />
          </button>
          <h1 className="text-xl font-semibold">Diet Plan Details</h1>
        </div>
      </div>

      {loading && (
        <div className="p-6">
          <InfoBox content="Loading diet plan details..." />
        </div>
      )}
      {error && !loading && (
        <div className="p-6">
          <InfoBox content={error} />
        </div>
      )}
      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <DetailItem label="Plan Name" value={dp?.plan_name} />
          <DetailItem label="Plan Id" value={safeStr(dp?.plan_id)} />
          <DetailItem label="Day Number" value={safeStr(dp?.day_number)} />
          <DetailItem
            label="Sequence Number"
            value={safeStr(dp?.sequence_number)}
          />
          <DetailItem label="Meal Time" value={safeStr(dp?.meal_time)} />
          <DetailItem label="Meal Name" value={safeStr(dp?.meal_name)} />
          <DetailItem label="Calories" value={safeStr(dp?.calories)} />
          {/* <DetailItem label="Created At" value={formatDate(dp?.created_at)} /> */}
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

// function formatDate(d: any) {
//   if (!d) return '--'
//   const m = moment(d)
//   return m.isValid() ? m.format('YYYY-MM-DD') : String(d)
// }
function safeStr(v: any) {
  if (v === null || v === undefined || v === '') return '--'
  return String(v)
}
