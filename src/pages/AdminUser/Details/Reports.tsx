import { useSubscriptionReport } from '../api'

type PieSlice = {
  label: string
  value: number
  color: string
}

type PieChartProps = {
  data: PieSlice[]
  size?: number
  strokeWidth?: number
}

const PieChart = ({ data, size = 120, strokeWidth = 18 }: PieChartProps) => {
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
          {hasData ? total : '--'}
        </span>
      </div>
    </div>
  )
}

const buildCompletionPie = (
  completed?: number,
  pending?: number
): PieSlice[] => {
  const completedValue = Number(completed ?? 0)
  const pendingValue = Number(pending ?? 0)
  return [
    {
      label: 'Completed',
      value: completedValue,
      color: '#22c55e',
    },
    {
      label: 'Pending',
      value: pendingValue,
      color: '#facc15',
    },
  ]
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
  const workout = report.workout_summary || {}
  const yoga = report.yoga_summary || {}
  const meditation = report.meditation_summary || {}
  const vitals = report.vitals || {}
  const weightBmi = report.weight_and_bmi || {}

  const workoutPie = buildCompletionPie(
    workout.total_completed_count,
    workout.total_pending_count
  )
  const yogaPie = buildCompletionPie(
    yoga.total_completed_count,
    yoga.total_pending_count
  )
  const meditationPie: PieSlice[] = [
    {
      label: 'Completed',
      value: Number(meditation.completed_count ?? 0),
      color: '#22c55e',
    },
    {
      label: 'Missed',
      value: Number(meditation.missed_count ?? 0),
      color: '#ef4444',
    },
  ]

  return (
    <div className="flex flex-col gap-4">
      {/* Header card */}
      <div className="border rounded-xl bg-white shadow-sm p-4 flex flex-col gap-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <div className="text-xs uppercase text-gray-500 mb-1">
              Subscription
            </div>
            <div className="text-lg font-semibold text-gray-900">
              {plan?.name || 'Plan'}
            </div>
            <div className="text-sm text-gray-600">{plan?.category}</div>
          </div>
          <div className="text-sm text-gray-600">
            <div>
              <span className="font-medium text-gray-700">User :</span>{' '}
              {reportUser?.name || user?.name}
            </div>
            <div>
              <span className="font-medium text-gray-700">Duration :</span>{' '}
              {subscription?.start_date} to {subscription?.end_date}
            </div>
            <div>
              <span className="font-medium text-gray-700">Status :</span>{' '}
              {subscription?.status}
            </div>
          </div>
        </div>
      </div>

      {/* Summary cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="border rounded-xl bg-white shadow-sm p-4 flex flex-col gap-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1">
              <div className="text-xs font-semibold uppercase text-gray-700">
                Workout Summary
              </div>
              <div className="text-sm text-gray-700">
                Days with activity: {workout.total_days_with_activity ?? 0}
              </div>
              <div className="text-sm text-gray-700">
                Completed: {workout.total_completed_count ?? 0}
              </div>
              <div className="text-sm text-gray-700">
                Pending: {workout.total_pending_count ?? 0}
              </div>
            </div>
            <div className="shrink-0 flex flex-col items-center justify-center gap-2">
              <PieChart data={workoutPie} />
              <div className="flex flex-col items-start text-[11px] text-gray-500">
                <div className="flex items-center gap-1">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: '#22c55e' }}
                  />
                  <span>Completed</span>
                </div>
                <div className="flex items-center gap-1">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: '#facc15' }}
                  />
                  <span>Pending</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border rounded-xl bg-white shadow-sm p-4 flex flex-col gap-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1">
              <div className="text-xs font-semibold uppercase text-gray-700">
                Yoga Summary
              </div>
              <div className="text-sm text-gray-700">
                Days with activity: {yoga.total_days_with_activity ?? 0}
              </div>
              <div className="text-sm text-gray-700">
                Completed: {yoga.total_completed_count ?? 0}
              </div>
              <div className="text-sm text-gray-700">
                Pending: {yoga.total_pending_count ?? 0}
              </div>
            </div>
            <div className="shrink-0 flex flex-col items-center justify-center gap-2">
              <PieChart data={yogaPie} />
              <div className="flex flex-col items-start text-[11px] text-gray-500">
                <div className="flex items-center gap-1">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: '#22c55e' }}
                  />
                  <span>Completed</span>
                </div>
                <div className="flex items-center gap-1">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: '#facc15' }}
                  />
                  <span>Pending</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border rounded-xl bg-white shadow-sm p-4 flex flex-col gap-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1">
              <div className="text-xs font-semibold uppercase text-gray-700">
                Meditation Summary
              </div>
              <div className="text-sm text-gray-700">
                Sessions: {meditation.total_sessions ?? 0}
              </div>
              <div className="text-sm text-gray-700">
                Completed: {meditation.completed_count ?? 0}
              </div>
              <div className="text-sm text-gray-700">
                Missed: {meditation.missed_count ?? 0}
              </div>
            </div>
            <div className="shrink-0 flex flex-col items-center justify-center gap-2">
              <PieChart data={meditationPie} />
              <div className="flex flex-col items-start text-[11px] text-gray-500">
                <div className="flex items-center gap-1">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: '#22c55e' }}
                  />
                  <span>Completed</span>
                </div>
                <div className="flex items-center gap-1">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: '#ef4444' }}
                  />
                  <span>Missed</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border rounded-xl bg-white shadow-sm p-4 flex flex-col gap-2">
          <div className="text-xs font-semibold uppercase text-gray-700">
            Vitals
          </div>
          <div className="text-sm text-gray-700">
            Entries: {vitals.entries_count ?? 0}
          </div>
          <div className="text-sm text-gray-700">
            Avg heart rate: {vitals.avg_heart_rate ?? '—'}
          </div>
          <div className="text-sm text-gray-700">
            Avg sugar level: {vitals.avg_sugar_level ?? '—'}
          </div>
        </div>

        <div className="border rounded-xl bg-white shadow-sm p-4 flex flex-col gap-2">
          <div className="text-xs font-semibold uppercase text-gray-700">
            Weight & BMI
          </div>
          <div className="text-sm text-gray-700">
            Start weight: {weightBmi.start_weight ?? '—'}
          </div>
          <div className="text-sm text-gray-700">
            End weight: {weightBmi.end_weight ?? '—'}
          </div>
          <div className="text-sm text-gray-700">
            Weight change: {weightBmi.weight_delta ?? '—'}
          </div>
          <div className="text-sm text-gray-700">
            Avg BMI: {weightBmi.avg_bmi ?? '—'}
          </div>
        </div>
      </div>

      {report.overall_analysis && (
        <div className="border rounded-xl bg-white shadow-sm p-4">
          <div className="text-xs font-semibold uppercase text-gray-700 mb-1">
            Overall Analysis
          </div>
          <div className="text-sm text-gray-700 whitespace-pre-line">
            {report.overall_analysis}
          </div>
        </div>
      )}
    </div>
  )
}
