import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'

import Icons from '../../components/common/icons'
import { getAdminDetails } from './api'
import { Tab, TabContainer } from '../../components/common/tab'
import DetailsInfo from './Details/DetailsInfo'
import Subscriptions from './Details/Subscriptions'
import BodyMeasurements from './Details/BodyMeasurements'
import BodyComposition from './Details/BodyComposition'
import Vitals from './Details/Vitals'
import Clients from './Details/Clients'
import Reports from './Details/Reports'

export default function UserDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    let mounted = true
    const run = async () => {
      try {
        setLoading(true)
        const res = await getAdminDetails(String(id))
        if (!mounted) return
        setData(res)
      } catch (e: any) {
        if (!mounted) return
        setError(e?.response?.data?.message || 'Failed to load user')
      } finally {
        if (!mounted) return
        setLoading(false)
      }
    }
    if (id) run()
    return () => {
      mounted = false
    }
  }, [id])

  const user = data?.user || data || {}
  const isNutritionist = (() => {
    const r = user?.role
    if (r === 2 || r === '2') return true
    const s = String(r || '').toLowerCase()
    return s === 'nutritionist'
  })()

  const pathBase = useMemo(() => {
    return location.pathname.startsWith('/nutritionist')
      ? '/nutritionist'
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

  useEffect(() => {
    if (location.pathname === `/users/${id}`) {
      navigate(`/users/${id}/details`, { replace: true })
    } else if (location.pathname === `/nutritionist/${id}`) {
      navigate(`/nutritionist/${id}/details`, { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, id])

  const tabs = useMemo(
    () => [
      { id: 'details', label: 'Details' },
      ...(isNutritionist
        ? [{ id: 'clients', label: 'Clients' }]
        : [
            { id: 'subscriptions', label: 'Subscriptions' },
            { id: 'body', label: 'Body measurements' },
            { id: 'body-composition', label: 'Body composition' },
            { id: 'vitals', label: 'Vitals' },
            { id: 'reports', label: 'Reports' },
          ]),
    ],
    [isNutritionist]
  )

  const handleTabClick = (item: { id: string | number; label: string }) => {
    navigate(`${pathBase}/${id}/${item.id}`)
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              navigate(pathBase === '/nutritionist' ? '/nutrionist' : '/users')
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
            <BodyMeasurements user={user} />
          </Tab>
        )}
        {!isNutritionist && (
          <Tab id="body-composition">
            <BodyComposition user={user} />
          </Tab>
        )}
        {!isNutritionist && (
          <Tab id="vitals">
            <Vitals user={user} />
          </Tab>
        )}
        {!isNutritionist && (
          <Tab id="reports">
            <Reports user={user} />
          </Tab>
        )}
        {isNutritionist && (
          <Tab id="clients">
            <Clients user={user} />
          </Tab>
        )}
      </TabContainer>
    </div>
  )
}
