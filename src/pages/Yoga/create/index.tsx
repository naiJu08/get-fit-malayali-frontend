import { zodResolver } from '@hookform/resolvers/zod'
import moment from 'moment'
// import moment from 'moment'
import { useEffect, useMemo, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
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
  const formatVideoDurationLabel = (durationMs: number | null) => {
    if (durationMs === null) return ''
    const totalSeconds = Math.max(0, Math.floor(durationMs / 1000))
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    const paddedSeconds = seconds.toString().padStart(2, '0')
    return `${minutes}.${paddedSeconds}`
  }

  const parseDurationMinutesToMs = (value?: string | number | null) => {
    if (value === null || value === undefined) return null
    const strValue = String(value)
    const parts = strValue.split('.')
    const minutes = parseInt(parts[0] || '0', 10)
    const seconds = parseInt(parts[1] || '0', 10)
    if (Number.isNaN(minutes) || Number.isNaN(seconds)) return null
    return Math.max(0, (minutes * 60 + seconds) * 1000)
  }
  const [videoDurationMs, setVideoDurationMs] = useState<number | null>(null)
  // const [profileLoading, SetProfileLoading] = useState<boolean>(true)

  // useEffect(() => {
  //   const intervalId = setTimeout(() => {
  //     SetProfileLoading(false)
  //   }, 2000)

  //   return () => clearTimeout(intervalId)
  // }, [])
  const getFileName = (path?: string) => {
    if (!path) return ''

    const fileName = path.split('/').pop() || ''
    return decodeURIComponent(fileName).replace(/%/g, '')
  }
  const categoryOptions = useMemo(
    () => [
      { id: 'basic', name: 'Basic' },
      { id: 'intermediate', name: 'Intermediate' },
      { id: 'advanced', name: 'Advanced' },
    ],
    []
  )

  const formBuilderProps = [
    { ...textField('name', 'Name', 'Enter yoga name', true), maxLength: 50 },
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
    {
      name: 'description',
      label: 'Description',
      id: 'description',
      type: 'textarea',
      placeholder: 'Enter description',
      required: true,
      maxlength: 250,
    },
    {
      name: 'video_file',
      label: 'Video File',
      id: 'video_file',
      type: 'file_upload',
      placeholder: 'Upload video file',
      required: true,
      accept: 'video/*',
      supportedExtensions: ['video/mp4', 'video/quicktime', 'video/x-msvideo'],
      acceptedFiles: 'MP4, MOV, AVI',
      fileSize: 5,
      selectedFiles: getFileName(rowData?.video_url),
      subName: 'video_file',
      handleDeleteFile: () => {
        methods.setValue('video_file', '')
        methods.setValue('video_url', '')
        setVideoDurationMs(null)
      },
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
        'image/jpeg',
        'image/jpg',
        'image/webp',
      ],
      acceptedFiles: 'PNG, JPG, JPEG, WEBP',
      fileSize: 5,
      selectedFiles: getFileName(rowData?.thumbnail_url),
      subName: 'thumbnail',
      handleDeleteFile: () => {
        methods.setValue('thumbnail', '')
      },
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
  const { handleSubmit, watch, setError, clearErrors } = methods

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
        video_file: getFileName(rowData?.video_url) ?? '',
        thumbnail: getFileName(rowData?.thumbnail_url) ?? '',
      } as any)
    }
  }, [isDrawerOpen, edit, viewMode, rowData, categoryOptions, methods])

  const watchedVideoFile = watch('video_file')
  useEffect(() => {
    const fallbackFromExistingDuration = () => {
      const fallbackMs = parseDurationMinutesToMs(rowData?.duration_minutes)
      setVideoDurationMs(fallbackMs)
    }

    if (!watchedVideoFile) {
      if (rowData?.video_url) {
        const videoElement = document.createElement('video')
        videoElement.preload = 'metadata'
        videoElement.crossOrigin = 'anonymous'
        videoElement.src = rowData.video_url

        const handleLoadedMetadata = () => {
          const durationSeconds = videoElement.duration
          if (!Number.isNaN(durationSeconds)) {
            setVideoDurationMs(durationSeconds * 1000)
          } else {
            fallbackFromExistingDuration()
          }
        }

        const handleError = () => {
          fallbackFromExistingDuration()
        }

        videoElement.addEventListener('loadedmetadata', handleLoadedMetadata)
        videoElement.addEventListener('error', handleError)

        return () => {
          videoElement.removeEventListener(
            'loadedmetadata',
            handleLoadedMetadata
          )
          videoElement.removeEventListener('error', handleError)
        }
      }

      fallbackFromExistingDuration()
      return
    }

    if (watchedVideoFile instanceof File) {
      const videoElement = document.createElement('video')
      videoElement.preload = 'metadata'

      const objectUrl = URL.createObjectURL(watchedVideoFile)
      videoElement.src = objectUrl

      const handleLoadedMetadata = () => {
        const durationSeconds = videoElement.duration
        if (!isNaN(durationSeconds)) {
          setVideoDurationMs(durationSeconds * 1000)
        }
        URL.revokeObjectURL(objectUrl)
      }

      const handleError = () => {
        fallbackFromExistingDuration()
        URL.revokeObjectURL(objectUrl)
      }

      videoElement.addEventListener('loadedmetadata', handleLoadedMetadata)
      videoElement.addEventListener('error', handleError)

      return () => {
        videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata)
        videoElement.removeEventListener('error', handleError)
        URL.revokeObjectURL(objectUrl)
      }
    }

    fallbackFromExistingDuration()
  }, [watchedVideoFile, rowData?.video_url, rowData?.duration_minutes])

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
    const originalVideoName = getFileName(rowData?.video_url)
    const currentVideoName = details?.video_file

    const hasNewVideoFile = currentVideoName instanceof File
    const hasExistingVideoUrl =
      typeof currentVideoName === 'string' && currentVideoName !== ''

    const videoRemoved = currentVideoName === ''
    const videoUnchanged =
      typeof currentVideoName === 'string' &&
      currentVideoName === originalVideoName

    // If user deleted video
    if (videoRemoved) {
      setError('video_file', { type: 'manual', message: 'Video is required.' })
      return
    }

    clearErrors('video_file')

    // ✅ Append only if changed

    const fd = new FormData()
    fd.append('yoga[name]', details?.name ?? '')
    fd.append('yoga[description]', details?.description ?? '')
    fd.append('yoga[intensity_level]', details?.intensity_level ?? '')
    fd.append('yoga[category]', extractSelectValue(details?.category))
    // fd.append('yoga[video_url]', details?.video_url ?? '')
    // CASE 1: user uploaded new video
    if (!videoUnchanged) {
      if (hasNewVideoFile) {
        fd.append('video', currentVideoName)
      } else if (hasExistingVideoUrl) {
        fd.append('yoga[video_url]', currentVideoName)
      }
    }

    // Thumbnail handling
    const thumbVal = details?.thumbnail

    // CASE 1: New thumbnail uploaded
    if (thumbVal instanceof File) {
      fd.append('yoga[thumbnail]', thumbVal)
    }

    // CASE 2: Thumbnail manually removed
    else if (thumbVal === '') {
      fd.append('yoga[thumbnail]', null as any)
    }

    // Duration
    if (videoDurationMs !== null) {
      const totalSeconds = Math.max(0, Math.floor(videoDurationMs / 1000))
      const minutes = Math.floor(totalSeconds / 60)
      const seconds = totalSeconds % 60
      const paddedSeconds = seconds.toString().padStart(2, '0')
      fd.append('yoga[duration_minutes]', `${minutes}.${paddedSeconds}`)
    }

    if (rowData?.id) {
      updateMutation({ id: rowData.id, data: fd })
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
              <>
                <FormProvider {...methods}>
                  <FormBuilder data={formBuilderProps} edit={true} spacing />
                </FormProvider>

                {videoDurationMs !== null &&
                  (watchedVideoFile instanceof File ||
                    (typeof watchedVideoFile === 'string' &&
                      watchedVideoFile !== '')) && (
                    <div className="text-sm text-primaryText">
                      {`Video duration: ${formatVideoDurationLabel(videoDurationMs)}`}
                    </div>
                  )}
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
