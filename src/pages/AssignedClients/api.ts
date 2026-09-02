import { useQuery } from '@tanstack/react-query'
import { getData, postData } from '../../apis/api.helpers'
import { parseQueryParams } from '../../utilities/parsers'

const list = (params: Record<string, any> = {}) =>
  getData('/assigned_clients' + parseQueryParams(params))

export const useAssignedClientWorkflow = (
  role: string,
  params: Record<string, any>
) =>
  useQuery(
    ['assigned_client_workflow', role, params],
    () => list({ ...params, role, status: 'pending' }),
    {
      select: (data: any) => ({
        items: data?.assigned_clients || [],
        meta: data?.meta || {},
      }),
    }
  )

export const useAssignedClientDetail = (id?: string) =>
  useQuery(
    ['assigned_client_workflow_detail', id],
    () => getData('/assigned_clients/' + id),
    { enabled: Boolean(id) }
  )

export const useAssignedClientForUser = (
  userId?: string | number,
  role?: string
) =>
  useQuery(
    ['assigned_client_workflow_client', userId, role],
    async () => {
      const response = await getData(
        '/assigned_clients' +
          parseQueryParams({
            user_id: userId,
            role,
            include_all: true,
            per_page: 1,
          })
      )
      const assignment = response?.assigned_clients?.[0]
      if (!assignment?.id) return null
      const detail = await getData('/assigned_clients/' + assignment.id)
      return detail?.assigned_client || null
    },
    { enabled: Boolean(userId && role) }
  )

export const acceptAssignedClient = (id: string | number) =>
  postData('/assigned_clients/' + id + '/accept', {})

export const scheduleAssignedClientFollowUp = (
  id: string | number,
  data: { scheduled_at: string; notes?: string }
) => postData('/assigned_clients/' + id + '/follow_ups', { follow_up: data })

export const completeAssignedClientFollowUp = (
  id: string | number,
  followUpId: string | number
) =>
  postData(
    '/assigned_clients/' + id + '/follow_ups/' + followUpId + '/complete',
    {}
  )

export const createAssignedClientAssessment = (
  id: string | number,
  data: any
) => postData('/assigned_clients/' + id + '/assessments', { assessment: data })

export const confirmAssignedClientPackage = (id: string | number) =>
  postData('/assigned_clients/' + id + '/confirm_package', {})
