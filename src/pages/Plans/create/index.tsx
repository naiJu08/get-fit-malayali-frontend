// import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
// import moment from 'moment'
// // import moment from 'moment'
// import { useEffect, useState } from 'react'
// import { FormProvider, useForm } from 'react-hook-form'

// import InfoBox from '../../../components/app/alertBox/infoBox'
// import FormBuilder from '../../../components/app/formBuilder'
// import { DialogModal } from '../../../components/common'
// import CustomeSideViewer from '../../../components/common/drawer/customeSideViewer'
// import { humanizeDatetime } from '../../../utilities/format'
// // import { getRoles, useCreateAdmin, useUpdateAdmin } from '../../organisation/common/commonUtils'
// // import FormFieldView from '../../../components/common/inputs/FormFieldView'
// import { getRoles, useCreateAdmin, useUpdateAdmin } from '../api'
// import { ACCEPTED_IMAGE_TYPES, AdminSchema, formSchema } from './schema'

// type Props = {
//   isDrawerOpen: boolean
//   disabled?: boolean
//   handleClose: () => void
//   handleRefresh?: () => void
//   paramsId?: any
//   handleCallback?: () => void
//   model_name?: string
//   rowData?: any
//   isOwnTask?: boolean
//   isGeneral?: boolean
//   viewMode?: boolean
//   setViewMode?: (value: boolean) => void
//   edit?: boolean
//   hasPermission?: boolean
//   setEdit?: (value: boolean) => void
//   subSection?: boolean
//   setEditViewIndicator?: (value: boolean) => void
//   editViewIndicator?: boolean
// }

// export default function CreatePlan({
//   isDrawerOpen,
//   handleClose,
//   handleRefresh,
//   edit,
//   viewMode,
//   setViewMode,
//   setEdit,
//   rowData,
//   setEditViewIndicator,
// }: Props) {
//   const textField = (
//     name: string,
//     label: string,
//     placeholder: string,
//     required = false,
//     disabled = false
//   ) => ({
//     name,
//     label,
//     id: name,
//     type: 'text',
//     placeholder,
//     ...(required ? { required: true } : {}),
//     ...(disabled ? { disabled: true } : {}),
//   })
//   const [roleData, setRoleData] = useState<any[]>([])
//   const [deleteModal, setDeleteModal] = useState(false)
//   // const [profileLoading, SetProfileLoading] = useState<boolean>(true)

//   useEffect(() => {
//     if (isDrawerOpen) {
//       getRoleData()
//     }
//   }, [isDrawerOpen])

//   const statusData = [
//     {
//       id: '1',
//       name: 'Active',
//     },
//     {
//       id: '2',
//       name: 'Inactive',
//     },
//   ]
//   // useEffect(() => {
//   //   const intervalId = setTimeout(() => {
//   //     SetProfileLoading(false)
//   //   }, 2000)

//   //   return () => clearTimeout(intervalId)
//   // }, [])

//   const handleDeleteFile = () => {
//     console.log('handle delete')
//     // deleteAssessorImage(rowData?.user?.id)
//     //   .then((res: any) => {
//     //     enqueueSnackbar(res.message ? res.message : 'Deleted Successfully', {
//     //       variant: 'success',
//     //     })
//     //     handleRefresh?.()
//     //     setDeleteModal(false)
//     //   })
//     //   .catch((err: any) => {
//     //     enqueueSnackbar(
//     //       err?.response?.data?.error?.message || err?.response?.data?.message,
//     //       { variant: 'error' }
//     //     )
//     //   })
//   }
//   const getRoleData = async () => {
//     try {
//       const res = await getRoles()
//       const items = res?.items ?? []
//       const a = items?.map((item: any) => ({
//         ...item,
//         role: item?.name,
//         name: item?.name,
//         id: item?.id,
//       }))
//       setRoleData(a ?? [])
//     } catch (e) {
//       setRoleData([])
//     }
//   }
//   const formBuilderProps = [
//     {
//       ...textField('first_name', 'First Name', 'Enter First Name', true),
//       value: rowData?.user?.first_name,
//       hidden: false,
//     },
//     {
//       ...textField('last_name', 'Last Name', 'Enter Last Name', true),
//       value: rowData?.user?.last_name,
//       hidden: false,
//     },
//     {
//       ...textField('job_title', 'Job Title', 'Enter Job Title', false),
//       value: rowData?.user?.job_title,
//       hidden: false,
//     },
//     {
//       ...textField('email', 'Email', 'Enter Email', true),
//       type: 'email',
//       value: rowData?.user?.username,
//       hidden: false,
//       disabled: edit,
//       toLowercase: true,
//     },
//     {
//       ...textField('password', 'Password', 'Enter Password', false),
//       type: 'password',
//       hidden: viewMode || edit ? true : false,
//     },
//     {
//       name: 'role',
//       label: 'Job Role',
//       required: true,
//       // getData: getRoleData,
//       id: 'role_id',
//       desc: 'name',
//       descId: 'id',
import { zodResolver } from '@hookform/resolvers/zod'
import { FormProvider, useForm } from 'react-hook-form'
import { useEffect } from 'react'
import ToggleSwitch from '../../../components/common/inputs/ToggleSwitch'
import { planFormSchema, PlanSchema } from './schema'
import FormBuilder from '../../../components/app/formBuilder'
import { DialogModal } from '../../../components/common'
// import InfoBox from '../../../components/app/alertBox/infoBox'
import { useCreatePlan, useUpdatePlan } from '../api'

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
  // handleRefresh,
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

  const { handleSubmit, reset } = methods
  const { mutate: createPlanMutate } = useCreatePlan()
  const { mutate: updatePlanMutate } = useUpdatePlan()
  const queryClient = useQueryClient()
  const onSubmit = (values: PlanSchema | any) => {
    // Do not send status from the form; backend will use its default or preserve existing
    // const { active: _omitActive, ...rest } = values || {}
    // const payload = { plan: { ...values } }
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

    const meditationIncluded = edit ? Boolean(values.meditation_included) : true
    fd.append(
      'plan[meditation_included]',
      String(meditationIncluded ? 'true' : 'false')
    )

    const thumbVal: any = values.thumbnail
    // Only append if a new File is provided (not just an existing URL/string)
    if (thumbVal && typeof thumbVal !== 'string') {
      fd.append('plan[thumbnail]', thumbVal) // field name as backend expects
    }
    if (edit && rowData?.plan?.id) {
      updatePlanMutate(
        { id: rowData.plan.id, payload: fd },
        { onSuccess: () => handleClose() }
      )
    } else {
      createPlanMutate(fd, {
        onSuccess: () => {
          // Refresh the listing and close
          queryClient.invalidateQueries(['plans_list'])
          handleClose()
        },
      })
    }
  }
  useEffect(() => {
    if (isDrawerOpen && edit && rowData) {
      reset({
        name: rowData?.plan?.name ?? '',
        category: rowData?.plan?.category ?? '',
        description: rowData?.plan?.description ?? '',
        duration_days: rowData?.plan?.duration_days ?? 0,
        fees: rowData?.plan?.fees ?? 0,
        yoga_included: Boolean(rowData?.plan?.yoga_included ?? false),
        meditation_included: Boolean(
          rowData?.plan?.meditation_included ?? false
        ),
        thumbnail: rowData?.plan?.thumbnail_url ?? '',
      })
    } else if (isDrawerOpen && !edit) {
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
  }, [isDrawerOpen, edit, rowData, reset])

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
  const existingImageFile = rowData?.plan?.thumbnail_url
    ? {
        name:
          String(rowData.plan.thumbnail_url).split('/').pop() ||
          String(rowData.plan.thumbnail_url),
        link: rowData.plan.thumbnail_url,
      }
    : undefined

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
      acceptedFiles: 'PNG, JPG, JPEG, WEBP (Max 5 MB)',
      fileSize: 5,
      selectedFiles: existingImageFile,
      subName: 'thumbnail',
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
      actionLabel={viewMode ? 'Edit' : edit ? 'Update' : 'Create'}
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
                    disabled
                    onChange={() =>
                      methods.setValue('meditation_included', true, {
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
