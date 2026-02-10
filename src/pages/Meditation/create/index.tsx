import { zodResolver } from '@hookform/resolvers/zod'
import moment from 'moment'
// import moment from 'moment'
import { useEffect, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import FormBuilder from '../../../components/app/formBuilder'
import { DialogModal } from '../../../components/common'
import CustomeSideViewer from '../../../components/common/drawer/customeSideViewer'
import { humanizeDatetime } from '../../../utilities/format'
import { useCreateMeditation, useUpdateMeditation } from '../api'
import { MeditationSchema, formSchema } from './schema'

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
  const [videoDurationMs, setVideoDurationMs] = useState<number | null>(null)

  const formatVideoDurationLabel = (durationMs: number | null) => {
    if (durationMs === null) return ''
    const totalSeconds = Math.max(0, Math.floor(durationMs / 1000))
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    const paddedSeconds = seconds.toString().padStart(2, '0')
    return `${minutes}:${paddedSeconds}`
  }

  const parseDurationMinutesToMs = (value?: string | number | null) => {
    if (value === null || value === undefined) return null
    const numeric =
      typeof value === 'number' ? value : parseFloat(String(value))
    if (Number.isNaN(numeric)) return null
    return Math.max(0, numeric) * 60000
  }

  const onSuccess = () => {
    handleSubmission()
  }
  const { mutate, isLoading: isCreating } = useCreateMeditation(onSuccess)
  const { mutate: updateMutation, isLoading: isUpdating } =
    useUpdateMeditation(onSuccess)

  const methods = useForm<MeditationSchema>({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
    reValidateMode: 'onChange',
  })
  const { handleSubmit, watch, setError, clearErrors } = methods

  const formBuilderProps = [
    {
      ...textField('title', 'Title', 'Enter meditation title', true),
      maxlength: 50,
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
      selectedFiles: rowData?.video_file,
      subName: 'video_file',
      handleDeleteFile: () => {
        methods.setValue('video_file', '')
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
      selectedFiles: rowData?.thumbnail,
      subName: 'thumbnail',
      handleDeleteFile: () => {
        methods.setValue('thumbnail', '')
      },
    },
  ]

  const handleClearAndClose = () => {
    methods.reset({
      title: '',
      description: '',
      video_file: '',
      thumbnail: '',
    } as any)
    setVideoDurationMs(null)
    handleClose()
  }

  const handleSubmission = () => {
    methods.reset({
      title: '',
      description: '',
      video_file: '',
      thumbnail: '',
    } as any)

    setVideoDurationMs(null)
    handleRefresh?.()
    handleClearAndClose()
  }
  useEffect(() => {
    if (isDrawerOpen && edit && !viewMode && rowData) {
      methods.reset({
        title: rowData?.title ?? '',
        description: rowData?.description ?? '',
        video_file: rowData?.video_url ?? '',
        thumbnail: rowData?.thumbnail_url ?? '',
      } as any)
    }
  }, [isDrawerOpen, edit, viewMode, rowData, methods])

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
  const onSubmit = (details: any) => {
    const hasNewVideoFile = details?.video_file instanceof File
    const hasExistingVideoUrl =
      typeof details?.video_file === 'string' && details.video_file !== ''

    if (!hasNewVideoFile && !hasExistingVideoUrl) {
      setError('video_file', { type: 'manual', message: 'Video is required.' })
      return
    }

    clearErrors('video_file')
    const fd = new FormData()
    fd.append('meditation[title]', details?.title ?? '')
    fd.append('meditation[description]', details?.description ?? '')

    if (hasNewVideoFile) {
      fd.append('video', details.video_file)
    } else if (hasExistingVideoUrl) {
      fd.append('meditation[video_url]', details.video_file)
    }

    const thumbVal = details?.thumbnail

    if (thumbVal instanceof File) {
      fd.append('meditation[thumbnail]', thumbVal)
    } else if (thumbVal === '') {
      fd.append('meditation[thumbnail]', null as any)
    }

    if (videoDurationMs !== null) {
      const totalSeconds = Math.max(0, Math.floor(videoDurationMs / 1000))
      const minutes = Math.floor(totalSeconds / 60)
      const seconds = totalSeconds % 60
      const paddedSeconds = seconds.toString().padStart(2, '0')
      fd.append('meditation[duration_minutes]', `${minutes}.${paddedSeconds}`)
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
        title={
          edit
            ? 'Edit Meditation'
            : viewMode
              ? 'Meditation Details'
              : 'Create Meditation'
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
