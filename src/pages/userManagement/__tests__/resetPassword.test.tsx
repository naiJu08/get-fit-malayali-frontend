// import React from 'react'
// import { render, screen, waitFor } from '@testing-library/react'

// const mockNavigate = jest.fn()
// const mockEnqueueSnackbar = jest.fn()
// const mockPostData = jest.fn()

// jest.mock('react-router-dom', () => ({
//   useNavigate: () => mockNavigate,
//   useParams: () => ({ token: 'test-token' }),
// }))

// jest.mock('../../../components/common/snackbar', () => ({
//   useSnackbarManager: () => ({ enqueueSnackbar: mockEnqueueSnackbar }),
// }))

// jest.mock('../../../apis/api.helpers', () => ({
//   postData: (...args: any[]) => mockPostData(...args),
// }))

// // Mock the `../api` module so `ResetPassword` gets Promise-returning functions
// jest.mock('../api', () => ({
//   __esModule: true,
//   verifyResetPassword: (data: any) =>
//     mockPostData('forgot-password-verify-token', data),
//   ForgetResetPassword: (data: any) => mockPostData('reset-password', data),
// }))

// import ResetPassword from '../resetPasswords'
// import * as api from '../api'

// describe('ResetPassword Component (unit)', () => {
//   beforeEach(() => {
//     jest.clearAllMocks()
//     jest
//       .spyOn(api, 'verifyResetPassword')
//       .mockImplementation((data: any) =>
//         mockPostData('forgot-password-verify-token', data)
//       )
//     jest
//       .spyOn(api, 'ForgetResetPassword')
//       .mockImplementation((data: any) => mockPostData('reset-password', data))
//   })

//   test('verifies token on mount', () => {
//     mockPostData.mockResolvedValueOnce({ valid: true })
//     render(<ResetPassword />)
//     expect(mockPostData).toHaveBeenCalledWith('forgot-password-verify-token', {
//       token: 'test-token',
//     })
//   })

//   test('renders form when token valid', async () => {
//     mockPostData.mockResolvedValueOnce({ valid: true })
//     render(<ResetPassword />)
//     await waitFor(() =>
//       expect(screen.getByText(/Reset Password/i)).toBeInTheDocument()
//     )
//   })

//   test('has password inputs and Back button', async () => {
//     mockPostData.mockResolvedValueOnce({ valid: true })
//     render(<ResetPassword />)
//     await waitFor(() => {
//       const pwInputs = screen.getAllByPlaceholderText(/password/i)
//       expect(pwInputs.length).toBeGreaterThan(0)
//       expect(
//         screen.getByRole('button', { name: /Back to login/i })
//       ).toBeInTheDocument()
//     })
//   })
// })


import React from 'react'
import { render, screen, waitFor, act } from '@testing-library/react'

const mockNavigate = jest.fn()
const mockEnqueueSnackbar = jest.fn()
const mockVerifyResetPassword = jest.fn()
const mockForgetResetPassword = jest.fn()

jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useParams: () => ({ token: 'test-token' }),
}))

jest.mock('../../../components/common/snackbar', () => ({
  useSnackbarManager: () => ({ enqueueSnackbar: mockEnqueueSnackbar }),
}))

jest.mock('../api', () => ({
  __esModule: true,
  verifyResetPassword: (...args: any[]) => mockVerifyResetPassword(...args),
  ForgetResetPassword: (...args: any[]) => mockForgetResetPassword(...args),
}))

import ResetPassword from '../resetPasswords'

describe('ResetPassword Component (unit)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockVerifyResetPassword.mockResolvedValue({ valid: true })
    mockForgetResetPassword.mockResolvedValue({ message: 'Password reset successful' })
  })

  test('verifies token on mount', async () => {
    await act(async () => {
      render(<ResetPassword />)
    })
    expect(mockVerifyResetPassword).toHaveBeenCalledWith({
      token: 'test-token',
    })
  })

  test('renders form when token valid', async () => {
    await act(async () => {
      render(<ResetPassword />)
    })
    await waitFor(() =>
      expect(screen.getByText(/Reset Password/i)).toBeInTheDocument()
    )
  })

  test('has password inputs and Back button', async () => {
    await act(async () => {
      render(<ResetPassword />)
    })
    await waitFor(() => {
      const pwInputs = screen.getAllByPlaceholderText(/password/i)
      expect(pwInputs.length).toBeGreaterThan(0)
      expect(
        screen.getByRole('button', { name: /Back to login/i })
      ).toBeInTheDocument()
    })
  })

  test('handles invalid token', async () => {
    mockVerifyResetPassword.mockRejectedValueOnce({ response: { data: { message: 'Invalid token' } } })
    
    await act(async () => {
      render(<ResetPassword />)
    })
    
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard')
    })
  })
})