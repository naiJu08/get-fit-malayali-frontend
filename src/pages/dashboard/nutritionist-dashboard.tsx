import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLayoutStore } from '../../store/layoutStore'
import Icons from '../../components/common/icons'
import {
  Card,
  DonutChart,
  HintTooltip,
  LegendRow,
  StatCard,
  fmt,
  fmtDate,
} from './dashboard-helpers'
import type { NutritionistDashboardResponse } from './types'

type Props = {
  data?: NutritionistDashboardResponse
  loading: boolean
  error: boolean
  onRetry: () => void
}

const COLORS = ['#667eea', '#48bb78', '#f6ad55', '#fc8181']

export default function NutritionistDashboardView({
  data,
  loading,
  error,
  onRetry,
}: Props) {
  const { setLayoutType } = useLayoutStore()
  const navigate = useNavigate()

  useEffect(() => {
    setLayoutType('sideNav')
  }, [setLayoutType])

  if (loading) {
    return (
      <div className="db-root">
        <div className="db-shell">
          <div className="db-kpi-grid">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-28 rounded-2xl bg-gray-200 animate-pulse"
              />
            ))}
          </div>
          <div className="db-grid-2 mt-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-64 rounded-2xl bg-gray-200 animate-pulse"
              />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="db-root">
        <div className="db-shell flex items-center justify-center min-h-[60vh]">
          <div className="text-center p-10 bg-white rounded-2xl shadow-md max-w-md">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <Icons name="danger" className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Dashboard unavailable
            </h2>
            <p className="text-gray-500 mb-6 text-sm">
              Could not load nutritionist analytics. Please retry.
            </p>
            <button className="db-retry-btn" onClick={onRetry}>
              <Icons name="refresh" className="w-4 h-4" />
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  const rangeLabel =
    data?.date_info?.range_start && data?.date_info?.range_end
      ? `${fmtDate(data.date_info.range_start)} - ${fmtDate(data.date_info.range_end)}`
      : data?.generated_at
        ? `As of ${fmtDate(data.generated_at)}`
        : 'Recent activity'

  const clientStatus = data?.clients?.by_status ?? {}
  const totalAlerts =
    (data?.alerts?.expiring_soon?.length ?? 0) +
    (data?.alerts?.inactive?.length ?? 0) +
    (data?.alerts?.missing_diet_template_today?.length ?? 0)

  // const engagementTotal =
  //   (data?.engagement?.totals?.diet_item_completions ?? 0) +
  //   (data?.engagement?.totals?.workout_completions ?? 0) +
  //   (data?.engagement?.totals?.yoga_completions ?? 0) +
  //   (data?.engagement?.totals?.meditation_completions ?? 0)

  return (
    <div className="db-root min-h-[120vh]">
      <div className="db-shell min-h-[calc(100vh-64px)]">
        <div className="db-header">
          <div className="db-header-bg" />
          <div className="relative z-10 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="db-header-eyebrow">Nutritionist Workspace</p>
              <h1 className="db-header-title">Performance Dashboard</h1>
              <p className="db-header-period">{rangeLabel}</p>
            </div>
            <div className="flex flex-wrap gap-2 mt-4 lg:mt-0">
              {[
                { label: 'Nutritionist', value: data?.nutritionist?.name },
                { label: 'Clients', value: data?.clients?.total },
                {
                  label: 'Active Subs',
                  value: data?.subscriptions?.active_or_paused,
                },
                { label: 'Alerts', value: totalAlerts },
              ].map((p) => (
                <div key={p.label} className="db-header-pill">
                  <span className="db-header-pill-label">{p.label}</span>
                  <span className="db-header-pill-value">
                    {p.value ?? '--'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="db-grid-2">
          <StatCard
            title="Clients"
            value={fmt(data?.clients?.total)}
            sub={`${fmt(clientStatus.active)} active · ${fmt(clientStatus.suspended)} suspended · ${fmt(clientStatus.deactivated)} deactivated`}
            gradient="linear-gradient(135deg,#667eea,#764ba2)"
            icon="👥"
            onClick={() => navigate('/users')}
          />
          <StatCard
            title="Active Or Paused Subscriptions"
            value={fmt(data?.subscriptions?.active_or_paused)}
            sub={`${fmt(data?.subscriptions?.expiring_soon)} expiring within ${fmt(data?.subscriptions?.expiring_within_days)} days`}
            gradient="linear-gradient(135deg,#06b6d4,#3b82f6)"
            icon="📋"
            onClick={() => navigate('/subscriptions')}
          />
          {/* <StatCard
            title="Engagement"
            value={fmt(engagementTotal)}
            sub="Rolling-window completions across assigned clients"
            gradient="linear-gradient(135deg,#48bb78,#38b2ac)"
            icon="📈"
          />
          <StatCard
            title="Feedback"
            value={fmt(data?.feedbacks?.total)}
            sub={`${fmt(data?.feedbacks?.recent?.length)} recent feedback items`}
            gradient="linear-gradient(135deg,#f6ad55,#ed8936)"
            icon="💬"
          /> */}
        </div>

        <div className="db-grid-2 mt-6">
          <ClientStatusCard data={data} />
          <EngagementTotalsCard data={data} />
        </div>

        <div className="db-grid-2 mt-6 pb-10">
          <AlertsCard data={data} />
          {/* <FeedbackCard data={data} /> */}
        </div>
      </div>
    </div>
  )
}

function ClientStatusCard({ data }: { data?: NutritionistDashboardResponse }) {
  const byStatus = data?.clients?.by_status ?? {}
  const total = data?.clients?.total ?? 0
  const slices = Object.entries(byStatus).map(([label, value], index) => ({
    label,
    value,
    color: COLORS[index % COLORS.length],
  }))

  return (
    <Card title="Client Status" icon="👥">
      <div className="flex items-center gap-1 mb-3">
        <span className="text-xs text-gray-500">Assigned client breakdown</span>
        {data?.clients?.hints?.by_status && (
          <HintTooltip text={data.clients.hints.by_status} />
        )}
      </div>
      <div className="flex items-center gap-4">
        <DonutChart
          slices={slices}
          size={120}
          stroke={24}
          center={
            <>
              <span className="text-xl font-bold text-gray-800">
                {fmt(total)}
              </span>
              <span className="text-[10px] text-gray-400">clients</span>
            </>
          }
        />
        <div className="flex-1 space-y-2">
          {slices.map((slice) => (
            <LegendRow
              key={slice.label}
              label={slice.label}
              value={slice.value}
              pct={total ? Math.round((slice.value / total) * 100) : 0}
              color={slice.color}
            />
          ))}
        </div>
      </div>
    </Card>
  )
}

function EngagementTotalsCard({
  data,
}: {
  data?: NutritionistDashboardResponse
}) {
  const totals = data?.engagement?.totals ?? {}
  const items = [
    {
      label: 'Diet',
      value: totals.diet_item_completions,
      color: '#48bb78',
    },
    {
      label: 'Workout',
      value: totals.workout_completions,
      color: '#fc8181',
    },
    { label: 'Yoga', value: totals.yoga_completions, color: '#38b2ac' },
    {
      label: 'Meditation',
      value: totals.meditation_completions,
      color: '#9f7aea',
    },
  ]

  return (
    <Card title="Client Engagement" icon="📈">
      <div className="flex items-center gap-1 mb-4">
        <span className="text-xs text-gray-500">Rolling-window activity</span>
        {data?.engagement?.hints?.totals && (
          <HintTooltip text={data.engagement.hints.totals} />
        )}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {items.map((item) => (
          <div
            key={item.label}
            className="rounded-xl px-3 py-3"
            style={{
              background: item.color + '12',
              border: `1px solid ${item.color}25`,
            }}
          >
            <div className="text-2xl font-bold" style={{ color: item.color }}>
              {fmt(item.value)}
            </div>
            <div className="text-xs text-gray-500">{item.label}</div>
          </div>
        ))}
      </div>
    </Card>
  )
}

function AlertsCard({ data }: { data?: NutritionistDashboardResponse }) {
  const alerts = [
    {
      label: 'Expiring Soon',
      value: data?.alerts?.expiring_soon?.length ?? 0,
      color: '#f6ad55',
    },
    {
      label: 'Inactive Clients',
      value: data?.alerts?.inactive?.length ?? 0,
      color: '#fc8181',
    },
    {
      label: 'Missing Diet Template Today',
      value: data?.alerts?.missing_diet_template_today?.length ?? 0,
      color: '#667eea',
    },
  ]

  return (
    <Card title="Alerts" icon="⚠️">
      <div className="space-y-3">
        {alerts.map((alert) => (
          <div
            key={alert.label}
            className="flex items-center justify-between rounded-xl px-3 py-2.5"
            style={{
              background: alert.color + '10',
              border: `1px solid ${alert.color}25`,
            }}
          >
            <span className="text-xs text-gray-600">{alert.label}</span>
            <span className="text-sm font-bold" style={{ color: alert.color }}>
              {fmt(alert.value)}
            </span>
          </div>
        ))}
      </div>
    </Card>
  )
}

// function FeedbackCard({ data }: { data?: NutritionistDashboardResponse }) {
//   const recent = data?.feedbacks?.recent ?? []

//   return (
//     <Card title="Recent Feedback" icon="💬">
//       <div className="mb-3 flex items-center gap-2">
//         <span className="text-2xl font-bold text-gray-800">
//           {fmt(data?.feedbacks?.total)}
//         </span>
//         <span className="text-xs text-gray-400">total feedbacks</span>
//       </div>
//       {recent.length ? (
//         <div className="space-y-2">
//           {recent.slice(0, 5).map((item, index) => (
//             <div
//               key={item?.id ?? index}
//               className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2"
//             >
//               <div className="text-xs font-semibold text-gray-800">
//                 {item?.title || item?.client_name || 'Feedback'}
//               </div>
//               <div className="mt-1 text-[11px] text-gray-500">
//                 {item?.message || item?.comment || item?.created_at || '--'}
//               </div>
//             </div>
//           ))}
//         </div>
//       ) : (
//         <p className="py-8 text-center text-sm text-gray-400">
//           No recent feedback.
//         </p>
//       )}
//     </Card>
//   )
// }
