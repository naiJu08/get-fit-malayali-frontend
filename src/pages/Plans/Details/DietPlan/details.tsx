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
            onClick={() => navigate(`/plans/${dp?.plan_id}/dietplan`)}
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
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <DetailItem label="Plan Name" value={dp?.plan_name} />
            <DetailItem label="Plan Id" value={safeStr(dp?.plan_id)} />
            <DetailItem label="Day Number" value={safeStr(dp?.day_number)} />
            <DetailItem
              label="Sequence Number"
              value={safeStr(dp?.sequence_number)}
            />
            <DetailItem label="Meal Time" value={safeStr(dp?.meal_time)} />
            <DetailItem label="Notes" value={safeStr(dp?.notes)} />
          </div>

          <div className="mt-4 mb-6">
            <h2 className="text-lg font-semibold mb-3">Calories Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <DetailItem
                label="Protein"
                value={safeStr(dp?.calories_breakdown?.protein)}
              />
              <DetailItem
                label="Carbs"
                value={safeStr(dp?.calories_breakdown?.carbs)}
              />
              <DetailItem
                label="Fat"
                value={safeStr(dp?.calories_breakdown?.fat)}
              />
              <DetailItem
                label="Fiber"
                value={safeStr(dp?.calories_breakdown?.fiber)}
              />
              <DetailItem
                label="Effective Total Calories"
                value={safeStr(dp?.effective_total_calories)}
              />
            </div>
          </div>

          {Array.isArray(dp?.items) && dp.items.length > 0 && (
            <div className="mt-4">
              <h2 className="text-lg font-semibold mb-3">Meals in this Slot</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {dp.items.map((it: any) => (
                  <div
                    key={it.id}
                    className="border rounded-lg p-3 bg-white text-sm"
                  >
                    <div className="mb-1 text-[16px] flex items-center justify-between">
                      <div className="font-semibold">
                        {safeStr(it.meal_name)}
                      </div>
                      <span
                        className={((): string => {
                          const reqRaw = (
                            it?.requirement ??
                            it?.key_requirement ??
                            ''
                          )
                            .toString()
                            .toLowerCase()
                          const isMandatory = reqRaw === 'mandatory'
                          const isOptional = reqRaw === 'optional'
                          const color = isMandatory
                            ? 'text-red-600'
                            : isOptional
                              ? 'text-green-600'
                              : 'text-gray-400'
                          return `${color} font-semibold text-sm`
                        })()}
                      >
                        {(() => {
                          const reqRaw = (
                            it?.requirement ??
                            it?.key_requirement ??
                            ''
                          )
                            .toString()
                            .toLowerCase()
                          if (reqRaw === 'mandatory') return 'Mandatory'
                          if (reqRaw === 'optional') return 'Optional'
                          return '--'
                        })()}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                      <div>
                        <div className="text-gray-500">Quantity</div>
                        <div>{safeStr(it.quantity)}</div>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                        Nutrition
                      </div>
                      <div className="bg-gray-50 rounded-md p-3">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <div className="text-gray-500">Protein</div>
                            <div>{safeStr(it?.per_serving?.protein)}</div>
                          </div>
                          <div>
                            <div className="text-gray-500">Carbs</div>
                            <div>{safeStr(it?.per_serving?.carbs)}</div>
                          </div>
                          <div>
                            <div className="text-gray-500">Fat</div>
                            <div>{safeStr(it?.per_serving?.fat)}</div>
                          </div>
                          <div>
                            <div className="text-gray-500">Fiber</div>
                            <div>{safeStr(it?.per_serving?.fiber)}</div>
                          </div>
                        </div>
                        <div className="mt-3 flex items-center gap-4 text-sm">
                          <div className="font-semibold">Total Calories :</div>
                          <div className="font-semibold">
                            {safeStr(it?.per_serving?.calories)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
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
