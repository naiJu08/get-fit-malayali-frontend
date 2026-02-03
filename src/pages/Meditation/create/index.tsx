import { zodResolver } from '@hookform/resolvers/zod'
import moment from 'moment'
// import moment from 'moment'
import { useEffect, useMemo, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'

import InfoBox from '../../../components/app/alertBox/infoBox'
import FormBuilder from '../../../components/app/formBuilder'
import { DialogModal } from '../../../components/common'
import CustomeSideViewer from '../../../components/common/drawer/customeSideViewer'
import { useSnackbarManager } from '../../../components/common/snackbar'
import { humanizeDatetime } from '../../../utilities/format'
import { useCreateMeditation, useUpdateMeditation } from '../api'
import { MeditationSchema, editFormSchema, formSchema } from './schema'

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
  const { enqueueSnackbar } = useSnackbarManager()

  const decodeFileName = (input?: string) => {
    const raw = String(input ?? '')
    const fallback = raw.split('/').pop() || raw
    try {
      return decodeURIComponent(fallback)
    } catch {
      return fallback
    }
  }
  const formatVideoDurationLabel = (durationMs: number | null) => {
    if (durationMs === null) return ''
    const totalSeconds = Math.max(0, Math.floor(durationMs / 1000))
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    const paddedSeconds = seconds.toString().padStart(2, '0')
    return `Duration: ${minutes}:${paddedSeconds}`
  }
  const handleDeleteFile = () => {
    console.log('handle delete')
  }
  const existingVideoFile = rowData?.video_url
    ? {
        name: decodeFileName(rowData.video_url),
        link: rowData.video_url,
      }
    : undefined

  const existingThumbnailFile = rowData?.thumbnail_url
    ? {
        name: decodeFileName(rowData.thumbnail_url),
        link: rowData.thumbnail_url,
      }
    : undefined

  const methods = useForm<MeditationSchema>({
    resolver: zodResolver(edit ? editFormSchema : formSchema),
    mode: 'onChange',
    reValidateMode: 'onChange',
  })
  const { handleSubmit, watch } = methods

  const setVideoFileLabel = (value?: string) => {
    methods.setValue('video_file_label', value ?? '', { shouldValidate: false })
  }

  const formBuilderProps = [
    { ...textField('title', 'Title', 'Enter meditation title', true) },
    {
      name: 'description',
      label: 'Description',
      id: 'description',
      type: 'textarea',
      placeholder: 'Enter description',
      required: true,
    },
    {
      name: 'video_file',
      label: 'Video File',
      labelAddon: formatVideoDurationLabel(videoDurationMs),
      id: 'video_file',
      type: 'file_upload',
      placeholder: 'Upload video file',
      required: !rowData?.id,
      accept: 'video/*',
      supportedExtensions: ['video/mp4', 'video/quicktime', 'video/x-msvideo'],
      acceptedFiles: 'MP4, MOV, AVI',
      fileSize: 5,
      selectedFiles: existingVideoFile,
      subName: 'video_file_label',
      setAttachmentName: (value: string) => setVideoFileLabel(value),
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
    methods.reset({
      title: '',
      description: '',
      video_url: '',
      video_file: '',
      thumbnail: '',
      video_file_label: '',
    } as any)
    setVideoDurationMs(null)
    handleClose()
  }

  const handleSubmission = () => {
    methods.reset({
      title: '',
      description: '',
      video_url: '',
      video_file: '',
      thumbnail: '',
      video_file_label: '',
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
        video_url: rowData?.video_url ?? '',
        video_file: null,
        thumbnail: null,
        video_file_label: existingVideoFile?.name ?? '',
      } as any)
    }
  }, [
    isDrawerOpen,
    edit,
    viewMode,
    rowData,
    // existingVideoFile,
    // existingThumbnailFile,
  ])
  const onSuccess = () => {
    handleSubmission()
  }
  const { mutate, isLoading: isCreating } = useCreateMeditation(onSuccess)
  const { mutate: updateMutation, isLoading: isUpdating } =
    useUpdateMeditation(onSuccess)

  const watchedVideoFile = watch('video_file')

  const fallbackDurationMs = useMemo(() => {
    if (!edit || viewMode) return null
    const raw = rowData?.duration_minutes
    const numeric =
      typeof raw === 'number'
        ? raw
        : typeof raw === 'string'
          ? parseFloat(raw)
          : null
    if (numeric === null || Number.isNaN(numeric)) {
      return null
    }
    return numeric * 60000
  }, [edit, viewMode, rowData?.duration_minutes])

  useEffect(() => {
    if (!(watchedVideoFile instanceof File)) {
      setVideoDurationMs(fallbackDurationMs)
      return
    }

    const video = document.createElement('video')
    const url = URL.createObjectURL(watchedVideoFile)

    video.preload = 'metadata'
    video.src = url

    video.onloadedmetadata = () => {
      setVideoDurationMs(video.duration * 1000)
      URL.revokeObjectURL(url)
    }

    video.onerror = () => {
      setVideoDurationMs(fallbackDurationMs)
      URL.revokeObjectURL(url)
    }
  }, [watchedVideoFile, fallbackDurationMs])
  const onSubmit = async (details: any) => {
    const fd = new FormData()
    fd.append('meditation[title]', details?.title ?? '')
    fd.append('meditation[description]', details?.description ?? '')

    if (videoDurationMs !== null) {
      const totalSeconds = Math.max(0, Math.floor(videoDurationMs / 1000))
      const minutes = Math.floor(totalSeconds / 60)
      const seconds = totalSeconds % 60
      const paddedSeconds = seconds.toString().padStart(2, '0')
      fd.append('meditation[duration_minutes]', `${minutes}.${paddedSeconds}`)
    }
    const hasNewVideoFile = details?.video_file instanceof File

    if (!hasNewVideoFile && !rowData?.id) {
      enqueueSnackbar('Video file is required.', { variant: 'error' })
      return
    }

    if (hasNewVideoFile) {
      fd.append('meditation[video]', details.video_file as File)
    }

    if (details?.thumbnail instanceof File) {
      fd.append('meditation[thumbnail]', details.thumbnail)
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
