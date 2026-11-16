import React, { useState, useEffect, useRef, useMemo } from 'react'
import moment from 'moment'
import { getUsersFilterOptions } from './api'

export interface FilterState {
  // Status
  status?: string

  // Profile & Demographics
  gender?: string
  language?: string
  country?: string
  state?: string
  occupation?: string
  work_schedule?: string
  age_min?: string | number
  age_max?: string | number
  dob_from?: string
  dob_to?: string
  bmi_min?: string | number
  bmi_max?: string | number

  // Health & Dietary
  food_preferences?: string
  food_allergies?: string
  medical_conditions?: string
  lifestyle?: string
  goal?: string

  // Plan & Subscriptions
  plan_id?: string | number
  has_subscription?: string
  subscription_status?: string
  plan_start_from?: string
  plan_start_to?: string
  plan_end_from?: string
  plan_end_to?: string

  // Staff Assignments
  sales_rep_id?: string | number
  nutritionist_id?: string | number
  physiotherapist_id?: string | number
  yogist_id?: string | number

  // Registration & Leads
  registration_source?: string
  campaign_id?: string | number
  registered_from?: string
  registered_to?: string

  [key: string]: any
}

interface SelectOption {
  value: string | number
  label: string
  sublabel?: string
  category?: string
  badge?: string
}

interface SearchableSelectProps {
  label: string
  value: string | number | undefined
  onChange: (val: string | number | undefined) => void
  options: SelectOption[]
  placeholder?: string
  searchPlaceholder?: string
  allowClear?: boolean
  className?: string
  renderOptionPrefix?: (option: SelectOption) => React.ReactNode
}

function SearchableSelect({
  label,
  value,
  onChange,
  options,
  placeholder = 'Select option...',
  searchPlaceholder = 'Search...',
  allowClear = true,
  className = '',
  renderOptionPrefix,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const selectedOption = useMemo(() => {
    if (
      value === undefined ||
      value === null ||
      value === '' ||
      value === 'all'
    )
      return null
    return options.find((opt) => String(opt.value) === String(value))
  }, [options, value])

  const filteredOptions = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    if (!term) return options
    return options.filter((opt) => {
      const l = String(opt.label || '').toLowerCase()
      const sl = String(opt.sublabel || '').toLowerCase()
      const cat = String(opt.category || '').toLowerCase()
      return l.includes(term) || sl.includes(term) || cat.includes(term)
    })
  }, [options, searchTerm])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen) {
      setSearchTerm('')
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen])

  return (
    <div
      className={`relative flex flex-col gap-1.5 ${className}`}
      ref={containerRef}
    >
      {label && (
        <label className="text-xs font-semibold text-gray-700">{label}</label>
      )}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-xs rounded-xl border bg-white shadow-xs transition-all text-left ${
          isOpen
            ? 'border-emerald-500 ring-2 ring-emerald-100 shadow-sm'
            : selectedOption
              ? 'border-emerald-400 bg-emerald-50/20'
              : 'border-gray-200 hover:border-gray-300'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {selectedOption ? (
            <>
              {renderOptionPrefix && renderOptionPrefix(selectedOption)}
              <div className="truncate font-semibold text-gray-900">
                {selectedOption.label}
              </div>
              {selectedOption.sublabel && (
                <span className="text-[10px] text-gray-400 truncate">
                  ({selectedOption.sublabel})
                </span>
              )}
            </>
          ) : (
            <span className="text-gray-400 font-medium truncate">
              {placeholder}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          {selectedOption && allowClear && (
            <span
              onClick={(e) => {
                e.stopPropagation()
                onChange(undefined)
              }}
              className="p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              title="Clear"
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </span>
          )}
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-emerald-600' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </button>

      {isOpen && (
        <div className="absolute top-[calc(100%+4px)] left-0 right-0 z-50 rounded-xl border border-gray-200 bg-white shadow-2xl overflow-hidden animate-fadeIn">
          {/* Search bar */}
          <div className="p-2 border-b border-gray-100 bg-gray-50/80">
            <div className="relative">
              <svg
                className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                ref={inputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-gray-200 bg-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200"
              />
            </div>
          </div>

          {/* Options list */}
          <div className="max-h-52 overflow-y-auto divide-y divide-gray-50">
            {allowClear && (
              <button
                type="button"
                onClick={() => {
                  onChange(undefined)
                  setIsOpen(false)
                }}
                className={`w-full px-3 py-2 text-left text-xs font-medium transition-colors flex items-center justify-between ${
                  !selectedOption
                    ? 'bg-emerald-50 text-emerald-700 font-semibold'
                    : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                <span>All / Any</span>
                {!selectedOption && (
                  <svg
                    className="w-3.5 h-3.5 text-emerald-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
              </button>
            )}

            {filteredOptions.length === 0 ? (
              <div className="px-3 py-4 text-center text-xs text-gray-400">
                No matching options found
              </div>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = selectedOption?.value === option.value
                return (
                  <button
                    key={String(option.value)}
                    type="button"
                    onClick={() => {
                      onChange(option.value)
                      setIsOpen(false)
                    }}
                    className={`w-full px-3 py-2 text-left text-xs transition-colors flex items-center justify-between group ${
                      isSelected
                        ? 'bg-emerald-50 text-emerald-800 font-semibold'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {renderOptionPrefix && renderOptionPrefix(option)}
                      <div className="truncate">
                        <div className="font-medium text-gray-800 group-hover:text-emerald-700 truncate">
                          {option.label}
                        </div>
                        {option.sublabel && (
                          <div className="text-[10px] text-gray-400 truncate">
                            {option.sublabel}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {option.badge && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-gray-100 text-gray-600">
                          {option.badge}
                        </span>
                      )}
                      {isSelected && (
                        <svg
                          className="w-3.5 h-3.5 text-emerald-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}

const getStaffInitials = (name?: string) => {
  if (!name) return 'ST'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

interface UserAdvancedFilterDrawerProps {
  isOpen: boolean
  onClose: () => void
  appliedFilters: FilterState
  onApplyFilters: (filters: FilterState) => void
  onResetFilters: () => void
}

export default function UserAdvancedFilterDrawer({
  isOpen,
  onClose,
  appliedFilters,
  onApplyFilters,
  onResetFilters,
}: UserAdvancedFilterDrawerProps) {
  const [filters, setFilters] = useState<FilterState>({})
  const [activeTab, setActiveTab] = useState<
    'demographics' | 'subscription' | 'assignments' | 'health' | 'source'
  >('demographics')
  const [optionsData, setOptionsData] = useState<any>(null)
  const [isLoadingOptions, setIsLoadingOptions] = useState(false)

  // Sync draft filters with applied filters whenever drawer opens
  useEffect(() => {
    if (isOpen) {
      setFilters({ ...appliedFilters })
    }
  }, [isOpen, appliedFilters])

  // Fetch filter options when drawer is first opened
  useEffect(() => {
    if (isOpen && !optionsData && !isLoadingOptions) {
      setIsLoadingOptions(true)
      getUsersFilterOptions()
        .then((res: any) => {
          setOptionsData(res?.data || res || {})
        })
        .catch((err) => {
          console.error('Failed to fetch user filter options', err)
        })
        .finally(() => {
          setIsLoadingOptions(false)
        })
    }
  }, [isOpen, optionsData, isLoadingOptions])

  const setFilterField = (key: string, value: any) => {
    setFilters((prev) => {
      const updated = { ...prev }
      if (
        value === undefined ||
        value === null ||
        value === '' ||
        value === 'all'
      ) {
        delete updated[key]
      } else {
        updated[key] = value
      }
      return updated
    })
  }

  // Calculate active filter count
  const activeCount = useMemo(() => {
    const ignoredKeys = ['role', 'page', 'page_size', 'ordering', 'search']
    return Object.keys(filters).filter((k) => {
      if (ignoredKeys.includes(k)) return false
      const val = filters[k]
      return val !== undefined && val !== null && val !== '' && val !== 'all'
    }).length
  }, [filters])

  // Filter option sets
  const planOptions: SelectOption[] = useMemo(() => {
    if (!optionsData?.plans) return []
    return optionsData.plans.map((p: any) => ({
      value: p.id,
      label: p.name,
      badge: p.category,
      category: p.category,
    }))
  }, [optionsData])

  const staffToOptions = (
    list?: any[],
    fallbackRole = 'Staff'
  ): SelectOption[] => {
    const items: SelectOption[] = [
      {
        value: 'unassigned',
        label: `Unassigned (No ${fallbackRole})`,
        badge: 'Empty',
      },
    ]
    if (list && Array.isArray(list)) {
      list.forEach((u) => {
        items.push({
          value: u.id,
          label: u.name || `Staff #${u.id}`,
          sublabel: u.email,
        })
      })
    }
    return items
  }

  const salesRepOptions = useMemo(
    () => staffToOptions(optionsData?.sales_reps, 'Sales Rep'),
    [optionsData]
  )
  const nutritionistOptions = useMemo(
    () => staffToOptions(optionsData?.nutritionists, 'Nutritionist'),
    [optionsData]
  )
  const physioOptions = useMemo(
    () => staffToOptions(optionsData?.physiotherapists, 'Physiotherapist'),
    [optionsData]
  )
  const yogistOptions = useMemo(
    () => staffToOptions(optionsData?.yogists, 'Yogist'),
    [optionsData]
  )

  const campaignOptions: SelectOption[] = useMemo(() => {
    if (!optionsData?.campaigns) return []
    return optionsData.campaigns.map((c: any) => ({
      value: c.id,
      label: c.name,
    }))
  }, [optionsData])

  const countryOptions: SelectOption[] = useMemo(() => {
    const list = optionsData?.countries || [
      'India',
      'United Arab Emirates',
      'Saudi Arabia',
      'Qatar',
      'Kuwait',
      'Oman',
      'United Kingdom',
      'United States',
      'Canada',
      'Australia',
      'Singapore',
      'Malaysia',
      'Germany',
      'Ireland',
      'New Zealand',
    ]
    return list.map((c: string) => ({ value: c, label: c }))
  }, [optionsData])

  const stateOptions: SelectOption[] = useMemo(() => {
    const list = optionsData?.states || [
      'Kerala',
      'Tamil Nadu',
      'Karnataka',
      'Maharashtra',
      'Delhi',
      'Telangana',
      'Andhra Pradesh',
      'Gujarat',
      'West Bengal',
      'Dubai',
      'Abu Dhabi',
      'Sharjah',
      'Doha',
      'Riyadh',
      'Muscat',
      'Kuwait City',
    ]
    return list.map((s: string) => ({ value: s, label: s }))
  }, [optionsData])

  const languageOptions: SelectOption[] = useMemo(() => {
    const list = optionsData?.languages || [
      'Malayalam',
      'English',
      'Hindi',
      'Tamil',
      'Kannada',
      'Telugu',
      'Arabic',
    ]
    return list.map((l: string) => ({ value: l, label: l }))
  }, [optionsData])

  const occupationOptions: SelectOption[] = useMemo(() => {
    const list = optionsData?.occupations || [
      'Software Engineer / IT',
      'Healthcare / Doctor / Nurse',
      'Teacher / Professor',
      'Accountant / Finance',
      'Business Owner / Entrepreneur',
      'Homemaker',
      'Student',
      'Sales / Marketing',
      'Executive / Management',
      'Government Service',
      'Other',
    ]
    return list.map((o: string) => ({ value: o, label: o }))
  }, [optionsData])

  const workScheduleOptions: SelectOption[] = useMemo(() => {
    const list = optionsData?.work_schedules || [
      'Regular Day Shift (9 AM - 5 PM)',
      'Night Shift',
      'Rotating / Shift Work',
      'Flexible / Freelance',
      'Work From Home',
      'High Travel',
    ]
    return list.map((w: string) => ({ value: w, label: w }))
  }, [optionsData])

  const genderOptions: SelectOption[] = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'other', label: 'Other' },
  ]

  const statusOptions: SelectOption[] = [
    { value: 'active', label: 'Active', badge: 'Active' },
    { value: 'deactivated', label: 'Deactivated', badge: 'Inactive' },
  ]

  const subscriptionStatusOptions: SelectOption[] = [
    { value: 'active', label: 'Active Subscription', badge: 'Active' },
    { value: 'paused', label: 'Paused Subscription', badge: 'Paused' },
    { value: 'expired', label: 'Expired Subscription', badge: 'Expired' },
    { value: 'cancelled', label: 'Cancelled', badge: 'Cancelled' },
    {
      value: 'pending',
      label: 'Pending Payment / Activation',
      badge: 'Pending',
    },
  ]

  const hasSubscriptionOptions: SelectOption[] = [
    {
      value: 'active',
      label: 'Has Active Plan (Valid & Ongoing)',
      badge: 'Active',
    },
    { value: 'none', label: 'No Active Plan (Unsubscribed)', badge: 'None' },
    {
      value: 'expired',
      label: 'Plan Expired (Needs Renewal)',
      badge: 'Expired',
    },
  ]

  const registrationSourceOptions: SelectOption[] = [
    {
      value: 'self_registered',
      label: 'Self Registered (App / Website)',
      badge: 'Self',
    },
    {
      value: 'superadmin_created',
      label: 'Admin Created (Direct Onboard)',
      badge: 'Admin',
    },
    {
      value: 'lead_conversion',
      label: 'Marketing Lead Conversion',
      badge: 'Lead',
    },
  ]

  const lifestyleOptions: SelectOption[] = [
    { value: 'sedentary', label: 'Sedentary (Little or no exercise)' },
    { value: 'lightly_active', label: 'Lightly Active (1-3 days/week)' },
    { value: 'moderately_active', label: 'Moderately Active (3-5 days/week)' },
    { value: 'very_active', label: 'Very Active (6-7 days/week)' },
    {
      value: 'extremely_active',
      label: 'Extremely Active (Athletic/Hard physical job)',
    },
  ]

  const foodPreferenceOptions: SelectOption[] = [
    { value: 'Vegetarian', label: 'Vegetarian' },
    { value: 'Non-Vegetarian', label: 'Non-Vegetarian' },
    { value: 'Eggetarian', label: 'Eggetarian' },
    { value: 'Vegan', label: 'Vegan' },
    { value: 'Pescatarian', label: 'Pescatarian' },
    { value: 'Jain', label: 'Jain Vegetarian' },
  ]

  const commonAllergies: SelectOption[] = [
    { value: 'Gluten', label: 'Gluten / Celiac' },
    { value: 'Dairy / Lactose', label: 'Dairy / Lactose Intolerance' },
    { value: 'Peanuts', label: 'Peanuts / Tree Nuts' },
    { value: 'Seafood', label: 'Fish / Shellfish' },
    { value: 'Eggs', label: 'Eggs' },
    { value: 'Soy', label: 'Soy' },
  ]

  const commonConditions: SelectOption[] = [
    { value: 'Diabetes', label: 'Diabetes (Type 1 / 2)' },
    { value: 'Hypertension', label: 'Hypertension (High BP)' },
    { value: 'Thyroid', label: 'Thyroid (Hypo/Hyper)' },
    { value: 'PCOS / PCOD', label: 'PCOS / PCOD' },
    { value: 'Cholesterol', label: 'High Cholesterol' },
    { value: 'Back Pain', label: 'Chronic Back / Knee Pain' },
    { value: 'Fatty Liver', label: 'Fatty Liver' },
  ]

  const goalOptions: SelectOption[] = [
    { value: 'Weight Loss', label: 'Weight Loss / Fat Loss' },
    { value: 'Muscle Gain', label: 'Muscle Building & Hypertrophy' },
    { value: 'Weight Gain', label: 'Healthy Weight Gain' },
    { value: 'Maintenance', label: 'General Fitness & Maintenance' },
    { value: 'Endurance', label: 'Endurance & Stamina' },
    {
      value: 'Flexibility & Posture',
      label: 'Flexibility & Posture Correction',
    },
    { value: 'Post-Pregnancy Recovery', label: 'Post-Pregnancy Recovery' },
  ]

  const handleApply = () => {
    onApplyFilters(filters)
    onClose()
  }

  const handleClearAll = () => {
    setFilters({})
    onResetFilters()
    onClose()
  }

  const renderStaffAvatar = (opt: SelectOption) => {
    if (opt.value === 'unassigned') {
      return (
        <div className="w-5 h-5 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center font-bold text-[9px] flex-shrink-0">
          ∅
        </div>
      )
    }
    return (
      <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[9px] flex-shrink-0">
        {getStaffInitials(opt.label)}
      </div>
    )
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-gray-900/40 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Slide-over drawer container */}
      <div className="relative w-full max-w-3xl bg-white shadow-2xl h-full flex flex-col z-50 animate-slideLeft transform transition-transform">
        {/* Header */}
        <div className="px-7 py-5 border-b border-gray-200/80 bg-white flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center shadow-xs flex-shrink-0">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-lg font-bold text-gray-900 tracking-tight">
                  Advanced Filters
                </h2>
                {activeCount > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    {activeCount} Active
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Filter clients across demographics, packages, staff assignments
                & health profile
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {activeCount > 0 && (
              <button
                type="button"
                onClick={() => setFilters({})}
                className="text-xs font-semibold text-gray-500 hover:text-red-600 transition-colors px-2 py-1 rounded-md hover:bg-red-50"
              >
                Reset All
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 flex items-center justify-center transition-colors border border-transparent hover:border-gray-200"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Section Tabs */}
        <div className="flex items-center border-b border-gray-200 bg-gray-50/70 px-7 py-2 gap-1.5 overflow-x-auto text-xs font-semibold scrollbar-none">
          {[
            {
              id: 'demographics',
              label: 'Demographics',
              icon: (
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              ),
              count: [
                filters.gender,
                filters.language,
                filters.country,
                filters.state,
                filters.occupation,
                filters.work_schedule,
                filters.age_min,
                filters.age_max,
                filters.dob_from,
                filters.dob_to,
                filters.bmi_min,
                filters.bmi_max,
              ].filter(Boolean).length,
            },
            {
              id: 'subscription',
              label: 'Plans & Subscription',
              icon: (
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                  />
                </svg>
              ),
              count: [
                filters.plan_id,
                filters.has_subscription,
                filters.subscription_status,
                filters.plan_start_from,
                filters.plan_start_to,
                filters.plan_end_from,
                filters.plan_end_to,
              ].filter(Boolean).length,
            },
            {
              id: 'assignments',
              label: 'Staff Assignments',
              icon: (
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              ),
              count: [
                filters.sales_rep_id,
                filters.nutritionist_id,
                filters.physiotherapist_id,
                filters.yogist_id,
              ].filter(Boolean).length,
            },
            {
              id: 'health',
              label: 'Diet & Health',
              icon: (
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
              ),
              count: [
                filters.food_preferences,
                filters.food_allergies,
                filters.medical_conditions,
                filters.lifestyle,
                filters.goal,
              ].filter(Boolean).length,
            },
            {
              id: 'source',
              label: 'Source & Lead',
              icon: (
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  />
                </svg>
              ),
              count: [
                filters.registration_source,
                filters.campaign_id,
                filters.registered_from,
                filters.registered_to,
                filters.status,
              ].filter(Boolean).length,
            },
          ].map((tab) => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 px-3 flex items-center gap-2 rounded-xl whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-white text-emerald-800 font-bold shadow-xs border border-gray-200/80'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-white/60 border border-transparent'
                }`}
              >
                <span
                  className={isActive ? 'text-emerald-600' : 'text-gray-400'}
                >
                  {tab.icon}
                </span>
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <span className="w-4.5 h-4.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center justify-center">
                    {tab.count}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Scrollable Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: DEMOGRAPHICS */}
          {activeTab === 'demographics' && (
            <div className="space-y-5 animate-fadeIn">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <SearchableSelect
                  label="Gender"
                  value={filters.gender}
                  onChange={(val) => setFilterField('gender', val)}
                  options={genderOptions}
                  placeholder="All Genders"
                  searchPlaceholder="Search gender..."
                />

                <SearchableSelect
                  label="Language Spoken"
                  value={filters.language}
                  onChange={(val) => setFilterField('language', val)}
                  options={languageOptions}
                  placeholder="All Languages"
                  searchPlaceholder="Search language..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <SearchableSelect
                  label="Country / Region"
                  value={filters.country}
                  onChange={(val) => setFilterField('country', val)}
                  options={countryOptions}
                  placeholder="All Countries"
                  searchPlaceholder="Search country..."
                />

                <SearchableSelect
                  label="State / Province"
                  value={filters.state}
                  onChange={(val) => setFilterField('state', val)}
                  options={stateOptions}
                  placeholder="All States"
                  searchPlaceholder="Search state..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <SearchableSelect
                  label="Occupation"
                  value={filters.occupation}
                  onChange={(val) => setFilterField('occupation', val)}
                  options={occupationOptions}
                  placeholder="All Occupations"
                  searchPlaceholder="Search occupation..."
                />

                <SearchableSelect
                  label="Work Schedule / Routine"
                  value={filters.work_schedule}
                  onChange={(val) => setFilterField('work_schedule', val)}
                  options={workScheduleOptions}
                  placeholder="All Work Schedules"
                  searchPlaceholder="Search routine..."
                />
              </div>

              {/* Age Range Section */}
              <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-800">
                    Age Range (Years)
                  </label>
                  {(filters.age_min || filters.age_max) && (
                    <button
                      type="button"
                      onClick={() => {
                        setFilterField('age_min', undefined)
                        setFilterField('age_max', undefined)
                      }}
                      className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-800"
                    >
                      Reset Age
                    </button>
                  )}
                </div>

                {/* Quick Presets */}
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: '18–25', min: '18', max: '25' },
                    { label: '26–35', min: '26', max: '35' },
                    { label: '36–45', min: '36', max: '45' },
                    { label: '46–60', min: '46', max: '60' },
                    { label: '60+', min: '60', max: '' },
                  ].map((preset) => {
                    const isSelected =
                      String(filters.age_min || '') === preset.min &&
                      String(filters.age_max || '') === preset.max
                    return (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setFilterField('age_min', undefined)
                            setFilterField('age_max', undefined)
                          } else {
                            setFilterField('age_min', preset.min)
                            setFilterField('age_max', preset.max || undefined)
                          }
                        }}
                        className={`px-2.5 py-1 text-xs rounded-lg font-medium border transition-all ${
                          isSelected
                            ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                            : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        {preset.label}
                      </button>
                    )
                  })}
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <span className="text-[11px] text-gray-500 font-medium">
                      Min Age
                    </span>
                    <input
                      type="number"
                      min="1"
                      max="120"
                      value={filters.age_min || ''}
                      onChange={(e) =>
                        setFilterField('age_min', e.target.value)
                      }
                      placeholder="e.g. 20"
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 bg-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] text-gray-500 font-medium">
                      Max Age
                    </span>
                    <input
                      type="number"
                      min="1"
                      max="120"
                      value={filters.age_max || ''}
                      onChange={(e) =>
                        setFilterField('age_max', e.target.value)
                      }
                      placeholder="e.g. 50"
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 bg-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* BMI Range Section */}
              <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-800">
                    BMI Range (kg/m²)
                  </label>
                  {(filters.bmi_min || filters.bmi_max) && (
                    <button
                      type="button"
                      onClick={() => {
                        setFilterField('bmi_min', undefined)
                        setFilterField('bmi_max', undefined)
                      }}
                      className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-800"
                    >
                      Reset BMI
                    </button>
                  )}
                </div>

                {/* Quick Presets */}
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: 'Underweight (< 18.5)', min: '', max: '18.4' },
                    { label: 'Normal (18.5 – 24.9)', min: '18.5', max: '24.9' },
                    { label: 'Overweight (25 – 29.9)', min: '25', max: '29.9' },
                    { label: 'Obese (≥ 30)', min: '30', max: '' },
                  ].map((preset) => {
                    const isSelected =
                      String(filters.bmi_min || '') === preset.min &&
                      String(filters.bmi_max || '') === preset.max
                    return (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setFilterField('bmi_min', undefined)
                            setFilterField('bmi_max', undefined)
                          } else {
                            setFilterField('bmi_min', preset.min || undefined)
                            setFilterField('bmi_max', preset.max || undefined)
                          }
                        }}
                        className={`px-2.5 py-1 text-xs rounded-lg font-medium border transition-all ${
                          isSelected
                            ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                            : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        {preset.label}
                      </button>
                    )
                  })}
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <span className="text-[11px] text-gray-500 font-medium">
                      Min BMI
                    </span>
                    <input
                      type="number"
                      step="0.1"
                      value={filters.bmi_min || ''}
                      onChange={(e) =>
                        setFilterField('bmi_min', e.target.value)
                      }
                      placeholder="e.g. 18.5"
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 bg-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] text-gray-500 font-medium">
                      Max BMI
                    </span>
                    <input
                      type="number"
                      step="0.1"
                      value={filters.bmi_max || ''}
                      onChange={(e) =>
                        setFilterField('bmi_max', e.target.value)
                      }
                      placeholder="e.g. 32.0"
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 bg-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Date of Birth Range */}
              <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-800">
                    Date of Birth Range
                  </label>
                  {(filters.dob_from || filters.dob_to) && (
                    <button
                      type="button"
                      onClick={() => {
                        setFilterField('dob_from', undefined)
                        setFilterField('dob_to', undefined)
                      }}
                      className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-800"
                    >
                      Clear DOB
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[11px] text-gray-500 font-medium">
                      Born From
                    </span>
                    <input
                      type="date"
                      value={filters.dob_from || ''}
                      onChange={(e) =>
                        setFilterField('dob_from', e.target.value)
                      }
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 bg-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] text-gray-500 font-medium">
                      Born To
                    </span>
                    <input
                      type="date"
                      value={filters.dob_to || ''}
                      onChange={(e) => setFilterField('dob_to', e.target.value)}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 bg-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PLAN & SUBSCRIPTIONS */}
          {activeTab === 'subscription' && (
            <div className="space-y-5 animate-fadeIn">
              <SearchableSelect
                label="Subscribed Plan Package"
                value={filters.plan_id}
                onChange={(val) => setFilterField('plan_id', val)}
                options={planOptions}
                placeholder="All Plans & Packages"
                searchPlaceholder="Search plans..."
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <SearchableSelect
                  label="Has Active Plan Status"
                  value={filters.has_subscription}
                  onChange={(val) => setFilterField('has_subscription', val)}
                  options={hasSubscriptionOptions}
                  placeholder="All Clients"
                  searchPlaceholder="Filter by plan status..."
                />

                <SearchableSelect
                  label="Subscription Lifecycle State"
                  value={filters.subscription_status}
                  onChange={(val) => setFilterField('subscription_status', val)}
                  options={subscriptionStatusOptions}
                  placeholder="All Subscription States"
                  searchPlaceholder="Filter status..."
                />
              </div>

              {/* Plan Start Date Range */}
              <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-800">
                    Plan Start Date Range
                  </label>
                  {(filters.plan_start_from || filters.plan_start_to) && (
                    <button
                      type="button"
                      onClick={() => {
                        setFilterField('plan_start_from', undefined)
                        setFilterField('plan_start_to', undefined)
                      }}
                      className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-800"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[11px] text-gray-500 font-medium">
                      Started From
                    </span>
                    <input
                      type="date"
                      value={filters.plan_start_from || ''}
                      onChange={(e) =>
                        setFilterField('plan_start_from', e.target.value)
                      }
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 bg-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] text-gray-500 font-medium">
                      Started To
                    </span>
                    <input
                      type="date"
                      value={filters.plan_start_to || ''}
                      onChange={(e) =>
                        setFilterField('plan_start_to', e.target.value)
                      }
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 bg-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Plan End Date Range */}
              <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-800">
                    Plan Expiry / End Date Range
                  </label>
                  {(filters.plan_end_from || filters.plan_end_to) && (
                    <button
                      type="button"
                      onClick={() => {
                        setFilterField('plan_end_from', undefined)
                        setFilterField('plan_end_to', undefined)
                      }}
                      className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-800"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Quick Expiry Presets */}
                <div className="flex flex-wrap gap-1.5">
                  {[
                    {
                      label: 'Expiring this week',
                      from: moment().startOf('week').format('YYYY-MM-DD'),
                      to: moment().endOf('week').format('YYYY-MM-DD'),
                    },
                    {
                      label: 'Expiring this month',
                      from: moment().startOf('month').format('YYYY-MM-DD'),
                      to: moment().endOf('month').format('YYYY-MM-DD'),
                    },
                    {
                      label: 'Expiring in next 30 days',
                      from: moment().format('YYYY-MM-DD'),
                      to: moment().add(30, 'days').format('YYYY-MM-DD'),
                    },
                    {
                      label: 'Already Expired',
                      from: '',
                      to: moment().subtract(1, 'days').format('YYYY-MM-DD'),
                    },
                  ].map((preset) => {
                    const isSelected =
                      (filters.plan_end_from || '') === preset.from &&
                      (filters.plan_end_to || '') === preset.to
                    return (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setFilterField('plan_end_from', undefined)
                            setFilterField('plan_end_to', undefined)
                          } else {
                            setFilterField(
                              'plan_end_from',
                              preset.from || undefined
                            )
                            setFilterField(
                              'plan_end_to',
                              preset.to || undefined
                            )
                          }
                        }}
                        className={`px-2.5 py-1 text-xs rounded-lg font-medium border transition-all ${
                          isSelected
                            ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                            : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        {preset.label}
                      </button>
                    )
                  })}
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <span className="text-[11px] text-gray-500 font-medium">
                      Expires From
                    </span>
                    <input
                      type="date"
                      value={filters.plan_end_from || ''}
                      onChange={(e) =>
                        setFilterField('plan_end_from', e.target.value)
                      }
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 bg-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] text-gray-500 font-medium">
                      Expires To
                    </span>
                    <input
                      type="date"
                      value={filters.plan_end_to || ''}
                      onChange={(e) =>
                        setFilterField('plan_end_to', e.target.value)
                      }
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 bg-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: STAFF ASSIGNMENTS */}
          {activeTab === 'assignments' && (
            <div className="space-y-5 animate-fadeIn">
              <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-100 text-xs text-emerald-900 flex items-start gap-2.5">
                <svg
                  className="w-4 h-4 text-emerald-700 flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div>
                  Filter clients assigned to specific staff members or clients
                  who currently have{' '}
                  <strong className="font-semibold text-emerald-950">
                    Unassigned
                  </strong>{' '}
                  roles.
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <SearchableSelect
                  label="Sales Representative"
                  value={filters.sales_rep_id}
                  onChange={(val) => setFilterField('sales_rep_id', val)}
                  options={salesRepOptions}
                  placeholder="All Sales Reps"
                  searchPlaceholder="Search sales rep..."
                  renderOptionPrefix={renderStaffAvatar}
                />

                <SearchableSelect
                  label="Assigned Nutritionist"
                  value={filters.nutritionist_id}
                  onChange={(val) => setFilterField('nutritionist_id', val)}
                  options={nutritionistOptions}
                  placeholder="All Nutritionists"
                  searchPlaceholder="Search nutritionist..."
                  renderOptionPrefix={renderStaffAvatar}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <SearchableSelect
                  label="Assigned Physiotherapist"
                  value={filters.physiotherapist_id}
                  onChange={(val) => setFilterField('physiotherapist_id', val)}
                  options={physioOptions}
                  placeholder="All Physiotherapists"
                  searchPlaceholder="Search physiotherapist..."
                  renderOptionPrefix={renderStaffAvatar}
                />

                <SearchableSelect
                  label="Assigned Yogist"
                  value={filters.yogist_id}
                  onChange={(val) => setFilterField('yogist_id', val)}
                  options={yogistOptions}
                  placeholder="All Yogists"
                  searchPlaceholder="Search yogist..."
                  renderOptionPrefix={renderStaffAvatar}
                />
              </div>
            </div>
          )}

          {/* TAB 4: DIET & HEALTH */}
          {activeTab === 'health' && (
            <div className="space-y-5 animate-fadeIn">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <SearchableSelect
                  label="Food Preference / Diet Type"
                  value={filters.food_preferences}
                  onChange={(val) => setFilterField('food_preferences', val)}
                  options={foodPreferenceOptions}
                  placeholder="All Dietary Preferences"
                  searchPlaceholder="Search diet type..."
                />

                <SearchableSelect
                  label="Lifestyle & Physical Activity"
                  value={filters.lifestyle}
                  onChange={(val) => setFilterField('lifestyle', val)}
                  options={lifestyleOptions}
                  placeholder="All Activity Levels"
                  searchPlaceholder="Search activity level..."
                />
              </div>

              <SearchableSelect
                label="Primary Fitness Goal"
                value={filters.goal}
                onChange={(val) => setFilterField('goal', val)}
                options={goalOptions}
                placeholder="All Fitness Goals"
                searchPlaceholder="Search goal..."
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <SearchableSelect
                  label="Food Allergies & Intolerances"
                  value={filters.food_allergies}
                  onChange={(val) => setFilterField('food_allergies', val)}
                  options={commonAllergies}
                  placeholder="All / Any Allergy"
                  searchPlaceholder="Search allergy..."
                />

                <SearchableSelect
                  label="Medical Conditions & Health Notes"
                  value={filters.medical_conditions}
                  onChange={(val) => setFilterField('medical_conditions', val)}
                  options={commonConditions}
                  placeholder="All / Any Condition"
                  searchPlaceholder="Search condition..."
                />
              </div>
            </div>
          )}

          {/* TAB 5: REGISTRATION & SOURCE */}
          {activeTab === 'source' && (
            <div className="space-y-5 animate-fadeIn">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <SearchableSelect
                  label="Registration Source"
                  value={filters.registration_source}
                  onChange={(val) => setFilterField('registration_source', val)}
                  options={registrationSourceOptions}
                  placeholder="All Registration Sources"
                  searchPlaceholder="Search source..."
                />

                <SearchableSelect
                  label="Account Status"
                  value={filters.status}
                  onChange={(val) => setFilterField('status', val)}
                  options={statusOptions}
                  placeholder="All Statuses"
                  searchPlaceholder="Search status..."
                />
              </div>

              <SearchableSelect
                label="Marketing Campaign Source"
                value={filters.campaign_id}
                onChange={(val) => setFilterField('campaign_id', val)}
                options={campaignOptions}
                placeholder="All Marketing Campaigns"
                searchPlaceholder="Search campaign..."
              />

              {/* Registration Date Range */}
              <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-800">
                    Registration Date Range
                  </label>
                  {(filters.registered_from || filters.registered_to) && (
                    <button
                      type="button"
                      onClick={() => {
                        setFilterField('registered_from', undefined)
                        setFilterField('registered_to', undefined)
                      }}
                      className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-800"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Quick Date Presets */}
                <div className="flex flex-wrap gap-1.5">
                  {[
                    {
                      label: 'Today',
                      from: moment().format('YYYY-MM-DD'),
                      to: moment().format('YYYY-MM-DD'),
                    },
                    {
                      label: 'Last 7 Days',
                      from: moment().subtract(6, 'days').format('YYYY-MM-DD'),
                      to: moment().format('YYYY-MM-DD'),
                    },
                    {
                      label: 'Last 30 Days',
                      from: moment().subtract(29, 'days').format('YYYY-MM-DD'),
                      to: moment().format('YYYY-MM-DD'),
                    },
                    {
                      label: 'This Month',
                      from: moment().startOf('month').format('YYYY-MM-DD'),
                      to: moment().endOf('month').format('YYYY-MM-DD'),
                    },
                    {
                      label: 'Last 90 Days',
                      from: moment().subtract(89, 'days').format('YYYY-MM-DD'),
                      to: moment().format('YYYY-MM-DD'),
                    },
                    {
                      label: 'This Year',
                      from: moment().startOf('year').format('YYYY-MM-DD'),
                      to: moment().endOf('year').format('YYYY-MM-DD'),
                    },
                  ].map((preset) => {
                    const isSelected =
                      (filters.registered_from || '') === preset.from &&
                      (filters.registered_to || '') === preset.to
                    return (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setFilterField('registered_from', undefined)
                            setFilterField('registered_to', undefined)
                          } else {
                            setFilterField('registered_from', preset.from)
                            setFilterField('registered_to', preset.to)
                          }
                        }}
                        className={`px-2.5 py-1 text-xs rounded-lg font-medium border transition-all ${
                          isSelected
                            ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                            : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        {preset.label}
                      </button>
                    )
                  })}
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <span className="text-[11px] text-gray-500 font-medium">
                      Registered From
                    </span>
                    <input
                      type="date"
                      value={filters.registered_from || ''}
                      onChange={(e) =>
                        setFilterField('registered_from', e.target.value)
                      }
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 bg-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] text-gray-500 font-medium">
                      Registered To
                    </span>
                    <input
                      type="date"
                      value={filters.registered_to || ''}
                      onChange={(e) =>
                        setFilterField('registered_to', e.target.value)
                      }
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 bg-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between gap-3 shadow-inner">
          <div>
            <button
              type="button"
              onClick={handleClearAll}
              className="px-4 py-2 text-xs font-semibold text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all border border-gray-200 hover:border-red-200 shadow-2xs"
            >
              Reset All Filters
            </button>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 bg-white hover:bg-gray-100 rounded-xl transition-all border border-gray-200"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleApply}
              className="px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2 transform active:scale-98"
            >
              <svg
                className="w-4 h-4 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span>Apply Filters</span>
              {activeCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-white text-emerald-700 font-bold text-[10px] flex items-center justify-center">
                  {activeCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
