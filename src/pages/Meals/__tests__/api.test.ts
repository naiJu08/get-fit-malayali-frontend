import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React, { ReactNode, act } from 'react'

import {
  useMeals,
  getMealDetails,
  createMeal,
  updateMeal,
  deleteMeal,
  useCreateMeal,
  useUpdateMeal,
  useDeleteMeal,
  useMealCategories,
  useServingUnits,
  useBulkStatusChange,
} from '../api'

import {
  getData,
  postData,
  deleteData,
  updateData,
  patchData,
} from '../../../apis/api.helpers'

jest.mock('../../../apis/api.helpers')
jest.mock('../../../apis/api.url', () => ({
  __esModule: true,
  default: {
    MEALS: '/meals',
    MEAL_CATEGORIES: '/meal_categories',
    SERVING_UNITS: '/serving_units',
    MEALS_STATUS_CHANGE: '/meals/bulk_status_change',
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
  return React.createElement(
    QueryClientProvider,
    { client: queryClient },
    children
  )
}

describe('Meals API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('fetches meals list via useMeals', async () => {
    const mockGetData = getData as jest.MockedFunction<typeof getData>
    mockGetData.mockResolvedValue({
      meals: [],
      meta: { total_pages: 1, total_count: 0, current_page: 1 },
    } as any)

    const { result } = renderHook(
      () =>
        useMeals({
          page: 1,
          per_page: 10,
          search: '',
          ordering: '',
        } as any),
      { wrapper }
    )

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(mockGetData).toHaveBeenCalledWith('/meals?page=1&per_page=10')
  })

  it('calls getMealDetails', async () => {
    const mockGetData = getData as jest.MockedFunction<typeof getData>
    mockGetData.mockResolvedValue({} as any)
    await getMealDetails('123')
    expect(mockGetData).toHaveBeenCalledWith('/meals/123')
  })

  it('calls createMeal with payload', async () => {
    const mockPost = postData as jest.MockedFunction<typeof postData>
    mockPost.mockResolvedValue({} as any)

    const payload = {
      meal: {
        name: 'Breakfast',
        meal_time: 'Breakfast',
        meal_category_id: 1,
        serving_unit: 'cup',
        per_serving_calories: 300,
      },
    }

    await createMeal(payload)
    expect(mockPost).toHaveBeenCalledWith('/meals', payload)
  })

  it('calls updateMeal with id and payload', async () => {
    const mockUpdate = updateData as jest.MockedFunction<typeof updateData>
    mockUpdate.mockResolvedValue({} as any)

    const payload = {
      meal: {
        name: 'Updated Meal',
        meal_time: 'Lunch',
      },
    }

    await updateMeal('1', payload)
    expect(mockUpdate).toHaveBeenCalledWith('/meals/1', payload)
  })

  it('calls deleteMeal with id', async () => {
    const mockDelete = deleteData as jest.MockedFunction<typeof deleteData>
    mockDelete.mockResolvedValue({} as any)

    await deleteMeal('1')
    expect(mockDelete).toHaveBeenCalledWith('/meals/1')
  })

  it('useCreateMeal shows success message on successful creation', async () => {
    const mockPost = postData as jest.MockedFunction<typeof postData>
    mockPost.mockResolvedValue({
      message: 'Meal created successfully',
    } as any)

    const { result } = renderHook(() => useCreateMeal(), { wrapper })

    await act(async () => {
      result.current.mutate({
        meal: {
          name: 'New Meal',
          meal_time: 'Breakfast',
        },
      })
    })

    await waitFor(() => {
      expect(mockEnqueueSnackbar).toHaveBeenCalledWith(
        'Meal created successfully',
        {
          variant: 'success',
        }
      )
    })
  })

  it('useCreateMeal shows error message on failure', async () => {
    const mockPost = postData as jest.MockedFunction<typeof postData>
    mockPost.mockRejectedValue({
      response: { data: { message: 'Creation failed' } },
    })

    const { result } = renderHook(() => useCreateMeal(), { wrapper })

    await act(async () => {
      result.current.mutate({
        meal: { name: 'Test' },
      })
    })

    await waitFor(() => {
      expect(mockEnqueueSnackbar).toHaveBeenCalledWith('Creation failed', {
        variant: 'error',
      })
    })
  })

  it('useUpdateMeal shows success message on successful update', async () => {
    const mockUpdate = updateData as jest.MockedFunction<typeof updateData>
    mockUpdate.mockResolvedValue({
      message: 'Meal updated successfully',
    } as any)

    const { result } = renderHook(() => useUpdateMeal(), { wrapper })

    await act(async () => {
      result.current.mutate({
        id: '1',
        payload: { meal: { name: 'Updated' } },
      })
    })

    await waitFor(() => {
      expect(mockEnqueueSnackbar).toHaveBeenCalledWith(
        'Meal updated successfully',
        {
          variant: 'success',
        }
      )
    })
  })

  it('useDeleteMeal shows success message', async () => {
    const mockDelete = deleteData as jest.MockedFunction<typeof deleteData>
    mockDelete.mockResolvedValue({
      message: 'Meal deleted successfully',
    } as any)

    const { result } = renderHook(() => useDeleteMeal(), { wrapper })

    await act(async () => {
      result.current.mutate('1')
    })

    await waitFor(() => {
      expect(mockEnqueueSnackbar).toHaveBeenCalledWith(
        'Meal deleted successfully',
        {
          variant: 'success',
        }
      )
    })
  })

  it('useMealCategories fetches meal categories', async () => {
    const mockGetData = getData as jest.MockedFunction<typeof getData>
    mockGetData.mockResolvedValue({
      meal_categories: [],
    } as any)

    const { result } = renderHook(() => useMealCategories(), { wrapper })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(mockGetData).toHaveBeenCalledWith('/meal_categories')
  })

  it('useServingUnits fetches serving units', async () => {
    const mockGetData = getData as jest.MockedFunction<typeof getData>
    mockGetData.mockResolvedValue({
      serving_units: [],
    } as any)

    const { result } = renderHook(() => useServingUnits(1), { wrapper })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(mockGetData).toHaveBeenCalledWith(
      '/serving_units?meal_category_id=1'
    )
  })

  it('useBulkStatusChange shows success message', async () => {
    const mockPatch = patchData as jest.MockedFunction<typeof patchData>
    mockPatch.mockResolvedValue({
      message: 'Status changed successfully',
    } as any)

    const { result } = renderHook(() => useBulkStatusChange(), { wrapper })

    await act(async () => {
      result.current.mutate({
        ids: [1, 2, 3],
        status: 'active',
      })
    })

    await waitFor(() => {
      expect(mockEnqueueSnackbar).toHaveBeenCalledWith(
        'Status changed successfully',
        { variant: 'success' }
      )
    })
  })

  it('useBulkStatusChange shows error message on failure', async () => {
    const mockPatch = patchData as jest.MockedFunction<typeof patchData>
    mockPatch.mockRejectedValue({
      response: { data: { message: 'Status change failed' } },
    })

    const { result } = renderHook(() => useBulkStatusChange(), { wrapper })

    await act(async () => {
      result.current.mutate({
        ids: [1],
        status: 'inactive',
      })
    })

    await waitFor(() => {
      expect(mockEnqueueSnackbar).toHaveBeenCalledWith('Status change failed', {
        variant: 'error',
      })
    })
  })
})
