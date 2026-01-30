import { useQuery } from '@tanstack/react-query'
import { useMutation } from '@tanstack/react-query'

import {
  getData,
  postData,
  postFormData,
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
  const url = buildUrlWithParams(apiUrl.YOGA, {
    ...input,
  })
  const response = await getData(url)
  return response
}
export const useYogaList = (
  input: QueryParams,
  options?: Parameters<typeof useQuery>[2]
) => {
  return useQuery(['yoga_list', input], () => fetchData(input), options)
}
export const deActivateAdmin = (id?: string) => {
  return updateFromData(`${apiUrl.ADMIN_USER}/${id}/status`, {})
}
export const deleteAdmin = (id?: string) => {
  return deleteData(`${apiUrl.ADMIN_USER}/${id}`)
}
export const getYogaDetails = (id: string) => {
  return getData(`${apiUrl.YOGA}/${id}`)
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

export const createYoga = (input: any) => {
  return postFormData(`${apiUrl.YOGA}`, input)
}

export const useCreateYoga = (handleSubmission: (data: any) => void) => {
  const { enqueueSnackbar } = useSnackbarManager()
  return useMutation(createYoga, {
    onSuccess: (res: any) => {
      handleSubmission(res.data)
      enqueueSnackbar('Yoga created successfully', { variant: 'success' })
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
export const deleteYoga = (id: string) => {
  return deleteData(`${apiUrl.YOGA}/${id}`)
}
export const updateYoga = ({ id, data }: any) => {
  return updateFromData(`${apiUrl.YOGA}/${id}`, data)
}
export const useUpdateYoga = (handleSubmission: (data: any) => void) => {
  const { enqueueSnackbar } = useSnackbarManager()
  return useMutation(updateYoga, {
    onSuccess: (res: any) => {
      handleSubmission(res.data)
      enqueueSnackbar('Yoga updated successfully', { variant: 'success' })
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
