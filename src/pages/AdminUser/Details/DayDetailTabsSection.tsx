import moment from 'moment'
import {
  Fragment,
  useEffect,
  useMemo,
  useState,
  // type ChangeEvent,
  type FC,
} from 'react'
import { Controller, FormProvider, useForm } from 'react-hook-form'
import Icons from '../../../components/common/icons'
import { DialogModal, TextField } from '../../../components/common'
import { Tab, TabContainer } from '../../../components/common/tab'
import TimeSplitPicker from '../../../components/common/inputs/TimeSplitPicker'
import { useSnackbarManager } from '../../../components/common/snackbar'
import { useUpdateUserMealTiming } from '../api'
import DietTemplateAssign from '../../DietTemplate/Assign'
import WorkoutTemplateAssign from '../../WorkoutTemplate/Assign'
import YogaTemplateAssign from '../../YogaTemplate/Assign'
import { useAuthStore } from '../../../store/authStore'
import DayDietEditorDrawer from './DayDietEditorDrawer'

interface DayDetailTabsSectionProps {
  dayDetail: any
  dayDetailTab: string
  onChangeTab: (tabId: string) => void
  isNutritionist: boolean
  canAccessDiet?: boolean
  canAccessWorkout?: boolean
  canAccessYoga?: boolean
  canAccessMeditation?: boolean
  onEditWorkoutPlan: () => void
  onEditYogaPlan: () => void
  onEditMeditationPlan: () => void
  subscriptionId?: string | number | null
  userId?: string | number | null
  refreshDayDetail?: () => Promise<void> | void
  isActionablePackage?: boolean
  workoutsById?: Map<string, any>
  subcategoryParentMap?: Record<string, any>
  yogasById?: Map<string, any>
  yogaSubcategoryParentMap?: Record<string, any>
}

const formatMealName = (value?: string | null) => {
  if (!value) return '--'
  const trimmed = value.trim()
  if (!trimmed) return '--'
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase()
}

const DayDetailTabsSection: FC<DayDetailTabsSectionProps> = ({
  dayDetail,
  dayDetailTab,
  onChangeTab,
  isNutritionist,
  canAccessDiet,
  canAccessWorkout,
  canAccessYoga,
  canAccessMeditation,
  onEditWorkoutPlan,
  onEditYogaPlan,
  onEditMeditationPlan,
  subscriptionId: parentSubscriptionId,
  userId: parentUserId,
  refreshDayDetail,
  isActionablePackage = true,
  workoutsById,
  subcategoryParentMap,
  yogasById,
  yogaSubcategoryParentMap,
}) => {
  const loginRole = useAuthStore((s: any) => s.roleData?.name?.toLowerCase?.())
  const isSuperOrAdmin = loginRole === 'superadmin' || loginRole === 'admin'
  const isNutritionistRole = loginRole === 'nutritionist' || isNutritionist
  const isPhysio = loginRole === 'physiotherapist' || loginRole === 'physio'
  const isYogist =
    loginRole === 'yogist' ||
    loginRole === 'yoga_trainer' ||
    loginRole === 'yoga'

  const effectiveCanAccessDiet =
    canAccessDiet ?? (isSuperOrAdmin || isNutritionistRole)
  const effectiveCanAccessWorkout =
    canAccessWorkout ?? (isSuperOrAdmin || isPhysio)
  const effectiveCanAccessYoga =
    canAccessYoga ?? (isSuperOrAdmin || isYogist || isNutritionistRole)
  const effectiveCanAccessMeditation =
    canAccessMeditation ?? (isSuperOrAdmin || isNutritionistRole || isYogist)
  const [dayDietEditorOpen, setDayDietEditorOpen] = useState(false)
  const [mealTimeEditOpen, setMealTimeEditOpen] = useState(false)
  const [selectedMealTiming, setSelectedMealTiming] = useState<any>(null)
  const [expandedDietItems, setExpandedDietItems] = useState<
    Record<string, boolean>
  >({})
  const toggleDietItemDetails = (id: string) => {
    setExpandedDietItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  const { enqueueSnackbar } = useSnackbarManager()

  const subscriptionId =
    parentSubscriptionId ??
    dayDetail?.subscription_id ??
    dayDetail?.subscription?.id ??
    dayDetail?.subscriptionId ??
    null

  const userId =
    parentUserId ??
    dayDetail?.user_id ??
    dayDetail?.user?.id ??
    dayDetail?.subscription?.user_id ??
    selectedMealTiming?.user_id ??
    null

  const mealTimeForm = useForm<{ time: string; meal_time: string }>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: { time: '', meal_time: '' },
  })

  const { mutate: updateUserMealTimingMutate, isLoading: isUpdatingMealTime } =
    useUpdateUserMealTiming(async () => {
      setMealTimeEditOpen(false)
      setSelectedMealTiming(null)
      try {
        await refreshDayDetail?.()
      } catch (err) {
        console.error(
          'Failed to refresh day detail after meal time update',
          err
        )
      }
    })

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
      meal_time: meal?.meal_time || '',
    })
    setMealTimeEditOpen(true)
  }

  const closeMealTimeEdit = () => {
    setMealTimeEditOpen(false)
    setSelectedMealTiming(null)
  }

  const templateName = dayDetail?.subscription?.diet_plan_template_name?.trim()
  const templateId =
    dayDetail?.subscription?.diet_plan_template_id ??
    dayDetail?.diet_plan_template_id ??
    dayDetail?.subscription?.diet_plan_template?.id ??
    null

  const selectedDayDate =
    dayDetail?.date ?? dayDetail?.day_date ?? dayDetail?.dayDate ?? null

  const hasYogaData = useMemo(() => {
    return !!(
      dayDetail?.yoga_plan ||
      dayDetail?.yoga_template ||
      dayDetail?.subscription?.yoga_template_name
    )
  }, [dayDetail])

  const isCompleted = useMemo(() => {
    const status = String(dayDetail?.status || '').toLowerCase()
    return status === 'completed' || status === 'over'
  }, [dayDetail?.status])

  const isFrozen = useMemo(() => {
    return Boolean(
      dayDetail?.freeze ||
        dayDetail?.is_frozen ||
        dayDetail?.frozen ||
        dayDetail?.subscription?.freeze ||
        String(dayDetail?.status || '').toLowerCase() === 'freeze' ||
        String(dayDetail?.status || '').toLowerCase() === 'frozen'
    )
  }, [dayDetail])

  const isCurrentOrFutureDay = useMemo(() => {
    const dateSource =
      dayDetail?.date ?? dayDetail?.day_date ?? dayDetail?.dayDate ?? null
    if (!dateSource) return true
    const parsed = moment(dateSource)
    if (!parsed.isValid()) return true
    return parsed.startOf('day').isSameOrAfter(moment().startOf('day'))
  }, [dayDetail?.date, dayDetail?.day_date, dayDetail?.dayDate])

  const canEditDay = useMemo(() => {
    if (!isActionablePackage) return false
    if (isCompleted || isFrozen) return false
    return isCurrentOrFutureDay
  }, [isActionablePackage, isCompleted, isFrozen, isCurrentOrFutureDay])

  const canAssignTemplate = useMemo(() => {
    if (!isActionablePackage) return false
    if (isCompleted || isFrozen) return false
    return isCurrentOrFutureDay
  }, [isActionablePackage, isCompleted, isFrozen, isCurrentOrFutureDay])

  const tabsData = useMemo(() => {
    const list: { label: string; id: string }[] = []
    if (effectiveCanAccessDiet) {
      list.push({ label: 'Diet', id: 'diet' })
    }
    if (effectiveCanAccessWorkout) {
      list.push({ label: 'Workout', id: 'workout' })
    }
    if (effectiveCanAccessYoga && (hasYogaData || isSuperOrAdmin || isYogist)) {
      list.push({ label: 'Yoga', id: 'yoga' })
    }
    if (effectiveCanAccessMeditation) {
      list.push({ label: 'Meditation', id: 'meditation' })
    }
    return list
  }, [
    effectiveCanAccessDiet,
    effectiveCanAccessWorkout,
    effectiveCanAccessYoga,
    effectiveCanAccessMeditation,
    hasYogaData,
    isSuperOrAdmin,
    isYogist,
  ])

  useEffect(() => {
    const validTabIds = tabsData.map((t) => t.id)
    if (validTabIds.length > 0 && !validTabIds.includes(dayDetailTab)) {
      onChangeTab(validTabIds[0])
    }
  }, [tabsData, dayDetailTab, onChangeTab])

  return (
    <>
      <div className="allow-tab-overflow">
        <TabContainer
          data={tabsData}
          activeTab={dayDetailTab}
          onClick={(item) => onChangeTab(String(item.id))}
        >
          {effectiveCanAccessDiet && (
            <Tab id="diet">
              <DietTemplateAssign
                subscriptionId={subscriptionId}
                currentName={
                  dayDetail?.diet_template?.name ||
                  dayDetail?.subscription?.diet_plan_template_name ||
                  dayDetail?.subscription?.diet_template_name ||
                  templateName
                }
                currentTemplateId={
                  dayDetail?.diet_template?.id ||
                  dayDetail?.subscription?.diet_plan_template_id ||
                  dayDetail?.diet_plan_template_id ||
                  templateId
                }
                selectedDayDate={selectedDayDate}
                readOnly={!canAssignTemplate}
                onAssigned={refreshDayDetail as any}
              />
              <div className="max-h-[700px] overflow-y-auto">
                {/* ================= DAY PLAN HEADER ================= */}
                <div className="border border-gray-200/80 rounded-xl p-3 bg-white mb-3 shadow-xs">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-gray-800">
                        Diet Plan
                      </div>
                      <div className="text-xs text-gray-600 mt-1 flex items-center gap-2 flex-wrap">
                        <span className="bg-blue-50 text-blue-700 border border-blue-200/80 px-2 py-0.5 rounded-md font-medium text-[11px]">
                          Proposed: {dayDetail?.total_proposed_calories ?? '--'}{' '}
                          kcal
                        </span>
                        <span className="bg-emerald-50 text-emerald-700 border border-emerald-200/80 px-2 py-0.5 rounded-md font-medium text-[11px]">
                          Consumed: {dayDetail?.total_consumed_calories ?? 0}{' '}
                          kcal
                        </span>
                      </div>
                    </div>
                    {canEditDay && effectiveCanAccessDiet && (
                      <button
                        type="button"
                        onClick={() => setDayDietEditorOpen(true)}
                        className="px-3 py-1.5 text-xs border rounded-lg btn-primary flex items-center gap-1 font-medium shadow-xs"
                      >
                        <Icons name="edit" className="w-3.5 h-3.5" />
                        <span>Update Day</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* ================= MEALS ================= */}
                {Array.isArray(dayDetail?.diet_plans) &&
                dayDetail.diet_plans.length > 0 ? (
                  <div className=" mt-3">
                    {dayDetail.diet_plans.map((d: any) => {
                      const totalItems = d?.items?.length || 0
                      const completedItems =
                        d?.item_statuses?.completed_item_ids?.length || 0
                      const missedItems =
                        d?.item_statuses?.not_taken_mandatory_item_ids
                          ?.length || 0

                      const progress =
                        totalItems > 0 ? (completedItems / totalItems) * 100 : 0

                      return (
                        <div
                          key={`${d?.id}-${d?.sequence_number}`}
                          className="bg-white rounded-xl shadow-sm px-4 py-3"
                        >
                          {/* ---------- Meal Header ---------- */}
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <div className="text-lg font-semibold text-gray-800">
                                  {d.meal_time} - {d.meal_time_time}
                                </div>
                                {isActionablePackage && (
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
                                )}
                              </div>
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
                                        (item?.actions?.consumed_calories || 0),
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
                            <div className="relative w-full  bg-gray-200 rounded-full mt-2">
                              {/* Progress fill */}
                              <div
                                className="h-full bg-green-500 rounded-full transition-all duration-500"
                                style={{ width: `${progress}%` }}
                              />
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

                                const dietItemKey = `${d?.id}-${it?.id}`
                                const isExpanded =
                                  !!expandedDietItems[dietItemKey]

                                return (
                                  <div
                                    key={it?.id}
                                    className={`border-l-2 ${statusColor} bg-gray-50 rounded-lg px-3 py-2 group relative`}
                                  >
                                    {/* Item Header */}
                                    <div className="flex items-center justify-between">
                                      <div className="text-[11px] font-medium text-gray-800">
                                        {formatMealName(it?.meal_name)}
                                      </div>

                                      <button
                                        type="button"
                                        onClick={() =>
                                          toggleDietItemDetails(dietItemKey)
                                        }
                                        className="text-[10px] text-primary"
                                      >
                                        {/* {isExpanded ? 'Hide' : 'Details'} */}
                                      </button>
                                    </div>

                                    {/* Requirement and Planned Info - Only show when collapsed */}
                                    {!isExpanded && (
                                      <div className="mt-2 text-[10px] text-gray-600 space-y-1">
                                        <div>
                                          <span className="font-medium">
                                            Requirement:
                                          </span>{' '}
                                          {it?.requirement
                                            ? formatMealName(it.requirement)
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
                                    )}

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
                                                {it.per_serving.protein ?? '--'}
                                                g
                                              </div>
                                              <div>
                                                Carbs:{' '}
                                                {it.per_serving.carbs ?? '--'}g
                                              </div>
                                              <div>
                                                Fat:{' '}
                                                {it.per_serving.fat ?? '--'}g
                                              </div>
                                              {it.per_serving.fiber && (
                                                <div className="col-span-2">
                                                  Fiber: {it.per_serving.fiber}g
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
                                                      it.actions.consumed_macros
                                                        .fiber
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

                                    {/* Expanded Content - Only when Details button is clicked */}
                                    {isExpanded && (
                                      <div className="mt-2 text-[10px] text-gray-600 space-y-1">
                                        <div>
                                          <span className="font-medium">
                                            Requirement:
                                          </span>{' '}
                                          {it?.requirement
                                            ? formatMealName(it.requirement)
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
                                    )}
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
                                  {d.other_consumed_items.map((extra: any) => {
                                    const extraKey = `extra-${extra?.id}`
                                    const isExtraExpanded =
                                      !!expandedDietItems[extraKey]

                                    return (
                                      <div
                                        key={extra?.id}
                                        className="bg-orange-50 border border-orange-200 rounded-lg p-2 group relative"
                                      >
                                        <div className="flex items-start justify-between mb-1">
                                          <div className="font-medium text-orange-800">
                                            {formatMealName(extra?.meal_name)}
                                          </div>
                                          <div className="text-[9px] text-orange-600">
                                            {extra?.meal_time}
                                          </div>
                                        </div>

                                        {/* Consumed Info - Only show when collapsed */}
                                        {!isExtraExpanded && (
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
                                        )}

                                        {/* Hover Content - Always Visible on Hover */}
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
                                                    {extra.per_serving.carbs ??
                                                      '--'}
                                                    g
                                                  </div>
                                                  <div>
                                                    Fat:{' '}
                                                    {extra.per_serving.fat ??
                                                      '--'}
                                                    g
                                                  </div>
                                                  {extra.per_serving.fiber && (
                                                    <div className="col-span-2">
                                                      Fiber:{' '}
                                                      {extra.per_serving.fiber}g
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
                                                      : extra.actions.status ===
                                                            'missed' ||
                                                          extra.actions
                                                            .status === 'failed'
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
                                  })}
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
          )}

          {effectiveCanAccessWorkout && (
            <Tab id="workout">
              <WorkoutTemplateAssign
                subscriptionId={subscriptionId}
                currentName={
                  dayDetail?.workout_template?.name ||
                  dayDetail?.subscription?.workout_template_name
                }
                currentTemplateId={
                  dayDetail?.workout_template?.id ||
                  dayDetail?.subscription?.workout_template_id
                }
                selectedDayDate={selectedDayDate}
                readOnly={!canAssignTemplate}
                onAssigned={refreshDayDetail as any}
              />
              <div className="max-h-[700px] overflow-y-auto">
                {/* ── Workout Plan Header Card ── */}
                {(() => {
                  const exs: any[] = Array.isArray(
                    dayDetail?.workout_plan?.exercises
                  )
                    ? dayDetail.workout_plan.exercises
                    : []
                  const totalCount = exs.length
                  const doneCount = exs.filter(
                    (e: any) =>
                      String(e?.actions?.status || '').toLowerCase() ===
                      'completed'
                  ).length
                  const inProgressCount = exs.filter(
                    (e: any) =>
                      String(e?.actions?.status || '').toLowerCase() ===
                      'in_progress'
                  ).length
                  const progressPct =
                    totalCount > 0
                      ? Math.round((doneCount / totalCount) * 100)
                      : 0

                  const totalEstMinutes = exs.reduce((sum: number, e: any) => {
                    const dur =
                      e?.duration_minutes ??
                      e?.workout?.duration_minutes ??
                      (typeof e?.actions?.duration_seconds === 'number'
                        ? e.actions.duration_seconds / 60
                        : 0)
                    return sum + (Number(dur) || 0)
                  }, 0)

                  return (
                    <div className="bg-white border border-gray-200/80 rounded-xl p-3.5 mb-3 shadow-xs">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <div className="text-sm font-bold text-gray-800">
                              {dayDetail?.workout_plan?.title || 'Workout Plan'}
                            </div>
                            {totalCount > 0 && (
                              <span
                                className={`text-[10px] font-semibold border px-2 py-0.5 rounded-full ${
                                  progressPct === 100
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : progressPct > 0
                                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                                      : 'bg-gray-50 text-gray-600 border-gray-200'
                                }`}
                              >
                                {doneCount}/{totalCount} Completed (
                                {progressPct}%)
                              </span>
                            )}
                          </div>
                          {dayDetail?.workout_plan?.description && (
                            <div className="text-[11px] text-gray-500 mt-0.5 line-clamp-2">
                              {dayDetail.workout_plan.description}
                            </div>
                          )}
                          <div className="text-xs text-gray-600 mt-2 flex items-center gap-2 flex-wrap">
                            <span className="bg-slate-50 text-slate-700 border border-slate-200 px-2 py-0.5 rounded-md font-medium text-[11px]">
                              🏋️ {totalCount}{' '}
                              {totalCount === 1 ? 'Exercise' : 'Exercises'}
                            </span>
                            {totalEstMinutes > 0 && (
                              <span className="bg-teal-50 text-teal-700 border border-teal-200/80 px-2 py-0.5 rounded-md font-medium text-[11px]">
                                ⏱ Est. {totalEstMinutes.toFixed(1)} mins
                              </span>
                            )}
                            {inProgressCount > 0 && (
                              <span className="bg-amber-50 text-amber-700 border border-amber-200/80 px-2 py-0.5 rounded-md font-medium text-[11px]">
                                ⏳ {inProgressCount} in progress
                              </span>
                            )}
                          </div>
                        </div>

                        {dayDetail?.workout_plan &&
                          canEditDay &&
                          effectiveCanAccessWorkout && (
                            <button
                              type="button"
                              className="px-3 py-1.5 text-xs border rounded-lg btn-primary flex items-center gap-1 font-medium shadow-xs shrink-0"
                              onClick={onEditWorkoutPlan}
                            >
                              <Icons name="edit" className="w-3.5 h-3.5" />
                              <span>Update Day</span>
                            </button>
                          )}
                      </div>

                      {/* Plan-level progress bar */}
                      {totalCount > 0 && (
                        <div className="mt-2.5">
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${progressPct}%`,
                                background:
                                  progressPct === 100
                                    ? '#22c55e'
                                    : progressPct > 50
                                      ? 'linear-gradient(90deg, #3b82f6, #06b6d4)'
                                      : progressPct > 0
                                        ? '#f59e0b'
                                        : '#e2e8f0',
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })()}

                {/* ── Exercises Grouped by Category & Subcategory ── */}
                {dayDetail?.workout_plan ? (
                  (() => {
                    const exs: any[] = Array.isArray(
                      dayDetail.workout_plan.exercises
                    )
                      ? dayDetail.workout_plan.exercises
                      : []

                    if (exs.length === 0)
                      return (
                        <div className="text-xs text-gray-400 text-center py-8">
                          No exercises assigned.
                        </div>
                      )

                    // Helper to extract full metadata
                    const getWorkoutMeta = (ex: any) => {
                      const workoutId =
                        ex?.workout_id || ex?.workout?.id || ex?.id
                      const canonical = workoutsById?.get(String(workoutId))
                      const subId =
                        ex?.category?.id ??
                        ex?.subcategory_id ??
                        ex?.subcategory?.id ??
                        ex?.category_id ??
                        ex?.workout?.subcategory_id ??
                        ex?.workout?.category?.id ??
                        canonical?.category?.id ??
                        canonical?.subcategory?.id ??
                        canonical?.subcategory_id

                      const subMeta =
                        subId != null && subcategoryParentMap
                          ? subcategoryParentMap[String(subId)]
                          : undefined

                      const catName = toTitleCase(
                        subMeta?.categoryName ??
                          canonical?.category?.main_category?.name ??
                          canonical?.category?.parent?.name ??
                          canonical?.category_name ??
                          canonical?.category?.name ??
                          ex?.category?.main_category?.name ??
                          ex?.category?.parent?.name ??
                          ex?.workout?.category?.main_category?.name ??
                          ex?.workout?.category?.parent?.name ??
                          ex?.workout?.category_name ??
                          ex?.category?.main_category_name ??
                          ex?.main_category_name ??
                          ex?.category_name ??
                          (typeof ex?.category === 'string'
                            ? ex.category
                            : '') ??
                          ''
                      )

                      const subName = toTitleCase(
                        subMeta?.label ??
                          canonical?.subcategory?.name ??
                          canonical?.subcategory_name ??
                          canonical?.category?.name ??
                          ex?.category?.name ??
                          ex?.subcategory?.name ??
                          ex?.subcategory_name ??
                          ex?.workout?.subcategory?.name ??
                          ex?.workout?.category?.name ??
                          (typeof ex?.subcategory === 'string'
                            ? ex.subcategory
                            : '') ??
                          ''
                      )

                      const workoutName = toTitleCase(
                        ex?.workout_name ??
                          ex?.workout?.title ??
                          ex?.workout?.name ??
                          canonical?.name ??
                          canonical?.title ??
                          ex?.title ??
                          ex?.name ??
                          '--'
                      )

                      const videoUrl =
                        ex?.video_url ??
                        ex?.workout?.video_url ??
                        canonical?.video_url ??
                        null

                      const reps =
                        ex?.reps ?? ex?.workout?.reps ?? canonical?.reps ?? null
                      const sets =
                        ex?.sets ?? ex?.workout?.sets ?? canonical?.sets ?? null

                      const action = ex?.actions
                      const durationSec =
                        typeof action?.duration_seconds === 'number'
                          ? action.duration_seconds
                          : null

                      const durationMin =
                        ex?.duration_minutes ??
                        ex?.workout?.duration_minutes ??
                        canonical?.duration_minutes ??
                        (durationSec != null
                          ? (durationSec / 60).toFixed(1)
                          : null)

                      const intensity = toTitleCase(
                        ex?.intensity ??
                          ex?.workout?.intensity ??
                          canonical?.intensity ??
                          ex?.difficulty ??
                          canonical?.difficulty ??
                          ''
                      )

                      const exerciseType = toTitleCase(
                        ex?.exercise_type ??
                          ex?.workout?.workout_type ??
                          canonical?.workout_type ??
                          ex?.workout_type ??
                          ''
                      )

                      return {
                        catName,
                        subName,
                        workoutName,
                        videoUrl,
                        reps,
                        sets,
                        durationMin,
                        intensity,
                        exerciseType,
                        action,
                      }
                    }

                    // Group by resolved category & subcategory
                    const grouped: Record<
                      string,
                      { groupKey: string; items: any[] }
                    > = {}

                    exs.forEach((ex: any) => {
                      const meta = getWorkoutMeta(ex)
                      const groupKey =
                        meta.catName &&
                        meta.subName &&
                        meta.catName.toLowerCase() !==
                          meta.subName.toLowerCase()
                          ? `${meta.catName} - ${meta.subName}`
                          : meta.subName || meta.catName || 'General Workout'

                      if (!grouped[groupKey]) {
                        grouped[groupKey] = { groupKey, items: [] }
                      }
                      grouped[groupKey].items.push(ex)
                    })

                    const groupList = Object.values(grouped)

                    // Curated aesthetic group palettes
                    const groupColors = [
                      {
                        bg: 'bg-violet-50/80',
                        border: 'border-violet-200/80',
                        text: 'text-violet-800',
                        dot: 'bg-violet-500',
                        badge: 'bg-violet-100 text-violet-700',
                      },
                      {
                        bg: 'bg-sky-50/80',
                        border: 'border-sky-200/80',
                        text: 'text-sky-800',
                        dot: 'bg-sky-500',
                        badge: 'bg-sky-100 text-sky-700',
                      },
                      {
                        bg: 'bg-emerald-50/80',
                        border: 'border-emerald-200/80',
                        text: 'text-emerald-800',
                        dot: 'bg-emerald-500',
                        badge: 'bg-emerald-100 text-emerald-700',
                      },
                      {
                        bg: 'bg-amber-50/80',
                        border: 'border-amber-200/80',
                        text: 'text-amber-800',
                        dot: 'bg-amber-500',
                        badge: 'bg-amber-100 text-amber-700',
                      },
                      {
                        bg: 'bg-rose-50/80',
                        border: 'border-rose-200/80',
                        text: 'text-rose-800',
                        dot: 'bg-rose-500',
                        badge: 'bg-rose-100 text-rose-700',
                      },
                      {
                        bg: 'bg-teal-50/80',
                        border: 'border-teal-200/80',
                        text: 'text-teal-800',
                        dot: 'bg-teal-500',
                        badge: 'bg-teal-100 text-teal-700',
                      },
                    ]

                    return (
                      <div className="flex flex-col gap-3">
                        {groupList.map(({ groupKey, items }, gi) => {
                          const col = groupColors[gi % groupColors.length]
                          const groupDone = items.filter(
                            (e: any) =>
                              String(e?.actions?.status || '').toLowerCase() ===
                              'completed'
                          ).length

                          return (
                            <div
                              key={groupKey}
                              className={`rounded-xl border ${col.border} overflow-hidden bg-white shadow-xs`}
                            >
                              {/* Group Header */}
                              <div
                                className={`${col.bg} px-3.5 py-2 flex items-center justify-between border-b ${col.border}`}
                              >
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`w-2 h-2 rounded-full ${col.dot} shrink-0 ring-2 ring-white`}
                                  />
                                  <span
                                    className={`text-[12px] font-semibold ${col.text}`}
                                  >
                                    {groupKey}
                                  </span>
                                </div>
                                <span
                                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${col.badge}`}
                                >
                                  {groupDone}/{items.length} completed
                                </span>
                              </div>

                              {/* Exercise Cards */}
                              <div className="divide-y divide-gray-100">
                                {items.map((ex: any, exIdx: number) => {
                                  const meta = getWorkoutMeta(ex)
                                  const action = meta.action
                                  const status = String(
                                    action?.status || ''
                                  ).toLowerCase()
                                  const isCompleted = status === 'completed'
                                  const isMissed =
                                    status === 'missed' || status === 'failed'
                                  const isInProgress = status === 'in_progress'
                                  const hasVideo = !!meta.videoUrl
                                  const watchPct =
                                    action?.video_watch_percentage != null
                                      ? Number(action.video_watch_percentage)
                                      : null
                                  const isVideoBased =
                                    hasVideo && !meta.reps && !meta.sets

                                  // Status pill
                                  const statusPill = isCompleted
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : isMissed
                                      ? 'bg-red-50 text-red-700 border-red-200'
                                      : isInProgress
                                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                                        : status
                                          ? 'bg-slate-50 text-slate-600 border-slate-200'
                                          : ''

                                  // Status left accent bar
                                  const leftAccent = isCompleted
                                    ? 'border-l-[3px] border-l-emerald-500'
                                    : isMissed
                                      ? 'border-l-[3px] border-l-red-500'
                                      : isInProgress
                                        ? 'border-l-[3px] border-l-amber-500'
                                        : 'border-l-[3px] border-l-gray-300'

                                  return (
                                    <div
                                      key={`${ex?.id}-${exIdx}`}
                                      className={`bg-white px-3.5 py-2.5 ${leftAccent} hover:bg-slate-50/50 transition-colors`}
                                    >
                                      {/* Top row: name + status */}
                                      <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 min-w-0 flex items-center gap-1.5 flex-wrap">
                                          <span className="text-[12px] font-semibold text-gray-800 leading-tight">
                                            {meta.workoutName}
                                          </span>
                                          {meta.exerciseType && (
                                            <span className="text-[9px] bg-slate-100 text-slate-600 border border-slate-200 px-1.5 py-0.2 rounded font-medium">
                                              {meta.exerciseType}
                                            </span>
                                          )}
                                        </div>
                                        {status && (
                                          <span
                                            className={`shrink-0 text-[9px] font-semibold border rounded-full px-2 py-0.5 capitalize ${statusPill}`}
                                          >
                                            {isCompleted && '✓ '}
                                            {isInProgress && '⏳ '}
                                            {isMissed && '✕ '}
                                            {status.replace(/_/g, ' ')}
                                          </span>
                                        )}
                                      </div>

                                      {/* Tags row: compact micro-badges */}
                                      <div className="flex flex-wrap items-center gap-1 mt-1.5">
                                        {/* Video link */}
                                        {hasVideo && (
                                          <a
                                            href={meta.videoUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center gap-1 text-[9px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/80 rounded px-1.5 py-0.5 hover:bg-blue-100 hover:border-blue-300 transition-colors shadow-2xs"
                                          >
                                            <svg
                                              className="w-2.5 h-2.5 fill-blue-600"
                                              viewBox="0 0 20 20"
                                            >
                                              <path d="M2 6a2 2 0 012-2h6l2 2h4a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                                              <path
                                                fill="white"
                                                d="M10 9l3 2-3 2V9z"
                                              />
                                            </svg>
                                            <span>
                                              {isVideoBased
                                                ? 'Video-based'
                                                : 'Video'}
                                            </span>
                                          </a>
                                        )}

                                        {/* Video watch % */}
                                        {watchPct != null && (
                                          <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/80 rounded px-1.5 py-0.5 shadow-2xs">
                                            👁 {watchPct}% watched
                                          </span>
                                        )}

                                        {/* Reps */}
                                        {meta.reps != null && (
                                          <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold bg-sky-50 text-sky-700 border border-sky-200/80 rounded px-1.5 py-0.5 shadow-2xs">
                                            <span>🔁</span>
                                            <span>{meta.reps} reps</span>
                                          </span>
                                        )}

                                        {/* Sets */}
                                        {meta.sets != null && (
                                          <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold bg-sky-50 text-sky-700 border border-sky-200/80 rounded px-1.5 py-0.5 shadow-2xs">
                                            <span>📦</span>
                                            <span>{meta.sets} sets</span>
                                          </span>
                                        )}

                                        {/* Duration */}
                                        {meta.durationMin != null && (
                                          <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold bg-teal-50 text-teal-700 border border-teal-200/80 rounded px-1.5 py-0.5 shadow-2xs">
                                            <span>⏱</span>
                                            <span>{meta.durationMin}m</span>
                                          </span>
                                        )}

                                        {/* Intensity */}
                                        {meta.intensity && (
                                          <span
                                            className={`inline-flex items-center gap-0.5 text-[9px] font-semibold border rounded px-1.5 py-0.5 shadow-2xs ${
                                              meta.intensity.toLowerCase() ===
                                              'high'
                                                ? 'bg-red-50 text-red-700 border-red-200'
                                                : meta.intensity.toLowerCase() ===
                                                    'moderate'
                                                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                                                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                            }`}
                                          >
                                            <span>⚡</span>
                                            <span>{meta.intensity}</span>
                                          </span>
                                        )}

                                        {/* Completed timestamp */}
                                        {action?.completed_at && (
                                          <span className="inline-flex items-center gap-0.5 text-[9px] text-gray-500 bg-gray-50 border border-gray-200 rounded px-1.5 py-0.5">
                                            <span className="text-emerald-500 font-bold">
                                              ✓
                                            </span>
                                            <span>
                                              {new Date(
                                                action.completed_at
                                              ).toLocaleTimeString([], {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                              })}
                                            </span>
                                          </span>
                                        )}

                                        {/* Notes */}
                                        {action?.notes && (
                                          <span className="inline-flex items-center gap-0.5 text-[9px] text-gray-600 bg-amber-50/60 border border-amber-200/60 rounded px-1.5 py-0.5 italic">
                                            <span>💬</span>
                                            <span>
                                              &ldquo;{action.notes}&rdquo;
                                            </span>
                                          </span>
                                        )}
                                      </div>

                                      {/* Video watch progress bar */}
                                      {watchPct != null && watchPct > 0 && (
                                        <div className="mt-1.5 h-1 bg-gray-100 rounded-full overflow-hidden">
                                          <div
                                            className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                                            style={{
                                              width: `${Math.min(
                                                watchPct,
                                                100
                                              )}%`,
                                            }}
                                          />
                                        </div>
                                      )}
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )
                  })()
                ) : (
                  <div className="text-xs text-gray-400 text-center py-8">
                    No workout plan assigned.
                  </div>
                )}
              </div>
            </Tab>
          )}

          {effectiveCanAccessYoga &&
            (dayDetail?.yoga_plan ||
              dayDetail?.yoga_template ||
              dayDetail?.subscription?.yoga_template_name ||
              isSuperOrAdmin ||
              isYogist) && (
              <Tab id="yoga">
                <YogaTemplateAssign
                  subscriptionId={subscriptionId}
                  currentName={
                    dayDetail?.yoga_template?.name ||
                    dayDetail?.subscription?.yoga_template_name
                  }
                  currentTemplateId={
                    dayDetail?.yoga_template?.id ||
                    dayDetail?.subscription?.yoga_template_id
                  }
                  selectedDayDate={selectedDayDate}
                  readOnly={!canAssignTemplate}
                  onAssigned={refreshDayDetail as any}
                />
                <div className="max-h-[700px] overflow-y-auto">
                  {/* ── Yoga Plan Header Card ── */}
                  {(() => {
                    const yexs: any[] = Array.isArray(
                      dayDetail?.yoga_plan?.exercises
                    )
                      ? dayDetail.yoga_plan.exercises
                      : []
                    const totalCount = yexs.length
                    const doneCount = yexs.filter(
                      (e: any) =>
                        String(e?.actions?.status || '').toLowerCase() ===
                        'completed'
                    ).length
                    const inProgressCount = yexs.filter(
                      (e: any) =>
                        String(e?.actions?.status || '').toLowerCase() ===
                        'in_progress'
                    ).length
                    const progressPct =
                      totalCount > 0
                        ? Math.round((doneCount / totalCount) * 100)
                        : 0

                    const totalEstMinutes = yexs.reduce(
                      (sum: number, e: any) => {
                        const dur =
                          e?.yoga_duration_minutes ??
                          e?.duration_minutes ??
                          (typeof e?.actions?.duration_seconds === 'number'
                            ? e.actions.duration_seconds / 60
                            : 0)
                        return sum + (Number(dur) || 0)
                      },
                      0
                    )

                    return (
                      <div className="bg-white border border-gray-200/80 rounded-xl p-3.5 mb-3 shadow-xs">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <div className="text-sm font-bold text-gray-800">
                                {dayDetail?.yoga_plan?.title || 'Yoga Plan'}
                              </div>
                              {totalCount > 0 && (
                                <span
                                  className={`text-[10px] font-semibold border px-2 py-0.5 rounded-full ${
                                    progressPct === 100
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                      : progressPct > 0
                                        ? 'bg-purple-50 text-purple-700 border-purple-200'
                                        : 'bg-gray-50 text-gray-600 border-gray-200'
                                  }`}
                                >
                                  {doneCount}/{totalCount} Completed (
                                  {progressPct}%)
                                </span>
                              )}
                            </div>
                            {dayDetail?.yoga_plan?.description && (
                              <div className="text-[11px] text-gray-500 mt-0.5 line-clamp-2">
                                {dayDetail.yoga_plan.description}
                              </div>
                            )}
                            <div className="text-xs text-gray-600 mt-2 flex items-center gap-2 flex-wrap">
                              <span className="bg-slate-50 text-slate-700 border border-slate-200 px-2 py-0.5 rounded-md font-medium text-[11px]">
                                🧘 {totalCount}{' '}
                                {totalCount === 1
                                  ? 'Asana / Exercise'
                                  : 'Asanas / Exercises'}
                              </span>
                              {totalEstMinutes > 0 && (
                                <span className="bg-teal-50 text-teal-700 border border-teal-200/80 px-2 py-0.5 rounded-md font-medium text-[11px]">
                                  ⏱ Est. {totalEstMinutes.toFixed(1)} mins
                                </span>
                              )}
                              {inProgressCount > 0 && (
                                <span className="bg-amber-50 text-amber-700 border border-amber-200/80 px-2 py-0.5 rounded-md font-medium text-[11px]">
                                  ⏳ {inProgressCount} in progress
                                </span>
                              )}
                            </div>
                          </div>

                          {dayDetail?.yoga_plan &&
                            canEditDay &&
                            effectiveCanAccessYoga && (
                              <button
                                type="button"
                                className="px-3 py-1.5 text-xs border rounded-lg btn-primary flex items-center gap-1 font-medium shadow-xs shrink-0"
                                onClick={onEditYogaPlan}
                              >
                                <Icons name="edit" className="w-3.5 h-3.5" />
                                <span>Update Day</span>
                              </button>
                            )}
                        </div>

                        {/* Plan-level progress bar */}
                        {totalCount > 0 && (
                          <div className="mt-2.5">
                            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{
                                  width: `${progressPct}%`,
                                  background:
                                    progressPct === 100
                                      ? '#22c55e'
                                      : progressPct > 50
                                        ? 'linear-gradient(90deg, #8b5cf6, #ec4899)'
                                        : progressPct > 0
                                          ? '#f59e0b'
                                          : '#e2e8f0',
                                }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })()}

                  {/* ── Yoga Exercises Grouped by Category & Subcategory ── */}
                  {dayDetail?.yoga_plan ? (
                    (() => {
                      const yexs: any[] = Array.isArray(
                        dayDetail.yoga_plan.exercises
                      )
                        ? dayDetail.yoga_plan.exercises
                        : []

                      if (yexs.length === 0)
                        return (
                          <div className="text-xs text-gray-400 text-center py-8">
                            No yoga exercises assigned.
                          </div>
                        )

                      // Helper to extract full yoga metadata
                      const getYogaMeta = (exercise: any) => {
                        const yogaId =
                          exercise?.yoga_id ||
                          exercise?.yoga?.id ||
                          exercise?.id
                        const canonical = yogasById?.get(String(yogaId))
                        const subId =
                          exercise?.category?.id ??
                          exercise?.subcategory_id ??
                          exercise?.subcategory?.id ??
                          exercise?.category_id ??
                          canonical?.category?.id ??
                          canonical?.subcategory?.id

                        const subMeta =
                          subId != null && yogaSubcategoryParentMap
                            ? yogaSubcategoryParentMap[String(subId)]
                            : undefined

                        const catName = toTitleCase(
                          subMeta?.categoryName ??
                            canonical?.category?.main_category?.name ??
                            canonical?.category?.parent?.name ??
                            canonical?.category_name ??
                            canonical?.category?.name ??
                            exercise?.category?.main_category?.name ??
                            exercise?.category?.parent?.name ??
                            exercise?.category?.main_category_name ??
                            exercise?.main_category_name ??
                            exercise?.category_name ??
                            (typeof exercise?.category === 'string'
                              ? exercise.category
                              : '') ??
                            ''
                        )

                        const subName = toTitleCase(
                          subMeta?.label ??
                            canonical?.subcategory?.name ??
                            canonical?.subcategory_name ??
                            canonical?.category?.name ??
                            exercise?.category?.name ??
                            exercise?.subcategory?.name ??
                            exercise?.subcategory_name ??
                            (typeof exercise?.subcategory === 'string'
                              ? exercise.subcategory
                              : '') ??
                            ''
                        )

                        const yogaName = toTitleCase(
                          exercise?.yoga_name ??
                            exercise?.yoga?.title ??
                            exercise?.yoga?.name ??
                            canonical?.name ??
                            canonical?.title ??
                            exercise?.title ??
                            exercise?.name ??
                            '--'
                        )

                        const videoUrl =
                          exercise?.video_url ??
                          exercise?.yoga?.video_url ??
                          canonical?.video_url ??
                          null

                        const action = exercise?.actions
                        const durationSec =
                          typeof action?.duration_seconds === 'number'
                            ? action.duration_seconds
                            : null

                        const durationMin =
                          exercise?.yoga_duration_minutes ??
                          exercise?.duration_minutes ??
                          canonical?.duration_minutes ??
                          (durationSec != null
                            ? (durationSec / 60).toFixed(1)
                            : null)

                        const intensity = toTitleCase(
                          exercise?.intensity ??
                            exercise?.difficulty ??
                            canonical?.intensity ??
                            canonical?.difficulty ??
                            ''
                        )

                        const yogaType = toTitleCase(
                          exercise?.yoga_type ??
                            canonical?.yoga_type ??
                            exercise?.type ??
                            ''
                        )

                        const reps =
                          exercise?.reps ??
                          exercise?.yoga?.reps ??
                          canonical?.reps ??
                          null
                        const rounds =
                          exercise?.rounds ??
                          exercise?.yoga?.rounds ??
                          canonical?.rounds ??
                          null
                        const holdSeconds =
                          exercise?.hold_seconds ??
                          exercise?.yoga?.hold_seconds ??
                          canonical?.hold_seconds ??
                          null

                        return {
                          catName,
                          subName,
                          yogaName,
                          videoUrl,
                          durationMin,
                          intensity,
                          yogaType,
                          reps,
                          rounds,
                          holdSeconds,
                          action,
                        }
                      }

                      // Group by resolved category & subcategory
                      const yogaGrouped: Record<
                        string,
                        { groupKey: string; items: any[] }
                      > = {}

                      yexs.forEach((ex: any) => {
                        const meta = getYogaMeta(ex)
                        const groupKey =
                          meta.catName &&
                          meta.subName &&
                          meta.catName.toLowerCase() !==
                            meta.subName.toLowerCase()
                            ? `${meta.catName} - ${meta.subName}`
                            : meta.subName || meta.catName || 'General Yoga'

                        if (!yogaGrouped[groupKey]) {
                          yogaGrouped[groupKey] = { groupKey, items: [] }
                        }
                        yogaGrouped[groupKey].items.push(ex)
                      })

                      const yogaGroupList = Object.values(yogaGrouped)

                      const yogaGroupColors = [
                        {
                          bg: 'bg-purple-50/80',
                          border: 'border-purple-200/80',
                          text: 'text-purple-800',
                          dot: 'bg-purple-500',
                          badge: 'bg-purple-100 text-purple-700',
                        },
                        {
                          bg: 'bg-pink-50/80',
                          border: 'border-pink-200/80',
                          text: 'text-pink-800',
                          dot: 'bg-pink-500',
                          badge: 'bg-pink-100 text-pink-700',
                        },
                        {
                          bg: 'bg-teal-50/80',
                          border: 'border-teal-200/80',
                          text: 'text-teal-800',
                          dot: 'bg-teal-500',
                          badge: 'bg-teal-100 text-teal-700',
                        },
                        {
                          bg: 'bg-indigo-50/80',
                          border: 'border-indigo-200/80',
                          text: 'text-indigo-800',
                          dot: 'bg-indigo-500',
                          badge: 'bg-indigo-100 text-indigo-700',
                        },
                        {
                          bg: 'bg-orange-50/80',
                          border: 'border-orange-200/80',
                          text: 'text-orange-800',
                          dot: 'bg-orange-500',
                          badge: 'bg-orange-100 text-orange-700',
                        },
                        {
                          bg: 'bg-cyan-50/80',
                          border: 'border-cyan-200/80',
                          text: 'text-cyan-800',
                          dot: 'bg-cyan-500',
                          badge: 'bg-cyan-100 text-cyan-700',
                        },
                      ]

                      return (
                        <div className="flex flex-col gap-3">
                          {yogaGroupList.map(({ groupKey, items }, gi) => {
                            const col =
                              yogaGroupColors[gi % yogaGroupColors.length]
                            const gDone = items.filter(
                              (e: any) =>
                                String(
                                  e?.actions?.status || ''
                                ).toLowerCase() === 'completed'
                            ).length

                            return (
                              <div
                                key={groupKey}
                                className={`rounded-xl border ${col.border} overflow-hidden bg-white shadow-xs`}
                              >
                                {/* Group Header */}
                                <div
                                  className={`${col.bg} px-3.5 py-2 flex items-center justify-between border-b ${col.border}`}
                                >
                                  <div className="flex items-center gap-2">
                                    <span
                                      className={`w-2 h-2 rounded-full ${col.dot} shrink-0 ring-2 ring-white`}
                                    />
                                    <span
                                      className={`text-[12px] font-semibold ${col.text}`}
                                    >
                                      {groupKey}
                                    </span>
                                  </div>
                                  <span
                                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${col.badge}`}
                                  >
                                    {gDone}/{items.length} completed
                                  </span>
                                </div>

                                {/* Yoga Cards */}
                                <div className="divide-y divide-gray-100">
                                  {items.map((exercise: any, exIdx: number) => {
                                    const meta = getYogaMeta(exercise)
                                    const action = meta.action
                                    const status = String(
                                      action?.status || ''
                                    ).toLowerCase()
                                    const isC = status === 'completed'
                                    const isM =
                                      status === 'missed' || status === 'failed'
                                    const isIP = status === 'in_progress'
                                    const hasVideo = !!meta.videoUrl
                                    const watchPct =
                                      action?.video_watch_percentage != null
                                        ? Number(action.video_watch_percentage)
                                        : null

                                    const statusPill = isC
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                      : isM
                                        ? 'bg-red-50 text-red-700 border-red-200'
                                        : isIP
                                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                                          : status
                                            ? 'bg-slate-50 text-slate-600 border-slate-200'
                                            : ''

                                    const leftAccent = isC
                                      ? 'border-l-[3px] border-l-emerald-500'
                                      : isM
                                        ? 'border-l-[3px] border-l-red-500'
                                        : isIP
                                          ? 'border-l-[3px] border-l-amber-500'
                                          : 'border-l-[3px] border-l-gray-300'

                                    return (
                                      <div
                                        key={exercise?.id || exIdx}
                                        className={`bg-white px-3.5 py-2.5 ${leftAccent} hover:bg-slate-50/50 transition-colors`}
                                      >
                                        {/* Top row */}
                                        <div className="flex items-start justify-between gap-2">
                                          <div className="flex-1 min-w-0 flex items-center gap-1.5 flex-wrap">
                                            <span className="text-[12px] font-semibold text-gray-800 leading-tight">
                                              {meta.yogaName}
                                            </span>
                                            {meta.yogaType && (
                                              <span className="text-[9px] bg-purple-50 text-purple-700 border border-purple-200 px-1.5 py-0.2 rounded font-medium">
                                                {meta.yogaType}
                                              </span>
                                            )}
                                          </div>
                                          {status && (
                                            <span
                                              className={`shrink-0 text-[9px] font-semibold border rounded-full px-2 py-0.5 capitalize ${statusPill}`}
                                            >
                                              {isC && '✓ '}
                                              {isIP && '⏳ '}
                                              {isM && '✕ '}
                                              {status.replace(/_/g, ' ')}
                                            </span>
                                          )}
                                        </div>

                                        {/* Tags */}
                                        <div className="flex flex-wrap items-center gap-1 mt-1.5">
                                          {hasVideo && (
                                            <a
                                              href={meta.videoUrl}
                                              target="_blank"
                                              rel="noreferrer"
                                              className="inline-flex items-center gap-1 text-[9px] font-semibold bg-purple-50 text-purple-700 border border-purple-200/80 rounded px-1.5 py-0.5 hover:bg-purple-100 hover:border-purple-300 transition-colors shadow-2xs"
                                            >
                                              <svg
                                                className="w-2.5 h-2.5 fill-purple-600"
                                                viewBox="0 0 20 20"
                                              >
                                                <path d="M2 6a2 2 0 012-2h6l2 2h4a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                                                <path
                                                  fill="white"
                                                  d="M10 9l3 2-3 2V9z"
                                                />
                                              </svg>
                                              <span>Video</span>
                                            </a>
                                          )}

                                          {watchPct != null && (
                                            <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/80 rounded px-1.5 py-0.5 shadow-2xs">
                                              👁 {watchPct}% watched
                                            </span>
                                          )}

                                          {meta.durationMin != null && (
                                            <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold bg-teal-50 text-teal-700 border border-teal-200/80 rounded px-1.5 py-0.5 shadow-2xs">
                                              <span>⏱</span>
                                              <span>{meta.durationMin}m</span>
                                            </span>
                                          )}

                                          {meta.rounds != null && (
                                            <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold bg-pink-50 text-pink-700 border border-pink-200/80 rounded px-1.5 py-0.5 shadow-2xs">
                                              <span>🔄</span>
                                              <span>{meta.rounds} rounds</span>
                                            </span>
                                          )}

                                          {meta.reps != null && (
                                            <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold bg-pink-50 text-pink-700 border border-pink-200/80 rounded px-1.5 py-0.5 shadow-2xs">
                                              <span>🔁</span>
                                              <span>{meta.reps} reps</span>
                                            </span>
                                          )}

                                          {meta.holdSeconds != null && (
                                            <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/80 rounded px-1.5 py-0.5 shadow-2xs">
                                              <span>⏳</span>
                                              <span>
                                                {meta.holdSeconds}s hold
                                              </span>
                                            </span>
                                          )}

                                          {meta.intensity && (
                                            <span
                                              className={`inline-flex items-center gap-0.5 text-[9px] font-semibold border rounded px-1.5 py-0.5 shadow-2xs ${
                                                meta.intensity.toLowerCase() ===
                                                'high'
                                                  ? 'bg-red-50 text-red-700 border-red-200'
                                                  : meta.intensity.toLowerCase() ===
                                                      'moderate'
                                                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                                                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                              }`}
                                            >
                                              <span>⚡</span>
                                              <span>{meta.intensity}</span>
                                            </span>
                                          )}

                                          {action?.completed_at && (
                                            <span className="inline-flex items-center gap-0.5 text-[9px] text-gray-500 bg-gray-50 border border-gray-200 rounded px-1.5 py-0.5">
                                              <span className="text-emerald-500 font-bold">
                                                ✓
                                              </span>
                                              <span>
                                                {new Date(
                                                  action.completed_at
                                                ).toLocaleTimeString([], {
                                                  hour: '2-digit',
                                                  minute: '2-digit',
                                                })}
                                              </span>
                                            </span>
                                          )}

                                          {action?.notes && (
                                            <span className="inline-flex items-center gap-0.5 text-[9px] text-gray-600 bg-amber-50/60 border border-amber-200/60 rounded px-1.5 py-0.5 italic">
                                              <span>💬</span>
                                              <span>
                                                &ldquo;{action.notes}&rdquo;
                                              </span>
                                            </span>
                                          )}
                                        </div>

                                        {/* Video progress bar */}
                                        {watchPct != null && watchPct > 0 && (
                                          <div className="mt-1.5 h-1 bg-gray-100 rounded-full overflow-hidden">
                                            <div
                                              className="h-full bg-purple-500 rounded-full transition-all duration-300"
                                              style={{
                                                width: `${Math.min(
                                                  watchPct,
                                                  100
                                                )}%`,
                                              }}
                                            />
                                          </div>
                                        )}
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )
                    })()
                  ) : (
                    <div className="text-xs text-gray-400 text-center py-8">
                      No yoga plan assigned.
                    </div>
                  )}
                </div>
              </Tab>
            )}

          {effectiveCanAccessMeditation && (
            <Tab id="meditation">
              <div className="max-h-[700px] overflow-y-auto">
                {/* ── Meditation Plan Header Card ── */}
                {(() => {
                  const meds: any[] = Array.isArray(dayDetail?.meditations)
                    ? dayDetail.meditations
                    : []
                  const totalCount = meds.length
                  const doneCount = meds.filter(
                    (m: any) =>
                      String(m?.actions?.status || '').toLowerCase() ===
                      'completed'
                  ).length
                  const inProgressCount = meds.filter(
                    (m: any) =>
                      String(m?.actions?.status || '').toLowerCase() ===
                      'in_progress'
                  ).length
                  const progressPct =
                    totalCount > 0
                      ? Math.round((doneCount / totalCount) * 100)
                      : 0

                  const totalEstMinutes = meds.reduce((sum: number, m: any) => {
                    const dur =
                      m?.duration_minutes ??
                      m?.meditation_duration_minutes ??
                      (typeof m?.actions?.duration_seconds === 'number'
                        ? m.actions.duration_seconds / 60
                        : 0)
                    return sum + (Number(dur) || 0)
                  }, 0)

                  return (
                    <div className="bg-white border border-gray-200/80 rounded-xl p-3.5 mb-3 shadow-xs">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <div className="text-sm font-bold text-gray-800">
                              {dayDetail?.meditation_plan?.title ||
                                'Meditation Plan'}
                            </div>
                            {totalCount > 0 && (
                              <span
                                className={`text-[10px] font-semibold border px-2 py-0.5 rounded-full ${
                                  progressPct === 100
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : progressPct > 0
                                      ? 'bg-teal-50 text-teal-700 border-teal-200'
                                      : 'bg-gray-50 text-gray-600 border-gray-200'
                                }`}
                              >
                                {doneCount}/{totalCount} Completed (
                                {progressPct}%)
                              </span>
                            )}
                          </div>
                          {dayDetail?.meditation_plan?.description && (
                            <div className="text-[11px] text-gray-500 mt-0.5 line-clamp-2">
                              {dayDetail.meditation_plan.description}
                            </div>
                          )}
                          <div className="text-xs text-gray-600 mt-2 flex items-center gap-2 flex-wrap">
                            <span className="bg-slate-50 text-slate-700 border border-slate-200 px-2 py-0.5 rounded-md font-medium text-[11px]">
                              🧘 {totalCount}{' '}
                              {totalCount === 1 ? 'Session' : 'Sessions'}
                            </span>
                            {totalEstMinutes > 0 && (
                              <span className="bg-teal-50 text-teal-700 border border-teal-200/80 px-2 py-0.5 rounded-md font-medium text-[11px]">
                                ⏱ Est. {totalEstMinutes.toFixed(1)} mins
                              </span>
                            )}
                            {inProgressCount > 0 && (
                              <span className="bg-amber-50 text-amber-700 border border-amber-200/80 px-2 py-0.5 rounded-md font-medium text-[11px]">
                                ⏳ {inProgressCount} in progress
                              </span>
                            )}
                          </div>
                        </div>

                        {canEditDay && effectiveCanAccessMeditation && (
                          <button
                            type="button"
                            className="px-3 py-1.5 text-xs border rounded-lg btn-primary flex items-center gap-1 font-medium shadow-xs shrink-0"
                            onClick={onEditMeditationPlan}
                          >
                            <Icons name="edit" className="w-3.5 h-3.5" />
                            <span>Update Day</span>
                          </button>
                        )}
                      </div>

                      {/* Plan-level progress bar */}
                      {totalCount > 0 && (
                        <div className="mt-2.5">
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${progressPct}%`,
                                background:
                                  progressPct === 100
                                    ? '#22c55e'
                                    : progressPct > 50
                                      ? 'linear-gradient(90deg, #0d9488, #06b6d4)'
                                      : progressPct > 0
                                        ? '#f59e0b'
                                        : '#e2e8f0',
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })()}

                {/* ── Meditation Items List / Grouped ── */}
                {Array.isArray(dayDetail?.meditations) &&
                dayDetail.meditations.length > 0 ? (
                  (() => {
                    const meds = dayDetail.meditations

                    // Group by category/subcategory if available, else single group
                    const grouped: Record<
                      string,
                      { groupKey: string; items: any[] }
                    > = {}

                    meds.forEach((m: any) => {
                      const catName = toTitleCase(
                        m?.category?.name ??
                          m?.category_name ??
                          m?.main_category_name ??
                          ''
                      )
                      const subName = toTitleCase(
                        m?.subcategory?.name ?? m?.subcategory_name ?? ''
                      )
                      const groupKey =
                        catName &&
                        subName &&
                        catName.toLowerCase() !== subName.toLowerCase()
                          ? `${catName} - ${subName}`
                          : subName || catName || 'Guided Meditation'

                      if (!grouped[groupKey]) {
                        grouped[groupKey] = { groupKey, items: [] }
                      }
                      grouped[groupKey].items.push(m)
                    })

                    const medGroupList = Object.values(grouped)

                    const medGroupColors = [
                      {
                        bg: 'bg-teal-50/80',
                        border: 'border-teal-200/80',
                        text: 'text-teal-800',
                        dot: 'bg-teal-500',
                        badge: 'bg-teal-100 text-teal-700',
                      },
                      {
                        bg: 'bg-cyan-50/80',
                        border: 'border-cyan-200/80',
                        text: 'text-cyan-800',
                        dot: 'bg-cyan-500',
                        badge: 'bg-cyan-100 text-cyan-700',
                      },
                      {
                        bg: 'bg-indigo-50/80',
                        border: 'border-indigo-200/80',
                        text: 'text-indigo-800',
                        dot: 'bg-indigo-500',
                        badge: 'bg-indigo-100 text-indigo-700',
                      },
                      {
                        bg: 'bg-sky-50/80',
                        border: 'border-sky-200/80',
                        text: 'text-sky-800',
                        dot: 'bg-sky-500',
                        badge: 'bg-sky-100 text-sky-700',
                      },
                    ]

                    return (
                      <div className="flex flex-col gap-3">
                        {medGroupList.map(({ groupKey, items }, gi) => {
                          const col = medGroupColors[gi % medGroupColors.length]
                          const gDone = items.filter(
                            (e: any) =>
                              String(e?.actions?.status || '').toLowerCase() ===
                              'completed'
                          ).length

                          return (
                            <div
                              key={groupKey}
                              className={`rounded-xl border ${col.border} overflow-hidden bg-white shadow-xs`}
                            >
                              {/* Group Header */}
                              <div
                                className={`${col.bg} px-3.5 py-2 flex items-center justify-between border-b ${col.border}`}
                              >
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`w-2 h-2 rounded-full ${col.dot} shrink-0 ring-2 ring-white`}
                                  />
                                  <span
                                    className={`text-[12px] font-semibold ${col.text}`}
                                  >
                                    {groupKey}
                                  </span>
                                </div>
                                <span
                                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${col.badge}`}
                                >
                                  {gDone}/{items.length} completed
                                </span>
                              </div>

                              {/* Meditation Cards */}
                              <div className="divide-y divide-gray-100">
                                {items.map((m: any, mIdx: number) => {
                                  const action = m?.actions
                                  const status = String(
                                    action?.status || ''
                                  ).toLowerCase()
                                  const isCompleted = status === 'completed'
                                  const isMissed =
                                    status === 'missed' || status === 'failed'
                                  const isInProgress =
                                    status === 'in_progress' ||
                                    status === 'today'
                                  const hasVideo =
                                    !!m?.video_url || !!m?.meditation_video_url
                                  const videoUrl =
                                    m?.video_url || m?.meditation_video_url
                                  const watchPct =
                                    action?.video_watch_percentage != null
                                      ? Number(action.video_watch_percentage)
                                      : null

                                  const durationSec =
                                    typeof action?.duration_seconds === 'number'
                                      ? action.duration_seconds
                                      : null
                                  const durationMin =
                                    m?.duration_minutes ??
                                    m?.meditation_duration_minutes ??
                                    (durationSec != null
                                      ? (durationSec / 60).toFixed(1)
                                      : null)

                                  const meditationType = toTitleCase(
                                    m?.type ?? m?.meditation_type ?? ''
                                  )

                                  const statusPill = isCompleted
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : isMissed
                                      ? 'bg-red-50 text-red-700 border-red-200'
                                      : isInProgress
                                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                                        : status
                                          ? 'bg-slate-50 text-slate-600 border-slate-200'
                                          : ''

                                  const leftAccent = isCompleted
                                    ? 'border-l-[3px] border-l-emerald-500'
                                    : isMissed
                                      ? 'border-l-[3px] border-l-red-500'
                                      : isInProgress
                                        ? 'border-l-[3px] border-l-amber-500'
                                        : 'border-l-[3px] border-l-gray-300'

                                  return (
                                    <div
                                      key={`${m?.id}-${mIdx}`}
                                      className={`bg-white px-3.5 py-2.5 ${leftAccent} hover:bg-slate-50/50 transition-colors`}
                                    >
                                      {/* Top row: name + type + status */}
                                      <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 min-w-0 flex items-center gap-1.5 flex-wrap">
                                          <span className="text-[12px] font-semibold text-gray-800 leading-tight">
                                            {toTitleCase(
                                              m?.title ??
                                                m?.meditation_title ??
                                                m?.name ??
                                                ''
                                            ) || '--'}
                                          </span>
                                          {meditationType && (
                                            <span className="text-[9px] bg-teal-50 text-teal-700 border border-teal-200 px-1.5 py-0.2 rounded font-medium">
                                              {meditationType}
                                            </span>
                                          )}
                                        </div>
                                        {status && (
                                          <span
                                            className={`shrink-0 text-[9px] font-semibold border rounded-full px-2 py-0.5 capitalize ${statusPill}`}
                                          >
                                            {isCompleted && '✓ '}
                                            {isInProgress && '⏳ '}
                                            {isMissed && '✕ '}
                                            {status.replace(/_/g, ' ')}
                                          </span>
                                        )}
                                      </div>

                                      {/* Description if any */}
                                      {m?.description && (
                                        <div className="text-[11px] text-gray-500 mt-1 line-clamp-2">
                                          {m.description}
                                        </div>
                                      )}

                                      {/* Tags row: compact micro-badges */}
                                      <div className="flex flex-wrap items-center gap-1 mt-1.5">
                                        {/* Video link */}
                                        {hasVideo && (
                                          <a
                                            href={videoUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center gap-1 text-[9px] font-semibold bg-teal-50 text-teal-700 border border-teal-200/80 rounded px-1.5 py-0.5 hover:bg-teal-100 hover:border-teal-300 transition-colors shadow-2xs"
                                          >
                                            <svg
                                              className="w-2.5 h-2.5 fill-teal-600"
                                              viewBox="0 0 20 20"
                                            >
                                              <path d="M2 6a2 2 0 012-2h6l2 2h4a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                                              <path
                                                fill="white"
                                                d="M10 9l3 2-3 2V9z"
                                              />
                                            </svg>
                                            <span>Video</span>
                                          </a>
                                        )}

                                        {/* Video watch % */}
                                        {watchPct != null && (
                                          <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/80 rounded px-1.5 py-0.5 shadow-2xs">
                                            👁 {watchPct}% watched
                                          </span>
                                        )}

                                        {/* Duration */}
                                        {durationMin != null && (
                                          <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold bg-cyan-50 text-cyan-700 border border-cyan-200/80 rounded px-1.5 py-0.5 shadow-2xs">
                                            <span>⏱</span>
                                            <span>{durationMin}m</span>
                                          </span>
                                        )}

                                        {/* Completed timestamp */}
                                        {action?.completed_at && (
                                          <span className="inline-flex items-center gap-0.5 text-[9px] text-gray-500 bg-gray-50 border border-gray-200 rounded px-1.5 py-0.5">
                                            <span className="text-emerald-500 font-bold">
                                              ✓
                                            </span>
                                            <span>
                                              {new Date(
                                                action.completed_at
                                              ).toLocaleTimeString([], {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                              })}
                                            </span>
                                          </span>
                                        )}

                                        {/* Notes */}
                                        {action?.notes && (
                                          <span className="inline-flex items-center gap-0.5 text-[9px] text-gray-600 bg-amber-50/60 border border-amber-200/60 rounded px-1.5 py-0.5 italic">
                                            <span>💬</span>
                                            <span>
                                              &ldquo;{action.notes}&rdquo;
                                            </span>
                                          </span>
                                        )}
                                      </div>

                                      {/* Video watch progress bar */}
                                      {watchPct != null && watchPct > 0 && (
                                        <div className="mt-1.5 h-1 bg-gray-100 rounded-full overflow-hidden">
                                          <div
                                            className="h-full bg-teal-500 rounded-full transition-all duration-300"
                                            style={{
                                              width: `${Math.min(
                                                watchPct,
                                                100
                                              )}%`,
                                            }}
                                          />
                                        </div>
                                      )}
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )
                  })()
                ) : (
                  <div className="text-xs text-gray-400 text-center py-8">
                    No meditation sessions assigned.
                  </div>
                )}
              </div>
            </Tab>
          )}
        </TabContainer>
      </div>

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

          const newMealTime = String(values.meal_time || '')
            .trim()
            .toUpperCase()
          const oldMealTime = String(selectedMealTiming?.meal_time ?? '')
            .trim()
            .toUpperCase()

          updateUserMealTimingMutate({
            userId,
            payload: {
              user_meal_timing: {
                meal_time: newMealTime,
                old_meal_time: oldMealTime,
                time: time12,
                diet_plan_id: selectedMealTiming?.id,
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
            <div className="flex flex-col gap-4">
              <Controller
                name="meal_time"
                control={mealTimeForm.control}
                rules={{
                  required: 'Meal timing name is required.',
                  validate: (val) =>
                    Boolean(val && String(val).trim()) ||
                    'Meal timing name is required.',
                }}
                render={({ field: { value, onChange } }) => (
                  <TextField
                    id="edit-meal-time"
                    label="Meal Timing"
                    name="meal_time"
                    value={value || ''}
                    placeholder="e.g. MORNING DRINK, BREAKFAST..."
                    onChange={(e: any) => onChange(e?.target?.value ?? e)}
                    disabled={isUpdatingMealTime}
                    required
                    errors={mealTimeForm.formState.errors as any}
                  />
                )}
              />
              <Controller
                name="time"
                control={mealTimeForm.control}
                rules={{
                  required: 'Required.',
                  validate: (val) =>
                    Boolean(val && String(val).trim()) || 'Required.',
                }}
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

      <DayDietEditorDrawer
        open={dayDietEditorOpen}
        handleClose={() => setDayDietEditorOpen(false)}
        dayDetail={dayDetail}
        subscriptionId={subscriptionId}
        onSuccess={async () => {
          try {
            await refreshDayDetail?.()
          } catch (err) {
            console.error(
              'Failed to refresh day detail after day diet update',
              err
            )
          }
        }}
      />
    </>
  )
}

export default DayDetailTabsSection

const toTitleCase = (value?: string | null) => {
  if (!value) return ''
  return value
    .toString()
    .toLowerCase()
    .replace(/\b([a-z])/g, (letter) => letter.toUpperCase())
}
