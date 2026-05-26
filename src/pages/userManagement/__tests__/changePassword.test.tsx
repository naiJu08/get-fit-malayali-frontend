// import React from 'react'
// import { render, screen, waitFor, fireEvent, act } from '@testing-library/react'

// const mockNavigate = jest.fn()
// const mockEnqueueSnackbar = jest.fn()
// const mockForgetResetPassword = jest.fn()

// jest.mock('react-router-dom', () => ({
//   useNavigate: () => mockNavigate,
// }))

// jest.mock('../../../components/common/snackbar', () => ({
//   useSnackbarManager: () => ({ enqueueSnackbar: mockEnqueueSnackbar }),
// }))

// jest.mock('../api', () => ({
//   __esModule: true,
//   ForgetResetPassword: (...args: any[]) => mockForgetResetPassword(...args),
// }))

// import ForceChangePassword from '../changePassword'

// describe('ForceChangePassword Component (unit)', () => {
//   beforeEach(() => {
//     jest.clearAllMocks()
//     mockForgetResetPassword.mockResolvedValue({ message: 'Password changed successfully' })
//   })

//   test('renders heading and three password fields', async () => {
//     await act(async () => {
//       render(<ForceChangePassword />)
//     })
//     expect(screen.getByText(/Change Password/i)).toBeInTheDocument()
//     const inputs = screen.getAllByPlaceholderText(/password/i)
//     expect(inputs.length).toBe(3)
//   })

//   test('has submit button', async () => {
//     await act(async () => {
//       render(<ForceChangePassword />)
//     })
//     const submitButton = screen.getByRole('button', { name: /Submit/i })
//     expect(submitButton).toBeInTheDocument()
//   })

//   test('shows validation errors for empty passwords', async () => {
//     await act(async () => {
//       render(<ForceChangePassword />)
//     })
    
//     const submitButton = screen.getByRole('button', { name: /Submit/i })
    
//     await act(async () => {
//       fireEvent.click(submitButton)
//     })
    
//     await waitFor(() => {
//       const errorMessages = screen.getAllByText(/required/i)
//       expect(errorMessages.length).toBeGreaterThan(0)
//     })
//   })

//   test('shows validation error when passwords do not match', async () => {
//     await act(async () => {
//       render(<ForceChangePassword />)
//     })
    
//     const passwordInputs = screen.getAllByPlaceholderText(/password/i)
//     const newPasswordInput = passwordInputs[1]
//     const confirmPasswordInput = passwordInputs[2]
    
//     await act(async () => {
//       fireEvent.change(newPasswordInput, { target: { value: 'Password123!' } })
//       fireEvent.change(confirmPasswordInput, { target: { value: 'DifferentPassword123!' } })
//     })
    
//     const submitButton = screen.getByRole('button', { name: /Submit/i })
    
//     await act(async () => {
//       fireEvent.click(submitButton)
//     })
    
//     await waitFor(() => {
//       expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument()
//     })
//   })

//   test('successfully submits form with valid passwords', async () => {
//     await act(async () => {
//       render(<ForceChangePassword />)
//     })
    
//     const passwordInputs = screen.getAllByPlaceholderText(/password/i)
//     const currentPasswordInput = passwordInputs[0]
//     const newPasswordInput = passwordInputs[1]
//     const confirmPasswordInput = passwordInputs[2]
    
//     await act(async () => {
//       fireEvent.change(currentPasswordInput, { target: { value: 'CurrentPass123!' } })
//       fireEvent.change(newPasswordInput, { target: { value: 'NewStrongPass123!' } })
//       fireEvent.change(confirmPasswordInput, { target: { value: 'NewStrongPass123!' } })
//     })
    
//     const submitButton = screen.getByRole('button', { name: /Submit/i })
    
//     await act(async () => {
//       fireEvent.click(submitButton)
//     })
    
//     await waitFor(() => {
//       expect(mockForgetResetPassword).toHaveBeenCalledWith({
//         current_password: 'CurrentPass123!',
//         new_password: 'NewStrongPass123!',
//         confirm_password: 'NewStrongPass123!',
//       })
//       expect(mockEnqueueSnackbar).toHaveBeenCalledWith(
//         'Password changed successfully',
//         { variant: 'success' }
//       )
//       expect(mockNavigate).toHaveBeenCalledWith('/login')
//     })
//   })

//   test('handles API error on submission', async () => {
//     const errorMessage = 'Current password is incorrect'
//     mockForgetResetPassword.mockRejectedValueOnce({
//       response: { data: { message: errorMessage } }
//     })
    
//     await act(async () => {
//       render(<ForceChangePassword />)
//     })
    
//     const passwordInputs = screen.getAllByPlaceholderText(/password/i)
//     const currentPasswordInput = passwordInputs[0]
//     const newPasswordInput = passwordInputs[1]
//     const confirmPasswordInput = passwordInputs[2]
    
//     await act(async () => {
//       fireEvent.change(currentPasswordInput, { target: { value: 'WrongPass123!' } })
//       fireEvent.change(newPasswordInput, { target: { value: 'NewStrongPass123!' } })
//       fireEvent.change(confirmPasswordInput, { target: { value: 'NewStrongPass123!' } })
//     })
    
//     const submitButton = screen.getByRole('button', { name: /Submit/i })
    
//     await act(async () => {
//       fireEvent.click(submitButton)
//     })
    
//     await waitFor(() => {
//       expect(mockEnqueueSnackbar).toHaveBeenCalledWith(
//         errorMessage,
//         { variant: 'error' }
//       )
//       expect(mockNavigate).not.toHaveBeenCalled()
//     })
//   })
// })

import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'

const mockNavigate = jest.fn()
const mockEnqueueSnackbar = jest.fn()
const mockForceChangePassword = jest.fn()

jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}))

jest.mock('../../../components/common/snackbar', () => ({
  useSnackbarManager: () => ({ enqueueSnackbar: mockEnqueueSnackbar }),
}))

jest.mock('../../../store/appStore', () => ({
  useAppStore: () => ({
    is_password_expired: true,
    reset_password_token: undefined,
  }),
}))

// Mock the API module with the correct function name
jest.mock('../api', () => ({
  __esModule: true,
  forceChangePassword: (...args: any[]) => mockForceChangePassword(...args),
}))

import ForceChangePassword from '../changePassword'

describe('ForceChangePassword Component (unit)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockForceChangePassword.mockResolvedValue({ message: 'Password changed successfully' })
  })

  test('renders heading and three password fields', () => {
    render(<ForceChangePassword />)
    expect(screen.getByText(/Change Password/i)).toBeInTheDocument()
    const inputs = screen.getAllByPlaceholderText(/password/i)
    expect(inputs.length).toBe(3)
  })

  test('has submit button', () => {
    render(<ForceChangePassword />)
    const submitButton = screen.getByRole('button', { name: /Submit/i })
    expect(submitButton).toBeInTheDocument()
  })

  test('successfully submits form with valid passwords', async () => {
    render(<ForceChangePassword />)
    
    const passwordInputs = screen.getAllByPlaceholderText(/password/i)
    const oldPasswordInput = passwordInputs[0]
    const newPasswordInput = passwordInputs[1]
    const confirmPasswordInput = passwordInputs[2]
    
    // Use a password that meets all requirements
    const validPassword = 'Test@123456'
    
    fireEvent.change(oldPasswordInput, { target: { value: 'CurrentPass123!' } })
    fireEvent.change(newPasswordInput, { target: { value: validPassword } })
    fireEvent.change(confirmPasswordInput, { target: { value: validPassword } })
    
    const submitButton = screen.getByRole('button', { name: /Submit/i })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(mockForceChangePassword).toHaveBeenCalledWith({
        old_password: 'CurrentPass123!',
        password: validPassword,
        confirm_password: validPassword,
        reset_token: undefined,
      })
    })
    
    await waitFor(() => {
      expect(mockEnqueueSnackbar).toHaveBeenCalledWith(
        'Password changed successfully',
        { variant: 'success' }
      )
      expect(mockNavigate).toHaveBeenCalledWith('/login')
    })
  })

  test('shows validation error when passwords do not match', async () => {
    render(<ForceChangePassword />)
    
    const passwordInputs = screen.getAllByPlaceholderText(/password/i)
    const oldPasswordInput = passwordInputs[0]
    const newPasswordInput = passwordInputs[1]
    const confirmPasswordInput = passwordInputs[2]
    
    fireEvent.change(oldPasswordInput, { target: { value: 'CurrentPass123!' } })
    fireEvent.change(newPasswordInput, { target: { value: 'Test@123456' } })
    fireEvent.change(confirmPasswordInput, { target: { value: 'DifferentPassword123!' } })
    
    const submitButton = screen.getByRole('button', { name: /Submit/i })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument()
    })
    expect(mockForceChangePassword).not.toHaveBeenCalled()
  })

  test('shows validation error for empty fields', async () => {
    render(<ForceChangePassword />)
    
    const submitButton = screen.getByRole('button', { name: /Submit/i })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      const errorMessages = screen.getAllByText(/Required/i)
      expect(errorMessages.length).toBeGreaterThan(0)
    })
    expect(mockForceChangePassword).not.toHaveBeenCalled()
  })

  test('handles API error response', async () => {
    const errorMessage = 'Current password is incorrect'
    mockForceChangePassword.mockRejectedValue({
      response: { data: { message: errorMessage } }
    })
    
    render(<ForceChangePassword />)
    
    const passwordInputs = screen.getAllByPlaceholderText(/password/i)
    const oldPasswordInput = passwordInputs[0]
    const newPasswordInput = passwordInputs[1]
    const confirmPasswordInput = passwordInputs[2]
    
    const validPassword = 'Test@123456'
    
    fireEvent.change(oldPasswordInput, { target: { value: 'WrongPass123!' } })
    fireEvent.change(newPasswordInput, { target: { value: validPassword } })
    fireEvent.change(confirmPasswordInput, { target: { value: validPassword } })
    
    const submitButton = screen.getByRole('button', { name: /Submit/i })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(mockForceChangePassword).toHaveBeenCalled()
    })
    
    // Wait a bit for the error to be processed
    await new Promise(resolve => setTimeout(resolve, 100))
    
    expect(mockEnqueueSnackbar).toHaveBeenCalledWith(
      errorMessage,
      { variant: 'error' }
    )
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  test('handles generic API error', async () => {
    mockForceChangePassword.mockRejectedValue({})
    
    render(<ForceChangePassword />)
    
    const passwordInputs = screen.getAllByPlaceholderText(/password/i)
    const oldPasswordInput = passwordInputs[0]
    const newPasswordInput = passwordInputs[1]
    const confirmPasswordInput = passwordInputs[2]
    
    const validPassword = 'Test@123456'
    
    fireEvent.change(oldPasswordInput, { target: { value: 'CurrentPass123!' } })
    fireEvent.change(newPasswordInput, { target: { value: validPassword } })
    fireEvent.change(confirmPasswordInput, { target: { value: validPassword } })
    
    const submitButton = screen.getByRole('button', { name: /Submit/i })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(mockForceChangePassword).toHaveBeenCalled()
    })
    
    // Wait a bit for the error to be processed
    await new Promise(resolve => setTimeout(resolve, 100))
    
    expect(mockEnqueueSnackbar).toHaveBeenCalledWith(
      'Failed to change password',
      { variant: 'error' }
    )
  })

  test('shows password strength validation error for weak password', async () => {
    render(<ForceChangePassword />)
    
    const passwordInputs = screen.getAllByPlaceholderText(/password/i)
    const oldPasswordInput = passwordInputs[0]
    const newPasswordInput = passwordInputs[1]
    const confirmPasswordInput = passwordInputs[2]
    
    // Fill old password and confirm password to avoid other validation errors
    fireEvent.change(oldPasswordInput, { target: { value: 'CurrentPass123!' } })
    fireEvent.change(confirmPasswordInput, { target: { value: 'weak' } })
    fireEvent.change(newPasswordInput, { target: { value: 'weak' } })
    
    const submitButton = screen.getByRole('button', { name: /Submit/i })
    fireEvent.click(submitButton)
    
    // Check for password strength error message
    await waitFor(() => {
      const errorElement = screen.getByText(/Password should contain at least one uppercase letter/i)
      expect(errorElement).toBeInTheDocument()
    })
    
    expect(mockForceChangePassword).not.toHaveBeenCalled()
  })

  test('toggles password visibility for old password field', async () => {
    render(<ForceChangePassword />)
    
    const toggleButtons = document.querySelectorAll('.cursor-pointer')
    const oldPasswordInput = screen.getAllByPlaceholderText(/password/i)[0]
    
    expect(oldPasswordInput).toHaveAttribute('type', 'password')
    
    if (toggleButtons.length > 0) {
      fireEvent.click(toggleButtons[0])
      
      await waitFor(() => {
        expect(oldPasswordInput).toHaveAttribute('type', 'text')
      })
      
      fireEvent.click(toggleButtons[0])
      
      await waitFor(() => {
        expect(oldPasswordInput).toHaveAttribute('type', 'password')
      })
    }
  })
})