import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { FormProvider } from 'react-hook-form'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'

// import { Button, Icon } from 'react-hook-form'
import FormBuilder from '../../components/app/formBuilder/index'
import { Button, Icon } from '../../components/common'
import Icons from '../../components/common/icons'
import FormFieldView from '../../components/common/inputs/FormFieldView'
import { useSnackbarManager } from '../../components/common/snackbar'
import { useDomainManageStore } from '../../store/domainManageStore'
import { useAssessorFilterStore } from '../../store/filterSore/assessorStore'
import { isValidFile } from '../../utilities/commonUtilities'
// import { updateProfileAttachment, useEditMyProfile } from '../../utilities/commonUtilities'
import { useEditMyProfile, updateProfileAttachment } from './api'
import { useAssessor } from './api'
import { myProfileSchema, MyProfileSchema } from './schema'

const MAX_FILE_SIZE = 5000000

export const ACCEPTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'application/pdf',
  // 'application/msword', // .doc
  // 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  // 'application/vnd.ms-excel', // .xls
  // 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]
const Profile = () => {
  const [isEditing, setIsEditing] = useState(false)

  const navigate = useNavigate()
  const { pageParams } = useAssessorFilterStore()
  const { page, page_size, search, ordering, filters } = pageParams
  // const { enqueueSnackbar } = useSnackbarManager()
  // const [file, setFile] = useState<any>(value)
  const { domainType } = useDomainManageStore()
  const { enqueueSnackbar } = useSnackbarManager()
  const [file, setFile] = useState<any>('')
  // const [attachmentName, setAttachmentName] = useState<any>('')

  const searchParams = {
    currentDomain: domainType,
    page: page,
    page_size: page_size,
    search: search,
    ordering: ordering,
    ...filters,
  }

  const { data, refetch } = useAssessor(searchParams)

  const handleEditClick = () => {
    setIsEditing(!isEditing)
  }

  const onInit = () => {
    return {
      first_name: data?.user?.first_name ?? '--',
      last_name: data?.user?.last_name ?? '--',
      username: data?.user?.username ?? '--',
      job_title: data?.user?.job_title ?? '--',
    }
  }

  const methods = useForm<MyProfileSchema>({
    resolver: zodResolver(myProfileSchema),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues: {
      ...onInit(),
    },
  })

  useEffect(() => {
    methods.reset({
      ...onInit(),
    })
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
    textField(
      'first_name',
      'First Name',
      'Enter First Name',
      true,
      data?.user?.first_name ?? '--'
    ),
    textField(
      'last_name',
      'Last Name',
      'Enter Lat Name',
      true,
      data?.user?.last_name ?? '--'
    ),
    textField(
      'username',
      'Email',
      'Enter Email',
      true,
      data?.user?.username ?? '--',
      true
    ),
    textField(
      'job_title',
      'Job Role',
      'Enter Job Role',
      true,
      data?.user?.job_title ?? '--'
    ),
  ]

  const handleCancel = () => {
    methods.reset({
      ...onInit(),
    })
    setIsEditing(false)
  }
  const handleSubmission = () => {
    methods.reset({
      ...onInit(),
    })
    // handleRefresh()
    refetch()
    setIsEditing(false)
  }

  const { mutate, isLoading } = useEditMyProfile(handleSubmission)
  const onSubmit = (data: MyProfileSchema) => {
    domainType === 'Assessor'
      ? mutate({
          input: {
            first_name: data?.first_name,
            last_name: data?.last_name,
            job_role: data?.job_title,
          },
          domain: { domain: 'Assessor' },
        })
      : mutate({
          input: {
            first_name: data?.first_name,
            last_name: data?.last_name,
            username: data?.username,
            job_title: data?.job_title,
          },
          domain: { domain: domainType },
        })
  }
  const { handleSubmit } = methods

  const renderFields = () => {
    return (
      <>
        {isEditing ? (
          <FormProvider {...methods}>
            <FormBuilder data={formBuilderProps} edit={true} />
          </FormProvider>
        ) : (
          formBuilderProps.map((data) => (
            <FormFieldView
              value={data?.value}
              type={data?.type}
              // required={data.required}
              label={data.label}
              key={data?.id}
            />
          ))
        )}
      </>
    )
  }
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

  return (
    <>
      <div className="shadow-2xl mx-28 my-28 h-full lg:h-3/4 relative">
        <div className="absolute right-3 top-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="absolute top-4 right-2 p-0  bg-transparent text-sm w-8 h-8 ml-auto inline-flex justify-center items-center text-primaryText dark:text-white"
              data-modal-hide="popup-modal"
              onClick={() => {
                navigate(-1)
              }}
              data-testid="close-icon"
            >
              <Icon
                name="close-popup"
                className="flex items-center justify-center pr-1  text-primaryText dark:text-white"
                data-testid="button-icon-left"
              />
            </button>

            {
              <div className="iconBlack cursor-pointer mt-6 mr-14">
                {isEditing ? (
                  <div className="flex gap-2">
                    <div>
                      <Button
                        onClick={handleCancel}
                        size="xs"
                        label="Cancel"
                        outlined={true}
                        className="secondaryButton"
                      />
                    </div>
                    <div>
                      <Button
                        className="primaryButton"
                        size="xs"
                        label="Save"
                        isLoading={isLoading}
                        outlined={false}
                        onClick={handleSubmit((data) => onSubmit(data))}
                      />
                    </div>
                  </div>
                ) : (
                  <Icons onClick={handleEditClick} name="edit" />
                )}
              </div>
            }
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 ">
          <div className="lg:col-span-1">
            <div className="row">
              <div className="col-md-3">
                <div className="d-flex flex-column align-items-center text-center p-3 py-5">
                  <div className="pt-5">
                    <input
                      className="hidden"
                      id={'avatar'}
                      disabled={false}
                      // multiple={isMultiple}
                      onChange={handleFileChange}
                      // value={value}
                      type={'file'}
                      accept={supportedFiles}
                      size={MAX_FILE_SIZE}
                    />
                    <label
                      className="flex flex-col items-center justify-center gap-2 cursor-pointer p-4 w-full min-h-[120px]"
                      htmlFor={'avatar'}
                    >
                      <img
                        className="rounded-circle my-5 mx-auto"
                        width="150px"
                        alt=""
                        // src="/images/profile.png"
                        src={data?.user?.profile_image ?? '/images/profile.png'}
                      />
                    </label>
                  </div>
                  <div>
                    <div>
                      <span className="font-bold">
                        {`${data?.user?.first_name} ${data?.user?.last_name || '--'}`}
                      </span>
                    </div>
                    <div className="text-black-50 mb-3">
                      {data?.user?.username || '--'}
                    </div>
                    {data?.user?.is_admin ? (
                      <span
                        className="tag bg-success text-white "
                        style={{ padding: 5 }}
                      >
                        Admin
                      </span>
                    ) : data?.user?.is_operations_head ? (
                      <span
                        className="tag bg-success text-white"
                        style={{ padding: 5 }}
                      >
                        Operations Head
                      </span>
                    ) : (
                      ''
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="lg:col-span-1 mt-20 px-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold"> My Profile</h4>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">{renderFields()}</div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Profile
