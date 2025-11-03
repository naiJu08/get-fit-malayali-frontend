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
    // Normalize checkbox to strict boolean
    const toBool = (v: any) => {
      if (typeof v === 'boolean') return v
      if (typeof v === 'number') return v === 1
      if (typeof v === 'string') {
        const s = v.trim().toLowerCase()
        if (s === 'true' || s === '1' || s === 'on' || s === 'yes') return true
        if (s === 'false' || s === '0' || s === 'off' || s === 'no' || s === '')
          return false
      }
      return !!v
    }
    const payload = { plan: { ...values, active: toBool(values?.active) } }
    if (edit && rowData?.plan?.id) {
      updatePlanMutate(
        { id: rowData.plan.id, payload },
        { onSuccess: () => handleClose() }
      )
    } else {
      createPlanMutate(payload, {
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
        active: rowData?.plan?.active,
      })
    } else if (isDrawerOpen && !edit) {
      reset({
        name: '',
        category: '',
        description: '',
        duration_days: 0,
        active: false,
      })
    }
  }, [isDrawerOpen, edit, rowData, reset])

  const formFields = [
    {
      name: 'name',
      label: 'Plan Name',
      type: 'text',
      placeholder: 'Enter plan name',
      required: true,
    },
    {
      name: 'category',
      label: 'Category',
      type: 'text',
      placeholder: 'Enter category',
      required: true,
    },
    {
      name: 'description',
      label: 'Description',
      type: 'textarea',
      placeholder: 'Enter plan description',
      required: true,
    },
    {
      name: 'duration_days',
      label: 'Duration (Days)',
      type: 'text',
      placeholder: 'Enter duration in days',
      required: true,
    },
    {
      name: 'active',
      label: 'Status',
      type: 'custom_select',
      // map selection to boolean using desc: 'value'
      desc: 'value',
      descId: 'id',
      id: 'active_id',
      placeholder: 'Select status',
      initialLoad: true ? 'Active' : 'Inactive',
      data: [
        { id: 'active', name: 'Active', value: 'Active' },
        { id: 'inactive', name: 'Inactive', value: 'Inactive' },
      ],
      required: true,
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
      actionLabel={viewMode ? 'Edit' : edit ? 'Update' : 'create'}
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
                <FormBuilder data={formFields} edit={true} />
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
