import { useQuery } from '@tanstack/react-query'
import { useMutation } from '@tanstack/react-query'

import {
  getData,
  postData,
  deleteData,
  updateData,
  updateFromData,
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
  const url = buildUrlWithParams(apiUrl.CATEGORIES, {
    ...input,
  })
  const response = await getData(url)
  return response
}
export const useCategoriesList = (input: QueryParams) => {
  return useQuery(['categories_list', input], () => fetchData(input))
}
export const getSubCategories = (
  parentId: string | number,
  input: QueryParams = { page: 1 } as QueryParams
) => {
  const params: QueryParams = {
    ...input,
    page: input.page ?? 1,
    parent_id: parentId,
  }
  const url = buildUrlWithParams(apiUrl.CATEGORIES, params)
  return getData(url)
}
export const deActivateAdmin = (id?: string) => {
  return updateFromData(`${apiUrl.ADMIN_USER}/${id}/status`, {})
}
export const deleteAdmin = (id?: string) => {
  return deleteData(`${apiUrl.ADMIN_USER}/${id}`)
}
export const getCategoriesDetails = (id: string) => {
  return getData(`${apiUrl.CATEGORIES}/${id}`)
}

export const deleteCategories = (id: string | number) => {
  return deleteData(`${apiUrl.CATEGORIES}/${id}`)
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

export const createCategories = (input: any) => {
  return postData(`${apiUrl.CATEGORIES}`, input)
}

export const useCreateCategories = (
  handleSubmission: (data: any) => void,
  successMessage = 'Categories created successfully'
) => {
  const { enqueueSnackbar } = useSnackbarManager()
  return useMutation(createCategories, {
    onSuccess: (res: any) => {
      handleSubmission(res)
      enqueueSnackbar(successMessage, { variant: 'success' })
    },

    onError: (error: any) => {
      const serverError =
        error?.response?.data?.errors ??
        error?.response?.data?.detail ??
        error?.response?.data?.message ??
        error?.response?.error ??
        error

      enqueueSnackbar(getErrorMessage(serverError), {
        variant: 'error',
      })
    },
  })
}
export const updateCategories = ({ id, data }: any) => {
  return updateData(`${apiUrl.CATEGORIES}/${id}`, data)
}
export const useUpdateCategories = (
  handleSubmission: (data: any) => void,
  successMessage = 'Category updated successfully'
) => {
  const { enqueueSnackbar } = useSnackbarManager()
  return useMutation(updateCategories, {
    onSuccess: (res: any) => {
      handleSubmission(res)
      enqueueSnackbar(successMessage, { variant: 'success' })
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
