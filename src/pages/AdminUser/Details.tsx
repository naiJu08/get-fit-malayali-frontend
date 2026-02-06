import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'

import Icons from '../../components/common/icons'
import { getAdminDetails, getActivePlanOverview } from './api'
import { Tab, TabContainer } from '../../components/common/tab'
import DetailsInfo from './Details/DetailsInfo'
import Subscriptions from './Details/Subscriptions'
import BodyMeasurements from './Details/BodyMeasurements'
// import BodyComposition from './Details/BodyComposition'
import Vitals from './Details/Vitals'
import Clients from './Details/Clients'
import Reports from './Details/Reports'
import ReminderSettings from './Details/ReminderSettings'
import AdditionalInfo from './Details/AdditionalInfo'
import { useAuthStore } from '../../store/authStore'
import CreateAdmin from './create'

export default function UserDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const loginRole = useAuthStore((s) => s.roleData?.name?.toLowerCase?.())
  const location = useLocation()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string>('')
  const [subscriptionId, setSubscriptionId] = useState<string | number | null>(
    null
  )
  const [editModalOpen, setEditModalOpen] = useState(false)

  const refreshUserDetails = useCallback(() => {
    if (!id) return
    ;(async () => {
      try {
        setLoading(true)
        const res = await getAdminDetails(String(id))
        setData(res)
        setError('')
      } catch (e: any) {
        setError(e?.response?.data?.message || 'Failed to load user')
      } finally {
        setLoading(false)
      }
    })()
  }, [id])

  useEffect(() => {
    refreshUserDetails()
  }, [refreshUserDetails, id])

  const user = data?.user || data || {}
  const isNutritionist = (() => {
    const r = user?.role
    if (r === 2 || r === '2') return true
    const s = String(r || '').toLowerCase()
    return s === 'nutritionist'
  })()

  useEffect(() => {
    let mounted = true

    const run = async () => {
      if (!user?.id || isNutritionist) return
      if (!user?.subscribed_plan) return
      try {
        const overview = await getActivePlanOverview(user.id)
        if (!mounted) return
        const subId = overview?.subscription?.id
        setSubscriptionId(subId ?? null)
      } catch (e) {
        if (!mounted) return
        // On error (e.g. 404 for no active subscription), still use empty string
        // so subscription_id is present in the downstream requests.
        setSubscriptionId('')
      }
    }

    run()

    return () => {
      mounted = false
    }
  }, [user?.id, isNutritionist])

  const pathBase = useMemo(() => {
    return location.pathname.startsWith('/users/nutritionist')
      ? '/users/nutritionist'
      : '/users'
  }, [location.pathname])

  // URL-driven active tab
  const urlTab = useMemo(() => {
    const parts = location.pathname.split('/').filter(Boolean)
    const last = parts[parts.length - 1]
    // If path ends with the user id (no subpath), redirect to details
    if (last === String(id)) return 'details'
    return last
  }, [location.pathname, id]) as
    | 'details'
    | 'subscriptions'
    | 'clients'
    | 'body'
    | 'body-composition'
    | 'vitals'
    | 'reports'
    | 'reminders'
    | 'additional-info'

  useEffect(() => {
    if (location.pathname === `/users/${id}`) {
      navigate(`/users/${id}/details`, { replace: true })
    } else if (location.pathname === `/users/nutritionist/${id}`) {
      navigate(`/users/nutritionist/${id}/details`, { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, id, navigate])

  const tabs = useMemo(
    () => [
      { id: 'details', label: 'Details' },
      ...(isNutritionist
        ? [{ id: 'clients', label: 'Clients' }]
        : [
            { id: 'subscriptions', label: 'Subscriptions' },
            { id: 'body', label: 'Body measurements' },
            // { id: 'body-composition', label: 'Body composition' },
            { id: 'vitals', label: 'Vitals' },
            { id: 'reminders', label: 'Reminder settings' },
            { id: 'additional-info', label: 'Additional information' },
            ...(loginRole !== 'nutritionist'
              ? [{ id: 'reports', label: 'Reports' }]
              : []),
          ]),
    ],
    [isNutritionist, loginRole]
  )

  const handleTabClick = (item: { id: string | number; label: string }) => {
    navigate(`${pathBase}/${id}/${item.id}`)
  }

  return (
    <>
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                navigate(
                  pathBase === '/users/nutritionist'
                    ? '/users/nutritionist'
                    : '/users'
                )
              }
              aria-label="Back"
            >
              <Icons name="left-arrow-icon" />
            </button>
            <h1 className="text-xl font-semibold">
              {isNutritionist ? 'Nutritionist Details' : 'User Details'}
            </h1>
          </div>
        </div>

        <TabContainer
          data={tabs as any}
          activeTab={urlTab}
          onClick={(item: any) => handleTabClick(item)}
        >
          <Tab id="details">
            <DetailsInfo
              user={user}
              loading={loading}
              error={error}
              isNutritionist={isNutritionist}
              onEdit={() => setEditModalOpen(true)}
            />
          </Tab>
          {!isNutritionist && (
            <Tab id="subscriptions">
              <Subscriptions
                id={String(id)}
                user={user}
                loading={loading}
                error={error}
                onRefresh={(fresh: any) => fresh && setData(fresh)}
              />
            </Tab>
          )}
          {!isNutritionist && (
            <Tab id="body">
              <BodyMeasurements user={user} subscriptionId={subscriptionId} />
            </Tab>
          )}
          {/* {!isNutritionist && (
            <Tab id="body-composition">
              <BodyComposition user={user} subscriptionId={subscriptionId} />
            </Tab>
          )} */}
          {!isNutritionist && (
            <Tab id="vitals">
              <Vitals user={user} subscriptionId={subscriptionId} />
            </Tab>
          )}
          {!isNutritionist && (
            <Tab id="reminders">
              <ReminderSettings />
            </Tab>
          )}
          {!isNutritionist && (
            <Tab id="additional-info">
              <AdditionalInfo user={user} />
            </Tab>
          )}
          {!isNutritionist && loginRole !== 'nutritionist' && (
            <Tab id="reports">
              <Reports user={user} subscriptionId={subscriptionId} />
            </Tab>
          )}
          {isNutritionist && (
            <Tab id="clients">
              <Clients user={user} />
            </Tab>
          )}
        </TabContainer>
      </div>

      <CreateAdmin
        isDrawerOpen={editModalOpen}
        handleClose={() => setEditModalOpen(false)}
        handleRefresh={() => refreshUserDetails()}
        edit
        rowData={{ user }}
        activeRole={isNutritionist ? 'nutritionist' : 'user'}
      />
    </>
  )
}
