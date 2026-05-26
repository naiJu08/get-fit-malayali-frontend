import React from 'react'
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react'

const mockNavigate = jest.fn()
const mockEnqueueSnackbar = jest.fn()
const mockPostData = jest.fn()

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

jest.mock('../../../components/common/snackbar', () => ({
  useSnackbarManager: () => ({ enqueueSnackbar: mockEnqueueSnackbar }),
}))

jest.mock('../../../apis/api.helpers', () => ({
  postData: (...args: any[]) => mockPostData(...args),
}))

import ForgetPassword from '../forgetPassword'

describe('ForgetPassword Component (unit)', () => {
  beforeEach(() => jest.clearAllMocks())

  test('renders heading and input', () => {
    render(<ForgetPassword />)
    expect(screen.getByText(/Forgot Password/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument()
  })

  test('has Reset and Back buttons and Back navigates', () => {
    render(<ForgetPassword />)
    expect(screen.getByRole('button', { name: /Reset/i })).toBeInTheDocument()
    const back = screen.getByRole('button', { name: /Back to login/i })
    expect(back).toBeInTheDocument()
    fireEvent.click(back)
    expect(mockNavigate).toHaveBeenCalledWith('/login')
  })

  test('submit calls resetPassword and shows snackbar', async () => {
    mockPostData.mockResolvedValueOnce({ message: 'Email sent' })
    render(<ForgetPassword />)
    fireEvent.change(screen.getByLabelText(/username/i), {
      target: { value: 'user@example.com' },
    })
    const resetBtn = screen.getByRole('button', { name: /Reset/i })
    await act(async () => {
      fireEvent.click(resetBtn)
    })
    await waitFor(() => expect(mockEnqueueSnackbar).toHaveBeenCalled())
  })
})
