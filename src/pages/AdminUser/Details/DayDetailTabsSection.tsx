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
import { useNavigate } from 'react-router-dom'
import Icons from '../../../components/common/icons'
import { DialogModal, TextField } from '../../../components/common'
import { Tab, TabContainer } from '../../../components/common/tab'
import CustomDrawer from '../../../components/common/drawer'
import TimeSplitPicker from '../../../components/common/inputs/TimeSplitPicker'
import { useTemplateList } from '../../DietTemplate/api'
import { useDietTemplateCategories } from '../../DietTemplateCategories/api'
import { useSnackbarManager } from '../../../components/common/snackbar'
import { getErrorMessage } from '../../../utilities/parsers'
import { assignDietPlanTemplate, useUpdateUserMealTiming } from '../api'
import WorkoutTemplateAssign from '../../WorkoutTemplate/Assign'
import YogaTemplateAssign from '../../YogaTemplate/Assign'
import { useAuthStore } from '../../../store/authStore'
import { useMutation } from '@tanstack/react-query'
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
}

const formatMealName = (value?: string | null) => {
  if (!value) return '--'
  const trimmed = value.trim()
  if (!trimmed) return '--'
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase()
}

const titleCaseWords = (value?: string | null) =>
  (value ?? '')
    .split(' ')
    .filter((part) => part.trim().length)
    .map((part) => part[0].toUpperCase() + part.slice(1).toLowerCase())
    .join(' ')

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
  const effectiveCanAccessYoga = canAccessYoga ?? (isSuperOrAdmin || isYogist)
  const effectiveCanAccessMeditation =
    canAccessMeditation ?? (isSuperOrAdmin || isNutritionistRole || isYogist)
  const [assignTemplateOpen, setAssignTemplateOpen] = useState(false)
  const [dayDietEditorOpen, setDayDietEditorOpen] = useState(false)
  const [mealTimeEditOpen, setMealTimeEditOpen] = useState(false)
  const [selectedMealTiming, setSelectedMealTiming] = useState<any>(null)
  const [templateSearch, setTemplateSearch] = useState('')
  const [templateCategoryFilter, setTemplateCategoryFilter] = useState('')
  const [templatePage, setTemplatePage] = useState(1)
  const [templatePerPage, setTemplatePerPage] = useState(10)
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(
    null
  )
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
  const navigate = useNavigate()

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

  const { mutateAsync: assignTemplate, isLoading: assignTemplateLoading } =
    useMutation(
      ({
        subscriptionId: subId,
        payload,
      }: {
        subscriptionId: string | number
        payload: { diet_plan_template_id: number; start_date?: string }
      }) => assignDietPlanTemplate(subId, payload),
      {
        onSuccess: async () => {
          enqueueSnackbar('Template assigned successfully', {
            variant: 'success',
          })
          handleAssignTemplateClose()
          try {
            await refreshDayDetail?.()
          } catch (err) {
            console.error(
              'Failed to refresh day detail after template assign',
              err
            )
          }
        },
        onError: (error: any) => {
          const resp = error?.response?.data
          const rawMessage =
            (Array.isArray(resp?.errors) && resp.errors[0]) ||
            resp?.detail ||
            error

          const message =
            typeof rawMessage === 'string'
              ? rawMessage
              : getErrorMessage(rawMessage)

          enqueueSnackbar(message, {
            variant: 'error',
          })
        },
      }
    )

  const templateName = dayDetail?.subscription?.diet_plan_template_name?.trim()
  const templateId =
    dayDetail?.subscription?.diet_plan_template_id ??
    dayDetail?.diet_plan_template_id ??
    dayDetail?.subscription?.diet_plan_template?.id ??
    null
  const handleTemplateNameClick = () => {
    if (!templateId) return
    navigate(`/diet-template/${templateId}`)
  }

  const templateListParams = useMemo(
    () => ({
      page: templatePage,
      per_page: templatePerPage,
      search: templateSearch || undefined,
      diet_template_category_id: templateCategoryFilter || undefined,
    }),
    [templateCategoryFilter, templatePage, templatePerPage, templateSearch]
  )

  const { data: templateListData, isFetching: templateListLoading } =
    useTemplateList(templateListParams)
  const { data: dietTemplateCategoriesData } = useDietTemplateCategories({
    page: 1,
    per_page: 100,
    status: 'active',
  })
  const dietTemplateCategoryOptions = Array.isArray(
    dietTemplateCategoriesData?.diet_template_categories
  )
    ? dietTemplateCategoriesData.diet_template_categories
    : []

  useEffect(() => {
    const totalPages = Number(templateListData?.meta?.total_pages ?? 0)
    if (totalPages > 0 && templatePage > totalPages) {
      setTemplatePage(totalPages)
    }
  }, [templateListData?.meta?.total_pages, templatePage])

  const handleAssignTemplateClose = () => {
    setAssignTemplateOpen(false)
    setTemplateSearch('')
    setTemplateCategoryFilter('')
    setTemplatePage(1)
  }

  const selectedDayDate =
    dayDetail?.date ?? dayDetail?.day_date ?? dayDetail?.dayDate ?? null

  const handleAssignTemplate = async (
    templateId: number | string | null | undefined
  ) => {
    const normalizedTemplateId = Number(templateId)
    if (!subscriptionId || !Number.isFinite(normalizedTemplateId)) {
      enqueueSnackbar('Missing subscription or template information', {
        variant: 'error',
      })
      return
    }
    const formattedStartDate = selectedDayDate
      ? moment(selectedDayDate).format('YYYY-MM-DD')
      : undefined
    try {
      await assignTemplate({
        subscriptionId,
        payload: {
          diet_plan_template_id: normalizedTemplateId,
          start_date: formattedStartDate,
        },
      })
    } catch {
      /* handled in onError */
    }
  }

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

  const showAssignTemplateButton = useMemo(() => {
    if (!effectiveCanAccessDiet) return false
    return canAssignTemplate
  }, [effectiveCanAccessDiet, canAssignTemplate])

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
              <div className="bg-white text-xs">
                {/* ================= HEADER ================= */}
                <div className="sticky top-0 z-10 bg-gray-50 p-4 ">
                  <div className="bg-white shadow-md p-4 flex items-center justify-between">
                    <div className="text-sm font-semibold">
                      {templateName ? (
                        <button
                          type="button"
                          onClick={handleTemplateNameClick}
                          className="text-primary hover:underline"
                        >
                          {titleCaseWords(templateName)}
                        </button>
                      ) : (
                        'Diet Plans'
                      )}
                      <div className="text-xs text-gray-600 mt-1 flex gap-3">
                        <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                          Proposed: {dayDetail?.total_proposed_calories ?? '--'}{' '}
                          kcal
                        </span>
                        <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded">
                          Consumed: {dayDetail?.total_consumed_calories ?? 0}{' '}
                          kcal
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {canEditDay && effectiveCanAccessDiet && (
                        <button
                          type="button"
                          onClick={() => setDayDietEditorOpen(true)}
                          className="px-3 py-1.5 text-xs border rounded btn-primary flex items-center gap-1 font-medium shadow-xs"
                        >
                          <Icons name="edit" className="w-3.5 h-3.5" />
                          <span>Update Day</span>
                        </button>
                      )}
                      {showAssignTemplateButton && (
                        <button
                          type="button"
                          onClick={() => setAssignTemplateOpen(true)}
                          className="inline-flex items-center px-3 py-1.5 bg-primaryGreen text-white text-xs font-medium rounded-lg hover:bg-primaryGreen/90 focus:outline-none focus:ring-2 focus:ring-primaryGreen/50"
                        >
                          <Icons name="plus" className="w-3 h-3 mr-1 mb-1" />
                          {templateId ? 'Update Template' : 'Assign Template'}
                        </button>
                      )}
                    </div>
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
                              {d?.meal_name && (
                                <div className="text-sm text-gray-600 font-medium">
                                  {formatMealName(d.meal_name)}
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
                readOnly={!canAssignTemplate}
                onAssigned={refreshDayDetail as any}
              />
              <div className="max-h-[700px] overflow-y-auto">
                <div className="border rounded p-3 bg-white max-h-[500px] overflow-y-auto">
                  <div className="flex items-center justify-between mb-2 gap-3">
                    <div className="text-sm font-semibold">Workout Plan</div>
                    {dayDetail?.workout_plan &&
                      canEditDay &&
                      effectiveCanAccessWorkout && (
                        <button
                          type="button"
                          className="px-3 py-1 text-xs border rounded btn-primary flex items-center gap-1"
                          onClick={onEditWorkoutPlan}
                        >
                          <Icons name="edit" />
                          <span>Update Day</span>
                        </button>
                      )}
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
                                  className="flex items-center justify-between border rounded px-3 py-2 gap-3"
                                >
                                  <div className="flex items-start gap-3 flex-1">
                                    <div className="flex flex-col">
                                      <span className="font-medium">
                                        {toTitleCase(ex?.workout_name) || '--'}
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
                  readOnly={!canAssignTemplate}
                  onAssigned={refreshDayDetail as any}
                />
                <div className="max-h-[700px] overflow-y-auto">
                  <div className="border rounded p-3 bg-white max-h-[500px] overflow-y-auto">
                    <div className="flex items-center justify-between mb-2 gap-3">
                      <div className="text-sm font-semibold">Yoga Plan</div>
                      {dayDetail?.yoga_plan &&
                        canEditDay &&
                        effectiveCanAccessYoga && (
                          <button
                            type="button"
                            className="px-3 py-1 text-xs border rounded btn-primary flex items-center gap-1"
                            onClick={onEditYogaPlan}
                          >
                            <Icons name="edit" />
                            <span>Update Day</span>
                          </button>
                        )}
                    </div>
                    {dayDetail?.yoga_plan ? (
                      <div className="flex flex-col gap-2 text-xs">
                        <div className="mb-2">
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
                          <div className="flex flex-col gap-2 text-xs">
                            {dayDetail.yoga_plan.exercises.map(
                              (exercise: any, idx: number) => {
                                const action = exercise?.actions
                                const yogaStatus = String(
                                  action?.status || ''
                                ).toLowerCase()
                                const yogaStatusClass =
                                  yogaStatus === 'completed'
                                    ? 'text-green-600'
                                    : yogaStatus === 'missed' ||
                                        yogaStatus === 'failed'
                                      ? 'text-red-600'
                                      : yogaStatus === 'in_progress'
                                        ? 'text-amber-600'
                                        : 'text-gray-600'

                                return (
                                  <div
                                    key={exercise?.id || idx}
                                    className="flex items-center justify-between border rounded px-3 py-2 bg-gray-50"
                                  >
                                    <div className="flex flex-col">
                                      <span className="font-medium text-gray-800">
                                        {exercise?.yoga_name ||
                                          exercise?.title ||
                                          exercise?.name ||
                                          '--'}
                                      </span>
                                      {exercise?.video_url && (
                                        <a
                                          className="text-primaryBlue underline text-[11px]"
                                          href={exercise.video_url}
                                          target="_blank"
                                          rel="noreferrer"
                                        >
                                          Video
                                        </a>
                                      )}
                                    </div>
                                    <div className="text-right text-[11px] text-gray-600 space-y-0.5">
                                      {exercise?.yoga_duration_minutes ? (
                                        <div>
                                          Duration:{' '}
                                          {exercise.yoga_duration_minutes}m
                                        </div>
                                      ) : exercise?.duration_minutes ? (
                                        <div>
                                          Duration: {exercise.duration_minutes}m
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
                          <div className="text-xs text-gray-500">No yoga.</div>
                        )}
                      </div>
                    ) : (
                      <div className="text-xs text-gray-500">No yoga plan.</div>
                    )}
                  </div>
                </div>
              </Tab>
            )}

          {effectiveCanAccessMeditation && (
            <Tab id="meditation">
              <div className="max-h-[700px] overflow-y-auto">
                <div className="border rounded p-3 bg-white max-h-[500px] overflow-y-auto">
                  <div className="flex items-center justify-between mb-2 gap-3">
                    <div className="text-sm font-semibold">Meditation</div>
                    {canEditDay && effectiveCanAccessMeditation && (
                      <button
                        type="button"
                        className="px-3 py-1 text-xs border rounded btn-primary flex items-center gap-1"
                        onClick={onEditMeditationPlan}
                      >
                        <Icons name="edit" />
                        <span>Update Day</span>
                      </button>
                    )}
                  </div>
                  {Array.isArray(dayDetail?.meditations) &&
                  dayDetail.meditations.length > 0 ? (
                    <div className="flex flex-col gap-2 text-xs">
                      {dayDetail.meditations.map((m: any, idx: number) => {
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
                                {formatTitleCase(m?.title || '--')}
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
                                <div>Duration: {m.duration_minutes}m</div>
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
                      })}
                    </div>
                  ) : (
                    <div className="text-xs text-gray-500">
                      No meditation items.
                    </div>
                  )}
                </div>
              </div>
            </Tab>
          )}
        </TabContainer>
      </div>

      {(() => (
        <CustomDrawer
          open={assignTemplateOpen}
          handleClose={handleAssignTemplateClose}
          className="w-screen max-w-[1000px]"
          unmountOnClose
          title="Assign Diet Template"
          handleSubmit={() => {
            if (selectedTemplateId) {
              handleAssignTemplate(selectedTemplateId)
            }
          }}
          disableSubmit={!selectedTemplateId || assignTemplateLoading}
          actionLoader={assignTemplateLoading}
          actionLabel="Assign Template"
        >
          <div className="space-y-4">
            {/* Header Subtitle Banner */}
            <div className="bg-gradient-to-r from-emerald-50/50 via-white to-teal-50/50 border border-emerald-100/80 rounded-xl p-3.5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between shadow-xs">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">🥗</span>
                <div>
                  <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                    Select Diet Template
                  </h4>
                  <p className="text-[11px] text-gray-500">
                    Choose a diet template to assign to this subscription
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {templateListData?.meta?.total_count ?? 0}{' '}
                  {templateListData?.meta?.total_count === 1
                    ? 'Template'
                    : 'Templates'}
                </span>
              </div>
            </div>

            {/* Search & Category Filter Bar */}
            <div className="flex flex-col sm:flex-row items-center gap-2.5">
              <div className="relative flex-1 w-full">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                <input
                  type="text"
                  className="w-full pl-10 pr-10 py-2.5 text-xs bg-white border border-gray-200 rounded-xl shadow-xs placeholder-gray-400 focus:outline-none focus:border-primaryGreen focus:ring-2 focus:ring-primaryGreen/20 transition-all"
                  value={templateSearch}
                  placeholder="Search diet templates by name, category, or description..."
                  onChange={(e) => {
                    setTemplatePage(1)
                    setTemplateSearch(e.target.value)
                  }}
                />
                {templateSearch && (
                  <button
                    type="button"
                    onClick={() => {
                      setTemplatePage(1)
                      setTemplateSearch('')
                    }}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                    title="Clear search"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                )}
              </div>

              <div className="w-full sm:w-60">
                <select
                  className="w-full py-2.5 px-3 text-xs bg-white border border-gray-200 rounded-xl shadow-xs focus:outline-none focus:border-primaryGreen focus:ring-2 focus:ring-primaryGreen/20 transition-all text-gray-700"
                  value={templateCategoryFilter}
                  onChange={(event) => {
                    setTemplatePage(1)
                    setTemplateCategoryFilter(event.target.value)
                  }}
                >
                  <option value="">Diet Plan Category</option>
                  {dietTemplateCategoryOptions.map((category: any) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Cards Grid Listing */}
            {templateListLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {[1, 2, 3, 4].map((idx) => (
                  <div
                    key={idx}
                    className="border border-gray-100 rounded-2xl p-4 bg-white shadow-xs animate-pulse space-y-3"
                  >
                    <div className="flex justify-between">
                      <div className="h-5 bg-gray-100 rounded-full w-24" />
                      <div className="h-6 w-6 bg-gray-100 rounded-full" />
                    </div>
                    <div className="h-4 bg-gray-100 rounded w-3/4" />
                    <div className="h-3 bg-gray-100 rounded w-full" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : !templateListData?.diet_plan_templates ||
              templateListData.diet_plan_templates.length === 0 ? (
              <div className="p-12 text-center border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
                <div className="w-12 h-12 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mx-auto mb-3 text-xl">
                  🔍
                </div>
                <h5 className="text-sm font-bold text-gray-800">
                  No diet templates found
                </h5>
                <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                  {templateSearch || templateCategoryFilter
                    ? 'No diet templates match your search or filter criteria. Try clearing them.'
                    : 'There are no active diet templates configured yet.'}
                </p>
                {(templateSearch || templateCategoryFilter) && (
                  <button
                    type="button"
                    onClick={() => {
                      setTemplatePage(1)
                      setTemplateSearch('')
                      setTemplateCategoryFilter('')
                    }}
                    className="mt-3 px-3 py-1.5 rounded-lg bg-gray-200 text-gray-700 text-xs font-semibold hover:bg-gray-300 transition-colors"
                  >
                    Clear Search & Filters
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {templateListData.diet_plan_templates.map((template: any) => {
                  const selected = selectedTemplateId === template?.id
                  const categoryName =
                    template?.category?.name ||
                    template?.category_name ||
                    template?.diet_template_category?.name ||
                    ''

                  return (
                    <div
                      key={template?.id ?? template?.name}
                      onClick={() => setSelectedTemplateId(template?.id)}
                      className={`group relative rounded-2xl border-2 p-4 transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-3 bg-white ${
                        selected
                          ? 'border-primaryGreen ring-4 ring-primaryGreen/15 shadow-md bg-gradient-to-b from-teal-50/20 to-white'
                          : 'border-gray-200/80 hover:border-primaryGreen/50 hover:shadow-md hover:-translate-y-0.5'
                      }`}
                    >
                      {/* Top Row: Category Badge & Duration + Selection Circle */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            {categoryName || 'Diet Template'}
                          </span>
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-semibold bg-gray-100 text-gray-700">
                            <svg
                              className="w-3 h-3 text-gray-500"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            {template?.duration_days ?? 0} Days
                          </span>
                        </div>

                        {/* Selection Circle */}
                        <div
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all shrink-0 ${
                            selected
                              ? 'bg-primaryGreen border-primaryGreen text-white shadow-xs'
                              : 'border-gray-300 bg-white text-transparent group-hover:border-primaryGreen/70'
                          }`}
                        >
                          <svg
                            className={`w-3.5 h-3.5 ${
                              selected ? 'opacity-100' : 'opacity-0'
                            }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="3"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </div>
                      </div>

                      {/* Card Content Details */}
                      <div className="space-y-1">
                        <h4 className="text-xs md:text-sm font-bold text-gray-900 line-clamp-1 group-hover:text-primaryGreen transition-colors">
                          {toTitleCase(template?.name) || 'Untitled Template'}
                        </h4>

                        {/* Description */}
                        <p
                          className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed"
                          title={template?.description}
                        >
                          {template?.description
                            ? template.description.trim()
                            : 'No detailed description provided for this diet template.'}
                        </p>
                      </div>

                      {/* Metadata Pills Footer */}
                      <div className="pt-2 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2 text-[11px] text-gray-500">
                        <div className="flex items-center gap-3 font-medium text-gray-700">
                          <div className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-primaryGreen" />
                            <span>
                              {template?.total_meals ??
                                template?.meals_count ??
                                0}{' '}
                              Meals
                            </span>
                          </div>
                          {template?.calories ? (
                            <div className="flex items-center gap-1 text-gray-500">
                              <span>🔥 {template.calories} Cal</span>
                            </div>
                          ) : null}
                        </div>

                        {template?.created_at ? (
                          <span className="text-gray-400">
                            Added:{' '}
                            {moment(template.created_at).format('DD-MM-YYYY')}
                          </span>
                        ) : (
                          <span className="text-gray-400">
                            ID: #{template?.id ?? '—'}
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Pagination Controls Footer */}
            {(templateListData?.meta?.total_count ?? 0) > 0 && (
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500 border-t border-gray-100">
                <span>
                  Showing {templateListData?.diet_plan_templates?.length ?? 0}{' '}
                  of {templateListData?.meta?.total_count ?? 0} templates (Page{' '}
                  {templatePage} of{' '}
                  {Math.max(
                    1,
                    Math.ceil(
                      (templateListData?.meta?.total_count ?? 0) /
                        templatePerPage
                    )
                  )}
                  )
                </span>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1.5 text-xs text-gray-600">
                    <span>Rows:</span>
                    <select
                      className="border rounded-lg px-2 py-1 text-xs bg-white"
                      value={templatePerPage}
                      onChange={(event) => {
                        const value = Number(event.target.value)
                        setTemplatePage(1)
                        setTemplatePerPage(Math.max(1, value))
                      }}
                    >
                      {[10, 20, 30, 50, 100].map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setTemplatePage(Math.max(1, templatePage - 1))
                    }
                    disabled={templatePage <= 1}
                    className="rounded-lg border border-gray-300 px-3 py-1 text-xs font-medium bg-white hover:bg-gray-50 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    onClick={() => setTemplatePage(templatePage + 1)}
                    disabled={
                      templatePage >=
                      Math.ceil(
                        (templateListData?.meta?.total_count ?? 0) /
                          templatePerPage
                      )
                    }
                    className="rounded-lg border border-gray-300 px-3 py-1 text-xs font-medium bg-white hover:bg-gray-50 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </CustomDrawer>
      ))()}
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

          const newMealTime = String(
            values.meal_time || selectedMealTiming?.meal_time || ''
          )
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
                rules={{ required: 'Meal timing name is required.' }}
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
                  />
                )}
              />
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

const formatTitleCase = (value?: string | null) => {
  if (!value) return ''
  return value
    .split(' ')
    .filter((segment) => segment.trim())
    .map((segment) => {
      const lower = segment.toLowerCase()
      return lower.charAt(0).toUpperCase() + lower.slice(1)
    })
    .join(' ')
}
