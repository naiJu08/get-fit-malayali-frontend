import { useQuery } from '@tanstack/react-query'
import { useMutation } from '@tanstack/react-query'

import {
  getData,
  postData,
  updateData,
  updateFromData,
  deleteData,
} from '../../apis/api.helpers'
import apiUrl from '../../apis/api.url'
import { QueryParams } from '../../common/types'
import { useSnackbarManager } from '../../components/common/snackbar'
import { getErrorMessage, parseQueryParams } from '../../utilities/parsers'
import { useAuthStore } from '../../store/authStore'

// Disable non-login APIs (employees, groups) for this build
export const DISABLE_NONLOGIN_APIS = false

const buildUrlWithParams = (
  baseUrl: string,
  params: QueryParams | Record<string, any>
) => {
  return `${baseUrl}${parseQueryParams(params)}`
}

const fetchData = async (input: QueryParams) => {
  const url = buildUrlWithParams(apiUrl.ADMIN_USER, {
    ...input,
  })
  const response = await getData(url)
  return {
    items: response?.users || [],
    total: response?.meta?.total_count ?? 0,
    total_pages: response?.meta?.total_pages ?? 1,
    current_page: response?.meta?.current_page ?? 1,
  }
}

const fetchNutritionistUsers = async (input: QueryParams) => {
  const url = buildUrlWithParams(apiUrl.NUTRITIONIST_USER, {
    ...input,
  })
  const response = await getData(url)
  return {
    items: response?.clients || [],
    total: response?.meta?.total_count ?? 0,
    total_pages: response?.meta?.total_pages ?? 1,
    current_page: response?.meta?.current_page ?? 1,
  }
}

export const useAdminUser = (input: QueryParams) => {
  const roleName = useAuthStore((s) => s.roleData?.name?.toLowerCase?.())
  return useQuery(
    ['admin_user_list', input, roleName],
    () =>
      roleName === 'nutritionist'
        ? fetchNutritionistUsers(input)
        : fetchData(input),
    {
      enabled: !DISABLE_NONLOGIN_APIS,
    }
  )
}

export const yogaOverridesBulk = (
  subscriptionId: string | number,
  payload: {
    yoga_plan_id: number | string
    exercises: Array<{
      yoga_id: number | string
      sequence_number: number
    }>
  }
) => {
  return postData(
    `${apiUrl.SUBSCRIPTIONS}/${subscriptionId}/user_specific_yogas`,
    payload
  )
}

export const deActivateAdmin = (id?: string) => {
  return updateFromData(`${apiUrl.ADMIN_USER}/${id}/status`, {})
}
export const deleteAdmin = (id?: string) => {
  return deleteData(`${apiUrl.ADMIN_USER}/${id}`)
}

export const getAdminDetails = (id: string) => {
  return getData(`${apiUrl.ADMIN_USER}/${id}`)
}

export const getActivePlanOverview = (id: string | number) => {
  return getData(`${apiUrl.SUBSCRIPTION_CALENDAR}/${id}/active_plan_overview`)
}
export const getOverviewDetail = (id: string | number, date: string) => {
  const q = date ? `?date=${encodeURIComponent(date)}` : ''
  return getData(`${apiUrl.SUBSCRIPTION_CALENDAR}/${id}/active_plan_day${q}`)
}
export const freezeSubscription = (
  id: string,
  payload?: { reason?: string; start_date?: string; end_date?: string }
) => {
  return postData(`${apiUrl.SUBSCRIPTIONS}/${id}/freeze`, payload)
}

export const unfreezeSubscription = (
  id: string | number,
  payload?: {
    reason?: string
    start_date?: string
    end_date?: string
    unfreeze_dates?: string[]
  }
) => {
  return postData(`${apiUrl.SUBSCRIPTIONS}/${id}/unfreeze`, payload)
}
export const workoutOverridesBulk = (
  subscriptionId: string | number,
  payload: {
    workout_plan_id: number | string
    exercises: Array<{
      workout_id: number | string
      sequence_number: number
      reps: number
    }>
  }
) => {
  return postData(
    `${apiUrl.SUBSCRIPTIONS}/${subscriptionId}/user_specific_exercises`,
    payload
  )
}

export const meditationOverridesBulk = (
  subscriptionId: string | number,
  payload: {
    plan_id: number | string
    meditations: Array<{
      meditation_id: number | string
      sequence_number: number
    }>
  }
) => {
  return postData(
    `${apiUrl.SUBSCRIPTIONS}/${subscriptionId}/user_specific_meditations`,
    payload
  )
}

export const assignDietPlanTemplate = (
  subscriptionId: string | number,
  payload: { diet_plan_template_id: number }
) => {
  return postData(
    `${apiUrl.SUBSCRIPTIONS}/${subscriptionId}/assign_diet_plan_template`,
    payload
  )
}
export const freezeUser = (
  id: string,
  payload: { reason: string; start_date: string; end_date: string }
) => {
  return postData(`${apiUrl.ADMIN_USER}/${id}/freeze`, payload)
}

export const unfreezeUser = (id: string) => {
  return postData(`${apiUrl.ADMIN_USER}/${id}/unfreeze`, {})
}

export const createAdmin = (input: any) => {
  return postData(`${apiUrl.ADMIN_USER}`, input)
}
export const useCreateAdmin = (handleSubmission: (data: any) => void) => {
  const { enqueueSnackbar } = useSnackbarManager()
  return useMutation(createAdmin, {
    onSuccess: (res: any, variables: any) => {
      handleSubmission(res.data)

      // Try to detect role from request payload first, then from response
      const roleFromPayload = variables?.user?.role
      const roleFromResponse =
        res?.data?.user?.role ?? res?.data?.user?.group?.id ?? res?.data?.role
      const role = roleFromPayload ?? roleFromResponse

      const isNutritionist =
        role === 2 ||
        role === '2' ||
        (typeof role === 'string' && role.toLowerCase() === 'nutritionist')

      const message = isNutritionist
        ? 'Nutritionist created successfully'
        : 'Client created successfully'

      enqueueSnackbar(message, { variant: 'success' })
    },

    onError: (error: any) => {
      const data = error?.response?.data as any
      const isDuplicateEmail =
        Array.isArray(data?.errors) &&
        data.errors.some((m: any) =>
          String(m || '')
            .toLowerCase()
            .includes('email has already been taken')
        )
      if (isDuplicateEmail) return

      enqueueSnackbar(
        getErrorMessage(
          data?.error || data?.detail || data?.errors || data?.message
        ),
        {
          variant: 'error',
        }
      )
    },
  })
}
export const updateTask = ({ id, data }: any) => {
  return updateFromData(`${apiUrl.ADMIN_USER}/${id}`, data)
}
export const useUpdateAdmin = (handleSubmission: (data: any) => void) => {
  const { enqueueSnackbar } = useSnackbarManager()
  return useMutation(updateTask, {
    onSuccess: (res: any) => {
      handleSubmission(res.data)
      enqueueSnackbar('Details updated successfully', { variant: 'success' })
    },

    onError: (error: any) => {
      const data = error?.response?.data as any
      const isDuplicateEmail =
        Array.isArray(data?.errors) &&
        data.errors.some((m: any) =>
          String(m || '')
            .toLowerCase()
            .includes('email has already been taken')
        )
      if (isDuplicateEmail) return

      // enqueueSnackbar(getErrorMessage(error.response.data.error), {
      //   variant: 'error',
      // })
      enqueueSnackbar(
        data?.detail
          ? getErrorMessage(data?.detail)
          : getErrorMessage(data?.error || data?.errors || data?.message),
        {
          variant: 'error',
        }
      )
    },
  })
}
export const getRoles = () => {
  return Promise.resolve({ items: [], total: 0 })
}
export const updatePassword = (employee: string, data: string) => {
  return updateFromData(
    `${apiUrl.ADMIN_USER}/${employee}/change_password`,
    data
  )
}

// Subscriptions
export const createSubscription = (payload: any) => {
  return postData(`${apiUrl.SUBSCRIPTIONS}`, payload)
}

export const sendAdminInvitation = (id?: string) => {
  return postData(`${apiUrl.ADMIN_USER}/${id}/invite`, {})
}

// Assigned Clients (for Nutritionist)
const fetchAssignedClients = async (
  input: QueryParams & { admin_id?: string | number }
) => {
  const url = buildUrlWithParams(apiUrl.ASSIGNED_CLIENTS, {
    ...input,
  })
  const response = await getData(url)
  return {
    items: response?.assigned_clients || [],
    total: response?.meta?.total_count ?? 0,
    total_pages: response?.meta?.total_pages ?? 1,
    current_page: response?.meta?.current_page ?? 1,
  }
}

export const useAssignedClients = (
  input: QueryParams & { admin_id?: string | number }
) => {
  return useQuery(
    ['assigned_clients', input],
    () => fetchAssignedClients(input),
    {
      enabled: !!input?.admin_id,
    }
  )
}

export const createAssignedClient = (payload: {
  admin_id: number | string
  user_id: number | string
}) => {
  return postData(`${apiUrl.ASSIGNED_CLIENTS}`, {
    assigned_client: payload,
  } as any)
}

export const deleteAssignedClient = (id: string | number) => {
  return deleteData(`${apiUrl.ASSIGNED_CLIENTS}/${id}`)
}

// Body Measurements (Client)
const fetchBodyMeasurements = async (
  input: QueryParams & { user_id?: string | number }
) => {
  const url = buildUrlWithParams(apiUrl.BODY_MEASUREMENTS, {
    ...input,
  })
  const response = await getData(url)
  return {
    items: response?.body_measurements || [],
    total: response?.meta?.total_count ?? 0,
    total_pages: response?.meta?.total_pages ?? 1,
    current_page: response?.meta?.current_page ?? 1,
  }
}

export const useBodyMeasurements = (
  input: QueryParams & { user_id?: string | number }
) => {
  return useQuery(
    ['body_measurements', input],
    () => fetchBodyMeasurements(input),
    {
      enabled: !!input?.user_id,
    }
  )
}

// Body Compositions (Client)
const fetchBodyCompositions = async (
  input: QueryParams & { user_id?: string | number }
) => {
  const url = buildUrlWithParams(apiUrl.BODY_COMPOSITION, {
    ...input,
  })
  const response = await getData(url)
  return {
    items: response?.body_compositions || [],
    total: response?.meta?.total_count ?? 0,
    total_pages: response?.meta?.total_pages ?? 1,
    current_page: response?.meta?.current_page ?? 1,
  }
}

export const useBodyCompositions = (
  input: QueryParams & { user_id?: string | number }
) => {
  return useQuery(
    ['body_compositions', input],
    () => fetchBodyCompositions(input),
    {
      enabled: !!input?.user_id,
    }
  )
}

// Vitals (Client)
const fetchVitals = async (
  input: QueryParams & { user_id?: string | number }
) => {
  const url = buildUrlWithParams(apiUrl.VITALS, {
    ...input,
  })
  const response = await getData(url)
  return {
    items: response?.vitals || [],
    total: response?.meta?.total_count ?? 0,
    total_pages: response?.meta?.total_pages ?? 1,
    current_page: response?.meta?.current_page ?? 1,
  }
}

export const useVitals = (
  input: QueryParams & { user_id?: string | number }
) => {
  return useQuery(['vitals', input], () => fetchVitals(input), {
    enabled: !!input?.user_id,
  })
}

// Client Monthly Reports
const fetchClientReports = async (
  input: QueryParams & { user_id?: string | number }
) => {
  const url = buildUrlWithParams(apiUrl.CLIENT_REPORTS, {
    ...input,
  })
  const response = await getData(url)
  return {
    items: response?.monthly_reports || [],
    total: response?.meta?.total_count ?? 0,
    total_pages: response?.meta?.total_pages ?? 1,
    current_page: response?.meta?.current_page ?? 1,
  }
}

export const useClientReports = (
  input: QueryParams & { user_id?: string | number }
) => {
  return useQuery(['client_reports', input], () => fetchClientReports(input), {
    enabled: !!input?.user_id,
  })
}

export const createClientReport = (payload: {
  user_id: number | string
  month: number
  year: number
}) => {
  return postData(`${apiUrl.CLIENT_REPORTS}`, payload)
}

// User reminders
const fetchUserReminders = async (input: { user_id: string | number }) => {
  const url = buildUrlWithParams(apiUrl.USER_REMINDERS, {
    user_id: input.user_id,
  })

  const response: any = await getData(url)

  const items = Array.isArray(response?.reminders) ? response.reminders : []

  const meta = response?.meta ?? {}

  return { items, meta }
}

export const useUserReminders = ({ userId }: { userId?: string | number }) => {
  return useQuery(
    ['user_reminders', userId],
    () =>
      fetchUserReminders({
        user_id: userId!,
      }),
    {
      enabled: !!userId,
    }
  )
}

// Subscription-level report
export const getSubscriptionReport = (subscriptionId: string | number) => {
  return getData(`${apiUrl.SUBSCRIPTIONS}/${subscriptionId}/report`)
}

export const useSubscriptionReport = (
  subscriptionId?: string | number | null,
  options?: { enabled?: boolean }
) => {
  return useQuery(
    ['subscription_report', subscriptionId],
    () => getSubscriptionReport(subscriptionId as string | number),
    {
      enabled: !!subscriptionId && (options?.enabled ?? true),
    }
  )
}

export const getUserAdditionalData = (userId: string | number) => {
  return getData(`${apiUrl.SUBSCRIPTION_CALENDAR}/${userId}/additional_data`)
}

export const saveUserAdditionalData = (
  userId: string | number,
  payload: Record<string, any>
) => {
  return postData(`${apiUrl.SUBSCRIPTION_CALENDAR}/${userId}/additional_data`, {
    additional_data: payload,
  })
}

export const updateUserAdditionalData = (
  userId: string | number,
  payload: Record<string, any>
) => {
  return updateData(
    `${apiUrl.SUBSCRIPTION_CALENDAR}/${userId}/additional_data`,
    {
      additional_data: payload,
    }
  )
}
