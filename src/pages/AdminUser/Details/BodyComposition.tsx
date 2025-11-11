// import { useState } from 'react'
import moment from 'moment'
import { useBodyCompositions } from '../api'
import Icons from '../../../components/common/icons'

export default function BodyComposition({ user }: { user: any }) {
  //   const [page, setPage] = useState(1)
  //   const [pageSize, setPageSize] = useState(10)
  const { data, isFetching } = useBodyCompositions({
    user_id: user?.id,
    // page,
    // per_page: pageSize,
  } as any)
  const items = data?.items || []
  //   const totalPages = data?.total_pages ?? 1
  //   const total = data?.total ?? 0

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

              <div className="border rounded-lg p-3 bg-rose-50">
                <div className="text-[11px] uppercase tracking-wide text-gray-500 flex flex-col items-center gap-1">
                  <Icons name="fat-icon" />
                  <span>Fat %</span>
                </div>
                <div className="mt-1 text-gray-800 font-semibold text-center">
                  {row?.fat_percentage != null ? `${row.fat_percentage}%` : '—'}
                </div>
              </div>
              <div className="border rounded-lg p-3 bg-blue-50">
                <div className="text-[11px] uppercase tracking-wide text-gray-500 flex flex-col items-center gap-1">
                  <Icons name="muscle-mass-icon" />
                  <span>Muscle Mass</span>
                </div>
                <div className="mt-1 text-gray-800 font-semibold text-center">
                  {row?.muscle_mass != null ? `${row.muscle_mass} kg` : '—'}
                </div>
              </div>
              <div className="border rounded-lg p-3 bg-amber-50">
                <div className="text-[11px] uppercase tracking-wide text-gray-500 flex flex-col items-center gap-1">
                  <Icons name="water-bottle-icon" />
                  <span>Hydration</span>
                </div>
                <div className="mt-1 text-gray-800 font-semibold text-center">
                  {row?.hydration != null ? `${row.hydration}%` : '—'}
                </div>
              </div>
              <div className="border rounded-lg p-3 bg-indigo-50">
                <div className="text-[11px] uppercase tracking-wide text-gray-500 flex flex-col items-center gap-1">
                  <Icons name="bone-icon" />
                  <span>Bone Mass</span>
                </div>
                <div className="mt-1 text-gray-800 font-semibold text-center">
                  {row?.bone_mass != null ? `${row.bone_mass} kg` : '—'}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {/* <div className="flex items-center justify-between mt-2">
        <div className="text-xs text-gray-500">
          Page {data?.current_page ?? page} of {totalPages} • {total} records
        </div>
        <div className="flex items-center gap-2">
          <button
            className="px-3 py-1 border rounded text-sm disabled:opacity-50"
            onClick={() => setPage(Math.max(1, (data?.current_page ?? page) - 1))}
            disabled={(data?.current_page ?? page) <= 1 || isFetching}
          >
            Prev
          </button>
          <button
            className="px-3 py-1 border rounded text-sm disabled:opacity-50"
            onClick={() => setPage(Math.min(totalPages, (data?.current_page ?? page) + 1))}
            disabled={(data?.current_page ?? page) >= totalPages || isFetching}
          >
            Next
          </button>
          <select
            className="ml-2 border rounded px-2 py-1 text-sm"
            value={pageSize}
            onChange={(e) => {
              const n = Number(e.target.value)
              setPageSize(n)
              setPage(1)
            }}
          >
            {[10, 20, 30, 50, 100].map((n) => (
              <option key={n} value={n}>
                {n} / page
              </option>
            ))}
          </select>
        </div>
      </div> */}
    </div>
  )
}
