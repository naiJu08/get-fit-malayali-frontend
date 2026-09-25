import React, { useState, useEffect, useRef } from 'react'
import { useLayoutStore } from '../../store/layoutStore'
import { useProfile, useUpdateProfile } from './api'
import ChangePasswordModal from './password'

const formatDate = (val?: string) => {
  if (!val) return 'N/A'
  try {
    const d = new Date(val)
    return d.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return val
  }
}

const getRoleBadgeColor = (role?: string) => {
  switch (role) {
    case 'superadmin':
      return 'bg-purple-100 text-purple-800 border-purple-200'
    case 'admin':
      return 'bg-indigo-100 text-indigo-800 border-indigo-200'
    case 'nutritionist':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200'
    case 'physiotherapist':
      return 'bg-sky-100 text-sky-800 border-sky-200'
    case 'yogist':
      return 'bg-teal-100 text-teal-800 border-teal-200'
    case 'sales':
      return 'bg-amber-100 text-amber-800 border-amber-200'
    case 'marketing':
      return 'bg-pink-100 text-pink-800 border-pink-200'
    default:
      return 'bg-blue-100 text-blue-800 border-blue-200'
  }
}

export default function ProfilePage() {
  const { setLayoutType } = useLayoutStore()
  const { data, isLoading, isError, refetch } = useProfile()

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [state, setState] = useState('')

  // Client-specific fields
  const [gender, setGender] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [height, setHeight] = useState('')
  const [weight, setWeight] = useState('')
  const [lifestyle, setLifestyle] = useState('')
  const [goal, setGoal] = useState('')
  const [foodPreferences, setFoodPreferences] = useState('')
  const [medicalConditions, setMedicalConditions] = useState('')
  const [foodAllergies, setFoodAllergies] = useState('')
  const [ethnicity, setEthnicity] = useState('')

  // Avatar upload
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [removeAvatar, setRemoveAvatar] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [showPasswordModal, setShowPasswordModal] = useState(false)

  useEffect(() => {
    setLayoutType('sideNav')
  }, [setLayoutType])

  const user = data?.user

  useEffect(() => {
    if (user) {
      setName(user.name || '')
      setPhone(user.phone || '')
      setState(user.state || '')
      setGender(user.gender || '')
      setDateOfBirth(
        user.date_of_birth ? user.date_of_birth.substring(0, 10) : ''
      )
      setHeight(user.height ? String(user.height) : '')
      setWeight(user.weight ? String(user.weight) : '')
      setLifestyle(user.lifestyle || '')
      setGoal(user.goal || '')
      setFoodPreferences(user.food_preferences || '')
      setMedicalConditions(user.medical_conditions || '')
      setFoodAllergies(user.food_allergies || '')
      setEthnicity(user.ethnicity || '')
      setAvatarPreview(user.avatar_url || null)
      setRemoveAvatar(false)
      setAvatarFile(null)
    }
  }, [user])

  const updateProfileMutation = useUpdateProfile(() => {
    refetch()
  })

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setAvatarFile(file)
      setRemoveAvatar(false)
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveAvatar = () => {
    setAvatarFile(null)
    setAvatarPreview(null)
    setRemoveAvatar(true)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const formData = new FormData()
    formData.append('name', name)
    formData.append('phone', phone)
    formData.append('state', state)

    if (avatarFile) {
      formData.append('avatar', avatarFile)
    }
    if (removeAvatar) {
      formData.append('remove_avatar', 'true')
    }

    // Client/user profile fields
    if (user?.role === 'user') {
      if (gender) formData.append('gender', gender)
      if (dateOfBirth) formData.append('date_of_birth', dateOfBirth)
      if (height) formData.append('height', height)
      if (weight) formData.append('weight', weight)
      if (lifestyle) formData.append('lifestyle', lifestyle)
      if (goal) formData.append('goal', goal)
      if (foodPreferences) formData.append('food_preferences', foodPreferences)
      if (medicalConditions)
        formData.append('medical_conditions', medicalConditions)
      if (foodAllergies) formData.append('food_allergies', foodAllergies)
      if (ethnicity) formData.append('ethnicity', ethnicity)
    }

    updateProfileMutation.mutate(formData)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50/50 dark:bg-gray-900 p-6 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-gray-500">
            Loading profile...
          </p>
        </div>
      </div>
    )
  }

  if (isError || !user) {
    return (
      <div className="min-h-screen bg-gray-50/50 dark:bg-gray-900 p-6 flex items-center justify-center">
        <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 max-w-md">
          <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Failed to Load Profile
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Unable to fetch your user profile. Please check your network and
            retry.
          </p>
          <button
            onClick={() => refetch()}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-md transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  const initialLetter = (user.name || 'U').charAt(0).toUpperCase()
  const isClientRole = user.role === 'user'

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-slate-50 to-blue-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Page Top Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Account & Profile Settings
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage your personal profile, credentials, and settings.
          </p>
        </div>

        {/* Hero Card with Profile Picture */}
        <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-xl p-6 sm:p-8">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 rounded-full bg-gradient-to-br from-blue-400/10 to-indigo-400/20 blur-2xl pointer-events-none" />
          <div className="relative flex flex-col md:flex-row items-center md:items-start gap-6 sm:gap-8">
            {/* Avatar & Upload Trigger */}
            <div className="relative flex flex-col items-center flex-shrink-0">
              <div className="relative group w-28 h-28 sm:w-32 sm:h-32 rounded-3xl overflow-hidden shadow-xl ring-4 ring-white dark:ring-gray-700 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white text-4xl font-extrabold">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt={user.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="capitalize">{initialLetter}</span>
                )}

                {/* Upload Overlay */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-1 cursor-pointer"
                  title="Change photo"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <span className="text-[11px] font-semibold">Change</span>
                </button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />

              <div className="flex gap-2 mt-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 underline"
                >
                  Upload photo
                </button>
                {avatarPreview && (
                  <>
                    <span className="text-gray-300 dark:text-gray-600">·</span>
                    <button
                      type="button"
                      onClick={handleRemoveAvatar}
                      className="text-xs font-medium text-red-500 hover:text-red-600"
                    >
                      Remove
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* User Meta */}
            <div className="flex-1 text-center md:text-left space-y-2">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white capitalize">
                  {user.name || 'User'}
                </h2>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${getRoleBadgeColor(
                    user.role
                  )}`}
                >
                  {user.role || 'Member'}
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  {user.status === 'active'
                    ? 'Active'
                    : user.status || 'Active'}
                </span>
              </div>

              <p className="text-sm text-gray-500 dark:text-gray-400">
                {user.email}
              </p>

              <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-6 text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-1.5">
                  <span className="text-gray-400">User ID:</span>
                  <span className="font-semibold text-gray-800 dark:text-gray-200">
                    #{user.id}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-gray-400">Member Since:</span>
                  <span className="font-semibold text-gray-800 dark:text-gray-200">
                    {formatDate(user.created_at)}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex md:flex-col gap-2.5 w-full md:w-auto">
              <button
                type="button"
                onClick={() => setShowPasswordModal(true)}
                className="flex-1 md:flex-none px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-200 flex items-center justify-center gap-2 shadow-sm transition-colors"
              >
                <svg
                  className="w-4 h-4 text-amber-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                  />
                </svg>
                <span>Reset Password</span>
              </button>
            </div>
          </div>
        </div>

        {/* Profile Edit Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Personal Information */}
          <div className="rounded-3xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-xl overflow-hidden">
            <div className="px-6 sm:px-8 py-5 border-b border-gray-100 dark:border-gray-700/60 bg-gray-50/50 dark:bg-gray-800/50 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  Personal Information
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Update your name, contact phone number, and location.
                </p>
              </div>
            </div>

            <div className="p-6 sm:p-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-200 mb-1.5">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter full name"
                  required
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm"
                />
              </div>

              {/* Email (Disabled / Read-only) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-200">
                    Email Address
                  </label>
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-2 py-0.5 rounded-md">
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                    Email cannot be updated
                  </span>
                </div>
                <input
                  type="email"
                  value={user.email || ''}
                  disabled
                  readOnly
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-100/80 dark:bg-gray-700/60 text-gray-500 dark:text-gray-400 cursor-not-allowed select-none shadow-sm"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-200 mb-1.5">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Enter phone number"
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm"
                />
              </div>

              {/* State */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-200 mb-1.5">
                  State / Region
                </label>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="e.g. Kerala"
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm"
                />
              </div>
            </div>
          </div>

          {/* Client Specific Health & Fitness Profile (Only shown for Client Role) */}
          {isClientRole && (
            <div className="rounded-3xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-xl overflow-hidden">
              <div className="px-6 sm:px-8 py-5 border-b border-gray-100 dark:border-gray-700/60 bg-gray-50/50 dark:bg-gray-800/50">
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  Health & Fitness Details
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Custom parameters used for tailored diet and exercise
                  routines.
                </p>
              </div>

              <div className="p-6 sm:p-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-200 mb-1.5">
                    Gender
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm"
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-200 mb-1.5">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-200 mb-1.5">
                    Height (cm)
                  </label>
                  <input
                    type="number"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    placeholder="e.g. 175"
                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-200 mb-1.5">
                    Weight (kg)
                  </label>
                  <input
                    type="number"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    placeholder="e.g. 70"
                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-200 mb-1.5">
                    Lifestyle
                  </label>
                  <input
                    type="text"
                    value={lifestyle}
                    onChange={(e) => setLifestyle(e.target.value)}
                    placeholder="e.g. Moderately active"
                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-200 mb-1.5">
                    Primary Goal
                  </label>
                  <input
                    type="text"
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    placeholder="e.g. Weight loss, Muscle gain"
                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Bottom Save Action */}
          <div className="flex items-center justify-end gap-4 pt-2">
            <button
              type="submit"
              disabled={updateProfileMutation.isPending}
              className="px-8 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 transition-all flex items-center gap-2.5 disabled:opacity-60"
            >
              {updateProfileMutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving changes...</span>
                </>
              ) : (
                <>
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
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span>Save Profile Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Password Reset Modal */}
      <ChangePasswordModal
        isOpen={showPasswordModal}
        handleClose={() => setShowPasswordModal(false)}
      />
    </div>
  )
}
