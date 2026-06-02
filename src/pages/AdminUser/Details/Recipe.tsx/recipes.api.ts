import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { getData, postData } from '../../../../apis/api.helpers'
import { QueryParams } from '../../../../common/types'
import { parseQueryParams } from '../../../../utilities/parsers'
import { useSnackbarManager } from '../../../../components/common/snackbar'

const buildUserRecipesUrl = (userId: string | number, params: QueryParams) => {
  return `/user_recipes${parseQueryParams({ ...params, user_id: userId })}`
}

const fetchUserRecipes = async (
  userId: string | number,
  params: QueryParams
) => {
  const url = buildUserRecipesUrl(userId, params)
  const response = await getData(url)
  return response
}

export const useUserRecipes = (
  userId: string | number | undefined,
  params: QueryParams
) => {
  return useQuery(
    ['user_recipes', userId, params],
    () => fetchUserRecipes(userId as string | number, params),
    {
      enabled: Boolean(userId),
      staleTime: 5 * 60 * 1000,
    }
  )
}

export const assignRecipesToUser = (payload: {
  user_id: string | number
  recipe_ids: (string | number)[]
  notes?: string
}) => {
  return postData('/user_recipes', payload)
}

export const useAssignRecipes = () => {
  const { enqueueSnackbar } = useSnackbarManager()
  const queryClient = useQueryClient()
  return useMutation(assignRecipesToUser, {
    onSuccess: () => {
      enqueueSnackbar('Recipes assigned successfully', { variant: 'success' })
      queryClient.invalidateQueries({ queryKey: ['user_recipes'] })
    },
    onError: (error: any) => {
      enqueueSnackbar(
        error?.response?.data?.message || 'Failed to assign recipes',
        { variant: 'error' }
      )
    },
  })
}

export default {
  useUserRecipes,
  useAssignRecipes,
  assignRecipesToUser,
}
