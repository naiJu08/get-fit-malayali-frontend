import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import apiUrl from '../../../../apis/api.url'
import {
  getData,
  postData,
  updateData,
  postFormData,
} from '../../../../apis/api.helpers'
import { QueryParams } from '../../../../common/types'
import { parseQueryParams } from '../../../../utilities/parsers'

const buildUrlWithParams = (baseUrl: string, params: QueryParams) => {
  return `${baseUrl}${parseQueryParams(params)}`
}

const fetchYogaPlans = async (input: QueryParams) => {
  const url = buildUrlWithParams(apiUrl.YOGA_PLAN, {
    ...input,
  })
  const response = await getData(url)
  return response
}

export const useYogaPlans = (input: QueryParams) => {
  return useQuery(['yoga_plans_list', input], () => fetchYogaPlans(input))
}

export const getYogaPlanDetails = (id: string | number) => {
  return getData(`${apiUrl.YOGA_PLAN}/${id}`)
}

export const useYogaPlanDetail = (id?: string | number) => {
  const keyId = id != null ? String(id) : undefined
  return useQuery(
    ['yoga_plan_detail', keyId],
    () => getYogaPlanDetails(String(keyId)),
    {
      enabled: !!keyId,
    }
  )
}

export const createYogaPlan = (payload: any) => {
  return postData(apiUrl.YOGA_PLAN, payload)
}

export const useCreateYogaPlan = () => {
  const qc = useQueryClient()
  return useMutation(createYogaPlan, {
    onSuccess: () => {
      qc.invalidateQueries(['yoga_plans_list'])
    },
  })
}

export const updateYogaPlan = ({
  id,
  payload,
}: {
  id: string | number
  payload: any
}) => {
  return updateData(`${apiUrl.YOGA_PLAN}/${id}`, payload)
}

export const useUpdateYogaPlan = () => {
  const qc = useQueryClient()
  return useMutation(updateYogaPlan, {
    onSuccess: (_data: any, vars: { id: string | number; payload: any }) => {
      // Refresh list and the specific detail record so edit forms see latest data
      qc.invalidateQueries(['yoga_plans_list'])
      if (vars?.id) {
        qc.invalidateQueries(['yoga_plan_detail', String(vars.id)])
      }
    },
  })
}

export const addExercise = (id: string | number, payload: any) => {
  return postFormData(`${apiUrl.YOGA_PLAN}/${id}/add_yoga`, payload)
}

export const useAddYogaExercise = () => {
  const qc = useQueryClient()
  return useMutation(
    ({ id, payload }: { id: string | number; payload: any }) =>
      addExercise(id, payload),
    {
      onSuccess: (_res: any, vars: { id: string | number; payload: any }) => {
        qc.invalidateQueries(['yoga_plan_detail', String(vars?.id)])
      },
    }
  )
}
