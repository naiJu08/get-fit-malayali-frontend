import moment from 'moment'
import { useEffect, useState } from 'react'
import { useBodyCompositions } from '../../AdminUser/api'
import Icons from '../../../components/common/icons'

export default function SubscriptionBodyCompositionTab({
  subscription,
}: {
  subscription: any
}) {
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [allItems, setAllItems] = useState<any[]>([])

  const userId = subscription?.user_id
  const subscriptionId = subscription?.id

  const { data, isFetching } = useBodyCompositions({
    user_id: userId,
    subscription_id: subscriptionId,
    page,
    per_page: pageSize,
  } as any)

  const items = allItems
  const totalPages = data?.total_pages ?? 1

  useEffect(() => {
    if (!data?.items) return

    setAllItems((prev) => {
      // on first page, reset; on subsequent pages, append
      if (page === 1) {
        return data.items
      }

      const existingIds = new Set(prev.map((i: any) => i.id))
      const newItems = data.items.filter((i: any) => !existingIds.has(i.id))
      return [...prev, ...newItems]
    })
  }, [data?.items, page])

  return (
    <div className="flex flex-col gap-4">
      {isFetching && (
        <div className="p-6 text-sm text-gray-600">
          Loading body composition...
        </div>
      )}
      {!isFetching && items.length === 0 && (
        <div className="p-10 min-h-[60vh] flex flex-col items-center justify-center text-gray-500">
          <Icons name="no-data-icon" />
          <div className="mt-3 text-sm">No body composition to display</div>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4">
        {items.map((row: any) => (
          <div
            key={row.id}
            className="border rounded-xl bg-disabledText p-4 shadow-sm hover:shadow-md transition-shadow duration-150"
          >
            <div className="grid grid-cols-5 gap-3 text-sm">
              <div className="rounded-lg p-3 bg-transparent h-full flex flex-col items-center justify-center text-center">
                {row?.recorded_at ? (
                  <>
                    <div className="text-gray-900 font-semibold text-5xl tabular-nums leading-tight mt-2 font-averia">
                      {moment(row.recorded_at).format('YYYY')}
                    </div>
                    <div className="text-gray-700 font-semibold uppercase tracking-wide text-3xl font-averia">
                      {moment(row.recorded_at).format('MMMM')}
                    </div>
                    <div className="text-gray-900 font-bold text-5xl tabular-nums leading-tight font-averia">
                      {moment(row.recorded_at).format('DD')}
                    </div>
                  </>
                ) : (
                  <div className="text-gray-400 text-lg">—</div>
                )}
              </div>
              {row?.fat_percentage != null && (
                <div className="border rounded-lg p-3 bg-rose-50">
                  <div className="text-[11px] uppercase tracking-wide text-gray-500 flex flex-col items-center gap-1">
                    <Icons name="fat-icon" />
                    <span>Fat %</span>
                  </div>
                  <div className="mt-1 text-gray-800 font-semibold text-center">
                    {row?.fat_percentage != null
                      ? `${row.fat_percentage}%`
                      : '—'}
                  </div>
                </div>
              )}
              {row?.muscle_mass != null && (
                <div className="border rounded-lg p-3 bg-blue-50">
                  <div className="text-[11px] uppercase tracking-wide text-gray-500 flex flex-col items-center gap-1">
                    <Icons name="muscle-mass-icon" />
                    <span>Muscle Mass</span>
                  </div>
                  <div className="mt-1 text-gray-800 font-semibold text-center">
                    {row?.muscle_mass != null ? `${row.muscle_mass} kg` : '—'}
                  </div>
                </div>
              )}
              {row?.hydration != null && (
                <div className="border rounded-lg p-3 bg-amber-50">
                  <div className="text-[11px] uppercase tracking-wide text-gray-500 flex flex-col items-center gap-1">
                    <Icons name="water-bottle-icon" />
                    <span>Hydration</span>
                  </div>
                  <div className="mt-1 text-gray-800 font-semibold text-center">
                    {row?.hydration != null ? `${row.hydration}%` : '—'}
                  </div>
                </div>
              )}
              {row?.bone_mass != null && (
                <div className="border rounded-lg p-3 bg-indigo-50">
                  <div className="text-[11px] uppercase tracking-wide text-gray-500 flex flex-col items-center gap-1">
                    <Icons name="bone-icon" />
                    <span>Bone Mass</span>
                  </div>
                  <div className="mt-1 text-gray-800 font-semibold text-center">
                    {row?.bone_mass != null ? `${row.bone_mass} kg` : '—'}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {items.length > 0 && page < totalPages && (
        <div className="flex justify-center mt-2">
          <button
            className="px-4 py-2 border rounded text-sm disabled:opacity-50"
            disabled={isFetching}
            onClick={() => {
              if (page < totalPages && !isFetching) {
                setPage((p) => p + 1)
              }
            }}
          >
            {isFetching ? 'Loading more...' : 'View more'}
          </button>
        </div>
      )}
    </div>
  )
}
