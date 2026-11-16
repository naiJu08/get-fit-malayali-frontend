import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AxiosError, AxiosResponse } from 'axios'
import { getData, updateData, updateFromData } from '../../apis/api.helpers'
import apiUrl from '../../apis/api.url'
import { useSnackbarManager } from '../../components/common/snackbar'
import { useAuthStore } from '../../store/authStore'

export interface UserProfileData {
  id?: number | string
  name?: string
  email?: string
  phone?: string
  role?: string
  avatar_url?: string | null
  status?: string
  state?: string
  gender?: string
  date_of_birth?: string
  height?: number | string
  weight?: number | string
  bmi?: number | string
  lifestyle?: string
  goal?: string
  food_preferences?: string
  medical_conditions?: string
  food_allergies?: string
  ethnicity?: string
  created_at?: string
  [key: string]: any
}

export const fetchMyProfile = async (): Promise<{ user: UserProfileData }> => {
  const response = await getData(apiUrl.AUTH_ME)
  return response
}

export const updateMyProfile = async (formDataOrObject: FormData | any) => {
  if (formDataOrObject instanceof FormData) {
    const response = await updateFromData(
      apiUrl.AUTH_UPDATE_PROFILE,
      formDataOrObject
    )
    return response.data
  }
  const response = await updateData(
    apiUrl.AUTH_UPDATE_PROFILE,
    formDataOrObject
  )
  return response
}

export const changePassword = async (data: {
  current_password?: string
  old_password?: string
  new_password?: string
  password?: string
  password_confirmation?: string
  confirm_password?: string
}) => {
  const payload = {
    current_password: data.current_password || data.old_password,
    new_password: data.new_password || data.password,
    password_confirmation: data.password_confirmation || data.confirm_password,
  }
  const response = await updateData(apiUrl.AUTH_CHANGE_PASSWORD, payload)
  return response
}

export const useProfile = () => {
  const { userData } = useAuthStore()
  const userId = userData?.id

  return useQuery(['userProfile', userId], fetchMyProfile, {
    refetchOnWindowFocus: false,
    enabled: !!userId,
    staleTime: 60000,
  })
}

export const useUpdateProfile = (onSuccessCallback?: (data: any) => void) => {
  const { enqueueSnackbar } = useSnackbarManager()
  const { setUserData, userData } = useAuthStore()
  const queryClient = useQueryClient()

  return useMutation(updateMyProfile, {
    onSuccess: (res: AxiosResponse | any) => {
      const updatedUser = res?.user || res?.data?.user
      if (updatedUser) {
        setUserData({ ...userData, ...updatedUser })
      }
      queryClient.invalidateQueries({ queryKey: ['userProfile'] })
      enqueueSnackbar(res?.message || 'Profile updated successfully', {
        variant: 'success',
      })
      if (onSuccessCallback) {
        onSuccessCallback(res)
      }
    },
    onError: (error: AxiosError | any) => {
      const errorMsg =
        error?.response?.data?.error ||
        error?.response?.data?.errors?.[0] ||
        error?.response?.data?.message ||
        'Failed to update profile'
      enqueueSnackbar(errorMsg, {
        variant: 'error',
      })
    },
  })
}

export const useChangePassword = (onSuccessCallback?: () => void) => {
  const { enqueueSnackbar } = useSnackbarManager()

  return useMutation(changePassword, {
    onSuccess: (res: any) => {
      enqueueSnackbar(res?.message || 'Password changed successfully', {
        variant: 'success',
      })
      if (onSuccessCallback) {
        onSuccessCallback()
      }
    },
    onError: (error: AxiosError | any) => {
      const errorMsg =
        error?.response?.data?.error ||
        error?.response?.data?.errors?.[0] ||
        error?.response?.data?.message ||
        'Failed to change password'
      enqueueSnackbar(errorMsg, {
        variant: 'error',
      })
    },
  })
}

// Compatibility exports
export const updateProfileAttachment = (input: any) => {
  return updateFromData(apiUrl.AUTH_UPDATE_PROFILE, input)
}

export const useEditMyProfile = (handleSubmission: (input: any) => void) => {
  return useUpdateProfile(handleSubmission)
}

export const useAssessor = (input?: any) => {
  void input
  return useProfile()
}
