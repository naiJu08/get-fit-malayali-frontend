import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import Icons from '../../components/common/icons'
import InfoBox from '../../components/app/alertBox/infoBox'
import { getMealTimingDetails } from './api'
import CreateMealTiming from './create'

const toTitleCase = (value: unknown) => {
  const str = typeof value === 'string' ? value : ''
  if (!str) return str
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

export default function MealTimingDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string>('')
  const [isEditDrawerOpen, setEditDrawerOpen] = useState(false)
  const isMountedRef = useRef(true)

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  const loadMealTiming = useCallback(async () => {
    if (!id) return
    try {
      setLoading(true)
      const res = await getMealTimingDetails(String(id))
      if (!isMountedRef.current) return
      setData(res)
      setError('')
    } catch (e: any) {
      if (!isMountedRef.current) return
      setError(e?.response?.data?.message || 'Failed to load meal timing')
    } finally {
      if (!isMountedRef.current) return
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    loadMealTiming()
  }, [loadMealTiming])

  const mealTiming = data?.meal_timing || {}

  // const openEditDrawer = () => setEditDrawerOpen(true)
  const closeEditDrawer = () => setEditDrawerOpen(false)
  const handleRefresh = async () => {
    await loadMealTiming()
  }

  return (
    <>
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <button onClick={() => navigate('/mealtiming')} aria-label="Back">
              <Icons name="left-arrow-icon" />
            </button>
            <h1 className="text-xl font-semibold">Meal Timing Details</h1>
          </div>
          {/* <button
            type="button"
            className="inline-flex items-center rounded-lg bg-primaryGreen text-white px-4 py-2 text-sm font-medium hover:bg-primaryGreen/90 focus:outline-none focus:ring-2 focus:ring-primaryGreen/50"
            onClick={openEditDrawer}
          >
            <Icons name="edit" />
            Edit Meal Timing
          </button> */}
        </div>

        {loading && (
          <div className="p-6">
            <InfoBox content="Loading meal timing details..." />
          </div>
        )}
        {error && !loading && (
          <div className="p-6">
            <InfoBox content={error} />
          </div>
        )}
        {!loading && !error && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DetailItem label="Name" value={toTitleCase(mealTiming?.name)} />
              <DetailItem label="Time" value={mealTiming?.time} />
              <DetailItem label="Sequence Number" value={mealTiming?.sequence_number} />
              <StatusDetailItem label="Status" value={mealTiming?.status} />
            </div>
          </>
        )}
      </div>

      <CreateMealTiming
        isDrawerOpen={isEditDrawerOpen}
        handleClose={closeEditDrawer}
        handleRefresh={handleRefresh}
        edit
        rowData={mealTiming}
      />
    </>
  )
}

function DetailItem({ label, value }: { label: string; value: any }) {
  const isUrl = typeof value === 'string' && /^https?:\/\/\S+$/i.test(value)
  return (
    <div className="border rounded-lg p-3 bg-white">
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className="text-sm">
        {isUrl ? (
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#2563eb' }}
          >
            {value}
          </a>
        ) : (
          value || '-'
        )}
      </div>
    </div>
  )
}

function StatusDetailItem({ label, value }: { label: string; value: any }) {
  const isActive =
    (typeof value === 'boolean' && value === true) ||
    (typeof value === 'number' && value === 1) ||
    (typeof value === 'string' &&
      (value === '1' ||
        value.toLowerCase() === 'true' ||
        value.toLowerCase() === 'active'))
  return (
    <div className="border rounded-lg p-3 bg-white">
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className="text-sm">
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
            isActive
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-700'
          }`}
        >
          {isActive ? 'Active' : 'Inactive'}
        </span>
      </div>
    </div>
  )
}
