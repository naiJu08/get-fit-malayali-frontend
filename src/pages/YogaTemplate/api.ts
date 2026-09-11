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

export const useYogaTemplateList = (params: any) =>
  useQuery(
    ['yoga-template-list', params],
    () => getData(`${apiUrl.YOGA_TEMPLATES}${buildQuery(params)}`),
    { keepPreviousData: true }
  )

export const getYogaTemplate = (id: string | number, params: any = {}) =>
  getData(`${apiUrl.YOGA_TEMPLATES}/${id}${buildQuery(params)}`)
export const createYogaTemplate = (data: FormData) =>
  postFormData(apiUrl.YOGA_TEMPLATES, data)
export const updateYogaTemplate = ({
  id,
  data,
}: {
  id: string | number
  data: FormData
}) => updateFromData(`${apiUrl.YOGA_TEMPLATES}/${id}`, data)
export const deleteYogaTemplate = (id: string | number) =>
  deleteData(`${apiUrl.YOGA_TEMPLATES}/${id}`)
export const duplicateYogaTemplate = (id: string | number) =>
  postData(`${apiUrl.YOGA_TEMPLATES}/${id}/duplicate`, {})
export const getYogaTemplateDay = (id: string | number) =>
  getData(`${apiUrl.YOGA_TEMPLATE_DAYS}/${id}`)
export const updateYogaTemplateDay = ({ id, data }: any) =>
  updateFromData(`${apiUrl.YOGA_TEMPLATE_DAYS}/${id}`, data)
export const addYogaTemplateExercises = (id: string | number, data: any) =>
  postFormData(`${apiUrl.YOGA_TEMPLATE_DAYS}/${id}/add_exercise`, data)
export const removeYogaTemplateExercises = (
  id: string | number,
  ids: Array<string | number>
) =>
  deleteWithBody(`${apiUrl.YOGA_TEMPLATE_DAYS}/${id}/remove_exercise`, {
    yoga_template_exercise_ids: ids,
  })
export const getSubscriptionCopyYogaTargetDays = (
  id: string | number,
  sourceTemplateId?: string | number
) =>
  getData(
    `${apiUrl.SUBSCRIPTIONS}/${id}/copy_yoga_target_days${sourceTemplateId ? `?source_template_id=${sourceTemplateId}` : ''}`
  )
export const copyYogaTemplateExercises = (
  sourceDayId: string | number,
  payload: any
) =>
  postData(
    `${apiUrl.YOGA_TEMPLATE_DAYS}/${sourceDayId}/copy_exercises`,
    payload
  )

export const useTemplateMutation = () => {
  const qc = useQueryClient()
  return useMutation(createYogaTemplate, {
    onSuccess: () => qc.invalidateQueries(['yoga-template-list']),
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
