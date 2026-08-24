import moment from 'moment'
import { useEffect, useMemo, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'

import FormBuilder from '../../components/app/formBuilder'
import Button from '../../components/common/buttons/Button'
import {
  completePublicClientRegistration,
  getPublicClientRegistration,
} from './api'

const genderOptions = [
  { id: 'male', name: 'Male' },
  { id: 'female', name: 'Female' },
  { id: 'others', name: 'Other' },
]

const lifestyleOptions = [
  { id: 'Mostly sitting', name: 'Mostly sitting' },
  { id: 'Standing and light movement', name: 'Standing and light movement' },
  { id: 'Active lifestyle', name: 'Active lifestyle' },
  { id: 'Physically intense lifestyle', name: 'Physically intense lifestyle' },
]

const goalOptions = [
  { id: 'Weight Loss', name: 'Weight Loss' },
  { id: 'Muscle Gain', name: 'Muscle Gain' },
  { id: 'Wellness', name: 'Wellness' },
  { id: 'Maintenance', name: 'Maintenance' },
  { id: 'Disease Management', name: 'Disease Management' },
  { id: 'Weight Gain', name: 'Weight Gain' },
  { id: 'Muscle Loss', name: 'Muscle Loss' },
]

const foodPreferenceOptions = [
  { id: 'Vegetarian', name: 'Vegetarian' },
  { id: 'Non-Vegetarian', name: 'Non-Vegetarian' },
  { id: 'Eggetarian', name: 'Eggetarian' },
  { id: 'Vegan', name: 'Vegan' },
  { id: 'Pescatarian', name: 'Pescatarian' },
]

const medicalConditionOptions = [
  { id: 'None', name: 'None' },
  { id: 'PCOD', name: 'PCOD' },
  { id: 'Diabetes', name: 'Diabetes' },
  { id: 'Hypertension', name: 'Hypertension' },
  { id: 'Other', name: 'Other' },
]

const foodAllergyOptions = [
  { id: 'None', name: 'None' },
  { id: 'Peanuts', name: 'Peanuts' },
  { id: 'Tree Nuts', name: 'Tree Nuts' },
  { id: 'Gluten', name: 'Gluten' },
  { id: 'Shellfish', name: 'Shellfish' },
  { id: 'Latex Fruit Syndrome', name: 'Latex Fruit Syndrome' },
  { id: 'Other', name: 'Other' },
]

const workScheduleOptions = [
  { id: 'Day shift', name: 'Day shift' },
  { id: 'Night shift', name: 'Night shift' },
  { id: 'Rotational shift', name: 'Rotational shift' },
  { id: 'Flexible', name: 'Flexible' },
]

const getOptionLabel = (value: any) => {
  if (value && typeof value === 'object') {
    return value.name ?? value.label ?? value.value ?? value.id ?? ''
  }
  return value ?? ''
}

const normalizeGender = (value: any) => {
  const normalized = String(getOptionLabel(value)).trim().toLowerCase()
  if (normalized === 'male') return 'male'
  if (normalized === 'female') return 'female'
  if (normalized === 'other' || normalized === 'others') return 'others'
  return ''
}

const toMultiSelectValue = (value: any, options: any[]) => {
  const values = Array.isArray(value)
    ? value
    : String(value ?? '')
        .split(',')
        .map((entry) => entry.trim())
        .filter(Boolean)

  return values.map((entry: any, index: number) => {
    const label = String(getOptionLabel(entry)).trim()
    const match = options.find(
      (option) =>
        option.id.toLowerCase() === label.toLowerCase() ||
        option.name.toLowerCase() === label.toLowerCase()
    )
    return match ?? { id: label || `custom-${index}`, name: label }
  })
}

const serializeMultiSelect = (value: any) =>
  (Array.isArray(value) ? value : [value])
    .map((entry) => String(getOptionLabel(entry)).trim())
    .filter(Boolean)
    .join(',')

const formatDate = (value: any) => {
  if (!value) return ''
  if (value instanceof Date) return moment(value).format('YYYY-MM-DD')
  return moment(value).isValid() ? moment(value).format('YYYY-MM-DD') : value
}

export default function PublicClientRegistration() {
  const { token = '' } = useParams()
  const { data, isLoading, error } = useQuery(
    ['public_client_registration', token],
    () => getPublicClientRegistration(token),
    { enabled: Boolean(token), retry: 1 }
  )
  const client = useMemo(() => data?.client || {}, [data?.client])
  const methods = useForm<any>({ mode: 'onChange' })
  const { handleSubmit, reset } = methods
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [completed, setCompleted] = useState(false)

  useEffect(() => {
    if (!client.id) return

    reset({
      name: client.name || '',
      email: client.email || '',
      password: '',
      password_confirmation: '',
      phone: client.phone || '',
      role: 'Client',
      gender:
        genderOptions.find(
          (option) => option.id === normalizeGender(client.gender)
        )?.name || '',
      date_of_birth: client.date_of_birth || '',
      height: client.height ?? '',
      weight: client.weight ?? '',
      lifestyle: client.lifestyle || '',
      goal: client.goal || '',
      food_preferences: client.food_preferences || '',
      medical_conditions: toMultiSelectValue(
        client.medical_conditions,
        medicalConditionOptions
      ),
      food_allergies: toMultiSelectValue(
        client.food_allergies,
        foodAllergyOptions
      ),
      state: client.state || '',
      country: client.country || '',
      language: client.language || '',
      work_schedule: client.work_schedule || '',
      occupation: client.occupation || '',
    })
  }, [client, reset])

  const formFields = useMemo(
    () => [
      {
        name: 'name',
        id: 'name',
        label: 'Name',
        type: 'text',
        required: true,
        placeholder: 'Enter full name',
      },
      {
        name: 'email',
        id: 'email',
        label: 'Email',
        type: 'email',
        required: true,
        placeholder: 'Enter email',
      },
      {
        name: 'password',
        id: 'password',
        label: 'Password',
        type: 'password',
        required: true,
        placeholder: 'Enter password',
      },
      {
        name: 'password_confirmation',
        id: 'password_confirmation',
        label: 'Confirm Password',
        type: 'password',
        required: true,
        placeholder: 'Re-enter password',
      },
      {
        name: 'phone',
        id: 'phone',
        label: 'Phone Number',
        type: 'text',
        required: true,
        placeholder: 'Enter phone number',
        digitsOnly: true,
        maxLength: 10,
      },
      {
        name: 'role',
        id: 'role',
        label: 'Role',
        type: 'custom_select',
        required: true,
        desc: 'name',
        descId: 'id',
        data: [{ id: 'client', name: 'Client' }],
        placeholder: 'Client',
        disabled: true,
      },
      {
        name: 'gender',
        id: 'gender',
        label: 'Gender',
        type: 'custom_select',
        required: true,
        desc: 'name',
        descId: 'id',
        data: genderOptions,
        placeholder: 'Select gender',
      },
      {
        name: 'date_of_birth',
        id: 'date_of_birth',
        label: 'Date of Birth',
        type: 'date',
        required: true,
        maxDate: new Date(),
      },
      {
        name: 'height',
        id: 'height',
        label: 'Height (cm)',
        type: 'text',
        required: true,
        placeholder: 'Enter height in cm',
        allowPositiveOnly: true,
        maxLength: 3,
      },
      {
        name: 'weight',
        id: 'weight',
        label: 'Weight (kg)',
        type: 'text',
        required: true,
        placeholder: 'Enter weight in kg',
        allowPositiveOnly: true,
        maxLength: 5,
      },
      {
        name: 'lifestyle',
        id: 'lifestyle',
        label: 'Lifestyle',
        type: 'custom_select',
        desc: 'name',
        descId: 'id',
        data: lifestyleOptions,
        placeholder: 'Select lifestyle',
      },
      {
        name: 'goal',
        id: 'goal',
        label: 'Goal',
        type: 'custom_select',
        desc: 'name',
        descId: 'id',
        data: goalOptions,
        placeholder: 'Select Goal',
      },
      {
        name: 'food_preferences',
        id: 'food_preferences',
        label: 'Food Preferences',
        type: 'custom_select',
        desc: 'name',
        descId: 'id',
        data: foodPreferenceOptions,
        placeholder: 'Select food preference',
      },
      {
        name: 'medical_conditions',
        id: 'medical_conditions',
        label: 'Medical Conditions',
        type: 'multi_select',
        desc: 'name',
        descId: 'id',
        data: medicalConditionOptions,
        getData: () => medicalConditionOptions,
        placeholder: 'Select medical conditions',
        initialLoad: true,
        isMultiple: true,
      },
      {
        name: 'food_allergies',
        id: 'food_allergies',
        label: 'Food Allergies',
        type: 'multi_select',
        desc: 'name',
        descId: 'id',
        data: foodAllergyOptions,
        getData: () => foodAllergyOptions,
        placeholder: 'Select food allergies',
        initialLoad: true,
        isMultiple: true,
      },
      {
        name: 'state',
        id: 'state',
        label: 'State',
        type: 'text',
        placeholder: 'Enter state',
      },
      {
        name: 'country',
        id: 'country',
        label: 'Country',
        type: 'text',
        placeholder: 'Enter country',
      },
      {
        name: 'language',
        id: 'language',
        label: 'Language',
        type: 'text',
        placeholder: 'Enter language',
      },
      {
        name: 'work_schedule',
        id: 'work_schedule',
        label: 'Work Schedule',
        type: 'custom_select',
        desc: 'name',
        descId: 'id',
        data: workScheduleOptions,
        placeholder: 'Select work schedule',
      },
      {
        name: 'occupation',
        id: 'occupation',
        label: 'Occupation',
        type: 'text',
        placeholder: 'Enter occupation',
      },
    ],
    []
  )

  const submit = async (values: any) => {
    try {
      setBusy(true)
      setMessage('')
      const { name, email, password, password_confirmation, phone } = values
      await completePublicClientRegistration(token, {
        name,
        email,
        password,
        password_confirmation,
        phone,
        profile: {
          gender: normalizeGender(values.gender),
          date_of_birth: formatDate(values.date_of_birth),
          height: values.height,
          weight: values.weight,
          lifestyle: getOptionLabel(values.lifestyle),
          goal: getOptionLabel(values.goal),
          food_preferences: getOptionLabel(values.food_preferences),
          medical_conditions: serializeMultiSelect(values.medical_conditions),
          food_allergies: serializeMultiSelect(values.food_allergies),
          state: values.state,
          country: values.country,
          language: values.language,
          work_schedule: getOptionLabel(values.work_schedule),
          occupation: values.occupation,
        },
      })
      setCompleted(true)
      setMessage('Profile completed successfully. You can now log in.')
    } catch (requestError: any) {
      setMessage(
        requestError?.response?.data?.errors?.join?.(', ') ||
          requestError?.response?.data?.error ||
          'Unable to complete profile.'
      )
    } finally {
      setBusy(false)
    }
  }

  if (isLoading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading your profile...
      </div>
    )
  if (error || !data?.client)
    return (
      <div className="min-h-screen flex items-center justify-center p-5">
        <div className="rounded-xl border bg-white p-8">
          This profile link is unavailable or expired.
        </div>
      </div>
    )

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6">
      <div className="mx-auto w-full max-w-5xl rounded-2xl border border-formBorder bg-white p-5 shadow-sm sm:p-8">
        <div className="mb-7 border-b border-formBorder pb-5">
          <h1 className="text-2xl font-semibold text-primaryText">
            Complete your profile
          </h1>
          <p className="mt-1 text-sm text-secondary">
            Enter your details and create a password to activate your Client
            account.
          </p>
        </div>

        <form onSubmit={handleSubmit(submit)}>
          <FormProvider {...methods}>
            <FormBuilder data={formFields} edit spacing />
          </FormProvider>

          <div className="mt-7 border-t border-formBorder pt-5">
            <Button
              type="submit"
              label={completed ? 'Profile completed' : 'Complete registration'}
              fullwidth
              isLoading={busy}
              disabled={completed}
            />
            {message && (
              <div
                className={`mt-3 text-center text-sm ${completed ? 'text-emerald-700' : 'text-error'}`}
              >
                {message}
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
