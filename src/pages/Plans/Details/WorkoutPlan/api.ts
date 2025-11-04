import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSnackbarManager } from '../../../../components/common/snackbar'
import { QueryParams } from '../../../../common/types'
import apiUrl from '../../../../apis/api.url'
import { getData, postData, updateData } from '../../../../apis/api.helpers'
import { parseQueryParams } from '../../../../utilities/parsers'

export const DISABLE_NONLOGIN_APIS = false

const buildUrlWithParams = (baseUrl: string, params: QueryParams) => {
  return `${baseUrl}${parseQueryParams(params)}`
}

// helpers to extract messages consistently
const successMsg = (res: any, fallback: string) =>
  res?.message || res?.success || res?.success_message || fallback
const errorMsg = (err: any, fallback: string) =>
  err?.response?.data?.message ||
  err?.response?.data?.error?.message ||
  fallback

const fetchWorkoutPlans = async (input: QueryParams) => {
  const url = buildUrlWithParams(apiUrl.WORKOUT_PLAN, {
    ...input,
  })
  const response = await getData(url)
  return response
}
export const useWorkoutPlans = (input: QueryParams) => {
  return useQuery(['plans_list', input], () => fetchWorkoutPlans(input))
}

// Create workout plan
export const createWorkoutPlan = (payload: any) => {
  return postData(apiUrl.WORKOUT_PLAN, payload)
}
export const useCreateWorkoutPlan = () => {
  const qc = useQueryClient()
  const { enqueueSnackbar } = useSnackbarManager()
  return useMutation(createWorkoutPlan, {
    onSuccess: (res: any) => {
      qc.invalidateQueries(['plans_list'])
      const msg = successMsg(res, 'Workout plan created successfully')
      enqueueSnackbar(msg, { variant: 'success' })
    },
    onError: (err: any) => {
      const msg = errorMsg(err, 'Failed to create workout plan')
      enqueueSnackbar(msg, { variant: 'error' })
    },
    retry: false,
    useErrorBoundary: false,
  })
}

// Update workout plan
export const updateWorkoutPlan = ({
  id,
  payload,
}: {
  id: string | number
  payload: any
}) => {
  return updateData(`${apiUrl.WORKOUT_PLAN}/${id}`, payload)
}
export const useUpdateWorkoutPlan = () => {
  const qc = useQueryClient()
  const { enqueueSnackbar } = useSnackbarManager()
  return useMutation(updateWorkoutPlan, {
    onSuccess: (res: any) => {
      qc.invalidateQueries(['plans_list'])
      const msg = successMsg(res, 'Workout plan updated successfully')
      enqueueSnackbar(msg, { variant: 'success' })
    },
    onError: (err: any) => {
      const msg = errorMsg(err, 'Failed to update workout plan')
      enqueueSnackbar(msg, { variant: 'error' })
    },
    retry: false,
    useErrorBoundary: false,
  })
}

// Get workout plan details by id
export const getWorkoutPlanDetails = (id: string | number) => {
  return getData(`${apiUrl.WORKOUT_PLAN}/${id}`)
}
export const useWorkoutPlanDetail = (id?: string | number) => {
  return useQuery(
    ['workout_plan_detail', id],
    () => getWorkoutPlanDetails(String(id)),
    {
      enabled: !!id,
    }
  )
}

export const addExercise = (id: string | number, payload: any) => {
  return postData(`${apiUrl.WORKOUT_PLAN}/${id}/add_exercise`, payload)
}
export const useAddExercise = () => {
  const qc = useQueryClient()
  const { enqueueSnackbar } = useSnackbarManager()
  return useMutation(
    ({ id, payload }: { id: string | number; payload: any }) =>
      addExercise(id, payload),
    {
      onSuccess: (res: any, vars: any) => {
        qc.invalidateQueries(['workout_plan_detail', String(vars?.id)])
        const msg = successMsg(res, 'Exercise assigned')
        enqueueSnackbar(msg, { variant: 'success' })
      },
      onError: (err: any) => {
        const msg = errorMsg(err, 'Failed to assign exercise')
        enqueueSnackbar(msg, { variant: 'error' })
      },
      retry: false,
      useErrorBoundary: false,
    }
  )
}

// Bulk add exercises
export const addExercises = (id: string | number, payload: any) => {
  return postData(`${apiUrl.WORKOUT_PLAN}/${id}/add_exercises`, payload)
}
export const useAddExercises = () => {
  const qc = useQueryClient()
  const { enqueueSnackbar } = useSnackbarManager()
  return useMutation(
    ({ id, payload }: { id: string | number; payload: any }) =>
      addExercises(id, payload),
    {
      onSuccess: (res: any, vars: { id: string | number; payload: any }) => {
        qc.invalidateQueries(['workout_plan_detail', String(vars?.id)])
        const msg = successMsg(res, 'Exercises assigned')
        enqueueSnackbar(msg, { variant: 'success' })
      },
      onError: (err: any) => {
        const msg = errorMsg(err, 'Failed to assign exercises')
        enqueueSnackbar(msg, { variant: 'error' })
      },
      retry: false,
      useErrorBoundary: false,
    }
  )
}
