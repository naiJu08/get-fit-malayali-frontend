import { useQuery } from '@tanstack/react-query'
import { useMutation } from '@tanstack/react-query'

import { getData, postData, deleteData, updateData } from '../../apis/api.helpers'
import { QueryParams } from '../../common/types'
import { useSnackbarManager } from '../../components/common/snackbar'
import { getErrorMessage, parseQueryParams } from '../../utilities/parsers'

// Disable non-login APIs for this build
export const DISABLE_NONLOGIN_APIS = false

const buildUrlWithParams = (baseUrl: string, params: QueryParams) => {
  return `${baseUrl}${parseQueryParams(params)}`
}

const fetchData = async (input: QueryParams) => {
  const url = buildUrlWithParams('/meal_timings', {
    ...input,
  })
  const response = await getData(url)
  return response
}

export const useMealTimingList = (input: QueryParams) => {
  return useQuery(['meal_timing_list', input], () => fetchData(input))
}

export const getMealTimingDetails = (id: string) => {
  return getData(`/meal_timings/${id}`)
}

export const createMealTiming = (data: any) => {
  return postData('/meal_timings', data)
}

export const updateMealTiming = (id: string, data: any) => {
  return updateData(`/meal_timings/${id}`, data)
}

export const deleteMealTiming = (id: string) => {
  return deleteData(`/meal_timings/${id}`)
}

// User meal timings (used in some edit flows)
export const updateUserMealTiming = (
  userId: string | number,
  payload: {
    user_meal_timing: {
      meal_time: string
      time: string
      diet_plan_template_id: number | string
      subscription_id: number | string
      sequence_number: number
    }
  }
) => {
  const url = `https://api-getfitmalayali.inovace.in/api/v1/user_meal_timings?user_id=${userId}`
  return postData(url, payload)
}

export const useUpdateUserMealTiming = (onSuccess?: () => void) => {
  const { enqueueSnackbar } = useSnackbarManager()
  return useMutation(
    ({
      userId,
      payload,
    }: {
      userId: string | number
      payload: Parameters<typeof updateUserMealTiming>[1]
    }) => updateUserMealTiming(userId, payload),
    {
      onSuccess: () => {
        enqueueSnackbar('Meal timing updated successfully', {
          variant: 'success',
        })
        onSuccess?.()
      },
      onError: (error: any) => {
        enqueueSnackbar(getErrorMessage(error) || 'Failed to update meal timing', {
          variant: 'error',
        })
      },
    }
  )
}

// Hook for creating meal timing with success callback
export const useCreateMealTiming = (onSuccess?: () => void, successMessage?: string) => {
  const { enqueueSnackbar } = useSnackbarManager()
  
  return useMutation(createMealTiming, {
    onSuccess: () => {
      enqueueSnackbar(successMessage || 'Meal timing created successfully', {
        variant: 'success',
      })
      onSuccess?.()
    },
    onError: (error: any) => {
      enqueueSnackbar(getErrorMessage(error) || 'Failed to create meal timing', {
        variant: 'error',
      })
    },
  })
}

// Hook for updating meal timing with success callback
export const useUpdateMealTiming = (onSuccess?: () => void, successMessage?: string) => {
  const { enqueueSnackbar } = useSnackbarManager()
  
  return useMutation(
    ({ id, data }: { id: string; data: any }) => updateMealTiming(id, data),
    {
      onSuccess: () => {
        enqueueSnackbar(successMessage || 'Meal timing updated successfully', {
          variant: 'success',
        })
        onSuccess?.()
      },
      onError: (error: any) => {
        enqueueSnackbar(getErrorMessage(error) || 'Failed to update meal timing', {
          variant: 'error',
        })
      },
    }
  )
}

// Hook for deleting meal timing with success callback
export const useDeleteMealTiming = (onSuccess?: () => void) => {
  const { enqueueSnackbar } = useSnackbarManager()
  
  return useMutation(deleteMealTiming, {
    onSuccess: () => {
      enqueueSnackbar('Meal timing deleted successfully', {
        variant: 'success',
      })
      onSuccess?.()
    },
    onError: (error: any) => {
      enqueueSnackbar(getErrorMessage(error) || 'Failed to delete meal timing', {
        variant: 'error',
      })
    },
  })
}
