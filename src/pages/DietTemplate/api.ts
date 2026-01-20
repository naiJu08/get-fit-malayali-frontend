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
  const url = buildUrlWithParams(apiUrl.DIET_TEMPLATE, {
    ...input,
  })
  const response = await getData(url)
  return response
}
export const useTemplateList = (input: QueryParams) => {
  return useQuery(['diet_template_list', input], () => fetchData(input))
}
export const deActivateAdmin = (id?: string) => {
  return updateFromData(`${apiUrl.ADMIN_USER}/${id}/status`, {})
}
export const deleteAdmin = (id?: string) => {
  return deleteData(`${apiUrl.ADMIN_USER}/${id}`)
}
export const getTemplateDetails = (id: string) => {
  return getData(`${apiUrl.DIET_TEMPLATE}/${id}`)
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

export const createTemplate = (input: any) => {
  return postFormData(`${apiUrl.DIET_TEMPLATE}`, input)
}

export const useCreateTemplate = (handleSubmission: (data: any) => void) => {
  const { enqueueSnackbar } = useSnackbarManager()
  return useMutation(createTemplate, {
    onSuccess: (res: any) => {
      handleSubmission(res.data)
      enqueueSnackbar('Template created successfully', { variant: 'success' })
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
export const deleteTemplate = (id: string) => {
  return deleteData(`${apiUrl.DIET_TEMPLATE}/${id}`)
}
export const useDeleteTemplate = (handleSubmission?: (data: any) => void) => {
  const { enqueueSnackbar } = useSnackbarManager()
  return useMutation(deleteTemplate, {
    onSuccess: (res: any) => {
      const message =
        res?.data?.message ||
        res?.message ||
        'Diet template deleted successfully'
      if (handleSubmission) {
        handleSubmission(res.data ?? res)
      }
      enqueueSnackbar(message, { variant: 'success' })
    },

    onError: (error: any) => {
      enqueueSnackbar(
        error?.response?.data?.detail
          ? getErrorMessage(error?.response?.data?.detail)
          : error?.response?.message,
        {
          variant: 'error',
        }
      )
    },
  })
}
export const updateTemplate = ({ id, data }: any) => {
  return updateFromData(`${apiUrl.DIET_TEMPLATE}/${id}`, data)
}
export const useUpdateTemplate = (handleSubmission: (data: any) => void) => {
  const { enqueueSnackbar } = useSnackbarManager()
  return useMutation(updateTemplate, {
    onSuccess: (res: any) => {
      handleSubmission(res.data)
      enqueueSnackbar('Template updated successfully', { variant: 'success' })
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
