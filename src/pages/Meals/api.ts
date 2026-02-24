import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getData,
  postData,
  updateData,
  deleteData,
} from '../../apis/api.helpers'
import apiUrl from '../../apis/api.url'
import { QueryParams } from '../../common/types'
import { parseQueryParams } from '../../utilities/parsers'
import { useSnackbarManager } from '../../components/common/snackbar'

const buildUrlWithParams = (baseUrl: string, params: QueryParams) => {
  return `${baseUrl}${parseQueryParams(params)}`
}

const fetchMeals = async (input: QueryParams) => {
  const url = buildUrlWithParams(apiUrl.MEALS, { ...input })
  const response = await getData(url)
  return response
}

export const useMeals = (input: QueryParams) => {
  return useQuery(['meals_list', input], () => fetchMeals(input))
}

export const createMeal = (payload: any) => {
  return postData(`${apiUrl.MEALS}`, payload)
}

export const useCreateMeal = () => {
  const { enqueueSnackbar } = useSnackbarManager()
  const queryClient = useQueryClient()
  return useMutation(createMeal, {
    onSuccess: () => {
      enqueueSnackbar('Meal created successfully', { variant: 'success' })
      queryClient.invalidateQueries({ queryKey: ['meals_list'] })
    },
    onError: (error: any) => {
      enqueueSnackbar(
        error?.response?.data?.message || 'Failed to create meal',
        { variant: 'error' }
      )
    },
  })
}

export const updateMeal = (id: string | number, payload: any) => {
  return updateData(`${apiUrl.MEALS}/${id}`, payload)
}

export const useUpdateMeal = () => {
  const { enqueueSnackbar } = useSnackbarManager()
  const queryClient = useQueryClient()
  return useMutation(
    ({ id, payload }: { id: string | number; payload: any }) =>
      updateMeal(id, payload),
    {
      onSuccess: () => {
        enqueueSnackbar('Meal updated successfully', { variant: 'success' })
        queryClient.invalidateQueries({ queryKey: ['meals_list'] })
      },
      onError: (error: any) => {
        enqueueSnackbar(
          error?.response?.data?.message || 'Failed to update meal',
          { variant: 'error' }
        )
      },
    }
  )
}

export const deleteMeal = (id: string | number) => {
  return deleteData(`${apiUrl.MEALS}/${id}`)
}

export const useDeleteMeal = () => {
  const { enqueueSnackbar } = useSnackbarManager()
  const queryClient = useQueryClient()
  return useMutation((id: string | number) => deleteMeal(id), {
    onSuccess: () => {
      enqueueSnackbar('Meal deleted successfully', { variant: 'success' })
      queryClient.invalidateQueries({ queryKey: ['meals_list'] })
    },
    onError: (error: any) => {
      const apiMessage =
        error?.response?.data?.errors?.[0] || error?.response?.data?.message
      enqueueSnackbar(apiMessage || 'Failed to delete meal', {
        variant: 'error',
      })
    },
  })
}
export const getMealDetails = async (id: string | number) => {
  const response = await getData(`${apiUrl.MEALS}/${id}`)
  return response
}
const fetchMealCategories = async () => {
  const response = await getData(apiUrl.MEAL_CATEGORIES)
  return response
}

export const useMealCategories = () => {
  return useQuery(['meal_categories'], fetchMealCategories)
}

const fetchServingUnits = async (mealCategoryId?: number) => {
  const url =
    mealCategoryId != null
      ? `${apiUrl.SERVING_UNITS}?meal_category_id=${mealCategoryId}`
      : apiUrl.SERVING_UNITS

  const response = await getData(url)
  return response
}

export const useServingUnits = (mealCategoryId?: number) => {
  return useQuery(
    ['serving_units', mealCategoryId],
    () => fetchServingUnits(mealCategoryId),
    {
      enabled: mealCategoryId != null,
    }
  )
}
