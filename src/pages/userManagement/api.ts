import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'

import { postData } from '../../apis/api.helpers'
import apiUrl from '../../apis/api.url'
import { useSnackbarManager } from '../../components/common/snackbar'
import { useAppStore } from '../../store/appStore'
import { useAuthStore } from '../../store/authStore'
import { useDomainManageStore } from '../../store/domainManageStore'
import { LoginSchema } from './schema'

export const useLogin = (handleOnSuccess: any) => {
  const { setToken, setAuthenticated, setUserData } = useAuthStore()
  const { setResetToken } = useAppStore()

  const { setIsLoading } = useAppStore()
  const navigate = useNavigate()
  const { enqueueSnackbar } = useSnackbarManager()
  const { domainType, setDomainType } = useDomainManageStore()
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
        const token = data?.token
        const user = data?.user || {}
        setResetToken?.(undefined as any)
        setToken(token)
        setAuthenticated(true)
        setIsLoading(false)
        handleOnSuccess?.()
        const role = user?.role
        // Map API role to domainType used across app
        const mappedDomain =
          role === 'admin' || role === 'superadmin'
            ? 'Employee'
            : domainType || 'Employee'
        setDomainType?.(mappedDomain as any)
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
