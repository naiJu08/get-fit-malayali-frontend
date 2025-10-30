import { useQuery } from '@tanstack/react-query'
import { useMutation } from '@tanstack/react-query'

import { getData, postData, updateFromData } from '../../apis/api.helpers'
import apiUrl from '../../apis/api.url'
import { QueryParams } from '../../common/types'
import { useSnackbarManager } from '../../components/common/snackbar'
import { getErrorMessage, parseQueryParams } from '../../utilities/parsers'

// Disable non-login APIs (employees, groups) for this build
export const DISABLE_NONLOGIN_APIS = true

const buildUrlWithParams = (baseUrl: string, params: QueryParams) => {
  return `${baseUrl}${parseQueryParams(params)}`
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
