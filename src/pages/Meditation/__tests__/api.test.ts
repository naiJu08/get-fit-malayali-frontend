import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React, { ReactNode, act } from 'react'
import {
  useMeditationList,
  deleteMeditation,
  getMeditationDetails,
  useCreateMeditation,
  useUpdateMeditation,
  useDeleteMeditation,
  deActivateAdmin,
  deleteAdmin,
  freezeUser,
  unfreezeUser,
  getRoles,
  updatePassword,
  sendAdminInvitation,
  createMeditation,
  updateMeditation,
} from '../api'
import {
  getData,
  deleteData,
  postFormData,
  updateFromData,
  postData,
} from '../../../apis/api.helpers'
import apiUrl from '../../../apis/api.url'

// Mock the API helpers
jest.mock('../../../apis/api.helpers')
jest.mock('../../../apis/api.url', () => ({
  __esModule: true,
  default: {
    MEDITATION: '/meditations',
    MEDITATION_DETAILS: '/meditations/:id',
    ADMIN_USER: '/admin-users',
  },
}))

// Mock snackbar manager
const mockEnqueueSnackbar = jest.fn()
jest.mock('../../../components/common/snackbar', () => ({
  useSnackbarManager: () => ({
    enqueueSnackbar: mockEnqueueSnackbar,
  }),
}))

// Mock parsers
jest.mock('../../../utilities/parsers', () => ({
  parseQueryParams: (params: Record<string, any> = {}) => {
    const entries = Object.entries(params).filter(
      ([, v]) => v !== '' && v !== undefined && v !== null
    )
    if (!entries.length) return ''
    const qs = entries
      .map(
        ([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`
      )
      .join('&')
    return `?${qs}`
  },
  getErrorMessage: (error: any): string => {
    if (!error) return 'An unexpected error occurred'
    if (typeof error === 'string') return error
    if (Array.isArray(error) && error.length > 0) {
      const first = error[0]
      if (first?.ctx?.error) {
        if (Array.isArray(first.ctx.error)) return first.ctx.error.join(', ')
        return String(first.ctx.error)
      }
      if (first?.msg) {
        if (Array.isArray(first.msg)) return first.msg.join(', ')
        return String(first.msg)
      }
      return String(first)
    }
    if (error?.message) return String(error.message)
    return String(error)
  },
  getSortedColumnName: jest.fn((col: string, dir: string) => `${col}_${dir}`),
}))

// Suppress console.error for expected errors in tests
const originalConsoleError = console.error
beforeAll(() => {
  console.error = jest.fn((...args) => {
    // Suppress specific expected error messages from TanStack Query
    const message = args[0]?.toString() || ''
    if (
      message.includes('API Error') ||
      message.includes('Network Error') ||
      message.includes('Meditation not found') ||
      message.includes('Failed to delete meditation') ||
      message.includes('Internal Server Error')
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
  })

// Helper to create proper AxiosResponse mock
const createAxiosResponse = <T = any>(data: T): any => ({
  data,
  status: 200,
  statusText: 'OK',
  headers: {},
  config: {} as any,
})

const wrapper: React.FC<{ children: ReactNode }> = ({ children }) => {
  const queryClient = createTestQueryClient()
  return React.createElement(
    QueryClientProvider,
    { client: queryClient },
    children
  )
}

// Mock data
const mockMeditationListResponse = {
  meditations: [
    { id: '1', title: 'Meditation 1', description: 'Description 1' },
    { id: '2', title: 'Meditation 2', description: 'Description 2' },
  ],
  meta: {
    total_count: 2,
    current_page: 1,
    total_pages: 1,
  },
}

const mockMeditationDetails = {
  id: '1',
  title: 'Meditation 1',
  description: 'Description 1',
  duration: 30,
  level: 'Beginner',
}

describe('Meditation API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('useMeditationList', () => {
    it('should fetch meditation list successfully', async () => {
      const mockGetData = getData as jest.MockedFunction<typeof getData>
      mockGetData.mockResolvedValue(mockMeditationListResponse)

      const searchParams = {
        page: 1,
        per_page: 10,
        search: '',
        ordering: '',
      }

      const { result } = renderHook(() => useMeditationList(searchParams), {
        wrapper,
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
        expect(result.current.data).toEqual(mockMeditationListResponse)
      })

      expect(mockGetData).toHaveBeenCalledWith(
        '/meditations?page=1&per_page=10'
      )
    })

    it('should handle API errors', async () => {
      const mockGetData = getData as jest.MockedFunction<typeof getData>
      const mockError = new Error('API Error')
      mockGetData.mockRejectedValue(mockError)

      const searchParams = {
        page: 1,
        per_page: 10,
        search: '',
        ordering: '',
      }

      const { result } = renderHook(() => useMeditationList(searchParams), {
        wrapper,
      })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
        expect(result.current.error).toEqual(mockError)
      })
    })

    it('should build correct URL with search parameters', async () => {
      const mockGetData = getData as jest.MockedFunction<typeof getData>
      mockGetData.mockResolvedValue(mockMeditationListResponse)

      const searchParams = {
        page: 2,
        per_page: 20,
        search: 'test meditation',
        ordering: '-title',
      }

      renderHook(() => useMeditationList(searchParams), { wrapper })

      await waitFor(() => {
        expect(mockGetData).toHaveBeenCalledWith(
          '/meditations?page=2&per_page=20&search=test%20meditation&ordering=-title'
        )
      })
    })

    it('should handle filters parameter', async () => {
      const mockGetData = getData as jest.MockedFunction<typeof getData>
      mockGetData.mockResolvedValue(mockMeditationListResponse)

      const searchParams = {
        page: 1,
        per_page: 10,
        search: '',
        ordering: '',
        filters: { level: 'Beginner', status: 'active' },
      }

      renderHook(() => useMeditationList(searchParams), { wrapper })

      await waitFor(() => {
        expect(mockGetData).toHaveBeenCalled()
        const callArg = mockGetData.mock.calls[0][0]
        expect(callArg).toContain('/meditations?')
      })
    })

    it('should handle empty search parameters', async () => {
      const mockGetData = getData as jest.MockedFunction<typeof getData>
      mockGetData.mockResolvedValue({
        meditations: [],
        meta: { total_count: 0, current_page: 1, total_pages: 0 },
      })

      const searchParams = {
        page: 1,
        per_page: 10,
        search: '',
        ordering: '',
      }

      const { result } = renderHook(() => useMeditationList(searchParams), {
        wrapper,
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
        expect(result.current.data?.meditations).toEqual([])
        expect(result.current.data?.meta.total_count).toBe(0)
      })
    })

    it('should handle undefined filters', async () => {
      const mockGetData = getData as jest.MockedFunction<typeof getData>
      mockGetData.mockResolvedValue(mockMeditationListResponse)

      const searchParams = {
        page: 1,
        per_page: 10,
        search: '',
        ordering: '',
        filters: undefined,
      }

      renderHook(() => useMeditationList(searchParams), { wrapper })

      await waitFor(() => {
        expect(mockGetData).toHaveBeenCalledWith(
          '/meditations?page=1&per_page=10'
        )
      })
    })
  })

  describe('getMeditationDetails', () => {
    it('should fetch meditation details successfully', async () => {
      const mockGetData = getData as jest.MockedFunction<typeof getData>
      mockGetData.mockResolvedValue({ meditation: mockMeditationDetails })

      const result = await getMeditationDetails('1')

      expect(result).toEqual({ meditation: mockMeditationDetails })
      expect(mockGetData).toHaveBeenCalledWith('/meditations/1')
    })

    it('should handle API errors when fetching details', async () => {
      const mockGetData = getData as jest.MockedFunction<typeof getData>
      const mockError = new Error('Meditation not found')
      mockGetData.mockRejectedValue(mockError)

      await expect(getMeditationDetails('999')).rejects.toThrow(
        'Meditation not found'
      )
      expect(mockGetData).toHaveBeenCalledWith('/meditations/999')
    })

    it('should handle different meditation ID formats', async () => {
      const mockGetData = getData as jest.MockedFunction<typeof getData>
      mockGetData.mockResolvedValue({ meditation: mockMeditationDetails })

      await getMeditationDetails('abc-123')
      expect(mockGetData).toHaveBeenCalledWith('/meditations/abc-123')

      mockGetData.mockClear()

      await getMeditationDetails('456')
      expect(mockGetData).toHaveBeenCalledWith('/meditations/456')
    })

    it('should handle empty ID', async () => {
      const mockGetData = getData as jest.MockedFunction<typeof getData>
      mockGetData.mockResolvedValue({ meditation: null })

      const result = await getMeditationDetails('')
      expect(result).toEqual({ meditation: null })
      expect(mockGetData).toHaveBeenCalledWith('/meditations/')
    })
  })

  describe('deleteMeditation', () => {
    it('should delete meditation successfully', async () => {
      const mockDeleteData = deleteData as jest.MockedFunction<
        typeof deleteData
      >
      mockDeleteData.mockResolvedValue({
        message: 'Meditation deleted successfully',
      })

      const result = await deleteMeditation('1')

      expect(result).toEqual({ message: 'Meditation deleted successfully' })
      expect(mockDeleteData).toHaveBeenCalledWith('/meditations/1')
    })

    it('should handle delete API errors with response data', async () => {
      const mockDeleteData = deleteData as jest.MockedFunction<
        typeof deleteData
      >
      const mockError = {
        response: {
          data: {
            message: 'Failed to delete meditation',
            errors: ['Meditation not found'],
          },
        },
      }
      mockDeleteData.mockRejectedValue(mockError)

      await expect(deleteMeditation('999')).rejects.toEqual(mockError)
      expect(mockDeleteData).toHaveBeenCalledWith('/meditations/999')
    })

    it('should handle delete API errors without response data', async () => {
      const mockDeleteData = deleteData as jest.MockedFunction<
        typeof deleteData
      >
      const mockError = new Error('Network Error')
      mockDeleteData.mockRejectedValue(mockError)

      await expect(deleteMeditation('1')).rejects.toEqual(mockError)
    })

    it('should handle different meditation ID formats for deletion', async () => {
      const mockDeleteData = deleteData as jest.MockedFunction<
        typeof deleteData
      >
      mockDeleteData.mockResolvedValue({})

      await deleteMeditation('abc-123')
      expect(mockDeleteData).toHaveBeenCalledWith('/meditations/abc-123')

      mockDeleteData.mockClear()

      await deleteMeditation('456')
      expect(mockDeleteData).toHaveBeenCalledWith('/meditations/456')
    })
  })

  describe('API Integration', () => {
    it('should use correct API endpoints', () => {
      expect(apiUrl.MEDITATION).toBe('/meditations')
      expect(apiUrl.MEDITATION_DETAILS).toBe('/meditations/:id')
    })

    it('should handle network errors gracefully', async () => {
      const mockGetData = getData as jest.MockedFunction<typeof getData>
      mockGetData.mockRejectedValue(new Error('Network Error'))

      const searchParams = {
        page: 1,
        per_page: 10,
        search: '',
        ordering: '',
      }

      const { result } = renderHook(() => useMeditationList(searchParams), {
        wrapper,
      })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
        expect(result.current.error?.message).toBe('Network Error')
      })
    })

    it('should handle server errors with proper error messages', async () => {
      const mockDeleteData = deleteData as jest.MockedFunction<
        typeof deleteData
      >
      const serverError = {
        response: {
          status: 500,
          data: {
            message: 'Internal Server Error',
            errors: ['Database connection failed'],
          },
        },
      }
      mockDeleteData.mockRejectedValue(serverError)

      try {
        await deleteMeditation('1')
        fail('Expected an error to be thrown')
      } catch (error) {
        expect(error).toEqual(serverError)
      }
    })
  })

  describe('Data Transformation', () => {
    it('should handle empty meditation list response', async () => {
      const mockGetData = getData as jest.MockedFunction<typeof getData>
      mockGetData.mockResolvedValue({
        meditations: [],
        meta: { total_count: 0, current_page: 1, total_pages: 0 },
      })

      const searchParams = {
        page: 1,
        per_page: 10,
        search: '',
        ordering: '',
      }

      const { result } = renderHook(() => useMeditationList(searchParams), {
        wrapper,
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
        expect(result.current.data?.meditations).toEqual([])
        expect(result.current.data?.meta.total_count).toBe(0)
      })
    })

    it('should handle meditation details response without meditation wrapper', async () => {
      const mockGetData = getData as jest.MockedFunction<typeof getData>
      mockGetData.mockResolvedValue(mockMeditationDetails)

      const result = await getMeditationDetails('1')

      expect(result).toEqual(mockMeditationDetails)
      expect(mockGetData).toHaveBeenCalledWith('/meditations/1')
    })

    it('should handle malformed API responses', async () => {
      const mockGetData = getData as jest.MockedFunction<typeof getData>
      mockGetData.mockResolvedValue({ invalid: 'response' })

      const searchParams = {
        page: 1,
        per_page: 10,
        search: '',
        ordering: '',
      }

      const { result } = renderHook(() => useMeditationList(searchParams), {
        wrapper,
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
        expect(result.current.data).toEqual({ invalid: 'response' })
      })
    })

    it('should handle null response data', async () => {
      const mockGetData = getData as jest.MockedFunction<typeof getData>
      mockGetData.mockResolvedValue(null)

      const searchParams = {
        page: 1,
        per_page: 10,
        search: '',
        ordering: '',
      }

      const { result } = renderHook(() => useMeditationList(searchParams), {
        wrapper,
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
        expect(result.current.data).toBeNull()
      })
    })
  })

  describe('Query Behavior', () => {
    it('should refetch when parameters change', async () => {
      const mockGetData = getData as jest.MockedFunction<typeof getData>
      mockGetData.mockResolvedValue(mockMeditationListResponse)

      const { result, rerender } = renderHook(
        ({ params }) => useMeditationList(params),
        {
          wrapper,
          initialProps: {
            params: { page: 1, per_page: 10, search: '', ordering: '' },
          },
        }
      )

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(mockGetData).toHaveBeenCalledTimes(1)
      expect(mockGetData).toHaveBeenCalledWith(
        '/meditations?page=1&per_page=10'
      )

      rerender({ params: { page: 2, per_page: 10, search: '', ordering: '' } })

      await waitFor(() => {
        expect(mockGetData).toHaveBeenCalledTimes(2)
        expect(mockGetData).toHaveBeenLastCalledWith(
          '/meditations?page=2&per_page=10'
        )
      })
    })

    it('should not refetch when parameters are the same', async () => {
      const mockGetData = getData as jest.MockedFunction<typeof getData>
      mockGetData.mockResolvedValue(mockMeditationListResponse)

      const params = { page: 1, per_page: 10, search: '', ordering: '' }

      const { rerender } = renderHook(() => useMeditationList(params), {
        wrapper,
      })

      await waitFor(() => {
        expect(mockGetData).toHaveBeenCalledTimes(1)
      })

      rerender()

      expect(mockGetData).toHaveBeenCalledTimes(1)
    })
  })

  describe('Error Recovery', () => {
    it('should recover from API errors on subsequent calls', async () => {
      const mockGetData = getData as jest.MockedFunction<typeof getData>

      mockGetData.mockRejectedValueOnce(new Error('API Error'))
      mockGetData.mockResolvedValueOnce(mockMeditationListResponse)

      const params = { page: 1, per_page: 10, search: '', ordering: '' }

      const { result } = renderHook(() => useMeditationList(params), {
        wrapper,
      })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      await act(async () => {
        await result.current.refetch()
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
        expect(result.current.data).toEqual(mockMeditationListResponse)
      })
    })
  })

  describe('URL Building Edge Cases', () => {
    it('should handle special characters in search', async () => {
      const mockGetData = getData as jest.MockedFunction<typeof getData>
      mockGetData.mockResolvedValue(mockMeditationListResponse)

      const searchParams = {
        page: 1,
        per_page: 10,
        search: 'test & special @ characters!',
        ordering: '',
      }

      renderHook(() => useMeditationList(searchParams), { wrapper })

      await waitFor(() => {
        expect(mockGetData).toHaveBeenCalledWith(
          expect.stringContaining(
            encodeURIComponent('test & special @ characters!')
          )
        )
      })
    })

    it('should handle numeric parameters correctly', async () => {
      const mockGetData = getData as jest.MockedFunction<typeof getData>
      mockGetData.mockResolvedValue(mockMeditationListResponse)

      const searchParams = {
        page: 5,
        per_page: 25,
        search: '',
        ordering: 'title',
      }

      renderHook(() => useMeditationList(searchParams), { wrapper })

      await waitFor(() => {
        expect(mockGetData).toHaveBeenCalledWith(
          '/meditations?page=5&per_page=25&ordering=title'
        )
      })
    })

    it('should handle undefined values in parameters', async () => {
      const mockGetData = getData as jest.MockedFunction<typeof getData>
      mockGetData.mockResolvedValue(mockMeditationListResponse)

      const searchParams = {
        page: 1,
        per_page: 10,
        search: undefined as any,
        ordering: undefined as any,
      }

      renderHook(() => useMeditationList(searchParams), { wrapper })

      await waitFor(() => {
        expect(mockGetData).toHaveBeenCalledWith(
          '/meditations?page=1&per_page=10'
        )
      })
    })
  })

  describe('Mutation Hooks', () => {
    beforeEach(() => {
      mockEnqueueSnackbar.mockClear()
    })

    describe('useCreateMeditation', () => {
      it('should create meditation successfully', async () => {
        const mockPostFormData = postFormData as jest.MockedFunction<
          typeof postFormData
        >
        const mockHandleSubmission = jest.fn()
        const mockData = { title: 'New Meditation', description: 'Test' }

        mockPostFormData.mockResolvedValue(createAxiosResponse(mockData))

        const { result } = renderHook(
          () => useCreateMeditation(mockHandleSubmission),
          { wrapper }
        )

        await act(async () => {
          result.current.mutate(mockData)
        })

        await waitFor(() => {
          expect(mockPostFormData).toHaveBeenCalledWith(
            '/meditations',
            mockData
          )
          expect(mockHandleSubmission).toHaveBeenCalledWith(mockData)
          expect(mockEnqueueSnackbar).toHaveBeenCalledWith(
            'Meditation created successfully',
            { variant: 'success' }
          )
        })
      })

      it('should handle create error with errors array', async () => {
        const mockPostFormData = postFormData as jest.MockedFunction<
          typeof postFormData
        >
        const mockHandleSubmission = jest.fn()

        mockPostFormData.mockRejectedValue({
          response: {
            data: {
              errors: [
                'Title has already been taken',
                'Description is required',
              ],
            },
          },
        })

        const { result } = renderHook(
          () => useCreateMeditation(mockHandleSubmission),
          { wrapper }
        )

        await act(async () => {
          result.current.mutate({ title: 'Test' })
        })

        await waitFor(() => {
          expect(mockEnqueueSnackbar).toHaveBeenCalledWith(
            'Title has already been taken, Description is required',
            { variant: 'error' }
          )
        })
      })

      it('should handle create error with error field', async () => {
        const mockPostFormData = postFormData as jest.MockedFunction<
          typeof postFormData
        >
        const mockHandleSubmission = jest.fn()

        mockPostFormData.mockRejectedValue({
          response: {
            data: {
              error: 'Invalid data',
            },
          },
        })

        const { result } = renderHook(
          () => useCreateMeditation(mockHandleSubmission),
          { wrapper }
        )

        await act(async () => {
          result.current.mutate({ title: 'Test' })
        })

        await waitFor(() => {
          expect(mockEnqueueSnackbar).toHaveBeenCalledWith('Invalid data', {
            variant: 'error',
          })
        })
      })

      it('should handle create error with detail field', async () => {
        const mockPostFormData = postFormData as jest.MockedFunction<
          typeof postFormData
        >
        const mockHandleSubmission = jest.fn()

        mockPostFormData.mockRejectedValue({
          response: {
            data: {
              detail: 'Detailed error message',
            },
          },
        })

        const { result } = renderHook(
          () => useCreateMeditation(mockHandleSubmission),
          { wrapper }
        )

        await act(async () => {
          result.current.mutate({ title: 'Test' })
        })

        await waitFor(() => {
          expect(mockEnqueueSnackbar).toHaveBeenCalledWith(
            'Detailed error message',
            { variant: 'error' }
          )
        })
      })

      it('should handle create error with string data', async () => {
        const mockPostFormData = postFormData as jest.MockedFunction<
          typeof postFormData
        >
        const mockHandleSubmission = jest.fn()

        mockPostFormData.mockRejectedValue({
          response: {
            data: 'String error message',
          },
        })

        const { result } = renderHook(
          () => useCreateMeditation(mockHandleSubmission),
          { wrapper }
        )

        await act(async () => {
          result.current.mutate({ title: 'Test' })
        })

        await waitFor(() => {
          expect(mockEnqueueSnackbar).toHaveBeenCalledWith(
            'String error message',
            { variant: 'error' }
          )
        })
      })

      it('should handle create error with default message', async () => {
        const mockPostFormData = postFormData as jest.MockedFunction<
          typeof postFormData
        >
        const mockHandleSubmission = jest.fn()

        mockPostFormData.mockRejectedValue({
          response: {
            data: {},
          },
        })

        const { result } = renderHook(
          () => useCreateMeditation(mockHandleSubmission),
          { wrapper }
        )

        await act(async () => {
          result.current.mutate({ title: 'Test' })
        })

        await waitFor(() => {
          expect(mockEnqueueSnackbar).toHaveBeenCalledWith(
            'Failed to create meditation',
            { variant: 'error' }
          )
        })
      })
    })

    describe('useUpdateMeditation', () => {
      it('should update meditation successfully', async () => {
        const mockUpdateFromData = updateFromData as jest.MockedFunction<
          typeof updateFromData
        >
        const mockHandleSubmission = jest.fn()
        const mockData = { title: 'Updated Meditation' }

        mockUpdateFromData.mockResolvedValue(createAxiosResponse(mockData))

        const { result } = renderHook(
          () => useUpdateMeditation(mockHandleSubmission),
          { wrapper }
        )

        await act(async () => {
          result.current.mutate({ id: '1', data: mockData })
        })

        await waitFor(() => {
          expect(mockUpdateFromData).toHaveBeenCalledWith(
            '/meditations/1',
            mockData
          )
          expect(mockHandleSubmission).toHaveBeenCalledWith(mockData)
          expect(mockEnqueueSnackbar).toHaveBeenCalledWith(
            'Meditation updated successfully',
            { variant: 'success' }
          )
        })
      })

      it('should handle update error with detail field', async () => {
        const mockUpdateFromData = updateFromData as jest.MockedFunction<
          typeof updateFromData
        >
        const mockHandleSubmission = jest.fn()

        mockUpdateFromData.mockRejectedValue({
          response: {
            data: {
              detail: 'Update failed',
            },
          },
        })

        const { result } = renderHook(
          () => useUpdateMeditation(mockHandleSubmission),
          { wrapper }
        )

        await act(async () => {
          result.current.mutate({ id: '1', data: {} })
        })

        await waitFor(() => {
          expect(mockEnqueueSnackbar).toHaveBeenCalledWith('Update failed', {
            variant: 'error',
          })
        })
      })

      it('should handle update error with message field', async () => {
        const mockUpdateFromData = updateFromData as jest.MockedFunction<
          typeof updateFromData
        >
        const mockHandleSubmission = jest.fn()

        mockUpdateFromData.mockRejectedValue({
          response: {
            data: {
              message: 'Update error message',
            },
          },
        })

        const { result } = renderHook(
          () => useUpdateMeditation(mockHandleSubmission),
          { wrapper }
        )

        await act(async () => {
          result.current.mutate({ id: '1', data: {} })
        })

        await waitFor(() => {
          expect(mockEnqueueSnackbar).toHaveBeenCalledWith(
            'Update error message',
            { variant: 'error' }
          )
        })
      })
    })

    describe('useDeleteMeditation', () => {
      it('should delete meditation successfully with custom message', async () => {
        const mockDeleteData = deleteData as jest.MockedFunction<
          typeof deleteData
        >
        const mockHandleSubmission = jest.fn()

        mockDeleteData.mockResolvedValue(
          createAxiosResponse({ message: 'Custom delete message' })
        )

        const { result } = renderHook(
          () => useDeleteMeditation(mockHandleSubmission),
          { wrapper }
        )

        await act(async () => {
          result.current.mutate('1')
        })

        await waitFor(() => {
          expect(mockDeleteData).toHaveBeenCalledWith('/meditations/1')
          expect(mockHandleSubmission).toHaveBeenCalledWith({
            message: 'Custom delete message',
          })
          expect(mockEnqueueSnackbar).toHaveBeenCalledWith(
            'Custom delete message',
            { variant: 'success' }
          )
        })
      })

      it('should delete meditation successfully with default message', async () => {
        const mockDeleteData = deleteData as jest.MockedFunction<
          typeof deleteData
        >
        const mockHandleSubmission = jest.fn()

        mockDeleteData.mockResolvedValue(
          createAxiosResponse({ message: 'Deleted' })
        )

        const { result } = renderHook(
          () => useDeleteMeditation(mockHandleSubmission),
          { wrapper }
        )

        await act(async () => {
          result.current.mutate('1')
        })

        await waitFor(() => {
          expect(mockEnqueueSnackbar).toHaveBeenCalledWith('Deleted', {
            variant: 'success',
          })
        })
      })

      it('should delete meditation successfully without handler', async () => {
        const mockDeleteData = deleteData as jest.MockedFunction<
          typeof deleteData
        >

        mockDeleteData.mockResolvedValue(createAxiosResponse({}))

        const { result } = renderHook(() => useDeleteMeditation(), { wrapper })

        await act(async () => {
          result.current.mutate('1')
        })

        await waitFor(() => {
          expect(mockEnqueueSnackbar).toHaveBeenCalledWith(
            'Meditation deleted successfully',
            { variant: 'success' }
          )
        })
      })

      it('should handle delete error with detail field', async () => {
        const mockDeleteData = deleteData as jest.MockedFunction<
          typeof deleteData
        >

        mockDeleteData.mockRejectedValue({
          response: {
            data: {
              detail: 'Delete failed',
            },
          },
        })

        const { result } = renderHook(() => useDeleteMeditation(), { wrapper })

        await act(async () => {
          result.current.mutate('1')
        })

        await waitFor(() => {
          expect(mockEnqueueSnackbar).toHaveBeenCalledWith('Delete failed', {
            variant: 'error',
          })
        })
      })

      it('should handle delete error with message field', async () => {
        const mockDeleteData = deleteData as jest.MockedFunction<
          typeof deleteData
        >

        mockDeleteData.mockRejectedValue({
          response: {
            message: 'Delete error',
          },
        })

        const { result } = renderHook(() => useDeleteMeditation(), { wrapper })

        await act(async () => {
          result.current.mutate('1')
        })

        await waitFor(() => {
          expect(mockEnqueueSnackbar).toHaveBeenCalledWith('Delete error', {
            variant: 'error',
          })
        })
      })
    })
  })

  describe('Direct API Functions', () => {
    it('should call createMeditation', async () => {
      const mockPostFormData = postFormData as jest.MockedFunction<
        typeof postFormData
      >
      mockPostFormData.mockResolvedValue(createAxiosResponse({}))

      await createMeditation({ title: 'Test' })

      expect(mockPostFormData).toHaveBeenCalledWith('/meditations', {
        title: 'Test',
      })
    })

    it('should call updateMeditation', async () => {
      const mockUpdateFromData = updateFromData as jest.MockedFunction<
        typeof updateFromData
      >
      mockUpdateFromData.mockResolvedValue(createAxiosResponse({}))

      await updateMeditation({ id: '1', data: { title: 'Updated' } })

      expect(mockUpdateFromData).toHaveBeenCalledWith('/meditations/1', {
        title: 'Updated',
      })
    })

    it('should call deActivateAdmin', async () => {
      const mockUpdateFromData = updateFromData as jest.MockedFunction<
        typeof updateFromData
      >
      mockUpdateFromData.mockResolvedValue(createAxiosResponse({}))

      await deActivateAdmin('123')

      expect(mockUpdateFromData).toHaveBeenCalledWith(
        '/admin-users/123/status',
        {}
      )
    })

    it('should call deleteAdmin', async () => {
      const mockDeleteData = deleteData as jest.MockedFunction<
        typeof deleteData
      >
      mockDeleteData.mockResolvedValue(createAxiosResponse({}))

      await deleteAdmin('123')

      expect(mockDeleteData).toHaveBeenCalledWith('/admin-users/123')
    })

    it('should call freezeUser', async () => {
      const mockPostData = postData as jest.MockedFunction<typeof postData>
      mockPostData.mockResolvedValue(createAxiosResponse({}))

      const payload = {
        reason: 'Test',
        start_date: '2024-01-01',
        end_date: '2024-12-31',
      }
      await freezeUser('123', payload)

      expect(mockPostData).toHaveBeenCalledWith(
        '/admin-users/123/freeze',
        payload
      )
    })

    it('should call unfreezeUser', async () => {
      const mockPostData = postData as jest.MockedFunction<typeof postData>
      mockPostData.mockResolvedValue(createAxiosResponse({}))

      await unfreezeUser('123')

      expect(mockPostData).toHaveBeenCalledWith('/admin-users/123/unfreeze', {})
    })

    it('should call getRoles', async () => {
      const result = await getRoles()

      expect(result).toEqual({ items: [], total: 0 })
    })

    it('should call updatePassword', async () => {
      const mockUpdateFromData = updateFromData as jest.MockedFunction<
        typeof updateFromData
      >
      mockUpdateFromData.mockResolvedValue(createAxiosResponse({}))

      await updatePassword('123', 'newPassword')

      expect(mockUpdateFromData).toHaveBeenCalledWith(
        '/admin-users/123/change_password',
        'newPassword'
      )
    })

    it('should call sendAdminInvitation', async () => {
      const mockPostData = postData as jest.MockedFunction<typeof postData>
      mockPostData.mockResolvedValue(createAxiosResponse({}))

      await sendAdminInvitation('123')

      expect(mockPostData).toHaveBeenCalledWith('/admin-users/123/invite', {})
    })
  })
})
