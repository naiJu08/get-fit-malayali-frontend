import { FormProvider, useForm } from 'react-hook-form'
import { useEffect } from 'react'
import { DialogModal } from '../../components/common'
import FormBuilder from '../../components/app/formBuilder'
import { useSnackbarManager } from '../../components/common/snackbar'
import { updateWorkoutTemplateDay } from './api'

type DayValues = { title: string; description: string }

export default function WorkoutTemplateDayForm({
  isOpen,
  handleClose,
  rowData,
  onSuccess,
}: {
  isOpen: boolean
  handleClose: () => void
  rowData?: any
  onSuccess?: () => void
}) {
  const methods = useForm<DayValues>({
    mode: 'onChange',
    defaultValues: { title: '', description: '' },
  })
  const { handleSubmit, reset } = methods
  const { enqueueSnackbar } = useSnackbarManager()

  useEffect(() => {
    if (isOpen) {
      reset({
        title: rowData?.title || `Day ${rowData?.day_number || ''}`,
        description: rowData?.description || '',
      })
    }
  }, [isOpen, rowData, reset])

  const submit = async (values: DayValues) => {
    const data = new FormData()
    data.append('workout_template_day[title]', values.title)
    data.append('workout_template_day[description]', values.description || '')
    const response: any = await updateWorkoutTemplateDay({
      id: rowData.id,
      data,
    })
    enqueueSnackbar(
      response?.message || 'Workout template day updated successfully',
      { variant: 'success' }
    )
    onSuccess?.()
    handleClose()
  }

  const fields: any[] = [
    {
      name: 'title',
      label: 'Title',
      type: 'text',
      placeholder: 'Enter day title',
      required: true,
    },
    {
      name: 'description',
      label: 'Description',
      type: 'textarea',
      placeholder: 'Enter day description',
    },
  ]

  return (
    <DialogModal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Edit Day ${rowData?.day_number || ''}`}
      actionLabel="Update"
      onSubmit={handleSubmit(submit)}
      secondaryAction={handleClose}
      secondaryActionLabel="Cancel"
      small={false}
      className="w-[90vw] max-w-[800px]"
      body={
        <FormProvider {...methods}>
          <FormBuilder data={fields} edit={true} spacing />
        </FormProvider>
      }
    />
  )
}
