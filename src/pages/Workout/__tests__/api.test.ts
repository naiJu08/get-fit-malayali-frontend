import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React, { ReactNode, act } from 'react'
import {
  useWorkoutList,
  deleteWorkout,
  getWorkoutDetails,
  useCreateWorkout,
  useUpdateWorkout,
  deActivateAdmin,
  deleteAdmin,
  freezeUser,
  unfreezeUser,
  getRoles,
  updatePassword,
  sendAdminInvitation,
  createWorkout,
  updateWorkout,
} from '../api'
import {
  getData,
  deleteData,
  postFormData,
  updateFromData,
  postData,
} from '../../../apis/api.helpers'

jest.mock('../../../apis/api.helpers')
jest.mock('../../../apis/api.url', () => ({
  __esModule: true,
  default: {
    WORKOUTS: '/workouts',
    ADMIN_USER: '/admin-users',
  },
}))

const mockEnqueueSnackbar = jest.fn()
jest.mock('../../../components/common/snackbar', () => ({
  useSnackbarManager: () => ({
    enqueueSnackbar: mockEnqueueSnackbar,
  }),
}))

jest.mock('../../../utilities/parsers', () => ({
  parseQueryParams: (params: Record<string, any> = {}) => {
    const entries = Object.entries(params).filter(
      ([, value]) => value !== '' && value !== undefined && value !== null
    )
    if (!entries.length) return ''
    return `?${entries
      .map(
        ([key, value]) =>
          `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`
      )
      .join('&')}`
  },
  getErrorMessage: (error: any): string => {
    if (!error) return 'An unexpected error occurred'
    if (typeof error === 'string') return error
    if (error?.message) return String(error.message)
    return String(error)
  },
}))

const originalConsoleError = console.error

beforeAll(() => {
  console.error = jest.fn((...args) => {
    const message = args[0]?.toString() || ''
    if (
      message.includes('Fetch failed') ||
      message.includes('Create failed') ||
      message.includes('Update failed') ||
      message.includes('Delete failed')
    ) {
      return
    }
    originalConsoleError(...args)
  })
})

afterAll(() => {
  console.error = originalConsoleError
})

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
    logger: {
      log: console.log,
      warn: console.warn,
      error: console.error,
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

describe('Workout API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('useWorkoutList', () => {
    it('should fetch workout list successfully', async () => {
      const mockData = {
        workouts: [{ id: '1', name: 'Test Workout' }],
        meta: { total: 1 },
      }
      ;(getData as jest.Mock).mockResolvedValue(mockData)

      const { result } = renderHook(
        () => useWorkoutList({ page: 1, per_page: 10 }),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toEqual(mockData)
      expect(getData).toHaveBeenCalledWith('/workouts?page=1&per_page=10')
    })

    it('should handle fetch error', async () => {
      ;(getData as jest.Mock).mockRejectedValue(new Error('Fetch failed'))

      const { result } = renderHook(
        () => useWorkoutList({ page: 1, per_page: 10 }),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })
    })
  })

  describe('workout helpers', () => {
    it('should fetch workout details successfully', async () => {
      const mockData = { workout: { id: '1', name: 'Test Workout' } }
      ;(getData as jest.Mock).mockResolvedValue(mockData)

      const result = await getWorkoutDetails('1')

      expect(getData).toHaveBeenCalledWith('/workouts/1')
      expect(result).toEqual(mockData)
    })

    it('should delete workout successfully', async () => {
      const mockData = { success: true }
      ;(deleteData as jest.Mock).mockResolvedValue(mockData)

      const result = await deleteWorkout('1')

      expect(deleteData).toHaveBeenCalledWith('/workouts/1')
      expect(result).toEqual(mockData)
    })

    it('should create workout successfully', async () => {
      const formData = new FormData()
      formData.append('name', 'New Workout')
      ;(postFormData as jest.Mock).mockResolvedValue({ id: '1' })

      const result = await createWorkout(formData)

      expect(postFormData).toHaveBeenCalledWith('/workouts', formData)
      expect(result).toEqual({ id: '1' })
    })

    it('should update workout successfully', async () => {
      const updateData = { name: 'Updated Workout' }
      ;(updateFromData as jest.Mock).mockResolvedValue({ id: '1' })

      const result = await updateWorkout({ id: '1', data: updateData })

      expect(updateFromData).toHaveBeenCalledWith('/workouts/1', updateData)
      expect(result).toEqual({ id: '1' })
    })
  })

  describe('useCreateWorkout', () => {
    it('should handle successful workout creation', async () => {
      const mockData = { id: '1', name: 'New Workout' }
      const mockHandleSubmission = jest.fn()
      ;(postFormData as jest.Mock).mockResolvedValue({ data: mockData })

      const { result } = renderHook(
        () => useCreateWorkout(mockHandleSubmission),
        { wrapper }
      )

      await act(async () => {
        await result.current.mutateAsync(new FormData())
      })

      expect(mockHandleSubmission).toHaveBeenCalledWith(mockData)
      expect(mockEnqueueSnackbar).toHaveBeenCalledWith(
        'Workout created successfully',
        { variant: 'success' }
      )
    })

    it('should show errors array message on creation error', async () => {
      const mockHandleSubmission = jest.fn()
      ;(postFormData as jest.Mock).mockRejectedValue({
        response: { data: { errors: ['Name is required'] } },
      })

      const { result } = renderHook(
        () => useCreateWorkout(mockHandleSubmission),
        { wrapper }
      )

      await act(async () => {
        await expect(result.current.mutateAsync(new FormData())).rejects.toEqual(
          {
            response: { data: { errors: ['Name is required'] } },
          }
        )
      })

      expect(mockEnqueueSnackbar).toHaveBeenCalledWith('Name is required', {
        variant: 'error',
      })
    })

    it('should show fallback creation error message', async () => {
      ;(postFormData as jest.Mock).mockRejectedValue({
        response: { data: {} },
      })

      const { result } = renderHook(() => useCreateWorkout(jest.fn()), {
        wrapper,
      })

      await act(async () => {
        await expect(result.current.mutateAsync(new FormData())).rejects.toEqual(
          {
            response: { data: {} },
          }
        )
      })

      expect(mockEnqueueSnackbar).toHaveBeenCalledWith(
        'Failed to create workout',
        { variant: 'error' }
      )
    })

    it('should show error field message on creation error', async () => {
      ;(postFormData as jest.Mock).mockRejectedValue({
        response: { data: { error: 'Name has already been taken' } },
      })

      const { result } = renderHook(() => useCreateWorkout(jest.fn()), {
        wrapper,
      })

      await act(async () => {
        await expect(result.current.mutateAsync(new FormData())).rejects.toEqual(
          {
            response: { data: { error: 'Name has already been taken' } },
          }
        )
      })

      expect(mockEnqueueSnackbar).toHaveBeenCalledWith(
        'Name has already been taken',
        { variant: 'error' }
      )
    })

    it('should show detail field message on creation error', async () => {
      ;(postFormData as jest.Mock).mockRejectedValue({
        response: { data: { detail: 'Video upload failed' } },
      })

      const { result } = renderHook(() => useCreateWorkout(jest.fn()), {
        wrapper,
      })

      await act(async () => {
        await expect(result.current.mutateAsync(new FormData())).rejects.toEqual(
          {
            response: { data: { detail: 'Video upload failed' } },
          }
        )
      })

      expect(mockEnqueueSnackbar).toHaveBeenCalledWith('Video upload failed', {
        variant: 'error',
      })
    })

    it('should show string response message on creation error', async () => {
      ;(postFormData as jest.Mock).mockRejectedValue({
        response: { data: 'Server unavailable' },
      })

      const { result } = renderHook(() => useCreateWorkout(jest.fn()), {
        wrapper,
      })

      await act(async () => {
        await expect(result.current.mutateAsync(new FormData())).rejects.toEqual(
          {
            response: { data: 'Server unavailable' },
          }
        )
      })

      expect(mockEnqueueSnackbar).toHaveBeenCalledWith('Server unavailable', {
        variant: 'error',
      })
    })
  })

  describe('useUpdateWorkout', () => {
    it('should handle successful workout update', async () => {
      const mockData = { id: '1', name: 'Updated Workout' }
      const mockHandleSubmission = jest.fn()
      ;(updateFromData as jest.Mock).mockResolvedValue({ data: mockData })

      const { result } = renderHook(
        () => useUpdateWorkout(mockHandleSubmission),
        { wrapper }
      )

      await act(async () => {
        await result.current.mutateAsync({ id: '1', data: { name: 'Updated' } })
      })

      expect(mockHandleSubmission).toHaveBeenCalledWith(mockData)
      expect(mockEnqueueSnackbar).toHaveBeenCalledWith(
        'Workout updated successfully',
        { variant: 'success' }
      )
    })

    it('should show update error detail message', async () => {
      ;(updateFromData as jest.Mock).mockRejectedValue({
        response: { data: { detail: 'Workout not found' } },
      })

      const { result } = renderHook(() => useUpdateWorkout(jest.fn()), {
        wrapper,
      })

      await act(async () => {
        await expect(
          result.current.mutateAsync({ id: '1', data: {} })
        ).rejects.toEqual({
          response: { data: { detail: 'Workout not found' } },
        })
      })

      expect(mockEnqueueSnackbar).toHaveBeenCalledWith('Workout not found', {
        variant: 'error',
      })
    })

    it('should show update error message fallback', async () => {
      ;(updateFromData as jest.Mock).mockRejectedValue({
        response: { data: { message: 'Update failed' } },
      })

      const { result } = renderHook(() => useUpdateWorkout(jest.fn()), {
        wrapper,
      })

      await act(async () => {
        await expect(
          result.current.mutateAsync({ id: '1', data: {} })
        ).rejects.toEqual({
          response: { data: { message: 'Update failed' } },
        })
      })

      expect(mockEnqueueSnackbar).toHaveBeenCalledWith('Update failed', {
        variant: 'error',
      })
    })
  })

  describe('admin helper functions', () => {
    it('should call deActivateAdmin endpoint', async () => {
      ;(updateFromData as jest.Mock).mockResolvedValue({ success: true })

      await deActivateAdmin('1')

      expect(updateFromData).toHaveBeenCalledWith('/admin-users/1/status', {})
    })

    it('should call deleteAdmin endpoint', async () => {
      ;(deleteData as jest.Mock).mockResolvedValue({ success: true })

      await deleteAdmin('1')

      expect(deleteData).toHaveBeenCalledWith('/admin-users/1')
    })

    it('should call freeze and unfreeze endpoints', async () => {
      const payload = {
        reason: 'Vacation',
        start_date: '2026-01-01',
        end_date: '2026-01-10',
      }
      ;(postData as jest.Mock).mockResolvedValue({ success: true })

      await freezeUser('1', payload)
      await unfreezeUser('1')

      expect(postData).toHaveBeenCalledWith('/admin-users/1/freeze', payload)
      expect(postData).toHaveBeenCalledWith('/admin-users/1/unfreeze', {})
    })

    it('should return empty roles response', async () => {
      await expect(getRoles()).resolves.toEqual({ items: [], total: 0 })
    })

    it('should call updatePassword and sendAdminInvitation endpoints', async () => {
      ;(updateFromData as jest.Mock).mockResolvedValue({ success: true })
      ;(postData as jest.Mock).mockResolvedValue({ success: true })

      await updatePassword('1', 'Password123!')
      await sendAdminInvitation('1')

      expect(updateFromData).toHaveBeenCalledWith(
        '/admin-users/1/change_password',
        'Password123!'
      )
      expect(postData).toHaveBeenCalledWith('/admin-users/1/invite', {})
    })
  })
})
