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
import { useCreateDietPlan, useUpdateDietPlan } from '../api'
import { useEffect } from 'react'
import { useMeals } from '../../../../Meals/api'
import { AutoComplete } from 'qbs-core'

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
  const methods = useForm<DietPlanSchema>({
    resolver: zodResolver(dietPlanFormSchema),
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: {
      plan_id: Number(planId ?? rowData?.plan_id ?? 0),
      day_number: Number(rowData?.day_number ?? 1),
      sequence_number: Number(rowData?.sequence_number ?? 1),
      meal_time: rowData?.meal_time ?? '',
      meal_name: rowData?.meal_name ?? '',
      protein: (rowData as any)?.protein ?? '',
      carbs: (rowData as any)?.carbs ?? '',
      fat: (rowData as any)?.fat ?? '',
      fiber: (rowData as any)?.fiber ?? '',
      total_calories: (rowData as any)?.total_calories ?? '',
      calories: rowData?.calories ?? '',
    },
  })

  const { handleSubmit, reset, watch, setValue, control } = methods
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

  // Call meals API with per_page=999 and re-fetch whenever meal_time changes
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

  const allMeals = (mealsData as any)?.meals ?? []
  const filteredMeals = selectedMealTime
    ? allMeals.filter((m: any) => m?.meal_time === selectedMealTime)
    : allMeals

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

  // const mealNameOptions = filteredMeals.map((m: any) => ({
  //   id: m.id,
  //   name: m.name,
  //   value: m.name,
  //   total_calories: m.total_calories ?? m.calories ?? 0,
  //   protein: m.calories_breakdown?.protein ?? 0,
  //   carbs: m.calories_breakdown?.carbs ?? 0,
  //   fat: m.calories_breakdown?.fat ?? 0,
  //   fiber: m.calories_breakdown?.fiber ?? 0,
  // }))

  // const selectedMealName = watch('meal_name')
  // const selectedMeal = mealNameOptions.find(
  //   (m: any) => m.name === selectedMealName || m.value === selectedMealName
  // )

  useEffect(() => {
    if (!isOpen) return

    // Map existing items (edit mode) into meals array so the section is prefilled
    const items = Array.isArray(rowData?.items) ? rowData.items : []
    const mappedMeals =
      items.length > 0
        ? items.map((it: any) => ({
            meal_id: it.meal_id ?? 0,
            count: it.quantity ?? 1,
            protein: '',
            carbs: '',
            fat: '',
            fiber: '',
            total_calories: '',
          }))
        : []

    reset({
      plan_id: Number(planId ?? rowData?.plan_id ?? 0),
      day_number: Number(rowData?.day_number ?? 1),
      sequence_number: Number(rowData?.sequence_number ?? 1),
      meal_time: rowData?.meal_time ?? '',
      meal_name: rowData?.meal_name ?? '',
      protein: (rowData as any)?.protein ?? '',
      carbs: (rowData as any)?.carbs ?? '',
      fat: (rowData as any)?.fat ?? '',
      fiber: (rowData as any)?.fiber ?? '',
      total_calories: (rowData as any)?.total_calories ?? '',
      calories: rowData?.calories ?? '',
      meals:
        mappedMeals.length > 0
          ? mappedMeals
          : [
              {
                meal_id: 0,
                count: 1,
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
    } else if (mealFields.length === 0) {
      appendMeal({
        meal_id: 0,
        count: 1,
        protein: '',
        carbs: '',
        fat: '',
        fiber: '',
        total_calories: '',
      })
    }
  }, [isOpen, planId, rowData, reset, appendMeal, replaceMeals])

  const onSubmit = (values: DietPlanSchema) => {
    const itemsPayload = (values.meals || [])
      .filter((m: any) => typeof m.meal_id === 'number' && m.meal_id && m.count)
      .map((m: any) => ({
        meal_id: m.meal_id as number,
        quantity: Number(m.count),
      }))

    const payload: any = {
      diet_plan: {
        plan_id: Number(values.plan_id ?? planId),
        day_number: Number(values.day_number),
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
    { id: 'Dinner', name: 'Dinner', value: 'Dinner' }, // <-- add this
    { id: 'Bed time', name: 'Bed time', value: 'Bed time' },
  ]

  const formFields = [
    {
      name: 'day_number',
      label: 'Day Number',
      type: 'text',
      placeholder: 'Enter day number',
      required: true,
      disabled: true,
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
    },
  ]
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
        <FormProvider {...methods}>
          <>
            <FormBuilder data={formFields} edit={true} spacing />
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

                return (
                  <div
                    key={field.id}
                    className="mb-3 rounded border p-2 text-[11px]"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Meal {index + 1}</span>
                      {mealFields.length > 1 && index > 0 && (
                        <button
                          type="button"
                          className="text-[10px] text-red-500"
                          onClick={() => removeMeal(index)}
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-2">
                      <div className="col-span-2 md:col-span-1">
                        <label className="block text-[10px] font-medium mb-1">
                          Meal Name
                        </label>
                        <AutoComplete
                          name={`meals.${index}.meal_id`}
                          type="custom_search_select"
                          desc="name"
                          descId="id"
                          placeholder="Select meal"
                          data={filteredMeals}
                          // show meal NAME in the input, while storing numeric id in form state
                          value={selectedMeal ? selectedMeal.name : ''}
                          className="w-full"
                          onChange={(option: any) => {
                            const mealId = option?.id ?? option?.value ?? ''
                            setValue(
                              `meals.${index}.meal_id` as const,
                              mealId === '' ? '' : mealId,
                              { shouldValidate: true }
                            )
                            refetchMeals()
                          }}
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-medium mb-1">
                          Intake quantity
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
                                value !== undefined && value !== null
                                  ? String(value)
                                  : '1'
                              }
                              onChange={(e: any) => {
                                const v = e.target.value
                                // store as number in RHF, but pass as string to TextField
                                onChange(v === '' ? '' : Number(v))
                              }}
                              allowPositiveOnly
                              // optional: disabled / readOnly if you want it non-editable
                              // disabled={true}
                            />
                          )}
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-medium mb-1">
                          Total Calorie
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
                                        selectedMeal?.calories_breakdown?.fat ??
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
                          Protein
                        </label>
                        {/* <input
                          type="text"
                          className="w-full border rounded-sm px-3 py-2 text-sm bg-gray-100"
                          value={
                            selectedMeal
                              ? (selectedMeal?.per_serving?.protein ??
                                selectedMeal?.calories_breakdown?.protein ??
                                0) * intakeQty
                              : ''
                          }
                          readOnly
                        /> */}
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
                                    selectedMeal?.calories_breakdown?.protein ??
                                    0) * intakeQty
                                )
                              : ''
                          }
                          disabled
                        />{' '}
                      </div>
                      <div>
                        <label className="block text-[10px] font-medium mb-1">
                          Carbs
                        </label>
                        {/* <input
                          type="text"
                          className="w-full border rounded-sm px-3 py-2 text-sm bg-gray-100"
                          value={
                            selectedMeal
                              ? (selectedMeal?.per_serving?.carbs ??
                                selectedMeal?.calories_breakdown?.carbs ??
                                0) * intakeQty
                              : ''
                          }
                          readOnly
                        /> */}
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
                                    selectedMeal?.calories_breakdown?.carbs ??
                                    0) * intakeQty
                                )
                              : ''
                          }
                          disabled
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-medium mb-1">
                          Fat
                        </label>
                        {/* <input
                          type="text"
                          className="w-full border rounded-sm px-3 py-2 text-sm bg-gray-100"
                          value={
                            selectedMeal
                              ? (selectedMeal?.per_serving?.fat ??
                                selectedMeal?.calories_breakdown?.fat ??
                                0) * intakeQty
                              : ''
                          }
                          readOnly
                        /> */}
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
                          Fiber
                        </label>
                        {/* <input
                          type="text"
                          className="w-full border rounded-sm px-3 py-2 text-sm bg-gray-100"
                          value={
                            selectedMeal
                              ? (selectedMeal?.per_serving?.fiber ??
                                selectedMeal?.calories_breakdown?.fiber ??
                                0) * intakeQty
                              : ''
                          }
                          readOnly
                        /> */}
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
                                    selectedMeal?.calories_breakdown?.fiber ??
                                    0) * intakeQty
                                )
                              : ''
                          }
                          disabled
                        />
                      </div>
                    </div>
                  </div>
                )
              })}

              <div className="mt-2 flex justify-between items-center">
                <span className="text-[11px] font-semibold">
                  Total Calories: {totalCaloriesFromMeals || 0}
                </span>
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-full bg-blue-500 px-2.5 py-1 text-sm font-semibold text-white shadow-sm hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                  onClick={() =>
                    appendMeal({
                      meal_id: 0,
                      count: 1,
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
          </>
        </FormProvider>
      }
    />
  )
}
