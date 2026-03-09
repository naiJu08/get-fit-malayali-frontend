import React, { useEffect, useState, useMemo } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import moment from 'moment'
import InfoBox from '../../../components/app/alertBox/infoBox'
import { getSubscriptionDetails } from '../api'
import { Tab, TabContainer } from '../../../components/common/tab'
import SubscriptionUserSubscriptionsTab from './SubscriptionsTab'
import SubscriptionBodyMeasurementsTab from './BodyMeasurementsTab'
// import SubscriptionBodyCompositionTab from './BodyCompositionTab'
import SubscriptionVitalsTab from './VitalsTab'
import Icons from '../../../components/common/icons'
import ReminderSettings from '../../AdminUser/Details/ReminderSettings'
import AdditionalInfoTab from './AdditionalInfoTab'
import Reports from '../../AdminUser/Details/Reports'

export default function SubscriptionDetailsMain() {
  const { id } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [subscription, setSubscription] = useState<any>(null)

  useEffect(() => {
    let isMounted = true
    setLoading(true)
    setError(null)
    if (id) {
      getSubscriptionDetails(String(id))
        .then((res: any) => {
          if (!isMounted) return
          const sub =
            res?.subscription ??
            res?.data?.subscription ??
            (res?.data && !res?.subscription ? res?.data : null) ??
            res
          setSubscription(sub)
        })
        .catch((err: any) => {
          if (!isMounted) return
          setError(
            err?.response?.data?.error?.message ||
              err?.response?.data?.message ||
              'Failed to load details'
          )
        })
        .finally(() => {
          if (!isMounted) return
          setLoading(false)
        })
    } else {
      setLoading(false)
    }
    return () => {
      isMounted = false
    }
  }, [id])

  const plan = subscription?.plan_details

  const tabs = [
    { id: 'details', label: 'Details' },
    { id: 'subscriptions', label: 'Subscriptions' },
    { id: 'body', label: 'Body measurements' },
    // { id: 'body-composition', label: 'Body composition' },
    { id: 'vitals', label: 'Vitals' },
    { id: 'additional-information', label: 'Nutritional assessment' },
    { id: 'reminders', label: 'Reminder settings' },
    { id: 'reports', label: 'Reports' },
  ] as const

  type TabId = (typeof tabs)[number]['id']

  // Derive active tab from URL like UserDetails/PlanDetails
  const activeTab: TabId = useMemo(() => {
    const path = location.pathname || ''
    const trimmed = path.replace(/\/+$/, '')
    const parts = trimmed.split('/').filter(Boolean)
    const lastSegment = parts[parts.length - 1]
    const allowedTabIds = tabs.map((t) => t.id)
    const derived = lastSegment === String(id) ? 'details' : lastSegment
    return (
      allowedTabIds.includes(derived as TabId) ? derived : 'details'
    ) as TabId
  }, [location.pathname, id])

  // Normalise frozen metadata coming from the API. Different endpoints may
  // return it either inside `freeze_details`, `freeze_info`, or as flat
  // properties like `freeze_reason`.
  const freezeDetailsRaw =
    subscription?.freeze_details ||
    subscription?.freeze_info ||
    subscription?.freeze ||
    null

  const freezeDetails =
    freezeDetailsRaw && typeof freezeDetailsRaw === 'object'
      ? freezeDetailsRaw
      : null

  const freezeReason =
    freezeDetails?.reason ?? subscription?.freeze_reason ?? null
  const freezeStart =
    freezeDetails?.start_date ??
    freezeDetails?.start ??
    subscription?.freeze_start_date ??
    subscription?.freeze_start ??
    null
  const freezeEnd =
    freezeDetails?.end_date ??
    freezeDetails?.end ??
    subscription?.freeze_end_date ??
    subscription?.freeze_end ??
    null
  const freezeUpdatedAt =
    freezeDetails?.updated_at ??
    freezeDetails?.updatedOn ??
    subscription?.freeze_updated_at ??
    null
  const freezeDays: string[] = Array.isArray(subscription?.frozen_days)
    ? subscription?.frozen_days
    : Array.isArray(freezeDetails?.days)
      ? freezeDetails?.days
      : []
  const totalFreezeDays =
    subscription?.total_frozen_days ?? freezeDetails?.total_days ?? null
  const getStatusBadge = (status: string) => {
    const statusColors: { [key: string]: string } = {
      active: 'bg-green-100 text-green-800 border-green-200',
      inactive: 'bg-gray-100 text-gray-800 border-gray-200',
      canceled: 'bg-red-100 text-red-800 border-red-200',
      expired: 'bg-orange-100 text-orange-800 border-orange-200',
      pending: 'bg-blue-100 text-blue-800 border-blue-200',
    }

    const colorClass =
      statusColors[status?.toLowerCase()] ||
      'bg-gray-100 text-gray-800 border-gray-200'

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colorClass}`}
      >
        {status?.toUpperCase() ?? '-'}
      </span>
    )
  }

  // Format date
  const formatDate = (dateString: string) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <InfoBox content={'Loading subscription details...'} />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <InfoBox content={error} />
      </div>
    )
  }

  if (!subscription) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <InfoBox content={'No details found.'} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header Section */}
      <div className="mb-6">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/subscriptions')}
              aria-label="Back"
            >
              <Icons name="left-arrow-icon" />
            </button>
            <h1 className="text-xl font-semibold">Subscription Details</h1>
          </div>
        </div>
      </div>

      <TabContainer
        data={tabs as any}
        activeTab={activeTab}
        onClick={(item: any) => {
          const base = `/subscriptions/${id}`
          if (item.id === 'details') navigate(base)
          else navigate(`${base}/${item.id}`)
        }}
      >
        <Tab id="details">
          {/* Status Banner */}
          <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {subscription?.plan_name || 'Unnamed Plan'}
                  </h3>
                  <p className="text-gray-500 text-sm">
                    {subscription?.user_name
                      ? `For ${subscription.user_name}`
                      : 'No user assigned'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="mb-2">
                  {getStatusBadge(subscription?.status)}
                </div>
                {subscription?.days_remaining !== undefined && (
                  <div className="text-sm text-gray-500">
                    {subscription.days_remaining > 0
                      ? `${subscription.days_remaining} days remaining`
                      : 'Expired'}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* User Information Card */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                  <svg
                    className="w-4 h-4 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
                <h2 className="text-lg font-semibold text-gray-900">
                  User Information
                </h2>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Name</span>
                  <span className="text-gray-900 font-medium">
                    {subscription?.user_name || '-'}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">User ID</span>
                  <span className="text-gray-900 font-mono">
                    {subscription?.user_id || '-'}
                  </span>
                </div>
              </div>
            </div>

            {/* Plan Information Card */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                  <svg
                    className="w-4 h-4 text-green-600"
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
                <h2 className="text-lg font-semibold text-gray-900">
                  Plan Information
                </h2>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Plan Name</span>
                  <span className="text-gray-900 font-medium">
                    {subscription?.plan_name || '-'}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Plan ID</span>
                  <span className="text-gray-900 font-mono">
                    {subscription?.plan_id || '-'}
                  </span>
                </div>
              </div>
            </div>

            {/* Schedule Information Card */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                  <svg
                    className="w-4 h-4 text-purple-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Schedule
                </h2>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Start Date</span>
                  <span className="text-gray-900">
                    {formatDate(subscription?.start_date)}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">End Date</span>
                  <span className="text-gray-900">
                    {formatDate(subscription?.end_date)}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Days Remaining</span>
                  <span
                    className={`font-medium ${
                      subscription?.days_remaining > 30
                        ? 'text-green-600'
                        : subscription?.days_remaining > 0
                          ? 'text-orange-600'
                          : 'text-red-600'
                    }`}
                  >
                    {subscription?.days_remaining ?? '-'}
                  </span>
                </div>
              </div>
            </div>

            {/* Plan Details Card */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                  <svg
                    className="w-4 h-4 text-orange-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Plan Details
                </h2>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Category</span>
                  <span className="text-gray-900">{plan?.category || '-'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Duration</span>
                  <span className="text-gray-900">
                    {plan?.duration_days ? `${plan.duration_days} days` : '-'}
                  </span>
                </div>
                <div className="py-2">
                  <span className="text-gray-600 block mb-2">Description</span>
                  <p className="text-gray-900 text-sm bg-gray-50 rounded-lg p-3">
                    {plan?.description || 'No description available'}
                  </p>
                </div>
              </div>
            </div>

            {freezeDays.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center mb-4">
                  <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center mr-3">
                    <svg
                      className="w-4 h-4 text-red-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z"
                      />
                    </svg>
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Frozen Details
                  </h2>
                </div>
                <div className="space-y-3">
                  {freezeReason && (
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-600">Reason</span>
                      <span className="text-gray-900 text-sm text-right">
                        {freezeReason}
                      </span>
                    </div>
                  )}
                  {totalFreezeDays != null && (
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-600">Total Freeze Days</span>
                      <span className="text-gray-900 text-sm text-right">
                        {totalFreezeDays}
                      </span>
                    </div>
                  )}
                  {freezeStart && (
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-600">Freeze Start Date</span>
                      <span className="text-gray-900 text-sm text-right">
                        {formatDate(freezeStart)}
                      </span>
                    </div>
                  )}
                  {freezeEnd && (
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-600">Freeze End Date</span>
                      <span className="text-gray-900 text-sm text-right">
                        {formatDate(freezeEnd)}
                      </span>
                    </div>
                  )}
                  {freezeUpdatedAt && (
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-600">Freeze Updated At</span>
                      <span className="text-gray-900 text-sm text-right">
                        {formatDate(freezeUpdatedAt)}
                      </span>
                    </div>
                  )}
                  {freezeDays.length > 0 && (
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-600">Frozen Days</span>
                      <span className="text-gray-900 text-sm text-right">
                        {freezeDays
                          .map((day) => moment(day).format('DD-MM-YYYY'))
                          .join(', ')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </Tab>

        <Tab id="subscriptions">
          {activeTab === 'subscriptions' ? (
            <SubscriptionUserSubscriptionsTab subscription={subscription} />
          ) : null}
        </Tab>

        <Tab id="body">
          {activeTab === 'body' ? (
            <SubscriptionBodyMeasurementsTab subscription={subscription} />
          ) : null}
        </Tab>

        {/* <Tab id="body-composition">
          <SubscriptionBodyCompositionTab subscription={subscription} />
        </Tab> */}

        <Tab id="vitals">
          {activeTab === 'vitals' ? (
            <SubscriptionVitalsTab subscription={subscription} />
          ) : null}
        </Tab>

        <Tab id="additional-information">
          {activeTab === 'additional-information' ? (
            <AdditionalInfoTab subscription={subscription} />
          ) : null}
        </Tab>

        <Tab id="reminders">
          {activeTab === 'reminders' ? (
            <ReminderSettings userId={subscription?.user_id} />
          ) : null}
        </Tab>

        <Tab id="reports">
          {activeTab === 'reports' ? (
            <Reports
              user={{
                id: subscription?.user_id,
                name: subscription?.user_name,
              }}
              subscriptionId={subscription?.id}
            />
          ) : null}
        </Tab>
      </TabContainer>
    </div>
  )
}
