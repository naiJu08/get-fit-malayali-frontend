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

  const submit = async (values: YogaTemplateValues) => {
    const data = new FormData()
    data.append('yoga_template[name]', values.name)
    data.append('yoga_template[duration_days]', String(values.duration_days))
    data.append('yoga_template[description]', values.description || '')
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
