import { renderHook, waitFor } from '@testing-library/react'
import { QueryClientProvider } from '@tanstack/react-query'
import React, { ReactNode } from 'react'

import {
  useDietPlans,
  getDietPlanDetails,
  createDietPlan,
  updateDietPlan,
  deleteDietPlan,
  useDietPlanDetail,
  useCreateDietPlan,
  useUpdateDietPlan,
  useDeleteDietPlan,
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
  new (require('@tanstack/react-query').QueryClient)({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })

let testQueryClient: any
const wrapper: React.FC<{ children: ReactNode }> = ({ children }) =>
  React.createElement(QueryClientProvider, { client: testQueryClient }, children)

describe('DietPlan API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    testQueryClient = createTestQueryClient()
  })

  it('fetches list via useDietPlans', async () => {
    const mockGet = getData as jest.MockedFunction<typeof getData>
    mockGet.mockResolvedValue({ diet_plans: [], meta: {} } as any)

    const { result } = renderHook(
      () => useDietPlans({ page: 1, per_page: 10, plan_id: 5 } as any),
      { wrapper }
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockGet).toHaveBeenCalledWith('/diet_plans?page=1&per_page=10&plan_id=5')
  })

  it('calls details/create/update/delete', async () => {
    const mockGet = getData as jest.MockedFunction<typeof getData>
    const mockPost = postData as jest.MockedFunction<typeof postData>
    const mockUpdate = updateData as jest.MockedFunction<typeof updateData>
    const mockDelete = deleteData as jest.MockedFunction<typeof deleteData>
    mockGet.mockResolvedValue({} as any)
    mockPost.mockResolvedValue({} as any)
    mockUpdate.mockResolvedValue({} as any)
    mockDelete.mockResolvedValue({} as any)

    await getDietPlanDetails(1)
    await createDietPlan({ diet_plan: { plan_id: 1 } })
    await updateDietPlan({ id: 2, payload: { diet_plan: { day_number: 1 } } })
    await deleteDietPlan(3)

    expect(mockGet).toHaveBeenCalledWith('/diet_plans/1')
    expect(mockPost).toHaveBeenCalledWith('/diet_plans', { diet_plan: { plan_id: 1 } })
    expect(mockUpdate).toHaveBeenCalledWith('/diet_plans/2', {
      diet_plan: { day_number: 1 },
    })
    expect(mockDelete).toHaveBeenCalledWith('/diet_plans/3')
  })

  it('useDietPlanDetail is disabled when id missing', async () => {
    const mockGet = getData as jest.MockedFunction<typeof getData>
    mockGet.mockResolvedValue({} as any)

    const { result } = renderHook(() => useDietPlanDetail(undefined), {
      wrapper,
    })

    await waitFor(() => {
      expect(result.current.fetchStatus).toBe('idle')
    })
    expect(mockGet).not.toHaveBeenCalled()
  })

  it('useDietPlanDetail fetches when id provided', async () => {
    const mockGet = getData as jest.MockedFunction<typeof getData>
    mockGet.mockResolvedValue({ diet_plan: { id: 1 } } as any)

    const { result } = renderHook(() => useDietPlanDetail(1), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockGet).toHaveBeenCalledWith('/diet_plans/1')
  })

  it('useCreateDietPlan invalidates list on success', async () => {
    const mockPost = postData as jest.MockedFunction<typeof postData>
    mockPost.mockResolvedValue({} as any)
    const spyInvalidate = jest.spyOn(testQueryClient, 'invalidateQueries')

    const { result } = renderHook(() => useCreateDietPlan(), { wrapper })
    result.current.mutate({ diet_plan: { plan_id: 1 } } as any)

    await waitFor(() => expect(mockPost).toHaveBeenCalled())
    expect(spyInvalidate).toHaveBeenCalledWith(['diet_plans_list'])
  })

  it('useUpdateDietPlan invalidates list and detail on success', async () => {
    const mockUpdate = updateData as jest.MockedFunction<typeof updateData>
    mockUpdate.mockResolvedValue({} as any)
    const spyInvalidate = jest.spyOn(testQueryClient, 'invalidateQueries')

    const { result } = renderHook(() => useUpdateDietPlan(), { wrapper })
    result.current.mutate({ id: 2, payload: { diet_plan: {} } } as any)

    await waitFor(() => expect(mockUpdate).toHaveBeenCalled())
    expect(spyInvalidate).toHaveBeenCalledWith(['diet_plans_list'])
    expect(spyInvalidate).toHaveBeenCalledWith(['diet_plan_detail'])
  })

  it('useDeleteDietPlan invalidates list on success', async () => {
    const mockDelete = deleteData as jest.MockedFunction<typeof deleteData>
    mockDelete.mockResolvedValue({} as any)
    const spyInvalidate = jest.spyOn(testQueryClient, 'invalidateQueries')

    const { result } = renderHook(() => useDeleteDietPlan(), { wrapper })
    result.current.mutate(3 as any)

    await waitFor(() => expect(mockDelete).toHaveBeenCalled())
    expect(spyInvalidate).toHaveBeenCalledWith(['diet_plans_list'])
  })
})
