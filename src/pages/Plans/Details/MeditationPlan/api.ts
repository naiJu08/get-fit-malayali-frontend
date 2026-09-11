import { useMutation, useQueryClient } from '@tanstack/react-query'
import apiUrl from '../../../../apis/api.url'
import { deleteWithBody, postData } from '../../../../apis/api.helpers'

export const assignMeditations = (planId: string | number, payload: any) => {
  return postData(`${apiUrl.PLANS}/${planId}/assign_meditations`, payload)
}

export const useAssignMeditations = () => {
  const qc = useQueryClient()
  return useMutation(
    ({ planId, payload }: { planId: string | number; payload: any }) =>
      assignMeditations(planId, payload),
    {
      onSuccess: (
        _res: any,
        vars: { planId: string | number; payload: any }
      ) => {
        // Refresh plan details after assigning
        qc.invalidateQueries(['plan_detail', String(vars?.planId)])
      },
    }
  )
}

export const deletePlanMeditations = (
  planId: string | number,
  meditationIds: (string | number)[]
) => {
  return deleteWithBody(`${apiUrl.PLANS}/${planId}/remove_meditations`, {
    meditation_ids: meditationIds,
  })
}

export const useRemoveMeditationsFromPlan = () => {
  const qc = useQueryClient()
  return useMutation(
    ({
      planId,
      meditationIds,
    }: {
      planId: string | number
      meditationIds: (string | number)[]
    }) => deletePlanMeditations(planId, meditationIds),
    {
      onSuccess: (_res: any, vars: { planId: string | number }) => {
        qc.invalidateQueries(['plan_detail', String(vars?.planId)])
      },
    }
  )
}
