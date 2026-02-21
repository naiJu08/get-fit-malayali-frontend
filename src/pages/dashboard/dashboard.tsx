import { useEffect, useMemo, useState } from 'react'
import { useLayoutStore } from '../../store/layoutStore'
import Icons from '../../components/common/icons'
import { fmtDate } from './dashboard-helpers'
import {
  KPIBanner,
  EngagementChart,
  SubsStatusCard,
  UserRoleCard,
  PlanPopularityCard,
  WorkoutIntensityCard,
  CompletionCard,
  HealthCard,
  VitalsCard,
  BodyMeasurementsCard,
  UserBehaviorCard,
  ActiveUsersCard,
  ContentPerformanceCard,
  StreaksCard,
  DietCard,
  FreezesCard,
  PlanCategoriesCard,
  FeedbacksCard,
  ActivityCard,
} from './dashboard-sections'
import type { DashboardResponse } from './types'

export type { DashboardResponse }

type DashboardProps = {
  data?: DashboardResponse
  loading: boolean
  error: boolean
  onRetry: () => void
}

const TABS = [
  { id: 'overview', label: '📊 Overview', color: '#667eea' },
  { id: 'health', label: '❤️ Health & Body', color: '#fc8181' },
  { id: 'content', label: '🎬 Content & Plans', color: '#48bb78' },
  { id: 'engagement', label: '📈 Engagement', color: '#f6ad55' },
  { id: 'operations', label: '⚙️ Operations', color: '#4299e1' },
]

export default function DashboardView({
  data,
  loading,
  error,
  onRetry,
}: DashboardProps) {
  const { setLayoutType } = useLayoutStore()
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    setLayoutType('sideNav')
  }, [setLayoutType])

  const timeframeLabel = useMemo(() => {
    const s = fmtDate(data?.timeframe?.start_date)
    const e = fmtDate(data?.timeframe?.end_date)
    if (s && e) return `${s} — ${e}`
    return s || e || 'All Time'
  }, [data])

  if (loading) {
    return (
      <div className="db-root">
        <div className="db-shell">
          <div className="db-kpi-grid">
            {Array.from({ length: 8 }).map((_, i) => (
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
              Could not load analytics data. Please retry.
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

  const renderTab = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            <EngagementChart data={data} />
            <div className="db-grid-3">
              <SubsStatusCard data={data} />
              <UserRoleCard data={data} />
              <StreaksCard data={data} />
            </div>
            <div className="db-grid-2">
              <PlanPopularityCard data={data} />
              <ActiveUsersCard data={data} />
            </div>
          </div>
        )
      case 'health':
        return (
          <div className="space-y-6">
            <HealthCard data={data} />
            <div className="db-grid-2">
              <VitalsCard data={data} />
              <BodyMeasurementsCard data={data} />
            </div>
          </div>
        )
      case 'content':
        return (
          <div className="space-y-6">
            <ContentPerformanceCard data={data} />
            <div className="db-grid-3">
              <WorkoutIntensityCard data={data} />
              <PlanCategoriesCard data={data} />
              <FeedbacksCard data={data} />
            </div>
            <DietCard data={data} />
          </div>
        )
      case 'engagement':
        return (
          <div className="space-y-6">
            <CompletionCard data={data} />
            <div className="db-grid-2">
              <ActiveUsersCard data={data} />
              <UserBehaviorCard data={data} />
            </div>
          </div>
        )
      case 'operations':
        return (
          <div className="db-grid-3">
            <ActivityCard data={data} />
            <FreezesCard data={data} />
            <StreaksCard data={data} />
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="db-root">
      <div className="db-shell">
        {/* Header */}
        <div className="db-header">
          <div className="db-header-bg" />
          <div className="relative z-10 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="db-header-eyebrow">Fitness Analytics</p>
              <h1 className="db-header-title">Performance Dashboard</h1>
              <p className="db-header-period">📅 {timeframeLabel}</p>
            </div>
            <div className="flex flex-wrap gap-2 mt-4 lg:mt-0">
              {[
                { label: 'Users', value: data?.users?.total },
                {
                  label: 'Active Subs',
                  value: data?.subscriptions?.active_now,
                },
                { label: 'Workouts', value: data?.workouts?.total },
                {
                  label: 'Meditations',
                  value: data?.meditations?.total_meditations,
                },
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

        {/* KPI Grid */}
        <KPIBanner data={data} />

        {/* Tabs */}
        <div className="db-tabs">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={`db-tab ${activeTab === tab.id ? 'db-tab-active' : 'db-tab-inactive'}`}
              style={
                activeTab === tab.id
                  ? { borderColor: tab.color, color: tab.color }
                  : {}
              }
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="pb-10">{renderTab()}</div>
      </div>
    </div>
  )
}
