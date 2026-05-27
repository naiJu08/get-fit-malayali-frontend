import { renderHook, waitFor } from '@testing-library/react'
import { QueryClientProvider } from '@tanstack/react-query'
import React, { ReactNode, act } from 'react'

import {
  useYogaPlans,
  getYogaPlanDetails,
  createYogaPlan,
  updateYogaPlan,
  useAddYogaExercise,
  deleteYogaPlanExercise,
  useYogaPlanDetail,
  useCreateYogaPlan,
  useUpdateYogaPlan,
  addExercises,
  useAddYogaExercises,
} from '../api'

import {
  getData,
  postData,
  updateData,
  postFormData,
  deleteWithBody,
} from '../../../../../apis/api.helpers'

jest.mock('../../../../../apis/api.helpers')
jest.mock('../../../../../apis/api.url', () => ({
  __esModule: true,
  default: {
    YOGA_PLAN: '/yoga_plans',
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
  // avoid TS namespace/type issues in some setups by requiring at runtime
  new (require('@tanstack/react-query').QueryClient)({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })

let testQueryClient: any
const wrapper: React.FC<{ children: ReactNode }> = ({ children }) =>
  React.createElement(QueryClientProvider, { client: testQueryClient }, children)

describe('YogaPlan API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    testQueryClient = createTestQueryClient()
  })

  it('fetches list via useYogaPlans', async () => {
    const mockGet = getData as jest.MockedFunction<typeof getData>
    mockGet.mockResolvedValue({ yoga_plans: [], meta: {} } as any)

    const { result } = renderHook(
      () => useYogaPlans({ page: 1, per_page: 10, plan_id: 5 } as any),
      { wrapper }
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockGet).toHaveBeenCalledWith('/yoga_plans?page=1&per_page=10&plan_id=5')
  })

  it('calls details/create/update', async () => {
    const mockGet = getData as jest.MockedFunction<typeof getData>
    const mockPost = postData as jest.MockedFunction<typeof postData>
    const mockUpdate = updateData as jest.MockedFunction<typeof updateData>
    mockGet.mockResolvedValue({} as any)
    mockPost.mockResolvedValue({} as any)
    mockUpdate.mockResolvedValue({} as any)

    await getYogaPlanDetails(1)
    await createYogaPlan({ yoga_plan: { plan_id: 1 } })
    await updateYogaPlan({ id: 2, payload: { yoga_plan: { day_number: 1 } } })

    expect(mockGet).toHaveBeenCalledWith('/yoga_plans/1')
    expect(mockPost).toHaveBeenCalledWith('/yoga_plans', {
      yoga_plan: { plan_id: 1 },
    })
    expect(mockUpdate).toHaveBeenCalledWith('/yoga_plans/2', {
      yoga_plan: { day_number: 1 },
    })
  })

  it('useAddYogaExercise posts to add_yoga', async () => {
    const mockPost = postFormData as jest.MockedFunction<typeof postFormData>
    mockPost.mockResolvedValue({} as any)

    const { result } = renderHook(() => useAddYogaExercise(), { wrapper })
    await act(async () => {
      result.current.mutate({ id: 5, payload: { yoga_ids: [1] } } as any)
    })

    await waitFor(() => expect(mockPost).toHaveBeenCalled())
    expect(mockPost).toHaveBeenCalledWith(
      '/yoga_plans/5/add_yoga',
      expect.anything()
    )
  })

  it('deleteYogaPlanExercise uses deleteWithBody', async () => {
    const mockDel = deleteWithBody as jest.MockedFunction<typeof deleteWithBody>
    mockDel.mockResolvedValue({} as any)
    await deleteYogaPlanExercise(1, [2])
    expect(mockDel).toHaveBeenCalledWith('/yoga_plans/1/remove_yoga', {
      yoga_ids: [2],
    })
  })

  it('useYogaPlanDetail does not fetch when id missing', async () => {
    const mockGet = getData as jest.MockedFunction<typeof getData>
    mockGet.mockResolvedValue({} as any)

    const { result } = renderHook(() => useYogaPlanDetail(undefined), {
      wrapper,
    })

    await waitFor(() => {
      expect(result.current.fetchStatus).toBe('idle')
    })
    expect(mockGet).not.toHaveBeenCalled()
  })

  it('useYogaPlanDetail fetches when id provided', async () => {
    const mockGet = getData as jest.MockedFunction<typeof getData>
    mockGet.mockResolvedValue({ yoga_plan: { id: 1 } } as any)

    const { result } = renderHook(() => useYogaPlanDetail(1), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockGet).toHaveBeenCalledWith('/yoga_plans/1')
  })

  it('useCreateYogaPlan invalidates list on success', async () => {
    const mockPost = postData as jest.MockedFunction<typeof postData>
    mockPost.mockResolvedValue({} as any)
    const spyInvalidate = jest.spyOn(testQueryClient, 'invalidateQueries')

    const { result } = renderHook(() => useCreateYogaPlan(), { wrapper })
    await act(async () => {
      result.current.mutate({ yoga_plan: { plan_id: 1 } } as any)
    })

    await waitFor(() => expect(mockPost).toHaveBeenCalled())
    expect(spyInvalidate).toHaveBeenCalledWith(['yoga_plans_list'])
  })

  it('useUpdateYogaPlan invalidates list and detail on success', async () => {
    const mockUpdate = updateData as jest.MockedFunction<typeof updateData>
    mockUpdate.mockResolvedValue({} as any)
    const spyInvalidate = jest.spyOn(testQueryClient, 'invalidateQueries')

    const { result } = renderHook(() => useUpdateYogaPlan(), { wrapper })
    await act(async () => {
      result.current.mutate({
        id: 9,
        payload: { yoga_plan: { title: 'X' } },
      } as any)
    })

    await waitFor(() => expect(mockUpdate).toHaveBeenCalled())
    expect(spyInvalidate).toHaveBeenCalledWith(['yoga_plans_list'])
    expect(spyInvalidate).toHaveBeenCalledWith(['yoga_plan_detail', '9'])
  })

  it('useAddYogaExercises posts and invalidates detail', async () => {
    const mockPost = postFormData as jest.MockedFunction<typeof postFormData>
    mockPost.mockResolvedValue({} as any)
    const spyInvalidate = jest.spyOn(testQueryClient, 'invalidateQueries')

    const { result } = renderHook(() => useAddYogaExercises(), { wrapper })
    await act(async () => {
      result.current.mutate({ id: 5, payload: { yoga_ids: [1] } } as any)
    })

    await waitFor(() => expect(mockPost).toHaveBeenCalled())
    expect(spyInvalidate).toHaveBeenCalledWith(['yoga_plan_detail', '5'])
  })

  it('addExercises calls postFormData with add_yoga endpoint', async () => {
    const mockPost = postFormData as jest.MockedFunction<typeof postFormData>
    mockPost.mockResolvedValue({} as any)
    await addExercises(3, { yoga_ids: [1] })
    expect(mockPost).toHaveBeenCalledWith('/yoga_plans/3/add_yoga', {
      yoga_ids: [1],
    })
  })
})
