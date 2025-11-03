import { zodResolver } from '@hookform/resolvers/zod'
import moment from 'moment'
import { useEffect, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'

import InfoBox from '../../../components/app/alertBox/infoBox'
import FormBuilder from '../../../components/app/formBuilder'
import { DialogModal } from '../../../components/common'
import CustomeSideViewer from '../../../components/common/drawer/customeSideViewer'
import { humanizeDatetime } from '../../../utilities/format'
import { useCreateAdmin, useUpdateAdmin } from '../api'
import { AdminSchema, formSchema } from './schema'

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

  const formBuilderProps = [
    { ...textField('name', 'Name', 'Enter full name', true) },
    {
      ...textField('email', 'Email', 'Enter email', true),
      type: 'email',
      toLowercase: true,
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
    { ...textField('phone', 'Phone Number', 'Enter phone number', true) },

    {
      name: 'role',
      label: 'Role',
      required: true,
      id: 'role',
      desc: 'name',
      descId: 'id',
      data: [
        { id: '1', name: 'Admin' },
        { id: '2', name: 'Nutritionist' },
        { id: '3', name: 'User' },
      ],
      type: 'custom_select',
      placeholder: 'Select role',
      async: false,
      initialLoad: true,
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
    { ...textField('lifestyle', 'Lifestyle', 'e.g., Active') },
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
      ],
      type: 'custom_select',
      placeholder: 'Select Food Preference',
      async: false,
      initialLoad: true,
    },
    { ...textField('medical_conditions', 'Medical Conditions', 'e.g., None') },
    { ...textField('ethnicity', 'Ethnicity', 'e.g., Indian') },
  ]

  const handleClearAndClose = () => {
    methods.reset({
      name: '',
      email: '',
      password: '',
      password_confirmation: '',
      phone: '',
      role: '',
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
          role: rowData?.user?.group?.id ?? rowData?.user?.role ?? '',
          gender: rowData?.user?.gender ?? '',
          date_of_birth: rowData?.user?.date_of_birth ?? '',
          height: rowData?.user?.height ?? 0,
          weight: rowData?.user?.weight ?? 0,
          lifestyle: rowData?.user?.lifestyle ?? '',
          goal: rowData?.user?.goal ?? '',
          food_preferences: rowData?.user?.food_preferences ?? '',
          medical_conditions: rowData?.user?.medical_conditions ?? '',
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
    resolver: zodResolver(formSchema),
    mode: 'onChange',
    reValidateMode: 'onChange',
  })
  const { handleSubmit } = methods
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
    const rawRole = details?.role ?? details?.role_id
    let roleId = pickId(rawRole, 0)
    if (!roleId) {
      const mapRoleName = (s: any) => {
        const t = (typeof s === 'string' ? s : s?.name)?.toLowerCase?.() || ''
        if (t === 'admin') return 1
        if (t === 'nutritionist') return 2
        if (t === 'user') return 3
        return 0
      }
      roleId = mapRoleName(rawRole)
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
        lifestyle: details?.lifestyle ?? '',
        goal: details?.goal ?? '',
        food_preferences:
          typeof details?.food_preferences === 'object'
            ? (details?.food_preferences?.name ??
              details?.food_preferences?.id ??
              '')
            : (details?.food_preferences ?? ''),
        medical_conditions: details?.medical_conditions ?? '',
        ethnicity: details?.ethnicity ?? '',
      },
    }

    if (rowData?.user?.id) {
      updateMutation({ id: rowData?.user?.id, data: payload })
    } else {
      mutate(payload)
    }
  }

  const viewHeaderData = {
    image: rowData?.user?.profile_image,
    title: `${rowData?.user?.first_name} ${rowData?.user?.last_name} `,
    subTitle: rowData?.user?.job_title,
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
        onSubmit={() => console.log('handle delete')}
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
            ? 'Edit Subscription Details'
            : viewMode
              ? 'Subscription Details'
              : 'Create Subscription'
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
