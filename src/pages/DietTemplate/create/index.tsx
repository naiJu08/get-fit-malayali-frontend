import { zodResolver } from '@hookform/resolvers/zod'
import moment from 'moment'
// import moment from 'moment'
import { useEffect, useState } from 'react'
import { DefaultValues, FormProvider, useForm } from 'react-hook-form'

import InfoBox from '../../../components/app/alertBox/infoBox'
import FormBuilder from '../../../components/app/formBuilder'
import { DialogModal } from '../../../components/common'
import CustomeSideViewer from '../../../components/common/drawer/customeSideViewer'
import { humanizeDatetime } from '../../../utilities/format'
import { useCreateTemplate, useUpdateTemplate } from '../api'
import { TemplateSchema, editFormSchema, formSchema } from './schema'

const defaultFormValues: DefaultValues<TemplateSchema> = {
  name: '',
  description: '',
  duration_days: undefined,
  thumbnail: undefined,
}

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
  const [deleteModal, setDeleteModal] = useState(false)

  const decodeFileName = (input?: string) => {
    const raw = String(input ?? '')
    const fallback = raw.split('/').pop() || raw
    try {
      return decodeURIComponent(fallback)
    } catch {
      return fallback
    }
  }
  const handleDeleteFile = () => {
    console.log('handle delete')
  }

  const existingThumbnailFile = rowData?.thumbnail_url
    ? {
        name: decodeFileName(rowData.thumbnail_url),
        link: rowData.thumbnail_url,
      }
    : undefined

  const methods = useForm<TemplateSchema>({
    resolver: zodResolver(edit ? editFormSchema : formSchema),
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: defaultFormValues,
  })
  const { handleSubmit, setValue } = methods

  const parseDurationDays = (value: unknown) => {
    if (value === null || value === undefined || value === '') return undefined
    const numeric = Number(value)
    return Number.isNaN(numeric) ? undefined : numeric
  }

  useEffect(() => {
    if (!isDrawerOpen || viewMode) return

    if (edit && rowData) {
      methods.reset({
        ...defaultFormValues,
        name: rowData?.name ?? '',
        description: rowData?.description ?? '',
        duration_days: parseDurationDays(rowData?.duration_days),
      })
      return
    }

    methods.reset(defaultFormValues)
  }, [edit, isDrawerOpen, methods, rowData, viewMode])

  const formBuilderProps = [
    { ...textField('name', 'Name', 'Enter name', true) },
    {
      ...textField('duration_days', 'Duration (Days)', 'Enter duration', true),
    },
    {
      name: 'description',
      label: 'Description',
      id: 'description',
      type: 'textarea',
      placeholder: 'Enter description',
      required: true,
    },
    {
      name: 'thumbnail',
      label: 'Thumbnail',
      id: 'thumbnail',
      type: 'file_upload',
      placeholder: 'Upload thumbnail image',
      required: false,
      accept: 'image/*',
      supportedExtensions: [
        'image/png',
        'image/jpeg',
        'image/jpg',
        'image/webp',
      ],
      acceptedFiles: 'PNG, JPG, JPEG, WEBP',
      fileSize: 5,
      selectedFiles: existingThumbnailFile,
      subName: 'thumbnail',
    },
  ]

  const handleClearAndClose = () => {
    methods.reset(defaultFormValues)
    handleClose()
  }

  const handleSubmission = () => {
    handleRefresh?.()
    handleClearAndClose()
  }
  const onSuccess = () => {
    handleSubmission()
  }
  const { mutate, isLoading: isCreating } = useCreateTemplate(onSuccess)
  const { mutate: updateMutation, isLoading: isUpdating } =
    useUpdateTemplate(onSuccess)
  const onSubmit = async (details: any) => {
    const fd = new FormData()
    fd.append('diet_plan_template[name]', details?.name ?? '')
    fd.append('diet_plan_template[description]', details?.description ?? '')
    fd.append('diet_plan_template[duration_days]', details?.duration_days ?? '')
    if (details?.thumbnail instanceof File) {
      fd.append('diet_plan_template[thumbnail]', details.thumbnail)
    }
    if (rowData?.id) {
      updateMutation({ id: rowData?.id, data: fd })
    } else {
      mutate(fd)
    }
    setValue(
      'duration_days',
      undefined as unknown as TemplateSchema['duration_days'],
      {
        shouldDirty: false,
        shouldValidate: false,
        shouldTouch: false,
      }
    )
  }

  const viewHeaderData = {
    image: rowData?.user?.profile_image,
    title: `${rowData?.user?.first_name} ${rowData?.user?.last_name} `,
    subTitle: rowData?.user?.job_title,
    // status: rowData?.user?.status,
  }

  const viewContentData = [
    {
      title: 'Communications',
      divide: true,
      value: [
        {
          label: 'email',
          icon: 'email',
          value: rowData?.user?.username,
        },
      ],
    },
    {
      title: 'Job Role',
      value: rowData?.user?.group?.name,
    },
    {
      title: 'Last Login',
      value: humanizeDatetime(rowData?.user?.last_login),
    },
    {
      title: 'Created At',
      value: rowData?.user?.datetime_created
        ? moment(new Date(rowData?.user?.datetime_created)).format(
            'DD-MM-YYYY h:mm a'
          )
        : '- -',
    },
    {
      title: 'Updated At',
      value: rowData?.user?.datetime_updated
        ? moment(new Date(rowData?.user?.datetime_updated)).format(
            'DD-MM-YYYY h:mm a'
          )
        : '- -',
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
        isOpen={deleteModal}
        onClose={() => setDeleteModal(false)}
        title={'Delete File'}
        onSubmit={() => handleDeleteFile()}
        secondaryAction={() => setDeleteModal(false)}
        secondaryActionLabel="No, Cancel"
        actionLabel="Yes, I am"
        body={
          <InfoBox content={'Are you sure you want to delete this file ?'} />
        }
      />
      <DialogModal
        isOpen={isDrawerOpen}
        onClose={() => handleClearAndClose()}
        title={
          edit
            ? 'Edit Template'
            : viewMode
              ? 'Template Details'
              : 'Create Template'
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
                  <FormBuilder data={formBuilderProps} edit={true} spacing />
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
