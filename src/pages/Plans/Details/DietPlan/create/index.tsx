import { zodResolver } from '@hookform/resolvers/zod'
import { FormProvider, useForm, useFieldArray } from 'react-hook-form'
import { dietPlanFormSchema, DietPlanSchema } from './schema'
import { DialogModal } from '../../../../../components/common'
import FormBuilder from '../../../../../components/app/formBuilder'
import { useCreateDietPlan, useUpdateDietPlan } from '../api'
import { useEffect } from 'react'
import { useMeals } from '../../../../Meals/api'

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

  const { handleSubmit, reset, watch, setValue, control, register } = methods
  const { mutate: createMutate, isLoading: creating } = useCreateDietPlan()
  const { mutate: updateMutate, isLoading: updating } = useUpdateDietPlan()

  const {
    fields: mealFields,
    append: appendMeal,
    remove: removeMeal,
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
  //   // Prefer total_calories from the meals API; fallback to calories if present
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
    if (isOpen) {
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
      })

      // Ensure at least one meal section is visible when the dialog opens
      if (!rowData?.meals || (rowData as any)?.meals?.length === 0) {
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
    }
  }, [isOpen, planId, rowData, reset, appendMeal])

  const onSubmit = (values: DietPlanSchema) => {
    const itemsPayload = (values.meals || [])
      .filter((m: any) => m.meal_id && m.count)
      .map((m: any) => ({
        meal_id: Number(m.meal_id),
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
    edit
      ? {
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
        }
      : {
          name: 'meal_time',
          label: 'Meal Time',
          type: 'text',
          placeholder: 'Enter meal time',
          required: true,
        },
    // {
    //   name: 'meal_name',
    //   label: 'Meal Name',
    //   ...(edit
    //     ? {
    //       // Single-select meal name in edit mode
    //       type: 'custom_search_select',
    //       desc: 'name',
    //       descId: 'id',
    //       id: 'meal_id',
    //       placeholder: 'Select meal',
    //       data: mealNameOptions,
    //       initialLoad: rowData?.meal_name ?? '',
    //       handleCallBack: (selected: any) => {
    //         if (selected && typeof selected.total_calories !== 'undefined') {
    //           setValue('calories', selected.total_calories ?? '', {
    //             shouldValidate: true,
    //           })
    //           setValue('protein', selected.protein ?? '', {
    //             shouldValidate: true,
    //           })
    //           setValue('carbs', selected.carbs ?? '', {
    //             shouldValidate: true,
    //           })
    //           setValue('fat', selected.fat ?? '', {
    //             shouldValidate: true,
    //           })
    //           setValue('fiber', selected.fiber ?? '', {
    //             shouldValidate: true,
    //           })
    //           setValue('total_calories', selected.total_calories ?? '', {
    //             shouldValidate: true,
    //           })
    //         }
    //       },
    //     }
    //     : {
    //       type: 'text',
    //       placeholder: 'Enter meal name',
    //     }),
    // },
    // {
    //   name: 'protein',
    //   label: 'Protein',
    //   type: 'text',
    //   required: true,
    //   disabled: true,
    // },
    // {
    //   name: 'carbs',
    //   label: 'Carbs',
    //   type: 'text',
    //   required: true,
    //   disabled: true,
    // },
    // {
    //   name: 'fat',
    //   label: 'Fat',
    //   type: 'text',
    //   required: true,
    //   disabled: true,
    // },
    // {
    //   name: 'fiber',
    //   label: 'Fiber',
    //   type: 'text',
    //   required: true,
    //   disabled: true,
    // },
    // {
    //   name: 'total_calories',
    //   label: 'Total Calories',
    //   type: 'text',
    //   required: true,
    //   disabled: true,
    // },
    // {
    //   name: 'calories',
    //   label: 'Calories',
    //   type: 'text',
    //   placeholder: 'Enter calories',
    // },
  ]
  // const formFields1 = [
  //       {
  //       name: 'meal_name',
  //       label: 'Meal Name',
  //       ...(edit
  //         ? {
  //           // Single-select meal name in edit mode
  //           type: 'custom_search_select',
  //           desc: 'name',
  //           descId: 'id',
  //           id: 'meal_id',
  //           placeholder: 'Select meal',
  //           data: mealNameOptions,
  //           initialLoad: rowData?.meal_name ?? '',
  //           handleCallBack: (selected: any) => {
  //             if (selected && typeof selected.total_calories !== 'undefined') {
  //               setValue('calories', selected.total_calories ?? '', {
  //                 shouldValidate: true,
  //               })
  //               setValue('protein', selected.protein ?? '', {
  //                 shouldValidate: true,
  //               })
  //               setValue('carbs', selected.carbs ?? '', {
  //                 shouldValidate: true,
  //               })
  //               setValue('fat', selected.fat ?? '', {
  //                 shouldValidate: true,
  //               })
  //               setValue('fiber', selected.fiber ?? '', {
  //                 shouldValidate: true,
  //               })
  //               setValue('total_calories', selected.total_calories ?? '', {
  //                 shouldValidate: true,
  //               })
  //             }
  //           },
  //         }
  //         : {
  //           type: 'text',
  //           placeholder: 'Enter meal name',
  //         }),
  //     },
  //     {
  //       name: 'protein',
  //       label: 'Protein',
  //       type: 'text',
  //       required: true,
  //       disabled: true,
  //     },
  //     {
  //       name: 'carbs',
  //       label: 'Carbs',
  //       type: 'text',
  //       required: true,
  //       disabled: true,
  //     },
  //     {
  //       name: 'fat',
  //       label: 'Fat',
  //       type: 'text',
  //       required: true,
  //       disabled: true,
  //     },
  //     {
  //       name: 'fiber',
  //       label: 'Fiber',
  //        type: 'text',
  //        required: true,
  //        disabled: true,
  //      },

  // ]
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
                        {/* <select
                          className="w-full border rounded-sm px-3 py-2 text-sm "
                          value={selectedId ?? ''}
                          onChange={(e) => {
                            // const mealId = Number(e.target.value)
                            // const meal = filteredMeals.find(
                            //   (m: any) => String(m.meal_id) === String(mealId)
                            // )
                            // setValue(
                            //   `meals.${index}.meal_id` as const,
                            //   mealId,
                            //   { shouldValidate: true }
                            // )
                            // if (meal) {
                            //   const totalCalories =
                            //     meal.total_calories ?? meal.calories ?? 0
                            //   const protein =
                            //     meal.calories_breakdown?.protein ?? 0
                            //   const carbs =
                            //     meal.calories_breakdown?.carbs ?? 0
                            //   const fat =
                            //     meal.calories_breakdown?.fat ?? 0
                            //   const fiber =
                            //     meal.calories_breakdown?.fiber ?? 0

                            //   setValue(
                            //     `meals.${index}.protein` as const,
                            //     protein,
                            //     { shouldValidate: false }
                            //   )
                            //   setValue(
                            //     `meals.${index}.carbs` as const,
                            //     carbs,
                            //     { shouldValidate: false }
                            //   )
                            //   setValue(
                            //     `meals.${index}.fat` as const,
                            //     fat,
                            //     { shouldValidate: false }
                            //   )
                            //   setValue(
                            //     `meals.${index}.fiber` as const,
                            //     fiber,
                            //     { shouldValidate: false }
                            //   )
                            //   setValue(
                            //     `meals.${index}.total_calories` as const,
                            //     totalCalories,
                            //     { shouldValidate: false }
                            //   )
                            // }
                            const mealId = Number(e.target.value)
                            // const meal = filteredMeals.find((m: any) => m.id === mealId)

                            setValue(`meals.${index}.meal_id` as const, mealId, { shouldValidate: true })
                          }}
                        >
                          <option value="">Select meal</option>
                          {filteredMeals.map((m: any) => (
                            <option key={m.id} value={m.id}>
                              {m.name}
                            </option>
                          ))}
                        </select> */}
                        <select
                          className="w-full border rounded-sm px-3 py-2 text-sm "
                          value={selectedId ?? ''}
                          onChange={(e) => {
                            const mealId = Number(e.target.value)

                            setValue(
                              `meals.${index}.meal_id` as const,
                              mealId,
                              {
                                shouldValidate: true,
                              }
                            )

                            // Call the API again if you really need to
                            refetchMeals()
                          }}
                        >
                          <option value="">Select meal</option>
                          {filteredMeals.map((m: any) => (
                            <option key={m.id} value={m.id}>
                              {m.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-medium mb-1">
                          Intake quantity
                        </label>
                        <input
                          type="number"
                          className="w-full border rounded-sm px-3 py-2 text-sm bg-gray-100"
                          min={1}
                          {...register(`meals.${index}.count` as const)}
                        />
                        {/* <input
                          type="text"
                          className="w-full border rounded-sm px-3 py-2 text-sm bg-gray-100"
                          value={
                            selectedMeal
                              ? (selectedMeal.total_calories ?? selectedMeal.calories ?? 0) * intakeQty
                              : ''
                          }
                          readOnly
                        /> */}
                      </div>

                      <div>
                        <label className="block text-[10px] font-medium mb-1">
                          Calories
                        </label>
                        <input
                          type="text"
                          className="w-full border rounded-sm px-3 py-2 text-sm bg-gray-100"
                          value={(() => {
                            if (!selectedMeal) return ''

                            const p = Number(
                              selectedMeal?.per_serving?.protein ??
                                selectedMeal?.calories_breakdown?.protein ??
                                0
                            )
                            const c = Number(
                              selectedMeal?.per_serving?.carbs ??
                                selectedMeal?.calories_breakdown?.carbs ??
                                0
                            )
                            const f = Number(
                              selectedMeal?.per_serving?.fat ??
                                selectedMeal?.calories_breakdown?.fat ??
                                0
                            )
                            const fi = Number(
                              selectedMeal?.per_serving?.fiber ??
                                selectedMeal?.calories_breakdown?.fiber ??
                                0
                            )
                            const perServingTotal = p + c + f + fi
                            return perServingTotal * intakeQty
                          })()}
                          readOnly
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
                            (selectedMeal?.calories_breakdown?.protein ?? '') as any
                          }
                          readOnly
                        /> */}
                        <input
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
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-medium mb-1">
                          Carbs
                        </label>
                        {/* <input
                          type="text"
                          className="w-full border rounded px-3 py-2 text-sm bg-gray-100"
                          value={
                            (selectedMeal?.calories_breakdown?.carbs ?? '') as any
                          }
                          readOnly
                        /> */}
                        <input
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
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-medium mb-1">
                          Fat
                        </label>
                        {/* <input
                          type="text"
                          className="w-full border rounded px-3 py-2 text-sm bg-gray-100"
                          value={
                            (selectedMeal?.calories_breakdown?.fat ?? '') as any
                          }
                          readOnly
                        /> */}
                        <input
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
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-medium mb-1">
                          Fiber
                        </label>
                        {/* <input
                          type="text"
                          className="w-full border rounded px-3 py-2 text-sm bg-gray-100"
                          value={
                            (selectedMeal?.calories_breakdown?.fiber ?? '') as any
                          }
                          readOnly
                        /> */}
                        <input
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
                  className="text-xs text-primary-500 underline"
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
                >
                  Add more
                </button>
              </div>
            </div>
          </>
        </FormProvider>
      }
    />
  )
}
