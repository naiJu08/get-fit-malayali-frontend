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
import {
  AdminSchema,
  formSchema,
  formSchemaNutritionist,
  formSchemaNutritionistEdit,
} from './schema'

type MedicalConditionOption = {
  id: string
  name: string
}

type FoodAllergyOption = {
  id: string
  name: string
}

const isMedicalConditionOption = (
  option: MedicalConditionOption | null
): option is MedicalConditionOption => Boolean(option)

const isFoodAllergyOption = (
  option: FoodAllergyOption | null
): option is FoodAllergyOption => Boolean(option)

const medicalConditionOptions: MedicalConditionOption[] = [
  { id: 'None', name: 'None' },
  { id: 'PCOD', name: 'PCOD' },
  { id: 'Diabetes', name: 'Diabetes' },
  { id: 'Hypertension', name: 'Hypertension' },
  { id: 'Other', name: 'Other' },
]

const foodAllergyOptions: FoodAllergyOption[] = [
  { id: 'None', name: 'None' },
  { id: 'Peanuts', name: 'Peanuts' },
  { id: 'Tree nuts', name: 'Tree nuts' },
  { id: 'Gluten', name: 'Gluten' },
  { id: 'Shellfish', name: 'Shellfish' },
  { id: 'Latex fruit syndrome', name: 'Latex fruit syndrome' },
  { id: 'Other', name: 'Other' },
]

const isNoneMedicalCondition = (value: any) => {
  if (!value) return false
  const candidate =
    typeof value === 'string'
      ? value
      : (value?.name ?? value?.label ?? value?.value ?? value?.id ?? '')
  return String(candidate).trim().toLowerCase() === 'none'
}

const isNoneFoodAllergy = (value: any) => {
  if (!value) return false
  const candidate =
    typeof value === 'string'
      ? value
      : (value?.name ?? value?.label ?? value?.value ?? value?.id ?? '')
  return String(candidate).trim().toLowerCase() === 'none'
}

const closeMedicalConditionsDropdown = () => {
  if (typeof document === 'undefined') return
  const container = document.querySelector('[data-testid="medical_conditions"]')
  if (!container) return
  const target =
    (container.querySelector('input') as HTMLElement | null) ||
    (container as HTMLElement)

  const dropdownOpen = container.querySelector('.qbs-autocomplete-suggestions')
  if (dropdownOpen) {
    const toggleButton = container.querySelector(
      'button[aria-label="toggle"]'
    ) as HTMLButtonElement | null
    toggleButton?.click()
  }

  target?.blur()
  target?.dispatchEvent(
    new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })
  )
}

const STATUS_OPTIONS = [
  { id: 0, name: 'Active' },
  { id: 1, name: 'Inactive' },
] as const

type StatusOption = (typeof STATUS_OPTIONS)[number]

const deriveStatusLabel = (value: any): StatusOption['name'] | '' => {
  if (value && typeof value === 'object') {
    const nested = value?.id ?? value?.value ?? value?.name
    return deriveStatusLabel(nested)
  }

  if (value === 0 || value === '0') return STATUS_OPTIONS[0].name
  if (value === 1 || value === '1') return STATUS_OPTIONS[1].name

  const normalized = String(value ?? '')
    .trim()
    .toLowerCase()

  if (!normalized) return ''
  if (normalized === 'active') return STATUS_OPTIONS[0].name
  if (normalized === 'inactive' || normalized === 'suspended')
    return STATUS_OPTIONS[1].name

  return ''
}

const matchMedicalCondition = (
  value: string
): MedicalConditionOption | null => {
  const normalized = value?.trim?.().toLowerCase()
  if (!normalized) return null
  const match = medicalConditionOptions.find((option) => {
    const name = option.name?.toLowerCase?.()
    const id = option.id?.toString?.().toLowerCase?.()
    return name === normalized || id === normalized
  })
  return match ? { ...match } : null
}

const matchFoodAllergy = (value: string): FoodAllergyOption | null => {
  const normalized = value?.trim?.().toLowerCase()
  if (!normalized) return null
  const match = foodAllergyOptions.find((option) => {
    const name = option.name?.toLowerCase?.()
    const id = option.id?.toString?.().toLowerCase?.()
    return name === normalized || id === normalized
  })
  return match ? { ...match } : null
}

const normalizeMedicalConditions = (value: any): MedicalConditionOption[] => {
  const toOption = (
    entry: any,
    index: number
  ): MedicalConditionOption | null => {
    if (typeof entry === 'string') {
      const match = matchMedicalCondition(entry)
      if (match) return match
      const trimmed = entry.trim()
      if (!trimmed) return null
      return { id: `${trimmed}-${index}`, name: trimmed }
    }
    if (entry && typeof entry === 'object') {
      const label = entry.name ?? entry.label ?? entry.value ?? entry.id ?? ''
      if (typeof label === 'string' && label.trim()) {
        const match = matchMedicalCondition(label)
        if (match) return match
        return { id: entry.id ?? `${label}-${index}`, name: label }
      }
      if (entry.id !== undefined && entry.id !== null) {
        const idString = String(entry.id)
        const match = matchMedicalCondition(idString)
        if (match) return match
        return { id: entry.id, name: idString }
      }
    }
    return null
  }

  if (Array.isArray(value)) {
    return value
      .map((entry, index) => toOption(entry, index))
      .filter(isMedicalConditionOption)
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map((entry, index) => toOption(entry, index))
      .filter(isMedicalConditionOption)
  }

  if (value && typeof value === 'object') {
    return normalizeMedicalConditions([value])
  }

  return []
}

const medicalConditionsToPayload = (value: any): string => {
  if (!value) return ''
  const values = Array.isArray(value) ? value : [value]
  return values
    .map((entry) => {
      if (typeof entry === 'string') return entry.trim()
      if (entry && typeof entry === 'object') {
        if (typeof entry.name === 'string' && entry.name.trim()) {
          return entry.name.trim()
        }
        if (entry.value !== undefined && entry.value !== null) {
          return String(entry.value).trim()
        }
        if (entry.id !== undefined && entry.id !== null) {
          return String(entry.id).trim()
        }
      }
      return ''
    })
    .filter((entry) => entry)
    .join(',')
}

const normalizeFoodAllergies = (value: any): FoodAllergyOption[] => {
  const toOption = (entry: any, index: number): FoodAllergyOption | null => {
    if (typeof entry === 'string') {
      const match = matchFoodAllergy(entry)
      if (match) return match
      const trimmed = entry.trim()
      if (!trimmed) return null
      return { id: `${trimmed}-${index}`, name: trimmed }
    }
    if (entry && typeof entry === 'object') {
      const label = entry.name ?? entry.label ?? entry.value ?? entry.id ?? ''
      if (typeof label === 'string' && label.trim()) {
        const match = matchFoodAllergy(label)
        if (match) return match
        return { id: entry.id ?? `${label}-${index}`, name: label }
      }
      if (entry.id !== undefined && entry.id !== null) {
        const idString = String(entry.id)
        const match = matchFoodAllergy(idString)
        if (match) return match
        return { id: entry.id, name: idString }
      }
    }
    return null
  }

  if (Array.isArray(value)) {
    return value
      .map((entry, index) => toOption(entry, index))
      .filter(isFoodAllergyOption)
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map((entry, index) => toOption(entry, index))
      .filter(isFoodAllergyOption)
  }

  if (value && typeof value === 'object') {
    return normalizeFoodAllergies([value])
  }

  return []
}

const foodAllergiesToPayload = (value: any): string => {
  if (!value) return ''
  const values = Array.isArray(value) ? value : [value]
  return values
    .map((entry) => {
      if (typeof entry === 'string') return entry.trim()
      if (entry && typeof entry === 'object') {
        if (typeof entry.name === 'string' && entry.name.trim()) {
          return entry.name.trim()
        }
        if (entry.value !== undefined && entry.value !== null) {
          return String(entry.value).trim()
        }
        if (entry.id !== undefined && entry.id !== null) {
          return String(entry.id).trim()
        }
      }
      return ''
    })
    .filter((entry) => entry)
    .join(',')
}

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
  const [showOtherMedicalCondition, setShowOtherMedicalCondition] =
    useState(false)
  const [showOtherFoodAllergy, setShowOtherFoodAllergy] = useState(false)
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
    // {
    //   name: 'status',
    //   label: 'Status',
    //   id: 'status',
    //   desc: 'name',
    //   descId: 'id',
    //   data: STATUS_OPTIONS,
    //   type: 'custom_select',
    //   placeholder: 'Select Status',
    //   async: false,
    //   initialLoad: true,
    //   hidden: !edit,
    // },
    ...(!isNutritionistTab
      ? [
          {
            ...textField('height', 'Height (cm)', 'Enter height in cm', true),
            type: 'text',
            allowPositiveOnly: true,
            maxLength: 3,
          },
          {
            ...textField('weight', 'Weight (kg)', 'Enter weight in kg', true),
            type: 'text',
            allowPositiveOnly: true,
            maxLength: 3,
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
            placeholder: 'Select lifestyle',
            async: false,
            initialLoad: true,
          },
          {
            name: 'goal',
            label: 'Goal',
            id: 'goal',
            desc: 'name',
            descId: 'id',
            data: [
              { id: 'Weight Loss', name: 'Weight Loss' },
              { id: 'Muscle Gain', name: 'Muscle Gain' },
              { id: 'Wellness', name: 'Wellness' },
              { id: 'Maintenance', name: 'Maintenance' },
              { id: 'Disease Management', name: 'Disease Management' },
              { id: 'Weight Gain', name: 'Weight Gain' },
              { id: 'Muscle Loss', name: 'Muscle Loss' },
            ],
            type: 'custom_select',
            placeholder: 'Select Goal',
            async: false,
            initialLoad: true,
          },
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
            placeholder: 'Select food preference',
            async: false,
            initialLoad: true,
          },
          {
            name: 'medical_conditions',
            label: 'Medical Conditions',
            id: 'medical_conditions',
            desc: 'name',
            descId: 'id',
            data: medicalConditionOptions,
            getData: () => medicalConditionOptions,
            type: 'multi_select',
            placeholder: 'Select medical conditions',
            async: false,
            initialLoad: true,
            isMultiple: true,
          },
          ...(showOtherMedicalCondition
            ? [
                {
                  ...textField(
                    'other_medical_condition',
                    'Specify Medical Condition',
                    'Enter medical condition',
                    showOtherMedicalCondition
                  ),
                  type: 'text',
                },
              ]
            : []),
          {
            name: 'food_allergies',
            label: 'Food Allergies',
            id: 'food_allergies',
            desc: 'name',
            descId: 'id',
            data: foodAllergyOptions,
            getData: () => foodAllergyOptions,
            type: 'multi_select',
            placeholder: 'Select food allergies',
            async: false,
            initialLoad: true,
            isMultiple: true,
          },
          ...(showOtherFoodAllergy
            ? [
                {
                  ...textField(
                    'other_food_allergy',
                    'Specify Food Allergy',
                    'Enter food allergy',
                    showOtherFoodAllergy
                  ),
                  type: 'text',
                },
              ]
            : []),
          { ...textField('state', 'State', 'Enter state') },
          { ...textField('ethnicity', 'Nationality', 'e.g., Indian') },
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
      height: isNutritionistTab ? undefined : '',
      weight: isNutritionistTab ? undefined : '',
      lifestyle: '',
      goal: '',
      food_preferences: '',
      medical_conditions: [],
      other_medical_condition: '',
      food_allergies: [],
      other_food_allergy: '',
      state: '',
      ethnicity: '',
      status: '',
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
      height: isNutritionistTab ? undefined : '',
      weight: isNutritionistTab ? undefined : '',
      lifestyle: '',
      goal: '',
      food_preferences: '',
      medical_conditions: [],
      other_medical_condition: '',
      food_allergies: [],
      other_food_allergy: '',
      state: '',
      ethnicity: '',
      status: '',
    } as any)

    handleRefresh?.()
    handleClearAndClose()
  }
  useEffect(() => {
    if (isDrawerOpen) {
      if (!viewMode && edit) {
        const mapGenderToLabel = (v: any) => {
          if (v === null || v === undefined) return ''
          if (v === 0 || v === '0') return 'Male'
          if (v === 1 || v === '1') return 'Female'
          if (v === 2 || v === '2') return 'Other'
          const s = String(v).trim().toLowerCase()
          if (s === 'm' || s === 'male') return 'Male'
          if (s === 'f' || s === 'female') return 'Female'
          if (s === 'o' || s === 'other') return 'Other'
          return ''
        }

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
          gender:
            mapGenderToLabel(rowData?.user?.gender) ||
            (rowData?.user?.gender ?? ''),
          date_of_birth: rowData?.user?.date_of_birth ?? '',
          height: isNutritionistTab
            ? (rowData?.user?.height ?? undefined)
            : (rowData?.user?.height ?? ''),
          weight: isNutritionistTab
            ? (rowData?.user?.weight ?? undefined)
            : (rowData?.user?.weight ?? ''),
          lifestyle: rowData?.user?.lifestyle ?? '',
          goal: rowData?.user?.goal ?? '',
          food_preferences: rowData?.user?.food_preferences ?? '',
          medical_conditions: (() => {
            const conditions = normalizeMedicalConditions(
              rowData?.user?.medical_conditions
            )
            const medicalConditionsStr = Array.isArray(conditions)
              ? conditions
                  .map((c) => (typeof c === 'string' ? c : c.name))
                  .join(',')
              : String(conditions || '')

            // Check if the stored medical condition is not in the predefined options
            // If it's a custom condition, we need to show "Other" selected and the custom value
            const predefinedOptions = medicalConditionOptions.map((opt) =>
              opt.name.toLowerCase()
            )
            const conditionsArray = medicalConditionsStr
              .split(',')
              .map((c) => c.trim().toLowerCase())

            const customConditions = conditionsArray.filter(
              (condition) => condition && !predefinedOptions.includes(condition)
            )
            const predefinedConditions = conditionsArray.filter(
              (condition) => condition && predefinedOptions.includes(condition)
            )

            // Get the actual option objects for predefined conditions
            const selectedPredefinedOptions = predefinedConditions
              .map((conditionName) =>
                medicalConditionOptions.find(
                  (opt) => opt.name.toLowerCase() === conditionName
                )
              )
              .filter(Boolean)

            // If there are custom conditions, add "Other" to the selection
            if (customConditions.length > 0) {
              const otherOption = medicalConditionOptions.find(
                (opt) => opt.name.toLowerCase() === 'other'
              )
              if (otherOption) {
                selectedPredefinedOptions.push(otherOption)
              }
            }

            return selectedPredefinedOptions
          })(),
          other_medical_condition: (() => {
            const conditions = normalizeMedicalConditions(
              rowData?.user?.medical_conditions
            )
            const medicalConditionsStr = Array.isArray(conditions)
              ? conditions
                  .map((c) => (typeof c === 'string' ? c : c.name))
                  .join(',')
              : String(conditions || '')

            const predefinedOptions = medicalConditionOptions.map((opt) =>
              opt.name.toLowerCase()
            )
            const conditionsArray = medicalConditionsStr
              .split(',')
              .map((c) => c.trim())

            // Find custom conditions (not in predefined options)
            const customConditions = conditionsArray.filter(
              (condition) =>
                condition &&
                !predefinedOptions.includes(condition.toLowerCase())
            )

            // Return the first custom condition found
            return customConditions.length > 0 ? customConditions[0] : ''
          })(),
          food_allergies: (() => {
            const allergies = normalizeFoodAllergies(
              rowData?.user?.food_allergies
            )
            const foodAllergiesStr = Array.isArray(allergies)
              ? allergies
                  .map((a) => (typeof a === 'string' ? a : a.name))
                  .join(',')
              : String(allergies || '')

            // Check if the stored food allergy is not in the predefined options
            // If it's a custom allergy, we need to show "Other" selected and the custom value
            const predefinedOptions = foodAllergyOptions.map((opt) =>
              opt.name.toLowerCase()
            )
            const allergiesArray = foodAllergiesStr
              .split(',')
              .map((a) => a.trim().toLowerCase())

            const customAllergies = allergiesArray.filter(
              (allergy) => allergy && !predefinedOptions.includes(allergy)
            )
            const predefinedAllergies = allergiesArray.filter(
              (allergy) => allergy && predefinedOptions.includes(allergy)
            )

            // Get the actual option objects for predefined allergies
            const selectedPredefinedOptions = predefinedAllergies
              .map((allergyName) =>
                foodAllergyOptions.find(
                  (opt) => opt.name.toLowerCase() === allergyName
                )
              )
              .filter(Boolean)

            // If there are custom allergies, add "Other" to the selection
            if (customAllergies.length > 0) {
              const otherOption = foodAllergyOptions.find(
                (opt) => opt.name.toLowerCase() === 'other'
              )
              if (otherOption) {
                selectedPredefinedOptions.push(otherOption)
              }
            }

            return selectedPredefinedOptions
          })(),
          other_food_allergy: (() => {
            const allergies = normalizeFoodAllergies(
              rowData?.user?.food_allergies
            )
            const foodAllergiesStr = Array.isArray(allergies)
              ? allergies
                  .map((a) => (typeof a === 'string' ? a : a.name))
                  .join(',')
              : String(allergies || '')

            const predefinedOptions = foodAllergyOptions.map((opt) =>
              opt.name.toLowerCase()
            )
            const allergiesArray = foodAllergiesStr
              .split(',')
              .map((a) => a.trim())

            // Find custom allergies (not in predefined options)
            const customAllergies = allergiesArray.filter(
              (allergy) =>
                allergy && !predefinedOptions.includes(allergy.toLowerCase())
            )

            // Return the first custom allergy found
            return customAllergies.length > 0 ? customAllergies[0] : ''
          })(),
          state: rowData?.user?.state ?? '',
          ethnicity: rowData?.user?.ethnicity
            ? rowData?.user?.ethnicity.charAt(0).toUpperCase() +
              rowData?.user?.ethnicity.slice(1).toLowerCase()
            : '',
          status: deriveStatusLabel(rowData?.user?.status),
        } as any)
      }
    }
  }, [isDrawerOpen, viewMode, edit, rowData, isNutritionistTab])
  const onSuccess = () => {
    handleSubmission()
  }
  const { mutateAsync: createMutation, isLoading: isCreating } =
    useCreateAdmin(onSuccess)
  const { mutateAsync: updateMutation, isLoading: isUpdating } =
    useUpdateAdmin(onSuccess)

  const methods = useForm<AdminSchema>({
    resolver: zodResolver(
      isNutritionistTab
        ? edit
          ? formSchemaNutritionistEdit
          : formSchemaNutritionist
        : formSchema
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

  const medicalConditionsValue = (methods as any).watch?.('medical_conditions')

  // Check if "Other" is selected in medical conditions
  useEffect(() => {
    if (!isDrawerOpen) return
    if (
      !Array.isArray(medicalConditionsValue) ||
      !medicalConditionsValue.length
    ) {
      setShowOtherMedicalCondition(false)
      return
    }
    const hasOtherSelected = medicalConditionsValue.some((condition: any) =>
      typeof condition === 'string'
        ? condition.toLowerCase() === 'other'
        : condition?.name?.toLowerCase?.() === 'other' ||
          condition?.id?.toString?.().toLowerCase() === 'other'
    )
    setShowOtherMedicalCondition(hasOtherSelected)

    const hasNoneSelected = medicalConditionsValue.some(isNoneMedicalCondition)
    if (!hasNoneSelected) return

    const onlyNone = medicalConditionsValue.filter(isNoneMedicalCondition)
    if (onlyNone.length !== medicalConditionsValue.length) {
      methods.setValue('medical_conditions' as any, onlyNone as any, {
        shouldValidate: true,
        shouldDirty: true,
      })
    }
    closeMedicalConditionsDropdown()
  }, [medicalConditionsValue, isDrawerOpen])

  const foodAllergiesValue = (methods as any).watch?.('food_allergies')

  // Check if "Other" is selected in food allergies
  useEffect(() => {
    if (!isDrawerOpen) return
    if (!Array.isArray(foodAllergiesValue) || !foodAllergiesValue.length) {
      setShowOtherFoodAllergy(false)
      return
    }
    const hasOtherSelected = foodAllergiesValue.some((allergy: any) =>
      typeof allergy === 'string'
        ? allergy.toLowerCase() === 'other'
        : allergy?.name?.toLowerCase?.() === 'other' ||
          allergy?.id?.toString?.().toLowerCase() === 'other'
    )
    setShowOtherFoodAllergy(hasOtherSelected)

    const hasNoneSelected = foodAllergiesValue.some(isNoneFoodAllergy)
    if (!hasNoneSelected) return

    const onlyNone = foodAllergiesValue.filter(isNoneFoodAllergy)
    if (onlyNone.length !== foodAllergiesValue.length) {
      methods.setValue('food_allergies' as any, onlyNone as any, {
        shouldValidate: true,
        shouldDirty: true,
      })
    }
  }, [foodAllergiesValue, isDrawerOpen])

  const onSubmit = async (details: any) => {
    console.log('Form details submitted:', details)
    console.log('State field value:', details?.state)
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

    const statusValueRaw = details?.status
    const statusValue = (() => {
      if (statusValueRaw === null || statusValueRaw === undefined)
        return undefined
      const v =
        typeof statusValueRaw === 'object'
          ? (statusValueRaw?.id ??
            statusValueRaw?.value ??
            statusValueRaw?.name)
          : statusValueRaw
      if (v === 'Active' || v === 'active') return 0
      if (v === 'Inactive' || v === 'inactive') return 1
      if (v === 0 || v === '0') return 0
      if (v === 1 || v === '1') return 1
      return undefined
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
        medical_conditions: (() => {
          const conditions = medicalConditionsToPayload(
            details?.medical_conditions
          )
          const otherCondition = details?.other_medical_condition?.trim()

          // If "Other" is selected and other condition is provided, include both predefined conditions and the custom one
          if (conditions.toLowerCase().includes('other') && otherCondition) {
            // Get all predefined conditions (exclude "Other")
            const predefinedConditions = conditions
              .split(',')
              .map((cond: string) => cond.trim())
              .filter((cond: string) => cond.toLowerCase() !== 'other')

            // Add the custom condition
            predefinedConditions.push(otherCondition)

            return predefinedConditions.join(',')
          }
          // If "Other" is selected but no other condition provided, exclude "Other"
          if (conditions.toLowerCase().includes('other')) {
            return conditions
              .split(',')
              .filter((cond: string) => cond.trim().toLowerCase() !== 'other')
              .join(',')
          }
          return conditions
        })(),
        food_allergies: (() => {
          const allergies = foodAllergiesToPayload(details?.food_allergies)
          const otherAllergy = details?.other_food_allergy?.trim()

          // If "Other" is selected and other allergy is provided, include both predefined allergies and the custom one
          if (allergies.toLowerCase().includes('other') && otherAllergy) {
            // Get all predefined allergies (exclude "Other")
            const predefinedAllergies = allergies
              .split(',')
              .map((allergy: string) => allergy.trim())
              .filter((allergy: string) => allergy.toLowerCase() !== 'other')

            // Add the custom allergy
            predefinedAllergies.push(otherAllergy)

            return predefinedAllergies.join(',')
          }
          // If "Other" is selected but no other allergy provided, exclude "Other"
          if (allergies.toLowerCase().includes('other')) {
            return allergies
              .split(',')
              .filter(
                (allergy: string) => allergy.trim().toLowerCase() !== 'other'
              )
              .join(',')
          }
          return allergies
        })(),
        state: details?.state ?? '',
        ethnicity: details?.ethnicity ?? '',
        ...(statusValue !== undefined ? { status: statusValue } : {}),
      },
    }

    console.log('Final payload:', payload)

    const takeFirstString = (v: any): string => {
      if (!v) return ''
      if (typeof v === 'string') return v
      if (Array.isArray(v)) {
        for (const item of v) {
          const str = takeFirstString(item)
          if (str) return str
        }
        return ''
      }
      if (typeof v === 'object') {
        if (typeof v.message === 'string') return v.message
        if (typeof v.error === 'string') return v.error
      }
      return ''
    }

    const extractFieldErrorMessage = (
      apiData: any,
      fieldKeywords: string[]
    ) => {
      if (!apiData || !fieldKeywords.length) return ''
      const normalized = fieldKeywords
        .map((keyword) => keyword?.toLowerCase?.())
        .filter(Boolean) as string[]

      const includesKeyword = (text: string) => {
        const lowerText = text.toLowerCase()
        return normalized.some((keyword) => lowerText.includes(keyword))
      }

      const readFromObject = (source: any): string => {
        if (!source || typeof source !== 'object') return ''
        const entries = Object.entries(source)
        for (const [key, value] of entries) {
          if (typeof key === 'string' && includesKeyword(key)) {
            const msg = takeFirstString(value)
            if (msg) return msg
          }
        }
        for (const [, value] of entries) {
          if (Array.isArray(value)) {
            for (const item of value) {
              if (typeof item === 'string' && includesKeyword(item)) return item
              const nested = readFromObject(item)
              if (nested) return nested
            }
          } else if (typeof value === 'object') {
            const nested = readFromObject(value)
            if (nested) return nested
          } else if (typeof value === 'string' && includesKeyword(value)) {
            return value
          }
        }
        return ''
      }

      const containers = [
        apiData?.errors,
        apiData?.error?.errors,
        apiData?.error,
      ]
      for (const container of containers) {
        if (!container) continue
        if (typeof container === 'string' && includesKeyword(container)) {
          return container
        }
        if (Array.isArray(container)) {
          for (const entry of container) {
            if (typeof entry === 'string' && includesKeyword(entry))
              return entry
            const msg = readFromObject(entry)
            if (msg) return msg
          }
          continue
        }
        const msg = readFromObject(container)
        if (msg) return msg
      }

      const genericSources = [
        apiData?.message,
        apiData?.error?.message,
        apiData?.detail,
      ]
      for (const source of genericSources) {
        const text = takeFirstString(source)
        if (text && includesKeyword(text)) {
          return text
        }
      }

      return ''
    }

    try {
      if (rowData?.user?.id) {
        await updateMutation({ id: rowData?.user?.id, data: payload } as any)
      } else {
        await createMutation(payload as any)
      }
    } catch (error: any) {
      const apiData = (error?.response?.data ?? error?.data ?? error) as any
      const statusCode: number | undefined = error?.response?.status
      const phoneErrorMessage = extractFieldErrorMessage(apiData, [
        'phone',
        'mobile',
      ])
      const emailErrorMessage = extractFieldErrorMessage(apiData, [
        'email',
        'username',
      ])
      const fallbackEmailMsg =
        !phoneErrorMessage &&
        !emailErrorMessage &&
        (statusCode === 409 || statusCode === 422)
          ? 'Email has already been taken.'
          : ''
      const finalEmailMsg =
        emailErrorMessage ||
        fallbackEmailMsg ||
        (typeof error?.message === 'string' &&
        error?.message?.toLowerCase?.().includes('email')
          ? error.message
          : '')

      if (phoneErrorMessage) {
        ;(methods as any).setError?.(
          'phone',
          {
            type: 'server',
            message: String(phoneErrorMessage),
          },
          { shouldFocus: true }
        )
      }

      if (finalEmailMsg) {
        ;(methods as any).setError?.(
          'email',
          {
            type: 'server',
            message: String(finalEmailMsg),
          },
          { shouldFocus: !phoneErrorMessage }
        )
      }

      if (!phoneErrorMessage && !finalEmailMsg) {
        const genericError =
          takeFirstString(apiData?.message) ||
          takeFirstString(apiData?.error?.message) ||
          takeFirstString(apiData?.detail) ||
          (typeof error?.message === 'string' ? error.message : '')
        if (genericError) {
          ;(methods as any).setError?.(
            'email',
            {
              type: 'server',
              message: String(genericError),
            },
            { shouldFocus: true }
          )
        }
      }
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
          if (edit) return `Edit ${label}`
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
                  <FormBuilder
                    data={formBuilderProps}
                    edit={true}
                    spacing
                    fromPopup
                  />
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
