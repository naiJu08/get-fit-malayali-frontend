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
  const url = buildUrlWithParams(apiUrl.WORKOUTS, {
    ...input,
  })
  const response = await getData(url)
  return response
}
export const useWorkoutList = (
  input: QueryParams,
  options?: Parameters<typeof useQuery>[2]
) => {
  return useQuery(['workout_list', input], () => fetchData(input), options)
}
export const deActivateAdmin = (id?: string) => {
  return updateFromData(`${apiUrl.ADMIN_USER}/${id}/status`, {})
}
export const deleteAdmin = (id?: string) => {
  return deleteData(`${apiUrl.ADMIN_USER}/${id}`)
}
export const getWorkoutDetails = (id: string) => {
  return getData(`${apiUrl.WORKOUTS}/${id}`)
}

export const deleteWorkout = (id: string | number) => {
  return deleteData(`${apiUrl.WORKOUTS}/${id}`)
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

export const createWorkout = (input: any) => {
  return postFormData(`${apiUrl.WORKOUTS}`, input)
}

export const useCreateWorkout = (handleSubmission: (data: any) => void) => {
  const { enqueueSnackbar } = useSnackbarManager()
  return useMutation(createWorkout, {
    onSuccess: (res: any) => {
      handleSubmission(res.data)
      enqueueSnackbar('Workout created successfully', { variant: 'success' })
    },

    onError: (error: any) => {
      const errorData = error?.response?.data
      let errorMessage = 'Failed to create workout'

      if (
        errorData?.errors &&
        Array.isArray(errorData.errors) &&
        errorData.errors.length > 0
      ) {
        errorMessage = errorData.errors.join(', ')
      } else if (errorData?.error) {
        errorMessage = errorData.error
      } else if (errorData?.detail) {
        errorMessage = errorData.detail
      } else if (typeof errorData === 'string') {
        errorMessage = errorData
      }

      enqueueSnackbar(errorMessage, {
        variant: 'error',
      })
    },
  })
}
export const updateWorkout = ({ id, data }: any) => {
  return updateFromData(`${apiUrl.WORKOUTS}/${id}`, data)
}
export const useUpdateWorkout = (handleSubmission: (data: any) => void) => {
  const { enqueueSnackbar } = useSnackbarManager()
  return useMutation(updateWorkout, {
    onSuccess: (res: any) => {
      handleSubmission(res.data)
      enqueueSnackbar('Workout updated successfully', { variant: 'success' })
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
