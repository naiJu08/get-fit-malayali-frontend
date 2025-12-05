import { useMutation, useQuery } from '@tanstack/react-query'
import {
  getData,
  postData,
  updateFromData,
  deleteData,
} from '../../apis/api.helpers'
import apiUrl from '../../apis/api.url'
import { QueryParams } from '../../common/types'
import { parseQueryParams } from '../../utilities/parsers'
import { useSnackbarManager } from '../../components/common/snackbar'
import { getErrorMessage } from '../../utilities/parsers'

export const DISABLE_NONLOGIN_APIS = false

const buildUrlWithParams = (baseUrl: string, params: QueryParams) =>
  `${baseUrl}${parseQueryParams(params)}`

const fetchData = async (input: QueryParams) => {
  const url = buildUrlWithParams(apiUrl.SUBSCRIPTIONS, { ...input })
  const response = await getData(url)
  return {
    items: response?.items || response?.subscriptions || [],
    total: response?.meta?.total_count ?? 0,
    total_pages: response?.meta?.total_pages ?? 1,
    current_page: response?.meta?.current_page ?? 1,
  }
}

export const useSubscriptions = (input: QueryParams) => {
  return useQuery(['subscription_list', input], () => fetchData(input), {
    enabled: !DISABLE_NONLOGIN_APIS,
  })
}

export const getSubscriptionDetails = (id: string) =>
  getData(`${apiUrl.SUBSCRIPTIONS}/${id}`)

export const useSubscriptionDetails = (id?: string, enabled = true) => {
  return useQuery(
    ['subscription_details', id],
    () => getSubscriptionDetails(id as string),
    {
      enabled: !!id && enabled && !DISABLE_NONLOGIN_APIS,
    }
  )
}
export const createSubscription = (input: any) =>
  postData(`${apiUrl.SUBSCRIPTIONS}`, input)
export const updateSubscription = ({ id, data }: any) =>
  updateFromData(`${apiUrl.SUBSCRIPTIONS}/${id}`, data)
export const deleteSubscription = (id?: string) =>
  deleteData(`${apiUrl.SUBSCRIPTIONS}/${id}`)

export const freezeSubscription = (
  id: string,
  payload?: { reason?: string; start_date?: string; end_date?: string }
) => postData(`${apiUrl.SUBSCRIPTIONS}/${id}/freeze`, payload ?? {})

export const unfreezeSubscription = (id: string) =>
  postData(`${apiUrl.SUBSCRIPTIONS}/${id}/unfreeze`, {})

// Aliases to match AdminUser module API names so copied components work without refactor
export const useAdminUser = (input: QueryParams) => useSubscriptions(input)
export const getAdminDetails = (id: string) => getSubscriptionDetails(id)
export const deActivateAdmin = (id?: string) =>
  updateFromData(`${apiUrl.SUBSCRIPTIONS}/${id}/status`, {})
export const deleteAdmin = (id?: string) => deleteSubscription(id)
export const freezeUser = (
  id: string,
  payload?: { reason?: string; start_date?: string; end_date?: string }
) => freezeSubscription(id, payload)
export const unfreezeUser = (id: string) => unfreezeSubscription(id)

export const createAdmin = (input: any) => createSubscription(input)

export const updateTask = ({ id, data }: any) =>
  updateSubscription({ id, data })

export const useCreateAdmin = (handleSubmission: (data: any) => void) => {
  const { enqueueSnackbar } = useSnackbarManager()
  return useMutation(createAdmin, {
    onSuccess: (res: any) => {
      handleSubmission(res?.data)
      enqueueSnackbar('Subscription created successfully', {
        variant: 'success',
      })
    },
    onError: (error: any) => {
      enqueueSnackbar(
        getErrorMessage(
          error?.response?.data?.error || error?.response?.data?.detail
        ),
        { variant: 'error' }
      )
    },
  })
}

export const useUpdateAdmin = (handleSubmission: (data: any) => void) => {
  const { enqueueSnackbar } = useSnackbarManager()
  return useMutation(updateTask, {
    onSuccess: (res: any) => {
      handleSubmission(res?.data)
      enqueueSnackbar('Details updated successfully', { variant: 'success' })
    },
    onError: (error: any) => {
      enqueueSnackbar(
        error?.response?.data?.detail
          ? getErrorMessage(error?.response?.data?.detail)
          : error?.response?.data?.message,
        { variant: 'error' }
      )
    },
  })
}

export const getRoles = () => Promise.resolve({ items: [], total: 0 })
export const updatePassword = (id: string, data: string) =>
  updateFromData(`${apiUrl.SUBSCRIPTIONS}/${id}/change_password`, data)

// Subscription plan overview (calendar) for a specific user/subscription
export const getSubscriptionPlanOverview = (
  userId: string | number,
  subscriptionId: string | number
) =>
  getData(
    `${apiUrl.SUBSCRIPTION_CALENDAR}/${userId}/subscriptions/${subscriptionId}/plan_overview`
  )

// Subscription plan day details for a specific user/subscription/date
export const getSubscriptionPlanDay = (
  userId: string | number,
  subscriptionId: string | number,
  date: string
) =>
  getData(
    `${apiUrl.SUBSCRIPTION_CALENDAR}/${userId}/subscriptions/${subscriptionId}/plan_day?date=${encodeURIComponent(
      date
    )}`
  )
export const sendAdminInvitation = (id?: string) =>
  postData(`${apiUrl.SUBSCRIPTIONS}/${id}/invite`, {})
