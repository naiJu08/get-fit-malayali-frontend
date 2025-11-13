import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Icons from '../../components/common/icons'
import InfoBox from '../../components/app/alertBox/infoBox'
import { getRecipeDetails } from './api'

const RecipeDetail: React.FC = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    let mounted = true
    const run = async () => {
      try {
        setLoading(true)
        const res = await getRecipeDetails(String(id))
        if (!mounted) return
        setData(res)
      } catch (e: any) {
        if (!mounted) return
        setError(e?.response?.data?.message || 'Failed to load recipe')
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

  const recipe = data?.recipe || data || {}

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/recipe')} aria-label="Back">
            <Icons name="left-arrow-icon" />
          </button>
          <h1 className="text-xl font-semibold">Recipe Detail</h1>
        </div>
      </div>

      {loading && (
        <div className="p-6">
          <InfoBox content="Loading recipe details..." />
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
            <DetailItem label="Name" value={recipe?.name} />
            <DetailItem label="Description" value={recipe?.description} />
            <DetailItem label="Category" value={recipe?.category} />
            <DetailItem label="Calories" value={recipe?.calories} />
            <DetailItem label="Portion Size" value={recipe?.portion_size} />
            <DetailItem
              label="Low Calorie"
              value={recipe?.low_calorie ? 'Yes' : 'No'}
            />
            <div className="border rounded-lg p-3 bg-white">
              <div className="text-xs text-gray-500 mb-1">Image</div>
              <div className="text-sm">
                {recipe?.image_url ? (
                  <div className="w-[160px] h-[160px] overflow-hidden rounded-md border">
                    <img
                      className="w-full h-full object-cover"
                      src={recipe?.image_url}
                      alt="Recipe"
                    />
                  </div>
                ) : (
                  <span>--</span>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
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

export default RecipeDetail
