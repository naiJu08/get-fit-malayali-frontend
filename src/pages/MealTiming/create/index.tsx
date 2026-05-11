import { useEffect, useMemo, useRef } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import moment from 'moment'
import { DialogModal } from '../../../components/common'
import FormBuilder from '../../../components/app/formBuilder'
import {
  useCreateMealTiming,
  useUpdateMealTiming,
  useUpdateUserMealTiming,
} from '../api'
import { mealTimingFormSchema, MealTimingSchema } from './schema'
// import { MealTimingSchema, mealTimingFormSchema } from './schema'

const toTitleCase = (value?: string) => {
  if (!value) return ''
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase()
}

type Props = {
  isDrawerOpen: boolean
  handleClose: () => void
  handleRefresh: () => void
  edit?: boolean
  viewMode?: boolean
  rowData?: any
  setEdit?: (edit: boolean) => void
}

export default function MealTimingCreate({
  isDrawerOpen,
  handleClose,
  handleRefresh,
  edit,
  viewMode,
  rowData,
  setEdit,
}: Props) {

  const hydratedRowRef = useRef<string | number | null>(null)

  /* ------------------- FORM ------------------- */

  const methods = useForm<MealTimingSchema>({
    resolver: zodResolver(mealTimingFormSchema),
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: {
      name: '',
      time: '',
sequence_number: undefined as unknown as number,
      status: 'active',
    },
  })

  const { handleSubmit } = methods

  /* ------------------- MUTATIONS ------------------- */

  const onSuccess = () => handleSubmission()

  const { mutate, isLoading: isCreating } = useCreateMealTiming(onSuccess)
  const { mutate: updateMutation, isLoading: isUpdating } =
    useUpdateMealTiming(onSuccess)
  const { mutate: updateUserMutation, isLoading: isUserUpdating } =
    useUpdateUserMealTiming(onSuccess)

  /* ------------------- LIFECYCLE HELPERS ------------------- */

  const handleClearAndClose = () => {
    methods.reset({
      name: '',
      time: '',
  sequence_number: undefined as unknown as number,
      status: 'active',
    })
    handleClose()
  }

  const handleSubmission = () => {
    methods.reset({
      name: '',
      time: '',
      sequence_number: undefined as unknown as number,
      status: 'active',
    })
    handleRefresh()
    handleClearAndClose()
  }

  /* ------------------- HYDRATE EDIT MODE ------------------- */

  useEffect(() => {
    if (!(isDrawerOpen && edit && rowData)) return

    const hydrationKey = rowData?.id ?? 'unknown'
    if (hydratedRowRef.current === hydrationKey) return

    const time24 = rowData?.time
      ? moment(rowData.time, ['hh:mm A', 'h:mm A', 'HH:mm:ss', 'HH:mm']).format('HH:mm:ss')
      : ''

    methods.reset({
      name: toTitleCase(rowData?.name) ?? '',
      time: time24,
      sequence_number: rowData?.sequence_number ?? (undefined as unknown as number),
      status: rowData?.status ?? 'active',
    })

    hydratedRowRef.current = hydrationKey
  }, [isDrawerOpen, edit, rowData])

  /* Reset hydration when drawer closes */
  useEffect(() => {
    if (!isDrawerOpen) hydratedRowRef.current = null
  }, [isDrawerOpen])

  /* Reset for create mode */
  useEffect(() => {
    if (isDrawerOpen && !edit) {
      methods.reset({
        name: '',
        time: '',
        sequence_number: undefined as unknown as number,
        status: 'active',
      })
    }
  }, [isDrawerOpen, edit])

  /* ------------------- SUBMIT ------------------- */

  const hasValue = (v: any) =>
    v !== undefined && v !== null && !(typeof v === 'string' && v.trim() === '')

  const onSubmit = (data: MealTimingSchema) => {
    const time12 = data.time
      ? moment(data.time, ['HH:mm:ss', 'HH:mm']).format('hh:mm A')
      : ''

    if (edit && rowData) {
      const userId =
        rowData?.user_id ??
        rowData?.userId ??
        rowData?.user?.id ??
        rowData?.user?.user_id
      const dietPlanTemplateId =
        rowData?.diet_plan_template_id ??
        rowData?.dietPlanTemplateId ??
        rowData?.diet_plan_template?.id ??
        rowData?.subscription?.diet_plan_template_id
      const subscriptionId =
        rowData?.subscription_id ?? rowData?.subscriptionId ?? rowData?.subscription?.id
      const sequenceNumber =
        rowData?.sequence_number ?? rowData?.sequenceNumber ?? data?.sequence_number

      const canUpdateUserMealTiming =
        hasValue(userId) &&
        hasValue(dietPlanTemplateId) &&
        hasValue(subscriptionId) &&
        hasValue(sequenceNumber)

      if (canUpdateUserMealTiming) {
        updateUserMutation({
          userId,
          payload: {
            user_meal_timing: {
              meal_time: String(
                rowData?.meal_time ?? rowData?.name ?? data?.name ?? ''
              )
                .trim()
                .toUpperCase(),
              time: time12,
              diet_plan_template_id: dietPlanTemplateId,
              subscription_id: subscriptionId,
              sequence_number: Number(sequenceNumber),
            },
          },
        })
        return
      }

      const payload = {
        ...data,
        time: time12,
        status: data.status.toLowerCase(),
      }
      updateMutation({ id: rowData.id, data: payload })
      return
    }

    const payload = {
      ...data,
      time: time12,
      status: data.status.toLowerCase(),
    }
    mutate(payload)
  }

  /* ------------------- FORM BUILDER CONFIG ------------------- */

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
    ...(required && { required: true }),
    ...(disabled && { disabled: true }),
  })

  const formBuilderProps = useMemo(
    () => [
      {
        ...textField('name', 'Name', 'Enter meal timing name', true, viewMode),
        maxLength: 50,
      },
      {
        name: 'time',
        label: 'Time',
        id: 'time',
        type: 'time_split',
        placeholder: 'Select time',
        required: true,
        ...(viewMode && { disabled: true }),
      },
      {
        name: 'sequence_number',
        label: 'Sequence Number',
        id: 'sequence_number',
        type: 'number',
        placeholder: 'Enter sequence number',
        required: true,
        ...(viewMode && { disabled: true }),
      },
      {
        name: 'status',
        label: 'Status',
        id: 'status',
        type: 'custom_select',
        placeholder: 'Select status',
        required: true,
        desc: 'name',
        descId: 'id',
        data: [
          { id: 'active', name: 'Active' },
          { id: 'inactive', name: 'Inactive' },
        ],
        ...(viewMode && { disabled: true }),
      },
    ],
    [viewMode]
  )

  /* ------------------- UI ------------------- */

  return (
    <DialogModal
      className={edit ? 'h-[90vh] md:h-[90vh]' : undefined}
      isOpen={isDrawerOpen}
      onClose={handleClearAndClose}
      title={
        edit ? 'Edit Meal Timing'
        : viewMode ? 'Meal Timing Details'
        : 'Create Meal Timing'
      }
      small={false}
      tall={Boolean(edit)}
      bodyOverflowVisible
      actionLabel={viewMode ? 'Edit' : 'Save'}
      actionLoader={isCreating || isUpdating || isUserUpdating}
      onSubmit={viewMode ? () => setEdit?.(true) : handleSubmit(onSubmit)}
      secondaryAction={handleClearAndClose}
      secondaryActionLabel="Cancel"
      body={
        <FormProvider {...methods}>
          <FormBuilder data={formBuilderProps} edit spacing />
        </FormProvider>
      }
    />
  )
}
