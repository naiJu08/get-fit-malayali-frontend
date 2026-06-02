/* eslint-disable @typescript-eslint/no-var-requires */

type SetupOptions = {
  role?: string
}

const setupApiModule = ({ role = 'admin' }: SetupOptions = {}) => {
  jest.resetModules()

  const mockUseQuery = jest.fn((queryKey: any, queryFn: any, options: any) => ({
    queryKey,
    queryFn,
    options,
  }))
  const mockUseMutation = jest.fn((mutationFn: any, options: any) => ({
    mutationFn,
    options,
  }))
  const mockGetData = jest.fn(async () => ({
    users: [{ id: 1 }],
    clients: [{ id: 2 }],
    assigned_clients: [{ id: 3 }],
    body_measurements: [{ id: 4 }],
    body_compositions: [{ id: 5 }],
    vitals: [{ id: 6 }],
    monthly_reports: [{ id: 7 }],
    reminders: [{ id: 8 }],
    meta: {
      total_count: 9,
      total_pages: 2,
      current_page: 1,
    },
    pagination: {
      total_count: 10,
      total_pages: 3,
      current_page: 2,
    },
    threshold_days: 11,
  }))
  const mockPostData = jest.fn(async () => ({ message: 'ok', data: {} }))
  const mockDeleteData = jest.fn(async () => ({ deleted: true }))
  const mockUpdateFromData = jest.fn(async () => ({ message: 'updated', data: {} }))
  const mockUpdateData = jest.fn(async () => ({ message: 'patched', data: {} }))
  const mockParseQueryParams = jest.fn(() => '?page=1')
  const mockGetErrorMessage = jest.fn(() => 'parsed-error')
  const mockEnqueueSnackbar = jest.fn()

  jest.doMock('@tanstack/react-query', () => ({
    useQuery: mockUseQuery,
    useMutation: mockUseMutation,
  }))

  jest.doMock('../../../apis/api.helpers', () => ({
    getData: mockGetData,
    postData: mockPostData,
    deleteData: mockDeleteData,
    updateFromData: mockUpdateFromData,
    updateData: mockUpdateData,
  }))

  jest.doMock('../../../apis/api.url', () => ({
    __esModule: true,
    default: {
      ADMIN_USER: '/admin/users',
      NUTRITIONIST_USER: '/nutritionist/users',
      SUBSCRIPTION_CALENDAR: '/subscription-calendar',
      SUBSCRIPTIONS: '/subscriptions',
      SUBSCRIPTION_HISTORY: '/subscription-history',
      CLIENT_REPORTS: '/client-reports',
      USER_MEAL_TIMINGS: '/user-meal-timings',
      INACTIVE_USERS: '/inactive-users',
      ASSIGNED_CLIENTS: '/assigned-clients',
      BODY_MEASUREMENTS: '/body-measurements',
      BODY_COMPOSITION: '/body-composition',
      VITALS: '/vitals',
      USER_REMINDERS: '/user-reminders',
    },
  }))

  jest.doMock('../../../utilities/parsers', () => ({
    parseQueryParams: mockParseQueryParams,
    getErrorMessage: mockGetErrorMessage,
  }))

  jest.doMock('../../../store/authStore', () => ({
    useAuthStore: (selector: any) => selector({ roleData: { name: role } }),
  }))

  jest.doMock('../../../components/common/snackbar', () => ({
    useSnackbarManager: () => ({ enqueueSnackbar: mockEnqueueSnackbar }),
  }))

  const api = require('../api')

  return {
    api,
    mockUseQuery,
    mockUseMutation,
    mockGetData,
    mockPostData,
    mockDeleteData,
    mockUpdateFromData,
    mockUpdateData,
    mockParseQueryParams,
    mockGetErrorMessage,
    mockEnqueueSnackbar,
  }
}

describe('AdminUser api', () => {
  it('calls REST helpers for direct API wrappers', async () => {
    const {
      api,
      mockGetData,
      mockPostData,
      mockDeleteData,
      mockUpdateFromData,
      mockUpdateData,
    } = setupApiModule()

    await api.yogaOverridesBulk('sub-1', { yoga_plan_id: 1, exercises: [] })
    await api.deActivateAdmin('1')
    await api.activateAdmin('2')
    await api.deleteAdmin('3')
    await api.getAdminDetails('4')
    await api.getActivePlanOverview('5')
    await api.getOverviewDetail('6', '2026-06-02')
    await api.getOverviewDetail('6', '')
    await api.freezeSubscription('7', { reason: 'Hold' })
    await api.unfreezeSubscription('8', { reason: 'Resume' })
    await api.workoutOverridesBulk('9', {
      workout_plan_id: 10,
      exercises: [{ workout_id: 1, sequence_number: 1, reps: 12 }],
    })
    await api.meditationOverridesBulk('10', {
      plan_id: 11,
      meditations: [{ meditation_id: 2, sequence_number: 1 }],
    })
    await api.assignDietPlanTemplate('11', { diet_plan_template_id: 12 })
    await api.freezeUser('13', {
      reason: 'Pause',
      start_date: '2026-06-02',
      end_date: '2026-06-03',
    })
    await api.unfreezeUser('14')
    await api.createAdmin({ user: { name: 'Alex' } })
    await api.updateTask({ id: '15', data: { name: 'Chris' } })
    await api.getRoles()
    await api.updatePassword('16', 'secret')
    await api.createSubscription({ plan: 'Gold' })
    await api.sendAdminInvitation('17')
    await api.createAssignedClient({ admin_id: 1, user_id: 2 })
    await api.deleteAssignedClient('18')
    await api.createClientReport({ user_id: 3, month: 6, year: 2026 })
    await api.updateUserMealTiming(19, {
      user_meal_timing: {
        meal_time: 'Breakfast',
        time: '08:30',
        diet_plan_template_id: 20,
        subscription_id: 21,
        sequence_number: 1,
      },
    })
    await api.getSubscriptionReport('22')
    await api.getUserAdditionalData('23', '24')
    await api.getUserAdditionalData('23')
    await api.saveUserAdditionalData('25', { note: 'hello' }, '26')
    await api.saveUserAdditionalData('25', { note: 'hello' })
    await api.updateUserAdditionalData('27', { score: 1 }, '28')

    expect(mockPostData).toHaveBeenCalledWith(
      '/subscriptions/sub-1/user_specific_yogas',
      { yoga_plan_id: 1, exercises: [] }
    )
    expect(mockPostData).toHaveBeenCalledWith('/admin/users/1/deactivate', {})
    expect(mockPostData).toHaveBeenCalledWith('/admin/users/2/activate', {})
    expect(mockDeleteData).toHaveBeenCalledWith('/admin/users/3')
    expect(mockGetData).toHaveBeenCalledWith('/admin/users/4')
    expect(mockGetData).toHaveBeenCalledWith(
      '/subscription-calendar/6/active_plan_day?date=2026-06-02'
    )
    expect(mockGetData).toHaveBeenCalledWith(
      '/subscription-calendar/6/active_plan_day'
    )
    expect(mockUpdateFromData).toHaveBeenCalledWith('/admin/users/15', {
      name: 'Chris',
    })
    expect(mockUpdateFromData).toHaveBeenCalledWith(
      '/admin/users/16/change_password',
      'secret'
    )
    expect(mockUpdateData).toHaveBeenCalledWith(
      '/subscription-calendar/27/additional_data/28',
      {
        additional_data: { score: 1 },
      }
    )
  })

  it('wires query hooks and fetchers for the admin role', async () => {
    const { api, mockUseQuery, mockGetData } = setupApiModule({ role: 'admin' })

    api.useAdminUser({ page: 1 })
    api.useAssignedClients({ admin_id: '3', page: 1 })
    api.useBodyMeasurements({ user_id: '4', page: 1 })
    api.useBodyCompositions({ user_id: '5', page: 1 })
    api.useVitals({ user_id: '6', page: 1 })
    api.useClientReports({ user_id: '7', page: 1 })
    api.useUserReminders({ userId: '8' })
    api.useSubscriptionReport('9', { enabled: false })
    api.useSubscriptionReport('9')
    api.useUserSubscriptionHistory('10', { page: 3, per_page: 20 })
    api.useInactiveUsers({ page: 1 })

    const calls = mockUseQuery.mock.calls

    expect(calls[0][0]).toEqual(['admin_user_list', { page: 1 }, 'admin'])
    expect(calls[1][2]).toEqual({ enabled: true })
    expect(calls[2][2]).toEqual({ enabled: true })
    expect(calls[3][2]).toEqual({ enabled: true })
    expect(calls[4][2]).toEqual({ enabled: true })
    expect(calls[5][2]).toEqual({ enabled: true })
    expect(calls[6][2]).toEqual({ enabled: true })
    expect(calls[7][2]).toEqual({ enabled: false })
    expect(calls[8][2]).toEqual({ enabled: true })
    expect(calls[9][2]).toEqual({ enabled: true })
    expect(calls[10][2]).toEqual({ enabled: true })

    await calls[0][1]()
    await calls[1][1]()
    await calls[2][1]()
    await calls[3][1]()
    await calls[4][1]()
    await calls[5][1]()
    await calls[6][1]()
    await calls[7][1]()
    await calls[8][1]()
    await calls[9][1]()
    await calls[10][1]()

    expect(mockGetData).toHaveBeenCalledWith('/admin/users?page=1')
    expect(mockGetData).toHaveBeenCalledWith('/assigned-clients?page=1')
    expect(mockGetData).toHaveBeenCalledWith('/body-measurements?page=1')
    expect(mockGetData).toHaveBeenCalledWith('/body-composition?page=1')
    expect(mockGetData).toHaveBeenCalledWith('/vitals?page=1')
    expect(mockGetData).toHaveBeenCalledWith('/client-reports?page=1')
    expect(mockGetData).toHaveBeenCalledWith('/user-reminders?page=1')
    expect(mockGetData).toHaveBeenCalledWith('/subscriptions/9/report')
    expect(mockGetData).toHaveBeenCalledWith('/subscription-history?page=1')
    expect(mockGetData).toHaveBeenCalledWith('/inactive-users?page=1')
  })

  it('uses the nutritionist endpoint for nutritionist users', async () => {
    const { api, mockUseQuery, mockGetData } = setupApiModule({
      role: 'nutritionist',
    })

    api.useAdminUser({ page: 2, search: 'sam' })
    const [, queryFn] = mockUseQuery.mock.calls[0]
    await queryFn()

    expect(mockGetData).toHaveBeenCalledWith('/nutritionist/users?page=1')
  })

  it('handles create-admin mutation success and error branches', () => {
    const { api, mockUseMutation, mockEnqueueSnackbar } = setupApiModule()
    const handleSubmission = jest.fn()

    api.useCreateAdmin(handleSubmission)
    const [, options] = mockUseMutation.mock.calls[0]

    options.onSuccess(
      { data: { user: { role: 'nutritionist' } } },
      { user: { role: 'nutritionist' } }
    )
    options.onSuccess(
      { data: { user: { role: 'user' } } },
      { user: { role: 'user' } }
    )
    options.onError({
      response: { data: { detail: 'bad request' } },
    })
    options.onError({
      response: {
        data: { errors: ['Email has already been taken'] },
      },
    })

    expect(handleSubmission).toHaveBeenCalledTimes(2)
    expect(mockEnqueueSnackbar).toHaveBeenCalledWith(
      'Nutritionist created successfully',
      { variant: 'success' }
    )
    expect(mockEnqueueSnackbar).toHaveBeenCalledWith(
      'Client created successfully',
      { variant: 'success' }
    )
    expect(mockEnqueueSnackbar).toHaveBeenCalledWith('parsed-error', {
      variant: 'error',
    })
  })

  it('handles update-admin mutation success and error branches', () => {
    const { api, mockUseMutation, mockEnqueueSnackbar } = setupApiModule()
    const handleSubmission = jest.fn()

    api.useUpdateAdmin(handleSubmission)
    const [, options] = mockUseMutation.mock.calls[0]

    options.onSuccess({ data: { value: 1, message: 'Saved' } })
    options.onError({
      response: { data: { detail: 'detail error' } },
    })
    options.onError({
      response: { data: { error: 'plain error' } },
    })
    options.onError({
      response: {
        data: { errors: ['Email has already been taken'] },
      },
    })

    expect(handleSubmission).toHaveBeenCalledWith({ value: 1, message: 'Saved' })
    expect(mockEnqueueSnackbar).toHaveBeenCalledWith('Saved', {
      variant: 'success',
    })
    expect(mockEnqueueSnackbar).toHaveBeenCalledWith('parsed-error', {
      variant: 'error',
    })
  })

  it('handles update-user-meal-timing mutation success and error branches', async () => {
    const { api, mockUseMutation, mockEnqueueSnackbar, mockGetErrorMessage } =
      setupApiModule()
    const onSuccess = jest.fn()

    api.useUpdateUserMealTiming(onSuccess)
    const [mutationFn, options] = mockUseMutation.mock.calls[0]

    await mutationFn({
      userId: '31',
      payload: {
        user_meal_timing: {
          meal_time: 'Lunch',
          time: '13:00',
          diet_plan_template_id: 1,
          subscription_id: 2,
          sequence_number: 2,
        },
      },
    })

    options.onSuccess()
    options.onError({ message: 'failed' })

    expect(mockEnqueueSnackbar).toHaveBeenCalledWith(
      'Meal time updated successfully',
      { variant: 'success' }
    )
    expect(onSuccess).toHaveBeenCalled()
    expect(mockGetErrorMessage).toHaveBeenCalledWith({ message: 'failed' })
    expect(mockEnqueueSnackbar).toHaveBeenCalledWith('parsed-error', {
      variant: 'error',
    })
  })
})
