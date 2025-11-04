import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { QueryParams } from '../../../../common/types'
import apiUrl from '../../../../apis/api.url'
import { getData, postData, updateData } from '../../../../apis/api.helpers'
import { parseQueryParams } from '../../../../utilities/parsers'

export const DISABLE_NONLOGIN_APIS = false

const buildUrlWithParams = (baseUrl: string, params: QueryParams) => {
  return `${baseUrl}${parseQueryParams(params)}`
}

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
  return useMutation(createWorkoutPlan, {
    onSuccess: () => {
      qc.invalidateQueries(['plans_list'])
    },
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
  return useMutation(updateWorkoutPlan, {
    onSuccess: () => {
      qc.invalidateQueries(['plans_list'])
    },
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
  return useMutation(
    ({ id, payload }: { id: string | number; payload: any }) =>
      addExercise(id, payload),
    {
      onSuccess: (_res: any, vars: { id: string | number; payload: any }) => {
        qc.invalidateQueries(['workout_plan_detail', String(vars?.id)])
      },
    }
  )
}
