import DashboardView from './dashboard'
import NutritionistDashboardView from './nutritionist-dashboard'
import {
  useAdminDashboard,
  useNutritionistDashboard,
  useUserProfile,
  useDeleteAccount,
} from './api'
import type { DashboardResponse, NutritionistDashboardResponse } from './types'
import { useAuthStore } from '../../store/authStore'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function DashboardPage() {
  const { roleData } = useAuthStore()
  const roleName = roleData?.name

  // Check if role is specifically "user"
  const isUserRole = roleName === 'user'
  const isNutritionistRole = roleName === 'nutritionist'

  // API hooks now handle conditional logic internally based on auth store role
  const {
    data: userData,
    isLoading: isUserLoading,
    isError: isUserError,
    refetch: refetchUser,
  } = useUserProfile()
  const {
    data: adminData,
    isLoading: isAdminLoading,
    isError: isAdminError,
    refetch: refetchAdmin,
  } = useAdminDashboard()
  const {
    data: nutritionistData,
    isLoading: isNutritionistLoading,
    isError: isNutritionistError,
    refetch: refetchNutritionist,
  } = useNutritionistDashboard()

  // Show different content based on role
  if (isUserRole) {
    // User role sees user profile
    return (
      <UserProfileView
        data={userData?.user}
        loading={isUserLoading}
        error={isUserError}
        onRetry={() => refetchUser()}
      />
    )
  }

  if (isNutritionistRole) {
    return (
      <NutritionistDashboardView
        data={nutritionistData as NutritionistDashboardResponse | undefined}
        loading={isNutritionistLoading}
        error={isNutritionistError}
        onRetry={() => refetchNutritionist()}
      />
    )
  }

  // All other admin roles see admin dashboard
  return (
    <DashboardView
      data={adminData as DashboardResponse | undefined}
      loading={isAdminLoading}
      error={isAdminError}
      onRetry={() => refetchAdmin()}
    />
  )
}

// Simple user profile view component
function UserProfileView({ data, loading, error, onRetry }: any) {
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const navigate = useNavigate()
  const deleteAccount = useDeleteAccount()

  const handleDeleteAccount = async () => {
    await deleteAccount.mutateAsync()

    // After successful deletion, navigate to login
    // (The hook handles success/error notifications and auth clearing)
    setTimeout(() => {
      navigate('/login')
    }, 1500) // Give time for user to see success message
  }
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primaryGreen"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">
            Error Loading Profile
          </h2>
          <p className="text-gray-600 mb-4">
            Unable to load your profile. Please try again.
          </p>
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-600 mb-2">
            No Profile Data
          </h2>
          <p className="text-gray-600">Profile information not available.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-lg border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white text-xl font-bold">
                  {data.name ? data.name.charAt(0).toUpperCase() : 'U'}
                </span>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
                <p className="text-sm text-gray-500">
                  Manage your personal information
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  data.status === 'active'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {data.status === 'active'
                  ? '● Active'
                  : data.status || 'Unknown'}
              </span>

              {/* Delete Account Button */}
              <button
                onClick={() => setShowDeleteModal(true)}
                className="bg-red-600 text-white py-2 px-6 rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-gray-100">
          <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8">
            {/* Avatar Section */}
            <div className="flex flex-col items-center">
              <div className="w-32 h-32 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-white text-4xl font-bold">
                  {data.name ? data.name.charAt(0).toUpperCase() : 'U'}
                </span>
              </div>
              <div className="mt-4 text-center">
                <h2 className="text-2xl font-bold text-gray-900">
                  {data.name || 'User'}
                </h2>
                <p className="text-gray-500">{data.role || 'User'}</p>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {data.height || '--'}
                </div>
                <div className="text-sm text-gray-600">Height (cm)</div>
              </div>
              <div className="bg-green-50 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {data.weight || '--'}
                </div>
                <div className="text-sm text-gray-600">Weight (kg)</div>
              </div>
              <div className="bg-purple-50 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {data.bmi || '--'}
                </div>
                <div className="text-sm text-gray-600">BMI</div>
              </div>
              <div className="bg-orange-50 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {data.created_at
                    ? new Date(data.created_at).getFullYear()
                    : '--'}
                </div>
                <div className="text-sm text-gray-600">Member Since</div>
              </div>
            </div>
          </div>
        </div>

        {/* Information Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Personal Information */}
          <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                <svg
                  className="w-6 h-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900">
                Personal Information
              </h3>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-gray-600">Full Name</span>
                <span className="font-medium text-gray-900">
                  {data.name || 'Not provided'}
                </span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-gray-600">Email</span>
                <span className="font-medium text-gray-900">
                  {data.email || 'Not provided'}
                </span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-gray-600">Phone</span>
                <span className="font-medium text-gray-900">
                  {data.phone || 'Not provided'}
                </span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-gray-600">Date of Birth</span>
                <span className="font-medium text-gray-900">
                  {data.date_of_birth || 'Not provided'}
                </span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-gray-600">Gender</span>
                <span className="font-medium text-gray-900">
                  {data.gender || 'Not provided'}
                </span>
              </div>
              <div className="flex justify-between items-center py-3">
                <span className="text-gray-600">State</span>
                <span className="font-medium text-gray-900">
                  {data.state || 'Not provided'}
                </span>
              </div>
            </div>
          </div>

          {/* Health & Fitness */}
          <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900">
                Health & Fitness
              </h3>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-gray-600">Height</span>
                <span className="font-medium text-gray-900">
                  {data.height ? `${data.height} cm` : 'Not provided'}
                </span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-gray-600">Weight</span>
                <span className="font-medium text-gray-900">
                  {data.weight ? `${data.weight} kg` : 'Not provided'}
                </span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-gray-600">BMI</span>
                <span className="font-medium text-gray-900">
                  {data.bmi || 'Not provided'}
                </span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-gray-600">Lifestyle</span>
                <span className="font-medium text-gray-900">
                  {data.lifestyle || 'Not provided'}
                </span>
              </div>
              <div className="flex justify-between items-center py-3">
                <span className="text-gray-600">Goal</span>
                <span className="font-medium text-gray-900">
                  {data.goal || 'Not provided'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Preferences & Diet */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Food Preferences */}
          <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                <svg
                  className="w-6 h-6 text-orange-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900">
                Food Preferences
              </h3>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-gray-600">Food Preferences</span>
                <span className="font-medium text-gray-900">
                  {data.food_preferences || 'Not specified'}
                </span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-gray-600">Medical Conditions</span>
                <span className="font-medium text-gray-900">
                  {data.medical_conditions || 'None'}
                </span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-gray-600">Food Allergies</span>
                <span className="font-medium text-gray-900">
                  {data.food_allergies || 'None'}
                </span>
              </div>
              <div className="flex justify-between items-center py-3">
                <span className="text-gray-600">Ethnicity</span>
                <span className="font-medium text-gray-900">
                  {data.ethnicity || 'Not specified'}
                </span>
              </div>
            </div>
          </div>

          {/* Account Settings */}
          <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                <svg
                  className="w-6 h-6 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900">
                Account Settings
              </h3>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-gray-600">User ID</span>
                <span className="font-medium text-gray-900">
                  #{data.id || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-gray-600">Device Data Consent</span>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    data.device_data_consent
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {data.device_data_consent ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              <div className="flex justify-between items-center py-3">
                <span className="text-gray-600">Member Since</span>
                <span className="font-medium text-gray-900">
                  {data.created_at
                    ? new Date(data.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    : 'Not provided'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Account Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Delete Account?
              </h3>
              <p className="text-gray-600 mb-6">
                This action cannot be undone. All your data will be permanently
                deleted.
              </p>
              <div className="flex space-x-4">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 bg-gray-200 text-gray-800 py-3 px-4 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleteAccount.isPending}
                  className="flex-1 bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deleteAccount.isPending ? 'Deleting...' : 'Delete Account'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
