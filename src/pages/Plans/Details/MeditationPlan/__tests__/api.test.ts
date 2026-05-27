import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React, { ReactNode, act } from 'react'

import {
  assignMeditations,
  useAssignMeditations,
  deletePlanMeditations,
  useRemoveMeditationsFromPlan,
} from '../api'

import { postData, deleteWithBody } from '../../../../../apis/api.helpers'

jest.mock('../../../../../apis/api.helpers')
jest.mock('../../../../../apis/api.url', () => ({
  __esModule: true,
  default: {
    PLANS: '/plans',
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

describe('MeditationPlan API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('assignMeditations calls postData', async () => {
    const mockPost = postData as jest.MockedFunction<typeof postData>
    mockPost.mockResolvedValue({} as any)
    await assignMeditations(1, { meditation_ids: [1] })
    expect(mockPost).toHaveBeenCalledWith('/plans/1/assign_meditations', {
      meditation_ids: [1],
    })
  })

  it('useAssignMeditations posts and completes', async () => {
    const mockPost = postData as jest.MockedFunction<typeof postData>
    mockPost.mockResolvedValue({} as any)

    const { result } = renderHook(() => useAssignMeditations(), { wrapper })
    await act(async () => {
      result.current.mutate({ planId: 1, payload: { meditation_ids: [1] } } as any)
    })

    await waitFor(() => expect(mockPost).toHaveBeenCalled())
  })

  it('deletePlanMeditations calls deleteWithBody', async () => {
    const mockDel = deleteWithBody as jest.MockedFunction<typeof deleteWithBody>
    mockDel.mockResolvedValue({} as any)
    await deletePlanMeditations(2, [3, 4])
    expect(mockDel).toHaveBeenCalledWith('/plans/2/remove_meditations', {
      meditation_ids: [3, 4],
    })
  })

  it('useRemoveMeditationsFromPlan calls deletePlanMeditations', async () => {
    const mockDel = deleteWithBody as jest.MockedFunction<typeof deleteWithBody>
    mockDel.mockResolvedValue({} as any)

    const { result } = renderHook(() => useRemoveMeditationsFromPlan(), {
      wrapper,
    })
    await act(async () => {
      result.current.mutate({ planId: 2, meditationIds: [9] } as any)
    })

    await waitFor(() => expect(mockDel).toHaveBeenCalled())
  })
})

