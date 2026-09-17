import { useQuery } from '@tanstack/react-query'
import {
  getData,
  postData,
  updateFromData,
  postFormData,
  patchFormData,
  deleteData,
} from '../../apis/api.helpers'
import { parseQueryParams } from '../../utilities/parsers'

const list = (path: string, params: Record<string, any> = {}) =>
  getData(path + parseQueryParams(params))

export const useSalesDashboard = (enabled = true) =>
  useQuery(['sales_dashboard'], () => getData('/sales/dashboard'), { enabled })

export const useSalesPackages = (params: Record<string, any>) =>
  useQuery(['sales_packages', params], () => list('/sales/packages', params))

export const useSalesLeads = (params: Record<string, any>) =>
  useQuery(['sales_leads', params], () => list('/sales/leads', params))

export const useSalesLead = (id?: string) =>
  useQuery(['sales_lead', id], () => getData('/sales/leads/' + id), {
    enabled: Boolean(id),
  })

export const acceptSalesLead = (id: string | number) =>
  postData(`/sales/leads/${id}/accept`, {})

export const createSalesInteraction = (id: string | number, data: any) =>
  postData(`/sales/leads/${id}/interactions`, { interaction: data })

export const generateSalesConfirmation = (
  id: string | number,
  message: string
) => postData(`/sales/leads/${id}/confirmation`, { message })

export const convertSalesLead = (id: string | number, data: any) =>
  postData(`/sales/leads/${id}/convert`, { client: data })

export const useSalesClients = (params: Record<string, any>) =>
  useQuery(['sales_clients', params], () => list('/sales/clients', params))

export const useUnassignedClients = (params: Record<string, any>) =>
  useQuery(['unassigned_clients', params], () =>
    list('/sales/unassigned_clients', params)
  )

export const acquireSalesClient = (id: string | number) =>
  postData(`/sales/clients/${id}/acquire`, {})

export const useSalesClient = (id?: string) =>
  useQuery(['sales_client', id], () => getData(`/sales/clients/${id}`), {
    enabled: Boolean(id),
  })

export const createSalesPlanProposal = (
  clientId: string | number,
  data: any
) => {
  if (data instanceof FormData) {
    return postFormData(`/sales/clients/${clientId}/plan-proposals`, data).then(
      (res: any) => res?.data ?? res
    )
  }
  return postData(`/sales/clients/${clientId}/plan-proposals`, {
    proposal: data,
  })
}

export const updateSalesPlanProposal = (
  clientId: string | number,
  proposalId: string | number,
  data: any
) => {
  if (data instanceof FormData) {
    return patchFormData(
      `/sales/clients/${clientId}/plan-proposals/${proposalId}`,
      data
    ).then((res: any) => res?.data ?? res)
  }
  return updateFromData(
    `/sales/clients/${clientId}/plan-proposals/${proposalId}`,
    {
      proposal: data,
    }
  )
}

export const assignSalesClientStaff = (clientId: string | number, data: any) =>
  postData(`/sales/clients/${clientId}/assignments`, data)

export const unassignSalesClientStaff = (
  clientId: string | number,
  role: string
) => deleteData(`/sales/clients/${clientId}/assignments/${role}`)

export const useSalesPayments = (params: Record<string, any>) =>
  useQuery(['sales_payments', params], () => list('/sales/payments', params))

export const getPublicLeadConfirmation = (token: string) =>
  getData('/public/lead-confirmations/' + token)

export const acceptPublicLeadConfirmation = (token: string) =>
  postData('/public/lead-confirmations/' + token + '/accept', {})

export const getPublicClientRegistration = (token: string) =>
  getData('/public/client-registration/' + token)

export const completePublicClientRegistration = (token: string, data: any) =>
  postData('/public/client-registration/' + token + '/complete', data)

// ── Shared client packages & assignments API (/api/v1/clients/:id/…) ──────────
// Used by nutritionists, physios, yogists, and superadmin (authorize_client_workflow_staff!)

export const useSharedClientDetail = (id?: string | number) =>
  useQuery(['shared_client_detail', id], () => getData(`/clients/${id}`), {
    enabled: Boolean(id),
  })

export const useClientDetail = (id?: string | number, apiPrefix = '/clients') =>
  useQuery(
    ['client_detail', apiPrefix, id],
    () => getData(`${apiPrefix}/${id}`),
    {
      enabled: Boolean(id),
    }
  )

export const useClientPackageCycles = (
  id?: string | number,
  apiPrefix = '/clients'
) =>
  useQuery(
    ['client_package_cycles', apiPrefix, String(id)],
    () => getData(`${apiPrefix}/${id}/package-cycles`),
    { enabled: Boolean(id) }
  )

export const confirmClientPackageCycle = (
  id: string | number,
  cycleId: string | number,
  apiPrefix = '/clients'
) => postData(`${apiPrefix}/${id}/package-cycles/${cycleId}/confirm`, {})

export const requestClientRenewal = (
  id: string | number,
  subscriptionId: string | number,
  notes: string
) =>
  postData(`/clients/${id}/subscriptions/${subscriptionId}/renewal-request`, {
    notes,
  })

export const useRenewalRequests = (params: Record<string, any>) =>
  useQuery(['sales_renewal_requests', params], () =>
    list('/sales/renewal-requests', params)
  )

export const useClientPackages = (
  clientId?: string | number,
  apiPrefix = '/clients',
  params: Record<string, any> = {}
) =>
  useQuery(
    ['client_packages', apiPrefix, clientId, params],
    () =>
      getData(`${apiPrefix}/${clientId}/packages${parseQueryParams(params)}`),
    { enabled: Boolean(clientId) }
  )

export const createClientPlanProposal = (
  clientId: string | number,
  data: any,
  apiPrefix = '/clients'
) =>
  data instanceof FormData
    ? postFormData(`${apiPrefix}/${clientId}/plan-proposals`, data).then(
        (res: any) => res?.data ?? res
      )
    : postData(`${apiPrefix}/${clientId}/plan-proposals`, { proposal: data })

export const updateClientPlanProposal = (
  clientId: string | number,
  proposalId: string | number,
  data: any,
  apiPrefix = '/clients'
) =>
  data instanceof FormData
    ? patchFormData(
        `${apiPrefix}/${clientId}/plan-proposals/${proposalId}`,
        data
      ).then((res: any) => res?.data ?? res)
    : updateFromData(`${apiPrefix}/${clientId}/plan-proposals/${proposalId}`, {
        proposal: data,
      })

export const assignClientStaff = (
  clientId: string | number,
  data: any,
  apiPrefix = '/clients'
) => postData(`${apiPrefix}/${clientId}/assignments`, data)

export const unassignClientStaff = (
  clientId: string | number,
  role: string,
  cycleId: string | number,
  apiPrefix = '/clients'
) =>
  deleteData(
    `${apiPrefix}/${clientId}/assignments/${role}${parseQueryParams({ cycle_id: cycleId })}`
  )

export const useClientProposalHistory = (id?: string | number) =>
  useQuery(
    ['client_proposal_history', id],
    () => getData(`/clients/${id}/proposal-history`),
    {
      enabled: Boolean(id),
    }
  )

export const useSharedClientPackages = (
  clientId?: string | number,
  params: Record<string, any> = {}
) =>
  useQuery(
    ['shared_client_packages', clientId, params],
    () => getData(`/clients/${clientId}/packages${parseQueryParams(params)}`),
    { enabled: Boolean(clientId) }
  )

export const createSharedClientPlanProposal = (
  clientId: string | number,
  data: any
) => {
  if (data instanceof FormData) {
    return postFormData(`/clients/${clientId}/plan-proposals`, data).then(
      (res: any) => res?.data ?? res
    )
  }
  return postData(`/clients/${clientId}/plan-proposals`, { proposal: data })
}

export const updateSharedClientPlanProposal = (
  clientId: string | number,
  proposalId: string | number,
  data: any
) => {
  if (data instanceof FormData) {
    return patchFormData(
      `/clients/${clientId}/plan-proposals/${proposalId}`,
      data
    ).then((res: any) => res?.data ?? res)
  }
  return updateFromData(`/clients/${clientId}/plan-proposals/${proposalId}`, {
    proposal: data,
  })
}

export const assignSharedClientStaff = (clientId: string | number, data: any) =>
  postData(`/clients/${clientId}/assignments`, data)

export const unassignSharedClientStaff = (
  clientId: string | number,
  role: string
) => deleteData(`/clients/${clientId}/assignments/${role}`)

export const useSharedProposalHistory = (
  clientId?: string | number,
  proposalId?: string | number
) =>
  useQuery(
    ['shared_proposal_history', clientId, proposalId],
    () => getData(`/clients/${clientId}/plan-proposals/${proposalId}/history`),
    { enabled: Boolean(clientId) && Boolean(proposalId) }
  )
