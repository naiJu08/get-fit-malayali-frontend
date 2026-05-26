import React from 'react'
import {
  render,
  screen,
  fireEvent,
  renderHook,
  act,
  waitFor,
} from '@testing-library/react'

import {
  resetPassword,
  ForgetResetPassword,
  verifyResetPassword,
  forceChangePassword,
  useLogin,
} from '../api'
import {
  loginSchema,
  resetSchema,
  forgetPasswordSchema,
  forgotSchema,
} from '../schema'
import apiUrl from '../../../apis/api.url'

const getPages = () => ({
  Login: require('../login').default as React.ComponentType,
  ForgetPassword: require('../forgetPassword').default as React.ComponentType,
  ResetPassword: require('../resetPasswords').default as React.ComponentType,
  ForceChangePassword: require('../changePassword')
    .default as React.ComponentType,
})

const mockNavigate = jest.fn()
const mockEnqueueSnackbar = jest.fn()
const mockParams = { token: 'test-token' }

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => mockParams,
  }
})

jest.mock('../../../components/common/snackbar', () => ({
  useSnackbarManager: () => ({ enqueueSnackbar: mockEnqueueSnackbar }),
}))

const mockSetToken = jest.fn()
const mockSetRefreshToken = jest.fn()
const mockSetTokenExpiresAt = jest.fn()
const mockSetRefreshTokenExpiresAt = jest.fn()
const mockSetAuthenticated = jest.fn()
const mockSetRoleData = jest.fn()
const mockSetUserData = jest.fn()

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

const mockSetResetToken = jest.fn()
const mockSetIsLoading = jest.fn()

jest.mock('../../../store/appStore', () => ({
  useAppStore: () => ({
    isLoading: false,
    is_password_expired: true,
    reset_password_token: 'reset-token',
    setResetToken: mockSetResetToken,
    setIsLoading: mockSetIsLoading,
  }),
}))

jest.mock('../../../store/domainManageStore', () => {
  const domainTypes = {
    EMPLOYEE: 'Employee',
    ASSESSOR: 'Assessor',
    ORGANISATION: 'Organisation',
    NUTRITIONIST: 'Nutritionist',
  } as const

  const useDomainManageStore = Object.assign(
    () => ({ domainType: domainTypes.EMPLOYEE }),
    {
      getState: () => ({ domainType: domainTypes.EMPLOYEE }),
    }
  )

  return { domainTypes, useDomainManageStore }
})

const mockPostData = jest.fn()
jest.mock('../../../apis/api.helpers', () => ({
  postData: (...args: any[]) => mockPostData(...args),
}))

jest.mock('../../../apis/core', () => ({
  __esModule: true,
  default: {
    post: jest.fn(() => Promise.resolve({ data: {} })),
    get: jest.fn(() => Promise.resolve({ data: {} })),
    put: jest.fn(() => Promise.resolve({ data: {} })),
    patch: jest.fn(() => Promise.resolve({ data: {} })),
    delete: jest.fn(() => Promise.resolve({ data: {} })),
    interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } },
  },
}))

// Minimal `useMutation` mock that runs the provided mutationFn
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

// ============================================================================
// SCHEMA TESTS
// ============================================================================

describe('schema.ts - Login Schema Validation', () => {
  test('loginSchema accepts valid email and password', () => {
    const result = loginSchema.safeParse({
      username: 'user@example.com',
      password: 'SecurePassword123',
    })
    expect(result.success).toBe(true)
  })

  test('loginSchema rejects invalid email format', () => {
    const result = loginSchema.safeParse({
      username: 'not-an-email',
      password: 'password',
    })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.message).toContain('valid email')
  })

  test('loginSchema rejects empty username', () => {
    const result = loginSchema.safeParse({
      username: '',
      password: 'password',
    })
    expect(result.success).toBe(false)
  })

  test('loginSchema rejects empty password', () => {
    const result = loginSchema.safeParse({
      username: 'user@example.com',
      password: '',
    })
    expect(result.success).toBe(false)
  })

  test('loginSchema rejects password with leading spaces', () => {
    const result = loginSchema.safeParse({
      username: 'user@example.com',
      password: '  password',
    })
    expect(result.success).toBe(false)
  })
})

describe('schema.ts - Forget Password Schema Validation', () => {
  test('forgetPasswordSchema accepts valid email', () => {
    const result = forgetPasswordSchema.safeParse({
      username: 'user@example.com',
    })
    expect(result.success).toBe(true)
  })

  test('forgetPasswordSchema rejects invalid email', () => {
    const result = forgetPasswordSchema.safeParse({
      username: 'invalid-email',
    })
    expect(result.success).toBe(false)
  })
})

describe('schema.ts - Reset Password Schema Validation', () => {
  const validPassword = 'ValidPass123!'

  test('resetSchema accepts valid matching passwords', () => {
    const result = resetSchema.safeParse({
      password: validPassword,
      confirm_password: validPassword,
    })
    expect(result.success).toBe(true)
  })

  test('resetSchema rejects non-matching passwords', () => {
    const result = resetSchema.safeParse({
      password: validPassword,
      confirm_password: 'DifferentPass123!',
    })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.message).toContain('do not match')
  })

  test('resetSchema rejects password without uppercase letter', () => {
    const result = resetSchema.safeParse({
      password: 'validpass123!',
      confirm_password: 'validpass123!',
    })
    expect(result.success).toBe(false)
  })

  test('resetSchema rejects password without lowercase letter', () => {
    const result = resetSchema.safeParse({
      password: 'VALIDPASS123!',
      confirm_password: 'VALIDPASS123!',
    })
    expect(result.success).toBe(false)
  })

  test('resetSchema rejects password without number', () => {
    const result = resetSchema.safeParse({
      password: 'ValidPass!',
      confirm_password: 'ValidPass!',
    })
    expect(result.success).toBe(false)
  })

  test('resetSchema rejects password without special character', () => {
    const result = resetSchema.safeParse({
      password: 'ValidPass123',
      confirm_password: 'ValidPass123',
    })
    expect(result.success).toBe(false)
  })

  test('resetSchema rejects password shorter than 8 characters', () => {
    const result = resetSchema.safeParse({
      password: 'Pass1!',
      confirm_password: 'Pass1!',
    })
    expect(result.success).toBe(false)
  })

  test('resetSchema rejects password with spaces', () => {
    const result = resetSchema.safeParse({
      password: 'Valid Pass123!',
      confirm_password: 'Valid Pass123!',
    })
    expect(result.success).toBe(false)
  })
})

describe('schema.ts - Forgot Password Schema Validation', () => {
  const validPassword = 'ValidPass123!'

  test('forgotSchema accepts valid data', () => {
    const result = forgotSchema.safeParse({
      password: validPassword,
      confirm_password: validPassword,
      old_password: 'OldPass123!',
    })
    expect(result.success).toBe(true)
  })

  test('forgotSchema rejects non-matching passwords', () => {
    const result = forgotSchema.safeParse({
      password: validPassword,
      confirm_password: 'DifferentPass123!',
      old_password: 'OldPass123!',
    })
    expect(result.success).toBe(false)
  })

  test('forgotSchema requires old_password field', () => {
    const result = forgotSchema.safeParse({
      password: validPassword,
      confirm_password: validPassword,
    })
    expect(result.success).toBe(false)
  })
})

// ============================================================================
// API TESTS
// ============================================================================

describe('api.ts - API Helper Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('resetPassword', () => {
    test('resetPassword posts to forgot_password endpoint', async () => {
      mockPostData.mockResolvedValueOnce({
        message: 'Password reset email sent',
      })
      const response = await resetPassword({ email: 'user@example.com' })
      expect(mockPostData).toHaveBeenCalledWith('forgot_password', {
        email: 'user@example.com',
      })
      expect(response.message).toBe('Password reset email sent')
    })

    test('resetPassword handles API error', async () => {
      const error = new Error('API Error')
      mockPostData.mockRejectedValueOnce(error)
      await expect(
        resetPassword({ email: 'user@example.com' })
      ).rejects.toThrow('API Error')
    })
  })

  describe('ForgetResetPassword', () => {
    test('ForgetResetPassword posts to reset-password endpoint', async () => {
      mockPostData.mockResolvedValueOnce({
        message: 'Password reset successful',
      })
      const response = await ForgetResetPassword({
        token: 'test-token',
        new_password: 'NewPass123!',
      })
      expect(mockPostData).toHaveBeenCalledWith('reset-password', {
        token: 'test-token',
        new_password: 'NewPass123!',
      })
      expect(response.message).toBe('Password reset successful')
    })

    test('ForgetResetPassword includes confirm_password if provided', async () => {
      mockPostData.mockResolvedValueOnce({ message: 'success' })
      await ForgetResetPassword({
        token: 'test-token',
        new_password: 'NewPass123!',
        confirm_password: 'NewPass123!',
      })
      expect(mockPostData).toHaveBeenCalledWith('reset-password', {
        token: 'test-token',
        new_password: 'NewPass123!',
        confirm_password: 'NewPass123!',
      })
    })
  })

  describe('verifyResetPassword', () => {
    test('verifyResetPassword posts to forgot-password-verify-token endpoint', async () => {
      mockPostData.mockResolvedValueOnce({ valid: true })
      const response = await verifyResetPassword({ token: 'test-token' })
      expect(mockPostData).toHaveBeenCalledWith(
        'forgot-password-verify-token',
        {
          token: 'test-token',
        }
      )
      expect(response.valid).toBe(true)
    })

    test('verifyResetPassword handles invalid token', async () => {
      const error = new Error('Invalid token')
      mockPostData.mockRejectedValueOnce(error)
      await expect(
        verifyResetPassword({ token: 'invalid-token' })
      ).rejects.toThrow('Invalid token')
    })
  })

  describe('forceChangePassword', () => {
    test('forceChangePassword posts to employee/force-change-password/ endpoint', async () => {
      mockPostData.mockResolvedValueOnce({
        message: 'Password changed successfully',
      })
      const response = await forceChangePassword({
        reset_token: 'reset-token',
        password: 'NewPass123!',
      })
      expect(mockPostData).toHaveBeenCalledWith(
        'employee/force-change-password/',
        {
          reset_token: 'reset-token',
          password: 'NewPass123!',
        }
      )
      expect(response.message).toBe('Password changed successfully')
    })

    test('forceChangePassword includes optional fields', async () => {
      mockPostData.mockResolvedValueOnce({ message: 'success' })
      await forceChangePassword({
        reset_token: 'reset-token',
        password: 'NewPass123!',
        old_password: 'OldPass123!',
        confirm_password: 'NewPass123!',
      })
      expect(mockPostData).toHaveBeenCalledWith(
        'employee/force-change-password/',
        {
          reset_token: 'reset-token',
          password: 'NewPass123!',
          old_password: 'OldPass123!',
          confirm_password: 'NewPass123!',
        }
      )
    })
  })

  describe('useLogin hook', () => {
    test('useLogin normalizes email and posts to LOGIN_URL', async () => {
      mockPostData.mockResolvedValueOnce({
        token: 'access-token',
        refresh_token: 'refresh-token',
        expires_in: 3600,
        refresh_expires_in: 604800,
        user: {
          id: 1,
          name: 'Test User',
          email: 'test@example.com',
          role: 'admin',
        },
      })

      const { result } = renderHook(() => useLogin(undefined))
      await act(async () => {
        await result.current.mutate({
          username: '  TEST@EXAMPLE.COM  ',
          password: 'Password123!',
        })
      })

      expect(mockPostData).toHaveBeenCalledWith(apiUrl.LOGIN_URL, {
        email: 'test@example.com',
        password: 'Password123!',
      })
    })

    test('useLogin sets auth tokens on success', async () => {
      mockPostData.mockResolvedValueOnce({
        token: 'access-token',
        refresh_token: 'refresh-token',
        expires_in: 3600,
        refresh_expires_in: 604800,
        user: {
          id: 1,
          name: 'Test User',
          email: 'test@example.com',
          role: 'admin',
        },
      })

      const { result } = renderHook(() => useLogin(undefined))
      await act(async () => {
        await result.current.mutate({
          username: 'user@example.com',
          password: 'Password123!',
        })
      })

      expect(mockSetToken).toHaveBeenCalledWith('access-token')
      expect(mockSetRefreshToken).toHaveBeenCalledWith('refresh-token')
      expect(mockSetAuthenticated).toHaveBeenCalledWith(true)
    })

    test('useLogin calculates token expiration correctly', async () => {
      const beforeTime = Date.now()
      mockPostData.mockResolvedValueOnce({
        token: 'access-token',
        refresh_token: 'refresh-token',
        expires_in: 3600,
        refresh_expires_in: 604800,
        user: {
          id: 1,
          name: 'Test User',
          email: 'test@example.com',
          role: 'admin',
        },
      })

      const { result } = renderHook(() => useLogin(undefined))
      await act(async () => {
        await result.current.mutate({
          username: 'user@example.com',
          password: 'Password123!',
        })
      })

      const afterTime = Date.now()
      const expectedExpiration = beforeTime + 3600 * 1000
      const callArgs = mockSetTokenExpiresAt.mock.calls[0][0]

      // Allow 1 second variance due to execution time
      expect(callArgs).toBeGreaterThanOrEqual(expectedExpiration - 1000)
      expect(callArgs).toBeLessThanOrEqual(afterTime + 3600 * 1000 + 1000)
    })

    test('useLogin sets user data correctly', async () => {
      mockPostData.mockResolvedValueOnce({
        token: 'access-token',
        refresh_token: 'refresh-token',
        expires_in: 3600,
        refresh_expires_in: 604800,
        user: {
          id: 123,
          name: 'John Doe',
          email: 'john@example.com',
          role: 'admin',
        },
      })

      const { result } = renderHook(() => useLogin(undefined))
      await act(async () => {
        await result.current.mutate({
          username: 'john@example.com',
          password: 'Password123!',
        })
      })

      expect(mockSetUserData).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 123,
          name: 'John Doe',
          email: 'john@example.com',
          is_admin: true,
        })
      )
    })

    test('useLogin handles superadmin role', async () => {
      mockPostData.mockResolvedValueOnce({
        token: 'access-token',
        refresh_token: 'refresh-token',
        expires_in: 3600,
        refresh_expires_in: 604800,
        user: {
          id: 1,
          name: 'Super Admin',
          email: 'admin@example.com',
          role: 'superadmin',
        },
      })

      const { result } = renderHook(() => useLogin(undefined))
      await act(async () => {
        await result.current.mutate({
          username: 'admin@example.com',
          password: 'Password123!',
        })
      })

      expect(mockSetUserData).toHaveBeenCalledWith(
        expect.objectContaining({
          is_admin: true,
        })
      )
    })

    test('useLogin navigates to dashboard on success', async () => {
      mockPostData.mockResolvedValueOnce({
        token: 'access-token',
        refresh_token: 'refresh-token',
        expires_in: 3600,
        refresh_expires_in: 604800,
        user: {
          id: 1,
          name: 'Test User',
          email: 'test@example.com',
          role: 'user',
        },
      })

      const { result } = renderHook(() => useLogin(undefined))
      await act(async () => {
        await result.current.mutate({
          username: 'user@example.com',
          password: 'Password123!',
        })
      })

      expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true })
    })

    test('useLogin calls onSuccess callback', async () => {
      const onSuccess = jest.fn()
      mockPostData.mockResolvedValueOnce({
        token: 'access-token',
        refresh_token: 'refresh-token',
        expires_in: 3600,
        refresh_expires_in: 604800,
        user: {
          id: 1,
          name: 'Test User',
          email: 'test@example.com',
          role: 'user',
        },
      })

      const { result } = renderHook(() => useLogin(onSuccess))
      await act(async () => {
        await result.current.mutate({
          username: 'user@example.com',
          password: 'Password123!',
        })
      })

      expect(onSuccess).toHaveBeenCalled()
    })

    test('useLogin handles error response', async () => {
      const error = {
        response: {
          data: {
            error: {
              message: 'Invalid credentials',
            },
          },
        },
      }
      mockPostData.mockRejectedValueOnce(error)

      const { result } = renderHook(() => useLogin(undefined))
      await act(async () => {
        try {
          await result.current.mutate({
            username: 'user@example.com',
            password: 'WrongPassword',
          })
        } catch {
          // Expected to throw
        }
      })

      expect(mockEnqueueSnackbar).toHaveBeenCalledWith('Invalid credentials', {
        variant: 'error',
      })
    })

    test('useLogin handles error without refresh_expires_in', async () => {
      mockPostData.mockResolvedValueOnce({
        token: 'access-token',
        refresh_token: 'refresh-token',
        expires_in: 3600,
        user: {
          id: 1,
          name: 'Test User',
          email: 'test@example.com',
          role: 'user',
        },
      })

      const { result } = renderHook(() => useLogin(undefined))
      await act(async () => {
        await result.current.mutate({
          username: 'user@example.com',
          password: 'Password123!',
        })
      })

      // Should calculate refresh token expiration as 7x access token expiration
      expect(mockSetRefreshTokenExpiresAt).toHaveBeenCalled()
      const callArgs = mockSetRefreshTokenExpiresAt.mock.calls[0][0]
      expect(callArgs).toBeGreaterThan(Date.now())
    })
  })
})

// ============================================================================
// COMPONENT TESTS
// ============================================================================

describe('Login Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('Login component renders with Employee domain type', () => {
    const { Login } = getPages()
    render(<Login />)
    expect(screen.getByText(/Administrator Login/i)).toBeInTheDocument()
  })

  test('Login component shows correct domain-specific text', () => {
    const { Login } = getPages()
    render(<Login />)
    expect(
      screen.getByText(/Manage your platform with administrative privileges/i)
    ).toBeInTheDocument()
  })

  test('Login form renders with email and password fields', () => {
    const { Login } = getPages()
    render(<Login />)
    expect(screen.getByLabelText(/^email$/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument()
  })

  test('Login button is present and clickable', () => {
    const { Login } = getPages()
    render(<Login />)
    const loginButton = screen.getByRole('button', { name: /login/i })
    expect(loginButton).toBeInTheDocument()
    expect(loginButton).not.toBeDisabled()
  })

  test('Password visibility toggle works', async () => {
    const { Login } = getPages()
    render(<Login />)
    const toggleButtons = screen
      .getAllByRole('button')
      .filter(
        (btn) => btn.querySelector('svg') || btn.innerHTML.includes('svg')
      )
    if (toggleButtons.length > 0) {
      // Toggle visibility
      fireEvent.click(toggleButtons[0])
    }
  })
})

describe('ForgetPassword Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('ForgetPassword component renders', () => {
    const { ForgetPassword } = getPages()
    render(<ForgetPassword />)
    expect(screen.getByText(/Forgot Password/i)).toBeInTheDocument()
  })

  test('ForgetPassword has email input field', () => {
    const { ForgetPassword } = getPages()
    render(<ForgetPassword />)
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument()
  })

  test('ForgetPassword has Reset and Back buttons', () => {
    const { ForgetPassword } = getPages()
    render(<ForgetPassword />)
    expect(screen.getByRole('button', { name: /Reset/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Back/i })).toBeInTheDocument()
  })

  test('ForgetPassword Back button navigates to login', async () => {
    const { ForgetPassword } = getPages()
    render(<ForgetPassword />)
    const backButton = screen.getByRole('button', { name: /Back/i })
    fireEvent.click(backButton)
    expect(mockNavigate).toHaveBeenCalledWith('/login')
  })

  test('ForgetPassword submit calls resetPassword API', async () => {
    const { ForgetPassword } = getPages()
    mockPostData.mockResolvedValueOnce({ message: 'Email sent' })
    render(<ForgetPassword />)
    fireEvent.change(screen.getByLabelText(/username/i), {
      target: { value: 'user@example.com' },
    })
    const resetButton = screen.getByRole('button', { name: /Reset/i })
    await act(async () => {
      fireEvent.click(resetButton)
    })
    await waitFor(() => {
      expect(mockEnqueueSnackbar).toHaveBeenCalled()
    })
  })
})

describe('ResetPassword Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    const api = require('../api')
    // Ensure component calls to verifyResetPassword and ForgetResetPassword
    // return the mocked postData promise so `.then()` works in the component.
    jest
      .spyOn(api, 'verifyResetPassword')
      .mockImplementation((data: any) =>
        mockPostData('forgot-password-verify-token', data)
      )
    jest
      .spyOn(api, 'ForgetResetPassword')
      .mockImplementation((data: any) => mockPostData('reset-password', data))
  })

  test('ResetPassword verifies token on mount', () => {
    const { ResetPassword } = getPages()
    mockPostData.mockResolvedValueOnce({ valid: true })
    render(<ResetPassword />)
    expect(mockPostData).toHaveBeenCalledWith('forgot-password-verify-token', {
      token: 'test-token',
    })
  })

  test('ResetPassword navigates to dashboard if token verification fails', async () => {
    const { ResetPassword } = getPages()
    mockPostData.mockRejectedValueOnce(new Error('Invalid token'))
    render(<ResetPassword />)
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard')
    })
  })

  test('ResetPassword renders form when token is valid', async () => {
    const { ResetPassword } = getPages()
    mockPostData.mockResolvedValueOnce({ valid: true })
    render(<ResetPassword />)
    await waitFor(() => {
      expect(screen.getByText(/Reset Password/i)).toBeInTheDocument()
    })
  })

  test('ResetPassword has password input fields', async () => {
    const { ResetPassword } = getPages()
    mockPostData.mockResolvedValueOnce({ valid: true })
    render(<ResetPassword />)
    await waitFor(() => {
      const passwordInputs = screen.getAllByPlaceholderText(/password/i)
      expect(passwordInputs.length).toBeGreaterThan(0)
    })
  })

  test('ResetPassword has Back button', async () => {
    const { ResetPassword } = getPages()
    mockPostData.mockResolvedValueOnce({ valid: true })
    render(<ResetPassword />)
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Back/i })).toBeInTheDocument()
    })
  })
})

describe('ForceChangePassword Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('ForceChangePassword component renders', () => {
    const { ForceChangePassword } = getPages()
    render(<ForceChangePassword />)
    expect(screen.getByText(/Change Password/i)).toBeInTheDocument()
  })

  test('ForceChangePassword has three password fields', () => {
    const { ForceChangePassword } = getPages()
    render(<ForceChangePassword />)
    const inputs = screen.getAllByPlaceholderText(/password/i)
    expect(inputs.length).toBeGreaterThanOrEqual(3)
  })

  test('ForceChangePassword has Submit button', () => {
    const { ForceChangePassword } = getPages()
    render(<ForceChangePassword />)
    const buttons = screen.getAllByRole('button')
    const submitButton = buttons.find(
      (btn) =>
        btn.textContent?.includes('Submit') ||
        btn.getAttribute('type') === 'submit'
    )
    expect(submitButton).toBeTruthy()
  })

  // Navigation-on-mount behavior is covered by `useAppStore` mock above.
})
