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
        password: params.password,
        username: params.username,
        // username: params.username.toLowerCase(),
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
        const folderKey = domainType.toLocaleLowerCase()
        const res = data[folderKey]
        setResetToken(res.reset_password_token)
        setToken(data.access_token)
        setAuthenticated(true)
        setIsLoading(false)
        handleOnSuccess?.()
        setDomainType(res.user.user_type)
        setUserData({
          id: res.user?.id,
          is_admin: res.user?.is_superuser,
          first_name: res.user?.first_name,
          last_name: res.user?.last_name,
          username: res.user?.username,
        })

        // navigate('/dashboard')
        if (domainType === 'Organisation') {
          navigate(`/myorganisation/profile`)
        } else if (domainType === 'Employee') {
          navigate(`/admin-user`)
        } else {
          navigate('/assessors')
        }
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
