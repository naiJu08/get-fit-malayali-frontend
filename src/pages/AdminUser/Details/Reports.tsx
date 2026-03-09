import moment from 'moment'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { DialogModal } from '../../../components/common'
import { QueryParams } from '../../../common/types'
import { getRecipeDetails, useRecipes } from '../../Recipe/api'
import { useSubscriptionReport } from '../api'

// ─── Hint Tooltip ────────────────────────────────────────────────────────────
type HintEntry = {
  label: string
  description?: string
  healthy_range?: string
  compliance_description?: string
  tip?: string
  unit?: string
}

const HintTooltip = ({ hint }: { hint: HintEntry }) => {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div ref={ref} className="relative inline-flex items-center">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold text-white ml-1 flex-shrink-0 transition-all duration-200"
        style={{
          background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
          boxShadow: open ? '0 0 0 3px rgba(99,102,241,0.25)' : 'none',
        }}
        title={hint.label}
      >
        ℹ
      </button>
      {open && (
        <div
          className="absolute z-50 left-1/2 -translate-x-1/2 bottom-full mb-2 w-72"
          style={{ filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.15))' }}
        >
          <div
            className="rounded-xl overflow-hidden border border-indigo-100"
            style={{ background: 'linear-gradient(145deg,#fafafe,#f0f0ff)' }}
          >
            {/* header */}
            <div
              className="px-3 py-2"
              style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}
            >
              <div className="text-white text-xs font-semibold">
                {hint.label}
              </div>
              {hint.unit && (
                <div className="text-indigo-200 text-[10px]">{hint.unit}</div>
              )}
            </div>
            <div className="px-3 py-2 space-y-2">
              {hint.description && (
                <p className="text-[11px] text-gray-600 leading-relaxed">
                  {hint.description}
                </p>
              )}
              {hint.healthy_range && (
                <div className="flex items-center gap-1.5">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />
                  <span className="text-[11px] text-gray-500">
                    Healthy range:{' '}
                    <span className="font-semibold text-green-700">
                      {hint.healthy_range}
                    </span>
                  </span>
                </div>
              )}
              {hint.compliance_description && (
                <div
                  className="rounded-lg px-2.5 py-2"
                  style={{
                    background: 'rgba(99,102,241,0.07)',
                    borderLeft: '3px solid #6366f1',
                  }}
                >
                  <p className="text-[11px] text-indigo-800 leading-relaxed">
                    {hint.compliance_description}
                  </p>
                </div>
              )}
              {hint.tip && (
                <div className="flex gap-1.5 items-start">
                  <span className="text-amber-400 text-sm leading-none mt-0.5">
                    💡
                  </span>
                  <p className="text-[11px] text-gray-500 italic leading-relaxed">
                    {hint.tip}
                  </p>
                </div>
              )}
            </div>
          </div>
          {/* caret */}
          <div className="flex justify-center">
            <div
              className="w-3 h-3 rotate-45 -mt-1.5"
              style={{
                background: '#f0f0ff',
                border: '1px solid #e0e0ff',
                borderTop: 'none',
                borderLeft: 'none',
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

type PieSlice = {
  label: string
  value: number
  color: string
}

type PieChartProps = {
  data: PieSlice[]
  size?: number
  strokeWidth?: number
  displayValue?: number
}

const PieChart = ({
  data,
  size = 120,
  strokeWidth = 18,
  displayValue,
}: PieChartProps) => {
  const total = data.reduce(
    (acc, item) => acc + Math.max(0, item.value || 0),
    0
  )
  const hasData = total > 0
  const chartSize = Math.max(size, 0)
  const radius = Math.max((chartSize - strokeWidth) / 2, 0)
  const circumference = 2 * Math.PI * radius
  const center = chartSize / 2
  let offset = 0

  return (
    <div className="relative" style={{ width: chartSize, height: chartSize }}>
      <svg
        width={chartSize}
        height={chartSize}
        viewBox={`0 0 ${chartSize} ${chartSize}`}
        className="rotate-[-90deg]"
      >
        {!hasData ? (
          <circle
            cx={center}
            cy={center}
            r={radius}
            stroke="#e2e8f0"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
        ) : (
          data.map((slice) => {
            const value = Math.max(0, slice.value || 0)
            const dashLength = (value / total) * circumference
            const circle = (
              <circle
                key={slice.label}
                cx={center}
                cy={center}
                r={radius}
                stroke={slice.color}
                strokeWidth={strokeWidth}
                strokeDasharray={`${dashLength} ${circumference}`}
                strokeDashoffset={-offset}
                strokeLinecap="butt"
                fill="transparent"
              />
            )
            offset += dashLength
            return circle
          })
        )}
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-medium text-gray-600">
          {displayValue !== undefined &&
          displayValue !== null &&
          displayValue > 0
            ? displayValue
            : hasData
              ? total
              : '--'}
        </span>
      </div>
    </div>
  )
}

const safeValue = (value: any) => {
  if (value === null || value === undefined || value === '') {
    return '—'
  }
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return '—'
    return `${value}`
  }
  return String(value)
}

const formatDate = (value?: any) => {
  if (!value) return '—'
  const parsed = moment(value)
  return parsed.isValid() ? parsed.format('DD-MM-YYYY') : String(value)
}

const getHealthColor = (percentage: number, reverse = false) => {
  if (reverse) {
    if (percentage >= 80) return '#22c55e' // green
    if (percentage >= 60) return '#facc15' // yellow
    return '#ef4444' // red
  }
  if (percentage >= 80) return '#22c55e' // green
  if (percentage >= 60) return '#facc15' // yellow
  return '#ef4444' // red
}

const getTrendIndicator = (value: number | null | undefined) => {
  if (!value || value === 0) return { icon: '→', color: '#6b7280' }
  if (value > 0) return { icon: '↑', color: '#22c55e' }
  return { icon: '↓', color: '#ef4444' }
}

const getBMICategory = (bmi: number) => {
  if (bmi < 18.5) return { category: 'Underweight', color: '#3b82f6' }
  if (bmi < 25) return { category: 'Normal', color: '#22c55e' }
  if (bmi < 30) return { category: 'Overweight', color: '#facc15' }
  return { category: 'Obese', color: '#ef4444' }
}

const DietSummaryCard = ({ dietSummary }: { dietSummary: any }) => {
  const adherencePercentage = Number(
    dietSummary?.calorie_adherence_percentage ?? 0
  )
  const adherenceColor = getHealthColor(adherencePercentage)
  const mandatoryAnalysis = dietSummary?.mandatory_items_analysis || {}
  const mandatoryCompletion =
    mandatoryAnalysis.assigned > 0
      ? (mandatoryAnalysis.consumed / mandatoryAnalysis.assigned) * 100
      : 0
  const hints = dietSummary?.hints

  return (
    <div className="border rounded-xl bg-white shadow-sm p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-1">
          <h3 className="text-sm font-semibold text-gray-900">
            🍽️ Diet Summary
          </h3>
          {hints?.calorie_adherence && (
            <HintTooltip hint={hints.calorie_adherence} />
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Adherence</span>
          <span
            className="text-sm font-bold px-2 py-1 rounded-full text-white"
            style={{ backgroundColor: adherenceColor }}
          >
            {adherencePercentage.toFixed(1)}%
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
            Items Assigned
            {hints?.total_items_assigned && (
              <HintTooltip
                hint={{
                  ...hints.total_items_assigned,
                  label: 'Items Assigned',
                  compliance_description: undefined,
                }}
              />
            )}
          </div>
          <div className="text-lg font-bold text-gray-900">
            {dietSummary?.total_items_assigned ?? 0}
          </div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
            Items Completed
            {hints?.items_completed && (
              <HintTooltip hint={hints.items_completed} />
            )}
          </div>
          <div className="text-lg font-bold text-green-600">
            {dietSummary?.total_items_completed ?? 0}
          </div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
            Calories Assigned
            {hints?.calorie_adherence && (
              <HintTooltip
                hint={{
                  ...hints.calorie_adherence,
                  label: 'Calories Assigned',
                  compliance_description: undefined,
                }}
              />
            )}
          </div>
          <div className="text-lg font-bold text-gray-900">
            {dietSummary?.total_calories_assigned ?? 0}
          </div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
            Calories Consumed
            {hints?.calorie_adherence && (
              <HintTooltip hint={hints.calorie_adherence} />
            )}
          </div>
          <div className="text-lg font-bold text-blue-600">
            {dietSummary?.total_calories_consumed ?? 0}
          </div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
            Outside Items Completions
            {hints?.items_completed_outside && (
              <HintTooltip hint={hints.items_completed_outside} />
            )}
          </div>
          <div className="text-lg font-bold text-gray-900">
            {dietSummary?.total_items_completed_outside ?? 0}
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
            Outside Items Calories
            {hints?.calories_consumed_outside && (
              <HintTooltip hint={hints.calories_consumed_outside} />
            )}
          </div>
          <div className="text-lg font-bold text-gray-900">
            {dietSummary?.total_calories_consumed_outside ?? 0}
          </div>
        </div>
      </div>

      <div className="border-t pt-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1 text-xs text-gray-500">
            Mandatory Items
            {hints?.mandatory_items && (
              <HintTooltip hint={hints.mandatory_items} />
            )}
          </div>
          <span className="text-xs font-medium text-gray-700">
            {mandatoryAnalysis.consumed ?? 0}/{mandatoryAnalysis.assigned ?? 0}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="h-2 rounded-full transition-all duration-300"
            style={{
              width: `${Math.min(mandatoryCompletion, 100)}%`,
              backgroundColor: getHealthColor(mandatoryCompletion),
            }}
          />
        </div>
      </div>
    </div>
  )
}

const MealTimingCard = ({
  mealTimingAnalysis,
  hint,
}: {
  mealTimingAnalysis: any
  hint?: HintEntry
}) => {
  const mealTypes = Object.entries(mealTimingAnalysis || {}).filter(
    ([, data]: [string, any]) =>
      data && (data.items_consumed > 0 || data.calories_consumed > 0)
  )

  return (
    <div className="border rounded-xl bg-white shadow-sm p-4">
      <div className="flex items-center gap-1 mb-4">
        <h3 className="text-sm font-semibold text-gray-900">
          ⏰ Meal Timing Analysis
        </h3>
        {hint && <HintTooltip hint={hint} />}
      </div>

      {mealTypes.length === 0 ? (
        <div className="text-center py-4 text-gray-500 text-sm">
          No meal data available
        </div>
      ) : (
        <div className="space-y-3">
          {mealTypes.map(([mealType, data]: [string, any]) => {
            // const adherence = Number(data.adherence_percentage ?? 0)
            // const adherenceColor = getHealthColor(adherence)

            return (
              <div
                key={mealType}
                className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
              >
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">
                    {mealType}
                  </div>
                  <div className="text-xs text-gray-500">
                    {data.items_consumed ?? 0} items •{' '}
                    {data.calories_consumed ?? 0} cal
                  </div>
                </div>
                {/* <div className="flex items-center gap-2">
                  <span
                    className="text-xs font-bold px-2 py-1 rounded-full text-white"
                    style={{ backgroundColor: adherenceColor }}
                  >
                    {adherence.toFixed(0)}%
                  </span>
                </div> */}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

const CategoryConsumptionCard = ({
  categoryConsumption,
  hint,
}: {
  categoryConsumption: any
  hint?: HintEntry
}) => {
  const categories = Object.entries(categoryConsumption || {})
    .filter(
      ([, data]: [string, any]) =>
        data && (data.items_consumed > 0 || data.calories_consumed > 0)
    )
    .sort(
      ([, a], [, b]) =>
        (b as any).calories_consumed - (a as any).calories_consumed
    )
    .slice(0, 6)

  // const totalCalories = categories.reduce(
  //   (sum, [, data]: [string, any]) => sum + (data.calories_consumed || 0),
  //   0
  // )

  return (
    <div className="border rounded-xl bg-white shadow-sm p-4">
      <div className="flex items-center gap-1 mb-4">
        <h3 className="text-sm font-semibold text-gray-900">
          🥗 Food Categories
        </h3>
        {hint && <HintTooltip hint={hint} />}
      </div>

      {categories.length === 0 ? (
        <div className="text-center py-4 text-gray-500 text-sm">
          No category data available
        </div>
      ) : (
        <div className="space-y-3">
          {categories.map(([category, data]: [string, any]) => {
            // const percentage =
            //   totalCalories > 0
            //     ? (data.calories_consumed / totalCalories) * 100
            //     : 0

            return (
              <div key={category} className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">
                    {category}
                  </div>
                  <div className="text-xs text-gray-500">
                    {data.items_consumed ?? 0} items •{' '}
                    {data.calories_consumed ?? 0} cal
                  </div>
                </div>
                {/* <div className="text-sm font-bold text-gray-700">
                  {percentage.toFixed(1)}%
                </div> */}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

const BodyMetricsCard = ({
  bodyMeasurements,
  weightBmi,
}: {
  bodyMeasurements: any
  weightBmi: any
}) => {
  const startWeight = Number(weightBmi?.start_weight ?? 0)
  const endWeight = Number(weightBmi?.end_weight ?? 0)
  const weightDelta = Number(weightBmi?.weight_delta ?? 0)
  const startBmi = Number(weightBmi?.start_bmi ?? 0)
  const endBmi = Number(weightBmi?.end_bmi ?? 0)
  const bmiDelta = Number(weightBmi?.bmi_delta ?? 0)

  const weightTrend = getTrendIndicator(weightDelta)
  const bmiTrend = getTrendIndicator(bmiDelta)
  const startBmiCategory = getBMICategory(startBmi)
  const endBmiCategory = getBMICategory(endBmi)

  const measurements = [
    { label: 'Chest', value: bodyMeasurements?.change?.chest_delta },
    { label: 'Waist', value: bodyMeasurements?.change?.waist_delta },
    { label: 'Hip', value: bodyMeasurements?.change?.hip_delta },
    { label: 'Arm', value: bodyMeasurements?.change?.arm_delta },
    { label: 'Thigh', value: bodyMeasurements?.change?.thigh_delta },
  ].filter((m) => m.value !== null && m.value !== undefined)

  return (
    <div className="border rounded-xl bg-white shadow-sm p-4">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">
        💪 Body Metrics
      </h3>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-xs text-gray-500 mb-1">Start Weight</div>
          <div className="text-lg font-bold text-gray-900">
            {startWeight ? `${startWeight} kg` : '--'}
          </div>
          <div className="text-xs text-gray-500">
            BMI: {startBmi.toFixed(1)}
          </div>
          <div
            className="text-xs px-2 py-1 rounded-full text-white inline-block mt-1"
            style={{ backgroundColor: startBmiCategory.color }}
          >
            {startBmiCategory.category}
          </div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-xs text-gray-500 mb-1">End Weight</div>
          <div className="text-lg font-bold text-gray-900">
            {endWeight ? `${endWeight} kg` : '--'}
          </div>
          <div className="text-xs text-gray-500">BMI: {endBmi.toFixed(1)}</div>
          <div
            className="text-xs px-2 py-1 rounded-full text-white inline-block mt-1"
            style={{ backgroundColor: endBmiCategory.color }}
          >
            {endBmiCategory.category}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-blue-50 rounded-lg p-3">
          <div className="text-xs text-gray-500 mb-1">Weight Change</div>
          <div className="flex items-center gap-2">
            <span
              className="text-xl font-bold"
              style={{ color: weightTrend.color }}
            >
              {weightTrend.icon} {Math.abs(weightDelta)} kg
            </span>
          </div>
        </div>
        <div className="bg-green-50 rounded-lg p-3">
          <div className="text-xs text-gray-500 mb-1">BMI Change</div>
          <div className="flex items-center gap-2">
            <span
              className="text-xl font-bold"
              style={{ color: bmiTrend.color }}
            >
              {bmiTrend.icon} {Math.abs(bmiDelta)}
            </span>
          </div>
        </div>
      </div>

      {measurements.length > 0 && (
        <div className="border-t pt-3">
          <div className="text-xs text-gray-500 mb-2">Measurement Changes</div>
          <div className="grid grid-cols-2 gap-2">
            {measurements.map((measurement) => {
              const trend = getTrendIndicator(measurement.value)
              return (
                <div
                  key={measurement.label}
                  className="flex items-center justify-between bg-gray-50 rounded p-2"
                >
                  <span className="text-xs text-gray-600">
                    {measurement.label}
                  </span>
                  <span
                    className="text-sm font-bold"
                    style={{ color: trend.color }}
                  >
                    {trend.icon} {Math.abs(measurement.value)} cm
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

const VitalsTrackingCard = ({ vitals }: { vitals: any }) => {
  const hints = vitals?.hints
  // const heartRateHealth = Number(vitals?.normal_heart_rate_percentage ?? 0)
  // const sugarHealth = Number(vitals?.normal_sugar_level_percentage ?? 0)
  const sleepHealth = Number(vitals?.adequate_sleep_percentage ?? 0)
  const waterHealth = Number(vitals?.adequate_water_intake_percentage ?? 0)

  const vitalsData = [
    // {
    //   label: 'Heart Rate',
    //   value: vitals?.max_heart_rate,
    //   unit: 'bpm',
    //   percentage: heartRateHealth,
    //   icon: '❤️',
    //   hintKey: 'heart_rate',
    // },
    // {
    //   label: 'Sugar Level',
    //   value: vitals?.max_sugar_level,
    //   unit: 'mg/dL',
    //   percentage: sugarHealth,
    //   icon: '🩸',
    //   hintKey: 'sugar_level',
    // },
    {
      label: 'Sleep',
      value: vitals?.avg_sleep_hours,
      unit: 'hrs',
      percentage: sleepHealth,
      icon: '😴',
      hintKey: 'sleep',
    },
    {
      label: 'Water Intake',
      value: vitals?.avg_water_intake,
      unit: 'glass',
      percentage: waterHealth,
      icon: '💧',
      hintKey: 'water_intake',
    },
    {
      label: 'Steps',
      value: vitals?.avg_steps,
      unit: 'steps',
      percentage: null,
      icon: '👟',
      hintKey: 'steps',
    },
  ]

  return (
    <div className="border rounded-xl bg-white shadow-sm p-4">
      <div className="flex items-center gap-1 mb-4">
        <h3 className="text-sm font-semibold text-gray-900">
          ❤️ Vitals Tracking
        </h3>
      </div>

      <div className="space-y-3">
        {vitalsData.map((vital) => {
          const healthColor =
            vital.percentage !== null
              ? getHealthColor(vital.percentage)
              : '#6b7280'
          const displayValue =
            vital.value !== null && vital.value !== undefined
              ? vital.value
              : '--'
          const vitalHint = hints?.[vital.hintKey]

          return (
            <div
              key={vital.label}
              className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">{vital.icon}</span>
                <div>
                  <div className="flex items-center gap-1">
                    <div className="text-sm font-medium text-gray-900">
                      {vital.label}
                    </div>
                    {vitalHint && <HintTooltip hint={vitalHint} />}
                  </div>
                  <div className="text-xs text-gray-500">
                    Avg: {displayValue} {vital.unit}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {vital.percentage !== null && (
                  <>
                    <span
                      className="text-xs font-bold px-2 py-1 rounded-full text-white"
                      style={{ backgroundColor: healthColor }}
                    >
                      {vital.percentage.toFixed(0)}%
                    </span>
                    <div className="w-8 h-8">
                      <PieChart
                        data={[
                          {
                            label: 'Healthy',
                            value: vital.percentage,
                            color: healthColor,
                          },
                          {
                            label: 'Unhealthy',
                            value: 100 - vital.percentage,
                            color: '#e5e7eb',
                          },
                        ]}
                        size={32}
                        strokeWidth={4}
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-4 pt-3 border-t">
        <div className="text-xs text-gray-500 mb-2">Health Compliance</div>
        <div className="grid grid-cols-2 gap-2">
          {/* <div className="flex items-center justify-between bg-green-50 rounded p-2">
            <div className="flex items-center gap-1 text-xs text-gray-600">
              Heart Rate
              {hints?.heart_rate && <HintTooltip hint={hints.heart_rate} />}
            </div>
            <span className="text-xs font-bold text-green-600">
              {heartRateHealth.toFixed(0)}%
            </span>
          </div> */}
          {/* <div className="flex items-center justify-between bg-green-50 rounded p-2">
            <div className="flex items-center gap-1 text-xs text-gray-600">
              Sugar Level
              {hints?.sugar_level && <HintTooltip hint={hints.sugar_level} />}
            </div>
            <span className="text-xs font-bold text-green-600">
              {sugarHealth.toFixed(0)}%
            </span>
          </div> */}
          <div className="flex items-center justify-between bg-green-50 rounded p-2">
            <div className="flex items-center gap-1 text-xs text-gray-600">
              Sleep
              {hints?.sleep && <HintTooltip hint={hints.sleep} />}
            </div>
            <span className="text-xs font-bold text-green-600">
              {sleepHealth.toFixed(0)}%
            </span>
          </div>
          <div className="flex items-center justify-between bg-green-50 rounded p-2">
            <div className="flex items-center gap-1 text-xs text-gray-600">
              Hydration
              {hints?.water_intake && <HintTooltip hint={hints.water_intake} />}
            </div>
            <span className="text-xs font-bold text-green-600">
              {waterHealth.toFixed(0)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

const DailyActivityCard = ({ dailyBreakdown }: { dailyBreakdown: any[] }) => {
  const getActivityIcon = (activityType: string) => {
    switch (activityType) {
      case 'diet':
        return '🍽️'
      case 'workout':
        return '💪'
      case 'yoga':
        return '🧘'
      case 'meditation':
        return '🧘‍♀️'
      default:
        return '📋'
    }
  }

  const getActivityMetrics = (activity: any, type: string) => {
    if (!activity) {
      return {
        assigned: 0,
        completed: 0,
        completionRate: 0,
        assignedCompletion: 0,
        outsideCompletion: 0,
        skipped: 0,
        missed: 0,
      }
    }

    const assigned = Number(activity.assigned ?? activity.total_assigned ?? 0)
    const completedBase =
      type === 'diet'
        ? Number(activity.assigned_completion ?? activity.completed ?? 0)
        : Number(activity.completed ?? activity.assigned_completion ?? 0)
    const completionRate = assigned > 0 ? (completedBase / assigned) * 100 : 0

    return {
      assigned,
      completed: completedBase,
      completionRate,
      assignedCompletion: Number(activity.assigned_completion ?? 0),
      outsideCompletion: Number(activity.outside_completion ?? 0),
      skipped: Number(activity.skipped ?? 0),
      missed: Number(activity.missed ?? 0),
    }
  }

  const activeDays = (dailyBreakdown || []).filter(
    (day) => day?.is_frozen === false
  )

  return (
    <div className="border rounded-xl bg-white shadow-sm p-4">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">
        📅 Daily Activity Breakdown
      </h3>

      {activeDays.length === 0 ? (
        <div className="text-center py-4 text-gray-500 text-sm">
          No daily data available
        </div>
      ) : (
        <div className="space-y-3">
          {activeDays.map((day) => {
            const activities = [
              { type: 'diet', data: day.diet },
              { type: 'workout', data: day.workout },
              { type: 'yoga', data: day.yoga },
              { type: 'meditation', data: day.meditation },
            ]

            return (
              <div key={day.date} className="border rounded-lg p-3 bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium text-gray-900">
                    Day {day.day_number} • {formatDate(day.date)}
                  </div>
                  <div className="flex items-center gap-1">
                    {activities.map(({ type, data }) => {
                      const { completionRate } = getActivityMetrics(data, type)
                      const color = getHealthColor(completionRate)
                      return (
                        <div key={type} className="flex items-center gap-1">
                          <span>{getActivityIcon(type)}</span>
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: color }}
                          />
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {activities.map(({ type, data }) => {
                    const metrics = getActivityMetrics(data, type)
                    const color = getHealthColor(metrics.completionRate)

                    return (
                      <div
                        key={type}
                        className="flex items-center justify-between bg-white rounded p-2"
                      >
                        <div className="flex items-center gap-2">
                          <span>{getActivityIcon(type)}</span>
                          <div className="text-xs">
                            <div className="font-medium text-gray-900 capitalize">
                              {type}
                            </div>
                            <div className="text-gray-500">
                              {metrics.completed}/{metrics.assigned}
                            </div>
                            {/* {type === 'diet' && (
                              <div className="text-[11px] text-gray-500">{`In-plan: ${metrics.assignedCompletion} · Outside: ${metrics.outsideCompletion}`}</div>
                            )} */}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-0.5">
                          <span className="text-xs font-bold" style={{ color }}>
                            {metrics.completionRate.toFixed(0)}%
                          </span>
                          {(metrics.skipped > 0 || metrics.missed > 0) && (
                            <span className="text-[10px] text-gray-400">
                              {metrics.skipped > 0
                                ? `Skipped ${metrics.skipped}`
                                : ''}
                              {metrics.skipped > 0 && metrics.missed > 0
                                ? ' • '
                                : ''}
                              {metrics.missed > 0
                                ? `Missed ${metrics.missed}`
                                : ''}
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Overall Analysis Card ────────────────────────────────────────────────────────️
const OverallAnalysisCard = ({
  data,
  forPdf = false,
}: {
  data: any
  forPdf?: boolean
}) => {
  if (!data) return null

  // Support both legacy string and new rich object
  const isObject = typeof data === 'object' && data !== null
  const summary = isObject ? data.summary : data
  const score: number | null = isObject
    ? (data.performance_score ?? null)
    : null
  const grade: string | null = isObject
    ? (data.performance_grade ?? null)
    : null
  const highlights: string[] = isObject ? (data.highlights ?? []) : []
  const improvements: string[] = isObject
    ? (data.areas_for_improvement ?? [])
    : []
  const coachNote: string | null = isObject ? (data.coach_note ?? null) : null

  const gradeColor = (g: string | null) => {
    if (!g) return { bg: '#6366f1', text: 'white' }
    const lower = g.toLowerCase()
    if (lower.includes('excellent') || lower.includes('outstanding'))
      return { bg: '#16a34a', text: 'white' }
    if (lower.includes('great') || lower.includes('good'))
      return { bg: '#2563eb', text: 'white' }
    if (lower.includes('fair') || lower.includes('average'))
      return { bg: '#d97706', text: 'white' }
    if (lower.includes('poor') || lower.includes('low'))
      return { bg: '#dc2626', text: 'white' }
    return { bg: '#6366f1', text: 'white' }
  }
  const scoreRingColor = (s: number) => {
    if (s >= 80) return '#22c55e'
    if (s >= 60) return '#facc15'
    return '#ef4444'
  }
  const gc = gradeColor(grade)

  if (forPdf) {
    // Simplified PDF version
    return (
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-center mb-4 text-gray-800">
          🎯 Overall Analysis
        </h2>
        <div className="border-2 border-blue-200 rounded-lg p-4 bg-blue-50">
          {score !== null && grade && (
            <div className="flex items-center gap-3 mb-3">
              <span
                className="text-2xl font-bold"
                style={{ color: scoreRingColor(score) }}
              >
                {score}
              </span>
              <span
                className="text-sm font-semibold px-2 py-1 rounded"
                style={{ background: gc.bg, color: gc.text }}
              >
                {grade}
              </span>
            </div>
          )}
          {summary && <p className="text-sm text-gray-700 mb-3">{summary}</p>}
          {highlights.length > 0 && (
            <div className="mb-2">
              <div className="text-xs font-semibold text-green-700 mb-1">
                Highlights
              </div>
              {highlights.map((h, i) => (
                <div key={i} className="text-xs text-gray-700">
                  ✓ {h}
                </div>
              ))}
            </div>
          )}
          {improvements.length > 0 && (
            <div className="mb-2">
              <div className="text-xs font-semibold text-red-700 mb-1">
                Areas for Improvement
              </div>
              {improvements.map((h, i) => (
                <div key={i} className="text-xs text-gray-700">
                  • {h}
                </div>
              ))}
            </div>
          )}
          {coachNote && (
            <p className="text-xs italic text-gray-500 mt-2">
              Coach: {coachNote}
            </p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div
      className="border rounded-xl shadow-sm overflow-hidden"
      style={{ background: 'linear-gradient(135deg,#eef2ff 0%,#f0fdf4 100%)' }}
    >
      {/* Header row */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🎯</span>
          <h3 className="text-base font-semibold text-gray-900">
            Overall Analysis
          </h3>
        </div>
        {score !== null && grade && (
          <div className="flex items-center gap-2">
            {/* Score ring */}
            <div className="relative w-12 h-12">
              <svg className="w-12 h-12 -rotate-90" viewBox="0 0 48 48">
                <circle
                  cx="24"
                  cy="24"
                  r="20"
                  stroke="#e5e7eb"
                  strokeWidth="5"
                  fill="none"
                />
                <circle
                  cx="24"
                  cy="24"
                  r="20"
                  stroke={scoreRingColor(score)}
                  strokeWidth="5"
                  fill="none"
                  strokeDasharray={`${(score / 100) * 125.66} 125.66`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[10px] font-bold text-gray-700">
                  {score}
                </span>
              </div>
            </div>
            <span
              className="text-xs font-bold px-2.5 py-1 rounded-full"
              style={{ background: gc.bg, color: gc.text }}
            >
              {grade}
            </span>
          </div>
        )}
      </div>

      {/* Summary */}
      {summary && (
        <div className="px-5 pb-3">
          <p className="text-sm text-gray-700 leading-relaxed">
            {toTitleCase(summary)}
          </p>
        </div>
      )}

      {/* Highlights + Improvements two-column */}
      {(highlights.length > 0 || improvements.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border-t border-indigo-100">
          {highlights.length > 0 && (
            <div className="px-5 py-3 border-r border-indigo-100">
              <div className="flex items-center gap-1.5 mb-2">
                <span className="text-green-500 text-sm">✅</span>
                <span className="text-[11px] font-semibold text-green-700 uppercase tracking-wide">
                  Highlights
                </span>
              </div>
              <ul className="space-y-1">
                {highlights.map((h, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-green-400 mt-0.5 flex-shrink-0 text-xs">
                      ✓
                    </span>
                    <span className="text-[12px] text-gray-700 leading-relaxed">
                      {h}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {improvements.length > 0 && (
            <div className="px-5 py-3">
              <div className="flex items-center gap-1.5 mb-2">
                <span className="text-amber-500 text-sm">⚡</span>
                <span className="text-[11px] font-semibold text-amber-700 uppercase tracking-wide">
                  Areas to Improve
                </span>
              </div>
              <ul className="space-y-1">
                {improvements.map((h, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-amber-400 mt-0.5 flex-shrink-0 text-xs">
                      •
                    </span>
                    <span className="text-[12px] text-gray-700 leading-relaxed">
                      {h}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Coach note */}
      {coachNote && (
        <div
          className="mx-5 mb-4 mt-1 px-3 py-2 rounded-lg"
          style={{
            background: 'rgba(99,102,241,0.08)',
            borderLeft: '3px solid #6366f1',
          }}
        >
          <div className="flex items-start gap-1.5">
            <span className="text-indigo-400 text-sm flex-shrink-0">💬</span>
            <p className="text-[12px] text-indigo-800 italic leading-relaxed">
              {toTitleCase(coachNote)}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

const EnhancedActivityCard = ({
  title,
  icon,
  data,
  color = '#22c55e',
}: {
  title: string
  icon: string
  data: any
  color?: string
}) => {
  const hints = data?.hints
  const totalAssigned = Number(data?.total_assigned_days) || 0
  const totalCompleted = Number(data?.total_completed_days ?? 0)
  const totalSkipped = Number(data?.total_fully_skipped_days ?? 0)
  const totalUpcoming = Number(data?.total_upcoming_days ?? 0)
  const adherencePercentage = Number(data?.adherence_percentage ?? 0)

  const completionRate =
    totalAssigned > 0 ? (totalCompleted / totalAssigned) * 100 : 0
  const adherenceColor = adherencePercentage
    ? getHealthColor(adherencePercentage)
    : color

  const pieData = [
    { label: 'Completed', value: totalCompleted, color: '#22c55e' },
    { label: 'Skipped', value: totalSkipped, color: '#ef4444' },
    { label: 'Upcoming', value: totalUpcoming, color: '#facc15' },
  ].filter((item) => item.value > 0)

  return (
    <div className="border rounded-xl bg-white shadow-sm p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-1">
          <h3 className="text-sm font-semibold text-gray-900">
            {icon} {title}
          </h3>
          {hints?.adherence && <HintTooltip hint={hints.adherence} />}
          {hints?.completion_rate && (
            <HintTooltip hint={hints.completion_rate} />
          )}
        </div>
        {adherencePercentage && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Adherence</span>
            <span
              className="text-xs font-bold px-2 py-1 rounded-full text-white"
              style={{ backgroundColor: adherenceColor }}
            >
              {adherencePercentage.toFixed(1)}%
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="flex-1">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                Days Assigned
              </div>
              <div className="text-lg font-bold text-gray-900">
                {totalAssigned}
              </div>
            </div>
            <div className="bg-green-50 rounded-lg p-3">
              <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                Days Completed
                {hints?.completed_days && (
                  <HintTooltip hint={hints.completed_days} />
                )}
              </div>
              <div className="text-lg font-bold text-green-600">
                {totalCompleted}
              </div>
            </div>
            <div className="bg-red-50 rounded-lg p-3">
              <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                Days Skipped
              </div>
              <div className="text-lg font-bold text-red-600">
                {totalSkipped}
              </div>
            </div>
            <div className="bg-yellow-50 rounded-lg p-3">
              <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                Days Upcoming
              </div>
              <div className="text-lg font-bold text-yellow-600">
                {totalUpcoming}
              </div>
            </div>
          </div>
        </div>

        <div className="ml-4 flex flex-col items-center gap-2">
          <PieChart
            data={pieData}
            size={80}
            strokeWidth={12}
            displayValue={totalAssigned}
          />
          <div className="text-xs text-gray-500 text-center">
            {completionRate.toFixed(0)}% completion
          </div>
        </div>
      </div>

      {data?.total_exercises_assigned && (
        <div className="border-t pt-3">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1 text-gray-500">
              Exercises Assigned
              {hints?.exercises_completed && (
                <HintTooltip hint={hints.exercises_completed} />
              )}
            </div>
            <span className="font-medium text-gray-700">
              {data.total_exercises_completed ?? 0}/
              {data.total_exercises_assigned ?? 0}
            </span>
          </div>
          {/* {data?.total_repeat_count > 0 && (
            <div className="flex items-center justify-between text-xs mt-1">
              <div className="flex items-center gap-1 text-gray-500">
                Total Repetitions
                {hints?.repeat_count && <HintTooltip hint={hints.repeat_count} />}
              </div>
              <span className="font-medium text-gray-700">
                {data.total_repeat_count}
              </span>
            </div>
          )} */}
          {data?.avg_video_watch_percentage != null && (
            <div className="flex items-center justify-between text-xs mt-1">
              <div className="flex items-center gap-1 text-gray-500">
                Avg Video Watch
                {hints?.video_engagement && (
                  <HintTooltip hint={hints.video_engagement} />
                )}
              </div>
              <span className="font-medium text-gray-700">
                {Number(data.avg_video_watch_percentage).toFixed(1)}%
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Helper function to capitalize first letter of each word
const toTitleCase = (str: string): string => {
  return str
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

export default function Reports({
  user,
  subscriptionId,
}: {
  user: any
  subscriptionId?: string | number | null
}) {
  const { data, isFetching, error } = useSubscriptionReport(subscriptionId, {
    enabled: !!subscriptionId,
  })

  const report = (data as any)?.subscription_report
  const pdfContainerRef = useRef<HTMLDivElement | null>(null)
  const [exporting, setExporting] = useState(false)
  const [recipeModalOpen, setRecipeModalOpen] = useState(false)
  const [recipeSearch, setRecipeSearch] = useState('')
  const [selectedRecipeIds, setSelectedRecipeIds] = useState<string[]>([])
  const [selectedRecipeDetails, setSelectedRecipeDetails] = useState<any[]>([])
  const [recipeSelectionLoading, setRecipeSelectionLoading] = useState(false)
  const [recipePage, setRecipePage] = useState(1)
  const [recipeRowsPerPage, setRecipeRowsPerPage] = useState(10)

  const recipeQueryParams = useMemo<QueryParams>(
    () => ({
      page: recipePage,
      per_page: recipeRowsPerPage,
      search: recipeSearch || undefined,
    }),
    [recipePage, recipeRowsPerPage, recipeSearch]
  )

  const { data: recipeListData, isFetching: isRecipeListLoading } =
    useRecipes(recipeQueryParams)

  const recipeOptions = recipeListData?.recipes ?? []
  const recipeMeta = recipeListData?.meta
  const currentRecipePage = recipeMeta?.current_page ?? recipePage
  const totalRecipeCount = recipeMeta?.total_count ?? 0
  const totalRecipePages =
    recipeMeta?.total_pages ??
    (recipeRowsPerPage
      ? Math.max(1, Math.ceil(totalRecipeCount / Number(recipeRowsPerPage)))
      : 1)

  const recipePageRef = useRef<HTMLDivElement>(null)
  const includeRecipePageRef = useRef(false)
  const hasRecipeSections = selectedRecipeDetails.length > 0

  const waitForNextFrame = useCallback(() => {
    return new Promise<void>((resolve) => {
      if (typeof window === 'undefined') {
        resolve()
        return
      }
      window.requestAnimationFrame(() => resolve())
    })
  }, [])

  const toggleRecipeSelection = useCallback((id: string | number) => {
    const key = String(id)
    setSelectedRecipeIds((prev) =>
      prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key]
    )
  }, [])

  useEffect(() => {
    if (
      typeof recipeMeta?.total_pages === 'number' &&
      recipeMeta.total_pages > 0
    ) {
      if (recipePage > recipeMeta.total_pages) {
        setRecipePage(recipeMeta.total_pages)
      } else if (recipePage < 1) {
        setRecipePage(1)
      }
    }
  }, [recipeMeta?.total_pages, recipePage])

  const handleRecipePageChange = useCallback(
    (direction: 'prev' | 'next') => {
      setRecipePage((prev) => {
        const target = direction === 'prev' ? prev - 1 : prev + 1
        if (target < 1) return 1
        if (totalRecipePages && target > totalRecipePages)
          return totalRecipePages
        return target
      })
    },
    [totalRecipePages]
  )

  const handleRecipeRowsChange = useCallback((value: number) => {
    setRecipeRowsPerPage(value)
    setRecipePage(1)
  }, [])

  const handleDownloadPdf = useCallback(
    async (recipes: any[]) => {
      if (!pdfContainerRef.current) return

      try {
        setExporting(true)

        const [html2canvasModule, jsPDFModule] = await Promise.all([
          import('html2canvas'),
          import('jspdf'),
        ])

        const html2canvas = html2canvasModule.default
        const JsPDF = jsPDFModule.default

        const pdf = new JsPDF('p', 'pt', 'a4')
        const pdfWidth = pdf.internal.pageSize.getWidth()
        const pdfHeight = pdf.internal.pageSize.getHeight()

        // PAGE 1
        const canvas1 = await html2canvas(pdfContainerRef.current, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
        })

        const img1 = canvas1.toDataURL('image/png')
        const imgHeight1 = (canvas1.height * pdfWidth) / canvas1.width
        let heightLeft = imgHeight1
        let position = 0

        pdf.addImage(img1, 'PNG', 0, position, pdfWidth, imgHeight1)
        heightLeft -= pdfHeight

        while (heightLeft > 0) {
          position = heightLeft - imgHeight1
          pdf.addPage()
          pdf.addImage(img1, 'PNG', 0, position, pdfWidth, imgHeight1)
          heightLeft -= pdfHeight
        }

        // PAGE 2 — recipe
        // PAGE 2 — recipe
        // PAGE 2+ — Recipes (NO SCREENSHOT, PURE PDF CONTENT)
        if (recipes && recipes.length > 0) {
          pdf.addPage()

          let y = 40
          const marginX = 40
          const lineHeight = 14
          const maxWidth = pdfWidth - marginX * 2

          pdf.setFontSize(16)
          pdf.text('Recipe Details', marginX, y)
          y += 20

          recipes.forEach((recipe: any, index: number) => {
            if (index !== 0) {
              pdf.addPage()
              y = 40
            }

            const nutrition = recipe?.nutrition ?? {}

            pdf.setFontSize(14)
            pdf.text(recipe?.name || 'Recipe', marginX, y)
            y += 16

            pdf.setFontSize(10)

            const writeBlock = (label: string, value: any) => {
              const text = `${label}: ${safeValue(value)}`
              const lines = pdf.splitTextToSize(text, maxWidth)
              pdf.text(lines, marginX, y)
              y += lines.length * lineHeight + 4
            }

            writeBlock('Description', recipe?.description)
            writeBlock('Preparation Notes', recipe?.preparation_notes)
            writeBlock('Category', recipe?.meal_category)
            writeBlock('Serving Unit', recipe?.serving_unit)
            writeBlock('Calories', nutrition?.calories ?? recipe?.calories)

            y += 6

            pdf.setFontSize(12)
            pdf.text('Nutrition', marginX, y)
            y += 14

            pdf.setFontSize(10)
            writeBlock('Protein', nutrition?.protein)
            writeBlock('Carbs', nutrition?.carbs)
            writeBlock('Fat', nutrition?.fat)
            writeBlock('Fiber', nutrition?.fiber)

            y += 6

            pdf.setFontSize(12)
            pdf.text('Ingredients', marginX, y)
            y += 14

            pdf.setFontSize(10)

            if (
              Array.isArray(recipe?.ingredients) &&
              recipe.ingredients.length > 0
            ) {
              recipe.ingredients.forEach((ing: any) => {
                const ingText = `• ${safeValue(ing?.name)} - ${safeValue(
                  ing?.quantity
                )} ${safeValue(ing?.unit)}`

                const lines = pdf.splitTextToSize(ingText, maxWidth)

                // page break if needed
                if (y + lines.length * lineHeight > pdfHeight - 40) {
                  pdf.addPage()
                  y = 40
                }

                pdf.text(lines, marginX, y)
                y += lines.length * lineHeight
              })
            } else {
              pdf.text('--', marginX, y)
              y += lineHeight
            }
          })
        }

        const rawName =
          (
            (report as any)?.user?.name ??
            user?.name ??
            'Report'
          )?.toString?.() ?? 'Report'
        const cleanedName =
          rawName.trim().replace(/[\\/:*?"<>|]/g, '') || 'Report'
        const underscoredName = cleanedName.replace(/\s+/g, '_')
        pdf.save(`Report_${underscoredName}.pdf`)
      } finally {
        setExporting(false)
        setSelectedRecipeIds([])
        setSelectedRecipeDetails([])
      }
    },
    [report, selectedRecipeDetails, user, waitForNextFrame]
  )

  const closeRecipeModal = useCallback(() => {
    if (!recipeSelectionLoading) {
      setRecipeModalOpen(false)
      setRecipeSearch('')
      setSelectedRecipeIds([])
      setRecipePage(1)
    }
  }, [recipeSelectionLoading])

  const proceedWithRecipes = useCallback(
    async (recipes: any[]) => {
      setSelectedRecipeDetails(recipes)
      const includeRecipePage = recipes.length > 0
      includeRecipePageRef.current = includeRecipePage

      // wait for React state commit
      await new Promise<void>((resolve) => {
        setTimeout(resolve, 0)
      })

      // wait for DOM paint
      await waitForNextFrame()

      // wait for images inside recipes to load
      if (includeRecipePage && recipePageRef.current) {
        const images = recipePageRef.current.querySelectorAll('img')
        await Promise.all(
          Array.from(images).map(
            (img) =>
              new Promise<void>((res) => {
                if (img.complete) return res()
                img.onload = () => res()
                img.onerror = () => res()
              })
          )
        )
      }

      await handleDownloadPdf(recipes)
    },
    [handleDownloadPdf, waitForNextFrame]
  )

  const handleRecipeConfirm = useCallback(async () => {
    setRecipeSelectionLoading(true)
    try {
      let details: any[] = []
      if (selectedRecipeIds.length > 0) {
        const responses = await Promise.all(
          selectedRecipeIds.map(async (recipeId) => {
            try {
              const res = await getRecipeDetails(recipeId)
              return res?.recipe ?? res ?? null
            } catch (err) {
              console.error('Failed to fetch recipe detail', err)
              return null
            }
          })
        )
        details = responses.filter(Boolean)
      }
      setRecipeModalOpen(false)
      await proceedWithRecipes(details)
    } catch (error) {
      console.error('Failed to include recipes in PDF', error)
    } finally {
      setRecipeSelectionLoading(false)
      setRecipeSearch('')
      setRecipePage(1)
    }
  }, [proceedWithRecipes, selectedRecipeIds])

  const handleSkipRecipes = useCallback(async () => {
    setRecipeSelectionLoading(true)
    try {
      setRecipeModalOpen(false)
      await proceedWithRecipes([])
    } catch (error) {
      console.error('Failed to generate PDF', error)
    } finally {
      setRecipeSelectionLoading(false)
      setRecipeSearch('')
      setRecipePage(1)
    }
  }, [proceedWithRecipes])

  if (!subscriptionId) {
    return (
      <div className="p-6 text-sm text-gray-600">
        No active subscription to show report for.
      </div>
    )
  }

  if (isFetching) {
    return (
      <div className="p-6 text-sm text-gray-600">
        Loading subscription report...
      </div>
    )
  }

  if (error || !report) {
    return (
      <div className="p-10 min-h-[40vh] flex flex-col items-center justify-center text-gray-500 text-sm">
        {(error as any)?.response?.data?.message || 'No report data available'}
      </div>
    )
  }

  const { subscription, plan, user: reportUser } = report
  const canDownloadWithRecipes = selectedRecipeIds.length > 0

  // Extract data for PDF section
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const workout = report.workout_summary || {}
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const yoga = report.yoga_summary || {}
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const meditation = report.meditation_summary || {}
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const vitals = report.vitals || {}
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const weightBmi = report.weight_and_bmi || {}

  const renderRecipePreviewCards = (recipes: any[]) => (
    <div className="border rounded-xl bg-white shadow-sm p-4 flex flex-col gap-4">
      <div className="text-xs font-semibold uppercase text-gray-700">
        Selected Recipes
      </div>
      <div className="flex flex-col gap-4">
        {recipes.map((recipe) => {
          const key = recipe?.id || recipe?.name || Math.random()
          const nutrition = recipe?.nutrition ?? {}
          const infoCards = [
            { key: 'name', label: 'Name', value: recipe?.name },
            { key: 'desc', label: 'Description', value: recipe?.description },
            {
              key: 'notes',
              label: 'Preparation Notes',
              value: recipe?.preparation_notes,
            },
            { key: 'cat', label: 'Category', value: recipe?.meal_category },
            {
              key: 'serve',
              label: 'Serving Unit',
              value: recipe?.serving_unit,
            },
            {
              key: 'cal',
              label: 'Total Calories',
              value: nutrition?.calories ?? recipe?.calories,
            },
          ]

          return (
            <div
              key={key}
              className="rounded-lg border border-gray-200 bg-gray-50 p-4 flex flex-col gap-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {infoCards.map((field) => (
                  <div
                    key={field.key}
                    className="border rounded-lg p-3 bg-white"
                  >
                    <div className="text-xs text-gray-500 mb-1">
                      {field.label}
                    </div>
                    <div className="text-sm text-gray-900">
                      {safeValue(field.value)}
                    </div>
                  </div>
                ))}

                <div className="border rounded-lg p-3 bg-white">
                  <div className="text-xs text-gray-500 mb-2">Image</div>
                  <div className="text-sm">
                    {recipe?.image_url ? (
                      <div className="w-[160px] h-[160px] overflow-hidden rounded-md border">
                        <img
                          className="w-full h-full object-cover"
                          src={recipe?.image_url}
                          alt="Recipe"
                        />
                      </div>
                    ) : (
                      <span>--</span>
                    )}
                  </div>
                </div>

                <div className="border rounded-lg p-3 bg-white">
                  <div className="text-xs text-gray-500 mb-2">Nutrition</div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-500">Protein: </span>
                      {safeValue(nutrition?.protein)}
                    </div>
                    <div>
                      <span className="text-gray-500">Carbs: </span>
                      {safeValue(nutrition?.carbs)}
                    </div>
                    <div>
                      <span className="text-gray-500">Fat: </span>
                      {safeValue(nutrition?.fat)}
                    </div>
                    <div>
                      <span className="text-gray-500">Fiber: </span>
                      {safeValue(nutrition?.fiber)}
                    </div>
                  </div>
                </div>
              </div>

              <div
                className="mt-6 pt-6"
                style={{
                  pageBreakBefore: 'always',
                  breakInside: 'avoid',
                }}
              >
                <div className="text-base font-semibold text-gray-900 mb-4">
                  Ingredients
                </div>

                {Array.isArray(recipe?.ingredients) &&
                recipe.ingredients.length > 0 ? (
                  <div className="flex flex-col gap-3">
                    {recipe.ingredients.map((ing: any, idx: number) => (
                      <div
                        key={ing?.id ?? `${ing?.name}-${idx}`}
                        className="border rounded-lg px-4 py-3 bg-white shadow-sm"
                        style={{
                          breakInside: 'avoid',
                          pageBreakInside: 'avoid',
                        }}
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-900">
                            {safeValue(ing?.name)}
                          </span>

                          <span className="text-sm text-gray-600">
                            {safeValue(ing?.quantity)} {safeValue(ing?.unit)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">
                    No ingredients available
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )

  const renderPdfRecipeSection = (recipes: any[]) => (
    <div className="mt-8">
      <h3 className="font-semibold mb-3">Recipe Details</h3>
      <div className="flex flex-col gap-4">
        {recipes.map((recipe, index) => {
          const nutrition = recipe?.nutrition ?? {}
          const infoCards = [
            { key: 'name', label: 'Name', value: recipe?.name },
            { key: 'desc', label: 'Description', value: recipe?.description },
            {
              key: 'notes',
              label: 'Preparation Notes',
              value: recipe?.preparation_notes,
            },
            { key: 'cat', label: 'Category', value: recipe?.meal_category },
            {
              key: 'serve',
              label: 'Serving Unit',
              value: recipe?.serving_unit,
            },
            {
              key: 'cal',
              label: 'Total Calories',
              value: nutrition?.calories ?? recipe?.calories,
            },
          ]

          return (
            <div
              key={recipe?.id ?? `${recipe?.name}-${index}`}
              className="border rounded-lg p-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                {infoCards.map((field) => (
                  <div
                    key={field.key}
                    className="border rounded-md p-3 bg-gray-50"
                  >
                    <div className="text-xs text-gray-500 mb-1">
                      {field.label}
                    </div>
                    <div className="text-sm text-gray-900">
                      {safeValue(field.value)}
                    </div>
                  </div>
                ))}

                <div className="border rounded-md p-3 bg-gray-50">
                  <div className="text-xs text-gray-500 mb-2">Nutrition</div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-500">Protein: </span>
                      {safeValue(nutrition?.protein)}
                    </div>
                    <div>
                      <span className="text-gray-500">Carbs: </span>
                      {safeValue(nutrition?.carbs)}
                    </div>
                    <div>
                      <span className="text-gray-500">Fat: </span>
                      {safeValue(nutrition?.fat)}
                    </div>
                    <div>
                      <span className="text-gray-500">Fiber: </span>
                      {safeValue(nutrition?.fiber)}
                    </div>
                  </div>
                </div>
              </div>

              <div
                className="mt-3 border rounded-md p-3 bg-gray-50"
                style={{ pageBreakBefore: 'always' }}
              >
                <div className="text-sm font-semibold text-gray-900 mb-2">
                  Ingredients
                </div>
                {Array.isArray(recipe?.ingredients) &&
                recipe.ingredients.length > 0 ? (
                  <div className="flex flex-col divide-y text-sm">
                    {recipe.ingredients.map((ing: any) => (
                      <div
                        key={ing?.id ?? `${ing?.name}-${ing?.unit}`}
                        className="flex flex-wrap items-center justify-between gap-2 py-1"
                      >
                        <span className="font-medium text-gray-900">
                          {safeValue(ing?.name)}
                        </span>
                        <span className="text-gray-500">
                          {safeValue(ing?.quantity)} {safeValue(ing?.unit)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm">--</div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )

  return (
    <>
      {/* Modal */}
      <DialogModal
        isOpen={recipeModalOpen}
        onClose={closeRecipeModal}
        title="Include Recipes?"
        subTitle="Attach recipe details to this report before downloading the PDF."
        small={false}
        headborder
        body={
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={recipeSearch}
                onChange={(event) => setRecipeSearch(event.target.value)}
                placeholder="Search recipes"
                disabled={recipeSelectionLoading}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm 
             focus:outline-none focus:ring-0 focus:border-gray-300"
              />
              <button
                type="button"
                onClick={() => setRecipeSearch('')}
                disabled={recipeSelectionLoading || recipeSearch.length === 0}
                className="text-sm px-3 py-2 border border-gray-300 rounded-md text-gray-600 bg-white hover:bg-gray-50 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Clear
              </button>
            </div>
            <div className="border rounded-lg max-h-80 overflow-y-auto divide-y">
              {isRecipeListLoading ? (
                <div className="p-4 text-sm text-gray-500">
                  Loading recipes…
                </div>
              ) : recipeOptions.length === 0 ? (
                <div className="p-4 text-sm text-gray-500">
                  No recipes found.
                </div>
              ) : (
                recipeOptions.map((recipe: any) => {
                  const recipeId = String(recipe?.id)
                  const checked = selectedRecipeIds.includes(recipeId)
                  return (
                    <label
                      key={recipeId}
                      className="flex items-center gap-3 p-3 text-sm cursor-pointer hover:bg-gray-50"
                    >
                      <input
                        type="checkbox"
                        className="h-4 w-4"
                        checked={checked}
                        onChange={() => toggleRecipeSelection(recipeId)}
                        disabled={recipeSelectionLoading}
                      />
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900">
                          {recipe?.name || 'Untitled'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {recipe?.meal_category || '—'}
                        </span>
                      </div>
                    </label>
                  )
                })
              )}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-gray-600 border rounded-md px-3 py-2 bg-gray-50">
              <span>
                Showing{' '}
                {(currentRecipePage - 1) * Number(recipeRowsPerPage) + 1}
                {'-'}
                {Math.min(
                  currentRecipePage * Number(recipeRowsPerPage),
                  totalRecipeCount
                )}{' '}
                of {totalRecipeCount} recipes
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="px-3 py-1 border rounded-md text-gray-600 disabled:opacity-50"
                  onClick={() => handleRecipePageChange('prev')}
                  disabled={currentRecipePage <= 1 || isRecipeListLoading}
                >
                  Previous
                </button>
                <span className="font-medium text-gray-700">
                  Page {currentRecipePage} of {totalRecipePages}
                </span>
                <button
                  type="button"
                  className="px-3 py-1 border rounded-md text-gray-600 disabled:opacity-50"
                  onClick={() => handleRecipePageChange('next')}
                  disabled={
                    currentRecipePage >= totalRecipePages || isRecipeListLoading
                  }
                >
                  Next
                </button>
              </div>
              <div className="flex items-center gap-2">
                <span>Rows per page</span>
                <select
                  className="border rounded-md px-2 py-1 bg-white"
                  value={recipeRowsPerPage}
                  onChange={(event) =>
                    handleRecipeRowsChange(Number(event.target.value))
                  }
                  disabled={isRecipeListLoading}
                >
                  {[5, 10, 20, 30].map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="text-xs text-gray-600 flex items-center justify-between">
              <span>
                {canDownloadWithRecipes
                  ? `Selected recipes: ${selectedRecipeIds.length}`
                  : 'Select at least one recipe to attach it to the report.'}
              </span>
            </div>
          </div>
        }
        actionBody={
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={handleRecipeConfirm}
              disabled={recipeSelectionLoading || !canDownloadWithRecipes}
              className="inline-flex justify-center rounded-md bg-primaryGreen px-4 py-2 text-sm font-medium text-white disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {recipeSelectionLoading ? 'Preparing…' : 'Download with recipes'}
            </button>

            <button
              type="button"
              onClick={handleSkipRecipes}
              disabled={recipeSelectionLoading}
              className="inline-flex justify-center rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
            >
              {recipeSelectionLoading ? 'Working…' : 'Download without recipes'}
            </button>
          </div>
        }
      />

      {/* Main */}
      <div className="flex flex-col gap-4">
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setRecipeModalOpen(true)}
            disabled={exporting}
            className="inline-flex items-center gap-2 rounded-md bg-primaryGreen px-3 py-2 text-sm font-medium text-white shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {exporting ? 'Preparing PDF…' : 'Download PDF'}
          </button>
        </div>

        {/* Header card */}
        <div className="border rounded-xl bg-white shadow-sm p-4 flex flex-col gap-3">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <div className="text-xs uppercase text-gray-500 mb-1">
                Subscription
              </div>
              <div className="text-lg font-semibold text-gray-900">
                {plan?.name ? toTitleCase(plan.name) : 'Plan'}
              </div>
              <div className="text-sm text-gray-600">{plan?.category}</div>
            </div>
            <div className="text-sm text-gray-600">
              <div>
                <span className="font-medium text-gray-700">User :</span>{' '}
                {reportUser?.name || user?.name
                  ? (reportUser?.name || user?.name)
                      .toString()
                      .charAt(0)
                      .toUpperCase() +
                    (reportUser?.name || user?.name).toString().slice(1)
                  : '—'}
              </div>
              <div>
                <span className="font-medium text-gray-700">Duration :</span>{' '}
                {formatDate(subscription?.start_date)} to{' '}
                {formatDate(subscription?.end_date)}
              </div>
              <div>
                <span className="font-medium text-gray-700">
                  Subscription Status :
                </span>{' '}
                {subscription?.status
                  ? subscription.status.charAt(0).toUpperCase() +
                    subscription.status.slice(1)
                  : '—'}
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Dashboard */}
        <div className="space-y-6">
          {/* Quick Stats Overview */}
          {report.overall_analysis && (
            <OverallAnalysisCard data={report.overall_analysis} />
          )}

          {/* Main Dashboard Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {/* Diet Section */}
            <div className="space-y-4">
              <DietSummaryCard dietSummary={report.diet_summary} />
              <MealTimingCard
                mealTimingAnalysis={report.diet_summary?.meal_timing_analysis}
                hint={report.diet_summary?.hints?.meal_timing}
              />
              <CategoryConsumptionCard
                categoryConsumption={report.diet_summary?.category_consumption}
                hint={report.diet_summary?.hints?.food_categories}
              />
            </div>

            {/* Body Metrics Section */}
            <div className="space-y-4">
              <BodyMetricsCard
                bodyMeasurements={report.body_measurements}
                weightBmi={report.weight_and_bmi}
              />
              <VitalsTrackingCard vitals={report.vitals} />
            </div>

            {/* Activity Section */}
            <div className="space-y-4">
              <EnhancedActivityCard
                title="Workout Summary"
                icon="💪"
                data={report.workout_summary}
              />
              <EnhancedActivityCard
                title="Yoga Summary"
                icon="🧘"
                data={report.yoga_summary}
              />
              <EnhancedActivityCard
                title="Meditation Summary"
                icon="🧘‍♀️"
                data={report.meditation_summary}
              />
            </div>
          </div>

          {/* Daily Activity Timeline */}
          <DailyActivityCard dailyBreakdown={report.daily_breakdown} />
        </div>

        {hasRecipeSections && renderRecipePreviewCards(selectedRecipeDetails)}
      </div>

      {/* PDF */}
      <div
        ref={pdfContainerRef}
        className="bg-white p-6 text-sm text-gray-800"
        style={{
          position: 'absolute',
          left: '-9999px',
          top: 0,
          width: '800px',
        }}
      >
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-center mb-6 text-gray-800">
            Subscription Details
          </h2>

          <table className="w-full border-separate border-spacing-y-3 text-sm">
            <tbody>
              <tr className="bg-gray-50">
                <td className="px-4 py-3 text-gray-500 w-1/4">Plan Name</td>
                <td className="px-4 py-3 font-semibold text-gray-800 w-1/4">
                  {plan?.name ? toTitleCase(plan.name) : '—'}
                </td>

                <td className="px-4 py-3 text-gray-500 w-1/4">Category</td>
                <td className="px-4 py-3 font-semibold text-gray-800 w-1/4">
                  {plan?.category || '—'}
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-gray-500 w-1/4">Name</td>
                <td className="px-4 py-3 font-semibold text-gray-800 w-1/4">
                  {reportUser?.name || user?.name
                    ? (reportUser?.name || user?.name)
                        .toString()
                        .charAt(0)
                        .toUpperCase() +
                      (reportUser?.name || user?.name).toString().slice(1)
                    : '—'}
                </td>
              </tr>
              <tr className="bg-gray-50">
                <td className="px-4 py-3 text-gray-500">Start Date</td>
                <td className="px-4 py-3 font-semibold text-gray-800">
                  {formatDate(subscription?.start_date)}
                </td>

                <td className="px-4 py-3 text-gray-500">End Date</td>
                <td className="px-4 py-3 font-semibold text-gray-800">
                  {formatDate(subscription?.end_date)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* ENHANCED DASHBOARD SECTIONS */}

        {/* OVERALL ANALYSIS */}
        {report.overall_analysis && (
          <OverallAnalysisCard data={report.overall_analysis} forPdf />
        )}

        {/* DIET ANALYSIS */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-center mb-4 text-gray-800">
            🍽️ Diet Analysis
          </h2>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="border rounded-lg p-3">
              <h4 className="font-semibold mb-2 text-gray-700">
                Calorie Tracking
              </h4>
              <table className="w-full text-sm">
                <tr>
                  <td className="py-1 text-gray-600">Calories Assigned</td>
                  <td className="py-1 font-medium">
                    {report.diet_summary?.total_calories_assigned ?? 0}
                  </td>
                </tr>
                <tr>
                  <td className="py-1 text-gray-600">Calories Consumed</td>
                  <td className="py-1 font-medium">
                    {report.diet_summary?.total_calories_consumed ?? 0}
                  </td>
                </tr>
                <tr>
                  <td className="py-1 text-gray-600">Adherence</td>
                  <td className="py-1 font-medium">
                    {Number(
                      report.diet_summary?.calorie_adherence_percentage ?? 0
                    ).toFixed(1)}
                    %
                  </td>
                </tr>
              </table>
            </div>

            <div className="border rounded-lg p-3">
              <h4 className="font-semibold mb-2 text-gray-700">Item Summary</h4>
              <table className="w-full text-sm">
                <tr>
                  <td className="py-1 text-gray-600">Items Assigned</td>
                  <td className="py-1 font-medium">
                    {report.diet_summary?.total_items_assigned ?? 0}
                  </td>
                </tr>
                <tr>
                  <td className="py-1 text-gray-600">Items Completed</td>
                  <td className="py-1 font-medium">
                    {report.diet_summary?.total_items_completed ?? 0}
                  </td>
                </tr>
                <tr>
                  <td className="py-1 text-gray-600">Items Skipped</td>
                  <td className="py-1 font-medium">
                    {report.diet_summary?.total_items_skipped ?? 0}
                  </td>
                </tr>
              </table>
            </div>
          </div>

          {/* Meal Timing Analysis */}
          <div className="mb-6">
            <h4 className="font-semibold mb-2 text-gray-700">
              ⏰ Meal Timing Analysis
            </h4>
            <table className="w-full border border-collapse text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border px-2 py-1 text-left">Meal Type</th>
                  <th className="border px-2 py-1 text-left">Items</th>
                  <th className="border px-2 py-1 text-left">Calories</th>
                  <th className="border px-2 py-1 text-left">Adherence</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(report.diet_summary?.meal_timing_analysis || {})
                  .filter(
                    ([, data]: [string, any]) =>
                      data &&
                      (data.items_consumed > 0 || data.calories_consumed > 0)
                  )
                  .map(([mealType, data]: [string, any]) => (
                    <tr key={mealType}>
                      <td className="border px-2 py-1">{mealType}</td>
                      <td className="border px-2 py-1">
                        {data.items_consumed ?? 0}
                      </td>
                      <td className="border px-2 py-1">
                        {data.calories_consumed ?? 0}
                      </td>
                      <td className="border px-2 py-1">
                        {Number(data.adherence_percentage ?? 0).toFixed(0)}%
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {/* Category Consumption */}
          <div>
            <h4 className="font-semibold mb-2 text-gray-700">
              🥗 Food Category Consumption
            </h4>
            <table className="w-full border border-collapse text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border px-2 py-1 text-left">Category</th>
                  <th className="border px-2 py-1 text-left">Items</th>
                  <th className="border px-2 py-1 text-left">Calories</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(report.diet_summary?.category_consumption || {})
                  .filter(
                    ([, data]: [string, any]) =>
                      data &&
                      (data.items_consumed > 0 || data.calories_consumed > 0)
                  )
                  .sort(
                    ([, a], [, b]) =>
                      (b as any).calories_consumed -
                      (a as any).calories_consumed
                  )
                  .slice(0, 8)
                  .map(([category, data]: [string, any]) => (
                    <tr key={category}>
                      <td className="border px-2 py-1">{category}</td>
                      <td className="border px-2 py-1">
                        {data.items_consumed ?? 0}
                      </td>
                      <td className="border px-2 py-1">
                        {data.calories_consumed ?? 0}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* BODY METRICS */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-center mb-4 text-gray-800">
            💪 Body Metrics Analysis
          </h2>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="border rounded-lg p-3">
              <h4 className="font-semibold mb-2 text-gray-700">
                Weight Progression
              </h4>
              <table className="w-full text-sm">
                <tr>
                  <td className="py-1 text-gray-600">Start Weight</td>
                  <td className="py-1 font-medium">
                    {weightBmi.start_weight ?? '—'} kg
                  </td>
                </tr>
                <tr>
                  <td className="py-1 text-gray-600">End Weight</td>
                  <td className="py-1 font-medium">
                    {weightBmi.end_weight ?? '—'} kg
                  </td>
                </tr>
                <tr>
                  <td className="py-1 text-gray-600">Weight Change</td>
                  <td className="py-1 font-medium">
                    {weightBmi.weight_delta
                      ? `${weightBmi.weight_delta} kg`
                      : '—'}
                  </td>
                </tr>
              </table>
            </div>

            <div className="border rounded-lg p-3">
              <h4 className="font-semibold mb-2 text-gray-700">BMI Analysis</h4>
              <table className="w-full text-sm">
                <tr>
                  <td className="py-1 text-gray-600">Start BMI</td>
                  <td className="py-1 font-medium">
                    {weightBmi.start_bmi ?? '—'}
                  </td>
                </tr>
                <tr>
                  <td className="py-1 text-gray-600">End BMI</td>
                  <td className="py-1 font-medium">
                    {weightBmi.end_bmi ?? '—'}
                  </td>
                </tr>
                <tr>
                  <td className="py-1 text-gray-600">BMI Change</td>
                  <td className="py-1 font-medium">
                    {weightBmi.bmi_delta ? `${weightBmi.bmi_delta}` : '—'}
                  </td>
                </tr>
              </table>
            </div>
          </div>

          {/* Body Measurements */}
          {report.body_measurements?.change && (
            <div>
              <h4 className="font-semibold mb-2 text-gray-700">
                Body Measurement Changes
              </h4>
              <table className="w-full border border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border px-2 py-1 text-left">Measurement</th>
                    <th className="border px-2 py-1 text-left">Change (cm)</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    {
                      label: 'Chest',
                      value: report.body_measurements.change.chest_delta,
                    },
                    {
                      label: 'Waist',
                      value: report.body_measurements.change.waist_delta,
                    },
                    {
                      label: 'Hip',
                      value: report.body_measurements.change.hip_delta,
                    },
                    {
                      label: 'Arm',
                      value: report.body_measurements.change.arm_delta,
                    },
                    {
                      label: 'Thigh',
                      value: report.body_measurements.change.thigh_delta,
                    },
                  ]
                    .filter((m) => m.value !== null && m.value !== undefined)
                    .map((measurement) => (
                      <tr key={measurement.label}>
                        <td className="border px-2 py-1">
                          {measurement.label}
                        </td>
                        <td className="border px-2 py-1">
                          {measurement.value} cm
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ENHANCED VITALS TRACKING */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-center mb-4 text-gray-800">
            ❤️ Vitals & Health Tracking
          </h2>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="border rounded-lg p-3">
              <h4 className="font-semibold mb-2 text-gray-700">
                Health Metrics
              </h4>
              <table className="w-full text-sm">
                {/* <tr>
                  <td className="py-1 text-gray-600">Max Heart Rate</td>
                  <td className="py-1 font-medium">
                    {vitals.max_heart_rate ?? '—'} bpm
                  </td>
                </tr>
                <tr>
                  <td className="py-1 text-gray-600">Max Sugar Level</td>
                  <td className="py-1 font-medium">
                    {vitals.max_sugar_level ?? '—'} mg/dL
                  </td>
                </tr> */}
                <tr>
                  <td className="py-1 text-gray-600">Avg Sleep Hours</td>
                  <td className="py-1 font-medium">
                    {vitals.avg_sleep_hours ?? '—'} hrs
                  </td>
                </tr>
                <tr>
                  <td className="py-1 text-gray-600">Avg Water Intake</td>
                  <td className="py-1 font-medium">
                    {vitals.avg_water_intake ?? '—'} L
                  </td>
                </tr>
                <tr>
                  <td className="py-1 text-gray-600">Avg Steps</td>
                  <td className="py-1 font-medium">
                    {vitals.avg_steps ?? '—'}
                  </td>
                </tr>
              </table>
            </div>

            <div className="border rounded-lg p-3">
              <h4 className="font-semibold mb-2 text-gray-700">
                Health Compliance
              </h4>
              <table className="w-full text-sm">
                {/* <tr>
                  <td className="py-1 text-gray-600">Normal Heart Rate</td>
                  <td className="py-1 font-medium">
                    {Number(vitals.normal_heart_rate_percentage ?? 0).toFixed(
                      0
                    )}
                    %
                  </td>
                </tr>
                <tr>
                  <td className="py-1 text-gray-600">Normal Sugar Level</td>
                  <td className="py-1 font-medium">
                    {Number(vitals.normal_sugar_level_percentage ?? 0).toFixed(
                      0
                    )}
                    %
                  </td>
                </tr> */}
                <tr>
                  <td className="py-1 text-gray-600">Adequate Sleep</td>
                  <td className="py-1 font-medium">
                    {Number(vitals.adequate_sleep_percentage ?? 0).toFixed(0)}%
                  </td>
                </tr>
                <tr>
                  <td className="py-1 text-gray-600">Adequate Hydration</td>
                  <td className="py-1 font-medium">
                    {Number(
                      vitals.adequate_water_intake_percentage ?? 0
                    ).toFixed(0)}
                    %
                  </td>
                </tr>
              </table>
            </div>
          </div>

          {/* Daily Vitals Breakdown */}
          {vitals.daily_breakdown && vitals.daily_breakdown.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2 text-gray-700">
                Daily Vitals Summary
              </h4>
              <table className="w-full border border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border px-2 py-1 text-left">Date</th>
                    <th className="border px-2 py-1 text-left">Sleep (hrs)</th>
                    <th className="border px-2 py-1 text-left">Water (L)</th>
                    <th className="border px-2 py-1 text-left">Steps</th>
                    <th className="border px-2 py-1 text-left">Heart Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {vitals.daily_breakdown
                    .filter(
                      (day: any) =>
                        day.summary &&
                        (day.summary.avg_sleep_hours ||
                          day.summary.total_water_intake ||
                          day.summary.total_steps ||
                          day.summary.max_heart_rate)
                    )
                    .map((day: any) => (
                      <tr key={day.date}>
                        <td className="border px-2 py-1">{day.date}</td>
                        <td className="border px-2 py-1">
                          {day.summary.avg_sleep_hours ?? '—'}
                        </td>
                        <td className="border px-2 py-1">
                          {day.summary.total_water_intake ?? '—'}
                        </td>
                        <td className="border px-2 py-1">
                          {day.summary.total_steps ?? '—'}
                        </td>
                        <td className="border px-2 py-1">
                          {day.summary.max_heart_rate ?? '—'}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ACTIVITY ANALYSIS */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-center mb-4 text-gray-800">
            🏃 Activity Performance Analysis
          </h2>

          <div className="grid grid-cols-3 gap-4 mb-6">
            {/* Workout Summary */}
            <div className="border rounded-lg p-3">
              <h4 className="font-semibold mb-2 text-gray-700">💪 Workout</h4>
              <table className="w-full text-sm">
                <tr>
                  <td className="py-1 text-gray-600">Days Assigned</td>
                  <td className="py-1 font-medium">
                    {workout.total_assigned_days ?? 0}
                  </td>
                </tr>
                <tr>
                  <td className="py-1 text-gray-600">Days Completed</td>
                  <td className="py-1 font-medium">
                    {workout.total_completed_days ?? 0}
                  </td>
                </tr>
                <tr>
                  <td className="py-1 text-gray-600">Days Skipped</td>
                  <td className="py-1 font-medium">
                    {workout.total_fully_skipped_days ?? 0}
                  </td>
                </tr>
                <tr>
                  <td className="py-1 text-gray-600">Exercises Assigned</td>
                  <td className="py-1 font-medium">
                    {workout.total_exercises_assigned ?? 0}
                  </td>
                </tr>
                <tr>
                  <td className="py-1 text-gray-600">Exercises Completed</td>
                  <td className="py-1 font-medium">
                    {workout.total_exercises_completed ?? 0}
                  </td>
                </tr>
                <tr>
                  <td className="py-1 text-gray-600">Adherence</td>
                  <td className="py-1 font-medium">
                    {workout.adherence_percentage
                      ? `${Number(workout.adherence_percentage).toFixed(1)}%`
                      : '—'}
                  </td>
                </tr>
              </table>
            </div>

            {/* Yoga Summary */}
            <div className="border rounded-lg p-3">
              <h4 className="font-semibold mb-2 text-gray-700">🧘 Yoga</h4>
              <table className="w-full text-sm">
                <tr>
                  <td className="py-1 text-gray-600">Days Assigned</td>
                  <td className="py-1 font-medium">
                    {yoga.total_assigned_days ?? 0}
                  </td>
                </tr>
                <tr>
                  <td className="py-1 text-gray-600">Days Completed</td>
                  <td className="py-1 font-medium">
                    {yoga.total_completed_days ?? 0}
                  </td>
                </tr>
                <tr>
                  <td className="py-1 text-gray-600">Days Skipped</td>
                  <td className="py-1 font-medium">
                    {yoga.total_fully_skipped_days ?? 0}
                  </td>
                </tr>
                <tr>
                  <td className="py-1 text-gray-600">Exercises Assigned</td>
                  <td className="py-1 font-medium">
                    {yoga.total_exercises_assigned ?? 0}
                  </td>
                </tr>
                <tr>
                  <td className="py-1 text-gray-600">Exercises Completed</td>
                  <td className="py-1 font-medium">
                    {yoga.total_exercises_completed ?? 0}
                  </td>
                </tr>
                <tr>
                  <td className="py-1 text-gray-600">Adherence</td>
                  <td className="py-1 font-medium">
                    {yoga.adherence_percentage
                      ? `${Number(yoga.adherence_percentage).toFixed(1)}%`
                      : '—'}
                  </td>
                </tr>
              </table>
            </div>

            {/* Meditation Summary */}
            <div className="border rounded-lg p-3">
              <h4 className="font-semibold mb-2 text-gray-700">
                🧘‍♀️ Meditation
              </h4>
              <table className="w-full text-sm">
                <tr>
                  <td className="py-1 text-gray-600">Sessions Assigned</td>
                  <td className="py-1 font-medium">
                    {meditation.total_sessions_assigned ?? 0}
                  </td>
                </tr>
                <tr>
                  <td className="py-1 text-gray-600">Sessions Completed</td>
                  <td className="py-1 font-medium">
                    {meditation.total_sessions_completed ?? 0}
                  </td>
                </tr>
                <tr>
                  <td className="py-1 text-gray-600">Sessions Missed</td>
                  <td className="py-1 font-medium">
                    {meditation.total_sessions_missed ?? 0}
                  </td>
                </tr>
                <tr>
                  <td className="py-1 text-gray-600">Total Duration</td>
                  <td className="py-1 font-medium">
                    {meditation.total_duration_seconds ?? 0}s
                  </td>
                </tr>
                <tr>
                  <td className="py-1 text-gray-600">Avg Duration</td>
                  <td className="py-1 font-medium">
                    {meditation.avg_duration_seconds ?? '—'}s
                  </td>
                </tr>
                <tr>
                  <td className="py-1 text-gray-600">Completion Rate</td>
                  <td className="py-1 font-medium">
                    {meditation.completion_rate
                      ? `${Number(meditation.completion_rate).toFixed(1)}%`
                      : '—'}
                  </td>
                </tr>
              </table>
            </div>
          </div>

          {/* Daily Activity Breakdown */}
          <div>
            <h4 className="font-semibold mb-2 text-gray-700">
              📅 Daily Activity Breakdown
            </h4>
            <table className="w-full border border-collapse text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border px-2 py-1 text-left">Date</th>
                  <th className="border px-2 py-1 text-left">Day</th>
                  <th className="border px-2 py-1 text-left">Diet</th>
                  <th className="border px-2 py-1 text-left">Workout</th>
                  <th className="border px-2 py-1 text-left">Yoga</th>
                  <th className="border px-2 py-1 text-left">Meditation</th>
                </tr>
              </thead>
              <tbody>
                {report.daily_breakdown?.map((day: any) => {
                  const getActivityStatus = (activity: any) => {
                    const total =
                      (activity.assigned || 0) + (activity.upcoming || 0)
                    const completed = activity.completed || 0
                    if (total === 0) return '—'
                    const rate = (completed / total) * 100
                    return `${completed}/${total} (${rate.toFixed(0)}%)`
                  }

                  return (
                    <tr key={day.date}>
                      <td className="border px-2 py-1">
                        {formatDate(day.date)}
                      </td>
                      <td className="border px-2 py-1">Day {day.day_number}</td>
                      <td className="border px-2 py-1">
                        {getActivityStatus(day.diet)}
                      </td>
                      <td className="border px-2 py-1">
                        {getActivityStatus(day.workout)}
                      </td>
                      <td className="border px-2 py-1">
                        {getActivityStatus(day.yoga)}
                      </td>
                      <td className="border px-2 py-1">
                        {getActivityStatus(day.meditation)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <div
        ref={recipePageRef}
        className="bg-white p-5"
        style={{
          position: 'absolute',
          left: '-9999px',
          top: 0,
          width: '800px',
        }}
      >
        {hasRecipeSections
          ? renderPdfRecipeSection(selectedRecipeDetails)
          : null}
      </div>
    </>
  )
}
