import { zodResolver } from '@hookform/resolvers/zod'
import moment from 'moment'
// import moment from 'moment'
import { useEffect, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'

import InfoBox from '../../../components/app/alertBox/infoBox'
import FormBuilder from '../../../components/app/formBuilder'
import { DialogModal } from '../../../components/common'
import CustomeSideViewer from '../../../components/common/drawer/customeSideViewer'
import { humanizeDatetime } from '../../../utilities/format'
// import { getRoles, useCreateAdmin, useUpdateAdmin } from '../../organisation/common/commonUtils'
// import FormFieldView from '../../../components/common/inputs/FormFieldView'
import { useCreateAdmin, useUpdateAdmin } from '../api'
import { AdminSchema, formSchema, formSchemaNutritionist } from './schema'

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
  activeRole?: 'user' | 'nutritionist'
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
  activeRole,
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

  const isNutritionistTab = activeRole === 'nutritionist'
  const formBuilderProps = [
    { ...textField('name', 'Name', 'Enter full name', true) },
    {
      ...textField('email', 'Email', 'Enter email', true),
      type: 'email',
      toLowercase: true,
      disabled: edit,
    },
    {
      ...textField('password', 'Password', 'Enter password', !edit),
      type: 'password',
      hidden: edit || viewMode ? true : false,
    },
    {
      ...textField(
        'password_confirmation',
        'Confirm Password',
        'Re-enter password',
        !edit
      ),
      type: 'password',
      hidden: edit || viewMode ? true : false,
    },
    {
      ...textField('phone', 'Phone Number', 'Enter phone number', true),
      type: 'number',
      allowPositiveOnly: true,
    },

    {
      name: 'role',
      label: 'Role',
      required: true,
      id: 'role_id',
      desc: 'name',
      descId: 'id',
      data: [
        { id: 2, name: 'Nutritionist' },
        { id: 3, name: 'Client' },
      ],
      type: 'custom_select',
      placeholder: 'Select role',
      async: false,
      initialLoad: true,
      disabled: true,
    },
    {
      name: 'gender',
      label: 'Gender',
      required: true,
      id: 'gender',
      desc: 'name',
      descId: 'id',
      data: [
        { id: '0', name: 'Male' },
        { id: '1', name: 'Female' },
        { id: '2', name: 'Other' },
      ],
      type: 'custom_select',
      placeholder: 'Select gender',
      async: false,
      initialLoad: true,
    },
    {
      name: 'date_of_birth',
      label: 'Date of Birth',
      type: 'date',
      required: true,
    },
    ...(!isNutritionistTab
      ? [
          {
            ...textField('height', 'Height (cm)', 'Enter height in cm', true),
            type: 'text',
            allowPositiveOnly: true,
          },
          {
            ...textField('weight', 'Weight (kg)', 'Enter weight in kg', true),
            type: 'text',
            allowPositiveOnly: true,
          },
          {
            name: 'lifestyle',
            label: 'Lifestyle',
            id: 'lifestyle',
            desc: 'name',
            descId: 'id',
            data: [
              { id: 'Mostly sitting', name: 'Mostly sitting' },
              {
                id: 'Standing and light movement',
                name: 'Standing and light movement',
              },
              { id: 'Active lifestyle', name: 'Active lifestyle' },
              {
                id: 'Physically intense lifestyle',
                name: 'Physically intense lifestyle',
              },
            ],
            type: 'custom_select',
            placeholder: 'Select Lifestyle',
            async: false,
            initialLoad: true,
          },
          { ...textField('goal', 'Goal', 'e.g., Muscle Gain') },
          {
            name: 'food_preferences',
            label: 'Food Preferences',
            id: 'food_preferences',
            desc: 'name',
            descId: 'id',
            data: [
              { id: 'Vegetarian', name: 'Vegetarian' },
              { id: 'Non-Vegetarian', name: 'Non-Vegetarian' },
              { id: 'Eggetarian', name: 'Eggetarian' },
              { id: 'Vegan', name: 'Vegan' },
              { id: 'Pescatarian', name: 'Pescatarian' },
            ],
            type: 'custom_select',
            placeholder: 'Select Food Preference',
            async: false,
            initialLoad: true,
          },
          {
            name: 'medical_conditions',
            label: 'Medical Conditions',
            id: 'medical_conditions',
            desc: 'name',
            descId: 'id',
            data: [
              { id: 'None', name: 'None' },
              { id: 'PCOD', name: 'PCOD' },
              { id: 'Diabetes', name: 'Diabetes' },
              { id: 'Hypertension', name: 'Hypertension' },
            ],
            type: 'custom_select',
            placeholder: 'Select Medical Condition',
            async: false,
            initialLoad: true,
          },
          {
            name: 'food_allergies',
            label: 'Food Allergies',
            id: 'food_allergies',
            desc: 'name',
            descId: 'id',
            data: [
              { id: 'Peanuts', name: 'Peanuts' },
              { id: 'Tree nuts', name: 'Tree nuts' },
              { id: 'Gluten', name: 'Gluten' },
              { id: 'Shellfish', name: 'Shellfish' },
              {
                id: 'Latex fruit syndrome',
                name: 'Latex fruit syndrome',
              },
            ],
            type: 'custom_select',
            placeholder: 'Select Food Allergy',
            async: false,
            initialLoad: true,
          },
          { ...textField('ethnicity', 'Ethnicity', 'e.g., Indian') },
        ]
      : []),
  ]

  // const getAdminDetails = (name: any) => {
  //   const property = formBuilderProps.find((prop) => prop.name === name)
  //   // return property ? property.value : '--'
  //   return property && property.value ? property.value : '--'
  // }

  const handleClearAndClose = () => {
    methods.reset({
      name: '',
      email: '',
      password: '',
      password_confirmation: '',
      phone: '',
      role: '',
      role_id: '',
      gender: '',
      date_of_birth: '',
      height: 0,
      weight: 0,
      lifestyle: '',
      goal: '',
      food_preferences: '',
      medical_conditions: '',
      food_allergies: '',
      ethnicity: '',
    } as any)
    handleClose()
  }

  const handleSubmission = () => {
    methods.reset({
      name: '',
      email: '',
      password: '',
      password_confirmation: '',
      phone: '',
      role: '',
      role_id: '',
      gender: '',
      date_of_birth: '',
      height: 0,
      weight: 0,
      lifestyle: '',
      goal: '',
      food_preferences: '',
      medical_conditions: '',
      ethnicity: '',
    } as any)

    handleRefresh?.()
    handleClearAndClose()
  }
  useEffect(() => {
    if (isDrawerOpen) {
      if (!viewMode && edit) {
        methods.reset({
          name:
            rowData?.user?.first_name && rowData?.user?.last_name
              ? `${rowData?.user?.first_name} ${rowData?.user?.last_name}`
              : (rowData?.user?.name ?? ''),
          email: rowData?.user?.username ?? rowData?.user?.email ?? '',
          phone: rowData?.user?.phone ?? '',
          role_id: rowData?.user?.group?.id ?? rowData?.user?.role ?? '',
          role: (() => {
            const r = rowData?.user?.group?.id ?? rowData?.user?.role
            if (r === 2 || r === '2') return 'Nutritionist'
            if (r === 3 || r === '3') return 'Client'
            if (typeof r === 'string') return r
            return ''
          })(),
          gender: rowData?.user?.gender ?? '',
          date_of_birth: rowData?.user?.date_of_birth ?? '',
          height: rowData?.user?.height ?? 0,
          weight: rowData?.user?.weight ?? 0,
          lifestyle: rowData?.user?.lifestyle ?? '',
          goal: rowData?.user?.goal ?? '',
          food_preferences: rowData?.user?.food_preferences ?? '',
          medical_conditions: rowData?.user?.medical_conditions ?? '',
          food_allergies: rowData?.user?.food_allergies ?? '',
          ethnicity: rowData?.user?.ethnicity ?? '',
        } as any)
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
    resolver: zodResolver(
      isNutritionistTab && !edit ? formSchemaNutritionist : formSchema
    ),
    mode: 'onChange',
    reValidateMode: 'onChange',
  })
  const { handleSubmit } = methods
  // Prefill role based on active tab when creating (not edit/view)
  useEffect(() => {
    if (isDrawerOpen && !edit && !viewMode) {
      const defaultRoleId = activeRole === 'nutritionist' ? 2 : 3
      const defaultRoleLabel = defaultRoleId === 2 ? 'Nutritionist' : 'Client'
      methods.setValue('role_id' as any, defaultRoleId as any, {
        shouldValidate: true,
        shouldDirty: true,
      })
      methods.setValue('role' as any, defaultRoleLabel as any, {
        shouldValidate: true,
        shouldDirty: true,
      })
    }
  }, [isDrawerOpen, activeRole, edit, viewMode])
  // Ensure role display is always label, not numeric id
  useEffect(() => {
    if (!isDrawerOpen) return
    const v: any = (methods as any).getValues?.() || {}
    const currentRole = v?.role
    if (
      typeof currentRole === 'number' ||
      (typeof currentRole === 'string' && /^\d+$/.test(currentRole))
    ) {
      const id =
        typeof currentRole === 'number'
          ? currentRole
          : parseInt(currentRole, 10)
      const label = id === 2 ? 'Nutritionist' : id === 3 ? 'Client' : ''
      if (label) {
        methods.setValue('role' as any, label as any, {
          shouldValidate: true,
          shouldDirty: true,
        })
      }
    }
  }, [isDrawerOpen])
  // Keep role label in sync with role_id at all times
  const roleIdValue = (methods as any).watch?.('role_id')
  useEffect(() => {
    if (!isDrawerOpen) return
    const id = roleIdValue
    const label =
      id === 2 || id === '2'
        ? 'Nutritionist'
        : id === 3 || id === '3'
          ? 'Client'
          : ''
    if (label) {
      const currentRole = (methods as any).getValues?.('role')
      if (currentRole !== label) {
        methods.setValue('role' as any, label as any, {
          shouldValidate: true,
          shouldDirty: true,
        })
      }
    }
  }, [roleIdValue, isDrawerOpen])
  const onSubmit = (details: any) => {
    const pickId = (v: any, fallback = 0) => {
      if (v === null || v === undefined) return fallback
      if (typeof v === 'object') {
        const maybe = v?.id ?? v?.value
        if (typeof maybe === 'number') return maybe
        if (typeof maybe === 'string') {
          return /^\d+$/.test(maybe) ? parseInt(maybe, 10) : fallback
        }
        return fallback
      }
      if (typeof v === 'number') return v
      if (typeof v === 'string') {
        return /^\d+$/.test(v) ? parseInt(v, 10) : fallback
      }
      return fallback
    }
    const rawRole = details?.role_id ?? details?.role
    let roleId = pickId(rawRole, 0)
    if (!roleId) {
      const mapRoleName = (s: any) => {
        const t = (typeof s === 'string' ? s : s?.name)?.toLowerCase?.() || ''
        if (t === 'admin') return 1
        if (t === 'nutritionist') return 2
        if (t === 'user' || t === 'client') return 3
        return 0
      }
      roleId = mapRoleName(rawRole)
    }
    if (!roleId) {
      const roleLabel =
        (typeof rawRole === 'string'
          ? rawRole
          : (rawRole?.name ?? '')
        ).toLowerCase?.() || ''
      if (roleLabel === 'user' || roleLabel === 'client') {
        roleId = 3
      }
    }
    const mapGenderName = (s: string) => {
      const t = s?.toLowerCase?.() || ''
      if (t === 'male') return 0
      if (t === 'female') return 1
      if (t === 'other') return 2
      return 0
    }
    const genderId = (() => {
      const v = details?.gender ?? details?.gender_id
      if (typeof v === 'string' && !/^\d+$/.test(v)) return mapGenderName(v)
      if (
        typeof v === 'object' &&
        typeof v?.name === 'string' &&
        !/^\d+$/.test(v?.id ?? '')
      ) {
        return mapGenderName(v.name)
      }
      return pickId(v, 0)
    })()

    const payload = {
      user: {
        name: details?.name ?? '',
        email: details?.email ?? '',
        password: details?.password ?? '',
        password_confirmation: details?.password_confirmation ?? '',
        phone: details?.phone ?? '',
        role: roleId,
        gender: genderId,
        date_of_birth:
          details?.date_of_birth instanceof Date
            ? moment(details?.date_of_birth).format('YYYY-MM-DD')
            : (details?.date_of_birth ?? ''),
        height: details?.height ? Number(details?.height) : null,
        weight: details?.weight ? Number(details?.weight) : null,
        lifestyle:
          typeof details?.lifestyle === 'object'
            ? (details?.lifestyle?.name ?? details?.lifestyle?.id ?? '')
            : (details?.lifestyle ?? ''),
        goal: details?.goal ?? '',
        food_preferences:
          typeof details?.food_preferences === 'object'
            ? (details?.food_preferences?.name ??
              details?.food_preferences?.id ??
              '')
            : (details?.food_preferences ?? ''),
        medical_conditions:
          typeof details?.medical_conditions === 'object'
            ? (details?.medical_conditions?.name ??
              details?.medical_conditions?.id ??
              '')
            : (details?.medical_conditions ?? ''),
        food_allergies:
          typeof details?.food_allergies === 'object'
            ? (details?.food_allergies?.name ??
              details?.food_allergies?.id ??
              '')
            : (details?.food_allergies ?? ''),
        ethnicity: details?.ethnicity ?? '',
      },
    }

    if (rowData?.user?.id) {
      updateMutation(
        { id: rowData?.user?.id, data: payload },
        {
          onError: (error: any) => {
            const apiData = error?.response?.data as any
            const msg =
              apiData?.errors?.[0] ||
              (Array.isArray(apiData?.error)
                ? apiData?.error?.[0]
                : apiData?.error)
            if (msg) {
              ;(methods as any).setError?.('email', {
                type: 'server',
                message: msg,
              })
            }
          },
        }
      )
    } else {
      mutate(payload, {
        onError: (error: any) => {
          const apiData = error?.response?.data as any
          const msg =
            apiData?.errors?.[0] ||
            (Array.isArray(apiData?.error)
              ? apiData?.error?.[0]
              : apiData?.error)
          if (msg) {
            ;(methods as any).setError?.('email', {
              type: 'server',
              message: msg,
            })
          }
        },
      })
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
        title={(() => {
          const label =
            activeRole === 'nutritionist' ? 'Nutritionist' : 'Client'
          if (edit) return `Edit ${label} Details`
          if (viewMode) return `${label} Details`
          return `Create ${label}`
        })()}
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
