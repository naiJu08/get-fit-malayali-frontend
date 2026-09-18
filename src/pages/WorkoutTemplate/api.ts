import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getData,
  postData,
  postFormData,
  updateFromData,
  deleteData,
  deleteWithBody,
} from '../../apis/api.helpers'
import apiUrl from '../../apis/api.url'

export const useWorkoutTemplateList = (params: any) =>
  useQuery(
    ['workout-template-list', params],
    () => getData(`${apiUrl.WORKOUT_TEMPLATES}${buildQuery(params)}`),
    { keepPreviousData: true }
  )

export const getWorkoutTemplate = (id: string | number, params: any = {}) =>
  getData(`${apiUrl.WORKOUT_TEMPLATES}/${id}${buildQuery(params)}`)
export const createWorkoutTemplate = (data: FormData) =>
  postFormData(apiUrl.WORKOUT_TEMPLATES, data)
export const updateWorkoutTemplate = ({
  id,
  data,
}: {
  id: string | number
  data: FormData
}) => updateFromData(`${apiUrl.WORKOUT_TEMPLATES}/${id}`, data)
export const deleteWorkoutTemplate = (id: string | number) =>
  deleteData(`${apiUrl.WORKOUT_TEMPLATES}/${id}`)
export const duplicateWorkoutTemplate = (id: string | number) =>
  postData(`${apiUrl.WORKOUT_TEMPLATES}/${id}/duplicate`, {})
export const getWorkoutTemplateDay = (id: string | number) =>
  getData(`${apiUrl.WORKOUT_TEMPLATE_DAYS}/${id}`)
export const updateWorkoutTemplateDay = ({ id, data }: any) =>
  updateFromData(`${apiUrl.WORKOUT_TEMPLATE_DAYS}/${id}`, data)
export const addWorkoutTemplateExercises = (id: string | number, data: any) =>
  postFormData(`${apiUrl.WORKOUT_TEMPLATE_DAYS}/${id}/add_exercise`, data)
export const removeWorkoutTemplateExercises = (
  id: string | number,
  ids: Array<string | number>
) =>
  deleteWithBody(`${apiUrl.WORKOUT_TEMPLATE_DAYS}/${id}/remove_exercise`, {
    workout_template_exercise_ids: ids,
  })
export const getSubscriptionCopyWorkoutTargetDays = (
  id: string | number,
  sourceTemplateId?: string | number
) =>
  getData(
    `${apiUrl.SUBSCRIPTIONS}/${id}/copy_workout_target_days${sourceTemplateId ? `?source_template_id=${sourceTemplateId}` : ''}`
  )
export const copyWorkoutTemplateExercises = (
  sourceDayId: string | number,
  payload: any
) =>
  postData(
    `${apiUrl.WORKOUT_TEMPLATE_DAYS}/${sourceDayId}/copy_exercises`,
    payload
  )

export const useTemplateMutation = () => {
  const qc = useQueryClient()
  return useMutation(createWorkoutTemplate, {
    onSuccess: () => qc.invalidateQueries(['workout-template-list']),
  })
}

const buildQuery = (params: any = {}) => {
  const query = new URLSearchParams()
  Object.entries(params).forEach(
    ([key, value]) =>
      value !== undefined && value !== '' && query.set(key, String(value))
  )
  const result = query.toString()
  return result ? `?${result}` : ''
}
