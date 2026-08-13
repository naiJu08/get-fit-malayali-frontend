import { zodResolver } from '@hookform/resolvers/zod'
import { FormProvider, useForm } from 'react-hook-form'
import { DialogModal } from '../../../components/common'
import FormBuilder from '../../../components/app/formBuilder'
import { useSnackbarManager } from '../../../components/common/snackbar'
import { useEffect } from 'react'
import { createWorkoutTemplate, updateWorkoutTemplate } from '../api'
import {
  workoutTemplateSchema,
  WorkoutTemplateForm as WorkoutTemplateValues,
} from './schema'

export default function WorkoutTemplateForm({
  isOpen,
  handleClose,
  rowData,
  edit,
  onSuccess,
}: {
  isOpen: boolean
  handleClose: () => void
  rowData?: any
  edit?: boolean
  onSuccess?: () => void
}) {
  const methods = useForm<WorkoutTemplateValues>({
    resolver: zodResolver(workoutTemplateSchema),
    mode: 'onChange',
    defaultValues: { name: '', duration_days: 7, description: '' },
  })
  const { handleSubmit, reset } = methods
  const { enqueueSnackbar } = useSnackbarManager()

  useEffect(() => {
    if (!isOpen) return
    reset({
      name: rowData?.name || '',
      duration_days: Number(rowData?.duration_days || 7),
      description: rowData?.description || '',
    })
  }, [isOpen, rowData, reset])

  const submit = async (values: WorkoutTemplateValues) => {
    const rawName = values.name || ''
    const capitalizedName = rawName.charAt(0).toUpperCase() + rawName.slice(1)
    const data = new FormData()
    data.append('workout_template[name]', capitalizedName)
    data.append('workout_template[duration_days]', String(values.duration_days))
    data.append('workout_template[description]', values.description || '')
    const response: any =
      edit && rowData?.id
        ? await updateWorkoutTemplate({ id: rowData.id, data })
        : await createWorkoutTemplate(data)
    enqueueSnackbar(
      response?.message ||
        (edit
          ? 'Workout template updated successfully'
          : 'Workout template created successfully'),
      { variant: 'success' }
    )
    onSuccess?.()
    handleClose()
  }

  const fields: any[] = [
    {
      name: 'name',
      label: 'Name',
      type: 'text',
      placeholder: 'Enter template name',
      required: true,
    },
    {
      name: 'duration_days',
      label: 'Duration (Days)',
      type: 'number',
      placeholder: 'Enter duration in days',
      required: true,
    },
    {
      name: 'description',
      label: 'Guideline Content',
      type: 'textarea',
      placeholder: 'Enter guideline content',
    },
  ]

  return (
    <DialogModal
      isOpen={isOpen}
      onClose={handleClose}
      title={edit ? 'Edit Workout Template' : 'Create Workout Template'}
      actionLabel={edit ? 'Update' : 'Create'}
      onSubmit={handleSubmit(submit)}
      secondaryAction={handleClose}
      secondaryActionLabel="Cancel"
      small={false}
      className="w-[90vw] max-w-[1000px]"
      body={
        <FormProvider {...methods}>
          <FormBuilder data={fields} edit={true} spacing />
        </FormProvider>
      }
    />
  )
}
