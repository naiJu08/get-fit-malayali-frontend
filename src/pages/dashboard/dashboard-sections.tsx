import { useState } from 'react'
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
  HintTooltip,
  GrowthBadge,
  VBarChart,
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

// ── KPI Banner ────────────────────────────────────────────────────────────────
export function KPIBanner({ data }: Props) {
  const cards = [
    {
      title: 'Total Users',
      value: fmt(data?.users?.total),
      sub: `${fmt(data?.users?.by_status?.active)} active · ${fmt(data?.users?.by_role?.user)} members`,
      gradient: 'linear-gradient(135deg,#667eea,#764ba2)',
      icon: '👥',
      badge: data?.users?.new_this_month
        ? `+${data.users.new_this_month} this month`
        : undefined,
    },
    {
      title: 'Subscriptions',
      value: fmt(data?.subscriptions?.total),
      sub: `${fmt(data?.subscriptions?.active_now)} active · ${fmt(data?.subscriptions?.paused_now)} paused`,
      gradient: 'linear-gradient(135deg,#06b6d4,#3b82f6)',
      icon: '📋',
      badge: data?.subscriptions?.new_this_month
        ? `+${data.subscriptions.new_this_month} this month`
        : undefined,
    },
    {
      title: 'Active Revenue',
      value: fmtCurrency(
        data?.subscriptions?.revenue?.active_subscriptions_total_fees
      ),
      sub: `Lifetime: ${fmtCurrency(data?.subscriptions?.revenue?.lifetime_total_fees)}`,
      gradient: 'linear-gradient(135deg,#48bb78,#38b2ac)',
      icon: '💰',
      badge: 'INR',
    },
    {
      title: 'Plans Library',
      value: fmt(data?.plans?.total),
      sub: `${fmt(data?.plans?.active)} active · ${fmt(data?.plans?.inactive)} inactive`,
      gradient: 'linear-gradient(135deg,#f6ad55,#ed8936)',
      icon: '📊',
      badge: undefined,
    },
    {
      title: 'Workouts',
      value: fmt(data?.workouts?.total),
      sub: `${fmt(data?.workouts?.with_video)} with video · ${fmt(data?.workouts?.user_specific_exercises)} personalised`,
      gradient: 'linear-gradient(135deg,#fc8181,#f56565)',
      icon: '🏋️',
      badge: undefined,
    },
    {
      title: 'Meditation',
      value: fmt(data?.meditations?.total_meditations),
      sub: `${fmt(data?.meditations?.with_video)} with video · ${fmt(data?.meditations?.user_specific_meditations)} personalised`,
      gradient: 'linear-gradient(135deg,#9f7aea,#667eea)',
      icon: '🧘',
      badge: undefined,
    },
    {
      title: 'Yoga',
      value: fmt(data?.yoga?.total_yoga_items),
      sub: `${fmt(data?.yoga?.with_video)} with video · ${fmt(data?.yoga?.user_specific_yoga_exercises)} personalised`,
      gradient: 'linear-gradient(135deg,#38b2ac,#4299e1)',
      icon: '🧘‍♀️',
      badge: undefined,
    },
    {
      title: 'Notifications',
      value: fmt(data?.notifications?.total),
      sub: `${fmt(data?.notifications?.unread)} unread · ${fmt(data?.notifications?.delivered)} delivered`,
      gradient: 'linear-gradient(135deg,#ed8936,#ecc94b)',
      icon: '🔔',
      badge: `${data?.notifications?.unread ?? 0} unread`,
    },
  ]
  return (
    <div className="db-kpi-grid">
      {cards.map((c, i) => (
        <StatCard key={i} {...c} />
      ))}
    </div>
  )
}

// ── Engagement Hourly Chart ───────────────────────────────────────────────────
export function EngagementChart({ data }: Props) {
  const [metric, setMetric] = useState<'active_users' | 'total_completions'>(
    'active_users'
  )
  const [tooltipIdx, setTooltipIdx] = useState<number | null>(null)
  const hours = data?.engagement?.hourly_breakdown ?? []
  const summary = data?.engagement?.summary
  const engHints = data?.engagement?.hints ?? {}
  const vals = hours.map((h) =>
    metric === 'active_users'
      ? (h.active_users ?? 0)
      : (h.total_completions ?? 0)
  )
  const maxVal = Math.max(...vals, 1)
  const chartH = 100
  const SUMCARDS = [
    {
      label: 'Total Active',
      value: summary?.active_users_total,
      color: '#667eea',
      hk: 'active_users_total',
    },
    {
      label: 'Workout',
      value: summary?.workout_active_users,
      color: '#fc8181',
      hk: 'workout_active_users',
    },
    {
      label: 'Yoga',
      value: summary?.yoga_active_users,
      color: '#38b2ac',
      hk: 'yoga_active_users',
    },
    {
      label: 'Meditation',
      value: summary?.meditation_active_users,
      color: '#9f7aea',
      hk: 'meditation_active_users',
    },
    {
      label: 'Diet',
      value: summary?.diet_active_users,
      color: '#48bb78',
      hk: 'diet_active_users',
    },
  ]
  return (
    <Card title="Engagement — Last 24 Hours" icon="📈" className="db-col-2">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-emerald-600 font-semibold">
            🟢 Live — Last 24 Hours
          </span>
          {engHints.window && <HintTooltip text={engHints.window} />}
        </div>
        <div className="flex gap-1">
          {(['active_users', 'total_completions'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMetric(m)}
              className={`text-xs px-2 py-0.5 rounded-full transition-all ${metric === m ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
            >
              {m === 'active_users' ? 'Active Users' : 'Completions'}
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap gap-2 mb-4">
        {SUMCARDS.map((s) => (
          <div
            key={s.label}
            className="flex flex-col items-center px-3 py-1.5 rounded-xl"
            style={{
              background: s.color + '18',
              border: `1px solid ${s.color}33`,
            }}
          >
            <span className="text-base font-bold" style={{ color: s.color }}>
              {fmt(s.value)}
            </span>
            <span className="text-[10px] text-gray-500 flex items-center gap-0.5">
              {s.label}
              {engHints[s.hk] && <HintTooltip text={engHints[s.hk]} />}
            </span>
          </div>
        ))}
      </div>
      {hours.length ? (
        <div className="relative overflow-x-auto">
          <div style={{ minWidth: 400 }} className="relative">
            <svg
              width="100%"
              height={chartH + 18}
              viewBox={`0 0 ${hours.length * 20} ${chartH + 18}`}
              preserveAspectRatio="none"
            >
              {hours.map((h, i) => {
                const v = vals[i]
                const barH = Math.max(2, (v / maxVal) * chartH)
                return (
                  <g
                    key={i}
                    style={{ cursor: 'pointer' }}
                    onMouseEnter={() => setTooltipIdx(i)}
                    onMouseLeave={() => setTooltipIdx(null)}
                  >
                    <rect
                      x={i * 20 + 1}
                      y={chartH - barH}
                      width={18}
                      height={barH}
                      rx={3}
                      fill={v > 0 ? '#667eea' : '#e2e8f0'}
                      opacity={tooltipIdx === i ? 1 : 0.8}
                      style={{ transition: 'height 0.4s ease,opacity 0.2s' }}
                    />
                    {i % 4 === 0 && (
                      <text
                        x={i * 20 + 10}
                        y={chartH + 14}
                        textAnchor="middle"
                        fontSize={7}
                        fill="#9ca3af"
                      >
                        {h.hour}
                      </text>
                    )}
                  </g>
                )
              })}
            </svg>
            {tooltipIdx !== null && hours[tooltipIdx]?.hint && (
              <div className="absolute top-0 left-0 right-0 flex justify-center pointer-events-none">
                <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-1.5 z-10 max-w-xs text-center shadow-xl">
                  {hours[tooltipIdx].hint}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <p className="text-sm text-gray-400 py-6 text-center">
          No hourly data available
        </p>
      )}
    </Card>
  )
}

// ── Subscription Status Card ──────────────────────────────────────────────────
export function SubsStatusCard({ data }: Props) {
  const s = data?.subscriptions
  const hints = s?.hints ?? {}
  const byStatus = s?.by_status ?? {}
  const total = s?.total ?? 0
  const slices = Object.entries(byStatus).map(([k, v], i) => ({
    label: k,
    value: v as number,
    color: COLORS[i % COLORS.length],
  }))
  return (
    <Card title="Subscription Status" icon="📋">
      <div className="flex items-center gap-1 mb-2">
        <span className="text-[10px] text-gray-400">Status breakdown</span>
        {hints.by_status && <HintTooltip text={hints.by_status} />}
      </div>
      <div className="flex items-center gap-4">
        <DonutChart
          slices={slices}
          size={110}
          stroke={22}
          center={
            <>
              <span className="text-xl font-bold text-gray-800">
                {fmt(total)}
              </span>
              <span className="text-[10px] text-gray-400">total</span>
            </>
          }
        />
        <div className="flex-1 space-y-2">
          {slices.map((sl, i) => (
            <LegendRow
              key={i}
              label={sl.label}
              value={sl.value}
              pct={total ? Math.round((sl.value / total) * 100) : 0}
              color={sl.color}
            />
          ))}
        </div>
      </div>
      <div className="mt-3 flex gap-2 flex-wrap">
        {[
          {
            label: 'New/Month',
            value: s?.new_this_month,
            color: '#48bb78',
            hint: hints.new_this_month,
          },
          {
            label: 'Yoga Subs',
            value: s?.user_specific_content?.yoga_subscriptions,
            color: '#38b2ac',
            hint: hints.user_specific_content,
          },
          {
            label: 'Meditation Subs',
            value: s?.user_specific_content?.meditation_subscriptions,
            color: '#9f7aea',
          },
          {
            label: 'Workout Subs',
            value: s?.user_specific_content?.workout_subscriptions,
            color: '#fc8181',
          },
        ].map((b) => (
          <div
            key={b.label}
            className="rounded-lg px-2.5 py-1.5 text-center"
            style={{
              background: b.color + '15',
              border: `1px solid ${b.color}30`,
            }}
          >
            <div className="text-sm font-bold" style={{ color: b.color }}>
              {fmt(b.value)}
            </div>
            <div className="text-[10px] text-gray-500 flex items-center justify-center gap-0.5">
              {b.label}
              {b.hint && <HintTooltip text={b.hint} />}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-1">
        {[
          {
            label: 'Active Revenue',
            value: fmtCurrency(s?.revenue?.active_subscriptions_total_fees),
            hint: hints.revenue,
          },
          {
            label: 'Lifetime Revenue',
            value: fmtCurrency(s?.revenue?.lifetime_total_fees),
          },
        ].map((r, i) => (
          <div
            key={i}
            className="flex-1 rounded-lg px-2 py-1 text-center bg-emerald-50 border border-emerald-100"
          >
            <div className="text-xs font-bold text-emerald-700">{r.value}</div>
            <div className="text-[10px] text-gray-500 flex items-center justify-center gap-0.5">
              {r.label}
              {r.hint && <HintTooltip text={r.hint} />}
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

// ── User Role Card ─────────────────────────────────────────────────────────────
export function UserRoleCard({ data }: Props) {
  const u = data?.users
  const hints = u?.hints ?? {}
  const byRole = u?.by_role ?? {}
  const total = u?.total ?? 0
  const slices = Object.entries(byRole).map(([k, v], i) => ({
    label: k,
    value: v as number,
    color: COLORS[i % COLORS.length],
  }))
  const byStatus = u?.by_status ?? {}
  const statusSlices = Object.entries(byStatus).map(([k, v], i) => ({
    label: k,
    value: v as number,
    color: COLORS[(i + 4) % COLORS.length],
  }))
  return (
    <Card title="Users by Role" icon="👥">
      <div className="flex items-center gap-1 mb-2">
        <span className="text-[10px] text-gray-400">Role breakdown</span>
        {hints.by_role && <HintTooltip text={hints.by_role} />}
      </div>
      <div className="flex items-center gap-3 mb-3">
        <DonutChart
          slices={slices}
          size={100}
          stroke={20}
          center={
            <>
              <span className="text-lg font-bold text-gray-800">
                {fmt(total)}
              </span>
              <span className="text-[10px] text-gray-400">total</span>
            </>
          }
        />
        <div className="flex-1 space-y-1.5">
          {slices.map((sl, i) => (
            <LegendRow
              key={i}
              label={sl.label}
              value={sl.value}
              pct={total ? Math.round((sl.value / total) * 100) : 0}
              color={sl.color}
            />
          ))}
        </div>
      </div>
      <div className="flex items-center gap-1 mb-1">
        <span className="text-[10px] text-gray-400">Account status</span>
        {hints.by_status && <HintTooltip text={hints.by_status} />}
      </div>
      <div className="flex gap-1 mb-2">
        {statusSlices.map((sl, i) => (
          <div
            key={i}
            className="flex-1 rounded-lg px-1.5 py-1 text-center"
            style={{
              background: sl.color + '15',
              border: `1px solid ${sl.color}30`,
            }}
          >
            <div className="text-xs font-bold" style={{ color: sl.color }}>
              {fmt(sl.value)}
            </div>
            <div className="text-[10px] text-gray-500 capitalize">
              {sl.label}
            </div>
          </div>
        ))}
      </div>
      <GrowthBadge
        value={u?.new_this_month}
        label="new this month"
        hint={hints.new_this_month}
      />
    </Card>
  )
}

// ── Plan Popularity Card ──────────────────────────────────────────────────────
export function PlanPopularityCard({ data }: Props) {
  const subs = data?.subscriptions
  const hints = subs?.hints ?? {}
  const byPlan = subs?.subscribers_by_plan ?? []
  const maxSubs = Math.max(...byPlan.map((p) => p.subscribers ?? 0), 1)
  return (
    <Card title="Plan Popularity" icon="📊">
      <div className="flex items-center gap-1 mb-3">
        <span className="text-xs text-gray-500">Subscribers per plan</span>
        {hints.subscribers_by_plan && (
          <HintTooltip text={hints.subscribers_by_plan} />
        )}
      </div>
      <div className="space-y-2">
        {byPlan.slice(0, 6).map((p, i) => {
          const pct = Math.round(((p.subscribers ?? 0) / maxSubs) * 100)
          return (
            <div key={i}>
              <div className="flex items-center justify-between text-xs mb-0.5">
                <span className="text-gray-700 truncate max-w-[60%]">
                  {p.plan_name}
                </span>
                <span className="font-semibold text-gray-900">
                  {fmt(p.subscribers)}
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${pct}%`,
                    background: COLORS[i % COLORS.length],
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>
      {byPlan.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-4">No plan data</p>
      )}
    </Card>
  )
}

// ── Workout Intensity Card ────────────────────────────────────────────────────
export function WorkoutIntensityCard({ data }: Props) {
  const w = data?.workouts
  const hints = w?.hints ?? {}
  const byInt = w?.by_intensity ?? {}
  const total = Object.values(byInt).reduce((a, b) => a + (b as number), 0)
  const slices = Object.entries(byInt).map(([k, v], i) => ({
    label: k,
    value: v as number,
    color: COLORS[i % COLORS.length],
  }))
  return (
    <Card title="Workout Intensity" icon="🏋️">
      <div className="flex items-center gap-1 mb-2">
        <span className="text-[10px] text-gray-400">Intensity split</span>
        {hints.by_intensity && <HintTooltip text={hints.by_intensity} />}
      </div>
      <div className="flex items-center gap-3 mb-3">
        <DonutChart
          slices={slices}
          size={90}
          stroke={18}
          center={
            <div className="text-center">
              <span className="text-base font-bold text-gray-800">
                {fmt(w?.total)}
              </span>
              {hints.total && <HintTooltip text={hints.total} />}
            </div>
          }
        />
        <div className="flex-1 space-y-1.5">
          {slices.map((sl, i) => (
            <LegendRow
              key={i}
              label={sl.label}
              value={sl.value}
              pct={total ? Math.round((sl.value / total) * 100) : 0}
              color={sl.color}
            />
          ))}
        </div>
      </div>
      <div className="flex gap-2 flex-wrap">
        <div className="text-xs bg-violet-50 border border-violet-100 rounded-lg px-2.5 py-1.5 flex items-center gap-1">
          <span className="font-semibold text-violet-700">
            {fmt(w?.with_video)}
          </span>
          <span className="text-gray-500">with video</span>
          {hints.with_video && <HintTooltip text={hints.with_video} />}
        </div>
        <div className="text-xs bg-indigo-50 border border-indigo-100 rounded-lg px-2.5 py-1.5 flex items-center gap-1">
          <span className="font-semibold text-indigo-700">
            {fmt(w?.user_specific_exercises)}
          </span>
          <span className="text-gray-500">personalised</span>
          {hints.user_specific_exercises && (
            <HintTooltip text={hints.user_specific_exercises} />
          )}
        </div>
      </div>
    </Card>
  )
}

// ── Completion Analytics Card ─────────────────────────────────────────────────
export function CompletionCard({ data }: Props) {
  const ca = data?.completion_analytics
  const hints = ca?.hints ?? {}
  const modules = [
    {
      label: 'Workout',
      data: ca?.workout_completions,
      color: '#fc8181',
      icon: '🏋️',
    },
    { label: 'Yoga', data: ca?.yoga_completions, color: '#38b2ac', icon: '🧘‍♀️' },
    {
      label: 'Meditation',
      data: ca?.meditation_completions,
      color: '#9f7aea',
      icon: '🧘',
    },
    { label: 'Diet', data: ca?.diet_completions, color: '#48bb78', icon: '🥗' },
  ]
  const tod = ca?.completions_by_time_of_day
  return (
    <Card title="Completion Analytics" icon="✅" className="db-col-2">
      <div className="grid grid-cols-2 gap-3 mb-4">
        {modules.map((m, i) => {
          const d = m.data
          const pct = d?.completion_rate_percentage ?? 0
          const hintKey =
            m.label.toLowerCase() === 'workout'
              ? 'workout_completions'
              : m.label.toLowerCase() === 'yoga'
                ? 'yoga_completions'
                : m.label.toLowerCase() === 'meditation'
                  ? 'meditation_completions'
                  : 'diet_completions'
          return (
            <div
              key={i}
              className="rounded-xl p-3 border"
              style={{
                borderColor: m.color + '33',
                background: m.color + '0a',
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                  {m.icon} {m.label}
                  {hints[hintKey] && <HintTooltip text={hints[hintKey]} />}
                </span>
                <span className="text-xs font-bold" style={{ color: m.color }}>
                  {fmtPct(pct)}
                </span>
              </div>
              <ProgressRing pct={pct} size={60} stroke={7} color={m.color}>
                <span className="text-[10px] font-bold text-gray-700">
                  {Math.round(pct)}%
                </span>
              </ProgressRing>
              <div className="mt-2 grid grid-cols-3 gap-1 text-center text-[10px]">
                <div>
                  <div className="font-semibold text-emerald-600">
                    {fmt(d?.completed)}
                  </div>
                  <div className="text-gray-400">done</div>
                </div>
                <div>
                  <div className="font-semibold text-yellow-600">
                    {fmt(d?.skipped)}
                  </div>
                  <div className="text-gray-400">skip</div>
                </div>
                <div>
                  <div className="font-semibold text-red-500">
                    {fmt(d?.missed)}
                  </div>
                  <div className="text-gray-400">miss</div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
      {tod && (
        <div>
          <div className="flex items-center gap-1 mb-2">
            <span className="text-xs font-semibold text-gray-600">
              Completions by Time of Day
            </span>
            {hints.completions_by_time_of_day && (
              <HintTooltip text={hints.completions_by_time_of_day} />
            )}
          </div>
          <VBarChart
            height={70}
            color="#667eea"
            data={[
              { label: '🌅 AM', value: tod.morning ?? 0 },
              { label: '☀️ PM', value: tod.afternoon ?? 0 },
              { label: '🌆 Eve', value: tod.evening ?? 0 },
              { label: '🌙 Night', value: tod.night ?? 0 },
            ]}
          />
        </div>
      )}
    </Card>
  )
}

// ── Health Summary Card ───────────────────────────────────────────────────────
export function HealthCard({ data }: Props) {
  const ha = data?.health_analytics
  const hints = ha?.hints ?? {}
  const bms = ha?.body_measurement_summary
  const vs = ha?.vitals_summary
  return (
    <Card title="Health Analytics Overview" icon="❤️" className="db-col-2">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="flex items-center gap-1 mb-2">
            <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
              Body Metrics
            </span>
            {hints.body_measurement_summary && (
              <HintTooltip text={hints.body_measurement_summary} />
            )}
          </div>
          <div className="space-y-2">
            {[
              {
                label: 'Avg Weight',
                value: `${bms?.weight?.avg ?? '--'} kg`,
                color: '#667eea',
              },
              {
                label: 'Min Weight',
                value: `${bms?.weight?.min ?? '--'} kg`,
                color: '#48bb78',
              },
              {
                label: 'Max Weight',
                value: `${bms?.weight?.max ?? '--'} kg`,
                color: '#fc8181',
              },
              {
                label: 'Avg BMI',
                value: bms?.bmi?.avg ?? '--',
                color: '#f6ad55',
              },
            ].map((r, i) => (
              <div
                key={i}
                className="flex items-center justify-between text-xs py-1 border-b border-gray-50"
              >
                <span className="text-gray-500">{r.label}</span>
                <span className="font-semibold" style={{ color: r.color }}>
                  {r.value}
                </span>
              </div>
            ))}
          </div>
          {bms?.bmi?.categories && (
            <div className="mt-3 grid grid-cols-2 gap-1">
              {Object.entries(bms.bmi.categories).map(([k, v], i) => (
                <div
                  key={i}
                  className="text-[10px] rounded-lg px-1.5 py-1 text-center"
                  style={{ background: COLORS[i] + '15', color: COLORS[i] }}
                >
                  <div className="font-bold">{fmt(v as number)}</div>
                  <div className="capitalize text-gray-500">{k}</div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div>
          <div className="flex items-center gap-1 mb-2">
            <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
              Vitals Averages
            </span>
            {hints.vitals_summary && (
              <HintTooltip text={hints.vitals_summary} />
            )}
          </div>
          <div className="space-y-2">
            {[
              // {
              //   label: '❤️ Heart Rate',
              //   value: `${vs?.avg_heart_rate ?? '--'} bpm`,
              // },
              // {
              //   label: '🩸 Sugar',
              //   value: `${vs?.avg_sugar_level ?? '--'} mg/dL`,
              // },
              {
                label: '😴 Sleep',
                value: `${vs?.avg_sleep_hours ?? '--'} hrs`,
              },
              { label: '💧 Water', value: `${vs?.avg_water_intake ?? '--'} L` },
              { label: '👟 Steps', value: fmt(vs?.avg_steps) },
            ].map((r, i) => (
              <div
                key={i}
                className="flex items-center justify-between text-xs py-1 border-b border-gray-50"
              >
                <span className="text-gray-500">{r.label}</span>
                <span className="font-semibold text-gray-800">{r.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  )
}

// ── Vitals Card ───────────────────────────────────────────────────────────────
export function VitalsCard({ data }: Props) {
  const v = data?.vitals
  const hints = v?.hints ?? {}
  const metrics = [
    // {
    //   label: 'Heart Rate',
    //   avg: v?.heart_rate_analytics?.avg,
    //   min: v?.heart_rate_analytics?.min,
    //   max: v?.heart_rate_analytics?.max,
    //   normal: v?.heart_rate_analytics?.normal_percentage,
    //   unit: 'bpm',
    //   color: '#fc8181',
    //   hk: 'heart_rate',
    // },
    // {
    //   label: 'Sugar',
    //   avg: v?.sugar_analytics?.avg,
    //   unit: 'mg/dL',
    //   normal: v?.sugar_analytics?.normal_percentage,
    //   color: '#f6ad55',
    //   hk: 'sugar',
    // },
    {
      label: 'Sleep',
      avg: v?.sleep_analytics?.avg_hours,
      unit: 'hrs',
      normal: v?.sleep_analytics?.adequate_percentage,
      color: '#9f7aea',
      hk: 'sleep',
    },
    {
      label: 'Water',
      avg: v?.water_analytics?.avg_intake,
      unit: 'L',
      normal: v?.water_analytics?.adequate_percentage,
      color: '#4299e1',
      hk: 'water',
    },
    {
      label: 'Steps',
      avg: v?.steps_analytics?.avg_steps,
      unit: 'steps',
      color: '#48bb78',
      hk: 'steps',
    },
  ]
  return (
    <Card title="Vitals Tracking" icon="🩺">
      <div className="flex items-center gap-1 mb-3">
        <span className="text-xs text-gray-500">
          {fmt(v?.unique_users)} users tracked · {fmt(v?.total_records)} records
        </span>
        {hints.overview && <HintTooltip text={hints.overview} />}
      </div>
      <div className="space-y-3">
        {metrics.map((m, i) => (
          <div key={i}>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-gray-600 flex items-center gap-1">
                {m.label}
                {hints[m.hk] && <HintTooltip text={hints[m.hk]} />}
              </span>
              <span className="font-semibold text-gray-800">
                {m.avg ?? '--'} {m.unit}
              </span>
            </div>
            {m.normal !== undefined && (
              <div className="flex items-center gap-1">
                <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.min(100, m.normal)}%`,
                      background: m.color,
                    }}
                  />
                </div>
                <span className="text-[10px] text-gray-400">
                  {fmtPct(m.normal)} normal
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  )
}

// ── Body Measurements Card ────────────────────────────────────────────────────
export function BodyMeasurementsCard({ data }: Props) {
  const bm = data?.body_measurements
  const hints = bm?.hints ?? {}
  const wc = bm?.weight_analytics?.weight_changes
  const om = bm?.other_measurements
  return (
    <Card title="Body Measurements" icon="📏">
      <div className="flex items-center gap-1 mb-3">
        <span className="text-xs text-gray-500">
          {fmt(bm?.unique_users_measured)} users · {fmt(bm?.total_records)}{' '}
          records
        </span>
        {hints.overview && <HintTooltip text={hints.overview} />}
      </div>
      <div className="grid grid-cols-3 gap-2 mb-3">
        {wc &&
          [
            { label: 'Lost Weight', value: wc.lost_weight, color: '#48bb78' },
            { label: 'Gained', value: wc.gained_weight, color: '#fc8181' },
            { label: 'Maintained', value: wc.maintained, color: '#4299e1' },
          ].map((c, i) => (
            <div
              key={i}
              className="text-center rounded-xl py-2"
              style={{
                background: c.color + '12',
                border: `1px solid ${c.color}25`,
              }}
            >
              <div className="text-sm font-bold" style={{ color: c.color }}>
                {fmt(c.value)}
              </div>
              <div className="text-[10px] text-gray-500">{c.label}</div>
            </div>
          ))}
      </div>
      {om && (
        <div className="space-y-1.5">
          <span className="text-[10px] uppercase font-semibold text-gray-400 tracking-wide flex items-center gap-1">
            Average Measurements
            {hints.other_measurements && (
              <HintTooltip text={hints.other_measurements} />
            )}
          </span>
          {[
            { label: 'Chest', value: `${om.chest_avg ?? '--'} cm` },
            { label: 'Waist', value: `${om.waist_avg ?? '--'} cm` },
            { label: 'Hip', value: `${om.hip_avg ?? '--'} cm` },
            { label: 'Arm', value: `${om.arm_avg ?? '--'} cm` },
            { label: 'Thigh', value: `${om.thigh_avg ?? '--'} cm` },
            { label: 'Neck', value: `${om.neck_avg ?? '--'} cm` },
          ].map((r, i) => (
            <div
              key={i}
              className="flex justify-between text-xs py-0.5 border-b border-gray-50"
            >
              <span className="text-gray-500">{r.label}</span>
              <span className="font-semibold text-gray-700">{r.value}</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

// ── User Behavior Card ────────────────────────────────────────────────────────
export function UserBehaviorCard({ data }: Props) {
  const ub = data?.user_behavior
  const pat = ub?.user_activity_patterns
  const drop = ub?.drop_off_points
  const pref = ub?.preferred_workout_times
  return (
    <Card title="User Behaviour" icon="🧠">
      {pat && (
        <div className="space-y-2 mb-3">
          {[
            { label: 'Most Active Day', value: pat.most_active_day },
            { label: 'Least Active Day', value: pat.least_active_day },
            {
              label: 'Peak Hour',
              value:
                pat.peak_activity_hour !== undefined
                  ? `${pat.peak_activity_hour}:00`
                  : '--',
            },
            { label: 'Avg Sessions/User', value: pat.avg_sessions_per_user },
          ].map((r, i) => (
            <div
              key={i}
              className="flex justify-between text-xs py-1 border-b border-gray-50"
            >
              <span className="text-gray-500">{r.label}</span>
              <span className="font-semibold text-gray-800 capitalize">
                {r.value ?? '--'}
              </span>
            </div>
          ))}
        </div>
      )}
      {pref && (
        <div className="mb-3">
          <div className="text-[10px] uppercase font-semibold text-gray-400 mb-1">
            Preferred Workout Times
          </div>
          <VBarChart
            height={60}
            color="#667eea"
            data={[
              { label: '🌅 AM', value: pref.morning ?? 0 },
              { label: '☀️ PM', value: pref.afternoon ?? 0 },
              { label: '🌆 Eve', value: pref.evening ?? 0 },
            ]}
          />
        </div>
      )}
      {drop && (
        <div className="flex gap-2">
          <div className="flex-1 rounded-xl text-center p-2 bg-red-50 border border-red-100">
            <div className="text-sm font-bold text-red-600">
              {fmtPct(drop.week_2_dropoff)}
            </div>
            <div className="text-[10px] text-gray-500">Week 2 Drop-off</div>
          </div>
          <div className="flex-1 rounded-xl text-center p-2 bg-orange-50 border border-orange-100">
            <div className="text-sm font-bold text-orange-600">
              {fmtPct(drop.month_1_dropoff)}
            </div>
            <div className="text-[10px] text-gray-500">Month 1 Drop-off</div>
          </div>
        </div>
      )}
      {!pat && !pref && !drop && (
        <p className="text-sm text-gray-400 text-center py-4">
          No behaviour data
        </p>
      )}
    </Card>
  )
}

// ── Active Users (Engagement Summary) ─────────────────────────────────────────
export function ActiveUsersCard({ data }: Props) {
  const s = data?.engagement?.summary
  const hints = data?.engagement?.hints ?? {}
  const modules = [
    {
      label: 'Workout',
      value: s?.workout_active_users,
      color: '#fc8181',
      icon: '🏋️',
    },
    {
      label: 'Yoga',
      value: s?.yoga_active_users,
      color: '#38b2ac',
      icon: '🧘‍♀️',
    },
    {
      label: 'Meditation',
      value: s?.meditation_active_users,
      color: '#9f7aea',
      icon: '🧘',
    },
    {
      label: 'Diet',
      value: s?.diet_active_users,
      color: '#48bb78',
      icon: '🥗',
    },
  ]
  const total = s?.active_users_total ?? 0
  return (
    <Card title="Active Users Breakdown" icon="🟢">
      <div className="flex items-center gap-1 mb-4">
        <span className="text-3xl font-bold text-gray-800">{fmt(total)}</span>
        <span className="text-xs text-gray-400 ml-1">active in last 24h</span>
        {hints.active_users_total && (
          <HintTooltip text={hints.active_users_total} />
        )}
      </div>
      <div className="space-y-3">
        {modules.map((m, i) => {
          const pct = total ? Math.round(((m.value ?? 0) / total) * 100) : 0
          return (
            <div key={i}>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-gray-600 flex items-center gap-1">
                  {m.icon} {m.label}
                </span>
                <span className="font-semibold" style={{ color: m.color }}>
                  {fmt(m.value)}{' '}
                  <span className="text-gray-400 font-normal">({pct}%)</span>
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${pct}%`, background: m.color }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

// ── Content Performance Card ──────────────────────────────────────────────────
export function ContentPerformanceCard({ data }: Props) {
  const cp = data?.content_performance
  const under = cp?.underperforming_content ?? []
  const eff = cp?.content_effectiveness
  return (
    <Card title="Content Performance" icon="🎬" className="db-col-2">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Satisfaction Scores
          </div>
          <div className="space-y-2">
            {[
              {
                label: '🏋️ Workout',
                value: cp?.workout_performance?.user_satisfaction,
              },
              {
                label: '🧘 Meditation',
                value: cp?.meditation_performance?.user_satisfaction,
              },
              {
                label: '🥗 Diet Plan',
                value: cp?.diet_plan_performance?.user_satisfaction,
              },
            ].map((r, i) => (
              <div key={i}>
                <div className="flex justify-between text-xs mb-0.5">
                  <span className="text-gray-600">{r.label}</span>
                  <span className="font-semibold text-gray-800">
                    {r.value !== undefined
                      ? `${Number(r.value).toFixed(1)}/5`
                      : '--'}
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-indigo-500"
                    style={{ width: `${((r.value ?? 0) / 5) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          {eff && (
            <div className="mt-3">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Effectiveness
              </div>
              <div className="grid grid-cols-3 gap-1">
                <div className="rounded-lg text-center py-1.5 bg-emerald-50 border border-emerald-100">
                  <div className="text-xs font-bold text-emerald-600">
                    {fmt(eff.highly_effective)}
                  </div>
                  <div className="text-[10px] text-gray-400">High</div>
                </div>
                <div className="rounded-lg text-center py-1.5 bg-yellow-50 border border-yellow-100">
                  <div className="text-xs font-bold text-yellow-600">
                    {fmt(eff.moderately_effective)}
                  </div>
                  <div className="text-[10px] text-gray-400">Moderate</div>
                </div>
                <div className="rounded-lg text-center py-1.5 bg-red-50 border border-red-100">
                  <div className="text-xs font-bold text-red-500">
                    {fmt(eff.needs_improvement)}
                  </div>
                  <div className="text-[10px] text-gray-400">Needs work</div>
                </div>
              </div>
            </div>
          )}
        </div>
        <div>
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            ⚠️ Underperforming Content
          </div>
          {under.length ? (
            <div className="space-y-2">
              {under.slice(0, 5).map((u, i) => (
                <div
                  key={i}
                  className="rounded-xl p-2.5 bg-red-50 border border-red-100"
                >
                  <div className="text-xs font-semibold text-gray-800 truncate">
                    {u.title}
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[10px] text-red-500">
                      {fmtPct(u.completion_rate)} completion
                    </span>
                    <span className="text-[10px] text-orange-500 italic">
                      {u.issue}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-6">
              No underperforming content 🎉
            </p>
          )}
        </div>
      </div>
    </Card>
  )
}

// ── Streaks Card (uses notifications as proxy) ────────────────────────────────
export function StreaksCard({ data }: Props) {
  const n = data?.notifications
  const hints = n?.hints ?? {}
  const byType = n?.by_type ?? {}
  const total = n?.total ?? 0
  const slices = Object.entries(byType)
    .slice(0, 5)
    .map(([k, v], i) => ({
      label: k,
      value: v as number,
      color: COLORS[i % COLORS.length],
    }))
  return (
    <Card title="Notifications" icon="🔔">
      <div className="flex items-center gap-3 mb-3">
        <DonutChart
          slices={slices}
          size={90}
          stroke={18}
          center={
            <span className="text-base font-bold text-gray-800">
              {fmt(total)}
            </span>
          }
        />
        <div className="flex-1 space-y-1.5">
          {slices.map((sl, i) => (
            <LegendRow
              key={i}
              label={sl.label}
              value={sl.value}
              pct={total ? Math.round((sl.value / total) * 100) : 0}
              color={sl.color}
              hint={hints[sl.label]}
            />
          ))}
        </div>
      </div>
      <div className="flex gap-2 flex-wrap">
        {[
          { label: 'Unread', value: n?.unread, color: '#fc8181' },
          { label: 'Delivered', value: n?.delivered, color: '#48bb78' },
          { label: 'Scheduled', value: n?.scheduled_future, color: '#4299e1' },
        ].map((b, i) => (
          <div
            key={i}
            className="flex-1 rounded-lg text-center py-1.5"
            style={{
              background: b.color + '12',
              border: `1px solid ${b.color}25`,
            }}
          >
            <div className="text-sm font-bold" style={{ color: b.color }}>
              {fmt(b.value)}
            </div>
            <div className="text-[10px] text-gray-500">{b.label}</div>
          </div>
        ))}
      </div>
    </Card>
  )
}

// ── Diet Card ─────────────────────────────────────────────────────────────────
export function DietCard({ data }: Props) {
  const d = data?.diet
  const hints = d?.hints ?? {}
  const cat = d?.category_consumption ?? {}
  const timing = d?.meal_timing_analysis ?? {}
  const mandOpt = d?.mandatory_vs_optional ?? {}
  const total = d?.total_meals ?? 0
  return (
    <Card title="Diet & Nutrition" icon="🥗" className="db-col-2">
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          {
            label: 'Total Meals',
            value: d?.total_meals,
            color: '#48bb78',
            hint: hints.total_meals,
          },
          {
            label: 'Adherence',
            value: fmtPct(d?.adherence_rate_percentage),
            color: '#667eea',
            hint: hints.adherence_rate,
          },
          {
            label: 'Users',
            value: d?.unique_users,
            color: '#f6ad55',
            hint: hints.unique_users,
          },
          {
            label: 'Completed',
            value: d?.completed_count,
            color: '#38b2ac',
            hint: hints.completed_count,
          },
          { label: 'Skipped', value: d?.skipped_count, color: '#ed8936' },
          { label: 'Missed', value: d?.missed_count, color: '#fc8181' },
        ].map((c, i) => (
          <div
            key={i}
            className="rounded-xl text-center py-2.5 px-2"
            style={{
              background: c.color + '12',
              border: `1px solid ${c.color}25`,
            }}
          >
            <div className="text-sm font-bold" style={{ color: c.color }}>
              {typeof c.value === 'string' ? c.value : fmt(c.value)}
            </div>
            <div className="text-[10px] text-gray-500 flex items-center justify-center gap-0.5">
              {c.label}
              {c.hint && <HintTooltip text={c.hint} />}
            </div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-4">
        {Object.keys(cat).length > 0 && (
          <div>
            <div className="flex items-center gap-1 mb-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Category Consumption
              </span>
              {hints.category_consumption && (
                <HintTooltip text={hints.category_consumption} />
              )}
            </div>
            <div className="space-y-1.5">
              {Object.entries(cat)
                .slice(0, 5)
                .map(([k, v], i) => (
                  <LegendRow
                    key={i}
                    label={k}
                    value={v as number}
                    pct={total ? Math.round(((v as number) / total) * 100) : 0}
                    color={COLORS[i % COLORS.length]}
                  />
                ))}
            </div>
          </div>
        )}
        {Object.keys(timing).length > 0 && (
          <div>
            <div className="flex items-center gap-1 mb-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Meal Timing
              </span>
              {hints.meal_timing_analysis && (
                <HintTooltip text={hints.meal_timing_analysis} />
              )}
            </div>
            <VBarChart
              height={70}
              color="#48bb78"
              data={Object.entries(timing).map(([k, v]) => ({
                label: k,
                value: v as number,
              }))}
            />
          </div>
        )}
      </div>
      {Object.keys(mandOpt).length > 0 && (
        <div className="mt-3 flex gap-2">
          {Object.entries(mandOpt).map(([k, v], i) => (
            <div
              key={i}
              className="flex-1 rounded-xl text-center py-2"
              style={{
                background: COLORS[i] + '12',
                border: `1px solid ${COLORS[i]}25`,
              }}
            >
              <div className="text-sm font-bold" style={{ color: COLORS[i] }}>
                {fmt(v as number)}
              </div>
              <div className="text-[10px] text-gray-500 capitalize">{k}</div>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

// ── Freezes Card ──────────────────────────────────────────────────────────────
export function FreezesCard({ data }: Props) {
  const fr = data?.freezes
  const hints = fr?.hints ?? {}
  return (
    <Card title="Subscription Freezes" icon="❄️">
      <div className="space-y-3">
        {[
          {
            label: 'Total Freezes',
            value: fr?.total,
            color: '#4299e1',
            hint: hints.total,
          },
          {
            label: 'Active Right Now',
            value: fr?.active_now,
            color: '#9f7aea',
            hint: hints.active_now,
          },
          {
            label: 'Active Subs with Freeze',
            value: fr?.active_subscriptions_with_freeze_now,
            color: '#667eea',
            hint: hints.with_freeze,
          },
        ].map((r, i) => (
          <div
            key={i}
            className="flex items-center justify-between rounded-xl px-3 py-2.5"
            style={{
              background: r.color + '10',
              border: `1px solid ${r.color}20`,
            }}
          >
            <span className="text-xs text-gray-600 flex items-center gap-1">
              {r.label}
              {r.hint && <HintTooltip text={r.hint} />}
            </span>
            <span className="text-sm font-bold" style={{ color: r.color }}>
              {fmt(r.value)}
            </span>
          </div>
        ))}
      </div>
    </Card>
  )
}

// ── Plan Categories Card ──────────────────────────────────────────────────────
export function PlanCategoriesCard({ data }: Props) {
  const p = data?.plans
  const hints = p?.hints ?? {}
  const byCat = p?.by_category ?? {}
  const total = p?.total ?? 0
  const slices = Object.entries(byCat).map(([k, v], i) => ({
    label: k,
    value: v as number,
    color: COLORS[i % COLORS.length],
  }))
  return (
    <Card title="Plans by Category" icon="🗂️">
      <DonutChart
        slices={slices}
        size={110}
        stroke={22}
        center={
          <>
            <span className="text-xl font-bold text-gray-800">
              {fmt(total)}
            </span>
            <span className="text-[10px] text-gray-400">plans</span>
          </>
        }
      />
      <div className="mt-3 space-y-1.5">
        {slices.map((sl, i) => (
          <LegendRow
            key={i}
            label={sl.label}
            value={sl.value}
            pct={total ? Math.round((sl.value / total) * 100) : 0}
            color={sl.color}
            hint={hints[sl.label]}
          />
        ))}
      </div>
      <div className="mt-3 flex gap-2">
        <div className="flex-1 rounded-xl text-center py-2 bg-teal-50 border border-teal-100">
          <div className="text-sm font-bold text-teal-600">
            {fmt(p?.yoga_included)}
          </div>
          <div className="text-[10px] text-gray-500">With Yoga</div>
        </div>
        <div className="flex-1 rounded-xl text-center py-2 bg-violet-50 border border-violet-100">
          <div className="text-sm font-bold text-violet-600">
            {fmt(p?.meditation_included)}
          </div>
          <div className="text-[10px] text-gray-500">With Meditation</div>
        </div>
      </div>
    </Card>
  )
}

// ── Feedbacks Card ────────────────────────────────────────────────────────────
export function FeedbacksCard({ data }: Props) {
  const fb = data?.feedbacks
  const hints = fb?.hints ?? {}
  const byRating = fb?.by_rating ?? {}
  const total = fb?.total ?? 0
  return (
    <Card title="Feedbacks" icon="⭐">
      <div className="flex items-center gap-1 mb-3">
        <span className="text-2xl font-bold text-gray-800">{fmt(total)}</span>
        <span className="text-xs text-gray-400 ml-1">total reviews</span>
        {hints.total && <HintTooltip text={hints.total} />}
      </div>
      <div className="space-y-1.5 mb-3">
        {[5, 4, 3, 2, 1].map((r) => {
          const count = byRating[r] ?? 0
          const pct = total ? Math.round((count / total) * 100) : 0
          return (
            <div key={r} className="flex items-center gap-2 text-xs">
              <span className="text-yellow-400 w-10">{'★'.repeat(r)}</span>
              <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-yellow-400"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="w-6 text-right text-gray-500">{count}</span>
            </div>
          )
        })}
      </div>
      <div className="flex gap-2">
        {[
          {
            label: 'Workouts',
            value: fb?.for_workouts,
            color: '#fc8181',
            hint: hints.for_workouts,
          },
          {
            label: 'Plans',
            value: fb?.for_plans,
            color: '#f6ad55',
            hint: hints.for_plans,
          },
          {
            label: 'Recipes',
            value: fb?.for_recipes,
            color: '#48bb78',
            hint: hints.for_recipes,
          },
        ].map((b, i) => (
          <div
            key={i}
            className="flex-1 rounded-xl text-center py-1.5"
            style={{
              background: b.color + '12',
              border: `1px solid ${b.color}25`,
            }}
          >
            <div className="text-xs font-bold" style={{ color: b.color }}>
              {fmt(b.value)}
            </div>
            <div className="text-[10px] text-gray-500 flex items-center justify-center gap-0.5">
              {b.label}
              {b.hint && <HintTooltip text={b.hint} />}
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

// ── Activity Card ─────────────────────────────────────────────────────────────
export function ActivityCard({ data }: Props) {
  const a = data?.activity
  const hints = a?.hints ?? {}
  const items = [
    {
      label: 'Progress Logs',
      value: a?.progress_logs,
      color: '#667eea',
      hint: hints.progress_logs,
    },
    {
      label: 'Body Measurements',
      value: a?.body_measurements,
      color: '#48bb78',
      hint: hints.body_measurements,
    },
    {
      label: 'Workout Completions',
      value: a?.workout_exercise_completions,
      color: '#fc8181',
      hint: hints.workout_exercise_completions,
    },
    {
      label: 'Diet Completions',
      value: a?.diet_plan_item_completions,
      color: '#f6ad55',
      hint: hints.diet_plan_item_completions,
    },
    {
      label: 'Yoga Completions',
      value: a?.yoga_exercise_completions,
      color: '#38b2ac',
      hint: hints.yoga_exercise_completions,
    },
    {
      label: 'Meditation Completions',
      value: a?.meditation_completions,
      color: '#9f7aea',
      hint: hints.meditation_completions,
    },
    {
      label: 'Workout Plan Progress',
      value: a?.workout_plan_progresses,
      color: '#4299e1',
      hint: hints.workout_plan_progresses,
    },
  ]
  return (
    <Card title="Platform Activity" icon="📊">
      <div className="space-y-2">
        {items.map((it, i) => (
          <div
            key={i}
            className="flex items-center justify-between rounded-xl px-2.5 py-2"
            style={{
              background: it.color + '0d',
              border: `1px solid ${it.color}20`,
            }}
          >
            <span className="text-xs text-gray-600 flex items-center gap-1">
              {it.label}
              {it.hint && <HintTooltip text={it.hint} />}
            </span>
            <span className="text-sm font-bold" style={{ color: it.color }}>
              {fmt(it.value)}
            </span>
          </div>
        ))}
      </div>
    </Card>
  )
}
