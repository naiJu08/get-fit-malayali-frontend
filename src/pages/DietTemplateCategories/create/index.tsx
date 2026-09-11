import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { FormProvider, useForm } from 'react-hook-form'

import FormBuilder from '../../../components/app/formBuilder'
import { DialogModal } from '../../../components/common'
import {
  useCreateDietTemplateCategory,
  useUpdateDietTemplateCategory,
} from '../api'
import {
  DietTemplateCategorySchema,
  dietTemplateCategoryFormSchema,
} from './schema'

type Props = {
  isDrawerOpen: boolean
  handleClose: () => void
  edit?: boolean
  rowData?: any
}

const toTitleCase = (value?: string | null) => {
  if (!value) return ''
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase()
}

const normalizeStatus = (rowData: any) => {
  if (rowData?.active === true) return 'Active'
  if (rowData?.active === false) return 'Inactive'
  return String(rowData?.status ?? 'active').toLowerCase() === 'inactive'
    ? 'Inactive'
    : 'Active'
}

export default function CreateDietTemplateCategory({
  isDrawerOpen,
  handleClose,
  edit,
  rowData,
}: Props) {
  const methods = useForm<DietTemplateCategorySchema>({
    resolver: zodResolver(dietTemplateCategoryFormSchema),
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: {
      name: '',
      status: 'Active',
    },
  })
  const { handleSubmit, reset, setError } = methods

  const createMutation = useCreateDietTemplateCategory()
  const updateMutation = useUpdateDietTemplateCategory()

  const handleClearAndClose = () => {
    reset({
      name: '',
      status: 'Active',
    })
    handleClose()
  }

  useEffect(() => {
    if (isDrawerOpen && edit && rowData) {
      reset({
        name: toTitleCase(rowData?.name),
        status: normalizeStatus(rowData),
      })
    } else if (isDrawerOpen && !edit) {
      reset({
        name: '',
        status: 'Active',
      })
    }
  }, [isDrawerOpen, edit, rowData, reset])

  const handleServerNameError = (error: any) => {
    const nameError = error?.response?.data?.errors?.find?.((err: string) =>
      err.toLowerCase().includes('name')
    )
    if (nameError) {
      setError('name', {
        type: 'server',
        message: nameError,
      })
    }
  }

  const onSubmit = (values: DietTemplateCategorySchema) => {
    const payload = {
      diet_template_category: {
        name: toTitleCase(values.name.trim()),
        status: values.status.toLowerCase(),
      },
    }

    if (edit && rowData?.id) {
      updateMutation.mutate(
        { id: rowData.id, payload },
        {
          onSuccess: () => {
            handleClearAndClose()
          },
          onError: handleServerNameError,
        }
      )
      return
    }

    createMutation.mutate(payload, {
      onSuccess: () => {
        handleClearAndClose()
      },
      onError: handleServerNameError,
    })
  }

  const formFields = [
    {
      name: 'name',
      label: 'Name',
      id: 'name',
      type: 'text',
      placeholder: 'Enter diet plan category name',
      required: true,
      maxLength: 50,
    },
    {
      name: 'status',
      label: 'Status',
      id: 'status',
      type: 'custom_select',
      placeholder: 'Select status',
      required: true,
      desc: 'name',
      descId: 'id',
      data: [
        { id: 'Active', name: 'Active' },
        { id: 'Inactive', name: 'Inactive' },
      ],
    },
  ]

  return (
    <DialogModal
      isOpen={isDrawerOpen}
      onClose={handleClearAndClose}
      title={edit ? 'Edit Diet Plan Category' : 'Create Diet Plan Category'}
      actionLabel="Save"
      actionLoader={createMutation.isLoading || updateMutation.isLoading}
      onSubmit={handleSubmit(onSubmit)}
      secondaryAction={handleClearAndClose}
      secondaryActionLabel="Cancel"
      small={false}
      body={
        <FormProvider {...methods}>
          <FormBuilder data={formFields} edit />
        </FormProvider>
      }
    />
  )
}
