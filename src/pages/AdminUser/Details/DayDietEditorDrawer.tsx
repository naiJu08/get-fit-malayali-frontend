import React, { FC, useEffect, useMemo, useState } from 'react'
import moment from 'moment'
import CustomDrawer from '../../../components/common/drawer'
import Icons from '../../../components/common/icons'
import { useSnackbarManager } from '../../../components/common/snackbar'
import { useMeals } from '../../Meals/api'
import { dietOverridesBulk } from '../api'

const STANDARD_MEAL_TIMES = [
  'MORNING DRINK',
  'BREAKFAST',
  'MID DAY MEAL',
  'LUNCH',
  'EVENING SNACK',
  'DINNER',
  'BED TIME',
  'MIDNIGHT SNACK',
]

interface EditMealItem {
  id?: string | number
  meal_id: number | string
  meal_name: string
  quantity: number
  requirement: 'mandatory' | 'optional'
  serving_unit?: string
  serving_quantity?: number
  per_serving?: {
    calories?: number
    protein?: number
    carbs?: number
    fat?: number
    fiber?: number
  }
}

interface EditDietPlan {
  id?: string | number
  meal_time: string
  meal_time_time?: string
  meal_name?: string
  notes?: string
  items: EditMealItem[]
}

interface DayDietEditorDrawerProps {
  open: boolean
  handleClose: () => void
  dayDetail: any
  subscriptionId?: string | number | null
  onSuccess?: () => void | Promise<void>
}

const formatTitle = (str?: string | null) => {
  if (!str) return ''
  return str
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

const normalizeMealTimeStr = (str?: string | null) => {
  if (!str) return ''
  const s = str.trim().toLowerCase()
  if (s === 'evening snack' || s === 'evening snacks' || s === 'snack')
    return 'EVENING SNACK'
  if (s === 'morning drink' || s === 'morning drinks') return 'MORNING DRINK'
  if (s === 'breakfast') return 'BREAKFAST'
  if (s === 'mid day meal' || s === 'mid-day meal' || s === 'midday meal')
    return 'MID DAY MEAL'
  if (s === 'lunch') return 'LUNCH'
  if (s === 'dinner') return 'DINNER'
  if (
    s === 'bed time' ||
    s === 'bedtime' ||
    s === 'bed drink' ||
    s === 'bed drinks'
  )
    return 'BED TIME'
  return str.trim().toUpperCase()
}

export const DayDietEditorDrawer: FC<DayDietEditorDrawerProps> = ({
  open,
  handleClose,
  dayDetail,
  subscriptionId,
  onSuccess,
}) => {
  const { enqueueSnackbar } = useSnackbarManager()
  const [plans, setPlans] = useState<EditDietPlan[]>([])
  const [activeAddMealIndex, setActiveAddMealIndex] = useState<number | null>(
    null
  )
  const [mealSearchQuery, setMealSearchQuery] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showMealTimePicker, setShowMealTimePicker] = useState(false)

  const activeMealTime =
    activeAddMealIndex !== null
      ? plans[activeAddMealIndex]?.meal_time
      : undefined

  // Fetch meals list for adding items, scoped to the active meal time
  const { data: mealsData, isLoading: mealsLoading } = useMeals({
    page: 1,
    per_page: 999,
    search: mealSearchQuery || undefined,
    meal_time: activeMealTime
      ? normalizeMealTimeStr(activeMealTime)
      : undefined,
    status: 'active',
  } as any)

  const allMeals: any[] = useMemo(() => {
    return Array.isArray((mealsData as any)?.meals)
      ? (mealsData as any).meals
      : []
  }, [mealsData])

  // Initialize plans from dayDetail
  useEffect(() => {
    if (!open) {
      setActiveAddMealIndex(null)
      setMealSearchQuery('')
      setShowMealTimePicker(false)
      return
    }

    if (
      Array.isArray(dayDetail?.diet_plans) &&
      dayDetail.diet_plans.length > 0
    ) {
      const initialPlans: EditDietPlan[] = dayDetail.diet_plans.map(
        (dp: any) => ({
          id: dp.id,
          meal_time: dp.meal_time?.toUpperCase?.() || 'MEAL',
          meal_time_time: dp.meal_time_time || '',
          meal_name: dp.meal_name || '',
          notes: dp.notes || '',
          items: Array.isArray(dp.items)
            ? dp.items.map((it: any) => ({
                id: it.id,
                meal_id: it.meal_id,
                meal_name: it.meal_name || '',
                quantity: Number(it.quantity) || 1,
                requirement:
                  it.requirement === 'optional' ? 'optional' : 'mandatory',
                serving_unit: it.serving_unit || '',
                serving_quantity: it.serving_quantity,
                per_serving: it.per_serving
                  ? {
                      calories: Number(it.per_serving.calories) || 0,
                      protein: Number(it.per_serving.protein) || 0,
                      carbs: Number(it.per_serving.carbs) || 0,
                      fat: Number(it.per_serving.fat) || 0,
                      fiber: Number(it.per_serving.fiber) || 0,
                    }
                  : undefined,
              }))
            : [],
        })
      )
      setPlans(initialPlans)
    } else {
      // If no plans exist yet for this day, default to empty or standard meal times
      setPlans([])
    }
  }, [open, dayDetail])

  // Compute live nutrition totals
  const totals = useMemo(() => {
    let calories = 0
    let protein = 0
    let carbs = 0
    let fat = 0
    let fiber = 0

    plans.forEach((p) => {
      p.items.forEach((it) => {
        const qty = it.quantity || 1
        const ps = it.per_serving
        if (ps) {
          calories += (ps.calories || 0) * qty
          protein += (ps.protein || 0) * qty
          carbs += (ps.carbs || 0) * qty
          fat += (ps.fat || 0) * qty
          fiber += (ps.fiber || 0) * qty
        }
      })
    })

    return {
      calories: Math.round(calories),
      protein: Math.round(protein * 10) / 10,
      carbs: Math.round(carbs * 10) / 10,
      fat: Math.round(fat * 10) / 10,
      fiber: Math.round(fiber * 10) / 10,
    }
  }, [plans])

  // Add meal item to a plan section
  const handleAddMealItem = (planIndex: number, meal: any) => {
    setPlans((prev) => {
      const next = [...prev]
      const plan = { ...next[planIndex] }
      const currentItems = [...plan.items]

      const newItem: EditMealItem = {
        meal_id: meal.id,
        meal_name: meal.name,
        quantity: 1,
        requirement: 'optional',
        serving_unit: meal.serving_unit || '',
        serving_quantity: meal.default_serving_quantity,
        per_serving: {
          calories:
            Number(meal.per_serving_calories || meal.total_calories) || 0,
          protein: Number(meal.per_serving_protein) || 0,
          carbs: Number(meal.per_serving_carbs) || 0,
          fat: Number(meal.per_serving_fat) || 0,
          fiber: Number(meal.per_serving_fiber) || 0,
        },
      }

      plan.items = [...currentItems, newItem]
      next[planIndex] = plan
      return next
    })
    setActiveAddMealIndex(null)
    setMealSearchQuery('')
  }

  // Remove meal item
  const handleRemoveMealItem = (planIndex: number, itemIndex: number) => {
    setPlans((prev) => {
      const next = [...prev]
      const plan = { ...next[planIndex] }
      plan.items = plan.items.filter((_, idx) => idx !== itemIndex)
      next[planIndex] = plan
      return next
    })
  }

  // Update item quantity
  const handleUpdateQuantity = (
    planIndex: number,
    itemIndex: number,
    newQty: number
  ) => {
    if (newQty < 1) return
    setPlans((prev) => {
      const next = [...prev]
      const plan = { ...next[planIndex] }
      const items = [...plan.items]
      items[itemIndex] = { ...items[itemIndex], quantity: newQty }
      plan.items = items
      next[planIndex] = plan
      return next
    })
  }

  // Toggle item requirement (mandatory / optional)
  const handleToggleRequirement = (planIndex: number, itemIndex: number) => {
    setPlans((prev) => {
      const next = [...prev]
      const plan = { ...next[planIndex] }
      const items = [...plan.items]
      const cur = items[itemIndex].requirement
      items[itemIndex] = {
        ...items[itemIndex],
        requirement: cur === 'mandatory' ? 'optional' : 'mandatory',
      }
      plan.items = items
      next[planIndex] = plan
      return next
    })
  }

  // Update plan notes
  const handleUpdateNotes = (planIndex: number, notes: string) => {
    setPlans((prev) => {
      const next = [...prev]
      next[planIndex] = { ...next[planIndex], notes: notes.slice(0, 200) }
      return next
    })
  }

  // Remove entire meal time section
  const handleRemoveMealSection = (planIndex: number) => {
    setPlans((prev) => prev.filter((_, idx) => idx !== planIndex))
  }

  // Add a new meal time section
  const handleAddMealSection = (mealTime: string) => {
    if (plans.some((p) => p.meal_time === mealTime)) {
      enqueueSnackbar(`${formatTitle(mealTime)} already exists for this day`, {
        variant: 'info',
      })
      setShowMealTimePicker(false)
      return
    }

    setPlans((prev) => [
      ...prev,
      {
        meal_time: mealTime,
        notes: '',
        items: [],
      },
    ])
    setShowMealTimePicker(false)
  }

  // Handle Save
  const handleSave = async () => {
    const subId =
      subscriptionId ||
      dayDetail?.subscription_id ||
      dayDetail?.subscription?.id
    if (!subId) {
      enqueueSnackbar('Subscription ID not found', { variant: 'error' })
      return
    }

    setIsSubmitting(true)
    try {
      const payload = {
        day_number: dayDetail?.day_number,
        date: dayDetail?.date || dayDetail?.day_date,
        diet_plans: plans.map((p) => ({
          meal_time: p.meal_time,
          meal_name: p.meal_name || (p.items[0]?.meal_name ?? undefined),
          notes: p.notes || undefined,
          items: p.items.map((it) => ({
            meal_id: it.meal_id,
            quantity: it.quantity,
            requirement: it.requirement,
          })),
        })),
      }

      await dietOverridesBulk(subId, payload)
      enqueueSnackbar('Single day diet updated successfully', {
        variant: 'success',
      })
      handleClose()
      if (onSuccess) {
        await onSuccess()
      }
    } catch (err: any) {
      const resp = err?.response?.data
      const message =
        resp?.message ||
        resp?.error ||
        (Array.isArray(resp?.errors) ? resp.errors.join(', ') : null) ||
        err?.message ||
        'Failed to update day diet'
      enqueueSnackbar(message, { variant: 'error' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const availableMealTimesToAdd = useMemo(() => {
    const currentMealTimes = new Set(plans.map((p) => p.meal_time))
    return STANDARD_MEAL_TIMES.filter((mt) => !currentMealTimes.has(mt))
  }, [plans])

  const filteredSearchMeals = useMemo(() => {
    let list = allMeals
    if (activeMealTime) {
      const target = normalizeMealTimeStr(activeMealTime)
      list = list.filter((m) => {
        if (!m.meal_time) return true
        return normalizeMealTimeStr(m.meal_time) === target
      })
    }
    if (activeAddMealIndex !== null && plans[activeAddMealIndex]) {
      const currentItems = plans[activeAddMealIndex].items || []
      const selectedMealIds = new Set(
        currentItems
          .map((it) => String(it.meal_id ?? it.id ?? ''))
          .filter((v) => v !== '' && v !== 'undefined')
      )
      const selectedMealNames = new Set(
        currentItems
          .map((it) => it.meal_name?.trim().toLowerCase())
          .filter(Boolean)
      )

      list = list.filter((m) => {
        const mealId = String(m.id ?? '')
        const mealName = m.name?.trim().toLowerCase()
        if (mealId && selectedMealIds.has(mealId)) return false
        if (mealName && selectedMealNames.has(mealName)) return false
        return true
      })
    }
    if (mealSearchQuery) {
      const q = mealSearchQuery.toLowerCase().trim()
      list = list.filter((m) => m.name?.toLowerCase().includes(q))
    }
    return list.slice(0, 50)
  }, [allMeals, activeMealTime, activeAddMealIndex, plans, mealSearchQuery])

  const dayDateDisplay = useMemo(() => {
    const d = dayDetail?.date || dayDetail?.day_date
    if (!d) return `Day ${dayDetail?.day_number ?? ''}`
    const formattedDate = moment(d).isValid()
      ? moment(d).format('DD-MM-YYYY')
      : d
    return `${formattedDate} (Day ${dayDetail?.day_number ?? ''})`
  }, [dayDetail])

  return (
    <CustomDrawer
      open={open}
      handleClose={handleClose}
      className="w-screen max-w-[100vw] md:max-w-[720px]"
      unmountOnClose
      title={`Edit Day Diet - ${dayDateDisplay}`}
      handleSubmit={handleSave}
      disableSubmit={isSubmitting}
      actionLoader={isSubmitting}
      actionLabel="Save Changes"
    >
      <div className="flex flex-col gap-4 pb-12">
        {/* Real-time Macros and Calories Banner */}
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Total Proposed Calories
              </div>
              <div className="text-2xl font-bold text-emerald-700">
                {totals.calories}{' '}
                <span className="text-xs font-medium text-emerald-600">
                  kcal
                </span>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <div className="bg-white/80 px-2.5 py-1 rounded-lg border border-emerald-100">
                <span className="text-gray-500">Protein:</span>{' '}
                <span className="font-semibold text-gray-800">
                  {totals.protein}g
                </span>
              </div>
              <div className="bg-white/80 px-2.5 py-1 rounded-lg border border-emerald-100">
                <span className="text-gray-500">Carbs:</span>{' '}
                <span className="font-semibold text-gray-800">
                  {totals.carbs}g
                </span>
              </div>
              <div className="bg-white/80 px-2.5 py-1 rounded-lg border border-emerald-100">
                <span className="text-gray-500">Fat:</span>{' '}
                <span className="font-semibold text-gray-800">
                  {totals.fat}g
                </span>
              </div>
              <div className="bg-white/80 px-2.5 py-1 rounded-lg border border-emerald-100">
                <span className="text-gray-500">Fiber:</span>{' '}
                <span className="font-semibold text-gray-800">
                  {totals.fiber}g
                </span>
              </div>
            </div>
          </div>
          <p className="text-[11px] text-gray-500 mt-2">
            * Changes made here are user-specific for this day only and will not
            modify the base Diet Template.
          </p>
        </div>

        {/* Meal Time Sections List */}
        {plans.length === 0 ? (
          <div className="text-center py-10 bg-gray-50 border border-dashed rounded-xl p-6">
            <div className="text-sm font-medium text-gray-600 mb-1">
              No meal times configured for this day.
            </div>
            <p className="text-xs text-gray-400 mb-4">
              Add meal time blocks to customize the user&apos;s diet for this
              day.
            </p>
            <button
              type="button"
              onClick={() => setShowMealTimePicker(true)}
              className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 shadow-sm"
            >
              <Icons name="plus" className="w-3.5 h-3.5 mr-1" />
              Add Meal Time
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {plans.map((plan, planIdx) => (
              <div
                key={`${plan.meal_time}-${planIdx}`}
                className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 transition-all hover:border-gray-300"
              >
                {/* Meal Header */}
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span className="text-sm font-bold text-gray-800 tracking-wide">
                      {formatTitle(plan.meal_time)}
                    </span>
                    {plan.meal_time_time && (
                      <span className="text-xs text-gray-400">
                        ({plan.meal_time_time})
                      </span>
                    )}
                    <span className="text-[11px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                      {plan.items.length}{' '}
                      {plan.items.length === 1 ? 'item' : 'items'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleRemoveMealSection(planIdx)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="Remove meal section"
                      aria-label="Remove meal section"
                    >
                      <Icons name="trash" className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Items in this meal section */}
                <div className="mt-3 flex flex-col gap-2">
                  {plan.items.length === 0 ? (
                    <div className="text-xs text-gray-400 italic py-2">
                      No foods added yet for {formatTitle(plan.meal_time)}.
                    </div>
                  ) : (
                    plan.items.map((item, itemIdx) => {
                      const itemCalories =
                        (item.per_serving?.calories || 0) * (item.quantity || 1)

                      return (
                        <div
                          key={`${item.meal_id}-${itemIdx}`}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 bg-gray-50 rounded-lg border border-gray-100 hover:bg-gray-100/70 transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-semibold text-gray-800 truncate">
                                {formatTitle(item.meal_name)}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  handleToggleRequirement(planIdx, itemIdx)
                                }
                                className={`text-[10px] font-medium px-2 py-0.5 rounded-full border transition-colors ${
                                  item.requirement === 'mandatory'
                                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                                    : 'bg-blue-50 text-blue-700 border-blue-200'
                                }`}
                              >
                                {item.requirement === 'mandatory'
                                  ? 'Mandatory'
                                  : 'Optional'}
                              </button>
                            </div>
                            <div className="text-[11px] text-gray-500 mt-0.5">
                              {itemCalories > 0 && (
                                <span className="font-medium text-emerald-600 mr-2">
                                  {itemCalories} kcal
                                </span>
                              )}
                              {item.serving_unit && (
                                <span className="text-gray-400">
                                  ({item.serving_unit})
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Quantity and Actions */}
                          <div className="flex items-center gap-3">
                            <div className="flex items-center border rounded-lg bg-white overflow-hidden shadow-2xs">
                              <button
                                type="button"
                                onClick={() =>
                                  handleUpdateQuantity(
                                    planIdx,
                                    itemIdx,
                                    item.quantity - 1
                                  )
                                }
                                disabled={item.quantity <= 1}
                                className="px-2 py-1 text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-bold"
                              >
                                -
                              </button>
                              <input
                                type="number"
                                min={1}
                                value={item.quantity}
                                onChange={(e) =>
                                  handleUpdateQuantity(
                                    planIdx,
                                    itemIdx,
                                    parseInt(e.target.value, 10) || 1
                                  )
                                }
                                className="w-10 text-center text-xs font-semibold text-gray-800 border-x py-1 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  handleUpdateQuantity(
                                    planIdx,
                                    itemIdx,
                                    item.quantity + 1
                                  )
                                }
                                className="px-2 py-1 text-gray-600 hover:bg-gray-100 text-xs font-bold"
                              >
                                +
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                handleRemoveMealItem(planIdx, itemIdx)
                              }
                              className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                              title="Delete food item"
                              aria-label="Delete food item"
                            >
                              <Icons name="trash" className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>

                {/* Notes Input for Meal Time */}
                <div className="mt-3">
                  <input
                    type="text"
                    placeholder="Add special instructions or notes for this meal..."
                    value={plan.notes || ''}
                    onChange={(e) => handleUpdateNotes(planIdx, e.target.value)}
                    className="w-full text-xs px-3 py-1.5 bg-gray-50/70 border border-gray-200 rounded-lg text-gray-700 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-emerald-400"
                  />
                  <div className="text-[10px] text-gray-400 mt-0.5 text-right font-medium">
                    {(plan.notes || '').length}/200 characters
                  </div>
                </div>

                {/* Add Food Button / Inline Search Selector */}
                <div className="mt-3 pt-2 border-t border-gray-100">
                  {activeAddMealIndex === planIdx ? (
                    <div className="bg-emerald-50/50 border border-emerald-200 rounded-xl p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-emerald-800">
                          Select Food for {formatTitle(plan.meal_time)}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveAddMealIndex(null)
                            setMealSearchQuery('')
                          }}
                          className="text-xs text-gray-400 hover:text-gray-700 font-medium"
                        >
                          Cancel
                        </button>
                      </div>

                      {/* Search Bar */}
                      <div className="relative mb-2">
                        <input
                          type="text"
                          placeholder="Search meals by name..."
                          value={mealSearchQuery}
                          onChange={(e) => setMealSearchQuery(e.target.value)}
                          className="w-full text-xs px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-emerald-500 pr-8"
                          autoFocus
                        />
                        {mealSearchQuery && (
                          <button
                            type="button"
                            onClick={() => setMealSearchQuery('')}
                            className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600 text-xs"
                          >
                            ✕
                          </button>
                        )}
                      </div>

                      {/* Meals list dropdown */}
                      <div className="max-h-48 overflow-y-auto bg-white border border-gray-200 rounded-lg divide-y divide-gray-100 shadow-inner">
                        {mealsLoading ? (
                          <div className="p-3 text-center text-xs text-gray-400">
                            Loading meals...
                          </div>
                        ) : filteredSearchMeals.length === 0 ? (
                          <div className="p-3 text-center text-xs text-gray-400">
                            {mealSearchQuery
                              ? `No foods found matching "${mealSearchQuery}" in ${formatTitle(plan.meal_time)}.`
                              : `No foods defined for ${formatTitle(plan.meal_time)}.`}
                          </div>
                        ) : (
                          filteredSearchMeals.map((meal) => {
                            const cal =
                              meal.per_serving_calories ||
                              meal.total_calories ||
                              0
                            return (
                              <button
                                key={meal.id}
                                type="button"
                                onClick={() => handleAddMealItem(planIdx, meal)}
                                className="w-full text-left px-3 py-2 hover:bg-emerald-50/60 flex items-center justify-between text-xs transition-colors"
                              >
                                <div>
                                  <div className="font-medium text-gray-800">
                                    {meal.name}
                                  </div>
                                  <div className="text-[10px] text-gray-400">
                                    {meal.serving_unit || 'serving'}
                                    {meal.meal_time
                                      ? ` • ${meal.meal_time}`
                                      : ''}
                                  </div>
                                </div>
                                <div className="text-right font-semibold text-emerald-600 text-xs">
                                  {cal} kcal
                                </div>
                              </button>
                            )
                          })
                        )}
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setActiveAddMealIndex(planIdx)
                        setMealSearchQuery('')
                      }}
                      className="inline-flex items-center text-xs font-semibold text-emerald-600 hover:text-emerald-700 py-1"
                    >
                      <Icons name="plus" className="w-3.5 h-3.5 mr-1" />
                      Add Food / Meal
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add Meal Time Section Picker */}
        {showMealTimePicker ? (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                Select Meal Time to Add
              </span>
              <button
                type="button"
                onClick={() => setShowMealTimePicker(false)}
                className="text-xs text-gray-400 hover:text-gray-700 font-medium"
              >
                Cancel
              </button>
            </div>
            {availableMealTimesToAdd.length === 0 ? (
              <div className="text-xs text-gray-400">
                All standard meal times are already added.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {availableMealTimesToAdd.map((mt) => (
                  <button
                    key={mt}
                    type="button"
                    onClick={() => handleAddMealSection(mt)}
                    className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 text-left transition-all"
                  >
                    + {formatTitle(mt)}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          availableMealTimesToAdd.length > 0 && (
            <button
              type="button"
              onClick={() => setShowMealTimePicker(true)}
              className="inline-flex items-center justify-center px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-xl border border-gray-200 transition-colors"
            >
              <Icons name="plus" className="w-4 h-4 mr-1.5" />
              Add Another Meal Time Block
            </button>
          )
        )}
      </div>
    </CustomDrawer>
  )
}

export default DayDietEditorDrawer
