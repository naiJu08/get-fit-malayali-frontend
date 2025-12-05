// import { useState } from 'react'
import moment from 'moment'
import { useBodyMeasurements } from '../api'
import Icons from '../../../components/common/icons'
import { useEffect, useState } from 'react'

export default function BodyMeasurements({
  user,
  subscriptionId,
}: {
  user: any
  subscriptionId?: string | number | null
}) {
  // const [bodyPage, setBodyPage] = useState(1)
  // const [bodyPageSize, setBodyPageSize] = useState(10)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [allItems, setAllItems] = useState<any[]>([])

  const { data: bodyData, isFetching: bodyLoading } = useBodyMeasurements({
    user_id: user?.id,
    subscription_id: subscriptionId ?? undefined,
    page,
    per_page: pageSize,
  } as any)

  const items = allItems
  const totalPages = bodyData?.total_pages ?? 1

  useEffect(() => {
    if (!bodyData?.items) return

    setAllItems((prev) => {
      // on first page, reset; on subsequent pages, append
      if (page === 1) {
        return bodyData.items
      }

      const existingIds = new Set(prev.map((i: any) => i.id))
      const newItems = bodyData.items.filter((i: any) => !existingIds.has(i.id))
      return [...prev, ...newItems]
    })
  }, [bodyData?.items, page])

  return (
    <div className="flex flex-col gap-4">
      {bodyLoading && (
        <div className="p-6 text-sm text-gray-600">Loading measurements...</div>
      )}
      {!bodyLoading && items.length === 0 && (
        <div className="p-10 min-h-[60vh] flex flex-col items-center justify-center text-gray-500">
          <Icons name="no-data-icon" />
          <div className="mt-3 text-sm">No body measurements to display</div>
        </div>
      )}

      {!bodyLoading && items.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4">
            {items.map((row: any) => (
              <div
                key={row.id}
                className="border rounded-xl bg-disabledText p-4 shadow-sm hover:shadow-md transition-shadow duration-150"
              >
                <div className="grid grid-cols-7 gap-3 text-sm">
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
                  {row?.chest != null && (
                    <div className="border rounded-lg p-3 bg-rose-50">
                      <div className="text-[11px] uppercase tracking-wide text-gray-500 flex flex-col items-center gap-1">
                        <Icons name="chest-icon" />
                        <span>Chest</span>
                      </div>
                      <div className="mt-1 text-gray-800 font-semibold text-center">
                        {row?.chest ?? '—'}
                      </div>
                    </div>
                  )}
                  {row?.waist != null && (
                    <div className="border rounded-lg p-3 bg-blue-50">
                      <div className="text-[11px] uppercase tracking-wide text-gray-500 flex flex-col items-center gap-1">
                        <Icons name="waist-icon" />
                        <span>Waist</span>
                      </div>
                      <div className="mt-1 text-gray-800 font-semibold text-center">
                        {row?.waist ?? '—'}
                      </div>
                    </div>
                  )}
                  {row?.hip != null && (
                    <div className="border rounded-lg p-3 bg-amber-50">
                      <div className="text-[11px] uppercase tracking-wide text-gray-500 flex flex-col items-center gap-1">
                        <Icons name="hip-icon" />
                        <span>Hip</span>
                      </div>
                      <div className="mt-1 text-gray-800 font-semibold text-center">
                        {row?.hip ?? '—'}
                      </div>
                    </div>
                  )}
                  {row?.arm != null && (
                    <div className="border rounded-lg p-3 bg-indigo-50">
                      <div className="text-[11px] uppercase tracking-wide text-gray-500 flex flex-col items-center gap-1">
                        <Icons name="arm-icon" />
                        <span>Arm</span>
                      </div>
                      <div className="mt-1 text-gray-800 font-semibold text-center">
                        {row?.arm ?? '—'}
                      </div>
                    </div>
                  )}
                  {row?.thigh != null && (
                    <div className="border rounded-lg p-3 bg-sky-50">
                      <div className="text-[11px] uppercase tracking-wide text-gray-500 flex flex-col items-center gap-1">
                        <Icons name="thigh-icon" />
                        <span>Thigh</span>
                      </div>
                      <div className="mt-1 text-gray-800 font-semibold text-center">
                        {row?.thigh ?? '—'}
                      </div>
                    </div>
                  )}
                  {row?.neck != null && (
                    <div className="border rounded-lg p-3 bg-emerald-50">
                      <div className="text-[11px] uppercase tracking-wide text-gray-500 flex flex-col items-center gap-1">
                        <Icons name="neck-icon" />
                        <span>Neck</span>
                      </div>
                      <div className="mt-1 text-gray-800 font-semibold text-center">
                        {row?.neck ?? '—'}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
      {items.length > 0 && page < totalPages && (
        <div className="flex justify-center mt-2">
          <button
            className="px-4 py-2 border rounded text-sm disabled:opacity-50"
            disabled={bodyLoading}
            onClick={() => {
              if (page < totalPages && !bodyLoading) {
                setPage((p) => p + 1)
              }
            }}
          >
            {bodyLoading ? 'Loading more...' : 'View more'}
          </button>
        </div>
      )}
    </div>
  )
}
