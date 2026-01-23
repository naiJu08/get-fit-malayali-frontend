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
  const url = buildUrlWithParams(apiUrl.MEDITATION, {
    ...input,
  })
  const response = await getData(url)
  return response
}
export const useMeditationList = (
  input: QueryParams,
  options?: Parameters<typeof useQuery>[2]
) => {
  return useQuery(['meditation_list', input], () => fetchData(input), options)
}
export const deActivateAdmin = (id?: string) => {
  return updateFromData(`${apiUrl.ADMIN_USER}/${id}/status`, {})
}
export const deleteAdmin = (id?: string) => {
  return deleteData(`${apiUrl.ADMIN_USER}/${id}`)
}
export const getMeditationDetails = (id: string) => {
  return getData(`${apiUrl.MEDITATION}/${id}`)
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

export const createMeditation = (input: any) => {
  return postFormData(`${apiUrl.MEDITATION}`, input)
}

export const useCreateMeditation = (handleSubmission: (data: any) => void) => {
  const { enqueueSnackbar } = useSnackbarManager()
  return useMutation(createMeditation, {
    onSuccess: (res: any) => {
      handleSubmission(res.data)
      enqueueSnackbar('Meditation created successfully', { variant: 'success' })
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
export const deleteMeditation = (id: string) => {
  return deleteData(`${apiUrl.MEDITATION}/${id}`)
}
export const useDeleteMeditation = (handleSubmission?: (data: any) => void) => {
  const { enqueueSnackbar } = useSnackbarManager()
  return useMutation(deleteMeditation, {
    onSuccess: (res: any) => {
      const message =
        res?.data?.message || res?.message || 'Meditation deleted successfully'
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
export const updateMeditation = ({ id, data }: any) => {
  return updateFromData(`${apiUrl.MEDITATION}/${id}`, data)
}
export const useUpdateMeditation = (handleSubmission: (data: any) => void) => {
  const { enqueueSnackbar } = useSnackbarManager()
  return useMutation(updateMeditation, {
    onSuccess: (res: any) => {
      handleSubmission(res.data)
      enqueueSnackbar('Meditation updated successfully', { variant: 'success' })
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
