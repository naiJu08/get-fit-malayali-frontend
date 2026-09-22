import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLayoutStore } from '../../store/layoutStore'
import { useAuthStore } from '../../store/authStore'
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
import type { StaffDashboardResponse } from './types'

type Props = {
  data?: StaffDashboardResponse
  loading: boolean
  error: boolean
  onRetry: () => void
  role?: 'nutritionist' | 'physiotherapist' | 'yogist'
}

export default function NutritionistDashboardView({
  data,
  loading,
  error,
  onRetry,
  role: roleProp,
}: Props) {
  const { setLayoutType } = useLayoutStore()
  const { userData, roleData } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    setLayoutType('sideNav')
  }, [setLayoutType])

  const effectiveRole = (roleProp || roleData?.name || 'nutritionist') as
    | 'nutritionist'
    | 'physiotherapist'
    | 'yogist'

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

  const roleLabel =
    effectiveRole === 'physiotherapist'
      ? 'Physiotherapist'
      : effectiveRole === 'yogist'
        ? 'Yogist'
        : 'Nutritionist'

  const workspaceTitle =
    effectiveRole === 'physiotherapist'
      ? 'Physiotherapy & Rehab Workspace'
      : effectiveRole === 'yogist'
        ? 'Yoga & Mindfulness Workspace'
        : 'Nutritionist Workspace'

  const dashboardTitle =
    effectiveRole === 'physiotherapist'
      ? 'Movement & Therapy Dashboard'
      : effectiveRole === 'yogist'
        ? 'Wellness & Yoga Dashboard'
        : 'Performance Dashboard'

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
              Could not load {roleLabel.toLowerCase()} analytics. Please retry.
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

  const staffNameRaw =
    data?.staff?.name ||
    data?.physiotherapist?.name ||
    data?.yogist?.name ||
    data?.nutritionist?.name ||
    userData?.name ||
    ''
  const staffName = staffNameRaw
    ? staffNameRaw.charAt(0).toUpperCase() + staffNameRaw.slice(1)
    : ''

  const rangeLabel =
    data?.date_info?.range_start && data?.date_info?.range_end
      ? `${fmtDate(data.date_info.range_start)} - ${fmtDate(data.date_info.range_end)}`
      : data?.generated_at
        ? `As of ${fmtDate(data.generated_at)}`
        : 'Recent 7 days'

  const clientStatus = data?.clients?.by_status ?? {}

  const missingTemplates =
    effectiveRole === 'physiotherapist'
      ? data?.alerts?.missing_workout_template_today ||
        data?.alerts?.missing_template_today ||
        []
      : effectiveRole === 'yogist'
        ? data?.alerts?.missing_yoga_template_today ||
          data?.alerts?.missing_template_today ||
          []
        : data?.alerts?.missing_diet_template_today ||
          data?.alerts?.missing_template_today ||
          []

  const expiringCount = data?.alerts?.expiring_soon?.length ?? 0
  const inactiveCount = data?.alerts?.inactive?.length ?? 0
  const missingCount = missingTemplates.length
  const totalAlerts = expiringCount + inactiveCount + missingCount

  const totals = data?.engagement?.totals ?? {}
  const totalActivityCount =
    (totals.diet_item_completions ?? 0) +
    (totals.workout_completions ?? 0) +
    (totals.yoga_completions ?? 0) +
    (totals.meditation_completions ?? 0)

  const primaryActivitySub =
    effectiveRole === 'physiotherapist'
      ? `${fmt(totals.workout_completions)} workouts completed`
      : effectiveRole === 'yogist'
        ? `${fmt(totals.yoga_completions)} yoga sessions completed`
        : `${fmt(totals.diet_item_completions)} meals logged`

  return (
    <div className="db-root min-h-[120vh]">
      <div className="db-shell min-h-[calc(100vh-64px)]">
        {/* Header */}
        <div className="db-header">
          <div className="db-header-bg" />
          <div className="relative z-10 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="db-header-eyebrow">{workspaceTitle}</p>
              <h1 className="db-header-title">{dashboardTitle}</h1>
              <p className="db-header-period">{rangeLabel}</p>
            </div>
            <div className="flex flex-wrap gap-2 mt-4 lg:mt-0 items-center">
              {[
                {
                  label: roleLabel,
                  value: staffName || '--',
                  isStaff: true,
                },
                {
                  label: 'Clients',
                  value: data?.clients?.total ?? 0,
                },
                {
                  label: 'Active Subs',
                  value: data?.subscriptions?.active_or_paused ?? 0,
                },
                {
                  label: 'Alerts',
                  value: totalAlerts,
                },
              ].map((p) => (
                <div key={p.label} className="db-header-pill">
                  <span className="db-header-pill-label">{p.label}</span>
                  <span
                    className={`db-header-pill-value ${
                      p.isStaff
                        ? 'text-sm sm:text-base max-w-[170px] truncate'
                        : ''
                    }`}
                    title={p.isStaff ? String(p.value) : undefined}
                  >
                    {p.value ?? '--'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 4-Tile High Impact KPI Grid */}
        <div className="db-kpi-grid">
          <StatCard
            title="Assigned Clients"
            value={fmt(data?.clients?.total)}
            sub={`${fmt(clientStatus.active)} active · ${fmt(clientStatus.suspended)} suspended · ${fmt(clientStatus.deactivated)} deactivated`}
            gradient="linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)"
            icon="👥"
            onClick={() => navigate('/users')}
            badge="Assigned Clients"
          />
          <StatCard
            title="Active Subscriptions"
            value={fmt(data?.subscriptions?.active_or_paused)}
            sub={`${fmt(data?.subscriptions?.expiring_soon)} expiring within ${fmt(data?.subscriptions?.expiring_within_days || 7)} days`}
            gradient="linear-gradient(135deg, #0284c7 0%, #2563eb 100%)"
            icon="📋"
            onClick={
              effectiveRole === 'nutritionist'
                ? () => navigate('/subscriptions')
                : undefined
            }
            badge="Active / Paused"
          />
          <StatCard
            title="Client Engagement"
            value={fmt(totalActivityCount)}
            sub={primaryActivitySub}
            gradient="linear-gradient(135deg, #059669 0%, #0d9488 100%)"
            icon="⚡"
            badge="7-Day Activity"
          />
          <StatCard
            title="Action Alerts"
            value={fmt(totalAlerts)}
            sub={`${fmt(expiringCount)} expiring · ${fmt(inactiveCount)} inactive · ${fmt(missingCount)} missing`}
            gradient="linear-gradient(135deg, #ea580c 0%, #e11d48 100%)"
            icon="⚠️"
            badge={totalAlerts > 0 ? `${totalAlerts} Attention` : 'All Clear'}
          />
        </div>

        {/* Middle Section: Status & Engagement Analytics */}
        <div className="db-grid-2 mt-6">
          <ClientStatusCard data={data} />
          <EngagementTotalsCard data={data} role={effectiveRole} />
        </div>

        {/* Bottom Section: Action Alerts & Feedback */}
        <div className="db-grid-2 mt-6 pb-10">
          <AlertsCard
            data={data}
            role={effectiveRole}
            missingTemplates={missingTemplates}
          />
          <FeedbackCard data={data} />
        </div>
      </div>
    </div>
  )
}

function ClientStatusCard({ data }: { data?: StaffDashboardResponse }) {
  const byStatus = data?.clients?.by_status ?? {}
  const total = data?.clients?.total ?? 0
  const slices = [
    { label: 'Active', value: byStatus.active ?? 0, color: '#10b981' },
    { label: 'Suspended', value: byStatus.suspended ?? 0, color: '#f59e0b' },
    {
      label: 'Deactivated',
      value: byStatus.deactivated ?? 0,
      color: '#ef4444',
    },
  ].filter((s) => s.value > 0 || total === 0)

  return (
    <Card title="Client Status Distribution" icon="👥">
      <div className="flex items-center gap-1 mb-4">
        <span className="text-xs text-gray-500">
          Assigned client account breakdown
        </span>
        {data?.clients?.hints?.by_status && (
          <HintTooltip text={data.clients.hints.by_status} />
        )}
      </div>
      <div className="flex items-center gap-6">
        <DonutChart
          slices={slices}
          size={130}
          stroke={24}
          center={
            <>
              <span className="text-2xl font-bold text-gray-800">
                {fmt(total)}
              </span>
              <span className="text-[10px] uppercase font-semibold text-gray-400">
                clients
              </span>
            </>
          }
        />
        <div className="flex-1 space-y-3">
          <LegendRow
            label="Active"
            value={byStatus.active ?? 0}
            pct={total ? Math.round(((byStatus.active ?? 0) / total) * 100) : 0}
            color="#10b981"
          />
          <LegendRow
            label="Suspended"
            value={byStatus.suspended ?? 0}
            pct={
              total ? Math.round(((byStatus.suspended ?? 0) / total) * 100) : 0
            }
            color="#f59e0b"
          />
          <LegendRow
            label="Deactivated"
            value={byStatus.deactivated ?? 0}
            pct={
              total
                ? Math.round(((byStatus.deactivated ?? 0) / total) * 100)
                : 0
            }
            color="#ef4444"
          />
        </div>
      </div>
    </Card>
  )
}

function EngagementTotalsCard({
  data,
  role,
}: {
  data?: StaffDashboardResponse
  role: 'nutritionist' | 'physiotherapist' | 'yogist'
}) {
  const totals = data?.engagement?.totals ?? {}
  const items = [
    {
      label: 'Workouts',
      icon: '🏋️',
      value: totals.workout_completions,
      color: '#3b82f6',
      isPrimary: role === 'physiotherapist',
    },
    {
      label: 'Yoga Sessions',
      icon: '🧘',
      value: totals.yoga_completions,
      color: '#0d9488',
      isPrimary: role === 'yogist',
    },
    {
      label: 'Diet Meals',
      icon: '🥗',
      value: totals.diet_item_completions,
      color: '#10b981',
      isPrimary: role === 'nutritionist',
    },
    {
      label: 'Meditations',
      icon: '✨',
      value: totals.meditation_completions,
      color: '#8b5cf6',
      isPrimary: false,
    },
  ]

  return (
    <Card title="Client Activity & Completions" icon="📈">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs text-gray-500">
          Rolling 7-day logged activity across assigned clients
        </span>
        {data?.engagement?.hints?.totals && (
          <HintTooltip text={data.engagement.hints.totals} />
        )}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {items.map((item) => (
          <div
            key={item.label}
            className={`relative rounded-xl p-3.5 transition-all duration-200 border ${
              item.isPrimary
                ? 'shadow-sm ring-1 ring-offset-1'
                : 'hover:border-gray-300'
            }`}
            style={{
              background: `${item.color}0D`,
              borderColor: `${item.color}33`,
              ...(item.isPrimary ? { ringColor: item.color } : {}),
            }}
          >
            <div className="flex items-center justify-between">
              <span className="text-lg">{item.icon}</span>
              {item.isPrimary && (
                <span
                  className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white uppercase tracking-wider"
                  style={{ background: item.color }}
                >
                  Focus
                </span>
              )}
            </div>
            <div
              className="text-2xl font-extrabold mt-1.5"
              style={{ color: item.color }}
            >
              {fmt(item.value)}
            </div>
            <div className="text-xs font-medium text-gray-600 mt-0.5">
              {item.label}
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

function AlertsCard({
  data,
  role,
  missingTemplates,
}: {
  data?: StaffDashboardResponse
  role: 'nutritionist' | 'physiotherapist' | 'yogist'
  missingTemplates: any[]
}) {
  const missingLabel =
    role === 'physiotherapist'
      ? 'Missing Workout Template Today'
      : role === 'yogist'
        ? 'Missing Yoga Template Today'
        : 'Missing Diet Template Today'

  const alerts = [
    {
      label: 'Expiring Subscriptions',
      sublabel: `Within ${data?.subscriptions?.expiring_within_days || 7} days`,
      value: data?.alerts?.expiring_soon?.length ?? 0,
      color: '#f59e0b',
      icon: '⏳',
    },
    {
      label: 'Inactive Clients',
      sublabel: 'No activity logged in 5+ days',
      value: data?.alerts?.inactive?.length ?? 0,
      color: '#ef4444',
      icon: '⚠️',
    },
    {
      label: missingLabel,
      sublabel: 'Requires schedule/template assignment',
      value: missingTemplates.length,
      color: '#6366f1',
      icon: '📝',
    },
  ]

  const totalAlerts = alerts.reduce((acc, a) => acc + a.value, 0)

  return (
    <Card title="Immediate Action Alerts" icon="🔔">
      <div className="space-y-3">
        {alerts.map((alert) => (
          <div
            key={alert.label}
            className="flex items-center justify-between rounded-xl px-4 py-3 border transition-colors"
            style={{
              background: alert.color + '0C',
              borderColor: alert.color + '2E',
            }}
          >
            <div className="flex items-center gap-3">
              <span className="text-base">{alert.icon}</span>
              <div>
                <span className="text-xs font-semibold text-gray-800 block">
                  {alert.label}
                </span>
                <span className="text-[11px] text-gray-500">
                  {alert.sublabel}
                </span>
              </div>
            </div>
            <span
              className="text-base font-extrabold px-2.5 py-1 rounded-lg"
              style={{
                color: alert.color,
                background: alert.color + '18',
              }}
            >
              {fmt(alert.value)}
            </span>
          </div>
        ))}
      </div>

      {totalAlerts === 0 && (
        <div className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-center text-xs text-emerald-800 font-medium">
          ✓ All assigned clients are active and on track! No pending alerts.
        </div>
      )}
    </Card>
  )
}

function FeedbackCard({ data }: { data?: StaffDashboardResponse }) {
  const recent = data?.feedbacks?.recent ?? []
  const total = data?.feedbacks?.total ?? recent.length

  return (
    <Card title="Client Feedback & Ratings" icon="💬">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-gray-800">{fmt(total)}</span>
          <span className="text-xs text-gray-400">feedbacks in window</span>
        </div>
      </div>
      {recent.length ? (
        <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
          {recent.slice(0, 5).map((item, index) => (
            <div
              key={item?.id ?? index}
              className="rounded-xl border border-gray-100 bg-gray-50/80 px-3.5 py-2.5 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-800">
                  {item?.user?.name || 'Client'}
                </span>
                {item?.rating !== undefined && (
                  <span className="text-xs font-bold text-amber-500">
                    {'★'.repeat(Math.min(5, Math.max(1, item.rating)))}
                  </span>
                )}
              </div>
              <div className="mt-1 text-xs text-gray-600 line-clamp-2">
                {item?.comments || 'No comments provided.'}
              </div>
              {item?.created_at && (
                <div className="mt-1 text-[10px] text-gray-400">
                  {fmtDate(item.created_at)}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="py-10 text-center">
          <div className="text-2xl mb-1">🌟</div>
          <p className="text-xs text-gray-400">
            No recent feedback from assigned clients.
          </p>
        </div>
      )}
    </Card>
  )
}
