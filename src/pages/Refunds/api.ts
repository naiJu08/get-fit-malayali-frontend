import { useQuery } from '@tanstack/react-query'
import { getData, postData, postFormData } from '../../apis/api.helpers'
import { parseQueryParams } from '../../utilities/parsers'

export const useRefundRequests = (params: Record<string, any> = {}) =>
  useQuery(['refund_requests', params], () =>
    getData('/refund_requests' + parseQueryParams(params))
  )

export const useRefundRequest = (id?: string | number) =>
  useQuery(['refund_request', id], () => getData(`/refund_requests/${id}`), {
    enabled: Boolean(id),
  })

export const initiateRefundRequest = (
  subscriptionId: string | number,
  remarks: string
) => postData(`/subscriptions/${subscriptionId}/request_refund`, { remarks })

export const initiateAndSubmitRefundToSuperadmin = (
  subscriptionId: string | number,
  formData: FormData
) => postFormData(`/subscriptions/${subscriptionId}/request_refund`, formData)

export const submitRefundToSuperadmin = (
  id: string | number,
  formData: FormData
) => postFormData(`/refund_requests/${id}/submit_to_superadmin`, formData)

export const approveRefundRequest = (id: string | number, remarks?: string) =>
  postData(`/refund_requests/${id}/approve`, { remarks })

export const rejectRefundRequest = (id: string | number, remarks: string) =>
  postData(`/refund_requests/${id}/reject`, { remarks })

export const completeRefundRequest = (
  id: string | number,
  formData: FormData
) => postFormData(`/refund_requests/${id}/complete`, formData)
