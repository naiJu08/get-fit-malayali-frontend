import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React, { ReactNode, act } from 'react'

import {
  useDietPlans,
  getDietPlanDetails,
  createDietPlan,
  useCreateDietPlan,
  updateDietPlan,
  useUpdateDietPlan,
  deleteDietPlan,
  useDeleteDietPlan,
  useDietPlanDetail,
} from '../api'

import {
  getData,
  postData,
  updateData,
  deleteData,
} from '../../../../../apis/api.helpers'

jest.mock('../../../../../apis/api.helpers')
jest.mock('../../../../../apis/api.url', () => ({
  __esModule: true,
  default: {
    DIET_PLAN: '/diet_plans',
  },
}))

jest.mock('../../../../../utilities/parsers', () => ({
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

describe('DietPlanTab API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('fetches diet plans list via useDietPlans', async () => {
    const mockGetData = getData as jest.MockedFunction<typeof getData>
    mockGetData.mockResolvedValue({
      diet_plans: [],
      meta: { total_pages: 1, total_count: 0, current_page: 1 },
    } as any)

    const { result } = renderHook(
      () =>
        useDietPlans({
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

    expect(mockGetData).toHaveBeenCalledWith('/diet_plans?page=1&per_page=10')
  })

  it('calls getDietPlanDetails with id', async () => {
    const mockGetData = getData as jest.MockedFunction<typeof getData>
    mockGetData.mockResolvedValue({ diet_plan: {} } as any)

    await getDietPlanDetails('123')
    expect(mockGetData).toHaveBeenCalledWith('/diet_plans/123')
  })

  it('fetches diet plan detail via useDietPlanDetail when id is provided', async () => {
    const mockGetData = getData as jest.MockedFunction<typeof getData>
    mockGetData.mockResolvedValue({ diet_plan: { id: '123' } } as any)

    const { result } = renderHook(() => useDietPlanDetail('123'), { wrapper })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(mockGetData).toHaveBeenCalledWith('/diet_plans/123')
  })

  it('does not fetch diet plan detail when id is not provided', async () => {
    const mockGetData = getData as jest.MockedFunction<typeof getData>
    mockGetData.mockResolvedValue({ diet_plan: {} } as any)

    const { result } = renderHook(() => useDietPlanDetail(undefined), {
      wrapper,
    })

    await waitFor(() => {
      expect(result.current.fetchStatus).toBe('idle')
    })

    expect(mockGetData).not.toHaveBeenCalled()
  })

  it('calls createDietPlan with payload', async () => {
    const mockPost = postData as jest.MockedFunction<typeof postData>
    mockPost.mockResolvedValue({} as any)

    const payload = {
      day_number: 1,
      meal_time: 'Breakfast',
      diet_plan_template_id: 1,
    }

    await createDietPlan(payload)
    expect(mockPost).toHaveBeenCalledWith('/diet_plans', payload)
  })

  it('calls updateDietPlan with id and payload', async () => {
    const mockUpdate = updateData as jest.MockedFunction<typeof updateData>
    mockUpdate.mockResolvedValue({} as any)

    const payload = {
      meal_time: 'Lunch',
      day_number: 2,
    }

    await updateDietPlan({ id: '1', payload })
    expect(mockUpdate).toHaveBeenCalledWith('/diet_plans/1', payload)
  })

  it('calls deleteDietPlan with id', async () => {
    const mockDelete = deleteData as jest.MockedFunction<typeof deleteData>
    mockDelete.mockResolvedValue({} as any)

    await deleteDietPlan('1')
    expect(mockDelete).toHaveBeenCalledWith('/diet_plans/1')
  })

  it('useCreateDietPlan invalidates diet_plans_list on success', async () => {
    const mockPost = postData as jest.MockedFunction<typeof postData>
    mockPost.mockResolvedValue({ data: {} } as any)

    const { result } = renderHook(() => useCreateDietPlan(), { wrapper })

    const payload = {
      day_number: 1,
      meal_time: 'Breakfast',
      diet_plan_template_id: 1,
    }

    await act(async () => {
      await result.current.mutateAsync(payload as any)
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })
  })

  it('useUpdateDietPlan invalidates diet_plans_list on success', async () => {
    const mockUpdate = updateData as jest.MockedFunction<typeof updateData>
    mockUpdate.mockResolvedValue({ data: {} } as any)

    const { result } = renderHook(() => useUpdateDietPlan(), { wrapper })

    const payload = {
      meal_time: 'Lunch',
      day_number: 2,
    }

    await act(async () => {
      await result.current.mutateAsync({ id: '1', payload } as any)
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })
  })

  it('useDeleteDietPlan invalidates diet_plans_list on success', async () => {
    const mockDelete = deleteData as jest.MockedFunction<typeof deleteData>
    mockDelete.mockResolvedValue({} as any)

    const { result } = renderHook(() => useDeleteDietPlan(), { wrapper })

    await act(async () => {
      await result.current.mutateAsync('1' as any)
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })
  })

  it('handles error in useDietPlans', async () => {
    const mockGetData = getData as jest.MockedFunction<typeof getData>
    mockGetData.mockRejectedValue(new Error('API Error'))

    const { result } = renderHook(
      () =>
        useDietPlans({
          page: 1,
          per_page: 10,
          search: '',
          ordering: '',
        } as any),
      { wrapper }
    )

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })
  })
})
