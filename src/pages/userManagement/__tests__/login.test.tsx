import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'

const mockNavigate = jest.fn()
const mockEnqueueSnackbar = jest.fn()

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

jest.mock('../../../store/domainManageStore', () => ({
  domainTypes: {
    EMPLOYEE: 'Employee',
    ASSESSOR: 'Assessor',
    ORGANISATION: 'Organisation',
    NUTRITIONIST: 'Nutritionist',
  },
  useDomainManageStore: Object.assign(() => ({ domainType: 'Employee' }), {
    getState: () => ({ domainType: 'Employee' }),
  }),
}))

// Mock react-query so components using `useLogin` don't require a QueryClientProvider
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

import Login from '../login'

describe('Login Component (unit)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('renders login headings', () => {
    render(<Login />)
    expect(screen.getByText(/Administrator Login/i)).toBeInTheDocument()
  })

  test('renders email and password inputs', () => {
    render(<Login />)
    expect(screen.getByLabelText(/^email$/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument()
  })

  test('login button present and clickable', () => {
    render(<Login />)
    const btn = screen.getByRole('button', { name: /login/i })
    expect(btn).toBeInTheDocument()
    fireEvent.click(btn)
  })
})
