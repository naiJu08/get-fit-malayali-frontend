import { useQuery } from '@tanstack/react-query'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import {
  getData,
  postData,
  updateFromData,
  deleteData,
  updateData,
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

const fetchPlans = async (input: QueryParams) => {
  const url = buildUrlWithParams(apiUrl.PLANS, {
    ...input,
  })
  const response = await getData(url)
  return response
}
export const usePlans = (input: QueryParams) => {
  return useQuery(['plans_list', input], () => fetchPlans(input))
}

// Fetch a single plan by id
export const getPlan = (id: string | number) => {
  return getData(`${apiUrl.PLANS}/${id}`)
}
export const usePlan = (id?: string | number) => {
  return useQuery(['plan_detail', id], () => getPlan(id as string | number), {
    enabled: !!id,
  })
}

// Create/Update plans
export const createPlan = (payload: any) => {
  return postData(`${apiUrl.PLANS}`, payload)
}
export const updatePlan = (id: string | number, payload: any) => {
  return updateData(`${apiUrl.PLANS}/${id}`, payload)
}
export const deletePlan = (id: string | number) => {
  return deleteData(`${apiUrl.PLANS}/${id}`)
}
export const useCreatePlan = () => {
  const { enqueueSnackbar } = useSnackbarManager()
  return useMutation(createPlan, {
    onSuccess: () => {
      enqueueSnackbar('Plan created successfully', { variant: 'success' })
    },
    onError: (error: any) => {
      enqueueSnackbar(
        error?.response?.data?.message || 'Failed to create plan',
        { variant: 'error' }
      )
    },
  })
}
export const useUpdatePlan = () => {
  const { enqueueSnackbar } = useSnackbarManager()
  const queryClient = useQueryClient()
  return useMutation(
    ({ id, payload }: { id: string | number; payload: any }) =>
      updatePlan(id, payload),
    {
      onSuccess: () => {
        enqueueSnackbar('Plan updated successfully', { variant: 'success' })
        queryClient.invalidateQueries(['plans_list'])
      },
      onError: (error: any) => {
        enqueueSnackbar(
          error?.response?.data?.message || 'Failed to update plan',
          { variant: 'error' }
        )
      },
    }
  )
}
const fetchData = async (input: QueryParams) => {
  const url = buildUrlWithParams(apiUrl.ADMIN_USER, {
    ...input,
  })
  const response = await getData(url)
  return response
}

export const useAdminUser = (input: QueryParams) => {
  return useQuery(['admin_user_list', input], () => fetchData(input), {
    enabled: !DISABLE_NONLOGIN_APIS,
  })
}
export const deActivateAdmin = (id?: string) => {
  return updateFromData(`${apiUrl.ADMIN_USER}/${id}/status`, {})
}
// export const deleteAdmin = (id?: string) => {
//   return deleteData(`${apiUrl.ADMIN_USER}/${id}`)
// }
export const getAdminDetails = (id: string) => {
  return getData(`${apiUrl.ADMIN_USER}/${id}`)
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

export const sendAdminInvitation = (id?: string) => {
  return postData(`${apiUrl.ADMIN_USER}/${id}/invite`, {})
}
