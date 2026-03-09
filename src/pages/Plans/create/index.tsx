import { useQueryClient } from '@tanstack/react-query'
import { zodResolver } from '@hookform/resolvers/zod'
import { FormProvider, useForm } from 'react-hook-form'
import { useEffect } from 'react'
import ToggleSwitch from '../../../components/common/inputs/ToggleSwitch'
import { planFormSchema, PlanSchema } from './schema'
import FormBuilder from '../../../components/app/formBuilder'
import { DialogModal } from '../../../components/common'
import { useCreatePlan, useUpdatePlan, usePlan } from '../api'

type Props = {
  isDrawerOpen: boolean
  handleClose: () => void
  handleRefresh?: () => void
  edit?: boolean
  rowData?: any
  viewMode?: boolean
  setViewMode?: (value: boolean) => void
  setEdit?: (value: boolean) => void
}

export default function CreatePlan({
  isDrawerOpen,
  handleClose,
  handleRefresh,
  edit,
  rowData,
  viewMode,
  setViewMode,
  setEdit,
}: Props) {
  const methods = useForm<PlanSchema>({
    resolver: zodResolver(planFormSchema),
    mode: 'onChange',
    reValidateMode: 'onChange',
  })

  const { handleSubmit, reset, setError, clearErrors } = methods
  const { mutate: createPlanMutate } = useCreatePlan()
  const { mutate: updatePlanMutate } = useUpdatePlan()
  const queryClient = useQueryClient()
  const editingPlanId = edit
    ? (rowData?.plan?.id ?? rowData?.plan_id ?? rowData?.id)
    : undefined
  const { data: latestPlanData } = usePlan(editingPlanId)
  const resolvedPlan = edit
    ? ((latestPlanData as any)?.plan ??
      latestPlanData ??
      rowData?.plan ??
      rowData)
    : undefined

  const toTitleCase = (value?: string | null) => {
    if (!value) return ''
    return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase()
  }

  const onSubmit = (values: PlanSchema | any) => {
    const thumbVal: any = values.thumbnail
    const hasNewThumbnail = thumbVal instanceof File
    const hasExistingThumbnail = typeof thumbVal === 'string' && thumbVal !== ''

    if (!hasNewThumbnail && !hasExistingThumbnail) {
      setError('thumbnail' as any, {
        type: 'manual',
        message: 'Thumbnail is required.',
      })
      return
    }
    clearErrors?.('thumbnail' as any)

    const fd = new FormData()

    const catVal: any = values.category
    const categoryStr =
      typeof catVal === 'object'
        ? (catVal?.name ?? catVal?.id ?? '')
        : (catVal ?? '')

    fd.append('plan[name]', values.name ?? '')
    fd.append('plan[category]', categoryStr)
    fd.append('plan[description]', values.description ?? '')
    fd.append('plan[duration_days]', String(values.duration_days ?? ''))
    fd.append('plan[fees]', String(values.fees ?? ''))
    fd.append(
      'plan[yoga_included]',
      String(values.yoga_included ? 'true' : 'false')
    )

    const meditationIncluded = Boolean(values.meditation_included)
    fd.append('plan[meditation_included]', String(meditationIncluded))

    // CASE 1: New thumbnail uploaded
    if (hasNewThumbnail) {
      fd.append('plan[thumbnail]', thumbVal)
    }

    // CASE 2: Thumbnail manually removed
    else if (thumbVal === '') {
      fd.append('plan[thumbnail]', null as any)
    }
    if (edit && rowData?.plan?.id) {
      updatePlanMutate(
        { id: rowData.plan.id, payload: fd },
        {
          onSuccess: () => {
            if (editingPlanId) {
              queryClient.invalidateQueries(['plan_detail', editingPlanId])
            }
            queryClient.invalidateQueries(['plans_list'])
            handleRefresh?.()
            handleClose()
          },
        }
      )
    } else {
      createPlanMutate(fd, {
        onSuccess: () => {
          // Refresh the listing and close
          queryClient.invalidateQueries(['plans_list'])
          handleRefresh?.()
          handleClose()
        },
      })
    }
  }
  useEffect(() => {
    if (!isDrawerOpen) return
    if (edit && resolvedPlan) {
      reset({
        name: toTitleCase(resolvedPlan?.name) ?? '',
        category: resolvedPlan?.category ?? '',
        description: resolvedPlan?.description ?? '',
        duration_days: resolvedPlan?.duration_days ?? 0,
        fees: resolvedPlan?.fees ?? 0,
        yoga_included: Boolean(resolvedPlan?.yoga_included ?? false),
        meditation_included: Boolean(
          resolvedPlan?.meditation_included ?? false
        ),
        thumbnail: getFileNameFromUrl(resolvedPlan?.thumbnail_url) ?? '',
      })
      return
    }
    if (isDrawerOpen && !edit) {
      reset({
        name: '',
        category: '',
        description: '',
        duration_days: 0,
        fees: 0,
        yoga_included: false,
        meditation_included: true,
        thumbnail: '',
      })
    }
  }, [isDrawerOpen, edit, resolvedPlan, reset])
  const getFileNameFromUrl = (url?: string) => {
    if (!url) return ''
    const fileName = url.split('/').pop()?.split('?')[0] || ''
    return decodeURIComponent(fileName)
  }
  const textField = (
    name: string,
    label: string,
    placeholder: string,
    required = false,
    type: 'text' | 'textarea' = 'text'
  ) => ({
    name,
    label,
    type,
    placeholder,
    ...(required ? { required: true } : {}),
  })
  const formBuilderProps = [
    { ...textField('name', 'Plan Name', 'Enter plan name', true) },
    {
      name: 'category',
      label: 'Category',
      id: 'category',
      desc: 'name',
      descId: 'id',
      data: [
        { id: 'Weight Loss', name: 'Weight Loss' },
        { id: 'Weight Gain', name: 'Weight Gain' },
        { id: 'Muscle Gain', name: 'Muscle Gain' },
        { id: 'Wellness', name: 'Wellness' },
        { id: 'Disease Management', name: 'Disease Management' },
      ],
      type: 'custom_select',
      placeholder: 'Select category',
      async: false,
      initialLoad: true,
      required: true,
    },
    {
      ...textField('fees', 'Fees', 'Enter fees', true),
      type: 'number',
    },

    {
      ...textField(
        'duration_days',
        'Duration (Days)',
        'Enter duration in days',
        true
      ),
      type: 'number',
    },
    {
      ...textField(
        'description',
        'Description',
        'Enter plan description',
        true,
        'textarea'
      ),
      maxLength: 250,
    },

    {
      name: 'thumbnail',
      label: 'Thumbnail',
      id: 'thumbnail',
      type: 'file_upload',
      placeholder: 'Upload thumbnail',
      required: true,
      accept: 'image/*',
      supportedExtensions: [
        'image/png',
        'image/jpeg',
        'image/jpg',
        'image/webp',
      ],
      acceptedFiles: 'PNG, JPG, JPEG, WEBP',
      fileSize: 5,
      selectedFiles: getFileNameFromUrl(resolvedPlan?.thumbnail_url),
      subName: 'thumbnail',
      aspectRatio: { width: 16, height: 9 },
      requiredWidth: 1600,
      requiredHeight: 900,
      dimensionLabel: 'Recommended size: 1600x900px (16:9)',
      handleDeleteFile: () => {
        methods.setValue('thumbnail', '')
      },
    },
  ]

  // const onSubmit = (data: PlanSchema) => {
  //   console.log('Form Data:', data)

  //   // If editing -> call update API
  //   // else -> call create API
  //   if (edit) {
  //     // updatePlan(rowData.id, data)
  //     console.log('Updating Plan...')
  //   } else {
  //     // createPlan(data)
  //     console.log('Creating Plan...')
  //   }

  //   handleRefresh?.()
  //   handleClose()
  // }

  const handleChangeMode = () => {
    setViewMode?.(false)
    setEdit?.(true)
  }

  return (
    <DialogModal
      isOpen={isDrawerOpen}
      onClose={handleClose}
      title={edit ? 'Edit Plan' : viewMode ? 'View Plan' : 'Create Plan'}
      actionLabel={viewMode ? 'Edit' : edit ? 'Save' : 'Save'}
      onSubmit={viewMode ? handleChangeMode : handleSubmit(onSubmit)}
      secondaryAction={handleClose}
      secondaryActionLabel="Cancel"
      small={false}
      body={
        <div className="flex flex-col gap-4">
          {/* {!viewMode ? (
            <>
              <FormProvider {...methods}>
                <FormBuilder data={formFields} edit={true} />
              </FormProvider>
              <InfoBox
                content={`Fill out the form to create or update a plan for disease management.`}
              />
            </>
          ) : (
            <div className="p-4">
              <p><b>Plan Name:</b> {rowData?.plan?.name}</p>
              <p><b>Category:</b> {rowData?.plan?.category}</p>
              <p><b>Description:</b> {rowData?.plan?.description}</p>
              <p><b>Duration (Days):</b> {rowData?.plan?.duration_days}</p>
              <p><b>Status:</b> {rowData?.plan?.active ? 'Active' : 'Inactive'}</p>
            </div>
          )} */}
          {!viewMode ? (
            <>
              <FormProvider {...methods}>
                <FormBuilder data={formBuilderProps} edit={true} spacing />
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600">Yoga Included</span>
                  <ToggleSwitch
                    id="yoga_included"
                    checked={methods.watch('yoga_included')}
                    onChange={(checked) =>
                      methods.setValue('yoga_included', checked, {
                        shouldValidate: true,
                      })
                    }
                  />
                  <span className="text-xs text-gray-500">
                    {methods.watch('yoga_included') ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600">
                    Meditation Included
                  </span>
                  <ToggleSwitch
                    id="meditation_included"
                    checked={methods.watch('meditation_included')}
                    onChange={(checked) =>
                      methods.setValue('meditation_included', checked, {
                        shouldValidate: true,
                      })
                    }
                  />
                  <span className="text-xs text-gray-500">
                    {methods.watch('meditation_included') ? 'Yes' : 'No'}
                  </span>
                </div>
              </FormProvider>
            </>
          ) : (
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-500">Plan Name</div>
                <div className="font-medium">{rowData?.plan?.name || '-'}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Category</div>
                <div className="font-medium">
                  {rowData?.plan?.category || '-'}
                </div>
              </div>
              <div className="md:col-span-2">
                <div className="text-sm text-gray-500">Description</div>
                <div className="font-medium">
                  {rowData?.plan?.description || '-'}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Duration</div>
                <div className="font-medium">
                  {rowData?.plan?.duration_days ?? '-'} days
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Fees</div>
                <div className="font-medium">{rowData?.plan?.fees ?? '-'}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Yoga Included</div>
                <div className="font-medium">
                  {rowData?.plan?.yoga_included ? 'Yes' : 'No'}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Meditation Included</div>
                <div className="font-medium">
                  {rowData?.plan?.meditation_included ? 'Yes' : 'No'}
                </div>
              </div>
              <div>
                {/* <div className="text-sm text-gray-500">Status</div> */}
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${rowData?.plan?.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                >
                  {rowData?.plan?.active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          )}
        </div>
      }
    />
  )
}
