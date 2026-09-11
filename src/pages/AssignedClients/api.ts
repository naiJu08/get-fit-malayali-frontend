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
            ...(role === 'superadmin' ? {} : { role }),
            include_all: true,
            per_page: role === 'superadmin' ? 100 : 1,
          })
      )
      const assignments = response?.assigned_clients || []
      if (!assignments.length) return null
      const details = await Promise.all(
        assignments.map(async (assignment: any) => {
          const detail = await getData('/assigned_clients/' + assignment.id)
          return detail?.assigned_client
            ? { ...detail.assigned_client, assignment_id: assignment.id }
            : null
        })
      )
      const validDetails = details.filter(Boolean)
      const primary = validDetails[0]
      if (!primary) return null
      if (role !== 'superadmin') return primary
      return {
        ...primary,
        assignments: validDetails,
        follow_ups: validDetails
          .flatMap((item: any) =>
            (item.follow_ups || []).map((followUp: any) => ({
              ...followUp,
              assignment_id: item.id,
              assigned_staff_name: item.staff_name,
              assigned_staff_role: item.role,
            }))
          )
          .sort(
            (a: any, b: any) =>
              new Date(b.scheduled_at).getTime() -
              new Date(a.scheduled_at).getTime()
          ),
      }
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
  followUpId: string | number,
  data: { completion_notes: string }
) =>
  postData(
    '/assigned_clients/' + id + '/follow_ups/' + followUpId + '/complete',
    { follow_up: data }
  )

export const createAssignedClientAssessment = (
  id: string | number,
  data: any
) => postData('/assigned_clients/' + id + '/assessments', { assessment: data })

export const confirmAssignedClientPackage = (id: string | number) =>
  postData('/assigned_clients/' + id + '/confirm_package', {})

export const proposeAssignedClientPackage = (
  id: string | number,
  data: { plan_id: string | number; start_date: string; notes?: string }
) =>
  postData('/assigned_clients/' + id + '/propose_package', { proposal: data })
