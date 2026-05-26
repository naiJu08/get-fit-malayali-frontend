import { renderHook, act } from '@testing-library/react'

const mockPostData = jest.fn()
const mockSetToken = jest.fn()
const mockSetRefreshToken = jest.fn()
const mockSetTokenExpiresAt = jest.fn()
const mockSetRefreshTokenExpiresAt = jest.fn()
const mockSetAuthenticated = jest.fn()
const mockSetRoleData = jest.fn()
const mockSetUserData = jest.fn()
const mockSetResetToken = jest.fn()
const mockSetIsLoading = jest.fn()
const mockEnqueueSnackbar = jest.fn()
const mockNavigate = jest.fn()

jest.mock('../../../apis/api.helpers', () => ({
  postData: (...args: any[]) => mockPostData(...args),
}))

jest.mock('../../../components/common/snackbar', () => ({
  useSnackbarManager: () => ({ enqueueSnackbar: mockEnqueueSnackbar }),
}))

jest.mock('../../../store/authStore', () => ({
  useAuthStore: () => ({
    setToken: mockSetToken,
    setRefreshToken: mockSetRefreshToken,
    setTokenExpiresAt: mockSetTokenExpiresAt,
    setRefreshTokenExpiresAt: mockSetRefreshTokenExpiresAt,
    setAuthenticated: mockSetAuthenticated,
    setRoleData: mockSetRoleData,
    setUserData: mockSetUserData,
  }),
}))

jest.mock('../../../store/appStore', () => ({
  useAppStore: () => ({
    setResetToken: mockSetResetToken,
    setIsLoading: mockSetIsLoading,
  }),
}))

jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}))

// Minimal `useMutation` mock used by useLogin
jest.mock('@tanstack/react-query', () => ({
  useMutation: (mutationFn: any, options: any) => {
    return {
      mutate: async (vars: any) => {
        try {
          const result = await mutationFn(vars)
          options?.onSuccess?.(result)
          options?.onSettled?.()
          return result
        } catch (e) {
          options?.onError?.(e)
          options?.onSettled?.()
          throw e
        }
      },
    }
  },
}))

import {
  resetPassword,
  ForgetResetPassword,
  verifyResetPassword,
  forceChangePassword,
  useLogin,
} from '../api'
import apiUrl from '../../../apis/api.url'

describe('userManagement api.ts', () => {
  beforeEach(() => jest.clearAllMocks())

  test('resetPassword calls postData with forgot_password', async () => {
    mockPostData.mockResolvedValueOnce({ message: 'sent' })
    const res = await resetPassword({ email: 'a@b.com' })
    expect(mockPostData).toHaveBeenCalledWith('forgot_password', {
      email: 'a@b.com',
    })
    expect(res.message).toBe('sent')
  })

  test('ForgetResetPassword includes confirm if provided', async () => {
    mockPostData.mockResolvedValueOnce({ message: 'ok' })
    await ForgetResetPassword({
      token: 't',
      new_password: 'p',
      confirm_password: 'p',
    })
    expect(mockPostData).toHaveBeenCalledWith('reset-password', {
      token: 't',
      new_password: 'p',
      confirm_password: 'p',
    })
  })

  test('verifyResetPassword posts to forgot-password-verify-token', async () => {
    mockPostData.mockResolvedValueOnce({ valid: true })
    const res = await verifyResetPassword({ token: 't' })
    expect(mockPostData).toHaveBeenCalledWith('forgot-password-verify-token', {
      token: 't',
    })
    expect(res.valid).toBe(true)
  })

  test('forceChangePassword posts to employee/force-change-password/', async () => {
    mockPostData.mockResolvedValueOnce({ message: 'changed' })
    const res = await forceChangePassword({ reset_token: 'r', password: 'p' })
    expect(mockPostData).toHaveBeenCalledWith(
      'employee/force-change-password/',
      { reset_token: 'r', password: 'p' }
    )
    expect(res.message).toBe('changed')
  })

  test('useLogin normalizes email and calls LOGIN_URL', async () => {
    mockPostData.mockResolvedValueOnce({
      token: 'tok',
      refresh_token: 'rtok',
      expires_in: 3600,
      refresh_expires_in: 604800,
      user: { id: 1, name: 'X', email: 'x@x.com', role: 'admin' },
    })

    const { result } = renderHook(() => useLogin(undefined))
    await act(async () => {
      await result.current.mutate({
        username: '  TEST@EXAMPLE.COM  ',
        password: 'P',
      })
    })

    expect(mockPostData).toHaveBeenCalledWith(apiUrl.LOGIN_URL, {
      email: 'test@example.com',
      password: 'P',
    })
    expect(mockSetToken).toHaveBeenCalledWith('tok')
    expect(mockSetAuthenticated).toHaveBeenCalledWith(true)
  })
})
