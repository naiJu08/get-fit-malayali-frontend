import { zodResolver } from '@hookform/resolvers/zod'
import moment from 'moment'
// import moment from 'moment'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import FormBuilder from '../../../components/app/formBuilder'
import { DialogModal } from '../../../components/common'
import CustomeSideViewer from '../../../components/common/drawer/customeSideViewer'
import { humanizeDatetime } from '../../../utilities/format'
// import { getRoles, useCreateAdmin, useUpdateAdmin } from '../../organisation/common/commonUtils'
// import FormFieldView from '../../../components/common/inputs/FormFieldView'
import { useCreateYoga, useUpdateYoga } from '../api'
import { YogaSchema, formSchema } from './schema'
import { compressVideo, resetFfmpeg } from '../../Workout/create'

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
  const [isCompressingVideo, setIsCompressingVideo] = useState(false)
  const [compressionProgress, setCompressionProgress] = useState<number | null>(
    null
  )
  const [selectedVideoName, setSelectedVideoName] = useState('')
  const [isExistingVideoCleared, setIsExistingVideoCleared] = useState(false)
  const compressionCancelledRef = useRef(false)

  const resetCompressionState = () => {
    setIsCompressingVideo(false)
    setCompressionProgress(null)
    setSelectedVideoName('')
    setVideoDurationMs(null)
  }

  const methods = useForm<YogaSchema>({
    defaultValues: {
      name: '',
      description: '',
      intensity_level: '',
      category: '',
      video_source: 'file',
      video_url: '',
      video_file: '',
      thumbnail: '',
    },
    resolver: zodResolver(formSchema),
    mode: 'onChange',
    reValidateMode: 'onChange',
  })
  const { handleSubmit, watch, setError, clearErrors } = methods
  const watchedVideoFile = watch('video_file')
  const watchedVideoSource = watch('video_source')
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
  const handleVideoCompression = useCallback(
    async (selectedFile?: File | string) => {
      if (!(selectedFile instanceof File)) {
        if (!selectedFile) {
          setVideoDurationMs(null)
          setCompressionProgress(null)
          setSelectedVideoName('')
          setIsExistingVideoCleared(true)
          methods.setValue('video_url', '')
        }

        return selectedFile ?? ''
      }

      setSelectedVideoName(selectedFile.name)
      setIsExistingVideoCleared(false)
      compressionCancelledRef.current = false
      setIsCompressingVideo(true)
      setCompressionProgress(0)

      try {
        const compressedVideo = await compressVideo(
          selectedFile,
          setCompressionProgress
        )
        clearErrors('video_file')
        return compressedVideo
      } catch {
        if (compressionCancelledRef.current) {
          clearErrors('video_file')
          return ''
        }

        resetCompressionState()
        setError('video_file', {
          type: 'manual',
          message: 'Video compression failed. Please try another video.',
        })
        return ''
      } finally {
        setIsCompressingVideo(false)
        compressionCancelledRef.current = false
      }
    },
    [clearErrors, methods, setError]
  )
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
      name: 'video_source',
      label: 'Video Source',
      id: 'video_source',
      type: 'radio',
      required: true,
      data: [
        { id: 1, value: 'file', radioLabel: 'Upload video file' },
        { id: 2, value: 'url', radioLabel: 'Use video URL' },
      ],
    },
    ...(watchedVideoSource === 'url'
      ? [
          {
            ...textField(
              'video_url',
              'Video URL',
              'Enter YouTube or direct video URL',
              true
            ),
          },
        ]
      : [
          {
            name: 'video_file',
            label: 'Video File',
            id: 'video_file',
            type: 'file_upload',
            placeholder: 'Upload video file',
            required: true,
            accept: 'video/*',
            supportedExtensions: [
              'video/mp4',
              'video/quicktime',
              'video/x-msvideo',
            ],
            acceptedFiles: 'MP4, MOV, AVI',
            fileSize: 0,
            selectedFiles:
              selectedVideoName ||
              watchedVideoFile?.name ||
              (!isExistingVideoCleared ? getFileName(rowData?.video_url) : ''),
            subName: 'video_file',
            handleCallBack: handleVideoCompression,
            handleDeleteFile: () => {
              methods.setValue('video_file', '')
              methods.setValue('video_url', '')
              setVideoDurationMs(null)
              setCompressionProgress(null)
              setSelectedVideoName('')
              setIsExistingVideoCleared(true)
            },
          },
        ]),
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
    if (isCompressingVideo) {
      compressionCancelledRef.current = true
      resetFfmpeg()
    }

    methods.reset({
      name: '',
      description: '',
      intensity_level: '',
      category: '',
      video_source: 'file',
      video_url: '',
      video_file: '',
      thumbnail: '',
    } as any)
    setVideoDurationMs(null)
    setCompressionProgress(null)
    setSelectedVideoName('')
    setIsExistingVideoCleared(false)
    handleClose()
  }

  const handleSubmission = () => {
    methods.reset({
      name: '',
      description: '',
      intensity_level: '',
      category: '',
      video_source: 'file',
      video_url: '',
      video_file: '',
      thumbnail: '',
    } as any)

    setVideoDurationMs(null)
    setCompressionProgress(null)
    setSelectedVideoName('')
    setIsExistingVideoCleared(false)
    handleRefresh?.()
    handleClearAndClose()
  }

  const onSuccess = () => {
    handleSubmission()
  }
  const { mutate, isLoading: isCreating } = useCreateYoga(onSuccess)
  const { mutate: updateMutation, isLoading: isUpdating } =
    useUpdateYoga(onSuccess)

  useEffect(() => {
    if (isDrawerOpen && edit && !viewMode && rowData) {
      setIsExistingVideoCleared(false)
      const normalizedCategory =
        typeof rowData?.category === 'string'
          ? rowData.category.toLowerCase()
          : ''
      const matchedCategory =
        categoryOptions.find((opt) => opt.id === normalizedCategory) ?? null
      methods.reset({
        name: rowData?.name
          ? rowData.name.charAt(0).toUpperCase() +
            rowData.name.slice(1).toLowerCase()
          : '',
        description: rowData?.description ?? '',
        intensity_level: rowData?.intensity_level ?? '',
        category: matchedCategory?.name ?? '',
        video_source:
          /^https?:\/\/(www\.)?(youtube\.com|youtu\.be|vimeo\.com)/i.test(
            rowData?.video_url ?? ''
          )
            ? 'url'
            : 'file',
        video_file: getFileName(rowData?.video_url) ?? '',
        video_url: rowData?.video_url ?? '',
        thumbnail: getFileName(rowData?.thumbnail_url) ?? '',
      } as any)
    }
  }, [isDrawerOpen, edit, viewMode, rowData, categoryOptions, methods])

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
    const currentVideoName = details?.video_file
    const hasNewVideoFile = currentVideoName instanceof File
    const hasExistingVideoFile =
      typeof currentVideoName === 'string' &&
      currentVideoName !== '' &&
      !isExistingVideoCleared
    const externalVideoUrl = String(details?.video_url ?? '').trim()

    if (
      details?.video_source === 'file' &&
      !hasNewVideoFile &&
      !hasExistingVideoFile
    ) {
      setError('video_file', {
        type: 'manual',
        message: 'Upload a video file.',
      })
      return
    }
    if (details?.video_source === 'url' && !externalVideoUrl) {
      setError('video_url', {
        type: 'manual',
        message: 'Enter a YouTube or video URL.',
      })
      return
    }
    clearErrors(['video_file', 'video_url'])
    const fd = new FormData()
    fd.append('yoga[name]', details?.name ?? '')
    fd.append('yoga[description]', details?.description ?? '')
    fd.append('yoga[intensity_level]', details?.intensity_level ?? '')
    fd.append('yoga[category]', extractSelectValue(details?.category))
    if (details?.video_source === 'file' && hasNewVideoFile)
      fd.append('video', currentVideoName)
    else if (details?.video_source === 'url')
      fd.append('yoga[video_url]', externalVideoUrl)

    // Thumbnail handling - only append if changed
    const thumbVal = details?.thumbnail
    const originalThumbnailName = getFileName(rowData?.thumbnail_url)

    // Check if thumbnail has changed
    const thumbnailChanged =
      thumbVal instanceof File || // New file uploaded
      (typeof thumbVal === 'string' && thumbVal !== originalThumbnailName) // Different string value (but not empty deletion)

    // Only append thumbnail key if it has changed
    if (thumbnailChanged) {
      // CASE 1: New thumbnail uploaded
      if (thumbVal instanceof File) {
        fd.append('yoga[thumbnail]', thumbVal)
      }
      // CASE 2: Different thumbnail URL/string
      else if (typeof thumbVal === 'string') {
        fd.append('yoga[thumbnail]', thumbVal)
      }
    }
    // Note: When thumbnail is deleted (thumbVal === ''), we don't append the key at all

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
        actionDisabled={isCompressingVideo}
        actionLoader={isCreating || isUpdating}
        onSubmit={
          viewMode
            ? handleChangeMode
            : isCompressingVideo
              ? undefined
              : handleSubmit((data) => onSubmit(data))
        }
        secondaryAction={() => handleClearAndClose()}
        secondaryActionLabel="Cancel"
        small={false}
        body={
          <div className="flex flex-col gap-4">
            {!viewMode ? (
              <>
                {isCompressingVideo && (
                  <div className="mb-5 overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 via-white to-indigo-50 p-5 shadow-lg">
                    <div className="mb-4 flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                        <svg
                          className="h-6 w-6 animate-pulse text-blue-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 10l4.55-2.28A1 1 0 0121 8.62v6.76a1 1 0 01-1.45.9L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                          />
                        </svg>
                      </div>

                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800">
                          Optimizing Video
                        </h3>

                        <p className="max-w-[280px] truncate text-xs text-gray-500">
                          {selectedVideoName}
                        </p>
                      </div>

                      <div className="rounded-full bg-blue-600 px-3 py-1 text-sm font-bold text-white shadow">
                        {compressionProgress ?? 0}%
                      </div>
                    </div>

                    <div className="relative h-4 overflow-hidden rounded-full bg-gray-200">
                      <div
                        className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 transition-all duration-500"
                        style={{
                          width: `${compressionProgress ?? 0}%`,
                        }}
                      />

                      <div className="absolute inset-0 animate-pulse bg-white/10" />
                    </div>

                    <div className="mt-3 flex items-center justify-between text-xs">
                      <span className="font-medium text-gray-500">
                        {(compressionProgress ?? 0) < 30 &&
                          'Preparing video...'}

                        {(compressionProgress ?? 0) >= 30 &&
                          (compressionProgress ?? 0) < 70 &&
                          'Compressing video...'}

                        {(compressionProgress ?? 0) >= 70 &&
                          (compressionProgress ?? 0) < 100 &&
                          'Finalizing output...'}

                        {(compressionProgress ?? 0) === 100 &&
                          'Compression complete'}
                      </span>

                      <span className="font-semibold text-blue-600">
                        Please wait
                      </span>
                    </div>

                    <div className="mt-3 flex gap-1">
                      <span className="h-2 w-2 animate-bounce rounded-full bg-blue-500" />
                      <span
                        className="h-2 w-2 animate-bounce rounded-full bg-indigo-500"
                        style={{ animationDelay: '0.2s' }}
                      />
                      <span
                        className="h-2 w-2 animate-bounce rounded-full bg-purple-500"
                        style={{ animationDelay: '0.4s' }}
                      />
                    </div>
                  </div>
                )}
                <FormProvider {...methods}>
                  <FormBuilder
                    data={formBuilderProps}
                    edit={!isCompressingVideo}
                    spacing
                  />
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
