import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { FormProvider, useForm } from 'react-hook-form'

import FormBuilder from '../../../../../components/app/formBuilder'
import { DialogModal } from '../../../../../components/common'
import {
  //   createYogaPlan,
  //   updateYogaPlan,
  useCreateYogaPlan,
  useUpdateYogaPlan,
} from '../api'
import { YogaPlanSchema, yogaPlanFormSchema } from './schema'

type Props = {
  isOpen: boolean
  handleClose: () => void
  edit?: boolean
  rowData?: any
  planId?: string | number
}

export default function YogaPlanForm({
  isOpen,
  handleClose,
  edit,
  rowData,
  planId,
}: Props) {
  const methods = useForm<YogaPlanSchema>({
    resolver: zodResolver(yogaPlanFormSchema),
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: {
      plan_id: Number(planId ?? rowData?.plan_id ?? 0),
      day_number: Number(rowData?.day_number ?? 1),
      sequence_number: Number(rowData?.sequence_number ?? 1),
      title: rowData?.title ?? '',
      description: rowData?.description ?? '',
      duration_minutes: Number(rowData?.duration_minutes ?? 0),
    },
  })

  const { handleSubmit, reset } = methods
  const { mutate: createMutate, isLoading: creating } = useCreateYogaPlan()
  const { mutate: updateMutate, isLoading: updating } = useUpdateYogaPlan()

  useEffect(() => {
    if (isOpen) {
      reset({
        plan_id: Number(planId ?? rowData?.plan_id ?? 0),
        day_number: Number(rowData?.day_number ?? 1),
        sequence_number: Number(rowData?.sequence_number ?? 1),
        title: rowData?.title ?? '',
        description: rowData?.description ?? '',
        duration_minutes: Number(rowData?.duration_minutes ?? 0),
      })
    }
  }, [isOpen, planId, rowData, reset])

  const onSubmit = (values: YogaPlanSchema) => {
    const payload = {
      yoga_plan: {
        plan_id: Number(values.plan_id ?? planId),
        day_number: Number(values.day_number),
        sequence_number: Number(values.sequence_number),
        title: values.title,
        description: values.description || '',
        duration_minutes: Number(values.duration_minutes ?? 0),
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
    {
      name: 'duration_minutes',
      label: 'Duration (minutes)',
      type: 'text',
      placeholder: 'Enter duration in minutes',
    },
  ]

  return (
    <DialogModal
      isOpen={isOpen}
      onClose={handleClose}
      title={edit ? 'Edit Yoga Plan' : 'Create Yoga Plan'}
      actionLabel={edit ? 'Update' : 'Create'}
      actionLoader={creating || updating}
      onSubmit={handleSubmit(onSubmit)}
      secondaryAction={handleClose}
      secondaryActionLabel="Cancel"
      small={false}
      body={
        <FormProvider {...methods}>
          <FormBuilder data={formFields} edit={true} spacing />
        </FormProvider>
      }
    />
  )
}
