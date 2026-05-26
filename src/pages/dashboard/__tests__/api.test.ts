import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React, { ReactNode, act } from 'react'

import {
  useAdminDashboard,
  useNutritionistDashboard,
  useUserProfile,
  useDeleteAccount,
} from '../api'

import { getData, deleteData } from '../../../apis/api.helpers'
import { useAuthStore } from '../../../store/authStore'

jest.mock('../../../apis/api.helpers')
jest.mock('../../../store/authStore')

const mockEnqueueSnackbar = jest.fn()
jest.mock('../../../components/common/snackbar', () => ({
  useSnackbarManager: () => ({
    enqueueSnackbar: mockEnqueueSnackbar,
  }),
}))

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

const wrapper: React.FC<{ children: ReactNode }> = ({ children }) => {
  const queryClient = createTestQueryClient()
  return React.createElement(
    QueryClientProvider,
    { client: queryClient },
    children
  )
}

describe('Dashboard API Hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('useAdminDashboard', () => {
    it('is enabled when user role is not "user" and not "nutritionist"', async () => {
      const mockUseAuthStore = useAuthStore as unknown as jest.Mock
      mockUseAuthStore.mockReturnValue({
        roleData: { name: 'admin' },
      })

      const mockGetData = getData as jest.MockedFunction<typeof getData>
      mockGetData.mockResolvedValue({ clients: { total: 10 } })

      const { result } = renderHook(() => useAdminDashboard(), { wrapper })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(mockGetData).toHaveBeenCalledWith('admin/dashboard')
    })

    it('is disabled when user role is "user"', async () => {
      const mockUseAuthStore = useAuthStore as unknown as jest.Mock
      mockUseAuthStore.mockReturnValue({
        roleData: { name: 'user' },
      })

      const { result } = renderHook(() => useAdminDashboard(), { wrapper })

      expect(getData).not.toHaveBeenCalled()
    })

    it('is disabled when user role is "nutritionist"', async () => {
      const mockUseAuthStore = useAuthStore as unknown as jest.Mock
      mockUseAuthStore.mockReturnValue({
        roleData: { name: 'nutritionist' },
      })

      const { result } = renderHook(() => useAdminDashboard(), { wrapper })

      expect(getData).not.toHaveBeenCalled()
    })
  })

  describe('useNutritionistDashboard', () => {
    it('is enabled when user role is "nutritionist"', async () => {
      const mockUseAuthStore = useAuthStore as unknown as jest.Mock
      mockUseAuthStore.mockReturnValue({
        roleData: { name: 'nutritionist' },
      })

      const mockGetData = getData as jest.MockedFunction<typeof getData>
      mockGetData.mockResolvedValue({ nutritionist: { name: 'Dr. John' } })

      const { result } = renderHook(() => useNutritionistDashboard(), { wrapper })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(mockGetData).toHaveBeenCalledWith('/nutritionist/dashboard')
    })

    it('is disabled when user role is not "nutritionist"', async () => {
      const mockUseAuthStore = useAuthStore as unknown as jest.Mock
      mockUseAuthStore.mockReturnValue({
        roleData: { name: 'admin' },
      })

      const { result } = renderHook(() => useNutritionistDashboard(), { wrapper })

      expect(getData).not.toHaveBeenCalled()
    })
  })

  describe('useUserProfile', () => {
    it('is enabled when user role is "user"', async () => {
      const mockUseAuthStore = useAuthStore as unknown as jest.Mock
      mockUseAuthStore.mockReturnValue({
        roleData: { name: 'user' },
      })

      const mockGetData = getData as jest.MockedFunction<typeof getData>
      mockGetData.mockResolvedValue({ user: { name: 'Jane Doe' } })

      const { result } = renderHook(() => useUserProfile(), { wrapper })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(mockGetData).toHaveBeenCalledWith('/auth/me')
    })

    it('is disabled when user role is not "user"', async () => {
      const mockUseAuthStore = useAuthStore as unknown as jest.Mock
      mockUseAuthStore.mockReturnValue({
        roleData: { name: 'nutritionist' },
      })

      const { result } = renderHook(() => useUserProfile(), { wrapper })

      expect(getData).not.toHaveBeenCalled()
    })
  })

  describe('useDeleteAccount', () => {
    it('calls deleteData and on success triggers snackbar, auth cleanup, and query invalidation', async () => {
      const mockClearAuthenticated = jest.fn()
      const mockUseAuthStore = useAuthStore as unknown as jest.Mock
      mockUseAuthStore.mockReturnValue({
        clearAuthenticated: mockClearAuthenticated,
      })

      const mockDeleteData = deleteData as jest.MockedFunction<typeof deleteData>
      mockDeleteData.mockResolvedValue({ message: 'Success delete' })

      const { result } = renderHook(() => useDeleteAccount(), { wrapper })

      await act(async () => {
        await result.current.mutateAsync()
      })

      await waitFor(() => {
        expect(mockEnqueueSnackbar).toHaveBeenCalledWith('Success delete', {
          variant: 'success',
        })
        expect(mockClearAuthenticated).toHaveBeenCalled()
      })
    })

    it('calls deleteData and on error triggers error snackbar', async () => {
      const mockClearAuthenticated = jest.fn()
      const mockUseAuthStore = useAuthStore as unknown as jest.Mock
      mockUseAuthStore.mockReturnValue({
        clearAuthenticated: mockClearAuthenticated,
      })

      const mockDeleteData = deleteData as jest.MockedFunction<typeof deleteData>
      mockDeleteData.mockRejectedValue({
        response: {
          data: {
            errors: ['Failed to delete because of constraint'],
          },
        },
      })

      const { result } = renderHook(() => useDeleteAccount(), { wrapper })

      await act(async () => {
        try {
          await result.current.mutateAsync()
        } catch {
          // ignore
        }
      })

      await waitFor(() => {
        expect(mockEnqueueSnackbar).toHaveBeenCalledWith(
          'Failed to delete because of constraint',
          { variant: 'error' }
        )
      })
    })
  })
})
