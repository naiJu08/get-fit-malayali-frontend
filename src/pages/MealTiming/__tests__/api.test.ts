import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React, { ReactNode, act } from 'react'

import {
  useMealTimingList,
  getMealTimingDetails,
  createMealTiming,
  updateMealTiming,
  deleteMealTiming,
  updateUserMealTiming,
  useCreateMealTiming,
  useUpdateMealTiming,
  useDeleteMealTiming,
  useUpdateUserMealTiming,
} from '../api'

import {
  getData,
  postData,
  deleteData,
  updateData,
} from '../../../apis/api.helpers'

jest.mock('../../../apis/api.helpers')
jest.mock('../../../apis/api.url', () => ({
  __esModule: true,
  default: {
    MEAL_TIMINGS: '/meal_timings',
    USER_MEAL_TIMINGS: '/user_meal_timings',
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
    if (error?.message) return String(error.message)
    return String(error)
  },
}))

const originalConsoleError = console.error
beforeAll(() => {
  console.error = jest.fn((...args: any[]) => {
    const first = args[0]
    const msg = typeof first === 'string' ? first : ''
    if (msg.includes('ReactDOMTestUtils.act')) return
    // TanStack Query logs rejected mutation payloads in tests; suppress those expected logs.
    if (first && typeof first === 'object' && 'response' in first) return
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

const wrapper: React.FC<{ children: ReactNode }> = ({ children }) => {
  const queryClient = createTestQueryClient()
  return React.createElement(QueryClientProvider, { client: queryClient }, children)
}

describe('MealTiming API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('fetches meal timing list via useMealTimingList', async () => {
    const mockGetData = getData as jest.MockedFunction<typeof getData>
    mockGetData.mockResolvedValue({ meal_timings: [], meta: { total_pages: 1 } } as any)

    const { result } = renderHook(
      () =>
        useMealTimingList({
          page: 1,
          page_size: 10,
          search: '',
          ordering: '',
        } as any),
      { wrapper }
    )

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(mockGetData).toHaveBeenCalledWith(
      '/meal_timings?page=1&page_size=10&per_page=10'
    )
  })

  it('calls getMealTimingDetails', async () => {
    const mockGetData = getData as jest.MockedFunction<typeof getData>
    mockGetData.mockResolvedValue({} as any)
    await getMealTimingDetails('123')
    expect(mockGetData).toHaveBeenCalledWith('/meal_timings/123')
  })

  it('calls createMealTiming/updateMealTiming/deleteMealTiming', async () => {
    const mockPost = postData as jest.MockedFunction<typeof postData>
    const mockUpdate = updateData as jest.MockedFunction<typeof updateData>
    const mockDelete = deleteData as jest.MockedFunction<typeof deleteData>
    mockPost.mockResolvedValue({} as any)
    mockUpdate.mockResolvedValue({} as any)
    mockDelete.mockResolvedValue({} as any)

    await createMealTiming({ name: 'Breakfast' })
    await updateMealTiming('1', { name: 'Lunch' })
    await deleteMealTiming('1')

    expect(mockPost).toHaveBeenCalledWith('/meal_timings', { name: 'Breakfast' })
    expect(mockUpdate).toHaveBeenCalledWith('/meal_timings/1', { name: 'Lunch' })
    expect(mockDelete).toHaveBeenCalledWith('/meal_timings/1')
  })

  it('calls updateUserMealTiming with user_id query param', async () => {
    const mockPost = postData as jest.MockedFunction<typeof postData>
    mockPost.mockResolvedValue({} as any)

    await updateUserMealTiming('99', {
      user_meal_timing: {
        meal_time: 'BREAKFAST',
        time: '08:00 AM',
        diet_plan_template_id: 1,
        subscription_id: 2,
        sequence_number: 1,
      },
    })

    expect(mockPost).toHaveBeenCalledWith('/user_meal_timings?user_id=99', {
      user_meal_timing: {
        meal_time: 'BREAKFAST',
        time: '08:00 AM',
        diet_plan_template_id: 1,
        subscription_id: 2,
        sequence_number: 1,
      },
    })
  })

  it('useCreateMealTiming shows success snackbar', async () => {
    const mockPost = postData as jest.MockedFunction<typeof postData>
    mockPost.mockResolvedValue({} as any)

    const onSuccess = jest.fn()
    const { result } = renderHook(() => useCreateMealTiming(onSuccess), { wrapper })

    await act(async () => {
      result.current.mutate({ name: 'Breakfast' } as any)
    })

    await waitFor(() => {
      expect(mockEnqueueSnackbar).toHaveBeenCalledWith(
        'Meal timing created successfully',
        { variant: 'success' }
      )
      expect(onSuccess).toHaveBeenCalled()
    })
  })

  it('useUpdateMealTiming shows error snackbar from message', async () => {
    const mockUpdate = updateData as jest.MockedFunction<typeof updateData>
    mockUpdate.mockRejectedValue({
      response: { data: { message: 'Update failed' } },
    })

    const { result } = renderHook(() => useUpdateMealTiming(), { wrapper })

    await act(async () => {
      result.current.mutate({ id: '1', data: { name: 'Lunch' } } as any)
    })

    await waitFor(() => {
      expect(mockEnqueueSnackbar).toHaveBeenCalledWith('Update failed', {
        variant: 'error',
      })
    })
  })

  it('useDeleteMealTiming shows success snackbar', async () => {
    const mockDelete = deleteData as jest.MockedFunction<typeof deleteData>
    mockDelete.mockResolvedValue({} as any)

    const { result } = renderHook(() => useDeleteMealTiming(), { wrapper })

    await act(async () => {
      result.current.mutate('1')
    })

    await waitFor(() => {
      expect(mockEnqueueSnackbar).toHaveBeenCalledWith(
        'Meal timing deleted successfully',
        { variant: 'success' }
      )
    })
  })

  it('useUpdateUserMealTiming shows error snackbar from errors array', async () => {
    const mockPost = postData as jest.MockedFunction<typeof postData>
    mockPost.mockRejectedValue({
      response: { data: { errors: ['Bad request'] } },
    })

    const { result } = renderHook(() => useUpdateUserMealTiming(), { wrapper })

    await act(async () => {
      result.current.mutate({
        userId: '1',
        payload: {
          user_meal_timing: {
            meal_time: 'BREAKFAST',
            time: '08:00 AM',
            diet_plan_template_id: 1,
            subscription_id: 1,
            sequence_number: 1,
          },
        },
      } as any)
    })

    await waitFor(() => {
      expect(mockEnqueueSnackbar).toHaveBeenCalledWith('Bad request', {
        variant: 'error',
      })
    })
  })
})
