import { zodResolver } from '@hookform/resolvers/zod'
import { FormProvider, useForm } from 'react-hook-form'
import { workoutPlanFormSchema, WorkoutPlanSchema } from './schema'
import { DialogModal } from '../../../../../components/common'
import FormBuilder from '../../../../../components/app/formBuilder'
import { useCreateWorkoutPlan, useUpdateWorkoutPlan } from '../api'
import { useEffect } from 'react'

type Props = {
  isOpen: boolean
  handleClose: () => void
  edit?: boolean
  rowData?: any
  planId?: string | number
}

export default function WorkoutPlanForm({
  isOpen,
  handleClose,
  edit,
  rowData,
  planId,
}: Props) {
  const methods = useForm<WorkoutPlanSchema>({
    resolver: zodResolver(workoutPlanFormSchema),
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: {
      plan_id: Number(planId ?? rowData?.plan_id ?? 0),
      day_number: Number(rowData?.day_number ?? 1),
      title: rowData?.title ?? '',
      description: rowData?.description ?? '',
    },
  })

  const { handleSubmit, reset } = methods
  const { mutate: createMutate, isLoading: creating } = useCreateWorkoutPlan()
  const { mutate: updateMutate, isLoading: updating } = useUpdateWorkoutPlan()

  useEffect(() => {
    if (isOpen) {
      reset({
        plan_id: Number(planId ?? rowData?.plan_id ?? 0),
        day_number: Number(rowData?.day_number ?? 1),
        title: rowData?.title ?? '',
        description: rowData?.description ?? '',
      })
    }
  }, [isOpen, planId, rowData, reset])

  const onSubmit = (values: WorkoutPlanSchema) => {
    const payload = {
      workout_plan: {
        plan_id: Number(values.plan_id ?? planId),
        day_number: Number(values.day_number),
        title: values.title,
        description: values.description || '',
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
      name: 'title',
      label: 'Title',
      type: 'text',
      placeholder: 'Enter title',
      required: true,
    },
    {
      name: 'description',
      label: 'Description',
      type: 'textarea',
      placeholder: 'Enter description',
    },
  ]

  return (
    <DialogModal
      isOpen={isOpen}
      onClose={handleClose}
      title={edit ? 'Edit Workout Plan' : 'Create Workout Plan'}
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
