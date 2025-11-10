import moment from 'moment'
import { useVitals } from '../api'
import Icons from '../../../components/common/icons'

export default function Vitals({ user }: { user: any }) {
  const { data, isFetching } = useVitals({ user_id: user?.id } as any)
  const items = data?.items || []

  return (
    <div className="flex flex-col gap-4">
      {isFetching && (
        <div className="p-6 text-sm text-gray-600">Loading vitals...</div>
      )}
      {!isFetching && items.length === 0 && (
        <div className="p-6 text-sm text-gray-600">No vitals to display</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4">
        {items.map((row: any) => (
          <div
            key={row.id}
            className="border rounded-xl bg-disabledText p-4 shadow-sm hover:shadow-md transition-shadow duration-150"
          >
            <div className="grid grid-cols-6 gap-3 text-sm">
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
                  <Icons name="heart-rate-icon" />
                  <span>Heart Rate</span>
                </div>
                <div className="mt-1 text-gray-800 font-semibold text-center">
                  {row?.heart_rate != null ? `${row.heart_rate} bpm` : '—'}
                </div>
              </div>
              <div className="border rounded-lg p-3 bg-blue-50">
                <div className="text-[11px] uppercase tracking-wide text-gray-500 flex flex-col items-center gap-1">
                  <Icons name="blood-pressure-icon" />
                  <span>Blood Pressure</span>
                </div>
                <div className="mt-1 text-gray-800 font-semibold text-center">
                  {row?.blood_pressure ?? '—'}
                </div>
              </div>
              <div className="border rounded-lg p-3 bg-amber-50">
                <div className="text-[11px] uppercase tracking-wide text-gray-500 flex flex-col items-center gap-1">
                  <Icons name="sugar-level-icon" />
                  <span>Sugar Level</span>
                </div>
                <div className="mt-1 text-gray-800 font-semibold text-center">
                  {row?.sugar_level != null ? `${row.sugar_level} mg/dL` : '—'}
                </div>
              </div>
              <div className="border rounded-lg p-3 bg-indigo-50">
                <div className="text-[11px] uppercase tracking-wide text-gray-500 flex flex-col items-center gap-1">
                  <Icons name="sleep-time-icon" />
                  <span>Sleep</span>
                </div>
                <div className="mt-1 text-gray-800 font-semibold text-center">
                  {row?.sleep_hours != null ? `${row.sleep_hours} hrs` : '—'}
                </div>
              </div>
              <div className="border rounded-lg p-3 bg-sky-50">
                <div className="text-[11px] uppercase tracking-wide text-gray-500 flex flex-col items-center gap-1">
                  <Icons name="water-intake-icon" />
                  <span>Water Intake</span>
                </div>
                <div className="mt-1 text-gray-800 font-semibold text-center">
                  {row?.water_intake != null ? `${row.water_intake} L` : '—'}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
