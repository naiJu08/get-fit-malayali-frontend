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
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import Icons from '../../../components/common/icons'
import { Tab, TabContainer } from '../../../components/common/tab'
import DialogModal from '../../../components/common/modal/DialogModal'
import { useTemplateList } from '../../DietTemplate/api'
import { useSnackbarManager } from '../../../components/common/snackbar'
import { getErrorMessage } from '../../../utilities/parsers'
import { assignDietPlanTemplate } from '../api'
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
  refreshDayDetail?: () => Promise<void> | void
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
  onEditWorkoutPlan,
  onEditYogaPlan,
  onEditMeditationPlan,
  subscriptionId: parentSubscriptionId,
  refreshDayDetail,
}) => {
  const [assignTemplateOpen, setAssignTemplateOpen] = useState(false)
  const [templateSearch, setTemplateSearch] = useState('')
  const [templatePage, setTemplatePage] = useState(1)
  const [templatePerPage, setTemplatePerPage] = useState(10)
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

  const toggleAllDietItemDetails = (
    items: { mealId: string | number; itemId: string | number }[] = [],
    expand = true
  ) => {
    setExpandedDietItems((prev) => {
      const next = expand ? { ...prev } : { ...prev }
      items.forEach(({ mealId, itemId }) => {
        const key = `${mealId}-${itemId}`
        if (expand) {
          next[key] = true
        } else {
          delete next[key]
        }
      })
      return next
    })
  }

  const dietItemKeys = useMemo(() => {
    if (!Array.isArray(dayDetail?.diet_plans)) return []
    const keys: { mealId: string | number; itemId: string | number }[] = []
    dayDetail.diet_plans.forEach((plan: any) => {
      if (Array.isArray(plan?.items)) {
        plan.items.forEach((item: any) => {
          if (item?.id) {
            keys.push({
              mealId: plan?.id ?? plan?.meal_id ?? 'meal',
              itemId: item.id,
            })
          }
        })
      }
    })
    return keys
  }, [dayDetail?.diet_plans])

  const areAllDietItemsExpanded = useMemo(() => {
    if (!dietItemKeys.length) return false
    return dietItemKeys.every(
      ({ mealId, itemId }) => expandedDietItems[`${mealId}-${itemId}`]
    )
  }, [dietItemKeys, expandedDietItems])

  const handleToggleAllDietDetails = () => {
    toggleAllDietItemDetails(dietItemKeys, !areAllDietItemsExpanded)
  }

  const { enqueueSnackbar } = useSnackbarManager()
  const navigate = useNavigate()

  const subscriptionId =
    parentSubscriptionId ??
    dayDetail?.subscription_id ??
    dayDetail?.subscription?.id ??
    dayDetail?.subscriptionId ??
    null

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
          enqueueSnackbar(
            getErrorMessage(error?.response?.data?.detail || error),
            {
              variant: 'error',
            }
          )
        },
      }
    )

  const templateName = dayDetail?.subscription?.diet_plan_template_name?.trim()
  const templateId = dayDetail?.subscription?.diet_plan_template_id
  const handleTemplateNameClick = () => {
    if (!templateId) return
    navigate(`/diet-template/${templateId}`)
  }

  const templateListParams = useMemo(
    () => ({
      page: templatePage,
      per_page: templatePerPage,
      search: templateSearch || undefined,
    }),
    [templatePage, templatePerPage, templateSearch]
  )

  const { data: templateListData, isFetching: templateListLoading } =
    useTemplateList(templateListParams)

  useEffect(() => {
    const totalPages = Number(templateListData?.meta?.total_pages ?? 0)
    if (totalPages > 0 && templatePage > totalPages) {
      setTemplatePage(totalPages)
    }
  }, [templateListData?.meta?.total_pages, templatePage])

  const handleAssignTemplateClose = () => {
    setAssignTemplateOpen(false)
    setTemplateSearch('')
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

  const formatTimestamp = (value?: string | number | Date | null) => {
    if (!value) return '--'
    if (typeof value === 'string') {
      const [datePart] = value.split('T')
      if (datePart) return datePart
    }
    const normalizedDate =
      typeof value === 'number'
        ? new Date(Number(value))
        : typeof value === 'string'
          ? new Date(value)
          : value
    if (!(normalizedDate instanceof Date) || isNaN(normalizedDate.getTime())) {
      return '--'
    }
    return moment(normalizedDate).format('DD-MM-YYYY')
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
      <TabContainer
        data={tabsData}
        activeTab={dayDetailTab}
        onClick={(item) => onChangeTab(String(item.id))}
      >
        <Tab id="diet">
          <div className="max-h-[700px] overflow-y-auto">
            <div className="border rounded p-3 bg-white">
              <div className="flex items-center justify-between mb-2 gap-3">
                <div className="text-sm font-semibold flex flex-col">
                  {templateName ? (
                    <button
                      type="button"
                      onClick={handleTemplateNameClick}
                      className="text-left text-primary hover:underline"
                    >
                      {templateName}
                    </button>
                  ) : (
                    <span>Diet Plans</span>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  {canEditDay && (
                    <button
                      type="button"
                      className="px-3 py-1 text-xs border rounded btn-primary flex items-center gap-1"
                      onClick={() => setAssignTemplateOpen(true)}
                    >
                      <Icons name="template-icon" />
                      <span>
                        {Array.isArray(dayDetail?.diet_plans) &&
                        dayDetail.diet_plans.length > 0
                          ? 'Update'
                          : 'Assign Template'}
                      </span>
                    </button>
                  )}
                  {dietItemKeys.length > 0 && (
                    <button
                      type="button"
                      className="group flex items-center gap-1 text-xs font-medium text-primary
             transition-all hover:text-primaryGreen"
                      onClick={handleToggleAllDietDetails}
                    >
                      <span className="group-hover:underline">
                        {areAllDietItemsExpanded ? 'Collapse all' : 'View all'}
                      </span>
                      <Icons
                        name="chevron-down"
                        className={`w-3 h-3 transition-transform duration-200
      ${areAllDietItemsExpanded ? 'rotate-180' : ''}`}
                      />
                    </button>
                  )}
                </div>
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
                      ? d.item_statuses.not_taken_mandatory_item_ids.length
                      : 0
                    return (
                      <div
                        key={`${d?.id}-${d?.sequence_number}`}
                        className="border rounded px-3 py-2 flex flex-col gap-1"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex flex-col">
                            {/* <span className="font-medium">
                              {d?.meal_time || '--'}
                            </span> */}
                            <span className="text-gray-600 font-medium">
                              {d.meal_time}
                            </span>
                            {d?.notes && (
                              <p className="text-[11px] text-gray-500 mt-1">
                                {d.notes}
                              </p>
                            )}
                          </div>
                          <div className="text-right text-[11px] text-gray-600 space-y-0.5 items-end flex flex-col">
                            <div>
                              <span className="text-gray-500">Calories: </span>
                              <span className="font-medium text-gray-800">
                                {d?.calories ?? '--'}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500">Items: </span>
                              <span className="font-medium text-gray-800">
                                {totalItems}
                              </span>
                              {totalItems > 0 && (
                                <span className="ml-1 text-[10px] text-gray-500">
                                  ({completedItems} done / {missedItems} missed)
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        {Array.isArray(d?.items) && d.items.length > 0 ? (
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

                              const requirementText = (() => {
                                if (
                                  typeof it?.requirement === 'string' &&
                                  it.requirement.trim()
                                ) {
                                  const trimmed = it.requirement.trim()
                                  return (
                                    trimmed.charAt(0).toUpperCase() +
                                    trimmed.slice(1)
                                  )
                                }
                                return it?.requirement || '--'
                              })()

                              const dietItemKey = `${d?.id}-${it?.id}`
                              const isExpanded =
                                !!expandedDietItems[dietItemKey]

                              return (
                                <div
                                  key={it?.id}
                                  className="flex flex-col gap-1 rounded bg-gray-50 px-2 py-1 text-[10px] text-gray-600"
                                >
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <span className="font-medium">
                                        Meal :{' '}
                                      </span>
                                      <span>
                                        {formatMealName(it?.meal_name)}
                                      </span>
                                    </div>
                                    <button
                                      type="button"
                                      className="text-[10px] text-primary font-semibold hover:underline"
                                      onClick={() =>
                                        dietItemKey &&
                                        toggleDietItemDetails(dietItemKey)
                                      }
                                    >
                                      {isExpanded
                                        ? 'Hide details'
                                        : 'View details'}
                                    </button>
                                  </div>
                                  {isExpanded && (
                                    <div className="flex flex-col gap-0.5">
                                      <div>
                                        <span className="font-medium">
                                          Quantity :{' '}
                                        </span>
                                        <span>
                                          {it?.quantity} x {it?.serving_unit}{' '}
                                          (per {it?.serving_quantity})
                                        </span>
                                      </div>
                                      <div>
                                        <span className="font-medium">
                                          Requirement :{' '}
                                        </span>
                                        <span>{requirementText}</span>
                                      </div>
                                      {it?.per_serving && (
                                        <div>
                                          <span className="font-medium">
                                            Per serving :{' '}
                                          </span>
                                          <span>
                                            {it.per_serving.calories ?? '--'}{' '}
                                            kcal, P{' '}
                                            {it.per_serving.protein ?? '--'}, C{' '}
                                            {it.per_serving.carbs ?? '--'}, F{' '}
                                            {it.per_serving.fat ?? '--'}, Fib{' '}
                                            {it.per_serving.fiber ?? '--'}
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
                                              {formatTimestamp(
                                                it.actions.action_date
                                              )}
                                            </span>
                                          </div>
                                          {it.actions.notes && (
                                            <div>
                                              <span className="text-gray-500">
                                                Notes :{' '}
                                              </span>
                                              <span>{it.actions.notes}</span>
                                            </div>
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
                          <div className="mt-1 border-t pt-2 text-[11px] text-gray-500 italic">
                            No items defined for this meal.
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-xs text-gray-500">No diet items.</div>
              )}
            </div>
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
                              {typeof action.duration_seconds === 'number' && (
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
                                  <span className="text-gray-500">Notes: </span>
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

      {(() => {
        const modal = (
          <AssignTemplateModal
            isOpen={assignTemplateOpen}
            onClose={handleAssignTemplateClose}
            templates={templateListData?.diet_plan_templates ?? []}
            meta={templateListData?.meta}
            search={templateSearch}
            onSearchChange={(value) => {
              setTemplatePage(1)
              setTemplateSearch(value)
            }}
            page={templatePage}
            onChangePage={setTemplatePage}
            perPage={templatePerPage}
            onChangePerPage={(value) => {
              setTemplatePage(1)
              setTemplatePerPage(value)
            }}
            isLoading={templateListLoading}
            onAssign={handleAssignTemplate}
            isAssigning={assignTemplateLoading}
          />
        )
        if (typeof document === 'undefined') {
          return modal
        }
        return createPortal(modal, document.body)
      })()}
    </>
  )
}

export default DayDetailTabsSection

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

interface AssignTemplateModalProps {
  isOpen: boolean
  onClose: () => void
  templates: any[]
  meta?: Record<string, any>
  search: string
  onSearchChange: (value: string) => void
  page: number
  onChangePage: (page: number) => void
  perPage: number
  onChangePerPage: (value: number) => void
  isLoading: boolean
  onAssign: (templateId: number) => Promise<void>
  isAssigning: boolean
}

const AssignTemplateModal: FC<AssignTemplateModalProps> = ({
  isOpen,
  onClose,
  templates,
  meta,
  // search,
  // onSearchChange,
  page,
  onChangePage,
  perPage,
  onChangePerPage,
  isLoading,
  onAssign,
  isAssigning,
}) => {
  const templateList = Array.isArray(templates) ? templates : []
  const totalTemplates = Number(meta?.total_count ?? templateList.length)
  const normalizedPerPage = Math.max(
    1,
    Number(meta?.per_page ?? meta?.per_page_count ?? perPage ?? 10)
  )
  const totalPages = Math.max(1, Math.ceil(totalTemplates / normalizedPerPage))
  const currentPage = Math.max(1, Number(meta?.current_page ?? page ?? 1))
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(
    null
  )

  // const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
  //   onSearchChange(event.target.value)
  // }

  const handlePrev = () => {
    if (currentPage > 1) {
      onChangePage(currentPage - 1)
    }
  }

  const handleNext = () => {
    if (currentPage < totalPages) {
      onChangePage(currentPage + 1)
    }
  }

  const handleAssignClick = async (templateId?: number) => {
    if (!templateId) return
    setSelectedTemplateId(templateId)
    try {
      await onAssign(templateId)
    } finally {
      setSelectedTemplateId(null)
    }
  }

  return (
    <DialogModal
      isOpen={isOpen}
      onClose={() => onClose()}
      small={false}
      className="max-w-[1100px] w-[92vw]"
      headborder
      backdropCancel
      title="Assign Diet Template"
      subTitle="Browse the available diet templates and pick one to assign."
      body={
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* <input
              type="search"
              value={search}
              onChange={handleSearchChange}
              placeholder="Search template title"
              className="flex-1 min-w-[220px] rounded border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none"
            /> */}
            <span className="text-xs text-gray-500">
              Showing {templateList.length} of {totalTemplates} templates
            </span>
          </div>
          <div className="border rounded-lg divide-y">
            {isLoading ? (
              <div className="p-6 text-center text-sm text-gray-500">
                Loading templates...
              </div>
            ) : templateList.length === 0 ? (
              <div className="p-6 text-center text-sm text-gray-500">
                No diet templates found.
              </div>
            ) : (
              templateList.map((template) => (
                <div
                  key={template?.id ?? template?.name}
                  className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="space-y-1 w-full sm:w-[55%] md:w-[60%] lg:w-[75%]">
                    <p className="text-sm font-semibold text-gray-900">
                      {template?.name || 'Untitled template'}
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
                    <button
                      type="button"
                      className="btn-primary rounded px-3 py-1 text-xs disabled:opacity-60"
                      disabled={
                        isAssigning && selectedTemplateId !== template?.id
                      }
                      onClick={() => handleAssignClick(template?.id)}
                    >
                      {isAssigning && selectedTemplateId === template?.id
                        ? 'Assigning...'
                        : 'Assign Template'}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="flex flex-col gap-2 text-xs text-gray-500 sm:flex-row sm:items-center sm:justify-between">
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex gap-2">
              <label className="flex items-center gap-2 text-xs text-gray-600">
                <span>Rows per page</span>
                <select
                  className="border rounded px-2 py-1 text-xs"
                  value={normalizedPerPage}
                  onChange={(event) => {
                    const value = Number(event.target.value)
                    onChangePerPage(Math.max(1, value))
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
                onClick={handlePrev}
                disabled={currentPage <= 1}
                className="rounded border border-gray-300 px-3 py-1 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={handleNext}
                disabled={currentPage >= totalPages}
                className="rounded border border-gray-300 px-3 py-1 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      }
    />
  )
}
