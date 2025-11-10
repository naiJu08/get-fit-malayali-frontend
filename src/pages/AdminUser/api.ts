import { useQuery } from '@tanstack/react-query'
import { useMutation } from '@tanstack/react-query'

import {
  getData,
  postData,
  updateFromData,
  deleteData,
} from '../../apis/api.helpers'
import apiUrl from '../../apis/api.url'
import { QueryParams } from '../../common/types'
import { useSnackbarManager } from '../../components/common/snackbar'
import { getErrorMessage, parseQueryParams } from '../../utilities/parsers'

// Disable non-login APIs (employees, groups) for this build
export const DISABLE_NONLOGIN_APIS = false

const buildUrlWithParams = (baseUrl: string, params: QueryParams) => {
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

export const useAdminUser = (
  input: QueryParams,
  options?: { enabled?: boolean }
) => {
  return useQuery(['admin_user_list', input], () => fetchData(input), {
    enabled: !DISABLE_NONLOGIN_APIS && (options?.enabled ?? true),
  })
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
    onSuccess: (res: any) => {
      handleSubmission(res.data)
      enqueueSnackbar('Admin created successfully', { variant: 'success' })
    },

    onError: (error: any) => {
      enqueueSnackbar(
        getErrorMessage(
          error.response.data.error || error?.response?.data?.detail
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
      // enqueueSnackbar(getErrorMessage(error.response.data.error), {
      //   variant: 'error',
      // })
      enqueueSnackbar(
        error?.response?.data?.detail
          ? getErrorMessage(error?.response?.data?.detail)
          : error?.response?.data?.message,
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
