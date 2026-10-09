import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { QueryParams } from '../../../../common/types'
import apiUrl from '../../../../apis/api.url'
import {
  getData,
  postFormData,
  updateFromData,
  deleteWithBody,
} from '../../../../apis/api.helpers'
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
  return postFormData(apiUrl.WORKOUT_PLAN, payload)
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
  return updateFromData(`${apiUrl.WORKOUT_PLAN}/${id}`, payload)
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
  return postFormData(`${apiUrl.WORKOUT_PLAN}/${id}/add_exercise`, payload)
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

export const addExercises = (id: string | number, payload: any) => {
  return postFormData(`${apiUrl.WORKOUT_PLAN}/${id}/add_exercise`, payload)
}

export const useAddExercises = () => {
  const qc = useQueryClient()
  return useMutation(
    ({ id, payload }: { id: string | number; payload: any }) =>
      addExercises(id, payload),
    {
      onSuccess: (_res: any, vars: { id: string | number; payload: any }) => {
        qc.invalidateQueries(['workout_plan_detail', String(vars?.id)])
      },
    }
  )
}

// Remove exercise from workout plan
// export const removeExercise = (id: string | number, payload: any) => {
//   return postFormData(
//     `${apiUrl.WORKOUT_PLAN}/${id}/remove_exercise`,
//     payload
//   )
// }

// export const useRemoveExercise = () => {
//   const qc = useQueryClient()
//   return useMutation(
//     ({ id, payload }: { id: string | number; payload: any }) =>
//       removeExercise(id, payload),
//     {
//       onSuccess: (_res: any, vars: { id: string | number; payload: any }) => {
//         qc.invalidateQueries(['workout_plan_detail', String(vars?.id)])
//       },
//     }
//   )
// }
export const deleteWorkoutPlanExercise = (
  id: string | number,
  workoutIds: (string | number)[]
) => {
  return deleteWithBody(`${apiUrl.WORKOUT_PLAN}/${id}/remove_exercise`, {
    workout_ids: workoutIds,
  })
}

const capitalizeWords = (text: string) =>
  text?.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase())

// Fetch subcategories for a given category to power Assign drawer multi-select
// Uses /categories/:id (getCategoriesDetails-like endpoint)
export const getWorkoutPlanSubcategories = async (
  parentId?: string | number
) => {
  if (!parentId) return []
  // Use /categories/:id only, as requested
  const detail: any = await getData(`${apiUrl.CATEGORIES}/${parentId}`)
  // Handles your response shape:
  // { category: { ..., subcategories: [...] } }
  const container =
    detail?.category ?? detail?.data?.category ?? detail?.data ?? detail
  const subs: any[] = container?.subcategories || container?.subcategory || []
  const rawCatName = container?.name ?? ''
  const catName = capitalizeWords(rawCatName)

  return (Array.isArray(subs) ? subs : []).map((sub: any) => {
    const rawSubName = sub?.name ?? sub?.value ?? ''
    const subName = capitalizeWords(rawSubName)
    const formattedValue =
      catName && subName ? `${catName} - ${subName}` : subName
    return {
      id: sub?.id,
      value: formattedValue,
      subName,
      catName,
      categoryId: parentId,
    }
  })
}
