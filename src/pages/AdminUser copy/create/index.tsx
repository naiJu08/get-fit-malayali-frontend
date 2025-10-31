import { zodResolver } from '@hookform/resolvers/zod'
import moment from 'moment'
// import moment from 'moment'
import { useEffect, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'

import InfoBox from '../../../components/app/alertBox/infoBox'
import FormBuilder from '../../../components/app/formBuilder'
import { DialogModal } from '../../../components/common'
import CustomDrawer from '../../../components/common/drawer'
import CustomeSideViewer from '../../../components/common/drawer/customeSideViewer'
import { humanizeDatetime } from '../../../utilities/format'
// import { getRoles, useCreateAdmin, useUpdateAdmin } from '../../organisation/common/commonUtils'
// import FormFieldView from '../../../components/common/inputs/FormFieldView'
import { getRoles, useCreateAdmin, useUpdateAdmin } from '../api'
import { ACCEPTED_IMAGE_TYPES, AdminSchema, formSchema } from './schema'

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
  const [roleData, setRoleData] = useState<any[]>([])
  const [deleteModal, setDeleteModal] = useState(false)
  // const [profileLoading, SetProfileLoading] = useState<boolean>(true)

  useEffect(() => {
    if (isDrawerOpen) {
      getRoleData()
    }
  }, [isDrawerOpen])

  const statusData = [
    {
      id: '1',
      name: 'Active',
    },
    {
      id: '2',
      name: 'Inactive',
    },
  ]
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
  const getRoleData = async () => {
    try {
      const res = await getRoles()
      const items = res?.items ?? []
      const a = items?.map((item: any) => ({
        ...item,
        role: item?.name,
        name: item?.name,
        id: item?.id,
      }))
      setRoleData(a ?? [])
    } catch (e) {
      setRoleData([])
    }
  }
  const formBuilderProps = [
    {
      ...textField('first_name', 'First Name', 'Enter First Name', true),
      value: rowData?.user?.first_name,
      hidden: false,
    },
    {
      ...textField('last_name', 'Last Name', 'Enter Last Name', true),
      value: rowData?.user?.last_name,
      hidden: false,
    },
    {
      ...textField('job_title', 'Job Title', 'Enter Job Title', false),
      value: rowData?.user?.job_title,
      hidden: false,
    },
    {
      ...textField('email', 'Email', 'Enter Email', true),
      type: 'email',
      value: rowData?.user?.username,
      hidden: false,
      disabled: edit,
      toLowercase: true,
    },
    {
      ...textField('password', 'Password', 'Enter Password', false),
      type: 'password',
      hidden: viewMode || edit ? true : false,
    },
    {
      name: 'role',
      label: 'Job Role',
      required: true,
      // getData: getRoleData,
      id: 'role_id',
      desc: 'name',
      descId: 'id',
      data: roleData.length > 0 ? roleData[0] : null,
      type: 'custom_select',
      placeholder: 'Role',
      async: false,
      initialLoad: true,
      value: rowData?.user?.group?.name,
      hidden: true,
    },
    {
      name: 'profile_image',
      required: false,
      label: 'Upload Picture',
      id: 'attachment',
      selectedFiles: rowData?.user?.profile_image
        ? {
            name: rowData?.user?.file_name,
            // name: getFileName(rowData?.user?.profile_image),
            link: rowData?.profile_image,
          }
        : '',
      descId: 'id',
      supportedExtensions: ACCEPTED_IMAGE_TYPES,
      supportedFiles: ACCEPTED_IMAGE_TYPES,
      acceptedFiles: 'JPEG, JPG, PNG ',
      type: 'file_upload',
      value: (
        <>
          {rowData?.user?.profile_image ? (
            <span style={{ display: 'flex', alignItems: 'center' }}>
              {rowData?.user?.file_name}
              {/* {getFileName(rowData?.user?.profile_image) ?? 'File'} */}
            </span>
          ) : (
            <>--</>
          )}
        </>
      ),
      needConfirmation: true,
      handleDeleteFile: handleDeleteFile,
    },
    {
      name: 'status',
      label: 'Status',
      id: 'status_id',
      desc: 'name',
      descId: 'id',
      data: statusData,
      type: 'custom_select',
      placeholder: 'Select Status',
      async: false,
      initialLoad: true,
      value: rowData?.user?.status,
      hidden: false,
      required: true,
    },
    {
      ...textField('last_login', 'Last Login', ''),
      maxDate: new Date(),
      type: 'date',
      // value: rowData?.user?.last_login
      //   ? moment(rowData?.user?.last_login).format('DD-MM-YYYY')
      //   : '--',
      value: rowData?.user?.last_login_days_ago ?? '- -',
      hidden: viewMode ? false : true,
    },
    {
      ...textField('datetime_created', 'Created At', ''),
      maxDate: new Date(),
      type: 'date',
      // value: rowData?.user?.datetime_created
      //   ? moment(rowData?.user?.datetime_created).format('DD-MM-YYYY')
      //   : '--',
      value: rowData?.user?.datetime_created ?? '- -',
      hidden: viewMode ? false : true,
    },
    {
      ...textField('datetime_updated', 'Updated At', ''),
      maxDate: new Date(),
      type: 'date',
      // value: rowData?.user?.datetime_updated
      //   ? moment(rowData?.user?.datetime_updated).format('DD-MM-YYYY')
      //   : '--',
      value: rowData?.user?.datetime_updated ?? '- -',
      hidden: viewMode ? false : true,
    },
  ]

  // const getAdminDetails = (name: any) => {
  //   const property = formBuilderProps.find((prop) => prop.name === name)
  //   // return property ? property.value : '--'
  //   return property && property.value ? property.value : '--'
  // }

  const handleClearAndClose = () => {
    methods.reset({
      first_name: '',
      last_name: '',
      email: '',
      password: '',
      profile_image: null,
      role: '',
      role_id: null,
      status: '',
      status_id: '',
      job_title: '',
    })
    handleClose()
  }

  const handleSubmission = () => {
    methods.reset({
      first_name: '',
      last_name: '',
      email: '',
      password: '',
      role: '',
      role_id: null,
      status: '',
      status_id: '',
      job_title: '',
      profile_image: null,
    })

    handleRefresh?.()
    handleClearAndClose()
  }
  useEffect(() => {
    if (isDrawerOpen) {
      if (!viewMode && edit) {
        methods.reset({
          first_name: rowData?.user?.first_name ?? '',
          last_name: rowData?.user?.last_name ?? '',
          job_title: rowData?.user?.job_title ?? '',
          email: rowData?.user?.username ?? '',
          role_id: rowData?.user?.group?.id ?? null,
          role: rowData?.user?.group?.name ?? '',
          status: rowData?.user?.status ?? '',
          profile_image: rowData?.profile_image,
        })
      }
    }
  }, [viewMode, edit])
  const onSuccess = () => {
    handleSubmission()
  }
  const { mutate, isLoading: isCreating } = useCreateAdmin(onSuccess)
  const { mutate: updateMutation, isLoading: isUpdating } =
    useUpdateAdmin(onSuccess)

  const methods = useForm<AdminSchema>({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
    reValidateMode: 'onChange',
  })
  const { handleSubmit } = methods
  const onSubmit = (details: any) => {
    const formData = new FormData()
    if (rowData?.user?.id) {
      formData.append('first_name', details?.first_name ?? '')
      formData.append('last_name', details?.last_name ?? '')
      formData.append('job_title', details?.job_title ?? '')
      formData.append('username', details?.email ?? '')
      formData.append(
        'role_id',
        roleData.length > 0 ? (roleData[0]['id'] ?? '') : ''
      )

      formData.append('status', details?.status ?? '')

      if (typeof details?.profile_image == 'object') {
        formData.append('profile_image', details?.profile_image ?? '')
      } else if (details?.profile_image?.length === 0) {
        formData.append('profile_image', '')
      }

      updateMutation({ id: rowData?.user?.id, data: formData })
    } else {
      formData.append('first_name', details?.first_name ?? '')
      formData.append('last_name', details?.last_name ?? '')
      formData.append('job_title', details?.job_title ?? '')
      formData.append('username', details?.email ?? '')
      formData.append(
        'role_id',
        roleData.length > 0 ? (roleData[0]['id'] ?? '') : ''
      )

      formData.append('status', details?.status ?? '')
      formData.append('password', details?.password ?? '')

      if (typeof details?.profile_image == 'object') {
        formData.append('profile_image', details?.profile_image ?? '')
      } else if (details?.profile_image?.length === 0) {
        formData.append('profile_image', '')
      }

      mutate(formData)
    }
    // if (rowData?.user?.id) {
    //   const result_data = {
    //     first_name: details?.first_name ?? '',
    //     last_name: details?.last_name ?? '',
    //     job_title: details?.job_title,
    //     username: details?.email ?? '',
    //     role_id: roleData.length > 0 ? roleData[0]['id'] ?? null : null,
    //     status: details?.status ?? '',
    //   }
    //   updateMutation({ id: rowData?.user?.id, data: result_data })
    // } else {
    //   const result = {
    //     first_name: details?.first_name ?? '',
    //     last_name: details?.last_name ?? '',
    //     job_title: details?.job_title,
    //     username: details?.email ?? '',
    //     password: details?.password ?? '',
    //     role_id: roleData.length > 0 ? roleData[0]['id'] ?? null : null,
    //     status: details?.status ?? '',
    //   }
    //   mutate(result)
    // }
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
      <CustomDrawer
        viewMode={viewMode}
        className="formDrawer"
        open={isDrawerOpen}
        actionLabel={viewMode ? 'Edit' : 'Save'}
        handleClose={() => handleClearAndClose()}
        // hideSubmit={viewMode ? true : false}
        actionLoader={isCreating || isUpdating}
        handleSubmit={
          viewMode ? handleChangeMode : handleSubmit((data) => onSubmit(data))
        }
        title={
          edit
            ? 'Edit Administrator Details'
            : viewMode
              ? 'Administrator Details'
              : 'Create Admin User'
        }
      >
        <div className="flex flex-col gap-4">
          {!viewMode ? (
            <>
              <FormProvider {...methods}>
                <FormBuilder data={formBuilderProps} edit={true} />
              </FormProvider>
              <InfoBox
                content={`Create a new Diversity Mark administrator user by completing the form and send them an invitation to set their password for accessing the Administrator Portal.`}
              />
            </>
          ) : (
            <CustomeSideViewer
              headerData={viewHeaderData}
              contentData={viewContentData}
            />
          )}
        </div>
      </CustomDrawer>
    </>
  )
}
