import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  deleteData,
  getData,
  postData,
  updateData,
} from '../../apis/api.helpers'
import apiUrl from '../../apis/api.url'
import { QueryParams } from '../../common/types'
import { useSnackbarManager } from '../../components/common/snackbar'
import { getErrorMessage, parseQueryParams } from '../../utilities/parsers'

const buildUrlWithParams = (baseUrl: string, params: QueryParams) => {
  return `${baseUrl}${parseQueryParams(params)}`
}

const fetchDietTemplateCategories = async (input: QueryParams) => {
  const url = buildUrlWithParams(apiUrl.TEMPLATE_CATEGORIES, { ...input })
  return getData(url)
}

export const useDietTemplateCategories = (input: QueryParams) => {
  return useQuery(['diet_template_categories_list', input], () =>
    fetchDietTemplateCategories(input)
  )
}

export const createDietTemplateCategory = (payload: any) => {
  return postData(apiUrl.TEMPLATE_CATEGORIES, payload)
}

export const updateDietTemplateCategory = (
  id: string | number,
  payload: any
) => {
  return updateData(`${apiUrl.TEMPLATE_CATEGORIES}/${id}`, payload)
}

export const deleteDietTemplateCategory = (id: string | number) => {
  return deleteData(`${apiUrl.TEMPLATE_CATEGORIES}/${id}`)
}

const getApiMessage = (error: any, fallback: string) => {
  return (
    error?.response?.data?.errors?.[0] ||
    error?.response?.data?.message ||
    getErrorMessage(error) ||
    fallback
  )
}

export const useCreateDietTemplateCategory = () => {
  const { enqueueSnackbar } = useSnackbarManager()
  const queryClient = useQueryClient()

  return useMutation(createDietTemplateCategory, {
    onSuccess: () => {
      enqueueSnackbar('Diet plan category created successfully', {
        variant: 'success',
      })
      queryClient.invalidateQueries({
        queryKey: ['diet_template_categories_list'],
      })
    },
    onError: (error: any) => {
      enqueueSnackbar(
        getApiMessage(error, 'Failed to create diet plan category'),
        {
          variant: 'error',
        }
      )
    },
  })
}

export const useUpdateDietTemplateCategory = () => {
  const { enqueueSnackbar } = useSnackbarManager()
  const queryClient = useQueryClient()

  return useMutation(
    ({ id, payload }: { id: string | number; payload: any }) =>
      updateDietTemplateCategory(id, payload),
    {
      onSuccess: () => {
        enqueueSnackbar('Diet plan category updated successfully', {
          variant: 'success',
        })
        queryClient.invalidateQueries({
          queryKey: ['diet_template_categories_list'],
        })
      },
      onError: (error: any) => {
        enqueueSnackbar(
          getApiMessage(error, 'Failed to update diet plan category'),
          {
            variant: 'error',
          }
        )
      },
    }
  )
}

export const useDeleteDietTemplateCategory = () => {
  const { enqueueSnackbar } = useSnackbarManager()
  const queryClient = useQueryClient()

  return useMutation(deleteDietTemplateCategory, {
    onSuccess: () => {
      enqueueSnackbar('Diet plan category deleted successfully', {
        variant: 'success',
      })
      queryClient.invalidateQueries({
        queryKey: ['diet_template_categories_list'],
      })
    },
    onError: (error: any) => {
      enqueueSnackbar(
        getApiMessage(error, 'Failed to delete diet plan category'),
        {
          variant: 'error',
        }
      )
    },
  })
}
