import moment from 'moment'
import { useMemo, useState } from 'react'
import InfoBox from '../../../components/app/alertBox/infoBox'
import Button from '../../../components/common/buttons/Button'
import { AutoComplete } from 'qbs-core'
import { DialogModal } from '../../../components/common'
import Icons from '../../../components/common/icons'
import { Tab, TabContainer } from '../../../components/common/tab'
import { usePlans } from '../../Plans/api'
import {
  createSubscription,
  getAdminDetails,
  getActivePlanOverview,
  getOverviewDetail,
  freezeSubscription,
} from '../api'
import { useAuthStore } from '../../../store/authStore'
import { useSnackbarManager } from '../../../components/common/snackbar'
import { useEffect } from 'react'

export default function Subscriptions({
  id,
  user,
  loading,
  error,
  onRefresh,
}: {
  id: string
  user: any
  loading: boolean
  error: string
  onRefresh: (data?: any) => void
}) {
  const plans = Array.isArray(user?.interested_plans)
    ? user.interested_plans.filter((p: any) => p?.active)
    : []
  const loginRole = useAuthStore((s) => s.roleData?.name?.toLowerCase?.())

  const subscribedPlan = user?.subscribed_plan
  const [overview, setOverview] = useState<any>(null)
  const [overviewLoading, setOverviewLoading] = useState(false)
  const [currentMonth, setCurrentMonth] = useState<string>('')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [dayDetailOpen, setDayDetailOpen] = useState(false)
  const [dayDetail, setDayDetail] = useState<any>(null)
  const [dayDetailLoading, setDayDetailLoading] = useState(false)
  const [dayDetailTab, setDayDetailTab] = useState<string>('diet')
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [toggleFreezeOpen, setToggleFreezeOpen] = useState(false)
  const [toggleFreezeRow, setToggleFreezeRow] = useState<any>(null)
  const [loader, setLoader] = useState(false)
  const [freezeForm, setFreezeForm] = useState<{
    reason: string
    start_date: string
    end_date: string
  }>({
    reason: '',
    start_date: '',
    end_date: '',
  })
  const [subForm, setSubForm] = useState<{
    start_date: string
    end_date: string
    status: number | ''
    notes: string
    plan_id: number | ''
  }>({ start_date: '', end_date: '', status: 0, notes: '', plan_id: '' })
  const [subSubmitAttempted, setSubSubmitAttempted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [selectedPlanOption, setSelectedPlanOption] = useState<any>(null)
  const { data: plansList } = usePlans({ page: 1, per_page: 100 } as any)
  const allPlans: any[] = (
    (plansList?.plans || plansList?.items || []) as any[]
  ).filter((p: any) => p?.active)
  const { enqueueSnackbar } = useSnackbarManager()
  const hasPlanOverview = !!overview?.subscription

  const computeEndDate = (start: string, days?: number) => {
    if (!start || !days || isNaN(days as any)) return ''
    const d = moment(start, 'YYYY-MM-DD', true)
    if (!d.isValid()) return ''
    const end = d.clone().add((days as number) - 1, 'days')
    return end.format('YYYY-MM-DD')
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
    const daysMap: Record<string, any> = {}
    if (Array.isArray(overview?.days)) {
      overview.days.forEach((d: any) => {
        daysMap[d?.date] = d
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

  const toISODate = (val: string) => {
    if (!val) return ''
    // Accept both DD-MM-YYYY and YYYY-MM-DD; return ISO YYYY-MM-DD
    if (moment(val, 'DD-MM-YYYY', true).isValid()) {
      return moment(val, 'DD-MM-YYYY').format('YYYY-MM-DD')
    }
    if (moment(val, 'YYYY-MM-DD', true).isValid()) {
      return val
    }
    return ''
  }

  const monthRange = () => {
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
  }

  const canPrev = () => {
    const { min } = monthRange()
    return currentMonth && min && currentMonth > min
  }
  const canNext = () => {
    const { max } = monthRange()
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

  useEffect(() => {
    const fetchOverview = async () => {
      if (!user?.id) return
      if (!user?.subscribed_plan) {
        setOverview(null)
        setCurrentMonth('')
        return
      }
      try {
        setOverviewLoading(true)
        const res = await getActivePlanOverview(user.id)
        setOverview(res)

        const todayStr = moment().format('YYYY-MM-DD')
        const hasToday = Array.isArray(res?.days)
          ? res.days.some((d: any) => {
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
      } catch (e) {
        setOverview(null)
      } finally {
        setOverviewLoading(false)
      }
    }
    fetchOverview()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  const statusColor = (day: any) => {
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

  const getDayCellClass = (cell: any) => {
    if (!cell?.inRange)
      return 'text-gray-400 bg-white border-gray-200 opacity-70 cursor-not-allowed'
    if (cell?.meta?.freeze)
      return 'bg-gradient-to-br from-red-600 to-red-600 text-white border-red-300 shadow-sm cursor-not-allowed'
    return statusColor(cell?.meta)
  }

  const openDayDetail = async (dateStr: string) => {
    if (!user?.id || !dateStr) return
    try {
      setSelectedDate(dateStr)
      setDayDetailOpen(true)
      setDayDetailTab('diet')
      setDayDetailLoading(true)
      const res = await getOverviewDetail(String(user.id), dateStr)
      setDayDetail(res)
    } catch {
      setDayDetail(null)
    } finally {
      setDayDetailLoading(false)
    }
  }

  const isFrozen = (row?: any) => {
    return !!(row?.is_frozen ?? overview?.subscription?.is_frozen)
  }

  const handleFreezeChange = (data: { name: string; value: any }) => {
    const subStart = overview?.subscription?.start_date || ''
    const subEnd = overview?.subscription?.end_date || ''
    if (data.name === 'start_date') {
      let newStart = toISODate(data.value as string)
      if (
        subStart &&
        newStart &&
        moment(newStart, 'YYYY-MM-DD', true).isBefore(
          moment(subStart, 'YYYY-MM-DD')
        )
      ) {
        newStart = subStart
      }
      if (
        subEnd &&
        newStart &&
        moment(newStart, 'YYYY-MM-DD', true).isAfter(
          moment(subEnd, 'YYYY-MM-DD')
        )
      ) {
        newStart = subEnd
      }
      let newEnd = freezeForm.end_date
      if (
        newEnd &&
        moment(newEnd, 'YYYY-MM-DD', true).isBefore(
          moment(newStart, 'YYYY-MM-DD')
        )
      ) {
        newEnd = ''
      }
      if (
        subEnd &&
        newEnd &&
        moment(newEnd, 'YYYY-MM-DD', true).isAfter(moment(subEnd, 'YYYY-MM-DD'))
      ) {
        newEnd = subEnd
      }
      setFreezeForm((prev) => ({
        ...prev,
        start_date: newStart,
        end_date: newEnd,
      }))
      return
    }
    setFreezeForm((prev) => ({ ...prev, [data.name]: data.value }))
  }

  const handleConfirmToggleFreeze = async () => {
    try {
      setLoader(true)
      const isAlreadyFrozen = isFrozen(toggleFreezeRow)
      if (!isAlreadyFrozen) {
        const sid = String(
          toggleFreezeRow?.id || overview?.subscription?.id || ''
        )
        if (!sid) throw new Error('Missing subscription id')
        await freezeSubscription(sid, {
          reason: freezeForm.reason || undefined,
          start_date: freezeForm.start_date || undefined,
          end_date: freezeForm.end_date || undefined,
        })
        try {
          const res = await getActivePlanOverview(user.id)
          setOverview(res)
        } catch {}
        try {
          const fresh = await getAdminDetails(String(id))
          onRefresh(fresh)
        } catch {}
        enqueueSnackbar('Subscription frozen successfully', {
          variant: 'success',
        })
      } else {
        // TODO: implement unfreeze subscription API when available
        enqueueSnackbar('Unfreeze API not implemented', { variant: 'warning' })
      }
      setToggleFreezeOpen(false)
      setToggleFreezeRow(null)
    } finally {
      setLoader(false)
    }
  }

  const handleSubFormChange = (
    name: 'start_date' | 'end_date' | 'status' | 'notes' | 'plan_id',
    value: any
  ) => {
    if (name === 'start_date') {
      const plan = allPlans?.find?.(
        (p: any) => String(p?.id) === String(subForm.plan_id)
      )
      const computed = computeEndDate(value, plan?.duration_days)
      setSubForm((prev) => ({
        ...prev,
        start_date: value,
        end_date: computed || prev.end_date,
      }))
      return
    }
    setSubForm((prev) => ({ ...prev, [name]: value }))
  }
  const canSubmit = useMemo(() => {
    return (
      !!user?.id &&
      typeof subForm.plan_id === 'number' &&
      subForm.plan_id > 0 &&
      !!subForm.start_date &&
      !!subForm.end_date &&
      (subForm.status === 0 || subForm.status === 1 || subForm.status === 2)
    )
  }, [user?.id, subForm])

  const subFormErrors = useMemo(() => {
    const errs: {
      plan_id?: string
      start_date?: string
      end_date?: string
    } = {}

    if (!(typeof subForm.plan_id === 'number' && subForm.plan_id > 0)) {
      errs.plan_id = 'Required'
    }

    if (!subForm.start_date) {
      errs.start_date = 'Required'
    }

    if (!subForm.end_date) {
      errs.end_date = 'Required'
    } else if (
      subForm.start_date &&
      moment(subForm.end_date, 'YYYY-MM-DD', true).isValid() &&
      moment(subForm.start_date, 'YYYY-MM-DD', true).isValid() &&
      moment(subForm.end_date).isBefore(moment(subForm.start_date), 'day')
    ) {
      errs.end_date = 'End date cannot be before start date.'
    }

    return errs
  }, [subForm.plan_id, subForm.start_date, subForm.end_date])

  const openSubscriptionDrawer = () => {
    setSelectedPlanOption(null)
    setSubSubmitAttempted(false)
    setSubForm({
      start_date: '',
      end_date: '',
      status: 0,
      notes: '',
      plan_id: '',
    })
    setDrawerOpen(true)
  }
  const closeSubscriptionDrawer = () => setDrawerOpen(false)

  const handleSubmitSubscription = async () => {
    setSubSubmitAttempted(true)
    if (!canSubmit) return
    try {
      setSubmitting(true)
      const payload: any = {
        subscription: {
          user_id: user?.id,
          plan_id: subForm.plan_id,
          start_date: subForm.start_date,
          end_date: subForm.end_date,
          status: 0,
        },
      }
      if (subForm.notes && String(subForm.notes).trim() !== '') {
        payload.subscription.notes = subForm.notes
      }
      await createSubscription(payload)
      try {
        const fresh = await getAdminDetails(String(id))
        onRefresh(fresh)
      } catch {}
      enqueueSnackbar('Subscription created successfully', {
        variant: 'success',
      })
      setSelectedPlanOption(null)
      setDrawerOpen(false)
      // Force full page refresh to reflect new subscription state
      if (typeof window !== 'undefined' && window.location) {
        window.location.reload()
      }
    } catch {
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      {loading && (
        <div className="p-6">
          <InfoBox content="Loading interested plans..." />
        </div>
      )}
      {error && !loading && (
        <div className="p-6">
          <InfoBox content={error} />
        </div>
      )}
      {!loading && !error && (
        <div className="flex flex-col gap-4">
          {loginRole !== 'nutritionist' &&
            !hasPlanOverview &&
            !subscribedPlan && (
              <div className="flex justify-end">
                <Button
                  className="primaryButton"
                  label="Add Subscription"
                  onClick={() => openSubscriptionDrawer()}
                />
              </div>
            )}
          <div
            className={`relative border rounded-lg p-4 pt-6 ${subscribedPlan ? 'mt-4' : ''}`}
          >
            <div className="absolute -top-3 left-3 px-2 z-10 bg-mainBgColor">
              <span className="text-lg font-medium text-gray-700">
                {hasPlanOverview || subscribedPlan
                  ? 'Subscribed Plan'
                  : 'Interested Plans'}
              </span>
            </div>
            {hasPlanOverview || subscribedPlan ? (
              <div className="flex flex-col gap-4">
                <div className="border rounded-lg p-3 bg-white flex items-start justify-between gap-4">
                  <div>
                    <div className="text-sm font-medium mb-1">
                      {safeStr(
                        overview?.subscription?.plan_name ??
                          overview?.subscription?.name
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      Category:{' '}
                      {safeStr(
                        overview?.subscription?.plan_category ??
                          overview?.subscription?.category
                      )}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {overview?.subscription?.start_date &&
                      overview?.subscription?.end_date ? (
                        <>
                          <span>
                            Start Date:{' '}
                            <span className="font-semibold">
                              {moment(overview.subscription.start_date).format(
                                'MMM D, YYYY'
                              )}
                            </span>
                          </span>

                          <span className="mx-2">•</span>
                          <span>
                            End Date:{' '}
                            <span className="font-semibold">
                              {moment(overview.subscription.end_date).format(
                                'MMM D, YYYY'
                              )}
                            </span>
                          </span>
                        </>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {overview?.subscription?.plan_id ? (
                      <a
                        href={`/plans/${overview.subscription.plan_id}`}
                        className="text-xs text-primaryBlue underline whitespace-nowrap mt-1"
                      >
                        View plan details →
                      </a>
                    ) : null}
                    {loginRole !== 'nutritionist' && (
                      <Button
                        className="primaryButton"
                        label="Update Subscription"
                        onClick={() => openSubscriptionDrawer()}
                      />
                    )}
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    className="primaryButton"
                    label={
                      isFrozen(overview?.subscription)
                        ? 'Unfreeze Subscription'
                        : 'Freeze Subscription'
                    }
                    onClick={() => {
                      setToggleFreezeRow(overview?.subscription)
                      setToggleFreezeOpen(true)
                      setFreezeForm({
                        reason: '',
                        start_date: '',
                        end_date: '',
                      })
                    }}
                  />
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
                  {overviewLoading && (
                    <div className="text-xs text-gray-500">
                      Loading calendar...
                    </div>
                  )}
                  {!overviewLoading &&
                  overview?.subscription?.start_date &&
                  overview?.subscription?.end_date ? (
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <button
                          type="button"
                          onClick={goPrev}
                          disabled={!canPrev()}
                          className={`px-2 py-1 text-xs border rounded ${canPrev() ? 'text-gray-700' : 'text-gray-300 cursor-not-allowed'}`}
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
                          className={`px-2 py-1 text-xs border rounded ${canNext() ? 'text-gray-700' : 'text-gray-300 cursor-not-allowed'}`}
                        >
                          ▶
                        </button>
                      </div>
                      {(() => {
                        const m = buildMonthCells(currentMonth)
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
                                  className={`relative h-44 border px-2 py-1 text-[14px] transition-colors duration-150 ${getDayCellClass(c)} ${c?.inRange && !c?.meta?.freeze ? 'cursor-pointer' : ''}`}
                                  title={
                                    c?.meta?.date
                                      ? `${c.meta.date}  •  Diet: ${c?.meta?.diet_summary?.total_items ?? 0}  •  Workout: ${c?.meta?.workout_summary?.total_exercises ?? 0}  •  Yoga: ${c?.meta?.yoga_summary?.total_exercises ?? 0}  •  Meditation: ${c?.meta?.meditation_summary?.total_items ?? 0}`
                                      : ''
                                  }
                                  role={
                                    c?.inRange && !c?.meta?.freeze
                                      ? 'button'
                                      : undefined
                                  }
                                  tabIndex={
                                    c?.inRange && !c?.meta?.freeze ? 0 : -1
                                  }
                                  onClick={() =>
                                    c?.inRange &&
                                    !c?.meta?.freeze &&
                                    openDayDetail(c?.meta?.date || c.key)
                                  }
                                  onKeyDown={(e) => {
                                    if (!c?.inRange || c?.meta?.freeze) return
                                    if (e.key === 'Enter' || e.key === ' ') {
                                      e.preventDefault()
                                      openDayDetail(c?.meta?.date || c.key)
                                    }
                                  }}
                                >
                                  <div className="flex flex-col h-full w-full">
                                    <div className="flex justify-between">
                                      <div className="text-[12px] font-medium">
                                        {c?.label ?? ''}
                                      </div>
                                      {c?.meta?.day_number ? (
                                        <div className="text-[12px] font-medium">
                                          Day - {c?.meta?.day_number}
                                        </div>
                                      ) : null}
                                    </div>
                                    {c?.inRange && c?.meta ? (
                                      <div className="mt-1 text-[10px] leading-4">
                                        <div className="flex items-center justify-between border rounded-[5px] bg-red-100 text-black px-2 py-1">
                                          <span>Diet</span>
                                          <span className="font-medium">
                                            {c?.meta?.diet_summary
                                              ?.total_items ?? 0}
                                          </span>
                                        </div>
                                        <div className="flex items-center justify-between border rounded-[5px] bg-violet-200 text-black px-2 py-1 mt-2">
                                          <span>Workout</span>
                                          <span className="font-medium">
                                            {c?.meta?.workout_summary
                                              ?.total_exercises ?? 0}
                                          </span>
                                        </div>
                                        <div className="flex items-center justify-between border rounded-[5px] bg-green-200 text-black px-2 py-1 mt-2">
                                          <span>Yoga</span>
                                          <span className="font-medium">
                                            {c?.meta?.yoga_summary
                                              ?.total_exercises ?? 0}
                                          </span>
                                        </div>
                                        <div className="flex items-center justify-between border rounded-[5px] bg-blue-200 text-black px-2 py-1 mt-2">
                                          <span>Meditation</span>
                                          <span className="font-medium">
                                            {c?.meta?.meditation_summary
                                              ?.total_items ?? 0}
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
                    </div>
                  ) : (
                    !overviewLoading && (
                      <div className="text-xs text-gray-500">
                        No calendar data
                      </div>
                    )
                  )}
                </div>
              </div>
            ) : (
              <div
                className={`grid grid-cols-1 ${
                  Array.isArray(plans) && plans.length > 0
                    ? 'md:grid-cols-2'
                    : 'md:grid-cols-1'
                } gap-4`}
              >
                {Array.isArray(plans) && plans.length > 0 ? (
                  plans.map((p: any) => (
                    <div key={p?.id} className="border rounded-lg p-3 bg-white">
                      <div className="text-sm font-medium mb-1">
                        {safeStr(p?.name)}
                      </div>
                      <div className="text-xs text-gray-500">
                        Category: {safeStr(p?.category)}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-10 min-h-[60vh] flex flex-col items-center justify-center text-gray-500">
                    <Icons name="no-data-icon" />
                    <div className="mt-3 text-sm">No interested plans</div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <DialogModal
        isOpen={drawerOpen}
        onClose={() => closeSubscriptionDrawer()}
        title="Add Subscription"
        onSubmit={handleSubmitSubscription}
        secondaryAction={() => closeSubscriptionDrawer()}
        secondaryActionLabel="Close"
        actionLabel="Save"
        actionLoader={submitting}
        small={false}
        body={
          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Plans <span className="text-red-500">*</span>
              </label>
              <AutoComplete
                name="plan_id"
                type="custom_search_select"
                desc="name"
                descId="id"
                data={allPlans}
                placeholder="Select a plan"
                value={selectedPlanOption?.name ?? ''}
                onChange={(opt: any) => {
                  setSelectedPlanOption(opt)
                  const pid =
                    typeof opt?.id === 'number'
                      ? opt.id
                      : parseInt(opt?.id, 10) || ''
                  handleSubFormChange('plan_id', pid)
                  setSubForm((prev) => ({
                    ...prev,
                    start_date: '',
                    end_date: '',
                  }))
                }}
                required
              />
              {subSubmitAttempted && subFormErrors.plan_id && (
                <div className="mt-1 text-xs text-red-500">
                  {subFormErrors.plan_id}
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Start date <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  className={`w-full border rounded px-3 py-2 text-xs ${subForm.start_date ? 'pr-7' : ''}`}
                  value={subForm.start_date}
                  onChange={(e) =>
                    handleSubFormChange('start_date', e.target.value)
                  }
                  required
                  min={moment().format('YYYY-MM-DD')}
                />
                {subForm.start_date ? (
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    onClick={() => {
                      setSubForm((prev) => ({
                        ...prev,
                        start_date: '',
                        end_date: '',
                      }))
                    }}
                    aria-label="Clear start date"
                  >
                    <Icons name="close" className="text-gray-500" />
                  </button>
                ) : null}
              </div>
              {subSubmitAttempted && subFormErrors.start_date && (
                <div className="mt-1 text-xs text-red-500">
                  {subFormErrors.start_date}
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                End date <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  className={`w-full border rounded px-3 py-2 text-xs ${subForm.end_date ? 'pr-7' : ''}`}
                  value={subForm.end_date}
                  onChange={(e) =>
                    handleSubFormChange('end_date', e.target.value)
                  }
                  required
                  disabled
                />
                {subForm.end_date ? (
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    onClick={() => {
                      setSubForm((prev) => ({
                        ...prev,
                        end_date: '',
                      }))
                    }}
                    aria-label="Clear end date"
                  >
                    <Icons name="close" className="text-gray-500" />
                  </button>
                ) : null}
              </div>
              {subSubmitAttempted && subFormErrors.end_date && (
                <div className="mt-1 text-xs text-red-500">
                  {subFormErrors.end_date}
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Notes (optional)
              </label>
              <textarea
                className="w-full border rounded px-3 py-2 text-xs"
                rows={3}
                value={subForm.notes}
                onChange={(e) => handleSubFormChange('notes', e.target.value)}
                placeholder="Optional notes"
              />
            </div>
          </div>
        }
      />

      <DialogModal
        isOpen={toggleFreezeOpen}
        onClose={() => setToggleFreezeOpen(false)}
        title={
          isFrozen(toggleFreezeRow)
            ? 'Unfreeze Subscription'
            : 'Freeze Subscription'
        }
        onSubmit={handleConfirmToggleFreeze}
        secondaryAction={() => {
          setToggleFreezeOpen(false)
          setToggleFreezeRow(null)
        }}
        secondaryActionLabel="Cancel"
        actionLabel={isFrozen(toggleFreezeRow) ? 'Unfreeze' : 'Freeze'}
        actionLoader={loader}
        body={
          isFrozen(toggleFreezeRow) ? (
            <InfoBox content={'Do you want to unfreeze this subscription?'} />
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-sm text-gray-600">Reason</label>
                <input
                  className="textfield"
                  name="reason"
                  value={freezeForm.reason}
                  onChange={(e) =>
                    handleFreezeChange({
                      name: e.target.name,
                      value: e.target.value,
                    })
                  }
                  placeholder="Enter reason"
                />
              </div>
              <div className="grid grid-cols-2 gap-1">
                <div className="flex flex-col gap-1">
                  <label className="text-sm text-gray-600">Start date</label>
                  <div className="relative">
                    <input
                      type="date"
                      className={`w-full border rounded px-3 py-2 text-xs ${freezeForm.start_date ? 'pr-7' : ''}`}
                      name="start_date"
                      value={freezeForm.start_date}
                      min={overview?.subscription?.start_date || undefined}
                      max={overview?.subscription?.end_date || undefined}
                      onChange={(e) =>
                        handleFreezeChange({
                          name: e.target.name,
                          value: e.target.value,
                        })
                      }
                    />
                    {freezeForm.start_date ? (
                      <button
                        type="button"
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        onClick={() =>
                          setFreezeForm((prev) => ({
                            ...prev,
                            start_date: '',
                            end_date: '',
                          }))
                        }
                        aria-label="Clear freeze start date"
                      >
                        <Icons name="close" className="text-gray-500" />
                      </button>
                    ) : null}
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm text-gray-600">End date</label>
                  <div className="relative">
                    <input
                      type="date"
                      className={`w-full border rounded px-3 py-2 text-xs ${freezeForm.end_date ? 'pr-7' : ''}`}
                      name="end_date"
                      value={freezeForm.end_date}
                      min={
                        freezeForm.start_date ||
                        overview?.subscription?.start_date ||
                        undefined
                      }
                      max={overview?.subscription?.end_date || undefined}
                      onChange={(e) =>
                        handleFreezeChange({
                          name: e.target.name,
                          value: e.target.value,
                        })
                      }
                    />
                    {freezeForm.end_date ? (
                      <button
                        type="button"
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        onClick={() =>
                          setFreezeForm((prev) => ({
                            ...prev,
                            end_date: '',
                          }))
                        }
                        aria-label="Clear freeze end date"
                      >
                        <Icons name="close" className="text-gray-500" />
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          )
        }
      />

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
                                            {ex?.workout_name || '--'}
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
                                            {ex?.yoga_name || '--'}
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
                                        {m?.title || '--'}
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
