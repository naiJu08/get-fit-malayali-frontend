import moment from 'moment'
import { useMemo, useState } from 'react'
import InfoBox from '../../../components/app/alertBox/infoBox'
import Button from '../../../components/common/buttons/Button'
import { AutoComplete } from 'qbs-core'
import { DialogModal } from '../../../components/common'
import Icons from '../../../components/common/icons'
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
  const plans = user?.interested_plans || []
  const loginRole = useAuthStore((s) => s.roleData?.name?.toLowerCase?.())

  const subscribedPlan = user?.subscribed_plan
  const [overview, setOverview] = useState<any>(null)
  const [overviewLoading, setOverviewLoading] = useState(false)
  const [currentMonth, setCurrentMonth] = useState<string>('')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [dayDetailOpen, setDayDetailOpen] = useState(false)
  const [dayDetail, setDayDetail] = useState<any>(null)
  const [dayDetailLoading, setDayDetailLoading] = useState(false)
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
  const [submitting, setSubmitting] = useState(false)
  const [selectedPlanOption, setSelectedPlanOption] = useState<any>(null)
  const { data: plansList } = usePlans({ page: 1, per_page: 100 } as any)
  const allPlans: any[] = (plansList?.plans || plansList?.items || []) as any[]
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
        const sd = res?.subscription?.start_date
        if (sd) {
          setCurrentMonth(
            moment(sd, 'YYYY-MM-DD').startOf('month').format('YYYY-MM')
          )
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

  const openSubscriptionDrawer = () => {
    setSelectedPlanOption(null)
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
            !(hasPlanOverview || subscribedPlan) && (
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
                  {overview?.subscription?.plan_id ? (
                    <a
                      href={`/plans/${overview.subscription.plan_id}`}
                      className="text-xs text-primaryBlue underline whitespace-nowrap mt-1"
                    >
                      View plan details →
                    </a>
                  ) : null}
                </div>
                <div className="flex justify-end">
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
                                  className={`relative h-28 border px-2 py-1 text-[14px] transition-colors duration-150 ${getDayCellClass(c)} ${c?.inRange && !c?.meta?.freeze ? 'cursor-pointer' : ''}`}
                                  title={
                                    c?.meta?.date
                                      ? `${c.meta.date}  •  Diet: ${c?.meta?.diet_summary?.total_items ?? 0}  •  Workout: ${c?.meta?.workout_summary?.total_exercises ?? 0}`
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
                                    <div className="text-[12px] font-medium">
                                      {c?.label ?? ''}
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
                type="custom_select"
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
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Start Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                className="w-full border rounded px-3 py-2 text-xs"
                value={subForm.start_date}
                onChange={(e) =>
                  handleSubFormChange('start_date', e.target.value)
                }
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                End Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                className="w-full border rounded px-3 py-2 text-xs"
                value={subForm.end_date}
                onChange={(e) =>
                  handleSubFormChange('end_date', e.target.value)
                }
                required
                disabled
              />
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
            {!canSubmit && (
              <div className="text-xs text-red-500">
                Please fill all required fields.
              </div>
            )}
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
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-sm text-gray-600">Start date</label>
                  <input
                    type="date"
                    className="textfield"
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
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm text-gray-600">End date</label>
                  <input
                    type="date"
                    className="textfield"
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border rounded p-3 bg-white">
                    <div className="text-sm font-medium mb-2">Diet Plans</div>
                    {Array.isArray(dayDetail?.diet_plans) &&
                    dayDetail.diet_plans.length > 0 ? (
                      <div className="flex flex-col gap-2 text-xs">
                        {dayDetail.diet_plans.map((d: any) => (
                          <div
                            key={`${d?.id}-${d?.sequence_number}`}
                            className="flex items-center justify-between border rounded px-3 py-2"
                          >
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {d?.meal_time || '--'}
                              </span>
                              <span className="text-gray-600">
                                {d?.meal_name || '—'}
                              </span>
                            </div>
                            <div className="text-right">
                              <div className="text-gray-500">Calories</div>
                              <div className="font-medium">
                                {d?.calories ?? '--'}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-gray-500">
                        No diet items.
                      </div>
                    )}
                  </div>
                  <div className="border rounded p-3 bg-white max-h-[500px] overflow-y-auto">
                    <div className="text-sm font-medium mb-2">Workout Plan</div>
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
                              (ex: any, idx: number) => (
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
                                  <div className="text-right text-gray-600">
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
                                  </div>
                                </div>
                              )
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
