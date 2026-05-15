import moment from 'moment'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { FormProvider, useForm, useWatch } from 'react-hook-form'

import InfoBox from '../../../components/app/alertBox/infoBox'
import FormBuilder from '../../../components/app/formBuilder'
import Icons from '../../../components/common/icons'
import { useSnackbarManager } from '../../../components/common/snackbar'
import SmartTable from '../../../components/common/table/SmartTable'
import { TableColumns } from '../../../common/types'
import { getErrorMessage } from '../../../utilities/parsers'
import {
  getUserAdditionalData,
  saveUserAdditionalData,
  updateUserAdditionalData,
} from '../api'
import DialogModal from '../../../components/common/modal/DialogModal'
import { useAssessmentCategories } from '../../AssessmentCategory/api'

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
  'preferred_workout_yoga_time_other',
  'workout_preference',
  'height',
  'weight',
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

type AdditionalData = Record<(typeof fieldKeys)[number], string> & {
  assessment_answers?: any[]
  assessment_answers_attributes?: any[]
  assessment_category_id?: string
  assessment_category_name?: string
  assessment_question_ids?: any[]
}

const defaultValues = fieldKeys.reduce<AdditionalData>((acc, key) => {
  acc[key] = ''
  return acc
}, {} as AdditionalData)
defaultValues.assessment_category_id = ''
defaultValues.assessment_category_name = ''
defaultValues.assessment_question_ids = []

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
const capitalizeWords = (value: string) => {
  if (!value) return ''
  return value
    .toLowerCase()
    .replace(/\b([a-z])/g, (match) => match.toUpperCase())
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
    { id: 'others', name: 'Others' },
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

const PREFERRED_WORKOUT_YOGA_TIME_OPTION_IDS = new Set(
  (dropdownOptions.preferred_workout_yoga_time ?? []).map((opt) => opt.id)
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
      { key: 'height', label: 'Height' },
      { key: 'weight', label: 'Weight' },
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
        key: 'preferred_workout_yoga_time_other',
        label: 'Specify preferred workout/yoga time',
        placeholder: 'Describe preferred workout/yoga time',
        showWhen: (values) =>
          isOthersSelectionPreferredWorkoutYogaTime(
            values.preferred_workout_yoga_time
          ),
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

const normalizePreferredWorkoutYogaTime = (value: any) =>
  String(resolveSelectionValue(value) ?? '').trim()

const isOthersSelection = (value: any) =>
  normalizeSocialHabit(value).toLowerCase() === 'others'

const isOthersSelectionPreferredWorkoutYogaTime = (value: any) =>
  normalizePreferredWorkoutYogaTime(value).toLowerCase() === 'others'

const isCustomSocialHabit = (value: any) => {
  const normalized = normalizeSocialHabit(value)
  if (!normalized) return false
  if (SOCIAL_HABIT_OPTION_IDS.has(normalized)) return false
  return true
}

const isCustomPreferredWorkoutYogaTime = (value: any) => {
  const normalized = normalizePreferredWorkoutYogaTime(value)
  if (!normalized) return false
  if (PREFERRED_WORKOUT_YOGA_TIME_OPTION_IDS.has(normalized)) return false
  return true
}

const shouldShowSocialHabitsOther = (value: any) =>
  isOthersSelection(value) || isCustomSocialHabit(value)

const shouldShowPreferredWorkoutYogaTimeOther = (value: any) =>
  isOthersSelectionPreferredWorkoutYogaTime(value) ||
  isCustomPreferredWorkoutYogaTime(value)

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
  if (
    (key === 'native_cuisine' ||
      key === 'social_habits' ||
      key === 'preferred_workout_yoga_time' ||
      key === 'location') &&
    value
  ) {
    return value
      .toLowerCase()
      .replace(/\b([a-z])/g, (match) => match.toUpperCase())
  }
  if (value === null || value === undefined || value === '') return '--'
  return String(value)
}

const normalizeAdditionalData = (raw: any): AdditionalData | null => {
  if (!raw || typeof raw !== 'object') return null
  const next = fieldKeys.reduce<AdditionalData>((acc, key) => {
    acc[key] = raw?.[key] ?? ''
    return acc
  }, {} as AdditionalData)
  const assessmentAnswers = Array.isArray(raw?.assessment_answers)
    ? raw.assessment_answers
    : []
  next.assessment_answers = assessmentAnswers
  next.assessment_category_id =
    assessmentAnswers[0]?.assessment_category_id != null
      ? String(assessmentAnswers[0].assessment_category_id)
      : ''
  next.assessment_category_name = assessmentAnswers[0]?.category_name ?? ''
  next.assessment_question_ids = assessmentAnswers
    .filter((answer: any) => answer?.answer === true)
    .map((answer: any) => String(answer?.assessment_question_id))
  return next
}

const extractAdditionalPayload = (raw: any) => {
  const value =
    raw?.additional_data ?? raw?.data?.additional_data ?? raw?.data ?? raw
  if (Array.isArray(value)) return value[0] ?? null
  return value
}

const formatUserMetric = (value: any) => {
  if (value === null || value === undefined || value === '') return '--'
  return String(value)
}

const formatUserMetricForForm = (value: any) => {
  if (value === null || value === undefined || value === '') return ''
  return String(value)
}

const getUserBmi = (user: Record<string, any> | undefined) => {
  const apiBmi = user?.bmi ?? user?.body_mass_index
  if (apiBmi !== null && apiBmi !== undefined && apiBmi !== '') {
    return String(apiBmi)
  }

  const height = Number(user?.height)
  const weight = Number(user?.weight)
  if (!Number.isFinite(height) || !Number.isFinite(weight) || height <= 0) {
    return '--'
  }

  const heightInMeters = height / 100
  return (weight / (heightInMeters * heightInMeters)).toFixed(1)
}

const buildFieldConfig = (
  field: SectionField,
  values: Partial<AdditionalData>,
  disabled = false
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
      disabled,
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
      disabled,
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
      disabled,
    }
  }

  return {
    name: field.key,
    id: field.key,
    label: field.label,
    type: 'text',
    placeholder: field.placeholder ?? `Enter ${field.label.toLowerCase()}`,
    hidden,
    disabled,
  }
}

const getAssessmentCategoryRows = (data: any) => {
  if (Array.isArray(data?.assessment_categories)) {
    return data.assessment_categories
  }
  if (Array.isArray(data?.data?.assessment_categories)) {
    return data.data.assessment_categories
  }
  if (Array.isArray(data?.items)) return data.items
  if (Array.isArray(data?.data)) return data.data
  return []
}

const getSelectedAssessmentQuestionIds = (value: any) => {
  const values = Array.isArray(value) ? value : value ? [value] : []

  return values
    .map((item) => {
      if (typeof item === 'object' && item !== null) {
        return item?.id ?? item?.assessment_question_id
      }
      return item
    })
    .filter((id) => id !== null && id !== undefined && String(id).trim() !== '')
    .map((id) => String(id))
}

export default function AdditionalInfo({
  user,
  subscriptionId,
}: AdditionalInfoProps) {
  const userId = user?.id
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [data, setData] = useState<AdditionalData | null>(null)
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view' | null>(
    null
  )
  const { enqueueSnackbar } = useSnackbarManager()

  const methods = useForm<AdditionalData>({ defaultValues })
  const {
    handleSubmit,
    reset,
    // setValue,
    formState: { isDirty },
  } = methods
  const watchedValuesRaw =
    (useWatch({ control: methods.control }) as Partial<AdditionalData>) || {}
  const watchedValues = {
    ...watchedValuesRaw,
    social_habits: normalizeSocialHabit(watchedValuesRaw.social_habits),
    preferred_workout_yoga_time: normalizePreferredWorkoutYogaTime(
      watchedValuesRaw.preferred_workout_yoga_time
    ),
  }
  const selectedAssessmentCategoryId = String(
    watchedValuesRaw.assessment_category_id ?? ''
  )
  // const selectedAssessmentQuestionIds = useMemo(
  //   () =>
  //     getSelectedAssessmentQuestionIds(watchedValuesRaw.assessment_question_ids),
  //   [watchedValuesRaw.assessment_question_ids]
  // )

  const { data: assessmentCategoryData } = useAssessmentCategories({
    page: 1,
    per_page: 999,
    active: true,
  } as any)
  const assessmentCategories = useMemo(
    () => getAssessmentCategoryRows(assessmentCategoryData),
    [assessmentCategoryData]
  )
  const selectedAssessmentCategory = useMemo(
    () =>
      assessmentCategories.find(
        (category: any) =>
          String(category?.id) === String(selectedAssessmentCategoryId)
      ),
    [assessmentCategories, selectedAssessmentCategoryId]
  )
  const assessmentQuestionOptions = useMemo(
    () =>
      Array.isArray(selectedAssessmentCategory?.assessment_questions)
        ? selectedAssessmentCategory.assessment_questions
        : [],
    [selectedAssessmentCategory]
  )
  // const selectedAssessmentQuestionItems = useMemo(
  //   () =>
  //     assessmentQuestionOptions.filter((question: any) =>
  //       selectedAssessmentQuestionIds.includes(String(question?.id))
  //     ),
  //   [assessmentQuestionOptions, selectedAssessmentQuestionIds]
  // )

  const userMetricDefaults = useMemo(
    () => ({
      height: formatUserMetricForForm(user?.height),
      weight: formatUserMetricForForm(user?.weight),
      bmi: getUserBmi(user) === '--' ? '' : getUserBmi(user),
    }),
    [user]
  )

  const defaultValuesWithUserMetrics = useMemo(
    () => ({
      ...defaultValues,
      ...userMetricDefaults,
    }),
    [userMetricDefaults]
  )

  const transformForForm = useCallback(
    (payload: AdditionalData | null) => {
      if (!payload) return defaultValuesWithUserMetrics
      const next = {
        ...payload,
        ...userMetricDefaults,
      }
      if (next.location) {
        next.location = capitalizeWords(next.location)
      }
      if (next.preferred_workout_yoga_time) {
        next.preferred_workout_yoga_time = capitalizeWords(
          next.preferred_workout_yoga_time
        )
      }

      // Capitalize preferred_workout_yoga_time_other
      if (next.preferred_workout_yoga_time_other) {
        next.preferred_workout_yoga_time_other = capitalizeWords(
          next.preferred_workout_yoga_time_other
        )
      }
      if (isCustomSocialHabit(next.social_habits)) {
        next.social_habits_other = next.social_habits
        next.social_habits = 'others'
      } else {
        next.social_habits_other = ''
      }
      if (isCustomPreferredWorkoutYogaTime(next.preferred_workout_yoga_time)) {
        next.preferred_workout_yoga_time_other =
          next.preferred_workout_yoga_time
        next.preferred_workout_yoga_time = 'others'
      } else {
        next.preferred_workout_yoga_time_other = ''
      }
      next.assessment_category_id = payload.assessment_category_id ?? ''
      next.assessment_category_name = payload.assessment_category_name ?? ''
      next.assessment_question_ids = payload.assessment_question_ids ?? []
      next.assessment_answers = payload.assessment_answers ?? []
      return next
    },
    [defaultValuesWithUserMetrics, userMetricDefaults]
  )

  const transformForView = useCallback(
    (payload: AdditionalData | null) => {
      const next = transformForForm(payload)
      const viewValues = fieldKeys.reduce<AdditionalData>((acc, key) => {
        const value = next[key]
        acc[key] =
          value === null || value === undefined || String(value).trim() === ''
            ? '--'
            : value
        return acc
      }, {} as AdditionalData)
      viewValues.assessment_category_id = next.assessment_category_id ?? ''
      viewValues.assessment_category_name = next.assessment_category_name ?? ''
      viewValues.assessment_question_ids = next.assessment_question_ids ?? []
      viewValues.assessment_answers = next.assessment_answers ?? []
      return viewValues
    },
    [transformForForm]
  )
  useEffect(() => {
    reset(defaultValuesWithUserMetrics)
    setData(null)
    setModalMode(null)
  }, [userId, reset, defaultValuesWithUserMetrics])

  useEffect(() => {
    if (!userId) return
    setLoading(true)
    getUserAdditionalData(userId, subscriptionId)
      .then((res) => {
        const payload = normalizeAdditionalData(extractAdditionalPayload(res))
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
  }, [userId, subscriptionId, enqueueSnackbar, reset, transformForForm])

  const hasSavedData = useMemo(() => {
    if (!data) return false
    return fieldKeys.some((key) => (data?.[key] ?? '').trim() !== '')
  }, [data])

  const assessmentRows = useMemo(() => {
    if (!data) return []

    return [
      {
        id: 'additional-info',
        package: formatValue('package', data?.package),
        date_of_assessment: formatValue(
          'date_of_assessment',
          data?.date_of_assessment
        ),
        dietary_choice: formatValue('dietary_choice', data?.dietary_choice),
        height: formatUserMetric(user?.height),
        weight: formatUserMetric(user?.weight),
        bmi: getUserBmi(user),
      },
    ]
  }, [data, user])

  const assessmentColumns = useMemo<TableColumns[]>(() => {
    const columns = [
      { title: 'Package', field: 'package' },
      { title: 'Date of assessment', field: 'date_of_assessment' },
      { title: 'Dietary choice', field: 'dietary_choice' },
      { title: 'Height', field: 'height' },
      { title: 'Weight', field: 'weight' },
      { title: 'BMI', field: 'bmi' },
    ]

    return columns.map((column) => ({
      ...column,
      sortable: false,
      resizable: true,
      isVisible: true,
      customCell: true,
      colWidth: 180,
      renderCell: (row: any) => ({
        cell: (
          <div
            className={`whitespace-pre-wrap break-words ${
              row?.[column.field] === '--' ? 'text-gray-400' : 'text-gray-900'
            }`}
          >
            {row?.[column.field]}
          </div>
        ),
        toolTip: row?.[column.field],
      }),
    }))
  }, [])

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

    if (
      shouldShowPreferredWorkoutYogaTimeOther(
        values.preferred_workout_yoga_time
      )
    ) {
      payload.preferred_workout_yoga_time =
        values.preferred_workout_yoga_time_other?.trim() || ''
    } else {
      payload.preferred_workout_yoga_time = normalizePreferredWorkoutYogaTime(
        values.preferred_workout_yoga_time
      )
    }
    payload.preferred_workout_yoga_time_other = ''

    const assessmentCategoryId = values.assessment_category_id
    const selectedQuestionIds = getSelectedAssessmentQuestionIds(
      values.assessment_question_ids
    )
    const dataAssessmentAnswers = data?.assessment_answers
    const existingAnswers = Array.isArray(dataAssessmentAnswers)
      ? dataAssessmentAnswers
      : []
    if (assessmentCategoryId) {
      payload.assessment_answers_attributes = assessmentQuestionOptions.map(
        (question: any) => {
          const existingAnswer = existingAnswers.find(
            (answer: any) =>
              String(answer?.assessment_question_id) === String(question?.id)
          )
          return {
            ...(existingAnswer?.id ? { id: existingAnswer.id } : {}),
            assessment_category_id: Number(assessmentCategoryId),
            assessment_question_id: Number(question.id),
            answer: selectedQuestionIds.includes(String(question.id)),
          }
        }
      ) as any
    }

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
          normalizeAdditionalData(extractAdditionalPayload(res)) || payload

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

  const openModal = (mode: 'create' | 'edit' | 'view') => {
    if (mode === 'create') {
      reset(defaultValuesWithUserMetrics)
    } else if (mode === 'view') {
      reset(transformForView(data ?? defaultValuesWithUserMetrics))
    } else {
      reset(transformForForm(data ?? defaultValuesWithUserMetrics))
    }
    setModalMode(mode)
  }

  const handleModalClose = () => {
    reset(data ? transformForForm(data) : defaultValuesWithUserMetrics)
    setModalMode(null)
  }

  const formHeading =
    modalMode === 'view'
      ? 'Nutritional Assessment Details'
      : modalMode === 'edit'
        ? 'Edit Nutritional Assessment'
        : 'Create Nutritional Assessment'
  const disableSubmit = saving || (!isDirty && !hasSavedData)
  const viewMode = modalMode === 'view'

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
                .map((field) =>
                  buildFieldConfig(field, watchedValues, viewMode)
                )}
              edit
              spacing
            />
            {/* {section.title === 'Program Overview' && (
              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormBuilder
                  data={[
                    {
                      name: 'assessment_category_name',
                      id: 'assessment_category_id',
                      label: 'Assessment Category',
                      type: 'custom_select',
                      placeholder: 'Select assessment category',
                      desc: 'name',
                      descId: 'id',
                      data: assessmentCategories,
                      initialLoad: true,
                      async: false,
                      notDataMessage: 'No categories found',
                      disabled: viewMode,
                      handleCallBack: () => {
                        setValue('assessment_question_ids', [], {
                          shouldDirty: true,
                        })
                      },
                    },
                  ]}
                  edit
                />
                <FormBuilder
                  data={[
                    {
                      name: 'assessment_question_ids',
                      id: 'assessment_question_ids',
                      label: 'Assessment Question',
                      type: 'multi_select',
                      placeholder: 'Select assessment questions',
                      desc: 'question_text',
                      descId: 'id',
                      data: assessmentQuestionOptions,
                      getData: () => assessmentQuestionOptions,
                      selectedItems: selectedAssessmentQuestionItems,
                      initialLoad: true,
                      async: false,
                      isMultiple: true,
                      notDataMessage: selectedAssessmentCategoryId
                        ? 'No questions found'
                        : 'Select assessment category first',
                    },
                  ]}
                  edit={!viewMode}
                />
              </div>
            )} */}
          </div>
        ))}
        {!viewMode && (
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
        )}
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
        <button
          type="button"
          className="px-4 py-2 rounded-md bg-primaryGreen text-white text-sm"
          onClick={() => openModal('create')}
        >
          Create
        </button>
      </div>

      {hasSavedData ? (
        <SmartTable
          data={assessmentRows}
          dataRowKey="id"
          toolbar={false}
          search={false}
          height={assessmentRows.length === 0 ? 300 : 520}
          emptyTitle="No nutritional assessment to display"
          emptySubTitle=""
          columns={assessmentColumns}
          pagination={false}
          externalActions={true}
          actionProps={[
            {
              icon: <Icons name="eye" />,
              title: 'View',
              toolTip: 'View',
              action: () => openModal('view'),
            },
            {
              icon: <Icons name="edit" />,
              title: 'Edit',
              toolTip: 'Edit',
              action: () => openModal('edit'),
            },
          ]}
        />
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
