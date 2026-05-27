import { zodResolver } from '@hookform/resolvers/zod'
import {
  FormProvider,
  useForm,
  useFieldArray,
  Controller,
} from 'react-hook-form'
import { dietPlanFormSchema, DietPlanSchema } from './schema'
import { DialogModal, TextField } from '../../../../../components/common'
import FormBuilder from '../../../../../components/app/formBuilder'
import ToggleSwitch from '../../../../../components/common/inputs/ToggleSwitch'
import { useCreateDietPlan, useDietPlanDetail, useUpdateDietPlan } from '../api'
import { useEffect, useMemo, useState } from 'react'
import { useMeals } from '../../../../Meals/api'
import { usePlan } from '../../../api'
import { AutoComplete } from 'qbs-core'
import Button from '../../../../../components/common/buttons/Button'
import { useSnackbarManager } from '../../../../../components/common/snackbar'

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

export const getDayIndexFromName = (name?: string | null) => {
  if (!name) return null
  return DAY_NAME_INDEX_MAP[name.toLowerCase()] ?? null
}

export const getDayNameFromNumber = (dayNumber?: number | string | null) => {
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
}

export default function DietPlanForm({
  isOpen,
  handleClose,
  edit,
  rowData,
  planId,
}: Props) {
  console.log('DietPlanForm edit:', edit, 'rowData:', rowData)
  const { enqueueSnackbar } = useSnackbarManager()
  const [initialDayName, setInitialDayName] = useState('')
  const { data: detailData } = useDietPlanDetail(edit ? rowData?.id : undefined)

  // Load plan to derive duration_days for day_number dropdown
  const { data: planData } = usePlan(String(planId ?? rowData?.plan_id ?? ''))
  const durationDays =
    (planData as any)?.plan?.duration_days ??
    (planData as any)?.duration_days ??
    0

  const dayOptions = useMemo(() => {
    if (Number(durationDays) > 0) {
      return Array.from({ length: Number(durationDays) }, (_, i) => i + 1).map(
        (d) => ({ id: d, name: String(d), value: d })
      )
    }
    return []
  }, [durationDays])

  const methods = useForm<DietPlanSchema>({
    resolver: zodResolver(dietPlanFormSchema),
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: {
      plan_id: Number(planId ?? rowData?.plan_id ?? 0),
      day_number: edit ? Number(rowData?.day_number ?? 1) : 0,
      sequence_number: Number(rowData?.sequence_number ?? 1),
      meal_time: rowData?.meal_time ?? '',
      meal_name: rowData?.meal_name ?? '',
      day_name:
        rowData?.day_name ?? getDayNameFromNumber(rowData?.day_number) ?? '',
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

  // Selected meal time from the form
  const selectedMealTime = watch('meal_time')
  const selectedDayName = watch('day_name')
  const selectedDayNumber = watch('day_number')

  // Call meals API with per_page=999.
  // For both create and edit, filter by the currently selected meal_time
  const searchParams = {
    page: 1,
    per_page: 999,
    search: '',
    ordering: '',
    meal_time: selectedMealTime || undefined,
  }

  const { data: mealsData, refetch: refetchMeals } = useMeals(
    searchParams as any
  ) as any

  const dayNameOptions = useMemo(() => {
    if (dayOptions.length === 0) {
      return DAY_NAMES.map((name) => ({
        id: name.toLowerCase(),
        name,
        value: name,
      }))
    }

    const availableIndices = new Set<number>()
    dayOptions.forEach((option) => {
      const value = Number(option.value ?? option.id ?? 0)
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
  }, [dayOptions])

  const filteredDayOptions = useMemo(() => {
    if (!selectedDayName) return dayOptions
    const index = getDayIndexFromName(selectedDayName)
    if (index == null) return dayOptions

    return dayOptions.filter((option) => {
      const value = Number(option.value ?? option.id ?? 0)
      if (!Number.isFinite(value) || value <= 0) return false
      return (value - 1) % DAY_NAMES.length === index
    })
  }, [dayOptions, selectedDayName])

  const allMeals = (mealsData as any)?.meals ?? []
  // API is already filtered by meal_time via searchParams; use it directly
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

    if (filteredDayOptions.length === 0) {
      setValue('day_number', 0, { shouldValidate: true })
      return
    }

    const nextValue = Number(
      filteredDayOptions[0]?.value ?? filteredDayOptions[0]?.id ?? 0
    )

    if (!Number.isFinite(nextValue) || nextValue <= 0) return
    if (Number(selectedDayNumber) === nextValue) return

    setValue('day_number', nextValue, { shouldValidate: true })
  }, [edit, filteredDayOptions, selectedDayName, selectedDayNumber, setValue])

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

  // In edit mode, whenever meal_time is changed/cleared while the dialog is open,
  // re-call the Meals API (with meal_time undefined so it loads all meals)
  useEffect(() => {
    if (!edit) return
    if (!isOpen) return

    refetchMeals()
  }, [edit, isOpen, selectedMealTime, refetchMeals])

  useEffect(() => {
    if (!isOpen) return

    // Prefer API detail in edit mode; otherwise fall back to rowData from table
    const source: any =
      edit && detailData
        ? ((detailData as any).diet_plan ?? detailData)
        : rowData || {}

    // Store initial day name for resetting after "Add New"
    const dayName =
      source?.day_name ?? getDayNameFromNumber(source?.day_number) ?? ''
    setInitialDayName(dayName)

    // For meals: in detail response it's "meals", in table row it's "items"
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
              // id from meals list: either meal_id or id
              meal_id: it.meal_id ?? it.id ?? 0,
              // quantity from detail: quantity or default_serving_quantity
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
      plan_id: Number(planId ?? source?.plan_id ?? 0),
      day_number: edit ? Number(source?.day_number ?? 1) : 0,
      // In create mode, start with 0 and let meal_time mapping set sequence_number
      sequence_number: edit ? Number(source?.sequence_number ?? 1) : 0,
      meal_time: source?.meal_time ?? '',
      meal_name: source?.meal_name ?? '',
      day_name:
        source?.day_name ?? getDayNameFromNumber(source?.day_number) ?? '',
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
                // use 0 so the controller renders it as an empty string in the input
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
      // Edit mode: mirror existing meals exactly
      replaceMeals(mappedMeals)
    } else {
      // Create mode: always start with exactly one empty meal row
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

  const onSubmit = (values: DietPlanSchema, keepOpen = false) => {
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
        plan_id: Number(values.plan_id ?? planId),
        day_number: Number(values.day_number),
        day_name: values.day_name,
        sequence_number: Number(values.sequence_number),
        meal_time: values.meal_time,
        meal_name: values.meal_name || '',
        calories: values.calories === '' ? null : Number(values.calories),
      },
    }

    if (itemsPayload.length > 0) {
      payload.items = itemsPayload
    }
    if (edit && rowData?.id) {
      updateMutate(
        { id: rowData.id, payload },
        {
          onSuccess: () => {
            enqueueSnackbar('Diet plan updated successfully', {
              variant: 'success',
            })
            handleClose()
          },
        }
      )
    } else {
      createMutate(payload, {
        onSuccess: () => {
          enqueueSnackbar('Diet plan created successfully', {
            variant: 'success',
          })
          if (keepOpen) {
            // Keep the form open and reset for new entry with same day
            const currentDayNumber = values.day_number
            const currentDayName = initialDayName || values.day_name
            reset({
              plan_id: Number(planId ?? values.plan_id ?? 0),
              day_number: currentDayNumber,
              day_name: currentDayName,
              sequence_number: 0,
              meal_time: '',
              meal_name: '',
              protein: '',
              carbs: '',
              fat: '',
              fiber: '',
              total_calories: '',
              calories: '',
              meals: [
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
          } else {
            handleClose()
          }
        },
      })
    }
  }

  const mealTimeOptions = [
    { id: 'Morning drink', name: 'Morning drink', value: 'Morning drink' },
    { id: 'Breakfast', name: 'Breakfast', value: 'Breakfast' },
    { id: 'Mid day meal', name: 'Mid day meal', value: 'Mid day meal' },
    { id: 'Lunch', name: 'Lunch', value: 'Lunch' },
    { id: 'Evening snack', name: 'Evening snack', value: 'Evening snack' },
    { id: 'Dinner', name: 'Dinner', value: 'Dinner' }, // <-- add this
    { id: 'Bed time', name: 'Bed time', value: 'Bed time' },
  ]

  const formFields = [
    {
      name: 'day_name',
      label: 'Day Name',
      type: 'custom_search_select',
      desc: 'name',
      descId: 'id',
      id: 'day_name_id',
      placeholder: 'Select day name',
      data: dayNameOptions,
      required: true,
      initialLoad: rowData?.day_name ?? '',
      disabled: !!edit,
    },
    edit
      ? {
          name: 'day_number',
          label: 'Day Number',
          type: 'text',
          placeholder: 'Enter day number',
          required: true,
          disabled: true,
        }
      : {
          name: 'day_number',
          label: 'Day Number',
          type: 'custom_search_select',
          desc: 'name',
          descId: 'id',
          id: 'day_number_id',
          placeholder: 'Select day number',
          data: filteredDayOptions,
          required: true,
        },
    {
      name: 'sequence_number',
      label: 'Sequence Number',
      type: 'text',
      placeholder: 'Enter sequence number',
      required: true,
      disabled: true,
    },
    {
      name: 'meal_time',
      label: 'Meal Time',
      type: 'custom_search_select',
      // Display option names and map by id
      desc: 'name',
      descId: 'id',
      id: 'meal_time_id',
      placeholder: 'Select meal time',
      initialLoad: rowData?.meal_time ?? '',
      data: mealTimeOptions,
      required: true,
      // In edit mode, keep meal time fixed to avoid clearing and 'no data found'
      disabled: !!edit,
    },
    // {
    //   name: 'sequence_number',
    //   label: 'Sequence Number',
    //   type: 'text',
    //   placeholder: 'Enter sequence number',
    //   required: true,
    //   disabled: true,
    // },
  ]
  const showMealsSection = edit || !!selectedMealTime
  return (
    <DialogModal
      isOpen={isOpen}
      onClose={handleClose}
      title={edit ? 'Edit Diet Plan' : 'Create Diet Plan'}
      actionLabel={edit ? 'Update' : 'Create'}
      actionLoader={creating || updating}
      onSubmit={handleSubmit((values) => onSubmit(values, false))}
      secondaryAction={handleClose}
      secondaryActionLabel="Cancel"
      small={false}
      actionBody={
        <div className="flex flex-row gap-2 w-full justify-end">
          <Button
            disabled={creating || updating}
            label="Cancel"
            onClick={handleClose}
            outlined
          />
          {!edit && (
            <Button
              disabled={creating || updating}
              isLoading={creating}
              label="Add New"
              onClick={handleSubmit((values) => onSubmit(values, true))}
              className="bg-blue-500 hover:bg-blue-600"
            />
          )}
          {edit && (
            <Button
              disabled={creating || updating}
              isLoading={creating || updating}
              label="Update"
              onClick={handleSubmit((values) => onSubmit(values, false))}
              primary
            />
          )}
        </div>
      }
      body={
        <div className="max-h-[70vh] min-h-[250px] pr-1">
          <FormProvider {...methods}>
            <>
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
                    // Build options for this row: exclude meals already chosen in other rows
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
                    // Ensure the currently selected option remains visible in its own row
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

                        {/* Requirement toggle row above Meal Name */}
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
                              placeholder="Select meal"
                              data={availableMealsForRow}
                              // show meal NAME in the input, while storing numeric id in form state
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
                                  label={undefined} // label already above
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
                                    // store as number in RHF, but pass as string to TextField
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
                              label={undefined}
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
                              label={undefined}
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
                              label={undefined}
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
                            />{' '}
                          </div>
                          <div>
                            <label className="block text-[10px] font-medium mb-1">
                              Carbs<span className="text-error">*</span>
                            </label>
                            <TextField
                              id={`meals.${index}.carbs`}
                              name={`meals.${index}.carbs`}
                              type="text"
                              label={undefined}
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
                              label={undefined}
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
                              label={undefined}
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
                        {/* Remove button row (right below) */}
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
                          // Use 0 as initial numeric value; render as empty in the input
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
