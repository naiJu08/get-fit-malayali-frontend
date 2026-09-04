import { useNavigate } from 'react-router-dom'
import Icons from '../../components/common/icons'
import { useMarketingDashboard } from '../Marketing/api'
import { useSalesDashboard } from '../Sales/api'
import {
  Card,
  DonutChart,
  HintTooltip,
  StatCard,
  fmt,
  fmtDate,
} from './dashboard-helpers'

type Props = {
  mode: 'marketing' | 'sales'
  data?: any
  loading?: boolean
  error?: boolean
  onRetry?: () => void
}

const statusColors: Record<string, string> = {
  assigned: '#4299e1',
  accepted: '#48bb78',
  contacted: '#38b2ac',
  qualified: '#9f7aea',
  confirmation_pending: '#f6ad55',
  converted: '#22c55e',
  lost: '#fc8181',
}
const label = (value: string) =>
  String(value || '--')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())

export default function ModuleDashboard({
  mode,
  data,
  loading,
  error,
  onRetry,
}: Props) {
  const navigate = useNavigate()
  const marketingQuery = useMarketingDashboard(mode === 'marketing')
  const salesQuery = useSalesDashboard(mode === 'sales')
  const query = mode === 'marketing' ? marketingQuery : salesQuery
  data = data || query.data
  loading = loading ?? query.isLoading
  error = error ?? query.isError
  onRetry = onRetry || (() => query.refetch())
  const marketing = mode === 'marketing'
  const title = marketing
    ? 'Marketing Performance Dashboard'
    : 'Sales Performance Dashboard'
  const eyebrow = marketing ? 'Marketing Analytics' : 'Sales Analytics'
  const metrics = data?.metrics || {}
  const leadMetrics = metrics.leads || {}
  const salesMetrics = metrics
  const cards = marketing
    ? [
        {
          title: 'Total Forms',
          value: fmt(metrics.forms?.total),
          sub: `${fmt(metrics.forms?.active)} active`,
          gradient: 'linear-gradient(135deg,#667eea,#764ba2)',
          icon: '📝',
          onClick: () => navigate('/marketing/forms'),
        },
        {
          title: 'Active Campaigns',
          value: fmt(metrics.campaigns?.active),
          sub: `${fmt(metrics.campaigns?.total)} total campaigns`,
          gradient: 'linear-gradient(135deg,#06b6d4,#3b82f6)',
          icon: '📣',
          onClick: () => navigate('/marketing/campaigns'),
        },
        {
          title: 'Captured Leads',
          value: fmt(leadMetrics.total),
          sub: `${fmt(leadMetrics.qualified)} qualified`,
          gradient: 'linear-gradient(135deg,#48bb78,#38b2ac)',
          icon: '👥',
          onClick: () => navigate('/marketing/campaigns'),
        },
        {
          title: 'Converted Leads',
          value: fmt(leadMetrics.converted),
          sub: `${metrics.conversion_rate ?? 0}% conversion rate`,
          gradient: 'linear-gradient(135deg,#f6ad55,#ed8936)',
          icon: '✅',
          onClick: () => navigate('/sales/leads?status=converted'),
        },
      ]
    : [
        {
          title: 'Assigned Leads',
          value: fmt(salesMetrics.assigned_leads),
          sub: `${fmt(salesMetrics.awaiting_acceptance)} awaiting acceptance`,
          gradient: 'linear-gradient(135deg,#667eea,#764ba2)',
          icon: '🎯',
          onClick: () => navigate('/sales/leads'),
        },
        {
          title: 'Active Follow-ups',
          value: fmt(salesMetrics.active_follow_ups),
          sub: 'Contacted and qualified',
          gradient: 'linear-gradient(135deg,#06b6d4,#3b82f6)',
          icon: '📞',
          onClick: () => navigate('/sales/leads'),
        },
        {
          title: 'Awaiting Confirmation',
          value: fmt(salesMetrics.awaiting_client_confirmation),
          sub: 'Client action required',
          gradient: 'linear-gradient(135deg,#f6ad55,#ed8936)',
          icon: '⏳',
          onClick: () => navigate('/sales/leads?status=confirmation_pending'),
        },
        {
          title: 'Converted Clients',
          value: fmt(salesMetrics.converted_clients),
          sub: `${fmt(salesMetrics.active_packages)} active package plans`,
          gradient: 'linear-gradient(135deg,#48bb78,#38b2ac)',
          icon: '✅',
          onClick: () => navigate('/sales/clients'),
        },
      ]

  if (loading)
    return (
      <div className="db-root">
        <div className="db-shell">
          <div className="db-kpi-grid">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-32 animate-pulse rounded-2xl bg-gray-200"
              />
            ))}
          </div>
          <div className="db-grid-2 mt-6">
            <div className="h-80 animate-pulse rounded-2xl bg-gray-200" />
            <div className="h-80 animate-pulse rounded-2xl bg-gray-200" />
          </div>
        </div>
      </div>
    )
  if (error)
    return (
      <div className="db-root">
        <div className="db-shell flex min-h-[60vh] items-center justify-center">
          <div className="max-w-md rounded-2xl bg-white p-10 text-center shadow-md">
            <Icons
              name="danger"
              className="mx-auto mb-4 h-10 w-10 text-red-500"
            />
            <h2 className="mb-2 text-xl font-bold text-gray-900">
              Dashboard unavailable
            </h2>
            <p className="mb-6 text-sm text-gray-500">
              Could not load module analytics.
            </p>
            <button className="db-retry-btn" onClick={onRetry}>
              Retry
            </button>
          </div>
        </div>
      </div>
    )

  const statuses = marketing ? leadMetrics : salesMetrics.status_counts || {}
  const slices = Object.entries(statuses)
    .filter(([key]) => key !== 'total')
    .map(([key, value]) => ({
      label: label(key),
      value: Number(value || 0),
      color: statusColors[key] || '#94a3b8',
    }))
  const recent = marketing ? data?.recent_leads || [] : data?.recent_leads || []

  return (
    <div className="db-root">
      <div className="db-shell">
        <div className="db-header">
          <div className="db-header-bg" />
          <div className="relative z-10 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="db-header-eyebrow">{eyebrow}</p>
              <h1 className="db-header-title">{title}</h1>
              <p className="db-header-period">
                📅 As of {fmtDate(data?.generated_at)}
              </p>
            </div>
            <div className="mt-4 flex flex-wrap gap-2 lg:mt-0">
              <div className="db-header-pill">
                <span className="db-header-pill-label">
                  {marketing ? 'Leads' : 'Follow-ups'}
                </span>
                <span className="db-header-pill-value">
                  {fmt(
                    marketing
                      ? leadMetrics.total
                      : salesMetrics.active_follow_ups
                  )}
                </span>
              </div>
              <div className="db-header-pill">
                <span className="db-header-pill-label">
                  {marketing ? 'Campaigns' : 'Clients'}
                </span>
                <span className="db-header-pill-value">
                  {fmt(
                    marketing
                      ? metrics.campaigns?.total
                      : salesMetrics.converted_clients
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="db-kpi-grid">
          {cards.map((card) => (
            <StatCard key={card.title} {...card} />
          ))}
        </div>
        <div className="db-grid-2 mt-6">
          <Card title={marketing ? 'Lead funnel' : 'Lead pipeline'} icon="📊">
            <div className="flex flex-wrap items-center gap-8">
              <DonutChart
                slices={slices}
                center={
                  <>
                    <strong className="text-2xl text-gray-800">
                      {fmt(
                        marketing
                          ? leadMetrics.total
                          : Object.values(statuses).reduce(
                              (sum: number, value: any) =>
                                sum + Number(value || 0),
                              0
                            )
                      )}
                    </strong>
                    <span className="text-[10px] text-gray-400">
                      Total leads
                    </span>
                  </>
                }
              />
              <div className="min-w-[180px] flex-1 space-y-2">
                {slices.map((slice) => (
                  <div
                    key={slice.label}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="flex items-center gap-2 text-gray-600">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ background: slice.color }}
                      />
                      {slice.label}
                      <HintTooltip
                        text={`${slice.label} leads in the current module scope.`}
                      />
                    </span>
                    <strong className="text-gray-800">
                      {fmt(slice.value)}
                    </strong>
                  </div>
                ))}
              </div>
            </div>
          </Card>
          <Card
            title={marketing ? 'Campaign health' : 'Sales workflow'}
            icon="📈"
          >
            <div className="space-y-4">
              <MetricRow
                label={marketing ? 'Active campaigns' : 'Awaiting acceptance'}
                value={
                  marketing
                    ? metrics.campaigns?.active
                    : salesMetrics.awaiting_acceptance
                }
                hint={
                  marketing
                    ? 'Campaigns currently published or active.'
                    : 'Assigned leads not yet accepted by a sales representative.'
                }
              />
              <MetricRow
                label={marketing ? 'Draft campaigns' : 'Active follow-ups'}
                value={
                  marketing
                    ? metrics.campaigns?.draft
                    : salesMetrics.active_follow_ups
                }
                hint={
                  marketing
                    ? 'Campaigns still being prepared.'
                    : 'Accepted leads requiring ongoing contact.'
                }
              />
              <MetricRow
                label={marketing ? 'Conversion rate' : 'Awaiting confirmation'}
                value={
                  marketing
                    ? `${metrics.conversion_rate ?? 0}%`
                    : salesMetrics.awaiting_client_confirmation
                }
                hint={
                  marketing
                    ? 'Converted leads divided by captured leads.'
                    : 'Leads waiting for client confirmation.'
                }
              />
            </div>
          </Card>
        </div>
        <div className="mt-6">
          <Card
            title={
              marketing ? 'Recent captured leads' : 'Recent assigned leads'
            }
            icon="👥"
          >
            <div className="divide-y divide-gray-100">
              {recent.length ? (
                recent.map((item: any) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() =>
                      navigate(
                        marketing
                          ? `/marketing/campaigns/${item.campaign_id || ''}`
                          : `/sales/leads/${item.id}`
                      )
                    }
                    className="flex w-full items-center justify-between gap-4 py-3 text-left hover:bg-gray-50"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-gray-800">
                        {item.name ||
                          `${item.first_name || ''} ${item.last_name || ''}`.trim() ||
                          `Lead #${item.id}`}
                      </span>
                      <span className="block truncate text-xs text-gray-500">
                        {item.email ||
                          item.campaign?.name ||
                          item.marketing_form?.name ||
                          'No additional information'}
                      </span>
                    </span>
                    <span
                      className="shrink-0 rounded-full px-2.5 py-1 text-xs font-medium"
                      style={{
                        color: statusColors[item.status] || '#64748b',
                        background: `${statusColors[item.status] || '#64748b'}18`,
                      }}
                    >
                      {label(item.status)}
                    </span>
                  </button>
                ))
              ) : (
                <p className="py-8 text-center text-sm text-gray-500">
                  No recent leads in this module scope.
                </p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

function MetricRow({
  label,
  value,
  hint,
}: {
  label: string
  value: any
  hint: string
}) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
      <span className="flex items-center text-sm text-gray-600">
        {label}
        <HintTooltip text={hint} />
      </span>
      <strong className="text-lg text-gray-800">{value ?? '--'}</strong>
    </div>
  )
}
