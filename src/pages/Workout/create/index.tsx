import { zodResolver } from '@hookform/resolvers/zod'
import moment from 'moment'
// import moment from 'moment'
import { useEffect, useMemo, useRef, useState } from 'react'
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

  const getReadableFileName = (value?: string) => {
    if (!value) {
      return ''
    }
    const segments = String(value).split('/')
    const raw = segments[segments.length - 1] || String(value)
    const sanitized = raw.split('?')[0].split('#')[0]
    try {
      return decodeURIComponent(sanitized)
    } catch {
      return sanitized
    }
  }
  const formatVideoDurationLabel = (durationMs: number | null) => {
    if (durationMs === null) return ''
    const totalSeconds = Math.max(0, Math.round(durationMs / 1000))
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    const paddedSeconds = seconds.toString().padStart(2, '0')
    return `Duration: ${minutes}:${paddedSeconds}`
  }

  const parseDurationMinutesToMs = (value?: string | number | null) => {
    if (value === null || value === undefined) return null
    const numeric =
      typeof value === 'number' ? value : parseFloat(String(value))
    if (Number.isNaN(numeric)) return null
    return Math.max(0, numeric) * 60000
  }
  // Used to show existing video file in edit mode (based on video_url from API)
  const existingVideoFile = rowData?.video_url
    ? {
        name: getReadableFileName(rowData.video_url),
        link: rowData.video_url,
      }
    : undefined

  // Used to show existing thumbnail image in edit mode (based on thumbnail_url from API)
  const existingThumbnailFile = rowData?.thumbnail_url
    ? {
        name: getReadableFileName(rowData.thumbnail_url),
        link: rowData.thumbnail_url,
      }
    : undefined

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
        name: cat?.name,
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
    setVideoDurationMs(null)
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
    setVideoDurationMs(null)

    handleRefresh?.()
    handleClearAndClose()
  }
  useEffect(() => {
    if (isDrawerOpen && edit && !viewMode && rowData) {
      const rawCategory = rowData?.category
      const mainCategory = rawCategory?.main_category

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
        name: rowData?.name ?? '',
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
        // video_url: rowData?.video_url ?? '',
        // // seed video_file with existing URL so validation passes when no new file is chosen
        // video_file: rowData?.video_url ?? '',
        video_file: '',
        video_url: rowData?.video_url ?? '',
      } as any)
    }
  }, [
    edit,
    isDrawerOpen,
    normalizedCategories,
    rowData,
    subcategoryParentMap,
    viewMode,
  ])
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
      name: sub?.name,
    }))
  }, [categoryOptions, selectedCategoryId])

  const categoryChangeRef = useRef<any>()

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
      categoryChangeRef.current = selectedCategoryId
    }
  }, [methods, selectedCategoryId])

  const formBuilderProps = useMemo(
    () => [
      { ...textField('name', 'Name', 'Enter workout name', true) },
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
        selectedFiles: existingThumbnailFile,
        subName: 'thumbnail',
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
        fileSize: 5,
        selectedFiles: existingVideoFile,
        subName: 'video_file',
      },
    ],
    [
      categoryOptions,
      existingThumbnailFile,
      existingVideoFile,
      selectedCategoryId,
      subcategoryOptions,
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
  // const onSubmit = (details: any) => {
  //   // Ensure a video file is always present (for both create and edit)
  //   if (!details?.video_file && !rowData?.video_url) {
  //     setError('video_file', { type: 'manual', message: 'Required.' })
  //     return
  //   }
  //   clearErrors('video_file')

  //   const fd = new FormData()
  //   fd.append('workout[name]', details?.name ?? '')
  //   fd.append('workout[description]', details?.description ?? '')
  //   fd.append('workout[intensity_level]', details?.intensity_level ?? '')
  //   // fd.append('workout[video_url]', details?.video_url ?? '')
  //   // if (details?.video_file) {
  //   //   fd.append('video', details.video_file as any)
  //   // }
  //   if (!details?.video_file) {
  //     fd.append('workout[video_url]', rowData?.video_url ?? '')
  //   }

  //   // Only send binary if user uploaded a new file
  //   if (details?.video_file instanceof File) {
  //     fd.append('video', details.video_file)
  //   }
  //   const thumbVal: any = details?.thumbnail
  //   // Only append if a new File is provided (not just an existing URL/string)
  //   if (thumbVal && typeof thumbVal !== 'string') {
  //     fd.append('workout[thumbnail]', thumbVal as any)
  //   }

  //   if (videoDurationMs !== null) {
  //     const durationMinutes = videoDurationMs / 60000
  //     fd.append('workout[duration_minutes]', durationMinutes.toFixed(2))
  //   }

  //   if (rowData?.id) {
  //     updateMutation({ id: rowData?.id, data: fd })
  //   } else {
  //     mutate(fd)
  //   }
  // }
  const onSubmit = (details: any) => {
    const hasNewVideoFile = details?.video_file instanceof File
    const hasExistingVideoUrl = !!(details?.video_url || rowData?.video_url)

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

    // Send video_url only if no new file is provided
    if (!details?.video_file) {
      fd.append('workout[video_url]', rowData?.video_url ?? '')
    }

    // Only send binary if user uploaded a new file
    if (details?.video_file instanceof File) {
      fd.append('video', details.video_file)
    }

    // Thumbnail logic (same as before)
    const thumbVal = details?.thumbnail
    if (thumbVal && typeof thumbVal !== 'string') {
      fd.append('workout[thumbnail]', thumbVal)
    }

    // Duration
    if (videoDurationMs !== null) {
      const totalSeconds = Math.max(0, Math.round(videoDurationMs / 1000))
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
            ? 'Edit Workout'
            : viewMode
              ? 'Workout Details'
              : 'Create Workout'
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
                {videoDurationMs !== null && (
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
