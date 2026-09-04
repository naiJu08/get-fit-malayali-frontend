import { useEffect, useState } from 'react'

import InfoBox from '../../../components/app/alertBox/infoBox'
import { getData } from '../../../apis/api.helpers'
import apiUrl from '../../../apis/api.url'

type Props = {
  subscriptionId?: string | number | null
}

type DietHistoryRecord = Record<string, any>

const DietHistory = ({ subscriptionId }: Props) => {
  const [data, setData] = useState<DietHistoryRecord[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!subscriptionId && subscriptionId !== 0) return

    let mounted = true
    const run = async () => {
      try {
        setLoading(true)
        setError(null)
        const res = await getData(
          `${apiUrl.SUBSCRIPTIONS}/${subscriptionId}/diet_template_history`
        )

        if (!mounted) return

        const raw =
          (Array.isArray((res as any)?.diet_template_history)
            ? (res as any).diet_template_history
            : null) ?? (Array.isArray(res) ? (res as any) : [])

        setData(raw)
      } catch (e: any) {
        if (!mounted) return
        const message =
          e?.response?.data?.error?.message ||
          e?.response?.data?.message ||
          e?.message ||
          'Failed to load diet history'
        setError(message)
      } finally {
        if (!mounted) return
        setLoading(false)
      }
    }

    run()

    return () => {
      mounted = false
    }
  }, [subscriptionId])

  if (!subscriptionId && subscriptionId !== 0) {
    return (
      <div className="p-4">
        <InfoBox content="No active subscription found for this user." />
      </div>
    )
  }

  if (loading) {
    return (
      <div className="p-4">
        <InfoBox content="Loading diet history..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4">
        <InfoBox content={error} />
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="p-4">
        <InfoBox content="No diet history found for this subscription." />
      </div>
    )
  }

  const HIDDEN_COLUMNS = new Set([
    'id',
    'diet_plan_template_id',
    'assigned_by_id',
    'created_at',
  ])

  const columns = Object.keys(data[0] || {}).filter(
    (key) => !HIDDEN_COLUMNS.has(key)
  )

  return (
    <div className="p-4">
      <div className="mb-3 text-sm font-semibold text-gray-700">
        Diet template history
      </div>
      <div className="overflow-auto border rounded-lg bg-white">
        <table className="min-w-full text-xs">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((col) => (
                <th
                  key={col}
                  className="px-3 py-2 text-left font-semibold text-gray-700 border-b"
                >
                  {formatHeader(col)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => (
              <tr
                key={idx}
                className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
              >
                {columns.map((col) => (
                  <td key={col} className="px-3 py-2 border-b align-top">
                    {formatCell(row[col])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function formatCell(value: any): string {
  if (value === null || value === undefined) return '--'
  if (typeof value === 'string' || typeof value === 'number') {
    return String(value)
  }
  if (value instanceof Date) {
    return value.toISOString()
  }
  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}

function formatHeader(key: string): string {
  const withSpaces = key.replace(/_/g, ' ')
  return withSpaces
    .split(' ')
    .map((word) =>
      word ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase() : ''
    )
    .join(' ')
}

export default DietHistory
