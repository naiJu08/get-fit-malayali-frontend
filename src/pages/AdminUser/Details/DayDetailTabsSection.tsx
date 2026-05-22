import moment from 'moment'
import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useState,
  // type ChangeEvent,
  type FC,
} from 'react'
import { Controller, FormProvider, useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import Icons from '../../../components/common/icons'
import { DialogModal } from '../../../components/common'
import { Tab, TabContainer } from '../../../components/common/tab'
import CustomDrawer from '../../../components/common/drawer'
import TimeSplitPicker from '../../../components/common/inputs/TimeSplitPicker'
import { useTemplateList } from '../../DietTemplate/api'
import { useDietTemplateCategories } from '../../DietTemplateCategories/api'
import { useSnackbarManager } from '../../../components/common/snackbar'
import { getErrorMessage } from '../../../utilities/parsers'
import { assignDietPlanTemplate, useUpdateUserMealTiming } from '../api'
import { useMutation } from '@tanstack/react-query'

interface DayDetailTabsSectionProps {
  dayDetail: any
  dayDetailTab: string
  onChangeTab: (tabId: string) => void
  isNutritionist: boolean
  onEditWorkoutPlan: () => void
  onEditYogaPlan: () => void
  onEditMeditationPlan: () => void
  subscriptionId?: string | number | null
  userId?: string | number | null
  refreshDayDetail?: () => Promise<void> | void
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
  onEditWorkoutPlan,
  onEditYogaPlan,
  onEditMeditationPlan,
  subscriptionId: parentSubscriptionId,
  userId: parentUserId,
  refreshDayDetail,
}) => {
  const [assignTemplateOpen, setAssignTemplateOpen] = useState(false)
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
  const reloadPage = useCallback(() => {
    if (
      typeof window !== 'undefined' &&
      typeof window.location?.reload === 'function'
    ) {
      window.location.reload()
    }
  }, [])

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

  const mealTimeForm = useForm<{ time: string }>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: { time: '' },
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
        payload: { diet_plan_template_id: number }
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
          reloadPage()
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
  const { data: dietTemplateCategoriesData } =
    useDietTemplateCategories({
      page: 1,
      per_page: 100,
      status: 'active',
    }) ?? {}
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
    try {
      await assignTemplate({
        subscriptionId,
        payload: { diet_plan_template_id: normalizedTemplateId },
      })
    } catch {
      /* handled in onError */
    }
  }

  const hasYogaData = useMemo(() => {
    return !!dayDetail?.yoga_plan
  }, [dayDetail])
  useEffect(() => {
    if (!hasYogaData && dayDetailTab === 'yoga') {
      onChangeTab('diet')
    }
  }, [hasYogaData, dayDetailTab, onChangeTab])

  const canEditDay = useMemo(() => {
    if (isNutritionist) return false
    const dateSource =
      dayDetail?.date ?? dayDetail?.day_date ?? dayDetail?.dayDate ?? null
    if (!dateSource) return false
    const parsed = moment(dateSource)
    if (!parsed.isValid()) return false
    return parsed.startOf('day').isSameOrAfter(moment().startOf('day'))
  }, [dayDetail?.date, dayDetail?.day_date, dayDetail?.dayDate, isNutritionist])

  const isToday = useMemo(() => {
    const dateSource =
      dayDetail?.date ?? dayDetail?.day_date ?? dayDetail?.dayDate ?? null
    if (!dateSource) return false
    const parsed = moment(dateSource)
    if (!parsed.isValid()) return false
    return parsed.startOf('day').isSame(moment().startOf('day'))
  }, [dayDetail?.date, dayDetail?.day_date, dayDetail?.dayDate])

  const isCompleted = useMemo(() => {
    const status = String(dayDetail?.status || '').toLowerCase()
    return status === 'completed' || status === 'over'
  }, [dayDetail?.status])

  const showAssignTemplateButton = useMemo(() => {
    // Show button if it's today and not completed, or if no template is assigned yet
    return (isToday && !isCompleted) || !templateId
  }, [isToday, isCompleted, templateId])

  const tabsData = useMemo(() => {
    const baseTabs = [
      { label: 'Diet', id: 'diet' },
      { label: 'Workout', id: 'workout' },
    ]
    if (hasYogaData) {
      baseTabs.push({ label: 'Yoga', id: 'yoga' })
    }
    baseTabs.push({ label: 'Meditation', id: 'meditation' })
    return baseTabs
  }, [hasYogaData])

  return (
    <>
      <div className="allow-tab-overflow">
        <TabContainer
          data={tabsData}
          activeTab={dayDetailTab}
          onClick={(item) => onChangeTab(String(item.id))}
        >
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
                        Consumed: {dayDetail?.total_consumed_calories ?? 0} kcal
                      </span>
                    </div>
                  </div>
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

              {/* ================= MEALS ================= */}
              {Array.isArray(dayDetail?.diet_plans) &&
              dayDetail.diet_plans.length > 0 ? (
                <div className=" mt-3">
                  {dayDetail.diet_plans.map((d: any) => {
                    const totalItems = d?.items?.length || 0
                    const completedItems =
                      d?.item_statuses?.completed_item_ids?.length || 0
                    const missedItems =
                      d?.item_statuses?.not_taken_mandatory_item_ids?.length ||
                      0

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
                                  totalConsumedCalories + otherConsumedCalories
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
                                              {it.per_serving.calories ?? '--'}{' '}
                                              kcal
                                            </div>
                                            <div>
                                              Protein:{' '}
                                              {it.per_serving.protein ?? '--'}g
                                            </div>
                                            <div>
                                              Carbs:{' '}
                                              {it.per_serving.carbs ?? '--'}g
                                            </div>
                                            <div>
                                              Fat: {it.per_serving.fat ?? '--'}g
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
                                              it.actions.status === 'completed'
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
                                              it.actions.status === 'completed'
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
                                                  {extra.per_serving.calories ??
                                                    '--'}{' '}
                                                  kcal
                                                </div>
                                                <div>
                                                  Protein:{' '}
                                                  {extra.per_serving.protein ??
                                                    '--'}
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
                                                  {extra.consumed_macros.fat ??
                                                    '--'}
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
                                                        extra.actions.status ===
                                                          'failed'
                                                      ? 'text-red-600'
                                                      : extra.actions.status ===
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
                                              {extra?.actions?.completed_at && (
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

          <Tab id="workout">
            <div className="max-h-[700px] overflow-y-auto">
              <div className="border rounded p-3 bg-white max-h-[500px] overflow-y-auto">
                <div className="flex items-center justify-between mb-2 gap-3">
                  <div className="text-sm font-semibold">Workout Plan</div>
                  {dayDetail?.workout_plan && canEditDay && (
                    <button
                      className="px-3 py-1 text-xs border rounded btn-primary flex items-center gap-1"
                      onClick={onEditWorkoutPlan}
                    >
                      <Icons name="edit" />
                      <span>Update</span>
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
                                  {ex?.reps ? <div>Reps: {ex.reps}</div> : null}
                                  {ex?.sets ? <div>Sets: {ex.sets}</div> : null}
                                  {ex?.duration_minutes ? (
                                    <div>Duration: {ex.duration_minutes}m</div>
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
                      <div className="text-xs text-gray-500">No exercises.</div>
                    )}
                  </div>
                ) : (
                  <div className="text-xs text-gray-500">No workout plan.</div>
                )}
              </div>
            </div>
          </Tab>

          {dayDetail?.yoga_plan && (
            <Tab id="yoga">
              <div className="max-h-[700px] overflow-y-auto">
                <div className="border rounded p-3 bg-white max-h-[500px] overflow-y-auto">
                  <div className="flex items-center justify-between mb-2 gap-3">
                    <div className="text-sm font-semibold">Yoga Plan</div>
                    {dayDetail?.yoga_plan && canEditDay && (
                      <button
                        className="px-3 py-1 text-xs border rounded btn-primary flex items-center gap-1"
                        onClick={onEditYogaPlan}
                      >
                        <Icons name="edit" />
                        <span>Update</span>
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
                                      {formatTitleCase(
                                        ex?.yoga_name || ex?.title || ex?.name
                                      ) || '--'}
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
                                        Duration: {ex.yoga_duration_minutes}m
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

          <Tab id="meditation">
            <div className="max-h-[700px] overflow-y-auto">
              <div className="border rounded p-3 bg-white max-h-[500px] overflow-y-auto">
                <div className="flex items-center justify-between mb-2 gap-3">
                  <div className="text-sm font-semibold">Meditation</div>
                  {Array.isArray(dayDetail?.meditations) &&
                    // dayDetail.meditations.length > 0 &&
                    canEditDay && (
                      <button
                        className="px-3 py-1 text-xs border rounded btn-primary flex items-center gap-1"
                        onClick={onEditMeditationPlan}
                      >
                        <Icons name="edit" />
                        <span>Update</span>
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
        </TabContainer>
      </div>

      {(() => {
        return (
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
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs text-gray-500">
                  Showing {templateListData?.diet_plan_templates?.length ?? 0}{' '}
                  of {templateListData?.meta?.total_count ?? 0} templates
                </span>
                <label className="flex items-center gap-2 text-xs text-gray-600">
                  <select
                    className="w-56 border rounded px-2 py-1 text-xs"
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
                </label>
              </div>
              <div className="border rounded-lg divide-y">
                {templateListLoading ? (
                  <div className="p-6 text-center text-sm text-gray-500">
                    Loading templates...
                  </div>
                ) : !templateListData?.diet_plan_templates ||
                  templateListData.diet_plan_templates.length === 0 ? (
                  <div className="p-6 text-center text-sm text-gray-500">
                    No diet templates found.
                  </div>
                ) : (
                  templateListData.diet_plan_templates.map((template: any) => (
                    <div
                      key={template?.id ?? template?.name}
                      className={`flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between cursor-pointer hover:bg-gray-50 ${
                        selectedTemplateId === template?.id
                          ? 'bg-blue-50 border-l-4 border-blue-500'
                          : ''
                      }`}
                      onClick={() => setSelectedTemplateId(template?.id)}
                    >
                      <div className="space-y-1 w-full sm:w-[55%] md:w-[60%] lg:w-[75%]">
                        <p className="text-sm font-semibold text-gray-900">
                          {toTitleCase(template?.name) || 'Untitled Template'}
                        </p>
                        {template?.description && (
                          <p className="text-xs text-gray-600">
                            {template.description}
                          </p>
                        )}
                        <div className="mt-1 flex flex-wrap gap-3 text-[11px] text-gray-500">
                          {template?.duration_days ? (
                            <span>Duration: {template.duration_days} days</span>
                          ) : null}
                          {template?.total_meals ? (
                            <span>Meals: {template.total_meals}</span>
                          ) : null}
                          {template?.calories ? (
                            <span>Calories: {template.calories}</span>
                          ) : null}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2 text-right">
                        <span className="text-[11px] font-medium text-gray-500">
                          #{template?.id ?? '—'}
                        </span>
                        <div className="w-4 h-4 rounded-full border-2 border-gray-300 flex items-center justify-center">
                          {selectedTemplateId === template?.id && (
                            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="flex flex-col gap-2 text-xs text-gray-500 sm:flex-row sm:items-center sm:justify-between">
                <span>
                  Page {templatePage} of{' '}
                  {Math.ceil(
                    (templateListData?.meta?.total_count ?? 0) / templatePerPage
                  )}
                </span>
                <div className="flex gap-2">
                  <label className="flex items-center gap-2 text-xs text-gray-600">
                    <span>Rows per page</span>
                    <select
                      className="border rounded px-2 py-1 text-xs"
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
                    className="rounded border border-gray-300 px-3 py-1 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-50"
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
                    className="rounded border border-gray-300 px-3 py-1 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </CustomDrawer>
        )
      })()}
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
          </FormProvider>
        }
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
