import { useQuery } from '@tanstack/react-query'
import { getData, postData } from '../../apis/api.helpers'
import { parseQueryParams } from '../../utilities/parsers'
import { groupAssignedClients } from './groupClients'

const list = (params: Record<string, any> = {}) =>
  getData('/assigned_clients' + parseQueryParams(params))

export const useAssignedClientWorkflow = (
  role: string,
  params: Record<string, any>
) =>
  useQuery(
    ['assigned_client_workflow', role, params.search],
    async () => {
      const filters = {
        search: params.search,
        role,
        status: 'pending',
        per_page: 100,
      }
      const firstPage = await list({ ...filters, page: 1 })
      const assignments = [...(firstPage?.assigned_clients || [])]
      // Collect every assignment before grouping so clients cannot repeat
      // across pages or have package names omitted at a page boundary.
      for (let page = 2; page <= (firstPage?.meta?.total_pages || 1); page++) {
        const response = await list({ ...filters, page })
        assignments.push(...(response?.assigned_clients || []))
      }
      return groupAssignedClients(assignments)
    },
    {
      select: (clients: any[]) => {
        const totalPages = Math.max(
          1,
          Math.ceil(clients.length / params.per_page)
        )
        const currentPage = Math.min(params.page, totalPages)
        const offset = (currentPage - 1) * params.per_page
        return {
          items: clients.slice(offset, offset + params.per_page),
          meta: {
            current_page: currentPage,
            total_count: clients.length,
            total_pages: totalPages,
          },
        }
      },
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
  role?: string,
  cycleId?: string | number
) =>
  useQuery(
    ['assigned_client_workflow_client', userId, role, cycleId],
    async () => {
      const response = await getData(
        '/assigned_clients' +
          parseQueryParams({
            user_id: userId,
            ...(role === 'superadmin' ? {} : { role }),
            include_all: true,
            per_page: 100,
          })
      )
      const today = new Date().toLocaleDateString('en-CA')
      const priority = (assignment: any) => {
        if (
          assignment.subscription_id &&
          assignment.package_start_date <= today &&
          assignment.package_end_date >= today
        )
          return 0
        if (!assignment.cycle_id) return 1
        return 2
      }
      let assignments = [...(response?.assigned_clients || [])]
      if (cycleId) {
        const cycleMatches = assignments.filter(
          (a: any) =>
            String(a.cycle_id || a.client_package_cycle_id) === String(cycleId)
        )
        if (cycleMatches.length > 0) {
          assignments = cycleMatches
        } else {
          const pendingAssignments = assignments.filter(
            (a: any) =>
              a.workflow_status === 'pending' ||
              a.status === 'pending' ||
              !a.accepted_at
          )
          if (pendingAssignments.length > 0) {
            assignments = pendingAssignments
          }
        }
      } else {
        assignments.sort((a: any, b: any) => priority(a) - priority(b))
      }
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
      const pendingPrimary = validDetails.find(
        (item: any) =>
          item.workflow_status === 'pending' ||
          item.status === 'pending' ||
          !item.accepted_at
      )
      const primary = pendingPrimary || validDetails[0]
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
              assigned_staff_name:
                followUp.scheduled_by?.name ||
                followUp.created_by?.name ||
                followUp.assigned_staff_name ||
                followUp.staff_name ||
                item.staff_name,
              assigned_staff_role:
                followUp.scheduled_by?.role ||
                followUp.created_by?.role ||
                followUp.assigned_staff_role ||
                followUp.staff_role ||
                item.role,
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
