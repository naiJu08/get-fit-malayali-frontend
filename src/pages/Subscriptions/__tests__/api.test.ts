import React, { ReactNode, act } from 'react'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  createAdmin,
  createSubscription,
  deActivateAdmin,
  deleteAdmin,
  deleteSubscription,
  freezeSubscription,
  freezeUser,
  getAdminDetails,
  getRoles,
  getSubscriptionAdditionalInfo,
  getSubscriptionDetails,
  getSubscriptionPlanDay,
  getSubscriptionPlanOverview,
  sendAdminInvitation,
  unfreezeSubscription,
  unfreezeUser,
  updatePassword,
  updateSubscription,
  updateTask,
  useAdminUser,
  useCreateAdmin,
  useSubscriptionDetails,
  useSubscriptions,
  useUpdateAdmin,
} from '../api'
import {
  deleteData,
  getData,
  postData,
  updateFromData,
} from '../../../apis/api.helpers'

jest.mock('../../../apis/api.helpers')

jest.mock('../../../apis/api.url', () => ({
  __esModule: true,
  default: {
    SUBSCRIPTIONS: 'subscriptions',
    SUBSCRIPTION_CALENDAR: 'subscription-calendar',
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
  console.error = jest.fn((...args: any[]) => {
    const first = args[0]
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

describe('Subscriptions API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('fetches subscriptions through useSubscriptions and normalizes response metadata', async () => {
    ;(getData as jest.Mock).mockResolvedValue({
      subscriptions: [{ id: 1 }],
      meta: {
        total_count: 24,
        total_pages: 3,
        current_page: 2,
      },
    })

    const { result } = renderHook(
      () =>
        useSubscriptions({
          page: 2,
          per_page: 10,
          search: 'anna',
          ordering: '-created_at',
        } as any),
      { wrapper }
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(getData).toHaveBeenCalledWith(
      'subscriptions?page=2&per_page=10&search=anna&ordering=-created_at'
    )
    expect(result.current.data).toEqual({
      items: [{ id: 1 }],
      total: 24,
      total_pages: 3,
      current_page: 2,
    })
  })

  it('uses items response and default metadata fallbacks', async () => {
    ;(getData as jest.Mock).mockResolvedValue({ items: [{ id: 2 }] })

    const { result } = renderHook(() => useAdminUser({ page: 1 } as any), {
      wrapper,
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual({
      items: [{ id: 2 }],
      total: 0,
      total_pages: 1,
      current_page: 1,
    })
  })

  it('handles subscription list errors', async () => {
    ;(getData as jest.Mock).mockRejectedValue(new Error('Fetch failed'))

    const { result } = renderHook(() => useSubscriptions({ page: 1 } as any), {
      wrapper,
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })

  it('fetches subscription details through direct and hook APIs', async () => {
    ;(getData as jest.Mock).mockResolvedValue({ id: '7' })

    await expect(getSubscriptionDetails('7')).resolves.toEqual({ id: '7' })
    expect(getData).toHaveBeenCalledWith('subscriptions/7')

    ;(getData as jest.Mock).mockClear()
    const { result } = renderHook(() => useSubscriptionDetails('7'), {
      wrapper,
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(getData).toHaveBeenCalledWith('subscriptions/7')
  })

  it('does not fetch subscription details when disabled or missing id', async () => {
    const disabled = renderHook(() => useSubscriptionDetails('7', false), {
      wrapper,
    })
    const missing = renderHook(() => useSubscriptionDetails(undefined), {
      wrapper,
    })

    expect(disabled.result.current.fetchStatus).toBe('idle')
    expect(missing.result.current.fetchStatus).toBe('idle')
    expect(getData).not.toHaveBeenCalled()
  })

  it('calls direct CRUD and freeze helpers with the expected URLs and payloads', async () => {
    ;(postData as jest.Mock).mockResolvedValue({ ok: true })
    ;(updateFromData as jest.Mock).mockResolvedValue({ ok: true })
    ;(deleteData as jest.Mock).mockResolvedValue({ ok: true })

    await createSubscription({ plan_id: 1 })
    await updateSubscription({ id: '1', data: { plan_id: 2 } })
    await deleteSubscription('1')
    await freezeSubscription('1', {
      reason: 'Travel',
      start_date: '2026-05-01',
      end_date: '2026-05-02',
    })
    await unfreezeSubscription('1', { unfreeze_dates: ['2026-05-01'] })
    await freezeSubscription('2')
    await unfreezeSubscription('2')

    expect(postData).toHaveBeenCalledWith('subscriptions', { plan_id: 1 })
    expect(updateFromData).toHaveBeenCalledWith('subscriptions/1', {
      plan_id: 2,
    })
    expect(deleteData).toHaveBeenCalledWith('subscriptions/1')
    expect(postData).toHaveBeenCalledWith('subscriptions/1/freeze', {
      reason: 'Travel',
      start_date: '2026-05-01',
      end_date: '2026-05-02',
    })
    expect(postData).toHaveBeenCalledWith('subscriptions/1/unfreeze', {
      unfreeze_dates: ['2026-05-01'],
    })
    expect(postData).toHaveBeenCalledWith('subscriptions/2/freeze', {})
    expect(postData).toHaveBeenCalledWith('subscriptions/2/unfreeze', {})
  })

  it('calls AdminUser-compatible aliases', async () => {
    ;(getData as jest.Mock).mockResolvedValue({ id: '1' })
    ;(postData as jest.Mock).mockResolvedValue({ ok: true })
    ;(updateFromData as jest.Mock).mockResolvedValue({ ok: true })
    ;(deleteData as jest.Mock).mockResolvedValue({ ok: true })

    await getAdminDetails('1')
    await deActivateAdmin('1')
    await deleteAdmin('1')
    await freezeUser('1', { reason: 'Pause' })
    await unfreezeUser('1', { unfreeze_dates: ['2026-05-03'] })
    await createAdmin({ user_id: 5 })
    await updateTask({ id: '1', data: { user_id: 6 } })

    expect(getData).toHaveBeenCalledWith('subscriptions/1')
    expect(updateFromData).toHaveBeenCalledWith('subscriptions/1/status', {})
    expect(deleteData).toHaveBeenCalledWith('subscriptions/1')
    expect(postData).toHaveBeenCalledWith('subscriptions/1/freeze', {
      reason: 'Pause',
    })
    expect(postData).toHaveBeenCalledWith('subscriptions/1/unfreeze', {
      unfreeze_dates: ['2026-05-03'],
    })
    expect(postData).toHaveBeenCalledWith('subscriptions', { user_id: 5 })
    expect(updateFromData).toHaveBeenCalledWith('subscriptions/1', {
      user_id: 6,
    })
  })

  it('calls additional subscription calendar helpers', async () => {
    ;(getData as jest.Mock).mockResolvedValue({})
    ;(postData as jest.Mock).mockResolvedValue({})
    ;(updateFromData as jest.Mock).mockResolvedValue({})

    await getSubscriptionAdditionalInfo(10, 20)
    await getSubscriptionPlanOverview(10, 20)
    await getSubscriptionPlanDay(10, 20, '2026-05-21')
    await getSubscriptionPlanDay(10, 20, '2026-05-21 with space')
    await updatePassword('10', 'new-password')
    await sendAdminInvitation('10')

    expect(getData).toHaveBeenCalledWith(
      'subscription-calendar/10/additional_data?subscription_id=20'
    )
    expect(getData).toHaveBeenCalledWith(
      'subscription-calendar/10/subscriptions/20/plan_overview'
    )
    expect(getData).toHaveBeenCalledWith(
      'subscription-calendar/10/subscriptions/20/plan_day?date=2026-05-21'
    )
    expect(getData).toHaveBeenCalledWith(
      'subscription-calendar/10/subscriptions/20/plan_day?date=2026-05-21%20with%20space'
    )
    expect(updateFromData).toHaveBeenCalledWith(
      'subscriptions/10/change_password',
      'new-password'
    )
    expect(postData).toHaveBeenCalledWith('subscriptions/10/invite', {})
  })

  it('returns empty roles list', async () => {
    await expect(getRoles()).resolves.toEqual({ items: [], total: 0 })
  })

  it('useCreateAdmin handles successful creation', async () => {
    ;(postData as jest.Mock).mockResolvedValue({ data: { id: 1 } })
    const handleSubmission = jest.fn()

    const { result } = renderHook(() => useCreateAdmin(handleSubmission), {
      wrapper,
    })

    await act(async () => {
      await result.current.mutateAsync({ user_id: 1 })
    })

    expect(handleSubmission).toHaveBeenCalledWith({ id: 1 })
    expect(mockEnqueueSnackbar).toHaveBeenCalledWith(
      'Subscription created successfully',
      { variant: 'success' }
    )
  })

  it('useCreateAdmin handles API errors with getErrorMessage', async () => {
    ;(postData as jest.Mock).mockRejectedValue({
      response: { data: { error: { message: 'Create failed' } } },
    })

    const { result } = renderHook(() => useCreateAdmin(jest.fn()), {
      wrapper,
    })

    await act(async () => {
      try {
        await result.current.mutateAsync({ user_id: 1 })
      } catch {
        // Expected by mutateAsync on failed mutations.
      }
    })

    await waitFor(() => {
      expect(mockEnqueueSnackbar).toHaveBeenCalledWith('Create failed', {
        variant: 'error',
      })
    })
  })

  it('useUpdateAdmin handles successful update', async () => {
    ;(updateFromData as jest.Mock).mockResolvedValue({ data: { id: 1 } })
    const handleSubmission = jest.fn()

    const { result } = renderHook(() => useUpdateAdmin(handleSubmission), {
      wrapper,
    })

    await act(async () => {
      await result.current.mutateAsync({ id: '1', data: { plan_id: 3 } })
    })

    expect(handleSubmission).toHaveBeenCalledWith({ id: 1 })
    expect(mockEnqueueSnackbar).toHaveBeenCalledWith(
      'Details updated successfully',
      { variant: 'success' }
    )
  })

  it('useUpdateAdmin handles detail errors through getErrorMessage', async () => {
    ;(updateFromData as jest.Mock).mockRejectedValue({
      response: { data: { detail: { message: 'Update detail failed' } } },
    })

    const { result } = renderHook(() => useUpdateAdmin(jest.fn()), {
      wrapper,
    })

    await act(async () => {
      try {
        await result.current.mutateAsync({ id: '1', data: {} })
      } catch {
        // Expected by mutateAsync on failed mutations.
      }
    })

    await waitFor(() => {
      expect(mockEnqueueSnackbar).toHaveBeenCalledWith(
        'Update detail failed',
        { variant: 'error' }
      )
    })
  })

  it('useUpdateAdmin handles message errors', async () => {
    ;(updateFromData as jest.Mock).mockRejectedValue({
      response: { data: { message: 'Update failed' } },
    })

    const { result } = renderHook(() => useUpdateAdmin(jest.fn()), {
      wrapper,
    })

    await act(async () => {
      try {
        await result.current.mutateAsync({ id: '1', data: {} })
      } catch {
        // Expected by mutateAsync on failed mutations.
      }
    })

    await waitFor(() => {
      expect(mockEnqueueSnackbar).toHaveBeenCalledWith('Update failed', {
        variant: 'error',
      })
    })
  })
})
