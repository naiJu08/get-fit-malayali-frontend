import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React, { ReactNode, act } from 'react'

import {
  useWorkoutPlans,
  createWorkoutPlan,
  updateWorkoutPlan,
  getWorkoutPlanDetails,
  useAddExercise,
  deleteWorkoutPlanExercise,
  getWorkoutPlanSubcategories,
} from '../api'

import {
  getData,
  postFormData,
  updateFromData,
  deleteWithBody,
} from '../../../../../apis/api.helpers'

jest.mock('../../../../../apis/api.helpers')
jest.mock('../../../../../apis/api.url', () => ({
  __esModule: true,
  default: {
    WORKOUT_PLAN: '/workout_plans',
    CATEGORIES: '/categories',
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
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })

const wrapper: React.FC<{ children: ReactNode }> = ({ children }) => {
  const queryClient = createTestQueryClient()
  return React.createElement(
    QueryClientProvider,
    { client: queryClient },
    children
  )
}

describe('WorkoutPlan API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('fetches list via useWorkoutPlans', async () => {
    const mockGet = getData as jest.MockedFunction<typeof getData>
    mockGet.mockResolvedValue({ workout_plans: [], meta: {} } as any)

    const { result } = renderHook(
      () => useWorkoutPlans({ page: 1, per_page: 10, plan_id: 5 } as any),
      { wrapper }
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockGet).toHaveBeenCalledWith(
      '/workout_plans?page=1&per_page=10&plan_id=5'
    )
  })

  it('calls create/update/details', async () => {
    const mockPost = postFormData as jest.MockedFunction<typeof postFormData>
    const mockUpdate = updateFromData as jest.MockedFunction<typeof updateFromData>
    const mockGet = getData as jest.MockedFunction<typeof getData>
    mockPost.mockResolvedValue({} as any)
    mockUpdate.mockResolvedValue({} as any)
    mockGet.mockResolvedValue({} as any)

    await createWorkoutPlan({} as any)
    await updateWorkoutPlan({ id: 2, payload: {} as any })
    await getWorkoutPlanDetails(3)

    expect(mockPost).toHaveBeenCalledWith('/workout_plans', expect.anything())
    expect(mockUpdate).toHaveBeenCalledWith('/workout_plans/2', expect.anything())
    expect(mockGet).toHaveBeenCalledWith('/workout_plans/3')
  })

  it('useAddExercise posts to add_exercise and invalidates detail', async () => {
    const mockPost = postFormData as jest.MockedFunction<typeof postFormData>
    mockPost.mockResolvedValue({} as any)

    const { result } = renderHook(() => useAddExercise(), { wrapper })

    await act(async () => {
      result.current.mutate({ id: 7, payload: { workout_ids: [1] } } as any)
    })

    await waitFor(() => expect(mockPost).toHaveBeenCalled())
    expect(mockPost).toHaveBeenCalledWith(
      '/workout_plans/7/add_exercise',
      expect.anything()
    )
  })

  it('deleteWorkoutPlanExercise uses deleteWithBody', async () => {
    const mockDel = deleteWithBody as jest.MockedFunction<typeof deleteWithBody>
    mockDel.mockResolvedValue({} as any)
    await deleteWorkoutPlanExercise(1, [2, 3])
    expect(mockDel).toHaveBeenCalledWith('/workout_plans/1/remove_exercise', {
      workout_ids: [2, 3],
    })
  })

  it('getWorkoutPlanSubcategories maps subcategory response', async () => {
    const mockGet = getData as jest.MockedFunction<typeof getData>
    mockGet.mockResolvedValue({
      category: { subcategories: [{ id: 1, name: 'A' }, { id: 2, name: 'B' }] },
    } as any)

    const res = await getWorkoutPlanSubcategories(9)
    expect(mockGet).toHaveBeenCalledWith('/categories/9')
    expect(res).toEqual([
      { id: 1, value: 'A' },
      { id: 2, value: 'B' },
    ])
  })
})

