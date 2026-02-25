import moment from 'moment'
import { useEffect, useMemo, useState } from 'react'
import InfoBox from '../../../components/app/alertBox/infoBox'
import { DialogModal } from '../../../components/common'
import { Tab, TabContainer } from '../../../components/common/tab'
import { getSubscriptionPlanOverview, getSubscriptionPlanDay } from '../api'

type OverviewDay = {
  date: string
  status?: string
  freeze?: any
  diet_summary?: { total_items?: number }
  workout_summary?: { total_exercises?: number }
  yoga_summary?: { total_exercises?: number }
  meditation_summary?: { total_items?: number }
}

type PlanOverview = {
  user?: { id?: number | string; name?: string; email?: string }
  subscription?: {
    id?: number | string
    plan_id?: number | string
    plan_name?: string
    plan_category?: string
    start_date?: string
    end_date?: string
    status?: string
  }
  plan_duration_days?: number
  days?: OverviewDay[]
}

export default function SubscriptionUserSubscriptionsTab({
  subscription,
}: {
  subscription: any
}) {
  const [overview, setOverview] = useState<PlanOverview | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentMonth, setCurrentMonth] = useState<string>('')
  const [dayDetailOpen, setDayDetailOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [dayDetail, setDayDetail] = useState<any>(null)
  const [dayDetailLoading, setDayDetailLoading] = useState(false)
  const [dayDetailTab, setDayDetailTab] = useState('diet')

  const userId = subscription?.user_id
  const subscriptionId = subscription?.id

  useEffect(() => {
    let mounted = true
    const run = async () => {
      if (!userId || !subscriptionId) return
      try {
        setLoading(true)
        setError(null)
        const res = (await getSubscriptionPlanOverview(
          userId,
          subscriptionId
        )) as PlanOverview
        if (!mounted) return
        setOverview(res)
        const todayStr = moment().format('YYYY-MM-DD')
        const hasToday = Array.isArray(res?.days)
          ? res.days.some((d: OverviewDay) => {
              const dateMatch = d?.date === todayStr
              const statusStr = String(d?.status || '').toLowerCase()
              return dateMatch && statusStr === 'today'
            })
          : false

        if (hasToday) {
          setCurrentMonth(
            moment(todayStr, 'YYYY-MM-DD').startOf('month').format('YYYY-MM')
          )
        } else {
          const sd = res?.subscription?.start_date
          if (sd) {
            setCurrentMonth(
              moment(sd, 'YYYY-MM-DD').startOf('month').format('YYYY-MM')
            )
          } else {
            setCurrentMonth('')
          }
        }
      } catch (e: any) {
        if (!mounted) return
        setOverview(null)
        setError(
          e?.response?.data?.error?.message ||
            e?.response?.data?.message ||
            'Failed to load subscription overview'
        )
      } finally {
        if (!mounted) return
        setLoading(false)
      }
    }
    run()
    return () => {
      mounted = false
    }
  }, [userId, subscriptionId])

  const statusColor = (day: OverviewDay) => {
    if (day?.freeze)
      return 'bg-gradient-to-br from-red-600 to-red-600 text-white border-red-300 shadow-sm'
    const s = String(day?.status || '').toLowerCase()
    if (s === 'today')
      return 'bg-gradient-to-br from-primaryBlue to-primaryBlue text-white border-blue-300 ring-1 ring-blue-200/60 shadow-sm'
    if (s === 'over' || s === 'completed')
      return 'bg-gradient-to-br from-emerald-600 to-emerald-600 text-white border-emerald-300 shadow-sm'
    return 'bg-orange-400 text-white border-gray-200 shadow-sm'
  }

  const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  const monthRange = useMemo(() => {
    if (
      !overview?.subscription?.start_date ||
      !overview?.subscription?.end_date
    )
      return { min: '', max: '' }
    const min = moment(overview.subscription.start_date, 'YYYY-MM-DD')
      .startOf('month')
      .format('YYYY-MM')
    const max = moment(overview.subscription.end_date, 'YYYY-MM-DD')
      .startOf('month')
      .format('YYYY-MM')
    return { min, max }
  }, [overview?.subscription?.start_date, overview?.subscription?.end_date])

  const canPrev = () => {
    const { min } = monthRange
    return currentMonth && min && currentMonth > min
  }
  const canNext = () => {
    const { max } = monthRange
    return currentMonth && max && currentMonth < max
  }

  const goPrev = () => {
    if (!canPrev()) return
    setCurrentMonth(
      moment(currentMonth + '-01')
        .subtract(1, 'month')
        .format('YYYY-MM')
    )
  }
  const goNext = () => {
    if (!canNext()) return
    setCurrentMonth(
      moment(currentMonth + '-01')
        .add(1, 'month')
        .format('YYYY-MM')
    )
  }

  const buildMonthCells = (monthKey: string) => {
    if (
      !overview?.subscription?.start_date ||
      !overview?.subscription?.end_date
    )
      return { title: '', cells: [] as any[] }

    const start = moment(overview.subscription.start_date, 'YYYY-MM-DD')
    const end = moment(overview.subscription.end_date, 'YYYY-MM-DD')
    const monthStart = moment(monthKey + '-01', 'YYYY-MM-DD')
    const daysMap: Record<string, OverviewDay> = {}

    if (Array.isArray(overview?.days)) {
      overview.days.forEach((d: OverviewDay) => {
        daysMap[d.date] = d
      })
    }

    const cells: any[] = []
    const daysInMonth = monthStart.daysInMonth()
    const firstWeekday = monthStart.day() // 0=Sun

    for (let i = 0; i < firstWeekday; i++) {
      cells.push({
        key: `${monthStart.format('YYYY-MM')}-pad-${i}`,
        inRange: false,
      })
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const date = monthStart.clone().date(d)
      const dateStr = date.format('YYYY-MM-DD')
      const inRange =
        date.isSameOrAfter(start, 'day') && date.isSameOrBefore(end, 'day')
      const meta = daysMap[dateStr]
      cells.push({ key: dateStr, label: d, inRange, meta })
    }

    while (cells.length % 7 !== 0) {
      cells.push({
        key: `${monthStart.format('YYYY-MM')}-trail-${cells.length}`,
        inRange: false,
      })
    }

    return { title: monthStart.format('MMMM YYYY'), cells }
  }

  const getDayCellClass = (cell: any) => {
    if (!cell?.inRange)
      return 'text-gray-400 bg-white border-gray-200 opacity-70 cursor-not-allowed'
    if (cell?.meta?.freeze)
      return 'bg-gradient-to-br from-red-600 to-red-600 text-white border-red-300 shadow-sm cursor-not-allowed'
    return statusColor(cell?.meta as OverviewDay)
  }

  const openDayDetail = async (cell: any) => {
    if (!cell?.inRange || !cell?.meta) return
    const meta = cell.meta as OverviewDay
    const dateStr = meta.date || cell.key
    if (!dateStr || !userId || !subscriptionId) return
    try {
      setSelectedDate(dateStr)
      setDayDetailOpen(true)
      setDayDetailTab('diet')
      setDayDetailLoading(true)
      const res = await getSubscriptionPlanDay(
        String(userId),
        String(subscriptionId),
        dateStr
      )
      setDayDetail(res)
    } catch {
      setDayDetail(null)
    } finally {
      setDayDetailLoading(false)
    }
  }

  if (!subscription) {
    return (
      <div className="p-6">
        <InfoBox content="No subscription data available." />
      </div>
    )
  }

  if (loading) {
    return (
      <div className="p-6">
        <InfoBox content="Loading subscription overview..." />
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

  if (!overview || !overview.subscription) {
    return (
      <div className="p-6">
        <InfoBox content="No overview available for this subscription." />
      </div>
    )
  }

  const sub = overview.subscription

  return (
    <>
      <div className="flex flex-col gap-4 p-4">
        <div className="border rounded-lg p-4 bg-white flex items-start justify-between gap-4">
          <div>
            <div className="text-sm font-medium mb-1">
              {sub.plan_name || 'Unnamed Plan'}
            </div>
            <div className="text-xs text-gray-500">
              Category: {sub.plan_category || '—'}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {sub.start_date && sub.end_date ? (
                <>
                  <span>
                    Start Date:{' '}
                    <span className="font-semibold">
                      {moment(sub.start_date).format('MMM D, YYYY')}
                    </span>
                  </span>
                  <span className="mx-2">•</span>
                  <span>
                    End Date:{' '}
                    <span className="font-semibold">
                      {moment(sub.end_date).format('MMM D, YYYY')}
                    </span>
                  </span>
                </>
              ) : null}
            </div>
          </div>
          {sub.plan_id && (
            <a
              href={`/plans/${sub.plan_id}`}
              className="text-xs text-primaryBlue underline whitespace-nowrap mt-1"
            >
              View plan details →
            </a>
          )}
        </div>

        <div className="bg-white border border-gray-300 rounded-lg p-3">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-medium">Plan Calendar</div>
            <div className="flex gap-3 text-xs">
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-primaryBlue inline-block"></span>
                Today
              </div>
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-orange-400 inline-block"></span>
                Upcoming
              </div>
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-green-500 inline-block"></span>
                Complete
              </div>
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-red-400 inline-block"></span>
                Freeze
              </div>
            </div>
          </div>

          {!overview.subscription.start_date ||
          !overview.subscription.end_date ? (
            <div className="text-xs text-gray-500">No calendar data</div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-2">
                <button
                  type="button"
                  onClick={goPrev}
                  disabled={!canPrev()}
                  className={`px-2 py-1 text-xs border rounded ${
                    canPrev()
                      ? 'text-gray-700'
                      : 'text-gray-300 cursor-not-allowed'
                  }`}
                >
                  ◀
                </button>
                <div className="text-xs font-medium">
                  {buildMonthCells(currentMonth).title}
                </div>
                <button
                  type="button"
                  onClick={goNext}
                  disabled={!canNext()}
                  className={`px-2 py-1 text-xs border rounded ${
                    canNext()
                      ? 'text-gray-700'
                      : 'text-gray-300 cursor-not-allowed'
                  }`}
                >
                  ▶
                </button>
              </div>

              {(() => {
                const m = buildMonthCells(currentMonth)
                if (!m.title) {
                  return (
                    <div className="text-xs text-gray-500">
                      No calendar data
                    </div>
                  )
                }
                return (
                  <>
                    <div className="grid grid-cols-7 gap-1 text-[10px] text-gray-500 mb-1 bg-white">
                      {WEEK_DAYS.map((w) => (
                        <div key={w} className="py-1 text-center">
                          {w}
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-7">
                      {m.cells.map((c: any) => (
                        <div
                          key={c.key}
                          className={`relative h-40 border px-2 py-1 text-[14px] transition-colors duration-150 ${getDayCellClass(
                            c
                          )} ${c?.inRange && c?.meta && !c?.meta?.freeze ? 'cursor-pointer' : ''}`}
                          onClick={() => openDayDetail(c)}
                        >
                          <div className="flex flex-col h-full w-full">
                            <div className="flex justify-between">
                              <div className="text-[12px] font-medium">
                                {c?.label ?? ''}
                              </div>
                              <div className="text-[12px] font-medium">
                                Day - {c?.meta?.day_number}
                              </div>
                            </div>
                            {c?.inRange && c?.meta ? (
                              <div className="mt-1 text-[10px] leading-4 space-y-1">
                                <div className="flex items-center justify-between border rounded-[5px] bg-red-100 text-black px-2 py-1">
                                  <span>Diet</span>
                                  <span className="font-medium">
                                    {c?.meta?.diet_summary?.total_items ?? 0}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between border rounded-[5px] bg-violet-200 text-black px-2 py-1">
                                  <span>Workout</span>
                                  <span className="font-medium">
                                    {c?.meta?.workout_summary
                                      ?.total_exercises ?? 0}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between border rounded-[5px] bg-green-200 text-black px-2 py-1">
                                  <span>Yoga</span>
                                  <span className="font-medium">
                                    {c?.meta?.yoga_summary?.total_exercises ??
                                      0}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between border rounded-[5px] bg-blue-200 text-black px-2 py-1">
                                  <span>Meditation</span>
                                  <span className="font-medium">
                                    {c?.meta?.meditation_summary?.total_items ??
                                      0}
                                  </span>
                                </div>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )
              })()}
            </>
          )}
        </div>
      </div>

      <DialogModal
        isOpen={dayDetailOpen}
        onClose={() => setDayDetailOpen(false)}
        title={
          dayDetail
            ? `Plan Day ${safeStr(dayDetail?.day_number)} • ${moment(dayDetail?.date).format('MMM D, YYYY')}`
            : selectedDate
              ? `Day Details • ${moment(selectedDate).format('MMM D, YYYY')}`
              : 'Day Details'
        }
        onSubmit={() => setDayDetailOpen(false)}
        actionLabel="Close"
        actionLoader={false}
        small={false}
        body={
          <div className="flex flex-col gap-4">
            {dayDetailLoading && (
              <div className="text-xs text-gray-500">
                Loading day details...
              </div>
            )}
            {!dayDetailLoading && !dayDetail && (
              <div className="text-xs text-gray-500">No details available.</div>
            )}
            {!dayDetailLoading && dayDetail && (
              <>
                <TabContainer
                  data={[
                    { label: 'Diet', id: 'diet' },
                    { label: 'Workout', id: 'workout' },
                    { label: 'Yoga', id: 'yoga' },
                    { label: 'Meditation', id: 'meditation' },
                  ]}
                  activeTab={dayDetailTab}
                  onClick={(item) => setDayDetailTab(String(item.id))}
                >
                  <Tab id="diet">
                    <div className="max-h-[700px] overflow-y-auto">
                      <div className="border rounded p-3 bg-white">
                        <div className="text-sm font-semibold mb-2">
                          Diet Plans
                        </div>
                        {Array.isArray(dayDetail?.diet_plans) &&
                        dayDetail.diet_plans.length > 0 ? (
                          <div className="flex flex-col gap-2 text-xs">
                            {dayDetail.diet_plans.map((d: any) => {
                              const totalItems = Array.isArray(d?.items)
                                ? d.items.length
                                : 0
                              const completedItems = Array.isArray(
                                d?.item_statuses?.completed_item_ids
                              )
                                ? d.item_statuses.completed_item_ids.length
                                : 0
                              const missedItems = Array.isArray(
                                d?.item_statuses?.not_taken_mandatory_item_ids
                              )
                                ? d.item_statuses.not_taken_mandatory_item_ids
                                    .length
                                : 0
                              const mealStatus = String(
                                d?.actions?.status || ''
                              ).toLowerCase()
                              const mealStatusClass =
                                mealStatus === 'completed'
                                  ? 'text-green-600'
                                  : mealStatus === 'missed' ||
                                      mealStatus === 'failed'
                                    ? 'text-red-600'
                                    : mealStatus === 'today' ||
                                        mealStatus === 'in_progress'
                                      ? 'text-amber-600'
                                      : 'text-gray-700'

                              return (
                                <div
                                  key={`${d?.id}-${d?.sequence_number}`}
                                  className="border rounded px-3 py-2 flex flex-col gap-1"
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex flex-col">
                                      <span className="font-medium">
                                        {d?.meal_time || '--'}
                                      </span>
                                      <span className="text-gray-600">
                                        {d?.meal_name || '--'}
                                      </span>
                                    </div>
                                    <div className="text-right text-[11px] text-gray-600 space-y-0.5">
                                      <div>
                                        <span className="text-gray-500">
                                          Calories:{' '}
                                        </span>
                                        <span className="font-medium text-gray-800">
                                          {d?.calories ?? '--'}
                                        </span>
                                      </div>
                                      <div>
                                        <span className="text-gray-500">
                                          Items:{' '}
                                        </span>
                                        <span className="font-medium text-gray-800">
                                          {totalItems}
                                        </span>
                                        {totalItems > 0 && (
                                          <span className="ml-1 text-[10px] text-gray-500">
                                            ({completedItems} done /{' '}
                                            {missedItems} missed)
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  {d?.actions && (
                                    <div className="mt-1 flex flex-col gap-0.5 border-t pt-1 text-[11px] text-gray-600">
                                      <div className="">
                                        <span className="text-gray-500">
                                          Status
                                        </span>
                                        <span
                                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${mealStatusClass}`}
                                        >
                                          {mealStatus
                                            ? mealStatus
                                                .charAt(0)
                                                .toUpperCase() +
                                              mealStatus.slice(1)
                                            : '--'}
                                        </span>
                                      </div>
                                      <div>
                                        <span className="text-gray-500">
                                          Action date:{' '}
                                        </span>
                                        <span>
                                          {d.actions.action_date || '--'}
                                        </span>
                                      </div>
                                      <div>
                                        <span className="text-gray-500">
                                          Completed at:{' '}
                                        </span>
                                        <span>
                                          {d.actions.completed_at || '--'}
                                        </span>
                                      </div>
                                      <div>
                                        <span className="text-gray-500">
                                          Duration sec:{' '}
                                        </span>
                                        <span>
                                          {d.actions.duration_seconds ?? '--'}
                                        </span>
                                      </div>
                                      <div>
                                        <span className="text-gray-500">
                                          Repeats:{' '}
                                        </span>
                                        <span>
                                          {d.actions.repeat_count ?? '--'}
                                        </span>
                                      </div>
                                      <div>
                                        <span className="text-gray-500">
                                          Watched %:{' '}
                                        </span>
                                        <span>
                                          {d.actions.video_watch_percentage ??
                                            '--'}
                                        </span>
                                      </div>
                                      {d.actions.notes && (
                                        <div>
                                          <span className="text-gray-500">
                                            Notes:{' '}
                                          </span>
                                          <span>{d.actions.notes}</span>
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {Array.isArray(d?.items) &&
                                    d.items.length > 0 && (
                                      <div className="mt-1 border-t pt-1 space-y-1 text-[11px] text-gray-700">
                                        {d.items.map((it: any) => {
                                          const itemStatus = String(
                                            it?.actions?.status || ''
                                          ).toLowerCase()
                                          const itemStatusClass =
                                            itemStatus === 'completed'
                                              ? 'text-green-600'
                                              : itemStatus === 'missed' ||
                                                  itemStatus === 'failed'
                                                ? 'text-red-600'
                                                : itemStatus === 'today' ||
                                                    itemStatus === 'in_progress'
                                                  ? 'text-amber-600'
                                                  : 'text-gray-700'

                                          return (
                                            <div
                                              key={it?.id}
                                              className="flex flex-col gap-0.5 rounded bg-gray-50 px-2 py-1 text-[10px] text-gray-600"
                                            >
                                              <div>
                                                <span className="font-medium">
                                                  Meal :{' '}
                                                </span>
                                                <span>
                                                  {it?.meal_name || '--'}
                                                </span>
                                              </div>
                                              <div>
                                                <span className="font-medium">
                                                  Quantity :{' '}
                                                </span>
                                                <span>
                                                  {it?.quantity} x{' '}
                                                  {it?.serving_unit} (per{' '}
                                                  {it?.serving_quantity})
                                                </span>
                                              </div>
                                              <div>
                                                <span className="font-medium">
                                                  Requirement :{' '}
                                                </span>
                                                <span>
                                                  {it?.requirement || '--'}
                                                </span>
                                              </div>
                                              {it?.per_serving && (
                                                <div>
                                                  <span className="font-medium">
                                                    Per serving :{' '}
                                                  </span>
                                                  <span>
                                                    {it.per_serving.calories ??
                                                      '--'}{' '}
                                                    kcal, P{' '}
                                                    {it.per_serving.protein ??
                                                      '--'}
                                                    , C{' '}
                                                    {it.per_serving.carbs ??
                                                      '--'}
                                                    , F{' '}
                                                    {it.per_serving.fat ?? '--'}
                                                    , Fib{' '}
                                                    {it.per_serving.fiber ??
                                                      '--'}
                                                  </span>
                                                </div>
                                              )}
                                              {it?.actions && (
                                                <div className="mt-0.5 flex flex-col gap-0.5 text-[10px] text-gray-600">
                                                  <div>
                                                    <span className="text-gray-500">
                                                      Status :{' '}
                                                    </span>
                                                    <span
                                                      className={`font-semibold ${itemStatusClass}`}
                                                    >
                                                      {itemStatus
                                                        ? itemStatus
                                                            .charAt(0)
                                                            .toUpperCase() +
                                                          itemStatus.slice(1)
                                                        : '--'}
                                                    </span>
                                                  </div>
                                                  <div>
                                                    <span className="text-gray-500">
                                                      Action date :{' '}
                                                    </span>
                                                    <span>
                                                      {it.actions.action_date ||
                                                        '--'}
                                                    </span>
                                                  </div>
                                                  <div>
                                                    <span className="text-gray-500">
                                                      Completed at :{' '}
                                                    </span>
                                                    <span>
                                                      {it.actions
                                                        .completed_at || '--'}
                                                    </span>
                                                  </div>
                                                  <div>
                                                    <span className="text-gray-500">
                                                      Duration sec :{' '}
                                                    </span>
                                                    <span>
                                                      {it.actions
                                                        .duration_seconds ??
                                                        '--'}
                                                    </span>
                                                  </div>
                                                  <div>
                                                    <span className="text-gray-500">
                                                      Repeats :{' '}
                                                    </span>
                                                    <span>
                                                      {it.actions
                                                        .repeat_count ?? '--'}
                                                    </span>
                                                  </div>
                                                  <div>
                                                    <span className="text-gray-500">
                                                      Watched % :{' '}
                                                    </span>
                                                    <span>
                                                      {it.actions
                                                        .video_watch_percentage ??
                                                        '--'}
                                                    </span>
                                                  </div>
                                                  {it.actions.notes && (
                                                    <div>
                                                      <span className="text-gray-500">
                                                        Notes :{' '}
                                                      </span>
                                                      <span>
                                                        {it.actions.notes}
                                                      </span>
                                                    </div>
                                                  )}
                                                </div>
                                              )}
                                            </div>
                                          )
                                        })}
                                      </div>
                                    )}
                                </div>
                              )
                            })}
                          </div>
                        ) : (
                          <div className="text-xs text-gray-500">
                            No diet items.
                          </div>
                        )}
                      </div>
                    </div>
                  </Tab>

                  <Tab id="workout">
                    <div className="max-h-[700px] overflow-y-auto">
                      <div className="border rounded p-3 bg-white max-h-[500px] overflow-y-auto">
                        <div className="text-sm font-semibold mb-2">
                          Workout Plan
                        </div>
                        {dayDetail?.workout_plan ? (
                          <div className="flex flex-col gap-2 text-xs">
                            <div className="mb-1">
                              <div className="font-medium">
                                {dayDetail?.workout_plan?.title || 'Workout'}
                              </div>
                              {dayDetail?.workout_plan?.description && (
                                <div className="text-gray-600">
                                  {dayDetail.workout_plan.description}
                                </div>
                              )}
                            </div>
                            {Array.isArray(
                              dayDetail?.workout_plan?.exercises
                            ) && dayDetail.workout_plan.exercises.length > 0 ? (
                              <div className="flex flex-col gap-2">
                                {dayDetail.workout_plan.exercises.map(
                                  (ex: any, idx: number) => {
                                    const action = ex?.actions
                                    const durationMinutesFromSeconds =
                                      typeof action?.duration_seconds ===
                                      'number'
                                        ? (
                                            action.duration_seconds / 60
                                          ).toFixed(1)
                                        : null
                                    const workoutStatus = String(
                                      action?.status || ''
                                    ).toLowerCase()
                                    const workoutStatusClass =
                                      workoutStatus === 'completed'
                                        ? 'text-green-600'
                                        : workoutStatus === 'missed' ||
                                            workoutStatus === 'failed'
                                          ? 'text-red-600'
                                          : workoutStatus === 'today' ||
                                              workoutStatus === 'in_progress'
                                            ? 'text-amber-600'
                                            : 'text-gray-700'
                                    return (
                                      <div
                                        key={`${ex?.id}-${idx}`}
                                        className="flex items-center justify-between border rounded px-3 py-2"
                                      >
                                        <div className="flex flex-col">
                                          <span className="font-medium">
                                            {ex?.workout_name
                                              ? ex.workout_name
                                                  .split(' ')
                                                  .map(
                                                    (word: string) =>
                                                      word
                                                        .charAt(0)
                                                        .toUpperCase() +
                                                      word
                                                        .slice(1)
                                                        .toLowerCase()
                                                  )
                                                  .join(' ')
                                              : '--'}
                                          </span>
                                          {ex?.video_url && (
                                            <a
                                              className="text-primaryBlue underline"
                                              href={ex.video_url}
                                              target="_blank"
                                              rel="noreferrer"
                                            >
                                              Video
                                            </a>
                                          )}
                                        </div>
                                        <div className="text-right text-[11px] text-gray-600 space-y-0.5">
                                          {ex?.reps ? (
                                            <div>Reps: {ex.reps}</div>
                                          ) : null}
                                          {ex?.sets ? (
                                            <div>Sets: {ex.sets}</div>
                                          ) : null}
                                          {ex?.duration_minutes ? (
                                            <div>
                                              Duration: {ex.duration_minutes}m
                                            </div>
                                          ) : null}
                                          {action && (
                                            <>
                                              {action.status && (
                                                <div>
                                                  <span className="text-gray-500">
                                                    Status:{' '}
                                                  </span>
                                                  <span
                                                    className={`font-semibold ${workoutStatusClass}`}
                                                  >
                                                    {workoutStatus
                                                      ? workoutStatus
                                                          .charAt(0)
                                                          .toUpperCase() +
                                                        workoutStatus.slice(1)
                                                      : '--'}
                                                  </span>
                                                </div>
                                              )}
                                              {durationMinutesFromSeconds && (
                                                <div>
                                                  <span className="text-gray-500">
                                                    Duration:{' '}
                                                  </span>
                                                  <span className="font-medium text-gray-800">
                                                    {durationMinutesFromSeconds}
                                                    m
                                                  </span>
                                                </div>
                                              )}
                                              {typeof action.duration_seconds ===
                                                'number' && (
                                                <div>
                                                  <span className="text-gray-500">
                                                    Duration sec:{' '}
                                                  </span>
                                                  <span className="font-medium text-gray-800">
                                                    {action.duration_seconds}
                                                  </span>
                                                </div>
                                              )}
                                              {typeof action.repeat_count ===
                                                'number' && (
                                                <div>
                                                  <span className="text-gray-500">
                                                    Repeats:{' '}
                                                  </span>
                                                  <span className="font-medium text-gray-800">
                                                    {action.repeat_count}
                                                  </span>
                                                </div>
                                              )}
                                              {action.video_watch_percentage && (
                                                <div>
                                                  <span className="text-gray-500">
                                                    Watched:{' '}
                                                  </span>
                                                  <span className="font-medium text-gray-800">
                                                    {
                                                      action.video_watch_percentage
                                                    }
                                                    %
                                                  </span>
                                                </div>
                                              )}
                                              {action.notes && (
                                                <div>
                                                  <span className="text-gray-500">
                                                    Notes:{' '}
                                                  </span>
                                                  <span className="font-medium text-gray-800">
                                                    {action.notes}
                                                  </span>
                                                </div>
                                              )}
                                            </>
                                          )}
                                        </div>
                                      </div>
                                    )
                                  }
                                )}
                              </div>
                            ) : (
                              <div className="text-xs text-gray-500">
                                No exercises.
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-xs text-gray-500">
                            No workout plan.
                          </div>
                        )}
                      </div>
                    </div>
                  </Tab>

                  <Tab id="yoga">
                    <div className="max-h-[700px] overflow-y-auto">
                      <div className="border rounded p-3 bg-white max-h-[500px] overflow-y-auto">
                        <div className="text-sm font-semibold mb-2">
                          Yoga Plan
                        </div>
                        {dayDetail?.yoga_plan ? (
                          <div className="flex flex-col gap-2 text-xs">
                            <div className="mb-1">
                              <div className="font-medium">
                                {dayDetail?.yoga_plan?.title || 'Yoga Plan'}
                              </div>
                              {dayDetail?.yoga_plan?.description && (
                                <div className="text-gray-600">
                                  {dayDetail.yoga_plan.description}
                                </div>
                              )}
                            </div>
                            {Array.isArray(dayDetail?.yoga_plan?.exercises) &&
                            dayDetail.yoga_plan.exercises.length > 0 ? (
                              <div className="flex flex-col gap-2">
                                {dayDetail.yoga_plan.exercises.map(
                                  (ex: any, idx: number) => {
                                    const action = ex?.actions
                                    const yogaStatus = String(
                                      action?.status || ''
                                    ).toLowerCase()
                                    const yogaStatusClass =
                                      yogaStatus === 'completed'
                                        ? 'text-green-600'
                                        : yogaStatus === 'missed' ||
                                            yogaStatus === 'failed'
                                          ? 'text-red-600'
                                          : yogaStatus === 'today' ||
                                              yogaStatus === 'in_progress'
                                            ? 'text-amber-600'
                                            : 'text-gray-700'

                                    return (
                                      <div
                                        key={`${ex?.id}-${idx}`}
                                        className="flex items-center justify-between border rounded px-3 py-2"
                                      >
                                        <div className="flex flex-col">
                                          <span className="font-medium">
                                            {ex?.yoga_name
                                              ? ex.yoga_name
                                                  .split(' ')
                                                  .map(
                                                    (word: string) =>
                                                      word
                                                        .charAt(0)
                                                        .toUpperCase() +
                                                      word
                                                        .slice(1)
                                                        .toLowerCase()
                                                  )
                                                  .join(' ')
                                              : '--'}
                                          </span>
                                          {ex?.video_url && (
                                            <a
                                              className="text-primaryBlue underline"
                                              href={ex.video_url}
                                              target="_blank"
                                              rel="noreferrer"
                                            >
                                              Video
                                            </a>
                                          )}
                                        </div>
                                        <div className="text-right text-[11px] text-gray-600 space-y-0.5">
                                          {ex?.yoga_duration_minutes ? (
                                            <div>
                                              Duration:{' '}
                                              {ex.yoga_duration_minutes}m
                                            </div>
                                          ) : ex?.duration_minutes ? (
                                            <div>
                                              Duration: {ex.duration_minutes}m
                                            </div>
                                          ) : null}
                                          {action && (
                                            <>
                                              {action.status && (
                                                <div>
                                                  <span className="text-gray-500">
                                                    Status:{' '}
                                                  </span>
                                                  <span
                                                    className={`font-semibold ${yogaStatusClass}`}
                                                  >
                                                    {yogaStatus
                                                      ? yogaStatus
                                                          .charAt(0)
                                                          .toUpperCase() +
                                                        yogaStatus.slice(1)
                                                      : '--'}
                                                  </span>
                                                </div>
                                              )}
                                              {action.action_date && (
                                                <div>
                                                  <span className="text-gray-500">
                                                    Action date:{' '}
                                                  </span>
                                                  <span>
                                                    {action.action_date}
                                                  </span>
                                                </div>
                                              )}
                                              {action.completed_at && (
                                                <div>
                                                  <span className="text-gray-500">
                                                    Completed at:{' '}
                                                  </span>
                                                  <span>
                                                    {action.completed_at}
                                                  </span>
                                                </div>
                                              )}
                                              {typeof action.duration_seconds ===
                                                'number' && (
                                                <div>
                                                  <span className="text-gray-500">
                                                    Duration sec:{' '}
                                                  </span>
                                                  <span className="font-medium text-gray-800">
                                                    {action.duration_seconds}
                                                  </span>
                                                </div>
                                              )}
                                              {typeof action.repeat_count ===
                                                'number' && (
                                                <div>
                                                  <span className="text-gray-500">
                                                    Repeats:{' '}
                                                  </span>
                                                  <span className="font-medium text-gray-800">
                                                    {action.repeat_count}
                                                  </span>
                                                </div>
                                              )}
                                              {action.video_watch_percentage && (
                                                <div>
                                                  <span className="text-gray-500">
                                                    Watched %:{' '}
                                                  </span>
                                                  <span className="font-medium text-gray-800">
                                                    {
                                                      action.video_watch_percentage
                                                    }
                                                  </span>
                                                </div>
                                              )}
                                              {action.notes && (
                                                <div>
                                                  <span className="text-gray-500">
                                                    Notes:{' '}
                                                  </span>
                                                  <span className="font-medium text-gray-800">
                                                    {action.notes}
                                                  </span>
                                                </div>
                                              )}
                                            </>
                                          )}
                                        </div>
                                      </div>
                                    )
                                  }
                                )}
                              </div>
                            ) : (
                              <div className="text-xs text-gray-500">
                                No yoga exercises.
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-xs text-gray-500">
                            No yoga plan.
                          </div>
                        )}
                      </div>
                    </div>
                  </Tab>

                  <Tab id="meditation">
                    <div className="max-h-[700px] overflow-y-auto">
                      <div className="border rounded p-3 bg-white max-h-[500px] overflow-y-auto">
                        <div className="text-sm font-semibold mb-2">
                          Meditation
                        </div>
                        {Array.isArray(dayDetail?.meditations) &&
                        dayDetail.meditations.length > 0 ? (
                          <div className="flex flex-col gap-2 text-xs">
                            {dayDetail.meditations.map(
                              (m: any, idx: number) => {
                                const action = m?.actions
                                const meditationStatus = String(
                                  action?.status || ''
                                ).toLowerCase()
                                const meditationStatusClass =
                                  meditationStatus === 'completed'
                                    ? 'text-green-600'
                                    : meditationStatus === 'missed' ||
                                        meditationStatus === 'failed'
                                      ? 'text-red-600'
                                      : meditationStatus === 'today' ||
                                          meditationStatus === 'in_progress'
                                        ? 'text-amber-600'
                                        : 'text-gray-700'

                                return (
                                  <div
                                    key={`${m?.id}-${idx}`}
                                    className="flex items-center justify-between border rounded px-3 py-2"
                                  >
                                    <div className="flex flex-col">
                                      <span className="font-medium">
                                        {m?.title
                                          ? m.title
                                              .split(' ')
                                              .map(
                                                (word: string) =>
                                                  word.charAt(0).toUpperCase() +
                                                  word.slice(1).toLowerCase()
                                              )
                                              .join(' ')
                                          : '--'}
                                      </span>
                                      {m?.description && (
                                        <span className="text-gray-600">
                                          {m.description}
                                        </span>
                                      )}
                                      {m?.video_url && (
                                        <a
                                          className="text-primaryBlue underline mt-1"
                                          href={m.video_url}
                                          target="_blank"
                                          rel="noreferrer"
                                        >
                                          Video
                                        </a>
                                      )}
                                    </div>
                                    <div className="text-right text-[11px] text-gray-600 space-y-0.5">
                                      {m?.duration_minutes ? (
                                        <div>
                                          Duration: {m.duration_minutes}m
                                        </div>
                                      ) : null}
                                      {action && (
                                        <>
                                          {action.status && (
                                            <div>
                                              <span className="text-gray-500">
                                                Status:{' '}
                                              </span>
                                              <span
                                                className={`font-semibold ${meditationStatusClass}`}
                                              >
                                                {meditationStatus
                                                  ? meditationStatus
                                                      .charAt(0)
                                                      .toUpperCase() +
                                                    meditationStatus.slice(1)
                                                  : '--'}
                                              </span>
                                            </div>
                                          )}
                                          {action.action_date && (
                                            <div>
                                              <span className="text-gray-500">
                                                Action date:{' '}
                                              </span>
                                              <span>{action.action_date}</span>
                                            </div>
                                          )}
                                          {action.completed_at && (
                                            <div>
                                              <span className="text-gray-500">
                                                Completed at:{' '}
                                              </span>
                                              <span>{action.completed_at}</span>
                                            </div>
                                          )}
                                          {typeof action.duration_seconds ===
                                            'number' && (
                                            <div>
                                              <span className="text-gray-500">
                                                Duration sec:{' '}
                                              </span>
                                              <span className="font-medium text-gray-800">
                                                {action.duration_seconds}
                                              </span>
                                            </div>
                                          )}
                                          {typeof action.repeat_count ===
                                            'number' && (
                                            <div>
                                              <span className="text-gray-500">
                                                Repeats:{' '}
                                              </span>
                                              <span className="font-medium text-gray-800">
                                                {action.repeat_count}
                                              </span>
                                            </div>
                                          )}
                                          {action.video_watch_percentage && (
                                            <div>
                                              <span className="text-gray-500">
                                                Watched %:{' '}
                                              </span>
                                              <span className="font-medium text-gray-800">
                                                {action.video_watch_percentage}
                                              </span>
                                            </div>
                                          )}
                                          {action.notes && (
                                            <div>
                                              <span className="text-gray-500">
                                                Notes:{' '}
                                              </span>
                                              <span className="font-medium text-gray-800">
                                                {action.notes}
                                              </span>
                                            </div>
                                          )}
                                        </>
                                      )}
                                    </div>
                                  </div>
                                )
                              }
                            )}
                          </div>
                        ) : (
                          <div className="text-xs text-gray-500">
                            No meditation items.
                          </div>
                        )}
                      </div>
                    </div>
                  </Tab>
                </TabContainer>
              </>
            )}
          </div>
        }
      />
    </>
  )
}
function safeStr(v: any) {
  if (v === null || v === undefined || v === '') return '--'
  return String(v)
}
