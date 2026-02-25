import { useEffect, useMemo, useState } from 'react'

import InfoBox from '../../../components/app/alertBox/infoBox'
import { getSubscriptionAdditionalInfo } from '../api'

const fields = [
  { label: 'Subscription Notes', path: 'notes' },
  { label: 'Special Instructions', path: 'special_instructions' },
  { label: 'Payment Status', path: 'payment_status' },
  { label: 'Payment Mode', path: 'payment_mode' },
  { label: 'Invoice Number', path: 'invoice_number' },
  { label: 'Assigned By', path: 'assigned_by_name' },
  { label: 'Assigned On', path: 'assigned_on' },
  { label: 'Billing Address', path: 'billing_address' },
  { label: 'Additional Metadata', path: 'metadata' },
]

const getValue = (source: any, path: string) =>
  path.split('.').reduce((acc: any, key: string) => acc?.[key], source)

const formatValue = (value: any) => {
  if (value === null || value === undefined || value === '') return '--'
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value, null, 2)
    } catch {
      return String(value)
    }
  }
  return String(value)
}

type AdditionalInfoTabProps = {
  subscription?: Record<string, any>
}

export default function AdditionalInfoTab({
  subscription,
}: AdditionalInfoTabProps) {
  const subscriptionId = subscription?.id ?? subscription?.subscription_id
  const userId = subscription?.user_id ?? subscription?.user?.id
  const [info, setInfo] = useState<Record<string, any> | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true
    if (!subscriptionId || !userId) {
      setInfo(null)
      setLoading(false)
      setError(null)
      return
    }

    setLoading(true)
    setError(null)
    getSubscriptionAdditionalInfo(String(userId), String(subscriptionId))
      .then((res: any) => {
        if (!isMounted) return
        const payload =
          res?.data?.additional_information ??
          res?.additional_information ??
          res?.data ??
          res
        setInfo(payload ?? null)
      })
      .catch((err: any) => {
        if (!isMounted) return
        setError(
          err?.response?.data?.error?.message ||
            err?.response?.data?.message ||
            'Unable to load nutritional assessment.'
        )
      })
      .finally(() => {
        if (!isMounted) return
        setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [subscriptionId, userId])

  const hasData = useMemo(() => {
    if (!info) return false
    return fields.some((field) => {
      const value = getValue(info, field.path)
      return value !== null && value !== undefined && value !== ''
    })
  }, [info])

  if (!subscriptionId || !userId) {
    return (
      <div className="p-6">
        <InfoBox content="Subscription information is unavailable." />
      </div>
    )
  }

  if (loading) {
    return (
      <div className="p-6">
        <InfoBox content="Loading nutritional assessment..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <InfoBox content={error} />
      </div>
    )
  }

  if (!hasData) {
    return (
      <div className="p-6">
        <InfoBox content="No nutritional assessment has been recorded for this subscription." />
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {fields.map((field) => (
        <div key={field.path} className="border rounded-lg p-4 bg-white">
          <div className="text-xs text-gray-500 mb-1">{field.label}</div>
          <div className="text-sm text-gray-900">
            {formatValue(getValue(info, field.path))}
          </div>
        </div>
      ))}
    </div>
  )
}
