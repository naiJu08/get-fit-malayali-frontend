import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  deleteData,
  getData,
  postData,
  updateData,
} from '../../apis/api.helpers'
import apiUrl from '../../apis/api.url'
import { QueryParams } from '../../common/types'
import { getErrorMessage, parseQueryParams } from '../../utilities/parsers'
import { useSnackbarManager } from '../../components/common/snackbar'

const buildUrlWithParams = (baseUrl: string, params: QueryParams) => {
  return `${baseUrl}${parseQueryParams(params)}`
}

const fetchRecipes = async (input: QueryParams) => {
  const url = buildUrlWithParams(apiUrl.RECIPES, { ...input })
  const response = await getData(url)
  return response
}

export const useRecipes = (input: QueryParams) => {
  return useQuery(['recipes_list', input], () => fetchRecipes(input))
}

export const createRecipe = (payload: any) => {
  return postData(`${apiUrl.RECIPES}`, payload)
}

export const useCreateRecipe = () => {
  const { enqueueSnackbar } = useSnackbarManager()
  const queryClient = useQueryClient()
  return useMutation(createRecipe, {
    onSuccess: () => {
      enqueueSnackbar('Recipe created successfully', { variant: 'success' })
      queryClient.invalidateQueries({ queryKey: ['recipes_list'] })
    },
    onError: (error: any) => {
      const apiErrors = error?.response?.data?.errors
      const apiMessage = error?.response?.data?.message
      const normalizedMessage = Array.isArray(apiErrors)
        ? getErrorMessage(apiErrors)
        : getErrorMessage(apiMessage || error?.message)

      enqueueSnackbar(normalizedMessage || 'Failed to create recipe', {
        variant: 'error',
      })
    },
  })
}

export const updateRecipe = (id: string | number, payload: any) => {
  return updateData(`${apiUrl.RECIPES}/${id}`, payload)
}

export const useUpdateRecipe = () => {
  const { enqueueSnackbar } = useSnackbarManager()
  const queryClient = useQueryClient()
  return useMutation(
    ({ id, payload }: { id: string | number; payload: any }) =>
      updateRecipe(id, payload),
    {
      onSuccess: () => {
        enqueueSnackbar('Recipe updated successfully', { variant: 'success' })
        queryClient.invalidateQueries({ queryKey: ['recipes_list'] })
      },
      onError: (error: any) => {
        const apiErrors = error?.response?.data?.errors
        const apiMessage = error?.response?.data?.message
        const normalizedMessage = Array.isArray(apiErrors)
          ? getErrorMessage(apiErrors)
          : getErrorMessage(apiMessage || error?.message)

        enqueueSnackbar(normalizedMessage || 'Failed to update recipe', {
          variant: 'error',
        })
      },
    }
  )
}

export const deleteRecipe = (id: string | number) => {
  return deleteData(`${apiUrl.RECIPES}/${id}`)
}

export const useDeleteRecipe = () => {
  const { enqueueSnackbar } = useSnackbarManager()
  const queryClient = useQueryClient()

  return useMutation((id: string | number) => deleteRecipe(id), {
    onSuccess: () => {
      enqueueSnackbar('Recipe deleted successfully', { variant: 'success' })
      queryClient.invalidateQueries({ queryKey: ['recipes_list'] })
    },
    onError: (error: any) => {
      const apiErrors = error?.response?.data?.errors
      const apiMessage = error?.response?.data?.message
      const normalizedMessage = Array.isArray(apiErrors)
        ? getErrorMessage(apiErrors)
        : getErrorMessage(apiMessage || error?.message)

      enqueueSnackbar(normalizedMessage || 'Failed to delete recipe', {
        variant: 'error',
      })
    },
  })
}

export const getRecipeDetails = async (id: string | number) => {
  const response = await getData(`${apiUrl.RECIPES}/${id}`)
  return response
}
