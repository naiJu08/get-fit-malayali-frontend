import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

import { QueryParams } from '../../../../common/types'
import apiUrl from '../../../../apis/api.url'
import {
  getData,
  postData,
  updateData,
  deleteData,
} from '../../../../apis/api.helpers'
import { parseQueryParams } from '../../../../utilities/parsers'

const buildUrlWithParams = (baseUrl: string, params: QueryParams) => {
  return `${baseUrl}${parseQueryParams(params)}`
}

const fetchDietPlans = async (input: QueryParams) => {
  const url = buildUrlWithParams(apiUrl.DIET_PLAN, {
    ...input,
  })
  const response = await getData(url)
  return response
}
export const useDietPlans = (input: QueryParams) => {
  return useQuery(['diet_plans_list', input], () => fetchDietPlans(input))
}

export const getDietPlanDetails = (id: string | number) => {
  return getData(`${apiUrl.DIET_PLAN}/${id}`)
}
export const useDietPlanDetail = (id?: string | number) => {
  return useQuery(
    ['diet_plan_detail', id],
    () => getDietPlanDetails(String(id)),
    {
      enabled: !!id,
    }
  )
}

export const createDietPlan = (payload: any) => {
  return postData(apiUrl.DIET_PLAN, payload)
}
export const useCreateDietPlan = () => {
  const qc = useQueryClient()
  return useMutation(createDietPlan, {
    onSuccess: () => {
      qc.invalidateQueries(['diet_plans_list'])
    },
  })
}

export const updateDietPlan = ({
  id,
  payload,
}: {
  id: string | number
  payload: any
}) => {
  return updateData(`${apiUrl.DIET_PLAN}/${id}`, payload)
}
export const useUpdateDietPlan = () => {
  const qc = useQueryClient()
  return useMutation(updateDietPlan, {
    onSuccess: () => {
      qc.invalidateQueries(['diet_plans_list'])
    },
  })
}

export const deleteDietPlan = (id: string | number) => {
  return deleteData(`${apiUrl.DIET_PLAN}/${id}`)
}

export const useDeleteDietPlan = () => {
  const qc = useQueryClient()
  return useMutation((id: string | number) => deleteDietPlan(id), {
    onSuccess: () => {
      qc.invalidateQueries(['diet_plans_list'])
    },
  })
}
