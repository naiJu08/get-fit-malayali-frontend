import moment from 'moment'
import { useEffect, useMemo, useState } from 'react'
import { FormProvider, useForm, useWatch } from 'react-hook-form'

import InfoBox from '../../../components/app/alertBox/infoBox'
import FormBuilder from '../../../components/app/formBuilder'
import { useSnackbarManager } from '../../../components/common/snackbar'
import { getErrorMessage } from '../../../utilities/parsers'
import {
  getUserAdditionalData,
  saveUserAdditionalData,
  updateUserAdditionalData,
} from '../api'
import DialogModal from '../../../components/common/modal/DialogModal'

const fieldKeys = [
  'package',
  'date_of_assessment',
  'dietary_choice',
  'native_cuisine',
  'lactation_status',
  'pain_conditions',
  'gastric_issues',
  'sleep_disturbances',
  'ongoing_medicines',
  'supplements',
  'food_dislikes',
  'food_allergies',
  'social_habits',
  'social_habits_other',
  'tea_coffee_consumption',
  'work_profile',
  'working_time',
  'previous_professional_experience',
  'outside_food_frequency',
  'preferred_exercise',
  'preferred_workout_yoga_time',
  'workout_preference',
  'bmi',
  'location',
  'medical_conditions',
  'water_intake',
  'early_morning_meal',
  'breakfast',
  'morning_mid_meal',
  'lunch',
  'evening_snacks',
  'pre_workout_meal',
  'post_workout_meal',
  'dinner',
  'bed_time',
  'note',
] as const

type AdditionalData = Record<(typeof fieldKeys)[number], string>

const defaultValues = fieldKeys.reduce<AdditionalData>((acc, key) => {
  acc[key] = ''
  return acc
}, {} as AdditionalData)

type SelectOption = { id: string; name: string }

type SectionField = {
  key: keyof AdditionalData
  label: string
  type?: 'text' | 'textarea' | 'date'
  placeholder?: string
  options?: SelectOption[]
  showWhen?: (values: Partial<AdditionalData>) => boolean
  minDate?: Date
  maxDate?: Date
}

type SectionDefinition = {
  title: string
  description?: string
  fields: SectionField[]
}

const dropdownOptions: Partial<Record<keyof AdditionalData, SelectOption[]>> = {
  package: [
    { id: 'diet_only', name: 'Diet only' },
    { id: 'fitness_nutrition', name: 'Fitness & nutrition coaching' },
    { id: 'workout_only', name: 'Workout only' },
    { id: 'yoga_meditation', name: 'Yoga & meditation only' },
  ],
  dietary_choice: [
    { id: 'veg', name: 'Vegetarian' },
    { id: 'non_veg', name: 'Non-vegetarian' },
    { id: 'eggetarian', name: 'Eggetarian' },
    { id: 'vegan', name: 'Vegan' },
    { id: 'pescatarian', name: 'Pescatarian' },
  ],
  lactation_status: [
    { id: 'nil', name: 'Nil' },
    { id: '1_month', name: '1 month' },
    { id: '2_months', name: '2 months' },
    { id: '3_months', name: '3 months' },
    { id: '4_months', name: '4 months' },
    { id: '5_months', name: '5 months' },
    { id: '6_months', name: '6 months' },
    { id: '7_months', name: '7 months' },
    { id: '8_months', name: '8 months' },
    { id: '9_months', name: '9 months' },
    { id: '10_months', name: '10 months' },
    { id: '11_months', name: '11 months' },
    { id: '1_year', name: '1 year' },
    { id: '2_years', name: '2 years' },
    { id: 'others', name: 'Others' },
  ],
  social_habits: [
    { id: 'none', name: 'None' },
    { id: 'alcohol', name: 'Alcohol' },
    { id: 'smoking', name: 'Smoking' },
    { id: 'others', name: 'Others' },
  ],
  tea_coffee_consumption: [
    { id: 'none', name: 'None' },
    { id: 'tea', name: 'Tea' },
    { id: 'coffee', name: 'Coffee' },
    { id: 'both', name: 'Both' },
  ],
  working_time: [
    { id: 'day', name: 'Day shift' },
    { id: 'night', name: 'Night shift' },
    { id: 'rotational', name: 'Rotational shift' },
    { id: 'flexible', name: 'Flexible' },
  ],
  outside_food_frequency: [
    { id: 'rarely', name: 'Rarely' },
    { id: 'weekly', name: '1-2 times/week' },
    { id: 'frequent', name: '3+ times/week' },
  ],
  preferred_exercise: [
    { id: 'workout', name: 'Workout' },
    { id: 'yoga', name: 'Yoga' },
    { id: 'walking', name: 'Walking' },
  ],
  preferred_workout_yoga_time: [
    { id: 'morning', name: 'Morning' },
    { id: 'afternoon', name: 'Afternoon' },
    { id: 'evening', name: 'Evening' },
  ],
  workout_preference: [
    { id: 'home', name: 'Home workouts' },
    { id: 'gym', name: 'Gym workouts' },
    { id: 'outdoor', name: 'Outdoor activities' },
    { id: 'mixed', name: 'Mix of all' },
  ],
  sleep_disturbances: [
    { id: 'disturbed_sleep', name: 'Disturbed Sleep' },
    { id: 'normal', name: 'Normal' },
    { id: 'sometimes_irregular', name: 'Sometimes irregular' },
    { id: 'others', name: 'Others' },
  ],
}

const SOCIAL_HABIT_OPTION_IDS = new Set(
  (dropdownOptions.social_habits ?? []).map((opt) => opt.id)
)

const today = new Date()
today.setHours(0, 0, 0, 0)

const sections: SectionDefinition[] = [
  {
    title: 'Program Overview',
    fields: [
      { key: 'package', label: 'Package', options: dropdownOptions.package },
      {
        key: 'date_of_assessment',
        label: 'Date of assessment',
        type: 'date',
        maxDate: today,
      },
      {
        key: 'dietary_choice',
        label: 'Dietary choice',
        options: dropdownOptions.dietary_choice,
      },
      { key: 'native_cuisine', label: 'Native cuisine' },
      {
        key: 'lactation_status',
        label: 'Lactation status',
        options: dropdownOptions.lactation_status,
      },
      { key: 'bmi', label: 'BMI' },
      { key: 'location', label: 'Location' },
    ],
  },
  {
    title: 'Health & Habits',
    fields: [
      {
        key: 'medical_conditions',
        label: 'Medical conditions',
        type: 'textarea',
      },
      { key: 'water_intake', label: 'Water intake (liters/day)' },
      { key: 'pain_conditions', label: 'Pain conditions', type: 'textarea' },
      { key: 'gastric_issues', label: 'Gastric issues', type: 'textarea' },
      {
        key: 'sleep_disturbances',
        label: 'Sleep disturbances',
        options: dropdownOptions.sleep_disturbances,
      },
      {
        key: 'ongoing_medicines',
        label: 'Ongoing medicines',
        type: 'textarea',
      },
      { key: 'supplements', label: 'Supplements', type: 'textarea' },
      { key: 'food_allergies', label: 'Food allergies', type: 'textarea' },
      { key: 'food_dislikes', label: 'Food dislikes', type: 'textarea' },
      {
        key: 'social_habits',
        label: 'Social habits',
        options: dropdownOptions.social_habits,
      },
      {
        key: 'social_habits_other',
        label: 'Specify other social habits',
        type: 'textarea',
        placeholder: 'Describe other social habits',
        showWhen: (values) => isOthersSelection(values.social_habits),
      },
      {
        key: 'tea_coffee_consumption',
        label: 'Tea/Coffee consumption',
        options: dropdownOptions.tea_coffee_consumption,
      },
    ],
  },
  {
    title: 'Work & Lifestyle Preferences',
    fields: [
      { key: 'work_profile', label: 'Work profile', type: 'textarea' },
      {
        key: 'working_time',
        label: 'Working time',
        options: dropdownOptions.working_time,
      },
      {
        key: 'previous_professional_experience',
        label: ' Previous professional diet/workout experience ',
        type: 'textarea',
      },
      {
        key: 'outside_food_frequency',
        label: 'Outside food frequency',
        options: dropdownOptions.outside_food_frequency,
      },
      {
        key: 'preferred_exercise',
        label: 'Preferred exercise',
        options: dropdownOptions.preferred_exercise,
      },
      {
        key: 'preferred_workout_yoga_time',
        label: 'Preferred workout/yoga time',
        options: dropdownOptions.preferred_workout_yoga_time,
      },
      {
        key: 'workout_preference',
        label: 'Workout preference',
        options: dropdownOptions.workout_preference,
      },
    ],
  },
  {
    title: 'Meals & Daily Routine',
    fields: [
      {
        key: 'early_morning_meal',
        label: 'Early morning meal',
        type: 'textarea',
      },
      { key: 'breakfast', label: 'Breakfast', type: 'textarea' },
      { key: 'morning_mid_meal', label: 'Morning mid-meal', type: 'textarea' },
      { key: 'lunch', label: 'Lunch', type: 'textarea' },
      { key: 'evening_snacks', label: 'Evening snacks', type: 'textarea' },
      { key: 'pre_workout_meal', label: 'Pre-workout meal', type: 'textarea' },
      {
        key: 'post_workout_meal',
        label: 'Post-workout meal',
        type: 'textarea',
      },
      { key: 'dinner', label: 'Dinner', type: 'textarea' },
      { key: 'bed_time', label: 'Bed time' },
      { key: 'note', label: 'Notes', type: 'textarea' },
    ],
  },
]

type AdditionalInfoProps = {
  user?: Record<string, any>
  subscriptionId?: string | number | null
}

const resolveSelectionValue = (value: any) =>
  typeof value === 'object' && value !== null ? (value?.id ?? '') : value

const normalizeSocialHabit = (value: any) =>
  String(resolveSelectionValue(value) ?? '').trim()

const isOthersSelection = (value: any) =>
  normalizeSocialHabit(value).toLowerCase() === 'others'

const isCustomSocialHabit = (value: any) => {
  const normalized = normalizeSocialHabit(value)
  if (!normalized) return false
  if (SOCIAL_HABIT_OPTION_IDS.has(normalized)) return false
  return true
}

const shouldShowSocialHabitsOther = (value: any) =>
  isOthersSelection(value) || isCustomSocialHabit(value)

const formatDateValue = (value: string | null | undefined) => {
  if (!value) return '--'
  const date = moment(value)
  return date.isValid() ? date.format('DD-MM-YYYY') : String(value)
}

const formatValue = (
  key: keyof AdditionalData,
  value: string | null | undefined
) => {
  if (key === 'date_of_assessment') {
    return formatDateValue(value)
  }
  if ((key === 'native_cuisine' || key === 'social_habits') && value) {
    return value
      .toLowerCase()
      .replace(/\b([a-z])/g, (match) => match.toUpperCase())
  }
  if (value === null || value === undefined || value === '') return '--'
  return String(value)
}

const normalizeAdditionalData = (raw: any): AdditionalData | null => {
  if (!raw || typeof raw !== 'object') return null
  return fieldKeys.reduce<AdditionalData>((acc, key) => {
    acc[key] = raw?.[key] ?? ''
    return acc
  }, {} as AdditionalData)
}

const buildFieldConfig = (
  field: SectionField,
  values: Partial<AdditionalData>
) => {
  const hidden = field.showWhen ? !field.showWhen(values) : false
  if (field.options?.length) {
    return {
      name: field.key,
      id: field.key,
      label: field.label,
      type: 'custom_select',
      desc: 'name',
      descId: 'id',
      data: field.options,
      placeholder: field.placeholder ?? `Select ${field.label.toLowerCase()}`,
      initialLoad: true,
      async: false,
      notDataMessage: 'No options found',
      hidden,
    }
  }

  if (field.type === 'textarea') {
    return {
      name: field.key,
      id: field.key,
      label: field.label,
      type: 'textarea',
      placeholder: field.placeholder ?? `Describe ${field.label.toLowerCase()}`,
      hidden,
    }
  }

  if (field.type === 'date') {
    return {
      name: field.key,
      id: field.key,
      label: field.label,
      type: 'date',
      placeholder: field.placeholder ?? 'Select date',
      maxDate: field.maxDate,
      minDate: field.minDate,
      hidden,
    }
  }

  return {
    name: field.key,
    id: field.key,
    label: field.label,
    type: 'text',
    placeholder: field.placeholder ?? `Enter ${field.label.toLowerCase()}`,
    hidden,
  }
}

export default function AdditionalInfo({
  user,
  subscriptionId,
}: AdditionalInfoProps) {
  const userId = user?.id
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [data, setData] = useState<AdditionalData | null>(null)
  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null)
  const { enqueueSnackbar } = useSnackbarManager()

  const methods = useForm<AdditionalData>({ defaultValues })
  const {
    handleSubmit,
    reset,
    formState: { isDirty },
  } = methods
  const watchedValuesRaw =
    (useWatch({ control: methods.control }) as Partial<AdditionalData>) || {}
  const watchedValues = {
    ...watchedValuesRaw,
    social_habits: normalizeSocialHabit(watchedValuesRaw.social_habits),
  }

  const transformForForm = (payload: AdditionalData | null) => {
    if (!payload) return defaultValues
    const next = { ...payload }
    if (isCustomSocialHabit(next.social_habits)) {
      next.social_habits_other = next.social_habits
      next.social_habits = 'others'
    } else {
      next.social_habits_other = ''
    }
    return next
  }
  useEffect(() => {
    reset(defaultValues)
    setData(null)
    setModalMode(null)
  }, [userId, reset])

  useEffect(() => {
    if (!userId) return
    setLoading(true)
    getUserAdditionalData(userId, subscriptionId)
      .then((res) => {
        const payload =
          normalizeAdditionalData(res?.additional_data) ||
          normalizeAdditionalData(res?.data?.additional_data) ||
          normalizeAdditionalData(res)
        if (payload) {
          setData(payload)
          reset(transformForForm(payload))
        }
      })
      .catch((error) => {
        if (error?.response?.status !== 404) {
          enqueueSnackbar('Failed to load additional information.', {
            variant: 'error',
          })
        }
      })
      .finally(() => setLoading(false))
  }, [userId, subscriptionId, enqueueSnackbar, reset])

  const hasSavedData = useMemo(() => {
    if (!data) return false
    return fieldKeys.some((key) => (data?.[key] ?? '').trim() !== '')
  }, [data])

  const handleSave = (values: AdditionalData) => {
    if (!userId) return
    setSaving(true)
    const payload = fieldKeys.reduce<AdditionalData>((acc, key) => {
      const value = values[key]
      acc[key] = value ?? ''
      return acc
    }, {} as AdditionalData)

    if (shouldShowSocialHabitsOther(values.social_habits)) {
      payload.social_habits = values.social_habits_other?.trim() || ''
    } else {
      payload.social_habits = normalizeSocialHabit(values.social_habits)
    }
    payload.social_habits_other = ''

    const persist =
      modalMode === 'edit' ? updateUserAdditionalData : saveUserAdditionalData

    // persist(userId, payload, subscriptionId)
    //   .then((res) => {
    //     const payloadFromResponse =
    //       normalizeAdditionalData(res?.additional_data) ||
    //       normalizeAdditionalData(res?.data?.additional_data) ||
    //       payload
    //     setData(payloadFromResponse)
    //     reset(transformForForm(payloadFromResponse))
    //     setModalMode(null)
    //     enqueueSnackbar('Additional information saved successfully.', {
    //       variant: 'success',
    //     })
    //   })
    persist(userId, payload, subscriptionId)
      .then((res) => {
        const payloadFromResponse =
          normalizeAdditionalData(res?.additional_data) ||
          normalizeAdditionalData(res?.data?.additional_data) ||
          payload

        setData(payloadFromResponse)
        reset(transformForForm(payloadFromResponse))
        setModalMode(null)

        enqueueSnackbar(res?.message || 'Saved successfully', {
          variant: 'success',
        })
      })
      .catch((error) => {
        enqueueSnackbar(
          getErrorMessage(error?.response?.data) ||
            'Failed to save additional information.',
          {
            variant: 'error',
          }
        )
      })
      .finally(() => setSaving(false))
  }

  const isModalOpen = modalMode !== null

  const openModal = (mode: 'create' | 'edit') => {
    if (mode === 'create') {
      reset(defaultValues)
    } else {
      reset(transformForForm(data ?? defaultValues))
    }
    setModalMode(mode)
  }

  const handleModalClose = () => {
    reset(data ?? defaultValues)
    setModalMode(null)
  }

  const formHeading =
    modalMode === 'edit'
      ? 'Edit Nutritional Assessment'
      : 'Create Nutritional Assessment'
  const disableSubmit = saving || (!isDirty && !hasSavedData)

  const formBody = (
    <FormProvider {...methods}>
      <form
        className="flex flex-col gap-6"
        onSubmit={handleSubmit((formValues) => handleSave(formValues))}
      >
        {sections.map((section) => (
          <div
            key={section.title}
            className="border rounded-lg bg-white p-5 shadow-sm"
          >
            <div className="mb-4">
              <h3 className="text-base font-semibold text-gray-900">
                {section.title}
              </h3>
              {section.description ? (
                <p className="text-sm text-gray-500">{section.description}</p>
              ) : null}
            </div>
            <FormBuilder
              data={section.fields
                .filter((field) =>
                  field.showWhen ? field.showWhen(watchedValues) : true
                )
                .map((field) => buildFieldConfig(field, watchedValues))}
              edit
              spacing
            />
          </div>
        ))}
        <div className="flex flex-wrap gap-3 justify-end">
          <button
            type="button"
            className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 text-sm"
            disabled={saving}
            onClick={handleModalClose}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 rounded-md bg-primaryGreen text-white text-sm disabled:opacity-60"
            disabled={disableSubmit}
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </form>
    </FormProvider>
  )

  if (!userId) {
    return (
      <div className="p-6">
        <InfoBox content="User identifier is required to load additional information." />
      </div>
    )
  }

  if (loading) {
    return (
      <div className="p-6">
        <InfoBox content="Loading additional information..." />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap justify-end gap-3">
        {hasSavedData ? (
          <button
            type="button"
            className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 text-sm"
            onClick={() => openModal('edit')}
          >
            Edit
          </button>
        ) : (
          <button
            type="button"
            className="px-4 py-2 rounded-md bg-primaryGreen text-white text-sm"
            onClick={() => openModal('create')}
          >
            Create
          </button>
        )}
      </div>

      {hasSavedData ? (
        sections.map((section) => (
          <div
            key={section.title}
            className="border rounded-lg bg-white p-5 shadow-sm"
          >
            <h3 className="text-base font-semibold text-gray-900 mb-4">
              {section.title}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {section.fields
                .filter((field) =>
                  field.showWhen
                    ? field.showWhen(data ?? ({} as AdditionalData))
                    : true
                )
                .map((field) => (
                  <div
                    key={field.key}
                    className="border rounded-md p-3 bg-gray-50"
                  >
                    <div className="text-xs uppercase tracking-wide text-gray-500 mb-1">
                      {field.label}
                    </div>
                    <div className="text-sm text-gray-900">
                      {formatValue(field.key, data?.[field.key])}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ))
      ) : (
        <div className="p-6 border rounded-lg bg-white flex flex-col gap-4">
          <InfoBox content="No nutritional assessment available for this user." />
        </div>
      )}

      <DialogModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        title={formHeading}
        small={false}
        backdropCancel={!saving}
        body={formBody}
      />
    </div>
  )
}
