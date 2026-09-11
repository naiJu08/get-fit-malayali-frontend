import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'

import { postData } from '../../apis/api.helpers'
import apiUrl from '../../apis/api.url'
import { useSnackbarManager } from '../../components/common/snackbar'
import { useAppStore } from '../../store/appStore'
import { useAuthStore } from '../../store/authStore'
import { LoginSchema } from './schema'

export const useLogin = (handleOnSuccess: any) => {
  const {
    setToken,
    setRefreshToken,
    setTokenExpiresAt,
    setRefreshTokenExpiresAt,
    setAuthenticated,
    setRoleData,
    setUserData,
  } = useAuthStore()
  const { setResetToken } = useAppStore()

  const { setIsLoading } = useAppStore()
  const navigate = useNavigate()
  const { enqueueSnackbar } = useSnackbarManager()
  const loginMutation = useMutation(
    async (params: LoginSchema) => {
      setIsLoading(true)
      const data = {
        email: params.username.trim().toLowerCase(),
        password: params.password,
      }
      const response = await postData(apiUrl.LOGIN_URL, data)
      return response
    },
    {
      onError: (err: any) => {
        setIsLoading(false)
        enqueueSnackbar(
          err?.response?.data?.error?.message ??
            err?.response?.data?.message ??
            err?.response?.data?.error ??
            'Login failed',
          {
            variant: 'error',
          }
        )
      },
      onSuccess: (data: any) => {
        const token = data?.token || data?.access_token
        const refreshToken = data?.refresh_token
        const expiresIn = data?.expires_in // in seconds (e.g., 604800)
        const refreshExpiresIn = data?.refresh_expires_in // in seconds
        const user = data?.user || {}
        const successMessage = data?.message ?? data?.data?.message

        setResetToken?.(undefined as any)
        setToken(token)
        if (refreshToken) {
          setRefreshToken(refreshToken)
        }

        // Calculate token expiration timestamp
        if (expiresIn) {
          const expiresAt = Date.now() + expiresIn * 1000 // Convert to milliseconds
          setTokenExpiresAt(expiresAt)
        }

        // Calculate refresh token expiration timestamp
        if (refreshExpiresIn) {
          const refreshExpiresAt = Date.now() + refreshExpiresIn * 1000
          setRefreshTokenExpiresAt(refreshExpiresAt)
        } else if (expiresIn) {
          // If refresh_expires_in not provided, assume refresh token lasts 7x longer than access token
          const refreshExpiresAt = Date.now() + expiresIn * 7 * 1000
          setRefreshTokenExpiresAt(refreshExpiresAt)
        }

        setAuthenticated(true)
        setIsLoading(false)
        enqueueSnackbar(successMessage, {
          variant: 'success',
        })
        handleOnSuccess?.()
        setRoleData({
          id: user.id,
          name: user?.role,
        })
        setUserData({
          id: user?.id,
          name: user?.name,
          email: user?.email,
          username: user?.email,
          is_admin: user?.role === 'superadmin' || user?.role === 'admin',
        } as any)
        navigate('/dashboard', { replace: true })
      },

      onSettled: () => {
        setIsLoading(false)
      },
    }
  )

  return loginMutation
}

export const resetPassword = async (data: any) => {
  try {
    const details = await postData(`forgot_password`, data)
    return details
  } catch (error) {
    throw error
  }
}
export const ForgetResetPassword = (data: any) => {
  return postData(`reset-password`, data)
}
export const verifyResetPassword = (data: any) => {
  return postData(`forgot-password-verify-token`, data)
}
export const forceChangePassword = (data: any) => {
  return postData(`employee/force-change-password/`, data)
}
