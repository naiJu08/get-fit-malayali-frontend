import { zodResolver } from '@hookform/resolvers/zod'
import moment from 'moment'
// import moment from 'moment'
import { useEffect, useMemo, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'

import InfoBox from '../../../components/app/alertBox/infoBox'
import FormBuilder from '../../../components/app/formBuilder'
import { DialogModal } from '../../../components/common'
import CustomeSideViewer from '../../../components/common/drawer/customeSideViewer'
import { humanizeDatetime } from '../../../utilities/format'
// import { getRoles, useCreateAdmin, useUpdateAdmin } from '../../organisation/common/commonUtils'
// import FormFieldView from '../../../components/common/inputs/FormFieldView'
import { useCreateYoga, useUpdateYoga } from '../api'
import { YogaSchema, formSchema } from './schema'

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
  const getReadableFileName = (value?: string) => {
    if (!value) {
      return ''
    }
    const segments = String(value).split('/')
    const rawName = segments[segments.length - 1] || String(value)
    const sanitizedName = rawName.split('?')[0].split('#')[0]
    try {
      return decodeURIComponent(sanitizedName)
    } catch {
      return sanitizedName
    }
  }
  const formatVideoDurationLabel = (durationMs: number | null) => {
    if (durationMs === null) return ''
    const minutes = durationMs / 60000
    const formatted = minutes.toFixed(2)
    return `Duration: ${formatted} min`
  }
  const [deleteModal, setDeleteModal] = useState(false)
  const [videoDurationMs, setVideoDurationMs] = useState<number | null>(null)
  // const [profileLoading, SetProfileLoading] = useState<boolean>(true)

  // useEffect(() => {
  //   const intervalId = setTimeout(() => {
  //     SetProfileLoading(false)
  //   }, 2000)

  //   return () => clearTimeout(intervalId)
  // }, [])

  const handleDeleteFile = () => {
    console.log('handle delete')
    // deleteAssessorImage(rowData?.user?.id)
    //   .then((res: any) => {
    //     enqueueSnackbar(res.message ? res.message : 'Deleted Successfully', {
    //       variant: 'success',
    //     })
    //     handleRefresh?.()
    //     setDeleteModal(false)
    //   })
    //   .catch((err: any) => {
    //     enqueueSnackbar(
    //       err?.response?.data?.error?.message || err?.response?.data?.message,
    //       { variant: 'error' }
    //     )
    //   })
  }
  const existingVideoFile = rowData?.video_url
    ? {
        name: getReadableFileName(rowData.video_url),
        link: rowData.video_url,
      }
    : undefined

  const existingThumbnailFile = rowData?.thumbnail_url
    ? {
        name: getReadableFileName(rowData.thumbnail_url),
        link: rowData.thumbnail_url,
      }
    : undefined

  const categoryOptions = useMemo(
    () => [
      { id: 'basic', name: 'Basic' },
      { id: 'intermediate', name: 'Intermediate' },
      { id: 'advanced', name: 'Advanced' },
    ],
    []
  )

  const formBuilderProps = [
    { ...textField('name', 'Name', 'Enter yoga name', true) },
    {
      name: 'intensity_level',
      label: 'Intensity Level',
      id: 'intensity_level',
      type: 'custom_select',
      placeholder: 'Select intensity',
      desc: 'name',
      descId: 'id',
      required: true,
      data: [
        { id: 'Low', name: 'Low' },
        { id: 'High', name: 'High' },
        { id: 'Moderate', name: 'Moderate' },
      ],
    },
    {
      name: 'category',
      label: 'Category',
      id: 'category',
      type: 'custom_select',
      placeholder: 'Select category',
      desc: 'name',
      descId: 'id',
      required: true,
      data: categoryOptions,
    },
    // { ...textField('video_url', 'Video URL', 'https://...', true) },
    {
      name: 'video_file',
      label: 'Video File',
      labelAddon: videoDurationMs
        ? formatVideoDurationLabel(videoDurationMs)
        : '',
      id: 'video_file',
      type: 'file_upload',
      placeholder: 'Upload video file',
      required: true,
      accept: 'video/*',
      supportedExtensions: ['video/mp4', 'video/quicktime', 'video/x-msvideo'],
      acceptedFiles: 'MP4, MOV, AVI (Max 5 MB)',
      fileSize: 5,
      selectedFiles: existingVideoFile,
    },
    {
      name: 'thumbnail',
      label: 'Thumbnail',
      id: 'thumbnail',
      type: 'file_upload',
      placeholder: 'Upload thumbnail image',
      accept: 'image/*',
      supportedExtensions: [
        'image/png',
        'image/jpg',
        'image/jpeg',
        'image/webp',
      ],
      acceptedFiles: 'PNG, JPG, JPEG, WEBP',
      fileSize: 5,
      selectedFiles: existingThumbnailFile,
      subName: 'thumbnail',
    },
    {
      name: 'description',
      label: 'Description',
      id: 'description',
      type: 'textarea',
      placeholder: 'Enter description',
      required: true,
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
      intensity_level: '',
      category: '',
      video_url: '',
      video_file: '',
      thumbnail: '',
    } as any)
    setVideoDurationMs(null)
    handleClose()
  }

  const handleSubmission = () => {
    methods.reset({
      name: '',
      description: '',
      intensity_level: '',
      category: '',
      video_url: '',
      video_file: '',
      thumbnail: '',
    } as any)

    setVideoDurationMs(null)
    handleRefresh?.()
    handleClearAndClose()
  }
  useEffect(() => {
    if (isDrawerOpen && edit && !viewMode && rowData) {
      const normalizedCategory =
        typeof rowData?.category === 'string'
          ? rowData.category.toLowerCase()
          : ''
      const matchedCategory =
        categoryOptions.find((opt) => opt.id === normalizedCategory) ?? null
      methods.reset({
        name: rowData?.name ?? '',
        description: rowData?.description ?? '',
        intensity_level: rowData?.intensity_level ?? '',
        category: matchedCategory?.name ?? '',
        video_url: rowData?.video_url ?? '',
        video_file: existingVideoFile ?? '',
        thumbnail: existingThumbnailFile ?? '',
      } as any)
    }
  }, [isDrawerOpen, edit, viewMode, rowData])
  const onSuccess = () => {
    handleSubmission()
  }
  const { mutate, isLoading: isCreating } = useCreateYoga(onSuccess)
  const { mutate: updateMutation, isLoading: isUpdating } =
    useUpdateYoga(onSuccess)

  const methods = useForm<YogaSchema>({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
    reValidateMode: 'onChange',
  })
  const { handleSubmit, watch } = methods

  const watchedVideoFile = watch('video_file')

  useEffect(() => {
    const fallbackDurationMs =
      edit && !viewMode && typeof rowData?.duration_minutes === 'number'
        ? rowData.duration_minutes * 60000
        : null

    if (!watchedVideoFile) {
      setVideoDurationMs(fallbackDurationMs)
      return
    }

    const videoElement = document.createElement('video')
    videoElement.preload = 'metadata'
    let objectUrl: string | null = null

    const clearObjectUrl = () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl)
        objectUrl = null
      }
    }

    const handleLoadedMetadata = () => {
      const durationSeconds = videoElement.duration
      if (!isNaN(durationSeconds)) {
        setVideoDurationMs(durationSeconds * 1000)
      } else {
        setVideoDurationMs(fallbackDurationMs)
      }
      clearObjectUrl()
    }

    const handleError = () => {
      setVideoDurationMs(fallbackDurationMs)
      clearObjectUrl()
    }

    videoElement.addEventListener('loadedmetadata', handleLoadedMetadata)
    videoElement.addEventListener('error', handleError)

    if (watchedVideoFile instanceof File) {
      objectUrl = URL.createObjectURL(watchedVideoFile)
      videoElement.src = objectUrl
    } else {
      const source =
        typeof watchedVideoFile === 'string'
          ? watchedVideoFile
          : (watchedVideoFile?.link ?? '')

      if (!source) {
        setVideoDurationMs(fallbackDurationMs)
        videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata)
        videoElement.removeEventListener('error', handleError)
        return
      }
      videoElement.crossOrigin = 'anonymous'
      videoElement.src = source
    }

    return () => {
      videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata)
      videoElement.removeEventListener('error', handleError)
      clearObjectUrl()
    }
  }, [watchedVideoFile, edit, viewMode, rowData?.duration_minutes])
  const isFileInstance = (input: unknown): input is File =>
    typeof File !== 'undefined' && input instanceof File

  const extractSelectValue = (val: any) => {
    if (!val) return ''
    if (typeof val === 'string') return val.toLowerCase()
    if (typeof val === 'object') {
      if (typeof val?.id === 'string') return val.id.toLowerCase()
      if (typeof val?.value === 'string') return val.value.toLowerCase()
    }
    return ''
  }

  const onSubmit = (details: any) => {
    const fd = new FormData()
    fd.append('yoga[name]', details?.name ?? '')
    fd.append('yoga[description]', details?.description ?? '')
    fd.append('yoga[intensity_level]', details?.intensity_level ?? '')
    fd.append('yoga[category]', extractSelectValue(details?.category))
    // fd.append('yoga[video_url]', details?.video_url ?? '')
    if (details?.video_file instanceof File) {
      fd.append('yoga[video_url]', details.video_file as any)
    }

    const thumbVal = details?.thumbnail
    if (isFileInstance(thumbVal)) {
      fd.append('yoga[thumbnail]', thumbVal)
    }

    if (videoDurationMs !== null) {
      const durationMinutes = videoDurationMs / 60000
      fd.append('yoga[duration_minutes]', durationMinutes.toFixed(2))
    }

    if (rowData?.id) {
      updateMutation({ id: rowData?.id, data: fd })
    } else {
      mutate(fd)
    }
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
        title={edit ? 'Edit Yoga' : viewMode ? 'Yoga Details' : 'Create Yoga'}
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
              <FormProvider {...methods}>
                <FormBuilder data={formBuilderProps} edit={true} spacing />
              </FormProvider>
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
