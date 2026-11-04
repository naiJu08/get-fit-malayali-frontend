import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

import { getData, deleteData } from '../../apis/api.helpers'
import apiUrl from '../../apis/api.url'
import type { DashboardResponse, StaffDashboardResponse } from './types'
import { useAuthStore } from '../../store/authStore'
import { useSnackbarManager } from '../../components/common/snackbar'

const fetchDashboard = async (): Promise<DashboardResponse> => {
  const response = await getData(apiUrl.ADMIN_DASHBOARD)
  return response as DashboardResponse
}

const fetchNutritionistDashboard =
  async (): Promise<StaffDashboardResponse> => {
    const response = await getData(apiUrl.NUTRITIONIST_DASHBOARD)
    return response as StaffDashboardResponse
  }

const fetchYogistDashboard = async (): Promise<StaffDashboardResponse> => {
  const response = await getData(apiUrl.YOGIST_DASHBOARD)
  return response as StaffDashboardResponse
}

const fetchPhysiotherapistDashboard =
  async (): Promise<StaffDashboardResponse> => {
    const response = await getData(apiUrl.PHYSIOTHERAPIST_DASHBOARD)
    return response as StaffDashboardResponse
  }

// Fetch user profile data for user role
const fetchUserProfile = async () => {
  const response = await getData(apiUrl.AUTH_ME)
  return response
}

export const useAdminDashboard = () => {
  const { roleData } = useAuthStore()
  const roleName = roleData?.name
  const isAdminRole = roleName === 'admin' || roleName === 'superadmin'

  return useQuery(['admin-dashboard'], fetchDashboard, {
    enabled: isAdminRole,
    refetchOnWindowFocus: false,
  })
}

export const useNutritionistDashboard = () => {
  const { roleData } = useAuthStore()
  const roleName = roleData?.name
  const isNutritionistRole = roleName === 'nutritionist'

  return useQuery(['nutritionist-dashboard'], fetchNutritionistDashboard, {
    enabled: isNutritionistRole,
    refetchOnWindowFocus: false,
  })
}

export const useYogistDashboard = () => {
  const { roleData } = useAuthStore()
  const roleName = roleData?.name
  const isYogistRole = roleName === 'yogist'

  return useQuery(['yogist-dashboard'], fetchYogistDashboard, {
    enabled: isYogistRole,
    refetchOnWindowFocus: false,
  })
}

export const usePhysiotherapistDashboard = () => {
  const { roleData } = useAuthStore()
  const roleName = roleData?.name
  const isPhysiotherapistRole = roleName === 'physiotherapist'

  return useQuery(
    ['physiotherapist-dashboard'],
    fetchPhysiotherapistDashboard,
    {
      enabled: isPhysiotherapistRole,
      refetchOnWindowFocus: false,
    }
  )
}

export const useUserProfile = () => {
  const { roleData, userData } = useAuthStore()
  const isUserRole = roleData?.name === 'user'
  const userId = userData?.id

  return useQuery(['userProfile', userId], fetchUserProfile, {
    enabled: isUserRole && !!userId, // Only enable if role is "user" and user exists
    refetchOnWindowFocus: false,
    retry: 1,
  })
}

// Delete account mutation
export const useDeleteAccount = () => {
  const { clearAuthenticated } = useAuthStore()
  const { enqueueSnackbar } = useSnackbarManager()
  const queryClient = useQueryClient()

  return useMutation(() => deleteData(apiUrl.USERS_DELETE), {
    onSuccess: (data: any) => {
      const successMessage = data?.message || 'Account deleted successfully'
      enqueueSnackbar(successMessage, { variant: 'success' })

      // Clear authentication and logout
      clearAuthenticated()

      // Invalidate user profile query
      queryClient.invalidateQueries({ queryKey: ['userProfile'] })
    },
    onError: (error: any) => {
      const apiMessage =
        error?.response?.data?.errors?.[0] || error?.response?.data?.message
      enqueueSnackbar(apiMessage || 'Failed to delete account', {
        variant: 'error',
      })
    },
  })
}
