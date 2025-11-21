import { zodResolver } from '@hookform/resolvers/zod'
import { FormProvider, useForm } from 'react-hook-form'
import { useEffect } from 'react'

import { DialogModal } from '../../../components/common'
import FormBuilder from '../../../components/app/formBuilder'
import { mealFormSchema, MealSchema } from './schema'
import { useCreateMeal, useUpdateMeal } from '../api'
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
  const protein = methods.watch('protein')
  const carbs = methods.watch('carbs')
  const fat = methods.watch('fat')
  const fiber = methods.watch('fiber')

  // Auto-calculate total_calories when macros change
  useEffect(() => {
    const toNumber = (v: any) => {
      const n = Number(v)
      return Number.isNaN(n) ? 0 : n
    }

    const total =
      toNumber(protein) + toNumber(carbs) + toNumber(fat) + toNumber(fiber)

    methods.setValue('total_calories', total as any, {
      shouldValidate: true,
      shouldDirty: true,
    })
  }, [protein, carbs, fat, fiber, methods])
  const { mutate: createMealMutate } = useCreateMeal()
  const { mutate: updateMealMutate } = useUpdateMeal()
  const queryClient = useQueryClient()

  const onSubmit = (values: MealSchema) => {
    const payload = {
      meal: {
        name: values.name,
        meal_time: values.meal_time,
        notes: values.notes ?? '',
        calories_breakdown: {
          protein: values.protein,
          carbs: values.carbs,
          fat: values.fat,
          fiber: values.fiber,
        },
        total_calories: values.total_calories,
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
        name: rowData?.name ?? '',
        meal_time: rowData?.meal_time ?? '',
        notes: rowData?.notes ?? '',
        protein: rowData?.calories_breakdown?.protein ?? 0,
        carbs: rowData?.calories_breakdown?.carbs ?? 0,
        fat: rowData?.calories_breakdown?.fat ?? 0,
        fiber: rowData?.calories_breakdown?.fiber ?? 0,
        total_calories: rowData?.total_calories ?? 0,
      })
    } else if (isDrawerOpen && !edit) {
      reset({
        name: '',
        meal_time: '',
        notes: '',
        protein: 0,
        carbs: 0,
        fat: 0,
        fiber: 0,
        total_calories: 0,
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
        { id: 'Breakfast', name: 'Breakfast' },
        { id: 'Lunch', name: 'Lunch' },
        { id: 'Dinner', name: 'Dinner' },
        { id: 'Snack', name: 'Snack' },
        { id: 'Dessert', name: 'Dessert' },
        { id: 'Beverage', name: 'Beverage' },
      ],
    },
    {
      name: 'protein',
      label: 'Protein (kcal)',
      type: 'text',
      placeholder: 'Protein calories',
      required: true,
      allowPositiveOnly: true,
    },
    {
      name: 'carbs',
      label: 'Carbs (kcal)',
      type: 'text',
      placeholder: 'Carb calories',
      required: true,
      allowPositiveOnly: true,
    },
    {
      name: 'fat',
      label: 'Fat (kcal)',
      type: 'text',
      placeholder: 'Fat calories',
      required: true,
      allowPositiveOnly: true,
    },
    {
      name: 'fiber',
      label: 'Fiber (kcal)',
      type: 'text',
      placeholder: 'Fiber calories',
      required: true,
      allowPositiveOnly: true,
    },
    // {
    //   name: 'total_calories',
    //   label: 'Total Calories',
    //   type: 'text',
    //   placeholder: 'Total calories',
    //   required: true,
    //   allowPositiveOnly: true,
    // },
    {
      name: 'total_calories',
      label: 'Total Calories',
      type: 'text',
      placeholder: 'Total calories',
      required: true,
      allowPositiveOnly: true,
      disabled: true, // FormBuilder supports this (like in other forms)
    },
    {
      name: 'notes',
      label: 'Notes',
      type: 'textarea',
      placeholder: 'Add notes (optional)',
      required: false,
    },
  ]

  return (
    <DialogModal
      isOpen={isDrawerOpen}
      onClose={handleClose}
      title={edit ? 'Edit Meal' : 'Create Meal'}
      actionLabel={edit ? 'Update' : 'Create'}
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
