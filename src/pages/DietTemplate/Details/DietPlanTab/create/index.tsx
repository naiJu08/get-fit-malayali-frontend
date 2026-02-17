import { zodResolver } from '@hookform/resolvers/zod'
import {
  FormProvider,
  useForm,
  useFieldArray,
  Controller,
} from 'react-hook-form'
import { useEffect, useMemo } from 'react'
import { AutoComplete } from 'qbs-core'

import { dietPlanFormSchema, DietPlanSchema } from './schema'
import { DialogModal, TextField } from '../../../../../components/common'
import FormBuilder from '../../../../../components/app/formBuilder'
import ToggleSwitch from '../../../../../components/common/inputs/ToggleSwitch'
import { useCreateDietPlan, useDietPlanDetail, useUpdateDietPlan } from '../api'
import { useMeals } from '../../../../Meals/api'

const DAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
]

const DAY_NAME_INDEX_MAP = DAY_NAMES.reduce<Record<string, number>>(
  (acc, name, index) => {
    acc[name.toLowerCase()] = index
    return acc
  },
  {}
)

const getDayIndexFromName = (name?: string | null) => {
  if (!name) return null
  return DAY_NAME_INDEX_MAP[name.toLowerCase()] ?? null
}

const getDayNameFromNumber = (dayNumber?: number | string | null) => {
  const num = Number(dayNumber)
  if (!Number.isFinite(num) || num <= 0) return ''
  const index = (num - 1) % DAY_NAMES.length
  return DAY_NAMES[index] ?? ''
}

type Props = {
  isOpen: boolean
  handleClose: () => void
  edit?: boolean
  rowData?: any
  planId?: string | number
  planDurationDays?: number
}

export default function DietPlanForm({
  isOpen,
  handleClose,
  edit,
  rowData,
  planId,
  planDurationDays,
}: Props) {
  const { data: detailData } = useDietPlanDetail(edit ? rowData?.id : undefined)

  const durationDays =
    Number(planDurationDays ?? 0) ||
    Number((detailData as any)?.diet_plan_template?.duration_days ?? 0)
  const dayNumbers = useMemo(() => {
    if (Number(durationDays) > 0) {
      return Array.from({ length: Number(durationDays) }, (_, i) => i + 1)
    }
    return []
  }, [durationDays])

  const methods = useForm<DietPlanSchema>({
    resolver: zodResolver(dietPlanFormSchema),
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: {
      diet_plan_template_id: Number(
        planId ?? rowData?.diet_plan_template_id ?? 0
      ),
      day_number: edit ? Number(rowData?.day_number ?? 1) : 0,
      sequence_number: Number(rowData?.sequence_number ?? 1),
      meal_time: rowData?.meal_time ?? '',
      day_name:
        rowData?.day_name ?? getDayNameFromNumber(rowData?.day_number) ?? '',
      notes: rowData?.notes ?? '',
      protein: (rowData as any)?.protein ?? '',
      carbs: (rowData as any)?.carbs ?? '',
      fat: (rowData as any)?.fat ?? '',
      fiber: (rowData as any)?.fiber ?? '',
      total_calories: (rowData as any)?.total_calories ?? '',
      calories: rowData?.calories ?? '',
    },
  })

  const {
    handleSubmit,
    reset,
    watch,
    setValue,
    control,
    formState: { errors },
  } = methods
  const { mutate: createMutate, isLoading: creating } = useCreateDietPlan()
  const { mutate: updateMutate, isLoading: updating } = useUpdateDietPlan()

  const {
    fields: mealFields,
    append: appendMeal,
    remove: removeMeal,
    replace: replaceMeals,
  } = useFieldArray({
    control,
    name: 'meals',
  })

  const selectedMealTime = watch('meal_time')
  const selectedDayName = watch('day_name')
  const selectedDayNumber = watch('day_number')
  const searchParams = {
    page: 1,
    per_page: 999,
    search: '',
    ordering: '',
    meal_time: selectedMealTime || undefined,
  }

  const { data: mealsData, refetch: refetchMeals } = useMeals(
    searchParams as any
  )
  const dayNameOptions = useMemo(() => {
    if (dayNumbers.length === 0) {
      return DAY_NAMES.map((name) => ({
        id: name.toLowerCase(),
        name,
        value: name,
      }))
    }

    const availableIndices = new Set<number>()
    dayNumbers.forEach((value) => {
      if (!Number.isFinite(value) || value <= 0) return
      const idx = (value - 1) % DAY_NAMES.length
      availableIndices.add(idx)
    })

    const applicableNames =
      availableIndices.size > 0
        ? DAY_NAMES.filter((_, idx) => availableIndices.has(idx))
        : DAY_NAMES

    return applicableNames.map((name) => ({
      id: name.toLowerCase(),
      name,
      value: name,
    }))
  }, [dayNumbers])

  const filteredDayNumbers = useMemo(() => {
    if (!selectedDayName) return dayNumbers
    const index = getDayIndexFromName(selectedDayName)
    if (index == null) return dayNumbers

    return dayNumbers.filter((value) => {
      if (!Number.isFinite(value) || value <= 0) return false
      return (value - 1) % DAY_NAMES.length === index
    })
  }, [dayNumbers, selectedDayName])

  const filteredDayOptions = useMemo(
    () =>
      filteredDayNumbers.map((value) => ({
        id: String(value),
        name: String(value),
        value: String(value),
      })),
    [filteredDayNumbers]
  )

  const allMeals = (mealsData as any)?.meals ?? []
  const filteredMeals = allMeals
  const mealsFormValues = (watch('meals') as any[]) ?? []
  const totalCaloriesFromMeals = mealsFormValues.reduce((sum, m) => {
    const meal = filteredMeals.find(
      (fm: any) => String(fm.id) === String(m.meal_id)
    )
    const count = Number(m?.count || 1)
    if (!meal) return sum

    const perServingProtein = Number(
      meal?.per_serving?.protein ?? meal?.calories_breakdown?.protein ?? 0
    )
    const perServingCarbs = Number(
      meal?.per_serving?.carbs ?? meal?.calories_breakdown?.carbs ?? 0
    )
    const perServingFat = Number(
      meal?.per_serving?.fat ?? meal?.calories_breakdown?.fat ?? 0
    )
    const perServingFiber = Number(
      meal?.per_serving?.fiber ?? meal?.calories_breakdown?.fiber ?? 0
    )
    const perServingTotal =
      perServingProtein + perServingCarbs + perServingFat + perServingFiber

    return sum + perServingTotal * count
  }, 0)

  useEffect(() => {
    if (edit) return
    if (!selectedDayName) return

    if (filteredDayNumbers.length === 0) {
      setValue('day_number', 0, { shouldValidate: true })
      return
    }

    const currentValue = Number(selectedDayNumber)
    const hasCurrentSelection = filteredDayNumbers.some(
      (value) => value === currentValue && value > 0
    )

    if (hasCurrentSelection) {
      return
    }

    const nextValue = filteredDayNumbers[0]
    if (!Number.isFinite(nextValue) || nextValue <= 0) return

    setValue('day_number', nextValue, { shouldValidate: true })
  }, [edit, filteredDayNumbers, selectedDayName, selectedDayNumber, setValue])

  useEffect(() => {
    if (!selectedMealTime || edit) return

    const mapping: Record<string, number> = {
      'Morning drink': 1,
      Breakfast: 2,
      'Mid day meal': 3,
      Lunch: 4,
      'Evening snack': 5,
      Dinner: 6,
      'Bed time': 7,
    }

    const seq = mapping[selectedMealTime as keyof typeof mapping]
    if (seq != null) {
      setValue('sequence_number', seq, { shouldValidate: true })
    }
  }, [selectedMealTime, edit, setValue])

  useEffect(() => {
    if (!edit) return
    if (!isOpen) return

    refetchMeals()
  }, [edit, isOpen, selectedMealTime, refetchMeals])

  useEffect(() => {
    if (!isOpen) return

    const source: any =
      edit && detailData
        ? ((detailData as any).diet_plan ?? detailData)
        : rowData || {}

    const itemsSource =
      edit && Array.isArray((detailData as any)?.meals)
        ? (detailData as any).meals
        : Array.isArray(source?.items)
          ? source.items
          : []

    const mappedMeals =
      itemsSource.length > 0
        ? itemsSource.map((it: any) => {
            const rawReq = it.requirement ?? it.key_requirement
            const normalizedReq =
              String(rawReq ?? 'Optional').toLowerCase() === 'mandatory'
                ? 'Mandatory'
                : 'Optional'
            return {
              meal_id: it.meal_id ?? it.id ?? 0,
              count: it.quantity ?? it.default_serving_quantity ?? 1,
              requirement: normalizedReq,
              protein: '',
              carbs: '',
              fat: '',
              fiber: '',
              total_calories: '',
            }
          })
        : []

    reset({
      diet_plan_template_id: Number(
        planId ?? source?.diet_plan_template_id ?? 0
      ),
      day_number: edit ? Number(source?.day_number ?? 1) : 0,
      sequence_number: edit ? Number(source?.sequence_number ?? 1) : 0,
      meal_time: source?.meal_time ?? '',
      meal_name: source?.meal_name ?? '',
      day_name:
        source?.day_name ?? getDayNameFromNumber(source?.day_number) ?? '',
      notes: source?.notes ?? '',
      protein: (source as any)?.protein ?? '',
      carbs: (source as any)?.carbs ?? '',
      fat: (source as any)?.fat ?? '',
      fiber: (source as any)?.fiber ?? '',
      total_calories: (source as any)?.total_calories ?? '',
      calories: source?.calories ?? '',
      meals:
        mappedMeals.length > 0
          ? mappedMeals
          : [
              {
                meal_id: 0,
                count: 0,
                requirement: 'Optional',
                protein: '',
                carbs: '',
                fat: '',
                fiber: '',
                total_calories: '',
              },
            ],
    } as any)

    if (mappedMeals.length > 0) {
      replaceMeals(mappedMeals)
    } else {
      replaceMeals([
        {
          meal_id: 0,
          count: 0,
          requirement: 'Optional',
          protein: '',
          carbs: '',
          fat: '',
          fiber: '',
          total_calories: '',
        },
      ])
    }
  }, [isOpen, planId, edit, rowData, detailData, reset, replaceMeals])

  const onSubmit = (values: DietPlanSchema) => {
    const itemsPayload = (values.meals || [])
      .filter((m: any) => typeof m.meal_id === 'number' && m.meal_id && m.count)
      .map((m: any) => ({
        meal_id: m.meal_id as number,
        quantity: Number(m.count),
        requirement: (m.requirement === 'Mandatory'
          ? 'mandatory'
          : 'optional') as 'mandatory' | 'optional',
      }))

    const payload: any = {
      diet_plan: {
        diet_plan_template_id: Number(values.diet_plan_template_id ?? planId),
        day_number: Number(values.day_number),
        day_name: values.day_name || '',
        sequence_number: Number(values.sequence_number),
        meal_time: values.meal_time,
        calories: values.calories === '' ? null : Number(values.calories),
        notes: values.notes || '',
      },
    }

    if (itemsPayload.length > 0) {
      payload.items = itemsPayload
    }
    if (edit && rowData?.id) {
      updateMutate(
        { id: rowData.id, payload },
        { onSuccess: () => handleClose() }
      )
    } else {
      createMutate(payload, { onSuccess: () => handleClose() })
    }
  }

  const mealTimeOptions = [
    { id: 'Morning drink', name: 'Morning drink', value: 'Morning drink' },
    { id: 'Breakfast', name: 'Breakfast', value: 'Breakfast' },
    { id: 'Mid day meal', name: 'Mid day meal', value: 'Mid day meal' },
    { id: 'Lunch', name: 'Lunch', value: 'Lunch' },
    { id: 'Evening snack', name: 'Evening snack', value: 'Evening snack' },
    { id: 'Dinner', name: 'Dinner', value: 'Dinner' },
    { id: 'Bed time', name: 'Bed time', value: 'Bed time' },
  ]

  const handleMealTimeChange = (option: any) => {
    const mealTime = option?.id ?? option?.value ?? ''
    setValue('meal_time', mealTime, { shouldValidate: true })

    if (mealTime) {
      const mapping: Record<string, number> = {
        'Morning drink': 1,
        Breakfast: 2,
        'Mid day meal': 3,
        Lunch: 4,
        'Evening snack': 5,
        Dinner: 6,
        'Bed time': 7,
      }

      const seq = mapping[mealTime as keyof typeof mapping]
      if (seq != null) {
        setValue('sequence_number', seq, { shouldValidate: true })
      }
    }
  }

  const formFields = [
    {
      name: 'meal_time',
      label: 'Meal Time',
      type: 'custom_search_select',
      desc: 'name',
      descId: 'id',
      id: 'meal_time_id',
      placeholder: 'Select meal time',
      initialLoad: rowData?.meal_time ?? '',
      data: mealTimeOptions,
      required: true,
      disabled: !!edit,
      onChange: handleMealTimeChange,
    },
    {
      name: 'notes',
      label: 'Notes',
      type: 'textarea',
      placeholder: 'Add notes (optional)',
      required: false,
    },
  ]

  const showMealsSection = edit || !!selectedMealTime

  return (
    <DialogModal
      isOpen={isOpen}
      onClose={handleClose}
      title={edit ? 'Edit Diet Plan' : 'Create Diet Plan'}
      actionLabel={edit ? 'Update' : 'Create'}
      actionLoader={creating || updating}
      onSubmit={handleSubmit(onSubmit)}
      secondaryAction={handleClose}
      secondaryActionLabel="Cancel"
      small={false}
      body={
        <div className="max-h-[70vh] min-h-[250px] pr-1">
          <FormProvider {...methods}>
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-medium mb-1">
                    Day Name <span className="text-error">*</span>
                  </label>
                  <Controller
                    name="day_name"
                    control={control}
                    render={({ field: { value, onChange } }) => (
                      <AutoComplete
                        name="day_name"
                        type="custom_search_select"
                        desc="name"
                        descId="id"
                        placeholder="Select day name"
                        data={dayNameOptions}
                        value={value || ''}
                        disabled={!!edit}
                        className="w-full"
                        onChange={(option: any) => {
                          const nextValue = option?.value ?? option?.name ?? ''
                          onChange(nextValue)
                        }}
                      />
                    )}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-medium mb-1">
                    Day Number <span className="text-error">*</span>
                  </label>
                  <Controller
                    name="day_number"
                    control={control}
                    render={({ field: { value, onChange } }) => (
                      <AutoComplete
                        key={`day-number-${selectedDayName || 'all'}`}
                        name="day_number"
                        type="custom_search_select"
                        desc="name"
                        descId="id"
                        placeholder="Select day number"
                        data={filteredDayOptions}
                        value={value ? String(value) : ''}
                        disabled={!!edit}
                        className="w-full"
                        onChange={(option: any) => {
                          const raw =
                            option?.value ?? option?.id ?? option?.name
                          const numeric = Number(raw)
                          onChange(
                            Number.isFinite(numeric) && numeric > 0
                              ? numeric
                              : 0
                          )
                        }}
                      />
                    )}
                  />
                </div>
              </div>

              <FormBuilder data={formFields} edit={true} spacing />
              {showMealsSection && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold">Meals</h3>
                  </div>

                  {mealFields.map((field, index) => {
                    const selectedId = watch(`meals.${index}.meal_id` as const)
                    const selectedMeal = filteredMeals.find(
                      (m: any) => String(m.id) === String(selectedId)
                    )
                    const intakeQty = Number(
                      watch(`meals.${index}.count` as const) || 1
                    )
                    const mealErrors = (errors?.meals as any)?.[index]
                    const countError = mealErrors?.count
                    const selectedIdsAll: number[] = (mealsFormValues || [])
                      .map((m: any) => Number(m?.meal_id || 0))
                      .filter((v: number) => Number.isFinite(v) && v > 0)
                    const selectedIdsExceptCurrent = selectedIdsAll.filter(
                      (id) => String(id) !== String(selectedId ?? '')
                    )
                    let availableMealsForRow = filteredMeals.filter(
                      (m: any) =>
                        !selectedIdsExceptCurrent.includes(Number(m?.id || 0))
                    )
                    if (
                      selectedMeal &&
                      !availableMealsForRow.some(
                        (m: any) => String(m.id) === String(selectedMeal.id)
                      )
                    ) {
                      availableMealsForRow = [
                        selectedMeal,
                        ...availableMealsForRow,
                      ]
                    }

                    return (
                      <div
                        key={field.id}
                        className="mb-3 rounded border p-2 text-[11px]"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">Meal {index + 1}</span>
                        </div>

                        <div className="mb-2 flex items-center justify-end">
                          <Controller
                            name={`meals.${index}.requirement` as const}
                            control={control}
                            render={({ field: { value, onChange } }) => (
                              <div className="flex items-center gap-2">
                                <ToggleSwitch
                                  id={`meals-${index}-requirement`}
                                  checked={value === 'Mandatory'}
                                  onChange={(checked: boolean) =>
                                    onChange(checked ? 'Mandatory' : 'Optional')
                                  }
                                />
                                <span className="text-xxs">
                                  {value === 'Mandatory'
                                    ? 'Mandatory'
                                    : 'Optional'}
                                </span>
                              </div>
                            )}
                          />
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-2">
                          <div className="col-span-2 md:col-span-1">
                            <label className="block text-[10px] font-medium mb-1">
                              Meal Name <span className="text-error">*</span>
                            </label>
                            <AutoComplete
                              name={`meals.${index}.meal_id`}
                              type="custom_search_select"
                              desc="name"
                              descId="id"
                              required
                              placeholder="Select meal"
                              data={availableMealsForRow}
                              value={selectedMeal ? selectedMeal.name : ''}
                              className="w-full"
                              onChange={(option: any) => {
                                const mealId = option?.id ?? option?.value ?? ''
                                setValue(
                                  `meals.${index}.meal_id` as const,
                                  mealId === '' ? 0 : Number(mealId),
                                  { shouldValidate: true }
                                )
                                refetchMeals()
                              }}
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-medium mb-1">
                              Intake quantity{' '}
                              <span className="text-error">*</span>
                            </label>
                            <Controller
                              name={`meals.${index}.count` as const}
                              control={control}
                              render={({ field: { onChange, value } }) => (
                                <TextField
                                  id={`meals.${index}.count`}
                                  name={`meals.${index}.count`}
                                  type="text"
                                  placeholder=""
                                  value={
                                    value === undefined ||
                                    value === null ||
                                    value === 0
                                      ? ''
                                      : String(value)
                                  }
                                  onChange={(e: any) => {
                                    const v = e.target.value
                                    onChange(v === '' ? 0 : Number(v))
                                  }}
                                  allowPositiveOnly
                                  errors={
                                    countError
                                      ? {
                                          [`meals.${index}.count`]: countError,
                                        }
                                      : undefined
                                  }
                                />
                              )}
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-medium mb-1">
                              Serving unit<span className="text-error">*</span>
                            </label>
                            <TextField
                              id={`meals.${index}.serving_unit`}
                              name={`meals.${index}.serving_unit`}
                              type="text"
                              placeholder=""
                              value={selectedMeal?.serving_unit ?? ''}
                              disabled
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-medium mb-1">
                              Total Calorie<span className="text-error">*</span>
                            </label>
                            <TextField
                              id={`meals.${index}.total_calories`}
                              name={`meals.${index}.total_calories`}
                              type="text"
                              placeholder=""
                              value={
                                !selectedMeal
                                  ? ''
                                  : String(
                                      (() => {
                                        const p = Number(
                                          selectedMeal?.per_serving?.protein ??
                                            selectedMeal?.calories_breakdown
                                              ?.protein ??
                                            0
                                        )
                                        const c = Number(
                                          selectedMeal?.per_serving?.carbs ??
                                            selectedMeal?.calories_breakdown
                                              ?.carbs ??
                                            0
                                        )
                                        const f = Number(
                                          selectedMeal?.per_serving?.fat ??
                                            selectedMeal?.calories_breakdown
                                              ?.fat ??
                                            0
                                        )
                                        const fi = Number(
                                          selectedMeal?.per_serving?.fiber ??
                                            selectedMeal?.calories_breakdown
                                              ?.fiber ??
                                            0
                                        )
                                        const perServingTotal = p + c + f + fi
                                        return perServingTotal * intakeQty
                                      })()
                                    )
                              }
                              disabled
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          <div>
                            <label className="block text-[10px] font-medium mb-1">
                              Protein<span className="text-error">*</span>
                            </label>
                            <TextField
                              id={`meals.${index}.protein`}
                              name={`meals.${index}.protein`}
                              type="text"
                              placeholder=""
                              value={
                                selectedMeal
                                  ? String(
                                      (selectedMeal?.per_serving?.protein ??
                                        selectedMeal?.calories_breakdown
                                          ?.protein ??
                                        0) * intakeQty
                                    )
                                  : ''
                              }
                              disabled
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-medium mb-1">
                              Carbs<span className="text-error">*</span>
                            </label>
                            <TextField
                              id={`meals.${index}.carbs`}
                              name={`meals.${index}.carbs`}
                              type="text"
                              placeholder=""
                              value={
                                selectedMeal
                                  ? String(
                                      (selectedMeal?.per_serving?.carbs ??
                                        selectedMeal?.calories_breakdown
                                          ?.carbs ??
                                        0) * intakeQty
                                    )
                                  : ''
                              }
                              disabled
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-medium mb-1">
                              Fat<span className="text-error">*</span>
                            </label>
                            <TextField
                              id={`meals.${index}.fat`}
                              name={`meals.${index}.fat`}
                              type="text"
                              placeholder=""
                              value={
                                selectedMeal
                                  ? String(
                                      (selectedMeal?.per_serving?.fat ??
                                        selectedMeal?.calories_breakdown?.fat ??
                                        0) * intakeQty
                                    )
                                  : ''
                              }
                              disabled
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-medium mb-1">
                              Fiber<span className="text-error">*</span>
                            </label>
                            <TextField
                              id={`meals.${index}.fiber`}
                              name={`meals.${index}.fiber`}
                              type="text"
                              placeholder=""
                              value={
                                selectedMeal
                                  ? String(
                                      (selectedMeal?.per_serving?.fiber ??
                                        selectedMeal?.calories_breakdown
                                          ?.fiber ??
                                        0) * intakeQty
                                    )
                                  : ''
                              }
                              disabled
                            />
                          </div>
                        </div>

                        {mealFields.length > 1 && index > 0 && (
                          <div className="mb-2 mt-2 flex items-center justify-end">
                            <button
                              type="button"
                              className="text-[10px] text-red-500"
                              onClick={() => removeMeal(index)}
                            >
                              Remove
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  })}

                  <div className="mt-2 flex justify-between items-center">
                    <span className="text-[11px] font-semibold">
                      Total Calories: {totalCaloriesFromMeals || 0}
                    </span>
                    <button
                      type="button"
                      className="inline-flex items-center justify-center rounded-full bg-blue-500 px-2.5 py-1 mb-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                      onClick={() =>
                        appendMeal({
                          meal_id: 0,
                          count: 0,
                          requirement: 'Optional',
                          protein: '',
                          carbs: '',
                          fat: '',
                          fiber: '',
                          total_calories: '',
                        })
                      }
                      aria-label="Add meal row"
                    >
                      +
                    </button>
                  </div>
                </div>
              )}
            </>
          </FormProvider>
        </div>
      }
    />
  )
}
