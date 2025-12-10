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
          <h1 className="text-xl font-semibold">Recipe Details</h1>
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
            <DetailItem
              label="Preparation Notes"
              value={recipe?.preparation_notes}
            />
            <DetailItem label="Category" value={recipe?.meal_category} />
            <DetailItem label="Serving Unit" value={recipe?.serving_unit} />
            <DetailItem
              label=" Total Calories"
              value={recipe?.nutrition?.calories ?? recipe?.calories}
            />

            <div className="border rounded-lg p-3 bg-white">
              <div className="text-xs text-gray-500 mb-2">Image</div>
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

            <div className="border rounded-lg p-3 bg-white">
              <div className="text-xs text-gray-500 mb-2">Nutrition</div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-500">Protein: </span>
                  {safeStr(recipe?.nutrition?.protein)}
                </div>
                <div>
                  <span className="text-gray-500">Carbs: </span>
                  {safeStr(recipe?.nutrition?.carbs)}
                </div>
                <div>
                  <span className="text-gray-500">Fat: </span>
                  {safeStr(recipe?.nutrition?.fat)}
                </div>
                <div>
                  <span className="text-gray-500">Fiber: </span>
                  {safeStr(recipe?.nutrition?.fiber)}
                </div>
              </div>
            </div>
          </div>

          {/* Ingredients */}
          <div className="mt-4 border rounded-lg p-3 bg-white">
            <div className="text-xs text-gray-500 mb-2">Ingredients</div>
            {Array.isArray(recipe?.ingredients) &&
            recipe.ingredients.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500">
                      <th className="py-1 pr-4">Name</th>
                      <th className="py-1 pr-4">Quantity</th>
                      <th className="py-1 pr-4">Unit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recipe.ingredients.map((ing: any) => (
                      <tr
                        key={ing?.id ?? `${ing?.name}-${ing?.unit}`}
                        className="border-t"
                      >
                        <td className="py-1 pr-4">{safeStr(ing?.name)}</td>
                        <td className="py-1 pr-4">{safeStr(ing?.quantity)}</td>
                        <td className="py-1 pr-4">{safeStr(ing?.unit)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-sm">--</div>
            )}
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
