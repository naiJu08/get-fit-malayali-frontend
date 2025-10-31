import { zodResolver } from '@hookform/resolvers/zod'
import { FormProvider, useForm } from 'react-hook-form'
import { dietPlanFormSchema, DietPlanSchema } from './schema'
import { DialogModal } from '../../../../../components/common'
import FormBuilder from '../../../../../components/app/formBuilder'
import { useCreateDietPlan, useUpdateDietPlan } from '../api'
import { useEffect } from 'react'

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
      calories: rowData?.calories ?? '',
    },
  })

  const { handleSubmit, reset } = methods
  const { mutate: createMutate, isLoading: creating } = useCreateDietPlan()
  const { mutate: updateMutate, isLoading: updating } = useUpdateDietPlan()

  useEffect(() => {
    if (isOpen) {
      reset({
        plan_id: Number(planId ?? rowData?.plan_id ?? 0),
        day_number: Number(rowData?.day_number ?? 1),
        sequence_number: Number(rowData?.sequence_number ?? 1),
        meal_time: rowData?.meal_time ?? '',
        meal_name: rowData?.meal_name ?? '',
        calories: rowData?.calories ?? '',
      })
    }
  }, [isOpen, planId, rowData, reset])

  const onSubmit = (values: DietPlanSchema) => {
    const payload = {
      diet_plan: {
        plan_id: Number(values.plan_id ?? planId),
        day_number: Number(values.day_number),
        sequence_number: Number(values.sequence_number),
        meal_time: values.meal_time,
        meal_name: values.meal_name || '',
        calories: values.calories === '' ? null : Number(values.calories),
      },
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

  const formFields = [
    {
      name: 'day_number',
      label: 'Day Number',
      type: 'text',
      placeholder: 'Enter day number',
      required: true,
    },
    {
      name: 'sequence_number',
      label: 'Sequence Number',
      type: 'text',
      placeholder: 'Enter sequence number',
      required: true,
    },
    {
      name: 'meal_time',
      label: 'Meal Time',
      type: 'text',
      placeholder: 'Enter meal time',
      required: true,
    },
    {
      name: 'meal_name',
      label: 'Meal Name',
      type: 'text',
      placeholder: 'Enter meal name',
    },
    {
      name: 'calories',
      label: 'Calories',
      type: 'text',
      placeholder: 'Enter calories',
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
          <FormBuilder data={formFields} edit={true} />
        </FormProvider>
      }
    />
  )
}
