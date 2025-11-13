import { useEffect, useMemo, useState } from 'react'
import { useLayoutStore } from '../../store/layoutStore'
import Icons from '../../components/common/icons'
import { Tab, TabContainer } from '../../components/common/tab'

export type DashboardResponse = {
  timeframe?: {
    start_date?: string
    end_date?: string
  }
  users?: {
    total?: number
    by_role?: Record<string, number>
    new_in_range?: number
    active?: number
    suspended?: number
    deactivated?: number
  }
  subscriptions?: {
    total?: number
    by_status?: Record<string, number>
    new_in_range?: number
    active_now?: number
    expired_now?: number
    paused_now?: number
    subscribers_by_plan?: {
      plan_id?: number
      plan_name?: string
      subscribers?: number
    }[]
    revenue?: {
      active_total_fees?: string
      created_in_range_total_fees?: string
    }
  }
  plans?: {
    total?: number
    active?: number
    by_category?: Record<string, number>
    new_in_range?: number
  }
  workouts?: {
    total?: number
    with_video?: number
    new_in_range?: number
    average_rating_overall?: number
    by_intensity?: Record<string, number>
  }
  recipes?: {
    total?: number
    new_in_range?: number
  }
  feedbacks?: {
    total?: number
    new_in_range?: number
    by_rating?: Record<string, number>
    for_workouts?: number
    for_plans?: number
    for_recipes?: number
  }
  notifications?: {
    total?: number
    new_in_range?: number
    unread?: number
    delivered?: number
    scheduled_future?: number
    by_type?: Record<string, number>
  }
  activity?: {
    progress_logs?: number
    body_measurements?: number
    workout_exercise_completions?: number
    diet_plan_completions?: number
    workout_plan_progresses?: number
  }
  freezes?: {
    total?: number
    new_in_range?: number
    active_now?: number
  }
  interests?: {
    total?: number
    new_in_range?: number
    by_plan?: Record<string, number>
  }
}

type DashboardProps = {
  data?: DashboardResponse
  loading: boolean
  error: boolean
  onRetry: () => void
}

const formatNumber = (value?: number | string) => {
  if (value === undefined || value === null) return '--'
  const numeric = typeof value === 'string' ? Number(value) : value
  if (Number.isNaN(numeric)) return String(value)
  return numeric.toLocaleString('en-IN')
}

const formatCurrency = (value?: number | string) => {
  if (value === undefined || value === null) return '--'
  const numeric = typeof value === 'string' ? Number(value) : value
  if (Number.isNaN(numeric)) return String(value)
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(numeric)
}

const formatPercentage = (part?: number, total?: number) => {
  if (!total || total === 0 || part === undefined || part === null) return '--'
  const pct = (part / total) * 100
  return `${pct.toFixed(1)}%`
}

const formatDate = (value?: string) => {
  if (!value) return ''
  const dt = new Date(value)
  if (Number.isNaN(dt.getTime())) return value
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(dt)
}

type PieSlice = {
  label: string
  value: number
  color: string
  percent: number
  gradientClass?: string
}

type PieChartProps = {
  data: PieSlice[]
  total?: number
  size?: number
  strokeWidth?: number
  centerLabel?: string
}

const PieChart = ({
  data,
  total,
  size = 200,
  strokeWidth = 28,
  centerLabel,
}: PieChartProps) => {
  const computedTotal =
    total !== undefined
      ? total
      : data.reduce((acc, item) => acc + Math.max(0, item.value || 0), 0)
  const chartSize = Math.max(size, 0)
  const radius = Math.max((chartSize - strokeWidth) / 2, 0)
  const circumference = 2 * Math.PI * radius
  const center = chartSize / 2
  let offset = 0
  const hasData = computedTotal > 0

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
            const dashLength = (value / computedTotal) * circumference
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
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        {centerLabel ? (
          <p className="text-xs uppercase tracking-widest text-gray-500">
            {centerLabel}
          </p>
        ) : null}
        <p className="text-lg font-semibold text-gray-900">
          {formatNumber(computedTotal)}
        </p>
      </div>
    </div>
  )
}

const PieLegend = ({ data }: { data: PieSlice[] }) => (
  <div className="space-y-3">
    {data.map((slice) => (
      <div
        key={slice.label}
        className={`rounded-2xl p-[1px] ${slice.gradientClass ? `bg-gradient-to-r ${slice.gradientClass}` : 'bg-slate-200'}`}
      >
        <div className="flex items-center justify-between rounded-2xl bg-white/90 px-4 py-3 shadow-sm">
          <div className="flex items-center gap-3">
            <span
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: slice.color }}
            ></span>
            <p className="text-sm font-medium text-gray-800 capitalize">
              {slice.label}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-gray-900">
              {formatNumber(slice.value)}
            </p>
            <p className="text-xs text-gray-500">
              {Number.isFinite(slice.percent)
                ? `${slice.percent.toFixed(1)}%`
                : '--'}
            </p>
          </div>
        </div>
      </div>
    ))}
  </div>
)

export default function DashboardView({
  data,
  loading,
  error,
  onRetry,
}: DashboardProps) {
  const { setLayoutType } = useLayoutStore()

  useEffect(() => {
    setLayoutType('sideNav')
  }, [setLayoutType])

  const timeframeLabel = useMemo(() => {
    const start = formatDate(data?.timeframe?.start_date)
    const end = formatDate(data?.timeframe?.end_date)
    if (!start && !end) return 'Overview'
    if (start && end) return `${start} – ${end}`
    return start || end
  }, [data])

  const gradientPalette = useMemo(
    () => [
      'from-blue-500 to-cyan-500',
      'from-emerald-500 to-teal-500',
      'from-violet-500 to-indigo-500',
      'from-amber-500 to-orange-500',
      'from-rose-500 to-pink-500',
      'from-slate-500 to-gray-500',
    ],
    []
  )

  const tabItems = useMemo(
    () => [
      {
        id: 'overview',
        label: 'Overview',
        activeClass:
          'bg-white/95 shadow-lg shadow-indigo-500/20 ring-1 ring-white/70',
        inactiveClass:
          'bg-white/10 hover:bg-white/30 backdrop-blur-sm transition-colors duration-150',
        activeBorderClass: 'border-indigo-500',
        inactiveBorderClass: 'border-transparent',
      },
      {
        id: 'audience',
        label: 'Audience & Engagement',
        activeClass:
          'bg-white/95 shadow-lg shadow-emerald-500/15 ring-1 ring-white/70',
        inactiveClass:
          'bg-white/10 hover:bg-white/30 backdrop-blur-sm transition-colors duration-150',
        activeBorderClass: 'border-emerald-500',
        inactiveBorderClass: 'border-transparent',
      },
      {
        id: 'content',
        label: 'Content & Plans',
        activeClass:
          'bg-white/95 shadow-lg shadow-amber-500/20 ring-1 ring-white/70',
        inactiveClass:
          'bg-white/10 hover:bg-white/30 backdrop-blur-sm transition-colors duration-150',
        activeBorderClass: 'border-amber-500',
        inactiveBorderClass: 'border-transparent',
      },
      {
        id: 'operations',
        label: 'Operations',
        activeClass:
          'bg-white/95 shadow-lg shadow-sky-500/20 ring-1 ring-white/70',
        inactiveClass:
          'bg-white/10 hover:bg-white/30 backdrop-blur-sm transition-colors duration-150',
        activeBorderClass: 'border-sky-500',
        inactiveBorderClass: 'border-transparent',
      },
    ],
    []
  )

  const [activeTab, setActiveTab] = useState<string>('overview')

  const pieColorPalette = useMemo(
    () => ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899', '#64748b'],
    []
  )

  const roleBreakdown = useMemo(() => {
    const entries = Object.entries(data?.users?.by_role || {})
    const total =
      entries.reduce((acc, [, count]) => acc + Number(count ?? 0), 0) ||
      data?.users?.total ||
      0
    return entries
      .map(([role, count], index) => {
        const value = Number(count ?? 0)
        return {
          role,
          count: value,
          percent: total ? (value / total) * 100 : 0,
          color: gradientPalette[index % gradientPalette.length],
        }
      })
      .sort((a, b) => b.count - a.count)
  }, [data, gradientPalette])

  const renderStatHighlights = () => (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
      {statCards.map((stat, index) => (
        <div
          key={`${stat.title}-${index}`}
          className="relative overflow-hidden rounded-3xl bg-white/70 backdrop-blur-xl border border-white/40 shadow-lg"
        >
          <div
            className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-20`}
          />
          <div className="relative flex h-full flex-col gap-6 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-widest text-gray-500">
                  {stat.title}
                </p>
                <p className="mt-2 text-3xl font-semibold text-gray-900">
                  {stat.value}
                </p>
              </div>
              <div className="rounded-2xl bg-white/70 p-3 shadow-inner">
                <Icons name={stat.icon} className="h-6 w-6 text-gray-700" />
              </div>
            </div>
            <p className="text-sm font-medium text-gray-600">{stat.subtitle}</p>
          </div>
        </div>
      ))}
    </div>
  )

  const renderSubscriberMomentum = () => (
    <div className="relative overflow-hidden rounded-3xl bg-white/80 backdrop-blur-xl border border-white/40 shadow-lg p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Subscriber Momentum
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Active {formatNumber(data?.subscriptions?.active_now)} · Paused{' '}
            {formatNumber(data?.subscriptions?.paused_now)} · Expired{' '}
            {formatNumber(data?.subscriptions?.expired_now)}
          </p>
        </div>
        <div className="rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-500 px-4 py-2 text-white text-sm font-medium shadow-md">
          {formatNumber(data?.subscriptions?.new_in_range)} new this period
        </div>
      </div>
      <div className="mt-8 grid gap-6 lg:grid-cols-[240px_1fr]">
        <div className="flex justify-center">
          <PieChart
            data={statusPieData}
            total={data?.subscriptions?.total}
            centerLabel="Total Subscribers"
          />
        </div>
        <PieLegend data={statusPieData} />
      </div>
    </div>
  )

  const renderRevenueSnapshot = () => (
    <div className="relative overflow-hidden rounded-3xl bg-white/80 backdrop-blur-xl border border-white/40 shadow-lg p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">
          Revenue Snapshot
        </h2>
        <Icons name="payment-icon" className="h-6 w-6 text-gray-700" />
      </div>
      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 px-5 py-6 text-white shadow-lg">
          <p className="text-xs uppercase tracking-widest text-white/70">
            Active Portfolio Value
          </p>
          <p className="mt-3 text-3xl font-semibold">
            {formatCurrency(
              data?.subscriptions?.revenue?.active_total_fees || 0
            )}
          </p>
        </div>
        <div className="rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 px-5 py-6 text-white shadow-lg">
          <p className="text-xs uppercase tracking-widest text-white/70">
            Created This Period
          </p>
          <p className="mt-3 text-3xl font-semibold">
            {formatCurrency(
              data?.subscriptions?.revenue?.created_in_range_total_fees || 0
            )}
          </p>
        </div>
      </div>
      <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2">
        {data?.subscriptions?.subscribers_by_plan?.map((plan) => (
          <div
            key={`${plan.plan_id}-${plan.plan_name}`}
            className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white/70 px-4 py-3 shadow-sm"
          >
            <div>
              <p className="text-sm font-semibold text-gray-800">
                {plan.plan_name}
              </p>
              <p className="text-xs text-gray-500">Plan #{plan.plan_id}</p>
            </div>
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
              <Icons name="user" className="h-4 w-4 text-blue-600" />
              {formatNumber(plan.subscribers)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const renderUserComposition = () => (
    <div className="rounded-3xl bg-white/90 backdrop-blur-xl border border-white/40 shadow-lg p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          User Composition
        </h3>
        <Icons name="barchart-icon" className="h-5 w-5 text-gray-600" />
      </div>
      <div className="mt-5 space-y-4">
        {roleBreakdown.map((item) => (
          <div
            key={item.role}
            className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white/60 px-4 py-3"
          >
            <div>
              <p className="text-sm font-medium text-gray-800 capitalize">
                {item.role}
              </p>
              <p className="text-xs text-gray-500">
                {Number.isFinite(item.percent)
                  ? `${item.percent.toFixed(1)}% share`
                  : '--'}
              </p>
              {renderBar(item.percent, item.color)}
            </div>
            <span className="text-lg font-semibold text-gray-900">
              {formatNumber(item.count)}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-6 grid grid-cols-3 gap-3 text-center">
        <div className="rounded-2xl bg-emerald-50/80 px-3 py-3 text-emerald-700">
          <p className="text-xs uppercase tracking-widest">Active</p>
          <p className="mt-1 text-lg font-semibold">
            {formatNumber(data?.users?.active)}
          </p>
        </div>
        <div className="rounded-2xl bg-amber-50/80 px-3 py-3 text-amber-700">
          <p className="text-xs uppercase tracking-widest">Suspended</p>
          <p className="mt-1 text-lg font-semibold">
            {formatNumber(data?.users?.suspended)}
          </p>
        </div>
        <div className="rounded-2xl bg-rose-50/80 px-3 py-3 text-rose-700">
          <p className="text-xs uppercase tracking-widest">Deactivated</p>
          <p className="mt-1 text-lg font-semibold">
            {formatNumber(data?.users?.deactivated)}
          </p>
        </div>
      </div>
    </div>
  )

  const renderNotificationsPulse = () => (
    <div className="rounded-3xl bg-white/90 backdrop-blur-xl border border-white/40 shadow-lg p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Notifications Pulse
        </h3>
        <Icons name="notify-icon" className="h-5 w-5 text-gray-600" />
      </div>
      <div className="mt-4 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-4 text-white shadow-lg">
        <p className="text-xs uppercase tracking-[0.3em] text-white/70">
          Unread
        </p>
        <p className="mt-1 text-3xl font-semibold">
          {formatNumber(data?.notifications?.unread)}
        </p>
        <p className="text-xs text-white/80 mt-2">
          {formatNumber(data?.notifications?.scheduled_future)} scheduled next
        </p>
      </div>
      <div className="mt-5 space-y-3">
        {notificationTypes.map((item) => (
          <div
            key={item.type}
            className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white/70 px-4 py-3"
          >
            <span className="text-sm font-medium text-gray-700 capitalize">
              {item.type.replace(/_/g, ' ')}
            </span>
            <div className="text-right">
              <p className="text-base font-semibold text-gray-900">
                {formatNumber(item.count)}
              </p>
              <p className="text-xs text-gray-500">
                {Number.isFinite(item.percent)
                  ? `${item.percent.toFixed(1)}%`
                  : '--'}
              </p>
              {renderBar(item.percent, item.color)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const renderEngagementSignals = () => (
    <div className="rounded-3xl bg-white/90 backdrop-blur-xl border border-white/40 shadow-lg p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Engagement Signals
        </h3>
        <Icons name="activity" className="h-5 w-5 text-gray-600" />
      </div>
      <div className="mt-5 space-y-4">
        {[
          { label: 'Progress Logs', value: data?.activity?.progress_logs },
          {
            label: 'Body Measurements',
            value: data?.activity?.body_measurements,
          },
          {
            label: 'Workout Completions',
            value: data?.activity?.workout_exercise_completions,
          },
          {
            label: 'Diet Plan Completions',
            value: data?.activity?.diet_plan_completions,
          },
        ].map((item) => (
          <div
            key={item.label}
            className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white/70 px-4 py-3"
          >
            <span className="text-sm font-medium text-gray-700">
              {item.label}
            </span>
            <span className="text-base font-semibold text-gray-900">
              {formatNumber(item.value)}
            </span>
            {renderBar(
              Number(data?.activity?.progress_logs)
                ? (Number(item.value ?? 0) /
                    Number(data?.activity?.progress_logs ?? 0)) *
                    100
                : 0,
              gradientPalette[0]
            )}
          </div>
        ))}
      </div>
    </div>
  )

  const renderWorkoutMix = () => (
    <div className="rounded-3xl bg-white/90 backdrop-blur-xl border border-white/40 shadow-lg p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Workout Mix</h3>
        <div className="rounded-2xl bg-emerald-50 px-3 py-1 text-emerald-700 text-xs font-medium">
          Avg rating {data?.workouts?.average_rating_overall ?? '--'}
        </div>
      </div>
      <div className="mt-5 space-y-3">
        {intensityBreakdown.map((item) => (
          <div
            key={item.intensity}
            className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white/70 px-4 py-3"
          >
            <span className="text-sm font-medium text-gray-700 capitalize">
              {item.intensity}
            </span>
            <div className="text-right">
              <p className="text-base font-semibold text-gray-900">
                {formatNumber(item.count)}
              </p>
              <p className="text-xs text-gray-500">
                {Number.isFinite(item.percent)
                  ? `${item.percent.toFixed(1)}%`
                  : '--'}
              </p>
              {renderBar(item.percent, item.color)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const renderPlanCategories = () => (
    <div className="rounded-3xl bg-white/90 backdrop-blur-xl border border-white/40 shadow-lg p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Plan Categories</h3>
        <Icons name="cards" className="h-5 w-5 text-gray-600" />
      </div>
      <div className="mt-5 space-y-3">
        {planCategories.map((item) => (
          <div
            key={item.category}
            className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white/70 px-4 py-3"
          >
            <span className="text-sm font-medium text-gray-700">
              {item.category}
            </span>
            <div className="text-right">
              <p className="text-base font-semibold text-gray-900">
                {formatNumber(item.count)}
              </p>
              <p className="text-xs text-gray-500">
                {Number.isFinite(item.percent)
                  ? `${item.percent.toFixed(1)}%`
                  : '--'}
              </p>
              {renderBar(item.percent, item.color)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const renderCustomerSentiment = () => (
    <div className="rounded-3xl bg-white/90 backdrop-blur-xl border border-white/40 shadow-lg p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Customer Sentiment
        </h3>
        <Icons name="chat" className="h-5 w-5 text-gray-600" />
      </div>
      <div className="mt-4 grid gap-6 lg:grid-cols-[240px_1fr]">
        <div className="flex justify-center">
          <PieChart
            data={feedbackPieData}
            total={feedbackSources.total}
            centerLabel="Feedback"
          />
        </div>
        <PieLegend data={feedbackPieData} />
      </div>
      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        {Object.entries(data?.feedbacks?.by_rating || {}).map(
          ([rating, count]) => (
            <div
              key={rating}
              className="rounded-2xl border border-gray-200 bg-white/70 px-3 py-3 text-center"
            >
              <p className="text-xs uppercase tracking-widest text-gray-500">
                {rating} ★
              </p>
              <p className="mt-1 text-lg font-semibold text-gray-900">
                {formatNumber(count)}
              </p>
            </div>
          )
        )}
      </div>
    </div>
  )

  const renderRecipeLibrary = () => (
    <div className="rounded-3xl bg-white/90 backdrop-blur-xl border border-white/40 shadow-lg p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Recipe Library</h3>
        <Icons name="document-icon" className="h-5 w-5 text-gray-600" />
      </div>
      <div className="mt-5 grid grid-cols-2 gap-4">
        <div className="rounded-2xl bg-gradient-to-br from-rose-500 to-pink-500 px-4 py-5 text-white shadow-lg">
          <p className="text-xs uppercase tracking-widest text-white/70">
            Total Recipes
          </p>
          <p className="mt-2 text-2xl font-semibold">
            {formatNumber(data?.recipes?.total)}
          </p>
        </div>
        <div className="rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 px-4 py-5 text-white shadow-lg">
          <p className="text-xs uppercase tracking-widest text-white/70">
            New This Period
          </p>
          <p className="mt-2 text-2xl font-semibold">
            {formatNumber(data?.recipes?.new_in_range)}
          </p>
        </div>
      </div>
    </div>
  )

  const renderFreezeOverview = () => (
    <div className="rounded-3xl bg-white/90 backdrop-blur-xl border border-white/40 shadow-lg p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Freeze Overview</h3>
        <Icons name="lock-icon" className="h-5 w-5 text-gray-600" />
      </div>
      <div className="mt-5 grid grid-cols-3 gap-3 text-center">
        <div className="rounded-2xl bg-slate-50 px-3 py-3 text-slate-700">
          <p className="text-xs uppercase tracking-widest">Total</p>
          <p className="mt-1 text-lg font-semibold">
            {formatNumber(data?.freezes?.total)}
          </p>
        </div>
        <div className="rounded-2xl bg-blue-50 px-3 py-3 text-blue-700">
          <p className="text-xs uppercase tracking-widest">Active</p>
          <p className="mt-1 text-lg font-semibold">
            {formatNumber(data?.freezes?.active_now)}
          </p>
        </div>
        <div className="rounded-2xl bg-emerald-50 px-3 py-3 text-emerald-700">
          <p className="text-xs uppercase tracking-widest">New in Range</p>
          <p className="mt-1 text-lg font-semibold">
            {formatNumber(data?.freezes?.new_in_range)}
          </p>
        </div>
      </div>
    </div>
  )

  const renderInterestSignals = () => (
    <div className="rounded-3xl bg-white/90 backdrop-blur-xl border border-white/40 shadow-lg p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Interest Signals
        </h3>
        <Icons name="heart-rate-icon" className="h-5 w-5 text-gray-600" />
      </div>
      <div className="mt-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-lime-500 px-4 py-4 text-white shadow-lg">
        <p className="text-xs uppercase tracking-[0.3em] text-white/70">
          Total Interests
        </p>
        <p className="mt-1 text-3xl font-semibold">
          {formatNumber(data?.interests?.total)}
        </p>
        <p className="text-xs text-white/80 mt-2">
          {formatNumber(data?.interests?.new_in_range)} new this period
        </p>
      </div>
      <div className="mt-5 space-y-3">
        {interestBreakdown.slice(0, 4).map((item) => (
          <div
            key={item.name}
            className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white/70 px-4 py-3"
          >
            <span className="text-sm font-medium text-gray-700">
              {item.name}
            </span>
            <div className="text-right">
              <p className="text-base font-semibold text-gray-900">
                {formatNumber(item.count)}
              </p>
              <p className="text-xs text-gray-500">
                {Number.isFinite(item.percent)
                  ? `${item.percent.toFixed(1)}%`
                  : '--'}
              </p>
              {renderBar(item.percent, item.color)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const renderOverviewTab = () => (
    <div className="space-y-10">
      {renderStatHighlights()}
      <div className="space-y-6">
        {renderSubscriberMomentum()}
        {renderRevenueSnapshot()}
      </div>
    </div>
  )

  const renderAudienceTab = () => (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div className="space-y-6">
        {renderUserComposition()}
        {renderNotificationsPulse()}
      </div>
      <div>{renderEngagementSignals()}</div>
    </div>
  )

  const renderContentTab = () => (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div>{renderWorkoutMix()}</div>
      <div className="space-y-6">
        {renderPlanCategories()}
        {renderCustomerSentiment()}
      </div>
    </div>
  )

  const renderOperationsTab = () => (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {renderRecipeLibrary()}
      {renderFreezeOverview()}
      {renderInterestSignals()}
    </div>
  )

  const renderBar = (percent: number, color: string) => (
    <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
      <div
        className={`h-full bg-gradient-to-r ${color}`}
        style={{ width: `${Math.max(0, Math.min(100, percent))}%` }}
      ></div>
    </div>
  )

  const feedbackSources = useMemo(() => {
    const entries = [
      {
        label: 'Workout',
        value: Number(data?.feedbacks?.for_workouts ?? 0),
        containerClass: 'bg-blue-50/80 text-blue-700',
        pieColor: pieColorPalette[0 % pieColorPalette.length],
      },
      {
        label: 'Plans',
        value: Number(data?.feedbacks?.for_plans ?? 0),
        containerClass: 'bg-emerald-50/80 text-emerald-700',
        pieColor: pieColorPalette[1 % pieColorPalette.length],
      },
      {
        label: 'Recipes',
        value: Number(data?.feedbacks?.for_recipes ?? 0),
        containerClass: 'bg-amber-50/80 text-amber-700',
        pieColor: pieColorPalette[2 % pieColorPalette.length],
      },
    ]
    const total = entries.reduce((acc, item) => acc + item.value, 0)
    const enriched = entries.map((item) => ({
      ...item,
      percent: total ? (item.value / total) * 100 : 0,
    }))
    return { entries: enriched, total }
  }, [data, pieColorPalette])

  const statusBreakdown = useMemo(() => {
    const entries = Object.entries(data?.subscriptions?.by_status || {})
    const total =
      entries.reduce((acc, [, count]) => acc + Number(count ?? 0), 0) ||
      data?.subscriptions?.total ||
      0
    return entries
      .map(([status, count], index) => {
        const value = Number(count ?? 0)
        return {
          status,
          count: value,
          percent: total ? (value / total) * 100 : 0,
          color: gradientPalette[index % gradientPalette.length],
          pieColor: pieColorPalette[index % pieColorPalette.length],
        }
      })
      .sort((a, b) => b.count - a.count)
  }, [data, gradientPalette, pieColorPalette])

  const statusPieData = useMemo<PieSlice[]>(
    () =>
      statusBreakdown.map((item) => ({
        label: item.status,
        value: item.count,
        percent: item.percent,
        color: item.pieColor,
      })),
    [statusBreakdown]
  )

  const feedbackPieData = useMemo<PieSlice[]>(
    () =>
      feedbackSources.entries.map((item) => ({
        label: item.label,
        value: item.value,
        percent: item.percent,
        color: item.pieColor,
      })),
    [feedbackSources]
  )

  const statCards = useMemo(
    () => [
      {
        title: 'Total Users',
        value: formatNumber(data?.users?.total),
        subtitle: `${formatNumber(data?.users?.active)} active · ${formatPercentage(data?.users?.active, data?.users?.total)} engagement`,
        icon: 'user',
        gradient: 'from-cyan-500 to-blue-600',
      },
      {
        title: 'Subscriptions',
        value: formatNumber(data?.subscriptions?.total),
        subtitle: `${formatNumber(data?.subscriptions?.active_now)} active · ${formatNumber(data?.subscriptions?.paused_now)} paused`,
        icon: 'subscription-icon',
        gradient: 'from-purple-500 to-indigo-600',
      },
      {
        title: 'Plans Library',
        value: formatNumber(data?.plans?.total),
        subtitle: `${formatNumber(data?.plans?.active)} active catalogued`,
        icon: 'barchart-icon',
        gradient: 'from-amber-500 to-orange-500',
      },
      {
        title: 'Workouts',
        value: formatNumber(data?.workouts?.total),
        subtitle: `${formatNumber(data?.workouts?.with_video)} with guided videos`,
        icon: 'activities',
        gradient: 'from-emerald-500 to-teal-500',
      },
    ],
    [data]
  )

  const intensityBreakdown = useMemo(() => {
    const entries = Object.entries(data?.workouts?.by_intensity || {})
    const total =
      entries.reduce((acc, [, count]) => acc + Number(count ?? 0), 0) ||
      data?.workouts?.total ||
      0
    return entries
      .map(([intensity, count], index) => {
        const value = Number(count ?? 0)
        return {
          intensity,
          count: value,
          percent: total ? (value / total) * 100 : 0,
          color: gradientPalette[index % gradientPalette.length],
        }
      })
      .sort((a, b) => b.count - a.count)
  }, [data, gradientPalette])

  const planCategories = useMemo(() => {
    const entries = Object.entries(data?.plans?.by_category || {})
    return entries
      .map(([category, count], index) => {
        const value = Number(count ?? 0)
        const total = entries.reduce(
          (acc, [, innerCount]) => acc + Number(innerCount ?? 0),
          0
        )
        return {
          category,
          count: value,
          percent: total ? (value / total) * 100 : 0,
          color: gradientPalette[index % gradientPalette.length],
        }
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 6)
  }, [data, gradientPalette])

  const notificationTypes = useMemo(() => {
    const entries = Object.entries(data?.notifications?.by_type || {})
    const total =
      entries.reduce((acc, [, count]) => acc + Number(count ?? 0), 0) ||
      data?.notifications?.total ||
      0
    return entries
      .map(([type, count], index) => {
        const value = Number(count ?? 0)
        return {
          type,
          count: value,
          percent: total ? (value / total) * 100 : 0,
          color: gradientPalette[index % gradientPalette.length],
        }
      })
      .sort((a, b) => b.count - a.count)
  }, [data, gradientPalette])

  const interestBreakdown = useMemo(() => {
    const entries = Object.entries(data?.interests?.by_plan || {})
    const total =
      entries.reduce((acc, [, count]) => acc + Number(count ?? 0), 0) ||
      data?.interests?.total ||
      0
    return entries
      .map(([name, count], index) => {
        const value = Number(count ?? 0)
        return {
          name,
          count: value,
          percent: total ? (value / total) * 100 : 0,
          color: gradientPalette[index % gradientPalette.length],
        }
      })
      .sort((a, b) => b.count - a.count)
  }, [data, gradientPalette])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 w-full">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-36 rounded-2xl bg-white/60 backdrop-blur-xl border border-white/40 shadow-sm animate-pulse"
              ></div>
            ))}
          </div>
          <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
            {Array.from({ length: 2 }).map((_, index) => (
              <div
                key={index}
                className="h-80 rounded-3xl bg-white/60 backdrop-blur-xl border border-white/40 shadow-sm animate-pulse"
              ></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 w-full">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-24">
          <div className="bg-white/90 backdrop-blur-sm border border-white/40 shadow-lg rounded-3xl p-10 text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-rose-100">
              <Icons name="danger" className="w-8 h-8 text-rose-600" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Unable to load dashboard insights
            </h2>
            <p className="text-gray-600 mb-6">
              Please verify your connection or try again in a moment.
            </p>
            <button
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-6 py-3 text-white font-medium shadow-md hover:shadow-lg transition"
              onClick={onRetry}
            >
              <Icons name="refresh" className="w-4 h-4" />
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 w-full">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-10">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-500 text-white shadow-xl">
          <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
          <div className="relative flex flex-col gap-6 px-8 py-10 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-white/70">
                Executive Overview
              </p>
              <h1 className="mt-3 text-4xl font-semibold leading-tight">
                Performance Dashboard
              </h1>
              <p className="mt-3 text-white/80 text-lg">{timeframeLabel}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <div className="rounded-2xl bg-white/15 px-5 py-3">
                <p className="text-xs uppercase tracking-widest text-white/70">
                  New Users
                </p>
                <p className="text-2xl font-semibold">
                  {formatNumber(data?.users?.new_in_range)}
                </p>
              </div>
              <div className="rounded-2xl bg-white/15 px-5 py-3">
                <p className="text-xs uppercase tracking-widest text-white/70">
                  New Subscriptions
                </p>
                <p className="text-2xl font-semibold">
                  {formatNumber(data?.subscriptions?.new_in_range)}
                </p>
              </div>
              <div className="rounded-2xl bg-white/15 px-5 py-3">
                <p className="text-xs uppercase tracking-widest text-white/70">
                  New Plans
                </p>
                <p className="text-2xl font-semibold">
                  {formatNumber(data?.plans?.new_in_range)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <TabContainer
          data={tabItems}
          activeTab={activeTab}
          onClick={(item) => setActiveTab(String(item.id))}
        >
          <Tab id="overview">{renderOverviewTab()}</Tab>
          <Tab id="audience">{renderAudienceTab()}</Tab>
          <Tab id="content">{renderContentTab()}</Tab>
          <Tab id="operations">{renderOperationsTab()}</Tab>
        </TabContainer>
      </div>
    </div>
  )
}
