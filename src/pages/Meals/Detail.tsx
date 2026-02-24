import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Icons from '../../components/common/icons'
import InfoBox from '../../components/app/alertBox/infoBox'
import { getMealDetails } from './api'
import CreateMeal from './create'
import { Icon } from '../../components/common'

const toTitleCase = (value: unknown) => {
  const str = typeof value === 'string' ? value : ''
  if (!str) return str
  return str
    .split(' ')
    .map((word) =>
      word
        ? `${word.charAt(0).toUpperCase()}${word.slice(1).toLowerCase()}`
        : word
    )
    .join(' ')
}

const MealDetail: React.FC = () => {
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

  const loadMealDetails = useCallback(async () => {
    if (!id) return
    try {
      setLoading(true)
      const res = await getMealDetails(String(id))
      if (!isMountedRef.current) return
      setData(res)
      setError('')
    } catch (e: any) {
      if (!isMountedRef.current) return
      setError(e?.response?.data?.message || 'Failed to load meal')
    } finally {
      if (!isMountedRef.current) return
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    loadMealDetails()
  }, [loadMealDetails])

  const meal = data?.meal || data || {}

  const openEditDrawer = () => setEditDrawerOpen(true)
  const closeEditDrawer = () => setEditDrawerOpen(false)
  const handleRefresh = async () => {
    await loadMealDetails()
  }

  return (
    <>
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <button onClick={() => navigate('/meals')} aria-label="Back">
              <Icons name="left-arrow-icon" />
            </button>
            <h1 className="text-xl font-semibold">Food Details</h1>
          </div>
          <button
            type="button"
            className="inline-flex items-center rounded-lg bg-primaryGreen text-white px-4 py-2 text-sm font-medium hover:bg-primaryGreen/90 focus:outline-none focus:ring-2 focus:ring-primaryGreen/50"
            onClick={openEditDrawer}
          >
            <Icon name="edit" />
            Edit Food
          </button>
        </div>

        {loading && (
          <div className="p-6">
            <InfoBox content="Loading meal details..." />
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
              <DetailItem label="Name" value={toTitleCase(meal?.name)} />
              <DetailItem label="Meal Time" value={meal?.meal_time} />
              <DetailItem label="Meal Category" value={meal?.meal_category} />
              <DetailItem label="Serving Unit" value={meal?.serving_unit} />
              <DetailItem
                label="Default Serving Quantity"
                value={meal?.default_serving_quantity}
              />
              <DetailItem
                label="Per Serving Calories"
                value={meal?.per_serving?.calories}
              />
              <DetailItem
                label="Per Serving Protein"
                value={meal?.per_serving?.protein}
              />
              <DetailItem
                label="Per Serving Carbs"
                value={meal?.per_serving?.carbs}
              />
              <DetailItem
                label="Per Serving Fat"
                value={meal?.per_serving?.fat}
              />
              <DetailItem
                label="Per Serving Fiber"
                value={meal?.per_serving?.fiber}
              />
              {/* <DetailItem label="Total Calories" value={meal?.total_calories} /> */}
              <DetailItem label="Notes" value={toTitleCase(meal?.notes)} />
            </div>
          </>
        )}
      </div>

      <CreateMeal
        isDrawerOpen={isEditDrawerOpen}
        handleClose={closeEditDrawer}
        handleRefresh={handleRefresh}
        edit
        rowData={meal}
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
          safeStr(value)
        )}
      </div>
    </div>
  )
}

function safeStr(v: any) {
  if (v === null || v === undefined || v === '') return '--'
  return String(v)
}

export default MealDetail
