import moment from 'moment'
import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'

import {
  completePublicClientRegistration,
  getPublicClientRegistration,
} from './api'

const accent = '#0fc8cd'

const genderOptions = [
  { id: 'female', name: 'Female', icon: '♀' },
  { id: 'male', name: 'Male', icon: '♂' },
  { id: 'others', name: 'Other', icon: '⚧' },
]

const lifestyleOptions = [
  {
    id: 'Mostly sitting',
    name: 'Mostly sitting',
    desc: 'Desk job, minimal movement',
    icon: '🪑',
  },
  {
    id: 'Standing and light movement',
    name: 'Standing & Light movement',
    desc: 'Walk daily, light activities',
    icon: '🚶',
  },
  {
    id: 'Active lifestyle',
    name: 'Active Lifestyle',
    desc: 'Regular exercise, sports, and physical hobbies',
    icon: '🏃',
  },
  {
    id: 'Physically intense lifestyle',
    name: 'Physically Intense Lifestyle',
    desc: 'Intense workouts, heavy labor, high exertion',
    icon: '💪',
  },
]

const goalOptions = [
  {
    id: 'Weight Loss',
    name: 'Weight loss',
    desc: 'Lose excess weight and improve body composition',
    icon: '📉',
  },
  {
    id: 'Muscle Gain',
    name: 'Muscle Gain',
    desc: 'Build muscle mass and increase strength',
    icon: '🏋️',
  },
  {
    id: 'Wellness',
    name: 'Wellness',
    desc: 'Maintain overall health and prevent diseases',
    icon: '🧘',
  },
  {
    id: 'Maintenance',
    name: 'Maintenance',
    desc: 'Maintain current weight and fitness level',
    icon: '⚖️',
  },
  {
    id: 'Disease Management',
    name: 'Disease Management',
    desc: 'Manage a specific health condition',
    icon: '🏥',
  },
  {
    id: 'Weight Gain',
    name: 'Weight Gain',
    desc: 'Gain healthy weight and build mass',
    icon: '📈',
  },
  {
    id: 'Muscle Loss',
    name: 'Muscle Loss',
    desc: 'Reduce muscle mass for specific goals',
    icon: '🔄',
  },
]

const foodPreferenceOptions = [
  {
    id: 'Non-Vegetarian',
    name: 'Non-vegetarian',
    desc: 'Enjoy all foods',
    icon: '🍖',
  },
  {
    id: 'Vegetarian',
    name: 'Vegetarian',
    desc: 'No fish, meat or eggs but dairy is okay',
    icon: '🥬',
  },
  {
    id: 'Eggetarian',
    name: 'Eggetarian',
    desc: 'Vegetarian but includes eggs',
    icon: '🥚',
  },
  { id: 'Vegan', name: 'Vegan', desc: 'No animal products', icon: '🌱' },
  {
    id: 'Pescatarian',
    name: 'Pescatarian',
    desc: 'Vegetarian with fish',
    icon: '🐟',
  },
]

const medicalConditionOptions = [
  {
    id: 'None',
    name: 'None',
    desc: 'No existing medical conditions',
    icon: '✅',
  },
  { id: 'PCOD', name: 'PCOD', desc: 'Polycystic Ovary Disorder', icon: '💗' },
  {
    id: 'Diabetes',
    name: 'Diabetes',
    desc: 'Type 1 or Type 2 Diabetes',
    icon: '💧',
  },
  {
    id: 'Hypertension',
    name: 'Hypertension',
    desc: 'High Blood Pressure',
    icon: '💓',
  },
  { id: 'Other', name: 'Other', desc: 'Other medical condition', icon: '❓' },
]

const foodAllergyOptions = [
  { id: 'None', name: 'None', desc: 'No food allergies', icon: '⬜' },
  {
    id: 'Peanuts',
    name: 'Peanuts',
    desc: 'A legume, different from tree nuts',
    icon: '🥜',
  },
  {
    id: 'Tree Nuts',
    name: 'Tree Nuts',
    desc: 'Almonds, Cashews, Walnuts, Pistachios',
    icon: '🌰',
  },
  {
    id: 'Gluten',
    name: 'Gluten',
    desc: 'Celiac disease or sensitivity',
    icon: '🌾',
  },
  {
    id: 'Shellfish',
    name: 'Shellfish',
    desc: 'Shrimp, crab, lobster',
    icon: '🦐',
  },
  {
    id: 'Latex Fruit Syndrome',
    name: 'Latex Fruit Syndrome',
    desc: 'Banana, avocado, kiwi allergy',
    icon: '🍌',
  },
  { id: 'Other', name: 'Other', desc: 'Other food allergy', icon: '❓' },
]

const getOptionLabel = (value: any) => {
  if (value && typeof value === 'object')
    return value.name ?? value.label ?? value.value ?? value.id ?? ''
  return value ?? ''
}

const normalizeGender = (value: any) => {
  const n = String(getOptionLabel(value)).trim().toLowerCase()
  if (n === 'male') return 'male'
  if (n === 'female') return 'female'
  if (n === 'other' || n === 'others') return 'others'
  return ''
}

const toMultiSelectValue = (value: any, options: any[]) => {
  const values = Array.isArray(value)
    ? value
    : String(value ?? '')
        .split(',')
        .map((e) => e.trim())
        .filter(Boolean)
  return values.map((entry: any, i: number) => {
    const label = String(getOptionLabel(entry)).trim()
    const match = options.find(
      (o) =>
        o.id.toLowerCase() === label.toLowerCase() ||
        o.name.toLowerCase() === label.toLowerCase()
    )
    return match ?? { id: label || `custom-${i}`, name: label }
  })
}

const serializeMultiSelect = (value: any) =>
  (Array.isArray(value) ? value : [value])
    .map((e) => String(getOptionLabel(e)).trim())
    .filter(Boolean)
    .join(',')

const formatDate = (value: any) => {
  if (!value) return ''
  if (value instanceof Date) return moment(value).format('YYYY-MM-DD')
  return moment(value).isValid() ? moment(value).format('YYYY-MM-DD') : value
}

interface StepDef {
  id: string
  title: string
  type:
    | 'text'
    | 'multi_text'
    | 'single_select'
    | 'multi_select'
    | 'slider'
    | 'date'
  fieldName?: string
  fieldNames?: string[]
  options?: any[]
  config?: any
}

const steps: StepDef[] = [
  {
    id: 'basics',
    title: "What's your name?",
    type: 'multi_text',
    fieldNames: ['name', 'phone', 'country', 'state'],
    config: {
      fields: [
        {
          name: 'name',
          placeholder: 'Enter your name',
          label: "What's your name?",
        },
        {
          name: 'phone',
          placeholder: 'Enter your phone number',
          label: "What's your phone number?",
          maxLength: 10,
        },
        {
          name: 'country',
          placeholder: 'Enter your nationality',
          label: "What's your Nationality?",
        },
        {
          name: 'state',
          placeholder: 'Enter your state',
          label: "What's your state?",
        },
      ],
    },
  },
  {
    id: 'password',
    title: 'Set your password',
    type: 'multi_text',
    fieldNames: ['password', 'password_confirmation'],
    config: {
      fields: [
        {
          name: 'password',
          placeholder: 'Create a password',
          label: 'Create a password',
          inputType: 'password',
        },
        {
          name: 'password_confirmation',
          placeholder: 'Re-enter your password',
          label: 'Confirm your password',
          inputType: 'password',
        },
      ],
    },
  },
  {
    id: 'gender',
    title: 'What is your gender?',
    type: 'single_select',
    fieldName: 'gender',
    options: genderOptions,
  },
  {
    id: 'dob',
    title: "What's your date of birth?",
    type: 'date',
    fieldName: 'date_of_birth',
  },
  {
    id: 'height',
    title: "What's your height?",
    type: 'slider',
    fieldName: 'height',
    config: { min: 100, max: 250, unit: 'cm', step: 1 },
  },
  {
    id: 'weight',
    title: "What's your current weight?",
    type: 'slider',
    fieldName: 'weight',
    config: { min: 30, max: 200, unit: 'kg', step: 1 },
  },
  {
    id: 'medical',
    title: 'Any medical conditions?',
    type: 'multi_select',
    fieldName: 'medical_conditions',
    options: medicalConditionOptions,
  },
  {
    id: 'lifestyle',
    title: 'How active are you?',
    type: 'single_select',
    fieldName: 'lifestyle',
    options: lifestyleOptions,
  },
  {
    id: 'goal',
    title: "What's your primary goal?",
    type: 'single_select',
    fieldName: 'goal',
    options: goalOptions,
  },
  {
    id: 'diet',
    title: 'Your diet preference?',
    type: 'single_select',
    fieldName: 'food_preferences',
    options: foodPreferenceOptions,
  },
  {
    id: 'allergies',
    title: 'Have any food allergies?',
    type: 'multi_select',
    fieldName: 'food_allergies',
    options: foodAllergyOptions,
  },
]

export default function PublicClientRegistration() {
  const { token = '' } = useParams()
  const { data, isLoading, error } = useQuery(
    ['public_client_registration', token],
    () => getPublicClientRegistration(token),
    { enabled: Boolean(token), retry: 1 }
  )
  const client = useMemo(() => data?.client || {}, [data?.client])
  const methods = useForm<any>({ mode: 'onChange' })
  const { handleSubmit, reset, setValue, watch, trigger } = methods
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [completed, setCompleted] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [direction, setDirection] = useState<'next' | 'back'>('next')
  const [visiblePasswords, setVisiblePasswords] = useState<
    Record<string, boolean>
  >({})

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
        genderOptions.find((o) => o.id === normalizeGender(client.gender))
          ?.name || '',
      date_of_birth: client.date_of_birth || '',
      height: client.height ?? '168',
      weight: client.weight ?? '70',
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

  const step = steps[currentStep]
  const totalSteps = steps.length
  const fieldName = step.fieldName || ''

  const goNext = async () => {
    if (step.type === 'multi_text' && step.fieldNames) {
      for (const fn of step.fieldNames) {
        const val = watch(fn)
        if (!val || (typeof val === 'string' && !val.trim())) {
          setMessage('Please fill in all required fields.')
          return
        }
      }
      if (step.id === 'password') {
        const pw = watch('password') || ''
        const pwc = watch('password_confirmation') || ''
        if (pw.length < 6) {
          setMessage('Password must be at least 6 characters.')
          return
        }
        if (pw !== pwc) {
          setMessage('Passwords do not match.')
          return
        }
        setMessage('')
      }
    } else if (step.type === 'date') {
      const val = watch(fieldName)
      if (!val) {
        setMessage('Please select a date.')
        return
      }
    } else if (step.type === 'slider') {
      const val = watch(fieldName)
      if (!val && val !== 0) {
        setMessage('Please select a value.')
        return
      }
    } else if (step.type === 'single_select') {
      const val = watch(fieldName)
      if (!val) {
        setMessage('Please select an option.')
        return
      }
    } else if (step.type === 'multi_select') {
      const val = watch(fieldName)
      if (!val || (Array.isArray(val) && val.length === 0)) {
        setMessage('Please select at least one option.')
        return
      }
    } else if (step.fieldName) {
      const valid = await trigger(step.fieldName)
      if (!valid) return
    }
    setMessage('')
    if (currentStep < totalSteps - 1) {
      setDirection('next')
      setCurrentStep((s) => s + 1)
    }
  }

  const goBack = () => {
    if (currentStep > 0) {
      setDirection('back')
      setCurrentStep((s) => s - 1)
    }
  }

  const toggleMultiSelect = (fieldName: string, optionId: string) => {
    const current = watch(fieldName) || []
    const arr = Array.isArray(current) ? current : []
    const exists = arr.some(
      (v: any) => getOptionLabel(v).toLowerCase() === optionId.toLowerCase()
    )
    if (exists) {
      setValue(
        fieldName,
        arr.filter(
          (v: any) => getOptionLabel(v).toLowerCase() !== optionId.toLowerCase()
        ),
        { shouldDirty: true }
      )
    } else {
      const opt = steps
        .find((s) => s.fieldName === fieldName)
        ?.options?.find((o) => o.id === optionId)
      setValue(fieldName, [...arr, opt || { id: optionId, name: optionId }], {
        shouldDirty: true,
      })
    }
  }

  const isMultiSelected = (fieldName: string, optionId: string) => {
    const val = watch(fieldName)
    const arr = Array.isArray(val) ? val : []
    return arr.some(
      (v: any) => getOptionLabel(v).toLowerCase() === optionId.toLowerCase()
    )
  }

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
    } catch (e: any) {
      setMessage(
        e?.response?.data?.errors?.join?.(', ') ||
          e?.response?.data?.error ||
          'Unable to complete profile.'
      )
    } finally {
      setBusy(false)
    }
  }

  if (isLoading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50/30">
        <div className="text-center bg-white rounded-2xl border border-slate-200 shadow-xl p-10">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-cyan-500" />
          <p className="mt-4 text-slate-600 font-medium">
            Loading your profile...
          </p>
        </div>
      </div>
    )

  if (error || !data?.client)
    return (
      <div className="min-h-screen flex items-center justify-center px-5 bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50/30">
        <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xl">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 mb-4">
            <span className="text-2xl">⚠️</span>
          </div>
          <p className="text-slate-800 font-semibold text-lg">
            Link unavailable
          </p>
          <p className="mt-2 text-sm text-slate-500">
            This profile link has expired or is incorrect.
          </p>
        </div>
      </div>
    )

  if (completed)
    return (
      <div className="min-h-screen flex items-center justify-center px-5 bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50/30">
        <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xl">
          <div
            className="mx-auto flex h-20 w-20 items-center justify-center rounded-full mb-4"
            style={{ background: `${accent}14` }}
          >
            <div
              className="flex h-14 w-14 items-center justify-center rounded-full shadow-lg"
              style={{ background: accent }}
            >
              <svg width="28" height="28" viewBox="0 0 34 34" fill="none">
                <path
                  d="M8 17.5l6 6L27 10"
                  stroke="white"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            Profile Completed!
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            You can now log in with your credentials.
          </p>
        </div>
      </div>
    )

  return (
    <div className="min-h-screen h-screen flex overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50/30">
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes slideInRight { from { opacity: 0; transform: translateX(40px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes slideInLeft { from { opacity: 0; transform: translateX(-40px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-12px); } }
        .step-enter { animation: ${direction === 'next' ? 'slideInRight' : 'slideInLeft'} .3s ease-out both; }
        .option-card { transition: all .2s ease; }
        .option-card:active { transform: scale(0.97); }
        .option-card.selected { border-color: ${accent} !important; background: ${accent}0d !important; }
        .option-card.selected .opt-icon { background: ${accent} !important; color: white !important; }
        .option-card.selected .opt-check { opacity: 1 !important; }
        input[type="range"] { -webkit-appearance: none; appearance: none; width: 100%; height: 4px; border-radius: 2px; background: #e2e8f0; outline: none; }
        input[type="range"]::-webkit-slider-thumb { -webkit-appearance: none; width: 24px; height: 24px; border-radius: 50%; background: ${accent}; cursor: pointer; box-shadow: 0 2px 8px ${accent}50; }
        input[type="range"]::-moz-range-thumb { width: 24px; height: 24px; border-radius: 50%; background: ${accent}; cursor: pointer; border: none; }
        .reg-scroll::-webkit-scrollbar { width: 3px; }
        .reg-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
        @media (min-width: 768px) { .reg-gender-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; } }
        @media (min-width: 1024px) { .reg-float { animation: float 4s ease-in-out infinite; } .reg-float-d1 { animation-delay: 1s; } .reg-float-d2 { animation-delay: 2s; } }
      `}</style>

      <div
        className="hidden lg:flex lg:w-[45%] xl:w-[50%] relative overflow-hidden flex-col items-center justify-center p-10"
        style={{
          background:
            'linear-gradient(135deg, #0fc8cd 0%, #0891b2 50%, #0e7490 100%)',
        }}
      >
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-[10%] left-[15%] w-24 h-24 rounded-full bg-white/30 reg-float" />
          <div className="absolute top-[30%] right-[10%] w-16 h-16 rounded-full bg-white/20 reg-float reg-float-d1" />
          <div className="absolute bottom-[20%] left-[20%] w-20 h-20 rounded-full bg-white/25 reg-float reg-float-d2" />
          <div className="absolute bottom-[15%] right-[25%] w-12 h-12 rounded-full bg-white/20 reg-float" />
        </div>
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse at 70% 30%, rgba(255,255,255,0.15) 0%, transparent 60%)',
          }}
        />

        <div className="relative z-10 text-center max-w-md">
          <img
            src="/gfm-logo.png"
            alt="Get Fit Malayali"
            className="h-16 mx-auto mb-8 drop-shadow-lg"
          />
          <h2 className="text-3xl xl:text-4xl font-bold text-white leading-tight mb-4">
            Your fitness journey
            <br />
            starts here
          </h2>
          <p className="text-white/70 text-sm leading-relaxed mb-8">
            Share a few details and we will create a personalized health plan
            that truly works for you.
          </p>
          <div className="flex items-center justify-center gap-6 text-white/60 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center text-sm">
                💪
              </div>
              <span>Personalized Plans</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center text-sm">
                🎯
              </div>
              <span>Expert Guidance</span>
            </div>
          </div>
        </div>

        <div className="absolute bottom-6 left-0 right-0 text-center">
          <span className="text-white/40 text-xs">
            Powered by Get Fit Malayali
          </span>
        </div>
      </div>

      <div className="w-full lg:w-[55%] xl:w-[50%] flex flex-col h-full">
        <div className="flex items-center justify-between px-5 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-2 shrink-0">
          <div className="flex items-center gap-3">
            <img
              src="/gfm-logo.png"
              alt="Get Fit"
              className="h-7 sm:h-8 lg:hidden w-auto object-contain"
            />
            <div
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center"
              style={{ background: `${accent}20` }}
            >
              <div
                className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full"
                style={{ background: accent }}
              />
            </div>
          </div>
        </div>

        <div className="px-5 sm:px-6 lg:px-8 py-2 sm:py-3 shrink-0">
          <div className="flex gap-1 sm:gap-1.5">
            {steps.map((_, i) => (
              <div
                key={i}
                className="flex-1 h-1 rounded-full overflow-hidden"
                style={{ background: '#e2e8f0' }}
              >
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: i <= currentStep ? '100%' : '0%',
                    background: i <= currentStep ? accent : '#e2e8f0',
                    opacity: i === currentStep ? 1 : i < currentStep ? 0.6 : 0,
                  }}
                />
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="text-[10px] text-slate-400">
              {currentStep + 1} of {totalSteps}
            </span>
            <span className="text-[10px] text-slate-400">
              {Math.round(((currentStep + 1) / totalSteps) * 100)}%
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-hidden px-5 sm:px-6 lg:px-8 flex flex-col min-h-0">
          <div className="text-center pt-3 sm:pt-4 lg:pt-6 pb-1 sm:pb-2 shrink-0">
            <h1
              className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold"
              style={{ color: accent }}
            >
              {"Let's Begin!"}
            </h1>
            <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm lg:text-base text-slate-500 px-2 sm:px-4">
              Sharing these few details will help us create a health plan that
              truly works for you.
            </p>
          </div>

          <div
            className="flex-1 min-h-0 overflow-y-auto pt-3 sm:pt-4 lg:pt-6 pb-4 step-enter reg-scroll"
            key={currentStep}
          >
            {step.type === 'multi_text' && step.config && (
              <div className="space-y-4 sm:space-y-5 lg:space-y-6 lg:max-w-lg lg:mx-auto">
                {step.config.fields.map((f: any) => (
                  <div key={f.name}>
                    <h3 className="text-base sm:text-lg lg:text-xl font-bold text-slate-900 mb-2 sm:mb-3 text-center">
                      {f.label}
                    </h3>
                    <div className="relative">
                      <input
                        type={
                          f.inputType === 'password'
                            ? visiblePasswords[f.name]
                              ? 'text'
                              : 'password'
                            : f.name === 'phone'
                              ? 'tel'
                              : 'text'
                        }
                        value={watch(f.name) || ''}
                        onChange={(e) => {
                          let val = e.target.value
                          if (f.maxLength && f.name === 'phone')
                            val = val.replace(/\D/g, '').slice(0, f.maxLength)
                          setValue(f.name, val, {
                            shouldDirty: true,
                            shouldValidate: true,
                          })
                        }}
                        placeholder={f.placeholder}
                        maxLength={f.maxLength}
                        className={`w-full rounded-xl border border-slate-200 bg-white py-3.5 sm:py-4 lg:py-5 text-slate-900 text-sm sm:text-base lg:text-lg placeholder-slate-400 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 transition shadow-sm ${f.inputType === 'password' ? 'pl-4 sm:pl-5 pr-12 sm:pr-14' : 'px-4 sm:px-5'}`}
                      />
                      {f.inputType === 'password' && (
                        <button
                          type="button"
                          onClick={() =>
                            setVisiblePasswords((prev) => ({
                              ...prev,
                              [f.name]: !prev[f.name],
                            }))
                          }
                          className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
                        >
                          {visiblePasswords[f.name] ? (
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={1.5}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                              />
                            </svg>
                          ) : (
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={1.5}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                            </svg>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {step.type === 'date' && (
              <div className="text-center lg:max-w-lg lg:mx-auto">
                {watch(fieldName) ? (
                  <div
                    className="inline-block rounded-xl border-2 px-5 sm:px-6 lg:px-8 py-3 sm:py-4 lg:py-5 mb-4 sm:mb-6 lg:mb-8 shadow-sm"
                    style={{ borderColor: accent }}
                  >
                    <div
                      className="text-base sm:text-lg lg:text-xl font-bold"
                      style={{ color: accent }}
                    >
                      {moment(watch(fieldName)).format('MMMM D, YYYY')}
                    </div>
                    <div className="text-xs sm:text-sm lg:text-base text-slate-500 mt-1">
                      Age: {moment().diff(moment(watch(fieldName)), 'years')}{' '}
                      years
                    </div>
                  </div>
                ) : (
                  <div className="inline-block rounded-xl border border-slate-200 bg-slate-50 px-5 sm:px-6 lg:px-8 py-3 sm:py-4 lg:py-5 mb-4 sm:mb-6 lg:mb-8 shadow-sm">
                    <div className="text-sm lg:text-base text-slate-400">
                      Select your date of birth
                    </div>
                  </div>
                )}
                <input
                  type="date"
                  value={watch(fieldName) || ''}
                  onChange={(e) =>
                    setValue(fieldName, e.target.value, { shouldDirty: true })
                  }
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 sm:px-5 py-3.5 sm:py-4 lg:py-5 text-slate-900 text-sm sm:text-base lg:text-lg outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 transition shadow-sm"
                />
              </div>
            )}

            {step.type === 'slider' && step.config && (
              <div className="text-center pt-6 sm:pt-8 lg:pt-10 lg:max-w-lg lg:mx-auto">
                <div className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black text-slate-900 mb-1">
                  {watch(fieldName) || step.config.min}
                </div>
                <div className="text-lg sm:text-xl lg:text-2xl text-slate-400 font-medium mb-6 sm:mb-8 lg:mb-10">
                  {step.config.unit}
                </div>
                <div className="px-2 sm:px-4 lg:px-6">
                  <input
                    type="range"
                    min={step.config.min}
                    max={step.config.max}
                    step={step.config.step}
                    value={watch(fieldName) || step.config.min}
                    onChange={(e) =>
                      setValue(fieldName, e.target.value, { shouldDirty: true })
                    }
                    className="w-full"
                  />
                  <div className="flex justify-between mt-2 sm:mt-3 text-[10px] sm:text-xs lg:text-sm text-slate-400">
                    <span>{step.config.min}</span>
                    <span>{step.config.max}</span>
                  </div>
                </div>
              </div>
            )}

            {step.type === 'single_select' && step.options && (
              <div
                className={
                  step.id === 'gender'
                    ? 'reg-gender-grid space-y-3 sm:space-y-0 lg:max-w-lg lg:mx-auto'
                    : 'space-y-2.5 sm:space-y-3 lg:max-w-lg lg:mx-auto'
                }
              >
                {step.options.map((opt) => {
                  const selected =
                    watch(fieldName) === opt.name || watch(fieldName) === opt.id
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() =>
                        setValue(fieldName, opt.name || opt.id, {
                          shouldDirty: true,
                        })
                      }
                      className={`option-card w-full flex items-center gap-3 sm:gap-4 lg:gap-5 rounded-xl border p-3 sm:p-4 lg:p-5 text-left ${selected ? 'selected' : 'border-slate-200 bg-white shadow-sm hover:shadow-md hover:border-slate-300'}`}
                    >
                      <div className="opt-icon flex h-10 w-10 sm:h-12 sm:w-12 lg:h-14 lg:w-14 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-lg sm:text-xl lg:text-2xl">
                        {opt.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-slate-900 font-semibold text-xs sm:text-sm lg:text-base">
                          {opt.name}
                        </div>
                        {opt.desc && (
                          <div className="text-slate-500 text-[10px] sm:text-xs lg:text-sm mt-0.5 leading-tight">
                            {opt.desc}
                          </div>
                        )}
                      </div>
                      <div
                        className="opt-check opacity-0 shrink-0 w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 rounded-full flex items-center justify-center"
                        style={{ background: accent }}
                      >
                        <svg
                          className="w-3 h-3 sm:w-3.5 sm:h-3.5 lg:w-4 lg:h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="white"
                          strokeWidth={3}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}

            {step.type === 'multi_select' && step.options && (
              <div className="space-y-2.5 sm:space-y-3 lg:max-w-lg lg:mx-auto">
                {step.options.map((opt) => {
                  const selected = isMultiSelected(fieldName, opt.id)
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => toggleMultiSelect(fieldName, opt.id)}
                      className={`option-card w-full flex items-center gap-3 sm:gap-4 lg:gap-5 rounded-xl border p-3 sm:p-4 lg:p-5 text-left ${selected ? 'selected' : 'border-slate-200 bg-white shadow-sm hover:shadow-md hover:border-slate-300'}`}
                    >
                      <div className="opt-icon flex h-10 w-10 sm:h-12 sm:w-12 lg:h-14 lg:w-14 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-lg sm:text-xl lg:text-2xl">
                        {opt.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-slate-900 font-semibold text-xs sm:text-sm lg:text-base">
                          {opt.name}
                        </div>
                        {opt.desc && (
                          <div className="text-slate-500 text-[10px] sm:text-xs lg:text-sm mt-0.5 leading-tight">
                            {opt.desc}
                          </div>
                        )}
                      </div>
                      <div
                        className="opt-check opacity-0 shrink-0 w-4.5 h-4.5 sm:w-5 sm:h-5 lg:w-6 lg:h-6 rounded border-2 flex items-center justify-center"
                        style={{
                          borderColor: selected ? accent : '#e2e8f0',
                          background: selected ? accent : 'transparent',
                        }}
                      >
                        {selected && (
                          <svg
                            className="w-2.5 h-2.5 sm:w-3 sm:h-3 lg:w-3.5 lg:h-3.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="white"
                            strokeWidth={3}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {message && (
          <div className="mx-5 sm:mx-6 lg:mx-8 mb-1 sm:mb-2 rounded-xl border border-red-200 bg-red-50 px-3 sm:px-4 py-2.5 sm:py-3 text-center text-xs sm:text-sm text-red-600 shrink-0">
            {message}
          </div>
        )}

        <div
          className="shrink-0 flex items-center justify-between gap-3 px-5 sm:px-6 lg:px-8 py-3 sm:py-4 pb-6 sm:pb-8 lg:max-w-lg lg:mx-auto lg:w-full"
          style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
        >
          {currentStep > 0 ? (
            <button
              type="button"
              onClick={goBack}
              className="flex items-center gap-1.5 sm:gap-2 rounded-full border border-slate-300 bg-white px-4 sm:px-6 py-2.5 sm:py-3 lg:py-3.5 text-xs sm:text-sm lg:text-base font-semibold text-slate-700 transition hover:bg-slate-50 active:scale-95 shadow-sm"
            >
              <svg
                className="w-3.5 h-3.5 sm:w-4 sm:h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back
            </button>
          ) : (
            <div />
          )}

          {currentStep === totalSteps - 1 ? (
            <button
              type="button"
              onClick={handleSubmit(submit)}
              disabled={busy}
              className="flex items-center gap-1.5 sm:gap-2 rounded-full px-5 sm:px-6 lg:px-8 py-2.5 sm:py-3 lg:py-3.5 text-xs sm:text-sm lg:text-base font-semibold text-white transition disabled:opacity-50 active:scale-95 shadow-lg"
              style={{
                background: accent,
                boxShadow: `0 4px 20px ${accent}40`,
              }}
            >
              {busy ? (
                <>
                  <div className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <span>Register</span>
                  <svg
                    className="w-3.5 h-3.5 sm:w-4 sm:h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={goNext}
              className="flex items-center gap-1.5 sm:gap-2 rounded-full px-5 sm:px-6 lg:px-8 py-2.5 sm:py-3 lg:py-3.5 text-xs sm:text-sm lg:text-base font-semibold text-white transition active:scale-95 shadow-lg"
              style={{
                background: accent,
                boxShadow: `0 4px 20px ${accent}40`,
              }}
            >
              <span>Next</span>
              <svg
                className="w-3.5 h-3.5 sm:w-4 sm:h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
