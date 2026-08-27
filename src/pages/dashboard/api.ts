import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

import { getData, deleteData } from '../../apis/api.helpers'
import apiUrl from '../../apis/api.url'
import type { DashboardResponse, NutritionistDashboardResponse } from './types'
import { useAuthStore } from '../../store/authStore'
import { useSnackbarManager } from '../../components/common/snackbar'

const fetchDashboard = async (): Promise<DashboardResponse> => {
  const response = await getData(apiUrl.ADMIN_DASHBOARD)
  return response as DashboardResponse
}

const fetchNutritionistDashboard =
  async (): Promise<NutritionistDashboardResponse> => {
    const response = await getData(apiUrl.NUTRITIONIST_DASHBOARD)
    return response as NutritionistDashboardResponse
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

export const useUserProfile = () => {
  const { roleData } = useAuthStore()
  const isUserRole = roleData?.name === 'user'

  return useQuery(['userProfile'], fetchUserProfile, {
    enabled: isUserRole, // Only enable if role is "user"
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
