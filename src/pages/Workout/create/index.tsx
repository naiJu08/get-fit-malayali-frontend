import { zodResolver } from '@hookform/resolvers/zod'
import moment from 'moment'
// import moment from 'moment'
import { useEffect, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'

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

  // Used to show existing video file in edit mode (based on video_url from API)
  const existingVideoFile = rowData?.video_url
    ? {
        name:
          String(rowData.video_url).split('/').pop() ||
          String(rowData.video_url),
        link: rowData.video_url,
      }
    : undefined

  // Used to show existing thumbnail image in edit mode (based on thumbnail_url from API)
  const existingThumbnailFile = rowData?.thumbnail_url
    ? {
        name:
          String(rowData.thumbnail_url).split('/').pop() ||
          String(rowData.thumbnail_url),
        link: rowData.thumbnail_url,
      }
    : undefined

  const formBuilderProps = [
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

    // second row: Description (left), Video File (right)
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
      id: 'video_file',
      type: 'file_upload',
      placeholder: 'Upload video file',
      required: true,
      accept: 'video/*',
      supportedExtensions: ['video/mp4', 'video/quicktime', 'video/x-msvideo'],
      acceptedFiles: 'MP4, MOV, AVI',
      fileSize: 5,
      selectedFiles: existingVideoFile,
      subName: 'video_file',
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
      methods.reset({
        name: rowData?.name ?? '',
        description: rowData?.description ?? '',
        intensity_level: rowData?.intensity_level ?? '',
        // video_url: rowData?.video_url ?? '',
        // // seed video_file with existing URL so validation passes when no new file is chosen
        // video_file: rowData?.video_url ?? '',
        video_file: '',
        video_url: rowData?.video_url ?? '',
      } as any)
    }
  }, [isDrawerOpen, edit, viewMode, rowData])
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

  useEffect(() => {
    if (!watchedVideoFile) {
      setVideoDurationMs(null)
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

      videoElement.addEventListener('loadedmetadata', handleLoadedMetadata)

      return () => {
        videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata)
        URL.revokeObjectURL(objectUrl)
      }
    } else {
      setVideoDurationMs(null)
    }
  }, [watchedVideoFile])
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
      fd.append(
        'workout[duration_minutes]',
        (videoDurationMs / 60000).toFixed(2)
      )
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
                    {(() => {
                      const minutes = videoDurationMs / 60000
                      const formatted = minutes.toFixed(2).padStart(5, '0')
                      return `Video duration: ${formatted} minutes`
                    })()}
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
