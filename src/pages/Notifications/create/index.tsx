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
  edit?: boolean
  hasPermission?: boolean
  subSection?: boolean
}

export default function CreateAdmin({
  isDrawerOpen,
  handleClose,
  handleRefresh,
  edit,
  viewMode,
  rowData,
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
    { ...textField('user_id', 'User ID', 'Enter user id', true) },
    { ...textField('plan_id', 'Plan ID', 'Enter plan id', true) },
    { name: 'start_date', label: 'Start Date', type: 'date', required: true },
    { name: 'end_date', label: 'End Date', type: 'date', required: true },
    {
      name: 'status',
      label: 'Status',
      required: true,
      id: 'status',
      desc: 'name',
      descId: 'id',
      data: [
        { id: 0, name: 'Active' },
        { id: 1, name: 'Inactive' },
        { id: 2, name: 'Paused' },
      ],
      type: 'custom_select',
      placeholder: 'Select status',
      async: false,
      initialLoad: true,
    },
    {
      name: 'notes',
      label: 'Notes',
      type: 'textarea',
      placeholder: 'Notes',
      required: true,
    },
  ]

  const handleClearAndClose = () => {
    methods.reset({
      user_id: undefined as any,
      plan_id: undefined as any,
      start_date: undefined as any,
      end_date: undefined as any,
      status: 0 as any,
      notes: '',
    } as any)
    handleClose()
  }

  const handleSubmission = () => {
    methods.reset({
      user_id: undefined as any,
      plan_id: undefined as any,
      start_date: '',
      end_date: '',
      status: 'active' as any,
      notes: '',
    } as any)

    handleRefresh?.()
    handleClearAndClose()
  }
  useEffect(() => {
    if (isDrawerOpen && !viewMode && edit) {
      methods.reset({
        user_id:
          rowData?.subscription?.user_id ?? rowData?.user_id ?? undefined,
        plan_id:
          rowData?.subscription?.plan_id ?? rowData?.plan_id ?? undefined,
        start_date:
          rowData?.subscription?.start_date ?? rowData?.start_date ?? undefined,
        end_date:
          rowData?.subscription?.end_date ?? rowData?.end_date ?? undefined,
        status: rowData?.subscription?.status ?? rowData?.status ?? 0,
        notes: rowData?.subscription?.notes ?? rowData?.notes ?? '',
      } as any)
    }
  }, [viewMode, edit, isDrawerOpen])
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
    const coerceId = (v: any) =>
      typeof v === 'object' ? (v?.id ?? v?.value ?? v) : v
    const toInt = (v: any) =>
      typeof v === 'string' ? (/(^\d+$)/.test(v) ? parseInt(v, 10) : 0) : v
    // const toStr = (v: any) => (typeof v === 'object' ? (v?.id ?? v?.value ?? v) : v)

    const payload = {
      subscription: {
        user_id: toInt(coerceId(details?.user_id)),
        plan_id: toInt(coerceId(details?.plan_id)),
        start_date:
          details?.start_date instanceof Date
            ? moment(details?.start_date).format('YYYY-MM-DD')
            : (details?.start_date ?? ''),
        end_date:
          details?.end_date instanceof Date
            ? moment(details?.end_date).format('YYYY-MM-DD')
            : (details?.end_date ?? ''),
        status: toInt(coerceId(details?.status)),
        notes: details?.notes ?? '',
      },
    }

    if (rowData?.id) {
      updateMutation({ id: rowData?.id, data: payload })
    } else {
      mutate(payload)
    }
  }

  const viewHeaderData = {
    image: undefined,
    title: `Subscription #${rowData?.id ?? ''}`,
    subTitle: rowData?.plan_name ?? '',
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
            ? 'Edit Subscription'
            : viewMode
              ? 'Subscription Details'
              : 'Create Subscription'
        }
        actionLabel={viewMode ? undefined : 'Save'}
        actionLoader={!viewMode && (isCreating || isUpdating)}
        onSubmit={viewMode ? undefined : handleSubmit((data) => onSubmit(data))}
        secondaryAction={() => handleClearAndClose()}
        secondaryActionLabel={viewMode ? 'Close' : 'Cancel'}
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
