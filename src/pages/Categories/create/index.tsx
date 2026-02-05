import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { FormProvider, useForm } from 'react-hook-form'

import FormBuilder from '../../../components/app/formBuilder'
import { DialogModal } from '../../../components/common'
import CustomeSideViewer from '../../../components/common/drawer/customeSideViewer'
import { useCreateCategories, useUpdateCategories } from '../api'
import { CategorySchema, formSchema } from './schema'

type Props = {
  isDrawerOpen: boolean
  disabled?: boolean
  handleClose: () => void
  handleRefresh?: () => void
  paramsId?: any
  handleCallback?: () => void
  model_name?: string
  rowData?: any
  isOwnTask?: boolean
  isGeneral?: boolean
  viewMode?: boolean
  setViewMode?: (value: boolean) => void
  edit?: boolean
  hasPermission?: boolean
  setEdit?: (value: boolean) => void
  subSection?: boolean
  setEditViewIndicator?: (value: boolean) => void
  editViewIndicator?: boolean
}

export default function CreateAdmin({
  isDrawerOpen,
  handleClose,
  handleRefresh,
  edit,
  viewMode,
  setViewMode,
  setEdit,
  rowData,
  setEditViewIndicator,
}: Props) {
  const textField = (
    name: string,
    label: string,
    placeholder: string,
    required = false,
    disabled = false
  ) => ({
    name,
    label,
    id: name,
    type: 'text',
    placeholder,
    ...(required ? { required: true } : {}),
    ...(disabled ? { disabled: true } : {}),
  })
  const formBuilderProps = [
    {
      ...textField('name', 'Name', 'Enter category name', true),
      maxLength: 50,
    },
    {
      name: 'description',
      label: 'Description',
      id: 'description',
      type: 'textarea',
      placeholder: 'Enter description',
      required: true,
      maxLength: 255,
    },
  ]

  // const getAdminDetails = (name: any) => {
  //   const property = formBuilderProps.find((prop) => prop.name === name)
  //   // return property ? property.value : '--'
  //   return property && property.value ? property.value : '--'
  // }

  const handleClearAndClose = () => {
    methods.reset({
      name: '',
      description: '',
    } as any)
    handleClose()
  }

  const handleSubmission = () => {
    methods.reset({
      name: '',
      description: '',
    } as any)

    handleRefresh?.()
    handleClearAndClose()
  }
  useEffect(() => {
    if (isDrawerOpen && edit && !viewMode && rowData) {
      methods.reset({
        name: rowData?.name ?? '',
        description: rowData?.description ?? '',
      } as any)
    }
  }, [isDrawerOpen, edit, viewMode, rowData])
  const onSuccess = () => {
    handleSubmission()
  }
  const { mutate, isLoading: isCreating } = useCreateCategories(onSuccess)
  const { mutate: updateMutation, isLoading: isUpdating } =
    useUpdateCategories(onSuccess)

  const methods = useForm<CategorySchema>({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
    reValidateMode: 'onChange',
  })
  const { handleSubmit } = methods

  const onSubmit = (details: CategorySchema) => {
    const payload = {
      category: {
        name: details?.name ?? '',
        description: details?.description ?? '',
      },
    }

    if (rowData?.id) {
      updateMutation({ id: rowData.id, data: payload })
    } else {
      mutate(payload)
    }
  }

  const viewHeaderData = {
    title: rowData?.name ?? 'Category Details',
    subTitle: rowData?.description ? 'Category' : undefined,
  }

  const viewContentData = [
    {
      title: 'Name',
      value: rowData?.name ?? '-',
    },
    {
      title: 'Description',
      value: rowData?.description ?? '-',
    },
  ]

  const handleChangeMode = () => {
    setViewMode?.(false)
    setEdit?.(true)
    setEditViewIndicator?.(true)
  }

  return (
    <>
      <DialogModal
        isOpen={isDrawerOpen}
        onClose={() => handleClearAndClose()}
        title={
          edit
            ? 'Edit Category'
            : viewMode
              ? 'Category Details'
              : 'Create Category'
        }
        actionLabel={viewMode ? 'Edit' : 'Save'}
        actionLoader={isCreating || isUpdating}
        onSubmit={
          viewMode ? handleChangeMode : handleSubmit((data) => onSubmit(data))
        }
        secondaryAction={() => handleClearAndClose()}
        secondaryActionLabel="Cancel"
        small={false}
        body={
          <div className="flex flex-col gap-4">
            {!viewMode ? (
              <>
                <FormProvider {...methods}>
                  <div className="flex flex-col gap-4">
                    <FormBuilder data={formBuilderProps} edit={true} />
                  </div>
                </FormProvider>
              </>
            ) : (
              <CustomeSideViewer
                headerData={viewHeaderData}
                contentData={viewContentData}
              />
            )}
          </div>
        }
      />
    </>
  )
}
