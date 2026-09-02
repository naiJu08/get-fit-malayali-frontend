import { zodResolver } from '@hookform/resolvers/zod'
import { FormProvider, useForm } from 'react-hook-form'
import { DialogModal } from '../../../components/common'
import FormBuilder from '../../../components/app/formBuilder'
import { useSnackbarManager } from '../../../components/common/snackbar'
import { useEffect, useState } from 'react'
import { getErrorMessage } from '../../../utilities/parsers'
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
  const [submitting, setSubmitting] = useState(false)
  const methods = useForm<WorkoutTemplateValues>({
    resolver: zodResolver(workoutTemplateSchema),
    mode: 'onChange',
    defaultValues: {
      name: '',
      description: '',
      intensity_level: '',
      duration_days: 7,
      notes: '',
    },
  })
  const { handleSubmit, reset } = methods
  const { enqueueSnackbar } = useSnackbarManager()

  useEffect(() => {
    if (!isOpen) return
    reset({
      name: rowData?.name || '',
      description: rowData?.description || '',
      intensity_level: rowData?.intensity_level || '',
      duration_days: Number(rowData?.duration_days || 7),
      notes: rowData?.notes || '',
    })
  }, [isOpen, rowData, reset])

  const submit = async (values: WorkoutTemplateValues) => {
    try {
      setSubmitting(true)
      const rawName = String(values.name || '').trim()
      const capitalizedName = rawName.charAt(0).toUpperCase() + rawName.slice(1)
      const data = new FormData()
      data.append('workout_template[name]', capitalizedName)
      data.append('workout_template[description]', values.description)
      data.append('workout_template[intensity_level]', values.intensity_level)
      data.append(
        'workout_template[duration_days]',
        String(values.duration_days)
      )
      data.append('workout_template[notes]', values.notes || '')
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
    } catch (err: any) {
      const serverError =
        err?.response?.data?.errors ??
        err?.response?.data?.detail ??
        err?.response?.data?.message ??
        err?.response?.error ??
        err
      enqueueSnackbar(getErrorMessage(serverError), { variant: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  const fields: any[] = [
    {
      name: 'name',
      label: 'Template Name',
      type: 'text',
      placeholder: 'Enter template name',
      maxLength: 100,
      required: true,
    },
    {
      name: 'description',
      label: 'Description',
      type: 'textarea',
      placeholder: 'Enter template description',
      maxLength: 500,
      required: true,
    },
    {
      name: 'intensity_level',
      label: 'Intensity Level',
      id: 'intensity_level',
      type: 'custom_select',
      placeholder: 'Select intensity level',
      desc: 'name',
      descId: 'id',
      required: true,
      data: [
        { id: 'Low', name: 'Low' },
        { id: 'Moderate', name: 'Moderate' },
        { id: 'High', name: 'High' },
      ],
    },
    {
      name: 'duration_days',
      label: 'Days',
      type: 'number',
      placeholder: 'Enter number of days',
      required: true,
    },
    {
      name: 'notes',
      label: 'Notes (Optional)',
      type: 'textarea',
      placeholder: 'Enter additional notes',
      maxLength: 500,
    },
  ]

  return (
    <DialogModal
      isOpen={isOpen}
      onClose={handleClose}
      title={edit ? 'Edit Workout Template' : 'Create Workout Template'}
      actionLabel={edit ? 'Update' : 'Create'}
      actionLoader={submitting}
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
