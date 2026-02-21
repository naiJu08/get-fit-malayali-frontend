import { useMemo } from 'react'
import { DashboardResponse } from './types'
import {
  fmt,
  fmtCurrency,
  fmtPct,
  DonutChart,
  ProgressRing,
  StatCard,
  Card,
  LegendRow,
} from './dashboard-helpers'

const COLORS = [
  '#667eea',
  '#48bb78',
  '#f6ad55',
  '#fc8181',
  '#4299e1',
  '#9f7aea',
  '#38b2ac',
  '#ed8936',
]

type Props = { data?: DashboardResponse }

// ── KPI Banner ─────────────────────────────────────────────────────────────────
export function KPIBanner({ data }: Props) {
  const cards = useMemo(
    () => [
      {
        title: 'Total Users',
        value: fmt(data?.users?.total),
        sub: `${fmt(data?.users?.active)} active • ${fmt(data?.users?.new_in_range)} new`,
        gradient: 'linear-gradient(135deg,#667eea,#764ba2)',
        icon: '👥',
        badge: `+${data?.users?.new_in_range ?? 0} this period`,
      },
      {
        title: 'Subscriptions',
        value: fmt(data?.subscriptions?.total),
        sub: `${fmt(data?.subscriptions?.active_now)} active • ${fmt(data?.subscriptions?.paused_now)} paused`,
        gradient: 'linear-gradient(135deg,#06b6d4,#3b82f6)',
        icon: '📋',
        badge: `${fmt(data?.subscriptions?.new_in_range)} new`,
      },
      {
        title: 'Active Revenue',
        value: fmtCurrency(data?.subscriptions?.revenue?.active_total_fees),
        sub: `${fmtCurrency(data?.subscriptions?.revenue?.created_in_range_total_fees)} created in period`,
        gradient: 'linear-gradient(135deg,#48bb78,#38b2ac)',
        icon: '💰',
        badge: 'Live portfolio',
      },
      {
        title: 'Plans Library',
        value: fmt(data?.plans?.total),
        sub: `${fmt(data?.plans?.active)} active • ${fmt(data?.plans?.new_in_range)} new`,
        gradient: 'linear-gradient(135deg,#f6ad55,#ed8936)',
        icon: '📊',
        badge: `${fmt(data?.plans?.new_in_range)} added`,
      },
      {
        title: 'Workouts',
        value: fmt(data?.workouts?.total),
        sub: `${fmt(data?.workouts?.with_video)} with video • ⭐ ${data?.workouts?.average_rating_overall ?? '--'}`,
        gradient: 'linear-gradient(135deg,#fc8181,#f56565)',
        icon: '🏋️',
        badge: `Avg ${data?.workouts?.average_rating_overall ?? '--'} rating`,
      },
      {
        title: 'Meditation',
        value: fmt(data?.meditations?.total_meditations),
        sub: `${fmtPct(data?.meditations?.completion_rate)} completion • ${fmt(data?.meditations?.unique_users)} users`,
        gradient: 'linear-gradient(135deg,#9f7aea,#667eea)',
        icon: '🧘',
        badge: `${fmt(data?.meditations?.total_completions)} completions`,
      },
      {
        title: 'Yoga Exercises',
        value: fmt(data?.yoga?.total_yoga_exercises),
        sub: `${fmt(data?.yoga?.total_completions)} completions • ${fmt(data?.yoga?.unique_users)} users`,
        gradient: 'linear-gradient(135deg,#38b2ac,#4299e1)',
        icon: '🧘‍♀️',
        badge: `Avg ${data?.yoga?.avg_duration ?? '--'} min`,
      },
      {
        title: 'Notifications',
        value: fmt(data?.notifications?.total),
        sub: `${fmt(data?.notifications?.unread)} unread • ${fmt(data?.notifications?.delivered)} delivered`,
        gradient: 'linear-gradient(135deg,#ed8936,#ecc94b)',
        icon: '🔔',
        badge: `${data?.notifications?.unread ?? 0} unread`,
      },
    ],
    [data]
  )

  return (
    <div className="db-kpi-grid">
      {cards.map((c, i) => (
        <StatCard key={i} {...c} />
      ))}
    </div>
  )
}

// ── Engagement Chart ───────────────────────────────────────────────────────────
export function EngagementChart({ data }: Props) {
  const days = data?.engagement?.engagement_by_day ?? []
  const labels = days.map((d) => (d.date ?? '').slice(5))
  const activeVals = days.map((d) => d.active_users ?? 0)
  const compVals = days.map((d) => d.completions ?? 0)
  const maxActive = Math.max(...activeVals, 1)
  const maxComp = Math.max(...compVals, 1)

  return (
    <Card title="Engagement Over Time" icon="📈" className="db-col-2">
      <div className="mb-3 flex items-center gap-4 text-xs">
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block w-3 h-0.5 rounded"
            style={{ background: '#667eea' }}
          />
          Active Users
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block w-3 h-0.5 rounded"
            style={{ background: '#48bb78' }}
          />
          Completions
        </span>
      </div>
      {days.length ? (
        <div className="overflow-x-auto">
          <div style={{ minWidth: 600 }}>
            <svg
              width="100%"
              height={160}
              viewBox={`0 0 ${Math.max(days.length * 18, 600)} 160`}
              preserveAspectRatio="none"
            >
              {activeVals.map((v, i) => {
                const x = (i / (activeVals.length - 1)) * 100
                const y = 140 - (v / maxActive) * 120
                return i === 0 ? null : (
                  <line
                    key={i}
                    x1={`${((i - 1) / (activeVals.length - 1)) * 100}%`}
                    y1={140 - (activeVals[i - 1] / maxActive) * 120}
                    x2={`${x}%`}
                    y2={y}
                    stroke="#667eea"
                    strokeWidth={2}
                    strokeLinecap="round"
                  />
                )
              })}
              {compVals.map((v, i) => {
                const x = (i / (compVals.length - 1)) * 100
                const y = 140 - (v / maxComp) * 120
                return i === 0 ? null : (
                  <line
                    key={i}
                    x1={`${((i - 1) / (compVals.length - 1)) * 100}%`}
                    y1={140 - (compVals[i - 1] / maxComp) * 120}
                    x2={`${x}%`}
                    y2={y}
                    stroke="#48bb78"
                    strokeWidth={2}
                    strokeLinecap="round"
                  />
                )
              })}
              {activeVals.map((v, i) => (
                <circle
                  key={i}
                  cx={`${(i / (activeVals.length - 1)) * 100}%`}
                  cy={140 - (v / maxActive) * 120}
                  r={3}
                  fill="#667eea"
                />
              ))}
            </svg>
            <div className="flex justify-between mt-1">
              {labels
                .filter((_, i) => i % 5 === 0)
                .map((l, i) => (
                  <span key={i} className="text-[9px] text-gray-400">
                    {l}
                  </span>
                ))}
            </div>
          </div>
        </div>
      ) : (
        <p className="text-sm text-gray-400">No engagement data</p>
      )}
    </Card>
  )
}

// ── Subscription Status Donut ──────────────────────────────────────────────────
export function SubsStatusCard({ data }: Props) {
  const entries = Object.entries(data?.subscriptions?.by_status ?? {})
  const total = entries.reduce((s, [, v]) => s + Number(v), 0) || 1
  const slices = entries.map(([l, v], i) => ({
    label: l,
    value: Number(v),
    color: COLORS[i % COLORS.length],
  }))

  return (
    <Card title="Subscription Status" icon="📋">
      <div className="flex items-center gap-4">
        <DonutChart
          slices={slices}
          size={120}
          stroke={22}
          center={
            <>
              <p className="text-lg font-bold text-gray-900">
                {fmt(data?.subscriptions?.total)}
              </p>
              <p className="text-[10px] text-gray-500">Total</p>
            </>
          }
        />
        <div className="flex-1 space-y-2">
          {slices.map((sl, i) => (
            <LegendRow
              key={i}
              label={sl.label}
              value={sl.value}
              pct={(sl.value / total) * 100}
              color={sl.color}
            />
          ))}
        </div>
      </div>
    </Card>
  )
}

// ── User Role Donut ────────────────────────────────────────────────────────────
export function UserRoleCard({ data }: Props) {
  const entries = Object.entries(data?.users?.by_role ?? {})
  const total = entries.reduce((s, [, v]) => s + Number(v), 0) || 1
  const slices = entries.map(([l, v], i) => ({
    label: l,
    value: Number(v),
    color: COLORS[i % COLORS.length],
  }))

  return (
    <Card title="User Roles" icon="👥">
      <div className="flex items-center gap-4">
        <DonutChart
          slices={slices}
          size={120}
          stroke={22}
          center={
            <>
              <p className="text-lg font-bold text-gray-900">
                {fmt(data?.users?.total)}
              </p>
              <p className="text-[10px] text-gray-500">Users</p>
            </>
          }
        />
        <div className="flex-1 space-y-2">
          {slices.map((sl, i) => (
            <LegendRow
              key={i}
              label={sl.label}
              value={sl.value}
              pct={(sl.value / total) * 100}
              color={sl.color}
            />
          ))}
          <div className="mt-2 pt-2 border-t border-gray-100 grid grid-cols-3 gap-1 text-center">
            <div>
              <p className="text-[10px] text-gray-500">Active</p>
              <p className="text-sm font-bold text-emerald-600">
                {fmt(data?.users?.active)}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-gray-500">Suspended</p>
              <p className="text-sm font-bold text-amber-600">
                {fmt(data?.users?.suspended)}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-gray-500">Inactive</p>
              <p className="text-sm font-bold text-red-500">
                {fmt(data?.users?.deactivated)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}

// ── Plan Popularity ────────────────────────────────────────────────────────────
export function PlanPopularityCard({ data }: Props) {
  const plans = data?.subscriptions?.subscribers_by_plan ?? []
  const max = Math.max(...plans.map((p) => p.subscribers ?? 0), 1)
  return (
    <Card title="Plan Popularity" icon="🏆" className="db-col-2">
      <div className="space-y-2">
        {plans.slice(0, 8).map((p, i) => (
          <div key={p.plan_id} className="flex items-center gap-3">
            <span className="text-xs font-bold text-gray-400 w-4">{i + 1}</span>
            <div className="flex-1">
              <div className="flex justify-between text-xs mb-0.5">
                <span className="font-medium text-gray-700 truncate max-w-[160px]">
                  {p.plan_name}
                </span>
                <span className="font-bold text-gray-900">{p.subscribers}</span>
              </div>
              <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${((p.subscribers ?? 0) / max) * 100}%`,
                    background: COLORS[i % COLORS.length],
                  }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

// ── Workout Intensity ──────────────────────────────────────────────────────────
export function WorkoutIntensityCard({ data }: Props) {
  const entries = Object.entries(data?.workouts?.by_intensity ?? {})
  const total = entries.reduce((s, [, v]) => s + Number(v), 0) || 1
  return (
    <Card title="Workout Intensity Mix" icon="🏋️">
      <div className="space-y-3">
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="text-2xl font-bold text-gray-900">
              {fmt(data?.workouts?.total)}
            </p>
            <p className="text-xs text-gray-500">Total workouts</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-amber-600">
              ⭐ {data?.workouts?.average_rating_overall ?? '--'}
            </p>
            <p className="text-xs text-gray-500">Avg rating</p>
          </div>
        </div>
        {entries.map(([label, val], i) => {
          const v = Number(val)
          const pct = (v / total) * 100
          return (
            <LegendRow
              key={label}
              label={label}
              value={v}
              pct={pct}
              color={COLORS[i % COLORS.length]}
            />
          )
        })}
      </div>
    </Card>
  )
}

// ── Completion Analytics ───────────────────────────────────────────────────────
export function CompletionCard({ data }: Props) {
  const ca = data?.completion_analytics
  const rings = [
    {
      label: 'Workout',
      pct: ca?.workout_completion_rates?.completion_percentage ?? 0,
      color: '#667eea',
    },
    {
      label: 'Meditation',
      pct: ca?.meditation_completion_rates?.completion_percentage ?? 0,
      color: '#9f7aea',
    },
    {
      label: 'Diet',
      pct: ca?.diet_completion_rates?.completion_percentage ?? 0,
      color: '#48bb78',
    },
  ]
  const weekly = Object.entries(ca?.weekly_completion_trends ?? {})

  return (
    <Card title="Completion Analytics" icon="🎯" className="db-col-2">
      <div className="grid grid-cols-2 gap-4">
        <div className="flex justify-around items-center">
          {rings.map((r) => (
            <div key={r.label} className="flex flex-col items-center gap-1">
              <ProgressRing pct={r.pct} size={72} stroke={7} color={r.color}>
                <span className="text-xs font-bold" style={{ color: r.color }}>
                  {r.pct.toFixed(0)}%
                </span>
              </ProgressRing>
              <p className="text-[10px] text-gray-500">{r.label}</p>
            </div>
          ))}
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-600 mb-2">
            Weekly Trends
          </p>
          {weekly.map(([week, val]) => (
            <div
              key={week}
              className="flex items-center justify-between text-xs mb-1.5"
            >
              <span className="text-gray-500 capitalize">
                {week.replace('_', ' ')}
              </span>
              <div className="flex-1 mx-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-indigo-500"
                  style={{ width: `${val.completion_rate ?? 0}%` }}
                />
              </div>
              <span className="font-bold text-gray-700">
                {val.completion_rate}%
              </span>
            </div>
          ))}
          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-xs font-semibold text-gray-600 mb-2">
              Time of Day
            </p>
            {Object.entries(ca?.completion_by_time_of_day ?? {}).map(
              ([t, v]) => (
                <div
                  key={t}
                  className="flex items-center justify-between text-xs mb-1"
                >
                  <span className="text-gray-500 capitalize">{t}</span>
                  <span className="font-bold text-gray-700">{v}%</span>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}

// ── Health Analytics ───────────────────────────────────────────────────────────
export function HealthCard({ data }: Props) {
  const ha = data?.health_analytics
  const dist = ha?.health_score_distribution
  const distEntries = dist
    ? [
        { l: 'Excellent', v: dist.excellent ?? 0, c: '#48bb78' },
        { l: 'Good', v: dist.good ?? 0, c: '#667eea' },
        { l: 'Fair', v: dist.fair ?? 0, c: '#f6ad55' },
        { l: 'Poor', v: dist.poor ?? 0, c: '#fc8181' },
      ]
    : []
  const totalDist = distEntries.reduce((s, x) => s + x.v, 0) || 1

  return (
    <Card title="Health Analytics" icon="❤️" className="db-col-2">
      <div className="grid grid-cols-2 gap-6">
        <div>
          <p className="text-xs font-semibold text-gray-600 mb-3">
            Health Score Distribution
          </p>
          <div className="flex items-center gap-3">
            <DonutChart
              slices={distEntries.map((e) => ({
                label: e.l,
                value: e.v,
                color: e.c,
              }))}
              size={100}
              stroke={18}
              center={
                <p className="text-sm font-bold text-gray-900">{totalDist}</p>
              }
            />
            <div className="space-y-1.5 flex-1">
              {distEntries.map((e) => (
                <LegendRow
                  key={e.l}
                  label={e.l}
                  value={e.v}
                  pct={(e.v / totalDist) * 100}
                  color={e.c}
                />
              ))}
            </div>
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-600 mb-2">
            Weight Trends
          </p>
          {ha?.weight_trends && (
            <div className="space-y-1.5">
              {[
                {
                  l: 'Improving',
                  v: ha.weight_trends.improving ?? 0,
                  c: '#48bb78',
                },
                { l: 'Stable', v: ha.weight_trends.stable ?? 0, c: '#667eea' },
                {
                  l: 'Declining',
                  v: ha.weight_trends.declining ?? 0,
                  c: '#fc8181',
                },
              ].map((e) => (
                <LegendRow
                  key={e.l}
                  label={e.l}
                  value={`${e.v}%`}
                  color={e.c}
                />
              ))}
            </div>
          )}
          <p className="text-xs font-semibold text-gray-600 mt-3 mb-2">
            At-Risk Users
          </p>
          <div className="space-y-1.5">
            {(ha?.users_at_risk ?? []).slice(0, 3).map((u) => (
              <div
                key={u.id}
                className="flex items-center justify-between p-2 rounded-lg bg-red-50"
              >
                <div>
                  <p className="text-xs font-medium text-gray-800">{u.name}</p>
                  <p className="text-[10px] text-gray-500">
                    {(u.risk_factors ?? []).join(', ')}
                  </p>
                </div>
                <span className="text-xs font-bold text-red-500">
                  {u.risk_score}
                </span>
              </div>
            ))}
          </div>
          {ha?.improvement_metrics && (
            <div className="mt-3 p-2 rounded-lg bg-emerald-50">
              <p className="text-xs font-medium text-emerald-800">
                🏆 {ha.improvement_metrics.most_improved_area}
              </p>
              <p className="text-[10px] text-emerald-600">
                {ha.improvement_metrics.users_improved} users improved · avg{' '}
                {ha.improvement_metrics.avg_improvement_percentage}%
              </p>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}

// ── Vitals Card ────────────────────────────────────────────────────────────────
export function VitalsCard({ data }: Props) {
  const v = data?.vitals
  const vitals = [
    {
      label: 'Heart Rate',
      value: `${v?.heart_rate_analytics?.avg ?? '--'} bpm`,
      normal: v?.heart_rate_analytics?.normal_percentage,
      icon: '❤️',
      color: '#fc8181',
    },
    {
      label: 'Blood Sugar',
      value: `${v?.sugar_analytics?.avg ?? '--'} mg/dL`,
      normal: v?.sugar_analytics?.normal_percentage,
      icon: '🩸',
      color: '#f6ad55',
    },
    {
      label: 'Sleep',
      value: `${v?.sleep_analytics?.avg_hours ?? '--'} hrs`,
      normal: v?.sleep_analytics?.adequate_percentage,
      icon: '😴',
      color: '#9f7aea',
    },
    {
      label: 'Water Intake',
      value: `${v?.water_analytics?.avg_intake ?? '--'} L`,
      normal: v?.water_analytics?.adequate_percentage,
      icon: '💧',
      color: '#4299e1',
    },
    {
      label: 'Steps',
      value: fmt(v?.steps_analytics?.avg_steps),
      icon: '👟',
      color: '#48bb78',
    },
  ]
  return (
    <Card title="Vitals Overview" icon="📊">
      <div className="space-y-3">
        {vitals.map((vt) => (
          <div key={vt.label} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span>{vt.icon}</span>
              <div>
                <p className="text-xs font-medium text-gray-700">{vt.label}</p>
                <p className="text-sm font-bold text-gray-900">{vt.value}</p>
              </div>
            </div>
            {vt.normal !== undefined && (
              <div className="text-right">
                <p className="text-xs text-gray-500">Normal</p>
                <p className="text-sm font-bold" style={{ color: vt.color }}>
                  {fmtPct(vt.normal)}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  )
}

// ── Body Measurements ──────────────────────────────────────────────────────────
export function BodyMeasurementsCard({ data }: Props) {
  const bm = data?.body_measurements
  const bmi = bm?.bmi_analytics
  const bmiCats = bmi?.categories
  const bmiEntries = bmiCats
    ? [
        { l: 'Underweight', v: bmiCats.underweight ?? 0, c: '#4299e1' },
        { l: 'Normal', v: bmiCats.normal ?? 0, c: '#48bb78' },
        { l: 'Overweight', v: bmiCats.overweight ?? 0, c: '#f6ad55' },
        { l: 'Obese', v: bmiCats.obese ?? 0, c: '#fc8181' },
      ]
    : []
  const om = bm?.other_measurements
  return (
    <Card title="Body Measurements" icon="💪">
      <div className="space-y-2">
        <div className="grid grid-cols-3 gap-2 text-center mb-3">
          <div className="p-2 rounded-lg bg-blue-50">
            <p className="text-[10px] text-gray-500">Avg Weight</p>
            <p className="text-sm font-bold text-blue-700">
              {bm?.weight_analytics?.avg_weight ?? '--'} kg
            </p>
          </div>
          <div className="p-2 rounded-lg bg-purple-50">
            <p className="text-[10px] text-gray-500">Avg BMI</p>
            <p className="text-sm font-bold text-purple-700">
              {bm?.bmi_analytics?.avg_bmi ?? '--'}
            </p>
          </div>
          <div className="p-2 rounded-lg bg-green-50">
            <p className="text-[10px] text-gray-500">Users</p>
            <p className="text-sm font-bold text-green-700">
              {bm?.unique_users_measured ?? '--'}
            </p>
          </div>
        </div>
        <p className="text-xs font-semibold text-gray-600">BMI Distribution</p>
        {bmiEntries.map((e) => (
          <LegendRow key={e.l} label={e.l} value={e.v} color={e.c} />
        ))}
        {om && (
          <>
            <p className="text-xs font-semibold text-gray-600 mt-2 pt-2 border-t border-gray-100">
              Avg Measurements (cm)
            </p>
            <div className="grid grid-cols-2 gap-1 text-xs">
              {[
                ['Chest', om.chest_avg],
                ['Waist', om.waist_avg],
                ['Hip', om.hip_avg],
                ['Arm', om.arm_avg],
                ['Thigh', om.thigh_avg],
              ].map(([l, v]) => (
                <div key={String(l)} className="flex justify-between py-0.5">
                  <span className="text-gray-500">{l}</span>
                  <span className="font-semibold text-gray-800">
                    {v ?? '--'}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </Card>
  )
}

// ── User Behavior ──────────────────────────────────────────────────────────────
export function UserBehaviorCard({ data }: Props) {
  const ub = data?.user_behavior
  const ap = ub?.user_activity_patterns
  const pwt = ub?.preferred_workout_times
  const dp = ub?.drop_off_points
  return (
    <Card title="User Behavior" icon="📱">
      <div className="space-y-3">
        {ap && (
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2 rounded-lg bg-indigo-50 text-center">
              <p className="text-[10px] text-gray-500">Most Active</p>
              <p className="text-sm font-bold text-indigo-700">
                {ap.most_active_day}
              </p>
            </div>
            <div className="p-2 rounded-lg bg-gray-50 text-center">
              <p className="text-[10px] text-gray-500">Peak Hour</p>
              <p className="text-sm font-bold text-gray-700">
                {ap.peak_activity_hour}:00
              </p>
            </div>
            <div className="p-2 rounded-lg bg-green-50 text-center">
              <p className="text-[10px] text-gray-500">Avg Sessions</p>
              <p className="text-sm font-bold text-green-700">
                {ap.avg_sessions_per_user}/user
              </p>
            </div>
            <div className="p-2 rounded-lg bg-red-50 text-center">
              <p className="text-[10px] text-gray-500">Least Active</p>
              <p className="text-sm font-bold text-red-700">
                {ap.least_active_day}
              </p>
            </div>
          </div>
        )}
        {pwt && (
          <>
            <p className="text-xs font-semibold text-gray-600">
              Preferred Workout Time
            </p>
            {(['morning', 'afternoon', 'evening'] as const).map((t) => (
              <div
                key={t}
                className="flex items-center justify-between text-xs"
              >
                <span className="capitalize text-gray-500">{t}</span>
                <div className="flex-1 mx-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-indigo-400"
                    style={{ width: `${pwt[t] ?? 0}%` }}
                  />
                </div>
                <span className="font-bold text-gray-700">{pwt[t]}%</span>
              </div>
            ))}
          </>
        )}
        {dp && (
          <div className="pt-2 border-t border-gray-100">
            <p className="text-xs font-semibold text-gray-600 mb-1.5">
              Drop-off Points
            </p>
            <div className="flex gap-2">
              <div className="flex-1 p-2 rounded-lg bg-orange-50 text-center">
                <p className="text-[10px] text-gray-500">Week 2</p>
                <p className="text-sm font-bold text-orange-600">
                  {dp.week_2_dropoff}%
                </p>
              </div>
              <div className="flex-1 p-2 rounded-lg bg-red-50 text-center">
                <p className="text-[10px] text-gray-500">Month 1</p>
                <p className="text-sm font-bold text-red-600">
                  {dp.month_1_dropoff}%
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}

// ── Most Active Users ──────────────────────────────────────────────────────────
export function ActiveUsersCard({ data }: Props) {
  const users = data?.engagement?.most_active_users ?? []
  const max = Math.max(...users.map((u) => u.activity_score ?? 0), 1)
  return (
    <Card title="Most Active Users" icon="🏅" className="db-col-2">
      <div className="space-y-2">
        {users.map((u, i) => (
          <div key={u.id} className="flex items-center gap-3">
            <div
              className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
              style={{
                background:
                  i < 3 ? ['#f6ad55', '#a0aec0', '#c05621'][i] : '#e2e8f0',
                color: i < 3 ? 'white' : '#718096',
              }}
            >
              {i + 1}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between text-xs mb-0.5">
                <span className="font-medium text-gray-800 truncate">
                  {u.name}
                </span>
                <span className="font-bold text-indigo-600 ml-2">
                  {u.activity_score}
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${((u.activity_score ?? 0) / max) * 100}%`,
                    background: COLORS[i % COLORS.length],
                  }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

// ── Content Performance ────────────────────────────────────────────────────────
export function ContentPerformanceCard({ data }: Props) {
  const cp = data?.content_performance
  const ef = cp?.content_effectiveness
  const efEntries = ef
    ? [
        { l: 'Highly Effective', v: ef.highly_effective ?? 0, c: '#48bb78' },
        {
          l: 'Moderately Effective',
          v: ef.moderately_effective ?? 0,
          c: '#f6ad55',
        },
        { l: 'Needs Improvement', v: ef.needs_improvement ?? 0, c: '#fc8181' },
      ]
    : []
  return (
    <Card title="Content Performance" icon="🎬" className="db-col-2">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs font-semibold text-gray-600 mb-2">
            Content Effectiveness
          </p>
          {efEntries.map((e) => (
            <LegendRow key={e.l} label={e.l} value={e.v} color={e.c} />
          ))}
          <div className="mt-3 space-y-2">
            {[
              {
                l: 'Workout Satisfaction',
                v: cp?.workout_performance?.user_satisfaction,
              },
              {
                l: 'Meditation Satisfaction',
                v: cp?.meditation_performance?.user_satisfaction,
              },
              {
                l: 'Diet Satisfaction',
                v: cp?.diet_plan_performance?.user_satisfaction,
              },
            ].map((s) => (
              <div
                key={s.l}
                className="flex items-center justify-between text-xs"
              >
                <span className="text-gray-500">{s.l}</span>
                <div className="flex items-center gap-1">
                  {'⭐'.repeat(Math.round(s.v ?? 0))}
                  <span className="font-bold text-gray-700 ml-1">
                    {s.v ?? '--'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-600 mb-2">
            Underperforming Content
          </p>
          <div className="space-y-2">
            {(cp?.underperforming_content ?? []).map((c) => (
              <div
                key={c.id}
                className="p-2 rounded-lg bg-red-50 border border-red-100"
              >
                <p className="text-xs font-medium text-gray-800">{c.title}</p>
                <div className="flex justify-between mt-0.5">
                  <span className="text-[10px] text-red-500">{c.issue}</span>
                  <span className="text-[10px] font-bold text-red-600">
                    {c.completion_rate}%
                  </span>
                </div>
              </div>
            ))}
          </div>
          {cp?.workout_performance?.top_performing_categories && (
            <div className="mt-3">
              <p className="text-xs font-semibold text-gray-600 mb-1">
                Top Categories
              </p>
              <div className="flex flex-wrap gap-1">
                {cp.workout_performance.top_performing_categories.map((c) => (
                  <span
                    key={c}
                    className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-medium"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}

// ── Streaks & Notifications ────────────────────────────────────────────────────
export function StreaksCard({ data }: Props) {
  const st = data?.engagement?.user_streaks
  const notifTypes = Object.entries(data?.notifications?.by_type ?? {})
  const notifTotal = notifTypes.reduce((s, [, v]) => s + Number(v), 0) || 1
  return (
    <Card title="Streaks & Notifications" icon="🔥">
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div className="p-3 rounded-xl bg-gradient-to-br from-orange-400 to-red-500 text-white text-center">
            <p className="text-[10px] font-medium opacity-80">
              Workout Max Streak
            </p>
            <p className="text-xl font-bold">
              {st?.workout?.max_streak ?? '--'} 🔥
            </p>
            <p className="text-[10px] opacity-70">
              {st?.workout?.users_with_streaks} users active
            </p>
          </div>
          <div className="p-3 rounded-xl bg-gradient-to-br from-purple-400 to-indigo-500 text-white text-center">
            <p className="text-[10px] font-medium opacity-80">
              Meditation Max Streak
            </p>
            <p className="text-xl font-bold">
              {st?.meditation?.max_streak ?? '--'} 🧘
            </p>
            <p className="text-[10px] opacity-70">
              {st?.meditation?.users_with_streaks} users active
            </p>
          </div>
        </div>
        <p className="text-xs font-semibold text-gray-600 mt-2">
          Notification Types
        </p>
        {notifTypes.map(([type, val], i) => (
          <LegendRow
            key={type}
            label={type.replace(/_/g, ' ')}
            value={Number(val)}
            pct={(Number(val) / notifTotal) * 100}
            color={COLORS[i % COLORS.length]}
          />
        ))}
        <div className="flex justify-between text-xs pt-2 border-t border-gray-100">
          <span className="text-gray-500">Unread</span>
          <span className="font-bold text-amber-600">
            {data?.notifications?.unread ?? '--'}
          </span>
        </div>
      </div>
    </Card>
  )
}

// ── Diet Analytics ─────────────────────────────────────────────────────────────
export function DietCard({ data }: Props) {
  const diet = data?.diet
  const mv = diet?.mandatory_vs_optional ?? {}
  return (
    <Card title="Diet Analytics" icon="🥗">
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2 text-center">
          <div className="p-2 rounded-lg bg-green-50">
            <p className="text-[10px] text-gray-500">Total Meals</p>
            <p className="text-lg font-bold text-green-700">
              {fmt(diet?.total_meals)}
            </p>
          </div>
          <div className="p-2 rounded-lg bg-blue-50">
            <p className="text-[10px] text-gray-500">Completions</p>
            <p className="text-lg font-bold text-blue-700">
              {fmt(diet?.total_completions)}
            </p>
          </div>
          <div className="p-2 rounded-lg bg-purple-50">
            <p className="text-[10px] text-gray-500">Avg Calories</p>
            <p className="text-lg font-bold text-purple-700">
              {diet?.calorie_analytics?.avg_per_completion ?? '--'}
            </p>
          </div>
          <div className="p-2 rounded-lg bg-orange-50">
            <p className="text-[10px] text-gray-500">Unique Users</p>
            <p className="text-lg font-bold text-orange-700">
              {fmt(diet?.unique_users)}
            </p>
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-600 mb-1">
            Mandatory vs Optional
          </p>
          {Object.entries(mv).map(([k, v]) => (
            <div key={k} className="flex justify-between text-xs py-0.5">
              <span className="capitalize text-gray-500">{k}</span>
              <span className="font-bold text-gray-800">{v}</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}

// ── Freezes & Interests ────────────────────────────────────────────────────────
export function FreezesCard({ data }: Props) {
  return (
    <Card title="Freezes & Interests" icon="❄️">
      <div className="space-y-3">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2 rounded-lg bg-blue-50">
            <p className="text-[10px] text-gray-500">Total Freezes</p>
            <p className="text-base font-bold text-blue-700">
              {fmt(data?.freezes?.total)}
            </p>
          </div>
          <div className="p-2 rounded-lg bg-indigo-50">
            <p className="text-[10px] text-gray-500">Active</p>
            <p className="text-base font-bold text-indigo-700">
              {fmt(data?.freezes?.active_now)}
            </p>
          </div>
          <div className="p-2 rounded-lg bg-cyan-50">
            <p className="text-[10px] text-gray-500">New</p>
            <p className="text-base font-bold text-cyan-700">
              {fmt(data?.freezes?.new_in_range)}
            </p>
          </div>
        </div>
        <div className="pt-2 border-t border-gray-100">
          <p className="text-xs font-semibold text-gray-600 mb-2">
            Interest Signals
          </p>
          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="p-2 rounded-lg bg-emerald-50">
              <p className="text-[10px] text-gray-500">Total Interests</p>
              <p className="text-base font-bold text-emerald-700">
                {fmt(data?.interests?.total)}
              </p>
            </div>
            <div className="p-2 rounded-lg bg-teal-50">
              <p className="text-[10px] text-gray-500">New</p>
              <p className="text-base font-bold text-teal-700">
                {fmt(data?.interests?.new_in_range)}
              </p>
            </div>
          </div>
        </div>
        <div className="pt-2 border-t border-gray-100">
          <p className="text-xs font-semibold text-gray-600 mb-2">
            User-Specific Subscriptions
          </p>
          <div className="space-y-1">
            {[
              {
                l: 'Workout Subs',
                v: data?.subscriptions?.user_specific_content
                  ?.workout_subscriptions,
              },
              {
                l: 'Yoga Subs',
                v: data?.subscriptions?.user_specific_content
                  ?.yoga_subscriptions,
              },
              {
                l: 'Meditation Subs',
                v: data?.subscriptions?.user_specific_content
                  ?.meditation_subscriptions,
              },
            ].map((s) => (
              <div key={s.l} className="flex justify-between text-xs">
                <span className="text-gray-500">{s.l}</span>
                <span className="font-bold text-gray-800">{fmt(s.v)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  )
}

// ── Plan Categories ────────────────────────────────────────────────────────────
export function PlanCategoriesCard({ data }: Props) {
  const entries = Object.entries(data?.plans?.by_category ?? {})
  const total = entries.reduce((s, [, v]) => s + Number(v), 0) || 1
  return (
    <Card title="Plan Categories" icon="📋">
      <div className="space-y-2">
        {entries.map(([cat, val], i) => {
          const v = Number(val)
          return (
            <LegendRow
              key={cat}
              label={cat}
              value={v}
              pct={(v / total) * 100}
              color={COLORS[i % COLORS.length]}
            />
          )
        })}
        <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-2 gap-2 text-center">
          <div className="p-2 rounded-lg bg-indigo-50">
            <p className="text-[10px] text-gray-500">Total Plans</p>
            <p className="text-lg font-bold text-indigo-700">
              {fmt(data?.plans?.total)}
            </p>
          </div>
          <div className="p-2 rounded-lg bg-green-50">
            <p className="text-[10px] text-gray-500">Active Plans</p>
            <p className="text-lg font-bold text-green-700">
              {fmt(data?.plans?.active)}
            </p>
          </div>
        </div>
      </div>
    </Card>
  )
}

// ── Feedbacks ──────────────────────────────────────────────────────────────────
export function FeedbacksCard({ data }: Props) {
  const ratings = Object.entries(data?.feedbacks?.by_rating ?? {}).sort(
    (a, b) => Number(b[0]) - Number(a[0])
  )
  const total = ratings.reduce((s, [, v]) => s + Number(v), 0) || 1
  return (
    <Card title="Customer Feedback" icon="⭐">
      <div className="space-y-2">
        <div className="flex items-center gap-4 mb-3">
          <div className="text-center">
            <p className="text-3xl font-bold text-gray-900">
              {fmt(data?.feedbacks?.total)}
            </p>
            <p className="text-xs text-gray-500">Total Reviews</p>
          </div>
          <DonutChart
            slices={ratings.map(([r, v], i) => ({
              label: `${r}★`,
              value: Number(v),
              color: COLORS[i % COLORS.length],
            }))}
            size={80}
            stroke={16}
            center={
              <span className="text-xs font-bold text-gray-700">Ratings</span>
            }
          />
        </div>
        {ratings.map(([r, v], i) => (
          <LegendRow
            key={r}
            label={`${r} Stars`}
            value={Number(v)}
            pct={(Number(v) / total) * 100}
            color={COLORS[i % COLORS.length]}
          />
        ))}
        <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-3 gap-2 text-center text-xs">
          <div>
            <p className="text-gray-500">Workouts</p>
            <p className="font-bold text-gray-900">
              {fmt(data?.feedbacks?.for_workouts)}
            </p>
          </div>
          <div>
            <p className="text-gray-500">Plans</p>
            <p className="font-bold text-gray-900">
              {fmt(data?.feedbacks?.for_plans)}
            </p>
          </div>
          <div>
            <p className="text-gray-500">Recipes</p>
            <p className="font-bold text-gray-900">
              {fmt(data?.feedbacks?.for_recipes)}
            </p>
          </div>
        </div>
      </div>
    </Card>
  )
}

// ── Activity Log ───────────────────────────────────────────────────────────────
export function ActivityCard({ data }: Props) {
  const act = data?.activity
  const items = [
    { l: 'Progress Logs', v: act?.progress_logs, icon: '📝' },
    { l: 'Body Measurements', v: act?.body_measurements, icon: '📏' },
    {
      l: 'Workout Completions',
      v: act?.workout_exercise_completions,
      icon: '💪',
    },
    { l: 'Diet Completions', v: act?.diet_plan_completions, icon: '🥗' },
    { l: 'Workout Progresses', v: act?.workout_plan_progresses, icon: '📈' },
  ]
  return (
    <Card title="Activity Metrics" icon="📊">
      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.l}
            className="flex items-center justify-between p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center gap-2">
              <span>{item.icon}</span>
              <span className="text-xs font-medium text-gray-700">
                {item.l}
              </span>
            </div>
            <span className="text-sm font-bold text-gray-900">
              {fmt(item.v)}
            </span>
          </div>
        ))}
      </div>
    </Card>
  )
}
