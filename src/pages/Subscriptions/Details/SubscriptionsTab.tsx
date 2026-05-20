import moment from 'moment'
import { useEffect, useMemo, useState } from 'react'
import { Controller, FormProvider, useForm } from 'react-hook-form'
import InfoBox from '../../../components/app/alertBox/infoBox'
import { DialogModal } from '../../../components/common'
import { Tab, TabContainer } from '../../../components/common/tab'
import CustomDrawer from '../../../components/common/drawer'
import TimeSplitPicker from '../../../components/common/inputs/TimeSplitPicker'
import Icons from '../../../components/common/icons'
import { getSubscriptionPlanOverview, getSubscriptionPlanDay } from '../api'
import { useSnackbarManager } from '../../../components/common/snackbar'
import { useUpdateUserMealTiming } from '../../AdminUser/api'

type DayDetailTab = 'diet' | 'workout' | 'yoga' | 'meditation'

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
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [dayDetail, setDayDetail] = useState<any>(null)
  const [dayDetailLoading, setDayDetailLoading] = useState(false)
  const [dayDetailTab, setDayDetailTab] = useState<DayDetailTab>('diet')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedMealTiming, setSelectedMealTiming] = useState<any>(null)
  const [mealTimeEditOpen, setMealTimeEditOpen] = useState(false)

  const userId = subscription?.user_id
  const subscriptionId = subscription?.id

  const { enqueueSnackbar } = useSnackbarManager()

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
  const mealTimeForm = useForm<{ time: string }>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: { time: '' },
  })

  const templateId =
    dayDetail?.subscription?.diet_plan_template_id ??
    dayDetail?.diet_plan_template_id ??
    dayDetail?.subscription?.diet_plan_template?.id ??
    null

  const refreshDayDetail = async () => {
    if (!userId || !subscriptionId || !selectedDate) return
    try {
      setDayDetailLoading(true)
      const res = await getSubscriptionPlanDay(
        String(userId),
        String(subscriptionId),
        selectedDate
      )
      setDayDetail(res)
    } catch (err) {
      console.error('Failed to refresh subscription day detail', err)
    } finally {
      setDayDetailLoading(false)
    }
  }

  const { mutate: updateUserMealTimingMutate, isLoading: isUpdatingMealTime } =
    useUpdateUserMealTiming(async () => {
      setMealTimeEditOpen(false)
      setSelectedMealTiming(null)
      await refreshDayDetail()
    })

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

  const openMealTimeEdit = (meal: any) => {
    setSelectedMealTiming(meal)
    const time24 = meal?.meal_time_time
      ? moment(meal.meal_time_time, [
          'hh:mm A',
          'h:mm A',
          'HH:mm:ss',
          'HH:mm',
        ]).format('HH:mm:ss')
      : ''

    mealTimeForm.reset({
      time: time24,
    })
    setMealTimeEditOpen(true)
  }

  const closeMealTimeEdit = () => {
    setMealTimeEditOpen(false)
    setSelectedMealTiming(null)
  }

  const getDayCellClass = (cell: any) => {
    if (!cell?.inRange)
      return 'text-gray-400 bg-white border-gray-200 opacity-70 cursor-not-allowed'
    if (cell?.meta?.freeze)
      return 'bg-gradient-to-br from-red-600 to-red-600 text-white border-red-300 shadow-sm cursor-not-allowed'
    return statusColor(cell?.meta as OverviewDay)
  }

  const fetchDayDetail = async (
    dateStr: string,
    focusTab: DayDetailTab = 'diet'
  ) => {
    if (!dateStr || !userId || !subscriptionId) return
    try {
      setSelectedDate(dateStr)
      setDayDetail(null)
      setDayDetailTab(focusTab)
      setDayDetailLoading(true)
      const res = await getSubscriptionPlanDay(
        String(userId),
        String(subscriptionId),
        dateStr
      )
      setDayDetail(res)
      setDrawerOpen(true)
    } catch {
      setDayDetail(null)
    } finally {
      setDayDetailLoading(false)
    }
  }

  const openDayDetail = async (cell: any, focusTab: DayDetailTab = 'diet') => {
    if (!cell?.inRange || !cell?.meta) return
    const meta = cell.meta as OverviewDay
    const dateStr = meta.date || cell.key
    fetchDayDetail(dateStr, focusTab)
  }

  const getActiveDayDate = () => dayDetail?.date || selectedDate

  const canNavigateDayDetail = (direction: 'previous' | 'next') => {
    const activeDate = getActiveDayDate()
    const startDate = overview?.subscription?.start_date
    const endDate = overview?.subscription?.end_date
    if (!activeDate || !startDate || !endDate || dayDetailLoading) return false

    const current = moment(activeDate, 'YYYY-MM-DD', true)
    const boundary = moment(
      direction === 'previous' ? startDate : endDate,
      'YYYY-MM-DD',
      true
    )
    if (!current.isValid() || !boundary.isValid()) return false

    return direction === 'previous'
      ? current.isAfter(boundary, 'day')
      : current.isBefore(boundary, 'day')
  }

  const navigateDayDetail = (direction: 'previous' | 'next') => {
    if (!canNavigateDayDetail(direction)) return
    const activeDate = getActiveDayDate()
    const nextDate = moment(activeDate, 'YYYY-MM-DD')
      .add(direction === 'previous' ? -1 : 1, 'day')
      .format('YYYY-MM-DD')

    setCurrentMonth(moment(nextDate, 'YYYY-MM-DD').format('YYYY-MM'))
    fetchDayDetail(nextDate, dayDetailTab)
  }

  // const activeTabLabel =
  //   dayDetailTab.charAt(0).toUpperCase() + dayDetailTab.slice(1)

  const dayDetailNavigatorLabel = dayDetail
    ? `Plan Day ${safeStr(dayDetail?.day_number)} - ${moment(dayDetail?.date).format('MMM D, YYYY')}`
    : selectedDate
      ? `Day Details - ${moment(selectedDate).format('MMM D, YYYY')}`
      : 'Day Details'

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
                              <div className="text-[12px] font-medium"></div>
                            </div>
                            {c?.meta && (
                              <div className="mt-1 text-[10px] leading-4 space-y-1">
                                <div
                                  className="flex items-center justify-between border rounded-[5px] bg-red-100 text-black px-2 py-1 cursor-pointer hover:bg-red-200 transition-colors"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    openDayDetail(c, 'diet')
                                  }}
                                >
                                  <span>Diet</span>
                                  <span className="font-medium">
                                    {c?.meta?.diet_summary?.total_items ?? 0}
                                  </span>
                                </div>
                                <div
                                  className="flex items-center justify-between border rounded-[5px] bg-violet-200 text-black px-2 py-1 cursor-pointer hover:bg-violet-300 transition-colors"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    openDayDetail(c, 'workout')
                                  }}
                                >
                                  <span>Workout</span>
                                  <span className="font-medium">
                                    {c?.meta?.workout_summary
                                      ?.total_exercises ?? 0}
                                  </span>
                                </div>
                                <div
                                  className="flex items-center justify-between border rounded-[5px] bg-green-200 text-black px-2 py-1 cursor-pointer hover:bg-green-300 transition-colors"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    openDayDetail(c, 'yoga')
                                  }}
                                >
                                  <span>Yoga</span>
                                  <span className="font-medium">
                                    {c?.meta?.yoga_summary?.total_exercises ??
                                      0}
                                  </span>
                                </div>
                                <div
                                  className="flex items-center justify-between border rounded-[5px] bg-blue-200 text-black px-2 py-1 cursor-pointer hover:bg-blue-300 transition-colors"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    openDayDetail(c, 'meditation')
                                  }}
                                >
                                  <span>Meditation</span>
                                  <span className="font-medium">
                                    {c?.meta?.meditation_summary?.total_items ??
                                      0}
                                  </span>
                                </div>
                              </div>
                            )}
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

      {/* Tab Navigation for Drawers */}
      {dayDetail && (
        <div className="bg-white border border-gray-300 rounded-lg p-3 mt-4">
          <TabContainer
            data={[
              { label: 'Diet', id: 'diet' },
              { label: 'Workout', id: 'workout' },
              { label: 'Yoga', id: 'yoga' },
              { label: 'Meditation', id: 'meditation' },
            ]}
            activeTab={dayDetailTab}
            onClick={(item) => {
              setDayDetailTab(String(item.id) as DayDetailTab)
              if (!drawerOpen) {
                setDrawerOpen(true)
              }
            }}
          >
            <Tab id="diet">
              <div className="text-xs text-gray-500">
                Click to view Diet details in drawer
              </div>
            </Tab>
            <Tab id="workout">
              <div className="text-xs text-gray-500">
                Click to view Workout details in drawer
              </div>
            </Tab>
            <Tab id="yoga">
              <div className="text-xs text-gray-500">
                Click to view Yoga details in drawer
              </div>
            </Tab>
            <Tab id="meditation">
              <div className="text-xs text-gray-500">
                Click to view Meditation details in drawer
              </div>
            </Tab>
          </TabContainer>
        </div>
      )}

      {/* Single Drawer with All Tabs */}
      <CustomDrawer
        open={drawerOpen}
        handleClose={() => setDrawerOpen(false)}
        className="w-screen max-w-[1000px]"
        accentHeader
        title={
          <div className="flex w-full items-center gap-3">
            {/* <span className="whitespace-nowrap">
              {activeTabLabel} • Day Details
            </span> */}
            <div className="flex flex-1 items-center justify-center">
              <div className="flex h-9 items-center justify-center gap-3 rounded-lg border border-blue-100 bg-white px-3 shadow-sm">
                <button
                  type="button"
                  aria-label="Previous day"
                  onClick={() => navigateDayDetail('previous')}
                  disabled={!canNavigateDayDetail('previous')}
                  className={`h-7 w-7 flex items-center justify-center transition-colors ${
                    canNavigateDayDetail('previous')
                      ? 'text-gray-700'
                      : 'text-gray-300 cursor-not-allowed'
                  }`}
                >
                  <Icons name="previous-arrow" />
                </button>
                <span className="min-w-[220px] text-center text-sm font-semibold text-primaryText">
                  {dayDetailNavigatorLabel}
                </span>
                <button
                  type="button"
                  aria-label="Next day"
                  onClick={() => navigateDayDetail('next')}
                  disabled={!canNavigateDayDetail('next')}
                  className={`h-7 w-7 flex items-center justify-center transition-colors ${
                    canNavigateDayDetail('next')
                      ? 'text-gray-700'
                      : 'text-gray-300 cursor-not-allowed'
                  }`}
                >
                  <Icons name="next-arrow" />
                </button>
              </div>
            </div>
          </div>
        }
      >
        <div className="flex flex-col gap-4">
          {dayDetailLoading && (
            <div className="text-xs text-gray-500">
              Loading {dayDetailTab} details...
            </div>
          )}
          {!dayDetailLoading && !dayDetail && (
            <div className="text-xs text-gray-500">
              No {dayDetailTab} details available.
            </div>
          )}
          {!dayDetailLoading && dayDetail && (
            <TabContainer
              data={[
                { label: 'Diet', id: 'diet' },
                { label: 'Workout', id: 'workout' },
                { label: 'Yoga', id: 'yoga' },
                { label: 'Meditation', id: 'meditation' },
              ]}
              activeTab={dayDetailTab}
              onClick={(item) =>
                setDayDetailTab(String(item.id) as DayDetailTab)
              }
            >
              <Tab id="diet">
                <div className="max-h-[700px] overflow-y-auto bg-white text-xs">
                  {/* ================= HEADER ================= */}
                  <div className="sticky top-0 z-10 bg-gray-50 p-4 ">
                    <div className="bg-white shadow-md p-4 flex items-center justify-between">
                      <div className="text-sm font-semibold">
                        {dayDetail?.subscription?.diet_plan_template_name ? (
                          <span className="text-primary">
                            {dayDetail?.subscription?.diet_plan_template_name
                              .split(' ')
                              .map(
                                (word: string) =>
                                  word.charAt(0).toUpperCase() +
                                  word.slice(1).toLowerCase()
                              )
                              .join(' ')}
                          </span>
                        ) : (
                          'Diet Plans'
                        )}
                        <div className="text-xs text-gray-600 mt-1 flex gap-3">
                          <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                            Proposed:{' '}
                            {dayDetail?.total_proposed_calories ?? '--'} kcal
                          </span>
                          <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded">
                            Consumed: {dayDetail?.total_consumed_calories ?? 0}{' '}
                            kcal
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ================= MEALS ================= */}
                  {Array.isArray(dayDetail?.diet_plans) &&
                  dayDetail.diet_plans.length > 0 ? (
                    <div className="space-y-3 mt-3 px-4">
                      {dayDetail.diet_plans.map((d: any) => {
                        const totalItems = d?.items?.length || 0
                        const completedItems =
                          d?.item_statuses?.completed_item_ids?.length || 0
                        const missedItems =
                          d?.item_statuses?.not_taken_mandatory_item_ids
                            ?.length || 0

                        const progress =
                          totalItems > 0
                            ? (completedItems / totalItems) * 100
                            : 0

                        return (
                          <div
                            key={`${d?.id}-${d?.sequence_number}`}
                            className="bg-white rounded-xl shadow-sm px-4 py-3"
                          >
                            {/* ---------- Meal Header ---------- */}
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                {/* <div className="text-lg font-semibold text-gray-800">
                                  {d.meal_time} - {d.meal_time_time}
                                </div> */}
                                <div className="flex items-center gap-2">
                                  <div className="text-lg font-semibold text-gray-800">
                                    {d.meal_time} - {d.meal_time_time}
                                  </div>
                                  <button
                                    type="button"
                                    className="p-0"
                                    onClick={() => openMealTimeEdit(d)}
                                    aria-label="Edit meal time"
                                  >
                                    <Icons
                                      name="fab-edit"
                                      className="w-4 h-4 text-[#60A5FA]"
                                    />
                                  </button>
                                </div>

                                {d?.meal_name && (
                                  <div className="text-sm text-gray-600 font-medium">
                                    {d?.meal_name
                                      .split(' ')
                                      .map(
                                        (word: string) =>
                                          word.charAt(0).toUpperCase() +
                                          word.slice(1).toLowerCase()
                                      )
                                      .join(' ')}
                                  </div>
                                )}
                                {d?.notes && (
                                  <div className="text-[10px] text-gray-500 mt-1">
                                    Notes: {d.notes}
                                  </div>
                                )}
                              </div>

                              <div className="text-right">
                                <div className="text-sm font-semibold text-gray-700">
                                  {(() => {
                                    const totalConsumedCalories =
                                      d?.items?.reduce(
                                        (sum: number, item: any) =>
                                          sum +
                                          (item?.actions?.consumed_calories ||
                                            0),
                                        0
                                      ) || 0
                                    const otherConsumedCalories =
                                      d?.other_consumed_items?.reduce(
                                        (sum: number, item: any) =>
                                          sum + (item?.consumed_calories || 0),
                                        0
                                      ) || 0
                                    const totalCalories =
                                      totalConsumedCalories +
                                      otherConsumedCalories
                                    return totalCalories > 0
                                      ? `${totalCalories} kcal`
                                      : `${d?.calories ?? '--'} kcal`
                                  })()}
                                </div>
                                <div className="text-[10px] text-gray-500">
                                  {completedItems}/{totalItems} completed
                                  {missedItems > 0 && (
                                    <span className="text-red-500 ml-1">
                                      • {missedItems} missed
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* ---------- Progress Bar ---------- */}
                            {totalItems > 0 && (
                              <div className="relative w-full h-1.5 bg-gray-200 rounded-full overflow-hidden mt-2">
                                {/* Progress fill */}
                                <div
                                  className="h-full bg-green-500 rounded-full transition-all duration-500"
                                  style={{ width: `${progress}%` }}
                                />

                                {/* Progress Ball */}
                                <div
                                  className="absolute top-1/2 -translate-y-1/2 transition-all duration-500"
                                  style={{ left: `calc(${progress}% - 6px)` }}
                                >
                                  <div className="w-3 h-3 bg-green-600 rounded-full shadow-sm border border-white" />
                                </div>
                              </div>
                            )}

                            {/* ---------- Items ---------- */}
                            {Array.isArray(d?.items) && d.items.length > 0 ? (
                              <div className="mt-3 space-y-2">
                                {d.items.map((it: any) => {
                                  const itemStatus = String(
                                    it?.actions?.status || ''
                                  ).toLowerCase()

                                  const statusColor =
                                    itemStatus === 'completed'
                                      ? 'border-green-500'
                                      : itemStatus === 'missed' ||
                                          itemStatus === 'failed'
                                        ? 'border-red-500'
                                        : itemStatus === 'in_progress'
                                          ? 'border-amber-500'
                                          : 'border-gray-300'

                                  return (
                                    <div
                                      key={it?.id}
                                      className={`border-l-2 ${statusColor} bg-gray-50 rounded-lg px-3 py-2 group relative`}
                                    >
                                      {/* Item Header */}
                                      <div className="flex items-center justify-between">
                                        <div className="text-[11px] font-medium text-gray-800">
                                          {it?.meal_name
                                            .split(' ')
                                            .map(
                                              (word: string) =>
                                                word.charAt(0).toUpperCase() +
                                                word.slice(1).toLowerCase()
                                            )
                                            .join(' ')}
                                        </div>
                                      </div>

                                      {/* Requirement and Planned Info */}
                                      <div className="mt-2 text-[10px] text-gray-600 space-y-1">
                                        <div>
                                          <span className="font-medium">
                                            Requirement:
                                          </span>{' '}
                                          {it?.requirement
                                            ? it.requirement
                                                .split(' ')
                                                .map(
                                                  (word: string) =>
                                                    word
                                                      .charAt(0)
                                                      .toUpperCase() +
                                                    word.slice(1).toLowerCase()
                                                )
                                                .join(' ')
                                            : '--'}
                                        </div>

                                        <div>
                                          <span className="font-medium">
                                            Planned:
                                          </span>{' '}
                                          {it?.quantity} x {it?.serving_unit}
                                          {it?.serving_quantity &&
                                            it?.serving_quantity !==
                                              it?.quantity &&
                                            ` (${it?.serving_quantity} per serving)`}
                                        </div>
                                      </div>

                                      {/* Hover Content - Always Visible on Hover */}
                                      <div className="absolute left-0 right-0 top-full mt-1 z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                                        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-[10px] text-gray-600 space-y-1">
                                          {it?.per_serving && (
                                            <div className="bg-blue-50 border border-blue-200 rounded p-2">
                                              <div className="font-medium text-blue-800 mb-1">
                                                Per Serving Nutrition:
                                              </div>
                                              <div className="grid grid-cols-2 gap-1">
                                                <div>
                                                  Calories:{' '}
                                                  {it.per_serving.calories ??
                                                    '--'}{' '}
                                                  kcal
                                                </div>
                                                <div>
                                                  Protein:{' '}
                                                  {it.per_serving.protein ??
                                                    '--'}
                                                  g
                                                </div>
                                                <div>
                                                  Carbs:{' '}
                                                  {it.per_serving.carbs ?? '--'}
                                                  g
                                                </div>
                                                <div>
                                                  Fat:{' '}
                                                  {it.per_serving.fat ?? '--'}g
                                                </div>
                                                {it.per_serving.fiber && (
                                                  <div className="col-span-2">
                                                    Fiber:{' '}
                                                    {it.per_serving.fiber}g
                                                  </div>
                                                )}
                                              </div>
                                            </div>
                                          )}

                                          {it?.actions?.consumed_quantity && (
                                            <div className="bg-emerald-50 border border-emerald-200 rounded p-2">
                                              <div className="font-medium text-emerald-800 mb-1">
                                                Consumed:
                                              </div>
                                              <div>
                                                Quantity:{' '}
                                                {it.actions.consumed_quantity}{' '}
                                                {it?.serving_unit}
                                              </div>
                                              {it.actions.consumed_calories !==
                                                undefined && (
                                                <div>
                                                  Calories:{' '}
                                                  {it.actions.consumed_calories}{' '}
                                                  kcal
                                                </div>
                                              )}
                                              {it.actions.consumed_macros && (
                                                <div className="grid grid-cols-2 gap-1 mt-1">
                                                  <div>
                                                    Protein:{' '}
                                                    {it.actions.consumed_macros
                                                      .protein ?? '--'}
                                                    g
                                                  </div>
                                                  <div>
                                                    Carbs:{' '}
                                                    {it.actions.consumed_macros
                                                      .carbs ?? '--'}
                                                    g
                                                  </div>
                                                  <div>
                                                    Fat:{' '}
                                                    {it.actions.consumed_macros
                                                      .fat ?? '--'}
                                                    g
                                                  </div>
                                                  {it.actions.consumed_macros
                                                    .fiber && (
                                                    <div className="col-span-2">
                                                      Fiber:{' '}
                                                      {
                                                        it.actions
                                                          .consumed_macros.fiber
                                                      }
                                                      g
                                                    </div>
                                                  )}
                                                </div>
                                              )}
                                            </div>
                                          )}

                                          {it?.actions?.status && (
                                            <div className="text-[9px] text-gray-500">
                                              <span className="font-medium">
                                                Status:
                                              </span>{' '}
                                              <span
                                                className={`capitalize ${
                                                  it.actions.status ===
                                                  'completed'
                                                    ? 'text-green-600'
                                                    : it.actions.status ===
                                                          'missed' ||
                                                        it.actions.status ===
                                                          'failed'
                                                      ? 'text-red-600'
                                                      : it.actions.status ===
                                                          'in_progress'
                                                        ? 'text-amber-600'
                                                        : 'text-gray-600'
                                                }`}
                                              >
                                                {it.actions.status.replace(
                                                  /_/g,
                                                  ' '
                                                )}
                                              </span>
                                              {it?.actions?.completed_at && (
                                                <span className="ml-2">
                                                  at{' '}
                                                  {new Date(
                                                    it.actions.completed_at
                                                  ).toLocaleTimeString([], {
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                  })}
                                                </span>
                                              )}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            ) : (
                              <div className="mt-4 text-sm text-gray-400 italic">
                                No items defined for this meal.
                              </div>
                            )}

                            {/* ---------- Other Consumed ---------- */}
                            {Array.isArray(d?.other_consumed_items) &&
                              d.other_consumed_items.length > 0 && (
                                <div className="mt-3 border-t pt-2">
                                  <div className="text-[10px] font-semibold text-orange-600 mb-2 uppercase">
                                    Other Items Consumed
                                  </div>

                                  <div className="space-y-2">
                                    {d.other_consumed_items.map(
                                      (extra: any) => (
                                        <div
                                          key={extra?.id}
                                          className="bg-orange-50 border border-orange-200 rounded-lg p-2 group relative"
                                        >
                                          <div className="flex items-start justify-between mb-1">
                                            <div className="font-medium text-orange-800">
                                              {extra?.meal_name
                                                .split(' ')
                                                .map(
                                                  (word: string) =>
                                                    word
                                                      .charAt(0)
                                                      .toUpperCase() +
                                                    word.slice(1).toLowerCase()
                                                )
                                                .join(' ')}
                                            </div>
                                            <div className="text-[9px] text-orange-600">
                                              {extra?.meal_time}
                                            </div>
                                          </div>

                                          {/* Consumed Info */}
                                          <div className="text-[10px] text-gray-700 space-y-1">
                                            <div>
                                              <span className="font-medium">
                                                Consumed:
                                              </span>{' '}
                                              {extra?.consumed_quantity ??
                                                extra?.quantity ??
                                                '--'}{' '}
                                              {extra?.serving_unit}
                                            </div>

                                            {extra?.consumed_calories !==
                                              undefined && (
                                              <div>
                                                <span className="font-medium">
                                                  Calories:
                                                </span>{' '}
                                                {extra.consumed_calories} kcal
                                              </div>
                                            )}
                                          </div>

                                          {/* Hover Content */}
                                          <div className="absolute left-0 right-0 top-full mt-1 z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                                            <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-[10px] text-gray-600 space-y-1">
                                              {extra?.per_serving && (
                                                <div className="bg-orange-100 rounded p-1 mt-1">
                                                  <div className="font-medium text-orange-800 mb-1">
                                                    Per Serving:
                                                  </div>
                                                  <div className="grid grid-cols-2 gap-1 text-[9px]">
                                                    <div>
                                                      Calories:{' '}
                                                      {extra.per_serving
                                                        .calories ?? '--'}{' '}
                                                      kcal
                                                    </div>
                                                    <div>
                                                      Protein:{' '}
                                                      {extra.per_serving
                                                        .protein ?? '--'}
                                                      g
                                                    </div>
                                                    <div>
                                                      Carbs:{' '}
                                                      {extra.per_serving
                                                        .carbs ?? '--'}
                                                      g
                                                    </div>
                                                    <div>
                                                      Fat:{' '}
                                                      {extra.per_serving.fat ??
                                                        '--'}
                                                      g
                                                    </div>
                                                    {extra.per_serving
                                                      .fiber && (
                                                      <div className="col-span-2">
                                                        Fiber:{' '}
                                                        {
                                                          extra.per_serving
                                                            .fiber
                                                        }
                                                        g
                                                      </div>
                                                    )}
                                                  </div>
                                                </div>
                                              )}

                                              {extra?.consumed_macros && (
                                                <div className="bg-emerald-50 border border-emerald-200 rounded p-1 mt-1">
                                                  <div className="font-medium text-emerald-800 mb-1">
                                                    Consumed Macros:
                                                  </div>
                                                  <div className="grid grid-cols-2 gap-1 text-[9px]">
                                                    <div>
                                                      Protein:{' '}
                                                      {extra.consumed_macros
                                                        .protein ?? '--'}
                                                      g
                                                    </div>
                                                    <div>
                                                      Carbs:{' '}
                                                      {extra.consumed_macros
                                                        .carbs ?? '--'}
                                                      g
                                                    </div>
                                                    <div>
                                                      Fat:{' '}
                                                      {extra.consumed_macros
                                                        .fat ?? '--'}
                                                      g
                                                    </div>
                                                    {extra.consumed_macros
                                                      .fiber && (
                                                      <div className="col-span-2">
                                                        Fiber:{' '}
                                                        {
                                                          extra.consumed_macros
                                                            .fiber
                                                        }
                                                        g
                                                      </div>
                                                    )}
                                                  </div>
                                                </div>
                                              )}

                                              {extra?.actions?.status && (
                                                <div className="text-[9px] text-gray-500">
                                                  <span className="font-medium">
                                                    Status:
                                                  </span>{' '}
                                                  <span
                                                    className={`capitalize ${
                                                      extra.actions.status ===
                                                      'completed'
                                                        ? 'text-green-600'
                                                        : extra.actions
                                                              .status ===
                                                              'missed' ||
                                                            extra.actions
                                                              .status ===
                                                              'failed'
                                                          ? 'text-red-600'
                                                          : extra.actions
                                                                .status ===
                                                              'in_progress'
                                                            ? 'text-amber-600'
                                                            : 'text-gray-600'
                                                    }`}
                                                  >
                                                    {extra.actions.status.replace(
                                                      /_/g,
                                                      ' '
                                                    )}
                                                  </span>
                                                  {extra?.actions
                                                    ?.completed_at && (
                                                    <span className="ml-1">
                                                      at{' '}
                                                      {new Date(
                                                        extra.actions.completed_at
                                                      ).toLocaleTimeString([], {
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                      })}
                                                    </span>
                                                  )}
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      )
                                    )}
                                  </div>
                                </div>
                              )}
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="mt-6 text-sm text-gray-400 text-center">
                      No diet plans available.
                    </div>
                  )}
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
                        {Array.isArray(dayDetail?.workout_plan?.exercises) &&
                        dayDetail.workout_plan.exercises.length > 0 ? (
                          <div className="flex flex-col gap-2">
                            {dayDetail.workout_plan.exercises.map(
                              (ex: any, idx: number) => {
                                const action = ex?.actions
                                const durationMinutesFromSeconds =
                                  typeof action?.duration_seconds === 'number'
                                    ? (action.duration_seconds / 60).toFixed(1)
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
                                                  word.charAt(0).toUpperCase() +
                                                  word.slice(1).toLowerCase()
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
                                                {durationMinutesFromSeconds}m
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
                                                {action.video_watch_percentage}%
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
                    <div className="text-sm font-semibold mb-2">Yoga Plan</div>
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
                                                  word.charAt(0).toUpperCase() +
                                                  word.slice(1).toLowerCase()
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
                                                {action.video_watch_percentage}%
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
                      <div className="text-xs text-gray-500">No yoga plan.</div>
                    )}
                  </div>
                </div>
              </Tab>

              <Tab id="meditation">
                <div className="max-h-[700px] overflow-y-auto">
                  <div className="border rounded p-3 bg-white max-h-[500px] overflow-y-auto">
                    <div className="text-sm font-semibold mb-2">
                      Meditation Plan
                    </div>
                    {dayDetail?.meditation_plan ? (
                      <div className="flex flex-col gap-2 text-xs">
                        <div className="mb-1">
                          <div className="font-medium">
                            {dayDetail?.meditation_plan?.title ||
                              'Meditation Plan'}
                          </div>
                          {dayDetail?.meditation_plan?.description && (
                            <div className="text-gray-600">
                              {dayDetail.meditation_plan.description}
                            </div>
                          )}
                        </div>
                        {Array.isArray(dayDetail?.meditation_plan?.items) &&
                        dayDetail.meditation_plan.items.length > 0 ? (
                          <div className="flex flex-col gap-2">
                            {dayDetail.meditation_plan.items.map(
                              (item: any, idx: number) => {
                                const action = item?.actions
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
                                    key={`${item?.id}-${idx}`}
                                    className="flex items-center justify-between border rounded px-3 py-2"
                                  >
                                    <div className="flex flex-col">
                                      <span className="font-medium">
                                        {item?.meditation_name
                                          ? item.meditation_name
                                              .split(' ')
                                              .map(
                                                (word: string) =>
                                                  word.charAt(0).toUpperCase() +
                                                  word.slice(1).toLowerCase()
                                              )
                                              .join(' ')
                                          : '--'}
                                      </span>
                                      {item?.video_url && (
                                        <a
                                          className="text-primaryBlue underline"
                                          href={item.video_url}
                                          target="_blank"
                                          rel="noreferrer"
                                        >
                                          Video
                                        </a>
                                      )}
                                    </div>
                                    <div className="text-right text-[11px] text-gray-600 space-y-0.5">
                                      {item?.duration_minutes && (
                                        <div>
                                          Duration: {item.duration_minutes}m
                                        </div>
                                      )}
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
                                                {action.video_watch_percentage}%
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
                    ) : (
                      <div className="text-xs text-gray-500">
                        No meditation plan.
                      </div>
                    )}
                  </div>
                </div>
              </Tab>
            </TabContainer>
          )}
        </div>
      </CustomDrawer>

      <DialogModal
        isOpen={mealTimeEditOpen}
        onClose={closeMealTimeEdit}
        title="Edit Meal Timing"
        actionLabel="Save"
        actionLoader={isUpdatingMealTime}
        onSubmit={mealTimeForm.handleSubmit((values) => {
          const missing: string[] = []
          if (!selectedMealTiming) missing.push('meal')
          if (!userId) missing.push('user_id')
          if (
            subscriptionId === null ||
            subscriptionId === undefined ||
            subscriptionId === ''
          ) {
            missing.push('subscription_id')
          }
          if (
            templateId === null ||
            templateId === undefined ||
            templateId === ''
          ) {
            missing.push('diet_plan_template_id')
          }

          if (missing.length) {
            enqueueSnackbar(`Missing required details: ${missing.join(', ')}`, {
              variant: 'error',
            })
            return
          }

          const time12 = values.time
            ? moment(values.time, ['HH:mm:ss', 'HH:mm']).format('hh:mm A')
            : ''

          updateUserMealTimingMutate({
            userId,
            payload: {
              user_meal_timing: {
                meal_time: String(selectedMealTiming?.meal_time ?? '')
                  .trim()
                  .toUpperCase(),
                time: time12,
                diet_plan_template_id: templateId,
                subscription_id: subscriptionId as any,
                sequence_number: Number(
                  selectedMealTiming?.sequence_number ?? 0
                ),
              },
            },
          })
        })}
        secondaryAction={closeMealTimeEdit}
        secondaryActionLabel="Cancel"
        small={false}
        body={
          <FormProvider {...mealTimeForm}>
            <div className="space-y-4">
              {/* <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Meal Time
                </label>
                <input
                  value={String(selectedMealTiming?.meal_time_time ?? '--')}
                  disabled
                  readOnly
                  className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700"
                />
              </div> */}

              <Controller
                name="time"
                control={mealTimeForm.control}
                rules={{ required: 'Required.' }}
                render={({ field: { value, onChange } }) => (
                  <TimeSplitPicker
                    label="Time"
                    name="time"
                    value={value}
                    required
                    hidePeriodIcon
                    disabled={isUpdatingMealTime}
                    errors={mealTimeForm.formState.errors as any}
                    onChange={(data) => onChange(data.value)}
                  />
                )}
              />
            </div>
          </FormProvider>
        }
      />
    </>
  )
}
function safeStr(v: any) {
  if (v === null || v === undefined || v === '') return '--'
  return String(v)
}
