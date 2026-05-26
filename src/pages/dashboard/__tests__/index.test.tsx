import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import DashboardPage from '../index'
import { useAuthStore } from '../../../store/authStore'
import {
  useAdminDashboard,
  useNutritionistDashboard,
  useUserProfile,
  useDeleteAccount,
} from '../api'

jest.mock('../../../store/authStore')
jest.mock('../api', () => ({
  useAdminDashboard: jest.fn(),
  useNutritionistDashboard: jest.fn(),
  useUserProfile: jest.fn(),
  useDeleteAccount: jest.fn(),
}))

const mockNavigate = jest.fn()
jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}))

// Mock Subviews so we can assert on them or mock their internals
jest.mock('../dashboard', () => {
  return function MockDashboardView({ data, loading, error, onRetry }: any) {
    if (loading) return <div data-testid="admin-loading">Admin Loading</div>
    if (error) return <button onClick={onRetry}>Admin Retry</button>
    return <div data-testid="admin-view">Admin Dashboard View - {data?.clients?.total}</div>
  }
})

jest.mock('../nutritionist-dashboard', () => {
  return function MockNutritionistDashboardView({ data, loading, error, onRetry }: any) {
    if (loading) return <div data-testid="nutritionist-loading">Nutritionist Loading</div>
    if (error) return <button onClick={onRetry}>Nutritionist Retry</button>
    return <div data-testid="nutritionist-view">Nutritionist Dashboard View - {data?.nutritionist?.name}</div>
  }
})

describe('DashboardPage Integration Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('renders general DashboardView when role is admin', () => {
    (useAuthStore as unknown as jest.Mock).mockReturnValue({
      roleData: { name: 'admin' },
    });
    (useUserProfile as jest.Mock).mockReturnValue({ data: undefined, isLoading: false, isError: false });
    (useNutritionistDashboard as jest.Mock).mockReturnValue({ data: undefined, isLoading: false, isError: false });
    (useAdminDashboard as jest.Mock).mockReturnValue({
      data: { clients: { total: 100 } },
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    })

    render(<DashboardPage />)
    expect(screen.getByTestId('admin-view')).toBeInTheDocument()
    expect(screen.getByText('Admin Dashboard View - 100')).toBeInTheDocument()
  })

  it('renders general DashboardView error state and calls refetch on retry', () => {
    (useAuthStore as unknown as jest.Mock).mockReturnValue({
      roleData: { name: 'admin' },
    });
    (useUserProfile as jest.Mock).mockReturnValue({ data: undefined, isLoading: false, isError: false });
    (useNutritionistDashboard as jest.Mock).mockReturnValue({ data: undefined, isLoading: false, isError: false });
    
    const mockRefetchAdmin = jest.fn();
    (useAdminDashboard as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch: mockRefetchAdmin,
    })

    render(<DashboardPage />)
    fireEvent.click(screen.getByText('Admin Retry'))
    expect(mockRefetchAdmin).toHaveBeenCalled()
  })

  it('renders NutritionistDashboardView when role is nutritionist', () => {
    (useAuthStore as unknown as jest.Mock).mockReturnValue({
      roleData: { name: 'nutritionist' },
    });
    (useUserProfile as jest.Mock).mockReturnValue({ data: undefined, isLoading: false, isError: false });
    (useAdminDashboard as jest.Mock).mockReturnValue({ data: undefined, isLoading: false, isError: false });
    (useNutritionistDashboard as jest.Mock).mockReturnValue({
      data: { nutritionist: { name: 'Dr. John' } },
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    })

    render(<DashboardPage />)
    expect(screen.getByTestId('nutritionist-view')).toBeInTheDocument()
    expect(screen.getByText('Nutritionist Dashboard View - Dr. John')).toBeInTheDocument()
  })

  it('renders NutritionistDashboardView error state and calls refetch on retry', () => {
    (useAuthStore as unknown as jest.Mock).mockReturnValue({
      roleData: { name: 'nutritionist' },
    });
    (useUserProfile as jest.Mock).mockReturnValue({ data: undefined, isLoading: false, isError: false });
    (useAdminDashboard as jest.Mock).mockReturnValue({ data: undefined, isLoading: false, isError: false });
    
    const mockRefetchNutritionist = jest.fn();
    (useNutritionistDashboard as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch: mockRefetchNutritionist,
    })

    render(<DashboardPage />)
    fireEvent.click(screen.getByText('Nutritionist Retry'))
    expect(mockRefetchNutritionist).toHaveBeenCalled()
  })

  describe('UserProfileView subcomponent logic when role is user', () => {
    const mockUserData = {
      user: {
        id: 12,
        name: 'Jane Doe',
        email: 'jane@test.com',
        phone: '9876543210',
        date_of_birth: '1995-10-15',
        gender: 'female',
        state: 'Kerala',
        height: 165,
        weight: 60,
        bmi: 22.0,
        lifestyle: 'Active',
        goal: 'Maintain Fitness',
        food_preferences: 'Vegetarian',
        medical_conditions: 'None',
        food_allergies: 'Peanuts',
        ethnicity: 'South Asian',
        status: 'active',
        created_at: '2025-01-01T00:00:00.000Z',
      },
    }

    const mockMutateAsync = jest.fn().mockResolvedValue({})
    beforeEach(() => {
      (useAuthStore as unknown as jest.Mock).mockReturnValue({
        roleData: { name: 'user' },
      });
      (useAdminDashboard as jest.Mock).mockReturnValue({ data: undefined, isLoading: false, isError: false });
      (useNutritionistDashboard as jest.Mock).mockReturnValue({ data: undefined, isLoading: false, isError: false });
      (useDeleteAccount as jest.Mock).mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: false,
      })
    })

    it('renders spin wheel if loading is true', () => {
      (useUserProfile as jest.Mock).mockReturnValue({
        data: undefined,
        isLoading: true,
        isError: false,
      })

      const { container } = render(<DashboardPage />)
      expect(container.querySelector('.animate-spin')).toBeInTheDocument()
    })

    it('renders error message and retries on click', () => {
      const mockRefetchUser = jest.fn();
      (useUserProfile as jest.Mock).mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true,
        refetch: mockRefetchUser,
      })

      render(<DashboardPage />)
      expect(screen.getByText('Error Loading Profile')).toBeInTheDocument()
      
      fireEvent.click(screen.getByRole('button', { name: /retry/i }))
      expect(mockRefetchUser).toHaveBeenCalled()
    })

    it('renders fallback if profile data is empty', () => {
      (useUserProfile as jest.Mock).mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: false,
      })

      render(<DashboardPage />)
      expect(screen.getByText('No Profile Data')).toBeInTheDocument()
    })

    it('renders user details when data is present', () => {
      (useUserProfile as jest.Mock).mockReturnValue({
        data: mockUserData,
        isLoading: false,
        isError: false,
      })

      render(<DashboardPage />)

      // Header
      expect(screen.getAllByText('Jane Doe').length).toBeGreaterThan(0)
      expect(screen.getByText('● Active')).toBeInTheDocument()

      // Quick Stats
      expect(screen.getByText('165')).toBeInTheDocument()
      expect(screen.getByText('60')).toBeInTheDocument()
      expect(screen.getAllByText('22').length).toBeGreaterThan(0)

      // Personal Information details
      expect(screen.getByText('jane@test.com')).toBeInTheDocument()
      expect(screen.getByText('9876543210')).toBeInTheDocument()
      expect(screen.getByText('15-10-1995')).toBeInTheDocument() // Formatted date of birth
      expect(screen.getByText('female')).toBeInTheDocument()
      expect(screen.getByText('Kerala')).toBeInTheDocument()

      // Health details
      expect(screen.getByText('Active')).toBeInTheDocument()
      expect(screen.getByText('Maintain Fitness')).toBeInTheDocument()

      // Preferences details
      expect(screen.getByText('Vegetarian')).toBeInTheDocument()
      expect(screen.getByText('Peanuts')).toBeInTheDocument()
      expect(screen.getByText('South Asian')).toBeInTheDocument()

      // Account details
      expect(screen.getByText('#12')).toBeInTheDocument()
    })

    it('handles alternative DOB string formats successfully', () => {
      const altDOBData = {
        user: {
          ...mockUserData.user,
          date_of_birth: 'invalid-dob', // Non-standard date of birth format
        },
      };
      (useUserProfile as jest.Mock).mockReturnValue({
        data: altDOBData,
        isLoading: false,
        isError: false,
      })

      render(<DashboardPage />)
      expect(screen.getByText('invalid-dob')).toBeInTheDocument()
    })

    it('opens delete confirmation modal, allows cancel', () => {
      (useUserProfile as jest.Mock).mockReturnValue({
        data: mockUserData,
        isLoading: false,
        isError: false,
      })

      render(<DashboardPage />)

      // Confirm modal is not visible initially
      expect(screen.queryByText('Delete Account?')).not.toBeInTheDocument()

      // Click delete account button
      fireEvent.click(screen.getByRole('button', { name: /Delete Account/i }))
      expect(screen.getByText('Delete Account?')).toBeInTheDocument()

      // Click cancel button
      fireEvent.click(screen.getByRole('button', { name: /Cancel/i }))
      expect(screen.queryByText('Delete Account?')).not.toBeInTheDocument()
    })

    it('triggers delete mutation and navigates after timeout on confirm', async () => {
      (useUserProfile as jest.Mock).mockReturnValue({
        data: mockUserData,
        isLoading: false,
        isError: false,
      })

      render(<DashboardPage />)

      fireEvent.click(screen.getByRole('button', { name: /Delete Account/i }))
      
      const confirmDeleteBtn = screen.getAllByRole('button', { name: /Delete Account/i })[1]
      
      await act(async () => {
        fireEvent.click(confirmDeleteBtn)
      })

      expect(mockMutateAsync).toHaveBeenCalled()

      // Fast-forward timeout delay
      act(() => {
        jest.advanceTimersByTime(1500)
      })

      expect(mockNavigate).toHaveBeenCalledWith('/login')
    })
  })
})
