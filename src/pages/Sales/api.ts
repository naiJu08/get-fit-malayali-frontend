import { useQuery } from '@tanstack/react-query'
import { getData, postData, updateFromData } from '../../apis/api.helpers'
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

export const useSalesClient = (id?: string) =>
  useQuery(['sales_client', id], () => getData(`/sales/clients/${id}`), {
    enabled: Boolean(id),
  })

export const createSalesPlanProposal = (clientId: string | number, data: any) =>
  postData(`/sales/clients/${clientId}/plan-proposals`, { proposal: data })

export const updateSalesPlanProposal = (
  clientId: string | number,
  proposalId: string | number,
  data: any
) =>
  updateFromData(`/sales/clients/${clientId}/plan-proposals/${proposalId}`, {
    proposal: data,
  })

export const assignSalesClientStaff = (clientId: string | number, data: any) =>
  postData(`/sales/clients/${clientId}/assignments`, data)

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
