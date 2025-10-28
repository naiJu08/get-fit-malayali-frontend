import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import moment from 'moment'
import { useEffect, useState } from 'react'
import { FormProvider } from 'react-hook-form'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import FormBuilder from '../../components/app/formBuilder/index'
import { Icon } from '../../components/common'
import CustomDrawer from '../../components/common/drawer'
import CustomeSideViewer from '../../components/common/drawer/customeSideViewer'
// import FormFieldView from '../../components/common/inputs/FormFieldView'
import { useSnackbarManager } from '../../components/common/snackbar'
import { useDomainManageStore } from '../../store/domainManageStore'
import { useAssessorFilterStore } from '../../store/filterSore/assessorStore'
import { isValidFile } from '../../utilities/commonUtilities'
import { shortDate } from '../../utilities/format'
import { updateProfileAttachment, useEditMyProfile } from './api'
import { useAssessor } from './api'
import { handleReturnSchema } from './schema'

// import useParsedValue from '../../utilities/getTrimmed'

const MAX_FILE_SIZE = 5000000

export const ACCEPTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'application/pdf',
]
const assessorType = [
  {
    id: '1',
    name: 'Chair',
  },
  {
    id: '2',
    name: 'Lead',
  },
  {
    id: '3',
    name: 'Assessor',
  },
]
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
export default function MyProfileDrawer({
  isDrawerOpen,
  handleClose,
  edit,
  viewMode,
  setViewMode,
  setEdit,
  setEditViewIndicator,
}: Props) {
  const { pageParams } = useAssessorFilterStore()
  const { page, page_size, search, ordering, filters } = pageParams
  const { domainType } = useDomainManageStore()
  const { enqueueSnackbar } = useSnackbarManager()
  const [file, setFile] = useState<any>('')
  const [schema, setSchema] = useState(handleReturnSchema(domainType))

  const searchParams = {
    currentDomain: domainType,
    page: page,
    page_size: page_size,
    search: search,
    ordering: ordering,
    ...filters,
  }

  const { data, refetch } = useAssessor(searchParams)

  // const [profileLoading, SetProfileLoading] = useState<boolean>(true)

  // useEffect(() => {
  //   const intervalId = setTimeout(() => {
  //     SetProfileLoading(false)
  //   }, 2000)

  //   return () => clearTimeout(intervalId)
  // }, [data])

  const onInit = () => {
    return {
      first_name: data?.user?.first_name ?? '--',
      last_name: data?.user?.last_name ?? '--',
      username: data?.user?.username ?? '--',
      job_title: data?.user?.job_title ?? '--',
      phone: data?.phone ?? data?.contact_number,
      contact_number: data?.contact_number,
      organisation: data?.organisation,
      job_role: data?.job_role,
      join_date: data?.join_date,
      assessor_type: data?.assessor_type,
      description: data?.description,
    }
  }

  const methods = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues: {
      ...onInit(),
    },
  })

  useEffect(() => {
    // setProfileLoader(true)
    setSchema(handleReturnSchema(domainType))
    methods.reset({
      ...onInit(),
    })
    // setProfileLoader(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data])

  const textField = (
    name: string,
    label: string,
    placeholder: string,
    required = false,
    value: string,
    disabled = false
  ) => ({
    name,
    label,
    id: name,
    type: 'text',
    placeholder,
    ...(required ? { required: true } : {}),
    value,
    ...(disabled ? { disabled: true } : {}),
  })
  const formBuilderProps = [
    {
      ...textField(
        'first_name',
        'First Name',
        'Enter First Name',
        true,
        data?.user?.first_name ?? '--'
      ),
      hidden: false,
    },
    {
      ...textField(
        'last_name',
        'Last Name',
        'Enter Lat Name',
        true,
        data?.user?.last_name ?? '--'
      ),
      hidden: false,
    },
    {
      ...textField(
        'username',
        'Email',
        'Enter Email',
        true,
        data?.user?.username ?? '--',
        true
      ),
      hidden: false,
      toLowercase: true,
    },
    {
      ...textField(
        'contact_number',
        'Contact Number',
        'Enter Contact Number',
        true,
        data?.contact_number
      ),
      hidden: domainType !== 'Organisation',
    },
    {
      ...textField('phone', 'Phone', 'Enter Phone Number', true, data?.phone),
      hidden: domainType !== 'Assessor',
    },
    {
      ...textField(
        'job_role',
        'Job Role',
        'Enter Job Role',
        false,
        data?.user?.job_role ?? '--'
      ),
      hidden: domainType !== 'Assessor',
    },
    {
      ...textField(
        'job_title',
        'Job Title',
        'Enter Job Title',
        false,
        data?.user?.job_title ?? '--'
      ),
      hidden: domainType === 'Assessor',
    },
    {
      ...textField(
        'organisation',
        'Organisation',
        'Enter Organisation',
        false,
        data?.organisation
      ),
      hidden: domainType !== 'Assessor',
    },
    {
      ...textField(
        'join_date',
        'Join Date',
        'Enter Join Date',
        true,
        moment(data?.join_date).format('DD-MM-YYYY')
      ),
      maxDate: new Date(),
      type: 'date',
      hidden: domainType !== 'Assessor',
    },
    {
      name: 'assessor_type',
      label: 'Assessor Type',
      required: true,
      data: assessorType,
      async: false,
      id: 'assessor_type_id',
      descId: 'id',
      initialLoad: true,
      desc: 'name',
      type: 'custom_select',
      placeholder: 'Select Assessor Type',
      value: data?.assessor_type,
      hidden: domainType !== 'Assessor',
    },
    {
      name: 'description',
      label: 'Description',
      required: false,
      async: false,
      id: 'description',
      descId: 'id',
      initialLoad: true,
      type: 'textarea',
      placeholder: 'Enter Description',
      value: data?.description,
      wordCount: 400,
      hidden: domainType !== 'Assessor',
    },
  ]
  const queryClient = useQueryClient()
  const handleSubmission = () => {
    methods.reset({
      ...onInit(),
    })
    // handleRefresh()
    refetch()
    setEdit?.(false)
    setViewMode?.(true)
    if (domainType === 'Assessor')
      queryClient.invalidateQueries('assessor_list')
    else if (domainType === 'Employee')
      queryClient.invalidateQueries('admin_user_list')
    // else if (domainType === 'Organisation') console.log('00000000000000000000')
    // queryClient.invalidateQueries('organization_user_list')
  }

  const { mutate, isLoading } = useEditMyProfile(handleSubmission)
  const onSubmit = (data: any) => {
    domainType === 'Assessor'
      ? mutate({
          input: {
            first_name: data?.first_name,
            last_name: data?.last_name,
            job_role: data?.job_role,
            phone: data?.phone,
            organisation: data?.organisation,
            join_date: data?.join_date,
            assessor_type: data?.assessor_type,
            description: data?.description,
          },
          domain: { domain: 'Assessor' },
        })
      : mutate({
          input: {
            first_name: data?.first_name,
            last_name: data?.last_name,
            username: data?.username,
            job_title: data?.job_title,
            phone: data?.contact_number,
          },
          domain: { domain: domainType },
        })
  }
  const { handleSubmit } = methods

  const supportedFiles = 'PNG, PDF,JPG, SVG '
  const handleFileChange = (e: any) => {
    if (e.target.files.length) {
      let isValid = true
      if (supportedFiles?.length) {
        isValid = isValidFile(e?.target?.files[0].type, ACCEPTED_IMAGE_TYPES)
      } else {
        isValid = true
      }
      if (isValid) {
        setFile(e?.target?.files[0])
        // setAttachmentName?.(e?.target?.files[0]?.name)
        // }
      } else {
        enqueueSnackbar('Invalid file type', { variant: 'error' })
      }
    }
  }

  useEffect(() => {
    if (file) {
      handleFileUpload()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file])

  const handleFileUpload = () => {
    // if (file) {
    //   const validationResult = logoSchema.safeParse({ file })
    //   if (!validationResult.success) {
    //     enqueueSnackbar(
    //       validationResult.error.errors.map((err) => err.message).join(', '),
    //       {
    //         variant: 'error',
    //       }
    //     )
    //     return
    //   }
    // }
    const formData = new FormData()
    formData.append('file', file)

    updateProfileAttachment(formData)
      .then((res: any) => {
        enqueueSnackbar(
          res.message ? res.message : 'Profile Picture Updated Successfully',
          {
            variant: 'success',
          }
        )
        refetch()
      })
      .catch((err) => {
        enqueueSnackbar(
          err?.response?.data?.error?.message || err?.response?.data?.message,
          { variant: 'error' }
        )
      })
  }

  const handleChangeMode = () => {
    setViewMode?.(false)
    setEdit?.(true)
    setEditViewIndicator?.(true)
  }
  // const { parsedValue } = useParsedValue(data?.description)

  const viewHeaderData = {
    image:
      domainType === 'Employee'
        ? (data?.user?.profile_image ?? '/images/profile.png')
        : (data?.profile_image ?? '/images/profile.png'),

    title: `${data?.user?.first_name ? data?.user?.first_name : '--'} ${data?.user?.last_name ? data?.user?.last_name : '--'} `,

    subTitle:
      domainType === 'Assessor'
        ? (data?.assessor_type ?? '--')
        : (data?.user?.job_title ?? '--'),
  }

  const viewContentAdminData = [
    {
      title: 'Communications',
      value: [
        {
          label: 'email',
          icon: 'email',
          value: data?.user?.username,
        },
      ],
    },
  ]
  const viewContentData = [
    {
      title: 'Communications',
      value: [
        {
          label: 'email',
          icon: 'email',
          value: data?.user?.username,
        },
        {
          label: 'phone',
          icon: 'phone',
          value: data?.contact_number ?? data?.phone ?? '--',
        },
      ],
    },
    ...(domainType === 'Assessor'
      ? [
          {
            title: 'Organisation',
            value: data?.organisation,
          },
          {
            title: 'Join Date',
            value: data?.join_date ? shortDate(data?.join_date) : '--',
          },
          {
            title: 'Job Role',
            value: data?.job_role ?? '--',
          },
          {
            title: 'Description',
            value: data?.description,
            isHtmlView: true,
          },
        ]
      : []),
  ]

  return (
    <CustomDrawer
      viewMode={viewMode}
      className="formDrawer"
      open={isDrawerOpen}
      // actionLabel={'Save'}
      actionLabel={viewMode ? 'Edit' : 'Save'}
      handleClose={() => handleClose()}
      // hideSubmit={viewMode ? true : false}
      actionLoader={isLoading}
      handleSubmit={
        viewMode ? handleChangeMode : handleSubmit((data) => onSubmit(data))
      }
      title={edit ? 'Edit My Profile' : 'My Profile'}
    >
      <div className="flex flex-col gap-4">
        {edit ? (
          <>
            <div>
              <input
                className="hidden"
                id={'avatar'}
                disabled={edit ? false : true}
                onChange={handleFileChange}
                type={'file'}
                accept={supportedFiles}
                size={MAX_FILE_SIZE}
              />
              <label
                className="flex flex-col items-center justify-center gap-2 cursor-pointer p-4 w-full bg-bgGrey rounded-md py-5"
                htmlFor={'avatar'}
              >
                <div className="w-[100px] h-[100px] rounded-md overflow-hidden relative duration-100  bg-bgGrey flex items-center justify-center">
                  <img
                    className="w-full h-full object-cover "
                    alt=""
                    src={
                      domainType === 'Employee'
                        ? (data?.user?.profile_image ?? '/images/profile.png')
                        : (data?.profile_image ?? '/images/profile.png')
                    }
                  />
                  <div className="items-center justify-center w-full h-full bg-stone-700 duration-300 opacity-0 hover:opacity-100 transition-opacity bg-opacity-60 gap-2 absolute inset-0 z-20 flex ">
                    <Icon name="camera" className="text-white" />
                  </div>
                </div>
              </label>
            </div>
            <FormProvider {...methods}>
              <FormBuilder data={formBuilderProps} edit={true} />
            </FormProvider>
          </>
        ) : (
          <CustomeSideViewer
            headerData={viewHeaderData}
            contentData={
              domainType === 'Admin' ? viewContentAdminData : viewContentData
            }
          />
        )}
      </div>
    </CustomDrawer>
  )
}
