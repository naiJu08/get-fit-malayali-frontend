import { zodResolver } from '@hookform/resolvers/zod'
import { FormProvider, useForm } from 'react-hook-form'
import { DialogModal } from '../../../components/common'
import FormBuilder from '../../../components/app/formBuilder'
import { useSnackbarManager } from '../../../components/common/snackbar'
import { useEffect } from 'react'
import { createYogaTemplate, updateYogaTemplate } from '../api'
import {
  yogaTemplateSchema,
  YogaTemplateForm as YogaTemplateValues,
} from './schema'

export default function YogaTemplateForm({
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
  const methods = useForm<YogaTemplateValues>({
    resolver: zodResolver(yogaTemplateSchema),
    mode: 'onChange',
    defaultValues: {
      name: '',
      description: '',
      intensity_level: 'Moderate',
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
      intensity_level: rowData?.intensity_level || 'Moderate',
      duration_days: Number(rowData?.duration_days || 7),
      notes: rowData?.notes || '',
    })
  }, [isOpen, rowData, reset])

  const submit = async (values: YogaTemplateValues) => {
    const rawName = values.name || ''
    const capitalizedName = rawName.charAt(0).toUpperCase() + rawName.slice(1)
    const data = new FormData()
    data.append('yoga_template[name]', capitalizedName)
    data.append('yoga_template[description]', values.description)
    data.append('yoga_template[intensity_level]', values.intensity_level)
    data.append('yoga_template[duration_days]', String(values.duration_days))
    data.append('yoga_template[notes]', values.notes || '')
    const response: any =
      edit && rowData?.id
        ? await updateYogaTemplate({ id: rowData.id, data })
        : await createYogaTemplate(data)
    enqueueSnackbar(
      response?.message ||
        (edit
          ? 'Yoga template updated successfully'
          : 'Yoga template created successfully'),
      { variant: 'success' }
    )
    onSuccess?.()
    handleClose()
  }

  const fields: any[] = [
    {
      name: 'name',
      label: 'Template Name',
      type: 'text',
      placeholder: 'Enter template name',
      required: true,
    },
    {
      name: 'description',
      label: 'Description',
      type: 'textarea',
      placeholder: 'Enter template description',
      required: true,
    },
    {
      name: 'intensity_level',
      label: 'Intensity Level',
      type: 'custom_select',
      placeholder: 'Select intensity level',
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
      placeholder: 'Add any notes for this template',
    },
  ]

  return (
    <DialogModal
      isOpen={isOpen}
      onClose={handleClose}
      title={edit ? 'Edit Yoga Template' : 'Create Yoga Template'}
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
