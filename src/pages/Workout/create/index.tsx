import { zodResolver } from '@hookform/resolvers/zod'
import moment from 'moment'
// import moment from 'moment'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { useQuery } from '@tanstack/react-query'

import { getData } from '../../../apis/api.helpers'
import apiUrl from '../../../apis/api.url'
import InfoBox from '../../../components/app/alertBox/infoBox'
import FormBuilder from '../../../components/app/formBuilder'
import { DialogModal } from '../../../components/common'
import CustomeSideViewer from '../../../components/common/drawer/customeSideViewer'
// import FileUpload from '../../../components/common/fileUpload'
import { humanizeDatetime } from '../../../utilities/format'
// import { getRoles, useCreateAdmin, useUpdateAdmin } from '../../organisation/common/commonUtils'
// import FormFieldView from '../../../components/common/inputs/FormFieldView'
import { useCreateWorkout, useUpdateWorkout } from '../api'
import { WorkoutSchema, formSchema } from './schema'
import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile, toBlobURL } from '@ffmpeg/util'
const toTitleCase = (value?: string) => {
  if (!value) return ''
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase()
}

const ffmpeg = new FFmpeg()
let isFfmpegLoaded = false

export const resetFfmpeg = () => {
  ffmpeg.terminate()
  isFfmpegLoaded = false
}

const loadFfmpeg = async () => {
  if (isFfmpegLoaded) return

  const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.9/dist/umd'

  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
  })

  isFfmpegLoaded = true
}

const getVideoDimensions = async (file: File) => {
  return new Promise<{ width: number; height: number }>((resolve, reject) => {
    const videoElement = document.createElement('video')
    const objectUrl = URL.createObjectURL(file)

    const cleanup = () => {
      URL.revokeObjectURL(objectUrl)
      videoElement.removeAttribute('src')
      videoElement.load()
    }

    videoElement.preload = 'metadata'
    videoElement.onloadedmetadata = () => {
      resolve({
        width: videoElement.videoWidth,
        height: videoElement.videoHeight,
      })
      cleanup()
    }
    videoElement.onerror = () => {
      reject(new Error('Unable to read video metadata'))
      cleanup()
    }
    videoElement.src = objectUrl
  })
}

export const compressVideo = async (
  file: File,
  onProgress?: (progress: number) => void
): Promise<File> => {
  await loadFfmpeg()

  const inputName = `input-${Date.now()}-${file.name}`
  const outputName = `output-${Date.now()}.mp4`
  const { width, height } = await getVideoDimensions(file)
  const ffmpegArgs = ['-i', inputName]

  if (width > 1280 || height > 720) {
    ffmpegArgs.push('-vf', width >= height ? 'scale=1280:-2' : 'scale=-2:720')
  }

  const handleProgress = ({ progress }: { progress: number }) => {
    onProgress?.(Math.min(100, Math.max(0, Math.round(progress * 100))))
  }

  ffmpeg.on('progress', handleProgress)

  try {
    await ffmpeg.writeFile(inputName, await fetchFile(file))
    ffmpegArgs.push(
      '-c:v',
      'libx264',
      '-crf',
      '28',
      '-preset',
      'ultrafast',
      '-c:a',
      'aac',
      '-b:a',
      '96k',
      '-movflags',
      'faststart',
      outputName
    )
    await ffmpeg.exec(ffmpegArgs)

    const data = await ffmpeg.readFile(outputName)
    const outputData =
      data instanceof Uint8Array
        ? new Uint8Array(data)
        : new TextEncoder().encode(data)
    const compressedName = file.name.replace(/\.[^/.]+$/, '')

    onProgress?.(100)

    return new File([outputData], `compressed_${compressedName}.mp4`, {
      type: 'video/mp4',
    })
  } finally {
    ffmpeg.off('progress', handleProgress)
    await Promise.allSettled([
      ffmpeg.deleteFile(inputName),
      ffmpeg.deleteFile(outputName),
    ])
  }
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

  const stopVideoCompression = () => {
    if (!isCompressingVideo) return

    compressionCancelledRef.current = true
    resetFfmpeg()
    methods.setValue('video_file', '')
    methods.setValue('video_url', '')
    clearErrors('video_file')
    resetCompressionState()
  }

  // const [profileLoading, SetProfileLoading] = useState<boolean>(true)

  // useEffect(() => {
  //   const intervalId = setTimeout(() => {
  //     SetProfileLoading(false)
  //   }, 2000)

  //   return () => clearTimeout(intervalId)
  // }, [])

  // const getReadableFileName = (value?: string) => {
  //   if (!value) {
  //     return ''
  //   }
  //   const segments = String(value).split('/')
  //   const raw = segments[segments.length - 1] || String(value)
  //   const sanitized = raw.split('?')[0].split('#')[0]
  //   try {
  //     return decodeURIComponent(sanitized)
  //   } catch {
  //     return sanitized
  //   }
  // }

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
    const strValue = String(value)
    const parts = strValue.split('.')
    const minutes = parseInt(parts[0] || '0', 10)
    const seconds = parseInt(parts[1] || '0', 10)
    if (Number.isNaN(minutes) || Number.isNaN(seconds)) return null
    return Math.max(0, (minutes * 60 + seconds) * 1000)
  }
  // const existingVideoFile =
  //   rowData?.video_url
  //     ? {
  //       name: getReadableFileName(rowData.video_url),
  //       link: rowData.video_url,
  //     }
  //     : undefined

  // Used to show existing thumbnail image in edit mode (based on thumbnail_url from API)
  // const existingThumbnailFile = rowData?.thumbnail_url
  //   ? {
  //     name: getReadableFileName(rowData.thumbnail_url),
  //     link: rowData.thumbnail_url,
  //   }
  //   : undefined

  const { data: categoriesResponse } = useQuery(
    ['workout_categories'],
    () => getData(apiUrl.CATEGORIES),
    {
      staleTime: 5 * 60 * 1000,
    }
  )

  const normalizedCategories = useMemo(() => {
    const categories =
      (categoriesResponse as any)?.categories ??
      (categoriesResponse as any)?.category ??
      categoriesResponse
    if (Array.isArray(categories)) return categories
    return []
  }, [categoriesResponse])

  const categoryOptions = useMemo(
    () =>
      normalizedCategories.map((cat: any) => ({
        id: cat?.id,
        name: toTitleCase(cat?.name),
        subcategories: Array.isArray(cat?.subcategories)
          ? cat.subcategories
          : [],
      })),
    [normalizedCategories]
  )
  const subcategoryParentMap = useMemo(() => {
    const map: Record<
      string,
      { parentId: number | string; parentName: string; subName: string }
    > = {}
    categoryOptions.forEach((cat: any) => {
      ;(cat?.subcategories ?? []).forEach((sub: any) => {
        if (sub?.id !== undefined && sub?.id !== null) {
          map[String(sub.id)] = {
            parentId: cat.id,
            parentName: cat.name,
            subName: sub?.name ?? '',
          }
        }
      })
    })
    return map
  }, [categoryOptions])

  // const getAdminDetails = (name: any) => {
  //   const property = formBuilderProps.find((prop) => prop.name === name)
  //   // return property ? property.value : '--'
  //   return property && property.value ? property.value : '--'
  // }

  const handleClearAndClose = () => {
    stopVideoCompression()
    methods.reset({
      name: '',
      description: '',
      intensity_level: '',
      category: '',
      category_id: undefined,
      subcategory: '',
      subcategory_id: undefined,
      video_url: '',
      video_file: '',
      thumbnail: '',
    } as any)
    resetCompressionState()
    setIsExistingVideoCleared(false)
    handleClose()
  }

  const handleSubmission = () => {
    methods.reset({
      name: '',
      description: '',
      intensity_level: '',
      category: '',
      category_id: undefined,
      subcategory: '',
      subcategory_id: undefined,
      video_url: '',
      video_file: '',
      thumbnail: '',
    } as any)
    resetCompressionState()
    setIsExistingVideoCleared(false)

    handleRefresh?.()
    handleClearAndClose()
  }
  useEffect(() => {
    if (!(isDrawerOpen && edit && !viewMode && rowData)) return
    setIsExistingVideoCleared(false)

    const rawCategory = rowData?.category
    const mainCategory = rawCategory?.main_category
    const hydrationKey =
      rowData?.id ?? rowData?.video_url ?? rowData?.thumbnail_url ?? 'unknown'

    if (hydratedRowRef.current === hydrationKey) return

    const derivedSubcategoryId =
      rowData?.subcategory_id ??
      rowData?.subcategory?.id ??
      rowData?.subcategoryId ??
      (mainCategory?.id ? rawCategory?.id : undefined)

    const parentInfo =
      derivedSubcategoryId !== undefined && derivedSubcategoryId !== null
        ? subcategoryParentMap[String(derivedSubcategoryId)]
        : undefined

    const derivedCategoryId = (() => {
      if (mainCategory?.id) return mainCategory.id
      if (parentInfo?.parentId) return parentInfo.parentId
      return rowData?.category_id ?? rawCategory?.id ?? undefined
    })()

    const resolvedCategoryName = (() => {
      if (mainCategory?.name) return mainCategory.name
      if (parentInfo?.parentName) return parentInfo.parentName
      if (derivedCategoryId) {
        return (
          normalizedCategories.find(
            (cat: any) => Number(cat?.id) === Number(derivedCategoryId)
          )?.name ?? ''
        )
      }
      return rawCategory?.name ?? ''
    })()

    const resolvedSubcategoryName =
      rowData?.subcategory?.name ??
      rowData?.subcategory ??
      rowData?.subcategory_name ??
      (mainCategory?.id ? rawCategory?.name : (parentInfo?.subName ?? ''))

    methods.reset({
      name: toTitleCase(rowData?.name) ?? '',
      description: rowData?.description ?? '',
      intensity_level: rowData?.intensity_level ?? '',
      category: resolvedCategoryName ?? '',
      category_id: derivedCategoryId ?? undefined,
      subcategory:
        derivedSubcategoryId !== undefined && derivedSubcategoryId !== null
          ? (resolvedSubcategoryName ?? '')
          : '',
      subcategory_id:
        derivedSubcategoryId !== undefined && derivedSubcategoryId !== null
          ? derivedSubcategoryId
          : undefined,
      video_file: getFileName(rowData?.video_url) ?? '',
      thumbnail: getFileName(rowData?.thumbnail_url) ?? '',
    } as any)

    hydratedRowRef.current = hydrationKey
  }, [
    isDrawerOpen,
    normalizedCategories,
    // rowData,
    subcategoryParentMap,
    // viewMode,
  ])

  useEffect(() => {
    if (!isDrawerOpen) {
      hydratedRowRef.current = null
      setSelectedVideoName('')
      setCompressionProgress(null)
      setIsExistingVideoCleared(false)
    }
  }, [isDrawerOpen])

  useEffect(() => {
    if (!isDrawerOpen) return

    loadFfmpeg().catch(() => null)
  }, [isDrawerOpen])

  const onSuccess = () => {
    handleSubmission()
  }
  const { mutate, isLoading: isCreating } = useCreateWorkout(onSuccess)
  const { mutate: updateMutation, isLoading: isUpdating } =
    useUpdateWorkout(onSuccess)

  const methods = useForm<WorkoutSchema>({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
    reValidateMode: 'onChange',
  })
  const { handleSubmit, watch, setError, clearErrors } = methods
  const watchedVideoFile = watch('video_file')
  const selectedCategoryId = watch('category_id')

  const subcategoryOptions = useMemo(() => {
    const category = categoryOptions.find(
      (cat) => Number(cat.id) === Number(selectedCategoryId)
    )
    if (!category) return []
    return (category.subcategories ?? []).map((sub: any) => ({
      id: sub?.id,
      name: toTitleCase(sub?.name),
    }))
  }, [categoryOptions, selectedCategoryId])

  const categoryChangeRef = useRef<any>()
  const hydratedRowRef = useRef<string | number | null>(null)
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
      } catch (error) {
        if (compressionCancelledRef.current) {
          clearErrors('video_file')
          return ''
        }

        resetCompressionState()
        setError('video_file', {
          type: 'manual',
          message:
            error instanceof Error &&
            error.message === 'called FFmpeg.terminate()'
              ? 'Video compression cancelled.'
              : 'Video compression failed. Please try another video.',
        })
        return ''
      } finally {
        setIsCompressingVideo(false)
        compressionCancelledRef.current = false
      }
    },
    [clearErrors, methods, setError]
  )

  useEffect(() => {
    if (categoryChangeRef.current === undefined) {
      categoryChangeRef.current = selectedCategoryId
      return
    }
    if (categoryChangeRef.current !== selectedCategoryId) {
      methods.setValue('subcategory', '' as any, {
        shouldValidate: true,
        shouldDirty: true,
      })
      methods.setValue('subcategory_id', undefined as any, {
        shouldValidate: true,
        shouldDirty: true,
      })
      // Clear subcategory error when category changes
      clearErrors('subcategory_id')
      categoryChangeRef.current = selectedCategoryId
    }
  }, [methods, selectedCategoryId, clearErrors])

  const formBuilderProps = useMemo(
    () => [
      {
        ...textField('name', 'Name', 'Enter exercise name', true),
        maxLength: 50,
      },
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
        id: 'category_id',
        type: 'custom_search_select',
        placeholder: 'Search category',
        desc: 'name',
        descId: 'id',
        required: true,
        data: categoryOptions,
        notDataMessage: 'No categories found',
      },
      {
        name: 'subcategory',
        label: 'Subcategory',
        id: 'subcategory_id',
        type: 'custom_search_select',
        placeholder: 'Search subcategory',
        desc: 'name',
        descId: 'id',
        required: true,
        data: subcategoryOptions,
        notDataMessage: 'No subcategories found',
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
    ],
    [
      categoryOptions,
      handleVideoCompression,
      methods,
      rowData?.thumbnail_url,
      rowData?.video_url,
      isExistingVideoCleared,
      selectedVideoName,
      subcategoryOptions,
      videoDurationMs,
      watchedVideoFile,
    ]
  )

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

  const onSubmit = async (details: any) => {
    if (subcategoryOptions.length > 0 && !details?.subcategory_id) {
      setError('subcategory_id', {
        type: 'manual',
        message: 'Subcategory is required.',
      })
      return
    }

    const hasNewVideoFile = details?.video_file instanceof File
    const hasExistingVideoUrl =
      typeof details?.video_file === 'string' && details.video_file !== ''

    // If user deleted video → both will be false
    if (!hasNewVideoFile && !hasExistingVideoUrl) {
      setError('video_file', { type: 'manual', message: 'Video is required.' })
      return
    }

    clearErrors('video_file')

    const fd = new FormData()
    fd.append('workout[name]', details?.name ?? '')
    fd.append('workout[description]', details?.description ?? '')
    fd.append('workout[intensity_level]', details?.intensity_level ?? '')

    const categoryIdForPayload = details?.subcategory_id ?? details?.category_id

    fd.append(
      'workout[category_id]',
      categoryIdForPayload ? String(categoryIdForPayload) : ''
    )

    // CASE 1: user uploaded new video
    if (hasNewVideoFile) {
      fd.append('video', details.video_file)
    }

    // CASE 2: keep existing video (edit mode, not deleted)
    else if (hasExistingVideoUrl) {
      fd.append('workout[video_url]', details.video_file)
    }

    // Thumbnail handling
    const thumbVal = details?.thumbnail

    // CASE 1: New thumbnail uploaded
    if (thumbVal instanceof File) {
      fd.append('workout[thumbnail]', thumbVal)
    }

    // CASE 2: Thumbnail manually removed
    else if (thumbVal === '') {
      fd.append('workout[thumbnail]', null as any)
    }

    // Duration
    if (videoDurationMs !== null) {
      const totalSeconds = Math.max(0, Math.floor(videoDurationMs / 1000))
      const minutes = Math.floor(totalSeconds / 60)
      const seconds = totalSeconds % 60
      const paddedSeconds = seconds.toString().padStart(2, '0')
      fd.append('workout[duration_minutes]', `${minutes}.${paddedSeconds}`)
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
        isOpen={deleteModal}
        onClose={() => setDeleteModal(false)}
        title={'Delete File'}
        // onSubmit={() => handleDeleteFile()}
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
            ? 'Edit Exercise'
            : viewMode
              ? 'Exercise Details'
              : 'Create Exercise'
        }
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
                    {/* Header */}
                    <div className="mb-4 flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                        <svg
                          className="h-6 w-6 text-blue-600 animate-pulse"
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

                    {/* Progress Bar */}
                    <div className="relative h-4 overflow-hidden rounded-full bg-gray-200">
                      <div
                        className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 transition-all duration-500"
                        style={{
                          width: `${compressionProgress ?? 0}%`,
                        }}
                      />

                      <div className="absolute inset-0 animate-pulse bg-white/10" />
                    </div>

                    {/* Status */}
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

                    {/* Animated Dots */}
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
