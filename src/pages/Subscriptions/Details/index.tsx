import React, { useEffect, useState, useMemo } from 'react'
import { useLocation, useNavigate, useParams, Link } from 'react-router-dom'
import moment from 'moment'
import InfoBox from '../../../components/app/alertBox/infoBox'
import { getSubscriptionDetails } from '../api'
import { Tab, TabContainer } from '../../../components/common/tab'
import Subscriptions from '../../AdminUser/Details/Subscriptions'
import SubscriptionBodyMeasurementsTab from './BodyMeasurementsTab'
import SubscriptionVitalsTab from './VitalsTab'
import Icons from '../../../components/common/icons'
import ReminderSettings from '../../AdminUser/Details/ReminderSettings'
import AdditionalInfoTab from './AdditionalInfoTab'
import Reports from '../../AdminUser/Details/Reports'
import DietHistory from '../../AdminUser/Details/DietHistory'
import ClientPackagesTab from '../../Sales/ClientPackagesTab'
import { ClientWorkflowFollowUps } from '../../AssignedClients/WorkflowPanels'
import { useAssignedClientForUser } from '../../AssignedClients/api'
import { useAuthStore } from '../../../store/authStore'

const formatDate = (dateString?: string | null) => {
  if (!dateString) return '-'
  return moment(dateString).format('MMM D, YYYY')
}

const formatCurrency = (amount?: number | string | null) => {
  if (amount === undefined || amount === null) return '₹0'
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  return `₹${num.toLocaleString('en-IN')}`
}

export default function SubscriptionDetailsMain() {
  const { id } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [subscription, setSubscription] = useState<any>(null)

  const loginRole = useAuthStore((s: any) => s.roleData?.name?.toLowerCase?.())
  const isSuperAdmin = loginRole === 'superadmin'

  const fetchSubscription = () => {
    if (!id) return
    setLoading(true)
    setError(null)
    getSubscriptionDetails(String(id))
      .then((res: any) => {
        const sub =
          res?.subscription ??
          res?.data?.subscription ??
          (res?.data && !res?.subscription ? res?.data : null) ??
          res
        setSubscription(sub)
      })
      .catch((err: any) => {
        setError(
          err?.response?.data?.error?.message ||
            err?.response?.data?.message ||
            'Failed to load subscription details'
        )
      })
      .finally(() => {
        setLoading(false)
      })
  }

  useEffect(() => {
    fetchSubscription()
  }, [id])

  const plan = subscription?.plan_details || {}
  const user = subscription?.user_details || {}
  const userId = subscription?.user_id || user?.id
  const cycleId =
    subscription?.client_package_cycle_id ||
    subscription?.client_package_cycle?.id

  const { data: workflowAssignment, refetch: refetchWorkflow } =
    useAssignedClientForUser(
      userId ? String(userId) : undefined,
      isSuperAdmin ? 'superadmin' : loginRole,
      cycleId ? String(cycleId) : undefined
    )

  const payments: any[] = Array.isArray(subscription?.payments)
    ? subscription.payments
    : []
  const freezes: any[] = Array.isArray(subscription?.freezes)
    ? subscription.freezes
    : []
  const staffList: any[] = Array.isArray(subscription?.assigned_staff)
    ? subscription.assigned_staff
    : []
  const salesOwner = subscription?.sales_owner
  const proposal = subscription?.proposal_details
  const refund = subscription?.refund_details
  const renewal = subscription?.renewal_details

  const tabs = [
    { id: 'details', label: 'Details' },
    { id: 'subscriptions', label: 'Subscriptions' },
    { id: 'body', label: 'Body measurements' },
    { id: 'vitals', label: 'Vitals' },
    { id: 'additional-information', label: 'Assessment' },
    { id: 'reminders', label: 'Reminder settings' },
    { id: 'diet-history', label: 'Diet history' },
    { id: 'reports', label: 'Reports' },
    { id: 'follow-ups', label: 'Follow-ups' },
    { id: 'packages', label: 'Packages' },
    { id: 'assignments', label: 'Assignments' },
  ] as const

  type TabId = (typeof tabs)[number]['id']

  const activeTab: TabId = useMemo(() => {
    const path = location.pathname || ''
    const trimmed = path.replace(/\/+$/, '')
    const parts = trimmed.split('/').filter(Boolean)
    const lastSegment = parts[parts.length - 1]
    const allowedTabIds = tabs.map((t) => t.id)
    const derived = lastSegment === String(id) ? 'details' : lastSegment
    if (derived === 'additional-info') return 'additional-information'
    return (
      allowedTabIds.includes(derived as TabId) ? derived : 'details'
    ) as TabId
  }, [location.pathname, id])

  const getStatusBadge = (status?: string) => {
    const s = (status || '').toLowerCase()
    switch (s) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800 shadow-2xs">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Active Plan
          </span>
        )
      case 'upcoming':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800 shadow-2xs">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
            Upcoming
          </span>
        )
      case 'paused':
      case 'frozen':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800 shadow-2xs">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            Paused / Frozen
          </span>
        )
      case 'refunded':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800 shadow-2xs">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
            Refunded
          </span>
        )
      case 'expired':
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 shadow-2xs">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
            {s === 'expired' ? 'Expired' : 'Completed'}
          </span>
        )
      case 'canceled':
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800 shadow-2xs">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
            Cancelled
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200 dark:bg-gray-800 dark:text-gray-300 shadow-2xs">
            {status ? status.toUpperCase() : 'PENDING'}
          </span>
        )
    }
  }

  // Calculate timeline progress
  const progressStats = useMemo(() => {
    if (!subscription?.start_date || !subscription?.end_date) {
      return { total: 0, elapsed: 0, percent: 0 }
    }
    const start = moment(subscription.start_date)
    const end = moment(subscription.end_date)
    const now = moment()
    const total = end.diff(start, 'days') + 1
    if (now.isBefore(start)) {
      return { total: Math.max(total, 0), elapsed: 0, percent: 0 }
    }
    if (now.isAfter(end)) {
      return { total: Math.max(total, 0), elapsed: total, percent: 100 }
    }
    const elapsed = now.diff(start, 'days') + 1
    const percent = Math.min(
      Math.max(Math.round((elapsed / (total || 1)) * 100), 0),
      100
    )
    return { total, elapsed, percent }
  }, [subscription?.start_date, subscription?.end_date])

  const totalPaid = useMemo(() => {
    return payments.reduce((acc, p) => acc + (parseFloat(p.amount) || 0), 0)
  }, [payments])

  const findStaffRole = (roleKey: string) => {
    return staffList.find(
      (s) => (s.role || '').toLowerCase() === roleKey.toLowerCase()
    )
  }

  const assignedNutritionist = findStaffRole('nutritionist')
  const assignedPhysio =
    findStaffRole('physiotherapist') || findStaffRole('physio')
  const assignedYogist =
    findStaffRole('yogist') ||
    findStaffRole('yoga_trainer') ||
    findStaffRole('yoga')

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50/60 dark:bg-gray-900 p-6 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-9 w-9 border-b-2 border-blue-600 mb-3" />
        <p className="text-gray-600 dark:text-gray-300 text-xs font-medium">
          Loading subscription details...
        </p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50/60 dark:bg-gray-900 p-6">
        <InfoBox content={error} />
      </div>
    )
  }

  if (!subscription) {
    return (
      <div className="min-h-screen bg-slate-50/60 dark:bg-gray-900 p-6">
        <InfoBox content={'No subscription details found.'} />
      </div>
    )
  }

  const userName = user?.name || subscription?.user_name || 'Client'
  const userInitial = userName.charAt(0).toUpperCase()
  const planName = plan?.name || subscription?.plan_name || 'Subscription Plan'
  const planCategory = plan?.category || 'Weight Loss'
  const planFees = plan?.fees ?? subscription?.plan_fees ?? 0

  return (
    <div className="min-h-screen bg-slate-50/70 dark:bg-gray-950 p-3 sm:p-5 lg:p-6 space-y-4">
      {/* Compact Top Header Card */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200/90 dark:border-gray-800 shadow-2xs p-3.5 sm:p-4 transition-all">
        {/* Row 1: Left (Back, ID, Badges, Title) & Right (Client Mini Pill) */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Left Title & Status */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/subscriptions')}
              className="p-1.5 -ml-1 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800 transition-colors"
              aria-label="Back to Subscriptions"
              title="Back to Subscriptions"
            >
              <Icons name="left-arrow-icon" className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-0.5">
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-gray-800 text-slate-700 dark:text-gray-300 font-mono">
                  #{subscription?.id}
                </span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/70 dark:border-blue-800">
                  {planCategory}
                </span>
                {getStatusBadge(subscription?.status)}
              </div>
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-gray-900 dark:text-white">
                {planName}
              </h1>
            </div>
          </div>

          {/* Right: Client Mini Profile Card */}
          <div className="flex items-center gap-3 bg-slate-50 dark:bg-gray-800/60 border border-gray-200/80 dark:border-gray-700/60 rounded-xl px-3 py-2 self-start md:self-auto">
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={userName}
                className="w-9 h-9 rounded-full object-cover border border-white dark:border-gray-700 shadow-2xs"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#0066CC] to-[#004C99] text-white font-bold text-sm flex items-center justify-center shadow-2xs">
                {userInitial}
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h4 className="text-xs font-bold text-gray-900 dark:text-white truncate max-w-[140px]">
                  {userName}
                </h4>
                <span className="text-[10px] px-1 py-0.2 rounded bg-gray-200/70 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-mono">
                  ID: #{user?.id || subscription?.user_id}
                </span>
              </div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate max-w-[180px]">
                {user?.email || user?.phone_number || '-'}
              </p>
              {user?.phone_number && user?.email && (
                <p className="text-[10px] text-gray-400 dark:text-gray-400">
                  {user.phone_number}
                </p>
              )}
              {subscription?.user_id && (
                <Link
                  to={`/clients/${subscription.user_id}/details`}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                >
                  <span>View Client Profile</span>
                  <svg
                    className="w-2.5 h-2.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M14 5l7 7m0 0l-7 7m7-7H3"
                    />
                  </svg>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Row 2: Compact Metrics Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
          {/* Metric 1: Plan Value */}
          <div className="p-2.5 rounded-lg bg-slate-50/80 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800/80">
            <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400 block">
              Plan Price / Total
            </span>
            <div className="flex items-baseline gap-1.5 my-0.5">
              <span className="text-base font-bold text-gray-900 dark:text-white">
                {formatCurrency(planFees)}
              </span>
              {totalPaid >= planFees && planFees > 0 && (
                <span className="text-[9px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1 py-0.2 rounded">
                  Paid
                </span>
              )}
            </div>
            <span className="text-[10px] text-gray-400 dark:text-gray-400 block">
              Paid: {formatCurrency(totalPaid)}
            </span>
          </div>

          {/* Metric 2: Duration */}
          <div className="p-2.5 rounded-lg bg-slate-50/80 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800/80">
            <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400 block">
              Plan Duration
            </span>
            <span className="text-base font-bold text-gray-900 dark:text-white block my-0.5">
              {plan?.duration_days ? `${plan.duration_days} Days` : '-'}
            </span>
            <span className="text-[10px] text-gray-400 dark:text-gray-400 block truncate">
              {formatDate(subscription?.start_date)} -{' '}
              {formatDate(subscription?.end_date)}
            </span>
          </div>

          {/* Metric 3: Progress */}
          <div className="p-2.5 rounded-lg bg-slate-50/80 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800/80">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400">
                Timeline Progress
              </span>
              <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400">
                {progressStats.percent}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden my-1">
              <div
                className="bg-blue-600 dark:bg-blue-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${progressStats.percent}%` }}
              />
            </div>
            <span className="text-[10px] text-gray-500 dark:text-gray-400 block truncate">
              {subscription?.days_remaining !== undefined
                ? subscription.days_remaining > 0
                  ? `${subscription.days_remaining} days remaining`
                  : 'Completed / Expired'
                : '-'}
            </span>
          </div>

          {/* Metric 4: Freezes */}
          <div className="p-2.5 rounded-lg bg-slate-50/80 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800/80">
            <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400 block">
              Freeze History
            </span>
            <span className="text-base font-bold text-gray-900 dark:text-white block my-0.5">
              {subscription?.total_frozen_days ?? 0} Days
            </span>
            <span className="text-[10px] text-gray-400 dark:text-gray-400 block">
              {freezes.length > 0
                ? `${freezes.length} freeze period(s)`
                : 'No freeze recorded'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Tabs Container */}
      <TabContainer
        data={tabs as any}
        activeTab={activeTab}
        onClick={(item: any) => {
          const base = `/subscriptions/${id}`
          if (item.id === 'details') navigate(base)
          else navigate(`${base}/${item.id}`)
        }}
      >
        {/* Tab 1: Details */}
        <Tab id="details">
          <div className="space-y-4">
            {/* Grid 1: Plan Specs & Financial / Sales Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Card 1: Plan & Package Specifications */}
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200/90 dark:border-gray-800 shadow-2xs p-4 space-y-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900/60 flex items-center justify-center text-blue-600 dark:text-blue-400">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                      Plan & Inclusions
                    </h3>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">
                      Configured package details and inclusions
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between py-1.5 border-b border-gray-100 dark:border-gray-800">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      Category
                    </span>
                    <span className="text-xs font-semibold text-gray-900 dark:text-white">
                      {planCategory}
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-gray-100 dark:border-gray-800">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      Standard Fees
                    </span>
                    <span className="text-xs font-bold text-gray-900 dark:text-white">
                      {formatCurrency(planFees)}
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-gray-100 dark:border-gray-800">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      Duration
                    </span>
                    <span className="text-xs font-semibold text-gray-900 dark:text-white">
                      {plan?.duration_days ? `${plan.duration_days} Days` : '-'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-gray-100 dark:border-gray-800">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      Start & End Dates
                    </span>
                    <span className="text-xs font-medium text-gray-900 dark:text-white">
                      {formatDate(subscription?.start_date)} -{' '}
                      {formatDate(subscription?.end_date)}
                    </span>
                  </div>
                </div>

                {/* Inclusions Checklist */}
                <div>
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1.5">
                    Package Inclusions
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-300 text-[11px] font-medium">
                      <svg
                        className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>Custom Diet Plan</span>
                    </div>

                    <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-300 text-[11px] font-medium">
                      <svg
                        className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>Workout Routine</span>
                    </div>

                    <div
                      className={`flex items-center gap-2 p-2 rounded-lg border text-[11px] font-medium ${
                        plan?.yoga_included
                          ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200/70 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-300'
                          : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 text-gray-400'
                      }`}
                    >
                      {plan?.yoga_included ? (
                        <svg
                          className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="w-3.5 h-3.5 text-gray-400 flex-shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      )}
                      <span>Yoga Included</span>
                    </div>

                    <div
                      className={`flex items-center gap-2 p-2 rounded-lg border text-[11px] font-medium ${
                        plan?.meditation_included
                          ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200/70 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-300'
                          : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 text-gray-400'
                      }`}
                    >
                      {plan?.meditation_included ? (
                        <svg
                          className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="w-3.5 h-3.5 text-gray-400 flex-shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      )}
                      <span>Meditation Guidance</span>
                    </div>
                  </div>
                </div>

                {plan?.description && (
                  <div>
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                      Description
                    </span>
                    <p className="text-xs leading-relaxed text-gray-600 dark:text-gray-300 bg-slate-50 dark:bg-gray-800/50 p-2.5 rounded-lg border border-gray-100 dark:border-gray-800">
                      {plan.description}
                    </p>
                  </div>
                )}
              </div>

              {/* Card 2: Financial & Sales Summary */}
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200/90 dark:border-gray-800 shadow-2xs p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-100 dark:border-emerald-900/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                        Financials & Sales Origin
                      </h3>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400">
                        Payment records and proposal acquisition
                      </p>
                    </div>
                  </div>

                  {salesOwner && (
                    <div className="text-right">
                      <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider block">
                        Sales Owner
                      </span>
                      <span className="text-xs font-semibold text-gray-900 dark:text-white">
                        {salesOwner.name}
                      </span>
                    </div>
                  )}
                </div>

                {/* Proposal Info */}
                {proposal && (
                  <div className="p-2.5 rounded-lg bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-semibold text-blue-900 dark:text-blue-200">
                        Proposal #{proposal.id}
                      </span>
                      <span className="text-blue-600 dark:text-blue-300 block text-[11px] mt-0.5">
                        Created on {formatDate(proposal.created_at)}
                        {proposal.created_by_name
                          ? ` by ${proposal.created_by_name}`
                          : ''}
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 capitalize">
                      {proposal.status}
                    </span>
                  </div>
                )}

                {/* Payments Table */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                      Payment Transactions ({payments.length})
                    </span>
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      Total: {formatCurrency(totalPaid)}
                    </span>
                  </div>

                  {payments.length > 0 ? (
                    <div className="overflow-x-auto rounded-lg border border-gray-100 dark:border-gray-800">
                      <table className="min-w-full text-xs text-left">
                        <thead className="bg-slate-50 dark:bg-gray-800/80 text-gray-500 dark:text-gray-400 font-semibold border-b border-gray-100 dark:border-gray-800">
                          <tr>
                            <th className="py-2 px-2.5">Date</th>
                            <th className="py-2 px-2.5">Mode</th>
                            <th className="py-2 px-2.5">Recorded By</th>
                            <th className="py-2 px-2.5 text-right">Amount</th>
                            <th className="py-2 px-2.5 text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                          {payments.map((pm: any) => (
                            <tr
                              key={pm.id}
                              className="hover:bg-gray-50/50 dark:hover:bg-gray-800/40 transition-colors"
                            >
                              <td className="py-2 px-2.5 font-medium text-gray-900 dark:text-gray-200 whitespace-nowrap">
                                {formatDate(pm.payment_date || pm.created_at)}
                              </td>
                              <td className="py-2 px-2.5 uppercase text-gray-600 dark:text-gray-300 font-mono">
                                {pm.payment_mode || 'N/A'}
                              </td>
                              <td className="py-2 px-2.5 text-gray-600 dark:text-gray-400 truncate max-w-[100px]">
                                {pm.recorded_by_name || '-'}
                              </td>
                              <td className="py-2 px-2.5 text-right font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                                {formatCurrency(pm.amount)}
                              </td>
                              <td className="py-2 px-2.5 text-center">
                                <span className="px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 capitalize">
                                  {pm.status || 'Completed'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-3 rounded-lg bg-slate-50 dark:bg-gray-800/40 border border-dashed border-gray-200 dark:border-gray-700 text-center text-xs text-gray-500">
                      No payment transaction record linked to this subscription.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Grid 2: Care Team & Lifecycle / Requests */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Card 3: Assigned Care Team */}
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200/90 dark:border-gray-800 shadow-2xs p-4 space-y-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/60 border border-purple-100 dark:border-purple-900/60 flex items-center justify-center text-purple-600 dark:text-purple-400">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                      Assigned Care Team
                    </h3>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">
                      Staff responsible for delivering this subscription
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* Nutritionist */}
                  <div className="p-3 rounded-lg border border-gray-100 dark:border-gray-800 bg-slate-50/70 dark:bg-gray-800/40">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-bold text-purple-700 dark:text-purple-400 uppercase tracking-wider">
                        Nutritionist
                      </span>
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${
                          assignedNutritionist
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                        }`}
                      >
                        {assignedNutritionist ? 'Assigned' : 'Unassigned'}
                      </span>
                    </div>
                    {assignedNutritionist ? (
                      <div>
                        <h5 className="text-xs font-bold text-gray-900 dark:text-white truncate">
                          {assignedNutritionist.name}
                        </h5>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                          {assignedNutritionist.email}
                        </p>
                      </div>
                    ) : (
                      <p className="text-[11px] text-gray-400 italic">
                        No nutritionist assigned
                      </p>
                    )}
                  </div>

                  {/* Physiotherapist */}
                  <div className="p-3 rounded-lg border border-gray-100 dark:border-gray-800 bg-slate-50/70 dark:bg-gray-800/40">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider">
                        Physiotherapist
                      </span>
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${
                          assignedPhysio
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                        }`}
                      >
                        {assignedPhysio ? 'Assigned' : 'Unassigned'}
                      </span>
                    </div>
                    {assignedPhysio ? (
                      <div>
                        <h5 className="text-xs font-bold text-gray-900 dark:text-white truncate">
                          {assignedPhysio.name}
                        </h5>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                          {assignedPhysio.email}
                        </p>
                      </div>
                    ) : (
                      <p className="text-[11px] text-gray-400 italic">
                        No physiotherapist assigned
                      </p>
                    )}
                  </div>

                  {/* Yogist */}
                  <div className="p-3 rounded-lg border border-gray-100 dark:border-gray-800 bg-slate-50/70 dark:bg-gray-800/40">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-bold text-teal-700 dark:text-teal-400 uppercase tracking-wider">
                        Yogist
                      </span>
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${
                          assignedYogist
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                        }`}
                      >
                        {assignedYogist ? 'Assigned' : 'Unassigned'}
                      </span>
                    </div>
                    {assignedYogist ? (
                      <div>
                        <h5 className="text-xs font-bold text-gray-900 dark:text-white truncate">
                          {assignedYogist.name}
                        </h5>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                          {assignedYogist.email}
                        </p>
                      </div>
                    ) : (
                      <p className="text-[11px] text-gray-400 italic">
                        No yogist assigned
                      </p>
                    )}
                  </div>

                  {/* Sales Owner */}
                  <div className="p-3 rounded-lg border border-gray-100 dark:border-gray-800 bg-slate-50/70 dark:bg-gray-800/40">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                        Sales Representative
                      </span>
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${
                          salesOwner
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                            : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                        }`}
                      >
                        {salesOwner ? 'Owner' : 'Unassigned'}
                      </span>
                    </div>
                    {salesOwner ? (
                      <div>
                        <h5 className="text-xs font-bold text-gray-900 dark:text-white truncate">
                          {salesOwner.name}
                        </h5>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                          {salesOwner.email}
                        </p>
                      </div>
                    ) : (
                      <p className="text-[11px] text-gray-400 italic">
                        No sales rep assigned
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Card 4: Freeze History & Refund/Renewal Summary */}
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200/90 dark:border-gray-800 shadow-2xs p-4 space-y-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-orange-50 dark:bg-orange-950/60 border border-orange-100 dark:border-orange-900/60 flex items-center justify-center text-orange-600 dark:text-orange-400">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                      Freezes & Requests
                    </h3>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">
                      Pauses, freezes, refund & renewal records
                    </p>
                  </div>
                </div>

                {/* Refund Banner if present */}
                {refund && (
                  <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-rose-800 dark:text-rose-300">
                        Refund Request
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-rose-200 text-rose-800 dark:bg-rose-900 dark:text-rose-200 uppercase">
                        {refund.status}
                      </span>
                    </div>
                    <p className="text-xs text-rose-700 dark:text-rose-300">
                      Amount: {formatCurrency(refund.refund_amount)} • Reason:{' '}
                      {refund.reason || 'N/A'}
                    </p>
                  </div>
                )}

                {/* Renewal Banner if present */}
                {renewal && (
                  <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                        Renewal Request
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-emerald-200 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200 uppercase">
                        {renewal.status}
                      </span>
                    </div>
                    <p className="text-xs text-emerald-700 dark:text-emerald-300">
                      Initiated on {formatDate(renewal.created_at)}
                    </p>
                  </div>
                )}

                {/* Freezes List */}
                <div>
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1.5">
                    Freeze History ({freezes.length})
                  </span>
                  {freezes.length > 0 ? (
                    <div className="space-y-1.5">
                      {freezes.map((fz: any) => (
                        <div
                          key={fz.id}
                          className="p-2.5 rounded-lg bg-slate-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-semibold text-gray-900 dark:text-white">
                              {formatDate(fz.start_date)} -{' '}
                              {formatDate(fz.end_date)}
                            </span>
                            <span className="text-gray-500 dark:text-gray-400 block text-[11px] mt-0.5">
                              {fz.total_days} Days • Reason:{' '}
                              {fz.reason || 'General pause'}
                            </span>
                          </div>
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 capitalize">
                            {fz.status || 'Approved'}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-3 rounded-lg bg-slate-50 dark:bg-gray-800/40 border border-dashed border-gray-200 dark:border-gray-700 text-center text-xs text-gray-500">
                      No freeze periods or pauses have been requested for this
                      subscription.
                    </div>
                  )}
                </div>

                {subscription?.notes && (
                  <div>
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                      Internal Notes
                    </span>
                    <p className="text-xs leading-relaxed text-gray-600 dark:text-gray-300 bg-slate-50 dark:bg-gray-800/50 p-2.5 rounded-lg border border-gray-100 dark:border-gray-800">
                      {subscription.notes}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Tab>

        {/* Tab 2: Subscriptions (Modernized Calendar & Day Drawer) */}
        <Tab id="subscriptions">
          {activeTab === 'subscriptions' && userId ? (
            <Subscriptions
              id={String(userId)}
              user={user}
              loading={false}
              error=""
              onRefresh={fetchSubscription}
              selectedSubscriptionId={subscription?.id}
              selectedCycleId={cycleId ? String(cycleId) : 'legacy'}
              selectedCycle={subscription?.client_package_cycle}
              disableCycleChange={true}
            />
          ) : null}
        </Tab>

        {/* Tab 3: Body Measurements */}
        <Tab id="body">
          {activeTab === 'body' ? (
            <SubscriptionBodyMeasurementsTab subscription={subscription} />
          ) : null}
        </Tab>

        {/* Tab 4: Vitals */}
        <Tab id="vitals">
          {activeTab === 'vitals' ? (
            <SubscriptionVitalsTab subscription={subscription} />
          ) : null}
        </Tab>

        {/* Tab 5: Assessment */}
        <Tab id="additional-information">
          {activeTab === 'additional-information' ? (
            <AdditionalInfoTab subscription={subscription} />
          ) : null}
        </Tab>

        {/* Tab 6: Reminder Settings */}
        <Tab id="reminders">
          {activeTab === 'reminders' && userId ? (
            <ReminderSettings userId={userId} />
          ) : null}
        </Tab>

        {/* Tab 7: Diet History */}
        <Tab id="diet-history">
          {activeTab === 'diet-history' ? (
            <DietHistory subscriptionId={subscription?.id} />
          ) : null}
        </Tab>

        {/* Tab 8: Reports */}
        <Tab id="reports">
          {activeTab === 'reports' ? (
            <Reports
              user={{
                id: userId,
                name: userName,
              }}
              subscriptionId={subscription?.id}
            />
          ) : null}
        </Tab>

        {/* Tab 9: Follow-ups */}
        <Tab id="follow-ups">
          {activeTab === 'follow-ups' && (
            <ClientWorkflowFollowUps
              assignment={workflowAssignment}
              assignmentId={workflowAssignment?.id}
              onRefresh={() => refetchWorkflow()}
            />
          )}
        </Tab>

        {/* Tab 10: Packages */}
        <Tab id="packages">
          {activeTab === 'packages' && userId && (
            <ClientPackagesTab
              clientId={String(userId)}
              canManage={isSuperAdmin}
              apiPrefix="/clients"
              mode="packages"
              selectedCycleId={cycleId ? String(cycleId) : undefined}
            />
          )}
        </Tab>

        {/* Tab 11: Assignments */}
        <Tab id="assignments">
          {activeTab === 'assignments' && userId && (
            <ClientPackagesTab
              clientId={String(userId)}
              canManage={isSuperAdmin}
              apiPrefix="/clients"
              mode="assignments"
              user={user}
              selectedCycleId={cycleId ? String(cycleId) : undefined}
            />
          )}
        </Tab>
      </TabContainer>
    </div>
  )
}
