import { zodResolver } from '@hookform/resolvers/zod'
import { FormProvider, useForm } from 'react-hook-form'
import { useEffect } from 'react'

import { DialogModal } from '../../../components/common'
import FormBuilder from '../../../components/app/formBuilder'
import { mealFormSchema, MealSchema } from './schema'
import {
  useCreateMeal,
  useMealCategories,
  useServingUnits,
  useUpdateMeal,
} from '../api'
import { useQueryClient } from '@tanstack/react-query'

type Props = {
  isDrawerOpen: boolean
  handleClose: () => void
  handleRefresh?: () => void
  edit?: boolean
  rowData?: any
}

export default function CreateMeal({
  isDrawerOpen,
  handleClose,
  handleRefresh,
  edit,
  rowData,
}: Props) {
  const methods = useForm<MealSchema>({
    resolver: zodResolver(mealFormSchema),
    mode: 'onChange',
    reValidateMode: 'onChange',
  })
  const { handleSubmit, reset } = methods
  // Watch macro fields
  // const protein = methods.watch('protein')
  // const carbs = methods.watch('carbs')
  // const fat = methods.watch('fat')
  // const fiber = methods.watch('fiber')

  // Auto-calculate total_calories when macros change
  // useEffect(() => {
  //   const toNumber = (v: any) => {
  //     const n = Number(v)
  //     return Number.isNaN(n) ? 0 : n
  //   }

  //   // const total =
  //   //   toNumber(protein) + toNumber(carbs) + toNumber(fat) + toNumber(fiber)

  //   // methods.setValue('total_calories', total as any, {
  //   //   shouldValidate: true,
  //   //   shouldDirty: true,
  //   // })
  // }, [methods])
  const { mutate: createMealMutate } = useCreateMeal()
  const { mutate: updateMealMutate } = useUpdateMeal()
  const queryClient = useQueryClient()
  const { data: mealCategoriesData } = useMealCategories()

  const rawMealCategories =
    (mealCategoriesData as any)?.meal_categories ?? (mealCategoriesData as any)
  const mealCategoryList = Array.isArray(rawMealCategories)
    ? rawMealCategories
    : []
  const mealCategoryOptions = mealCategoryList.map((c: any) => ({
    id: c.id,
    name: c.name,
  }))

  const selectedMealCategoryId = methods.watch('meal_category_id') as
    | number
    | undefined

  const { data: servingUnitsData } = useServingUnits(selectedMealCategoryId)

  const rawServingUnits =
    (servingUnitsData as any)?.serving_units ?? (servingUnitsData as any)
  const servingUnitList = Array.isArray(rawServingUnits) ? rawServingUnits : []
  const servingUnitOptions = servingUnitList.map((u: any) =>
    typeof u === 'string' ? { id: u, name: u } : { id: u.id, name: u.name }
  )
  useEffect(() => {
    // When meal category changes in CREATE mode, reset serving_unit so user selects a unit for that category.
    // For EDIT mode, keep existing serving_unit on initial load; user can manually change it if needed.
    if (!edit) {
      methods.setValue('serving_unit', '' as any, {
        shouldValidate: false,
        shouldDirty: false,
        shouldTouch: false,
      })
    }
  }, [selectedMealCategoryId, methods, edit])
  const toTitleCase = (value?: string | null) => {
    if (!value) return ''
    return value
      .split(' ')
      .map((word) =>
        word
          ? `${word.charAt(0).toUpperCase()}${word.slice(1).toLowerCase()}`
          : word
      )
      .join(' ')
  }

  const onSubmit = (values: MealSchema) => {
    // const payload = {
    //   meal: {
    //     name: values.name,
    //     meal_time: values.meal_time,
    //     notes: values.notes ?? '',
    //     calories_breakdown: {
    //       protein: values.protein,
    //       carbs: values.carbs,
    //       fat: values.fat,
    //       fiber: values.fiber,
    //     },
    //     total_calories: values.total_calories,
    //   },
    // }
    const payload = {
      meal: {
        name: toTitleCase(values.name),
        meal_time: values.meal_time,
        meal_category_id: values.meal_category_id,
        serving_unit: values.serving_unit,
        per_serving_calories: values.per_serving_calories,
        per_serving_protein: values.per_serving_protein,
        per_serving_carbs: values.per_serving_carbs,
        per_serving_fat: values.per_serving_fat,
        per_serving_fiber: values.per_serving_fiber,
        notes: values.notes ?? '',
      },
    }
    if (edit && rowData?.id) {
      updateMealMutate(
        { id: rowData.id, payload },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['meals_list'] })
            handleRefresh?.()
            handleClose()
          },
        }
      )
    } else {
      createMealMutate(payload, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['meals_list'] })
          handleRefresh?.()
          handleClose()
        },
      })
    }
  }

  useEffect(() => {
    if (isDrawerOpen && edit && rowData) {
      reset({
        name: toTitleCase(rowData?.name) ?? '',
        meal_time: rowData?.meal_time ?? '',
        meal_category: rowData?.meal_category ?? '',
        meal_category_id: rowData?.meal_category_id ?? undefined,
        serving_unit: rowData?.serving_unit ?? '',
        per_serving_calories:
          rowData?.per_serving?.calories ?? rowData?.per_serving_calories ?? 0,
        per_serving_protein:
          rowData?.per_serving?.protein ?? rowData?.per_serving_protein ?? 0,
        per_serving_carbs:
          rowData?.per_serving?.carbs ?? rowData?.per_serving_carbs ?? 0,
        per_serving_fat:
          rowData?.per_serving?.fat ?? rowData?.per_serving_fat ?? 0,
        per_serving_fiber:
          rowData?.per_serving?.fiber ?? rowData?.per_serving_fiber ?? 0,
        notes: rowData?.notes ?? '',
      })
    } else if (isDrawerOpen && !edit) {
      reset({
        name: '',
        meal_time: '',
        meal_category: '',
        meal_category_id: undefined,
        serving_unit: '',
        per_serving_calories: '' as any,
        per_serving_protein: '' as any,
        per_serving_carbs: '' as any,
        per_serving_fat: '' as any,
        per_serving_fiber: '' as any,
        notes: '',
      })
    }
  }, [isDrawerOpen, edit, rowData, reset])

  const formFields = [
    {
      name: 'name',
      label: 'Name',
      type: 'text',
      placeholder: 'Enter meal name',
      required: true,
    },
    {
      name: 'meal_time',
      label: 'Meal Time',
      type: 'custom_select',
      placeholder: 'Select meal time',
      required: true,
      id: 'meal_time_value',
      desc: 'name',
      descId: 'id',
      data: [
        { id: 'Morning drink', name: 'Morning drink' },
        { id: 'Breakfast', name: 'Breakfast' },
        { id: 'Mid day meal', name: 'Mid day meal' },
        { id: 'Lunch', name: 'Lunch' },
        { id: 'Evening snack', name: 'Evening snack' },
        { id: 'Dinner', name: 'Dinner' },
        { id: 'Bed time', name: 'Bed time' },
      ],
    },
    // Removed old macro fields (protein, carbs, fat, fiber) and total_calories in favor of per_serving_* fields
    {
      name: 'meal_category',
      label: 'Meal Category',
      type: 'custom_search_select',
      placeholder: 'Select meal category',
      required: true,
      desc: 'name',
      descId: 'id',
      id: 'meal_category_id',
      data: mealCategoryOptions,
    },
    {
      name: 'notes',
      label: 'Notes',
      type: 'textarea',
      placeholder: 'Add notes (optional)',
      required: false,
    },

    {
      name: 'serving_unit',
      label: 'Serving Unit',
      type: 'custom_search_select',
      placeholder: 'Select serving unit',
      required: true,
      desc: 'name',
      descId: 'id',
      id: 'serving_unit',
      data: servingUnitOptions,
    },
    {
      name: 'per_serving_protein',
      label: 'Protein',
      type: 'text',
      required: true,
      allowPositiveOnly: true,
    },
    {
      name: 'per_serving_carbs',
      label: 'Carbs',
      type: 'text',
      required: true,
      allowPositiveOnly: true,
    },
    {
      name: 'per_serving_fat',
      label: 'Fat',
      type: 'text',
      required: true,
      allowPositiveOnly: true,
    },
    {
      name: 'per_serving_fiber',
      label: 'Fiber',
      type: 'text',
      required: true,
      allowPositiveOnly: true,
    },
    {
      name: 'per_serving_calories',
      label: 'Total Calories',
      type: 'text',
      required: true,
      allowPositiveOnly: true,
    },
  ]

  return (
    <DialogModal
      isOpen={isDrawerOpen}
      onClose={handleClose}
      title={edit ? 'Edit Food' : 'Create Food'}
      actionLabel={edit ? 'Save' : 'Save'}
      onSubmit={handleSubmit(onSubmit)}
      secondaryAction={handleClose}
      secondaryActionLabel="Cancel"
      small={false}
      body={
        <div className="flex flex-col gap-4">
          <FormProvider {...methods}>
            <FormBuilder data={formFields} edit={true} spacing />
          </FormProvider>
        </div>
      }
    />
  )
}
