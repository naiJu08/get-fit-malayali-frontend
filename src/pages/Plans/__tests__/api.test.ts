import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React, { ReactNode, act } from 'react'

import {
  usePlans,
  getPlan,
  usePlan,
  createPlan,
  updatePlan,
  patchPlan,
  deletePlan,
  updatePlanStatus,
  useCreatePlan,
  useUpdatePlan,
  useAdminUser,
  deActivateAdmin,
  getAdminDetails,
  createAdmin,
  useCreateAdmin,
  updateTask,
  useUpdateAdmin,
  getRoles,
  updatePassword,
  sendAdminInvitation,
} from '../api'

import {
  getData,
  postData,
  updateData,
  patchData,
  deleteData,
  updateFromData,
} from '../../../apis/api.helpers'

jest.mock('../../../apis/api.helpers')
jest.mock('../../../apis/api.url', () => ({
  __esModule: true,
  default: {
    PLANS: '/plans',
    ADMIN_USER: '/admin_users',
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
  getErrorMessage: (err: any) => String(err?.message || err || 'Error'),
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

describe('Plans API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('fetches plans list via usePlans', async () => {
    const mockGet = getData as jest.MockedFunction<typeof getData>
    mockGet.mockResolvedValue({ plans: [], meta: { total_pages: 1 } } as any)

    const { result } = renderHook(
      () =>
        usePlans(
          {
            page: 1,
            per_page: 10,
            search: '',
            ordering: '',
          } as any,
          { staleTime: 0 }
        ),
      { wrapper }
    )

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(mockGet).toHaveBeenCalledWith('/plans?page=1&per_page=10')
  })

  it('calls getPlan', async () => {
    const mockGet = getData as jest.MockedFunction<typeof getData>
    mockGet.mockResolvedValue({ plan: { id: 1 } } as any)
    await getPlan(1)
    expect(mockGet).toHaveBeenCalledWith('/plans/1')
  })

  it('usePlan does not fetch when id missing', async () => {
    const mockGet = getData as jest.MockedFunction<typeof getData>
    mockGet.mockResolvedValue({} as any)

    const { result } = renderHook(() => usePlan(undefined as any), { wrapper })
    await waitFor(() => {
      // react-query keeps disabled queries idle
      expect(result.current.fetchStatus).toBe('idle')
    })
    expect(mockGet).not.toHaveBeenCalled()
  })

  it('calls createPlan/updatePlan/patchPlan/deletePlan', async () => {
    const mockPost = postData as jest.MockedFunction<typeof postData>
    const mockUpdate = updateData as jest.MockedFunction<typeof updateData>
    const mockPatch = patchData as jest.MockedFunction<typeof patchData>
    const mockDelete = deleteData as jest.MockedFunction<typeof deleteData>
    mockPost.mockResolvedValue({} as any)
    mockUpdate.mockResolvedValue({} as any)
    mockPatch.mockResolvedValue({} as any)
    mockDelete.mockResolvedValue({} as any)

    await createPlan({ plan: { name: 'A' } })
    await updatePlan(1, { plan: { name: 'B' } })
    await patchPlan(1, { plan: { active: true } })
    await deletePlan(1)

    expect(mockPost).toHaveBeenCalledWith('/plans', { plan: { name: 'A' } })
    expect(mockUpdate).toHaveBeenCalledWith('/plans/1', { plan: { name: 'B' } })
    expect(mockPatch).toHaveBeenCalledWith('/plans/1', { plan: { active: true } })
    expect(mockDelete).toHaveBeenCalledWith('/plans/1')
  })

  it('updatePlanStatus uses first endpoint when update succeeds', async () => {
    const mockUpdate = updateData as jest.MockedFunction<typeof updateData>
    mockUpdate.mockResolvedValue({ ok: true } as any)

    await updatePlanStatus(5, true)

    expect(mockUpdate).toHaveBeenCalledWith('/plans/5', {
      plan: { active: true },
    })
  })

  it('updatePlanStatus falls back to /status then /active', async () => {
    const mockUpdate = updateData as jest.MockedFunction<typeof updateData>
    mockUpdate
      .mockRejectedValueOnce(new Error('first fails'))
      .mockRejectedValueOnce(new Error('second fails'))
      .mockResolvedValueOnce({ ok: true } as any)

    await updatePlanStatus(5, false)

    expect(mockUpdate).toHaveBeenNthCalledWith(1, '/plans/5', {
      plan: { active: false },
    })
    expect(mockUpdate).toHaveBeenNthCalledWith(2, '/plans/5/status', {
      active: false,
    })
    expect(mockUpdate).toHaveBeenNthCalledWith(3, '/plans/5/active', {
      active: false,
    })
  })

  it('useCreatePlan shows success snackbar', async () => {
    const mockPost = postData as jest.MockedFunction<typeof postData>
    mockPost.mockResolvedValue({} as any)

    const { result } = renderHook(() => useCreatePlan(), { wrapper })

    await act(async () => {
      result.current.mutate({ plan: { name: 'A' } } as any)
    })

    await waitFor(() => {
      expect(mockEnqueueSnackbar).toHaveBeenCalledWith(
        'Plan created successfully',
        { variant: 'success' }
      )
    })
  })

  it('useUpdatePlan invalidates plans_list and shows error message', async () => {
    const mockUpdate = updateData as jest.MockedFunction<typeof updateData>
    mockUpdate.mockRejectedValue({
      response: { data: { message: 'Update failed' } },
    })

    const { result } = renderHook(() => useUpdatePlan(), { wrapper })

    await act(async () => {
      result.current.mutate({ id: 1, payload: { plan: { name: 'X' } } } as any)
    })

    await waitFor(() => {
      expect(mockEnqueueSnackbar).toHaveBeenCalledWith('Update failed', {
        variant: 'error',
      })
    })
  })

  it('useAdminUser fetches admin list when enabled', async () => {
    const mockGet = getData as jest.MockedFunction<typeof getData>
    mockGet.mockResolvedValue({ items: [], meta: { total_pages: 1 } } as any)

    const { result } = renderHook(
      () =>
        useAdminUser({
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

    expect(mockGet).toHaveBeenCalledWith('/admin_users?page=1&per_page=10')
  })

  it('calls admin helpers (status/details/create/invite/password/update)', async () => {
    const mockGet = getData as jest.MockedFunction<typeof getData>
    const mockPost = postData as jest.MockedFunction<typeof postData>
    const mockUpdateFD = updateFromData as jest.MockedFunction<
      typeof updateFromData
    >
    mockGet.mockResolvedValue({} as any)
    mockPost.mockResolvedValue({} as any)
    mockUpdateFD.mockResolvedValue({} as any)

    await deActivateAdmin('5')
    await getAdminDetails('6')
    await createAdmin({ email: 'a@b.com' })
    await sendAdminInvitation('7')
    await updatePassword('8', 'pw' as any)
    await updateTask({ id: 9, data: { name: 'X' } })

    expect(mockUpdateFD).toHaveBeenCalledWith('/admin_users/5/status', {})
    expect(mockGet).toHaveBeenCalledWith('/admin_users/6')
    expect(mockPost).toHaveBeenCalledWith('/admin_users', { email: 'a@b.com' })
    expect(mockPost).toHaveBeenCalledWith('/admin_users/7/invite', {})
    expect(mockUpdateFD).toHaveBeenCalledWith(
      '/admin_users/8/change_password',
      'pw'
    )
    expect(mockUpdateFD).toHaveBeenCalledWith('/admin_users/9', {
      name: 'X',
    })
  })

  it('useCreateAdmin calls handleSubmission and shows success snackbar', async () => {
    const mockPost = postData as jest.MockedFunction<typeof postData>
    mockPost.mockResolvedValue({ data: { id: 1 } } as any)

    const handleSubmission = jest.fn()
    const { result } = renderHook(() => useCreateAdmin(handleSubmission), {
      wrapper,
    })

    await act(async () => {
      result.current.mutate({ email: 'a@b.com' } as any)
    })

    await waitFor(() => {
      expect(handleSubmission).toHaveBeenCalledWith({ id: 1 })
      expect(mockEnqueueSnackbar).toHaveBeenCalledWith(
        'Admin created successfully',
        { variant: 'success' }
      )
    })
  })

  it('useCreateAdmin shows parsed error message on error', async () => {
    const mockPost = postData as jest.MockedFunction<typeof postData>
    mockPost.mockRejectedValue({
      response: { data: { error: 'Bad request' } },
    })

    const { result } = renderHook(() => useCreateAdmin(jest.fn()), { wrapper })

    await act(async () => {
      result.current.mutate({ email: 'x' } as any)
    })

    await waitFor(() => {
      expect(mockEnqueueSnackbar).toHaveBeenCalledWith('Bad request', {
        variant: 'error',
      })
    })
  })

  it('useUpdateAdmin calls handleSubmission and shows error fallback', async () => {
    const mockUpdateFD = updateFromData as jest.MockedFunction<
      typeof updateFromData
    >
    mockUpdateFD.mockResolvedValue({ data: { ok: true } } as any)

    const handleSubmission = jest.fn()
    const { result } = renderHook(() => useUpdateAdmin(handleSubmission), {
      wrapper,
    })

    await act(async () => {
      result.current.mutate({ id: 1, data: { name: 'X' } } as any)
    })

    await waitFor(() => {
      expect(handleSubmission).toHaveBeenCalledWith({ ok: true })
      expect(mockEnqueueSnackbar).toHaveBeenCalledWith(
        'Details updated successfully',
        { variant: 'success' }
      )
    })

    mockUpdateFD.mockRejectedValueOnce({
      response: { data: { message: 'Nope' } },
    })
    await act(async () => {
      result.current.mutate({ id: 2, data: {} } as any)
    })
    await waitFor(() => {
      expect(mockEnqueueSnackbar).toHaveBeenCalledWith('Nope', {
        variant: 'error',
      })
    })
  })

  it('getRoles returns empty list', async () => {
    await expect(getRoles()).resolves.toEqual({ items: [], total: 0 })
  })
})
