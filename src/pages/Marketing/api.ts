import { useQuery } from '@tanstack/react-query'
import {
  getData,
  postData,
  updateData,
  deleteData,
} from '../../apis/api.helpers'
import apiUrl from '../../apis/api.url'
import { parseQueryParams } from '../../utilities/parsers'
const list = (url: string, params: any) =>
  getData(url + parseQueryParams(params || {}))
export const useMarketingDashboard = (enabled = true) =>
  useQuery(['marketing_dashboard'], () => getData('/marketing/dashboard'), {
    enabled,
  })
export const useMarketingForms = (params: any) =>
  useQuery(['marketing_forms', params], () =>
    list(apiUrl.MARKETING_FORMS, params)
  )
export const useMarketingForm = (id: any) =>
  useQuery(
    ['marketing_form', id],
    () => getData(apiUrl.MARKETING_FORMS + '/' + id),
    { enabled: Boolean(id) }
  )
export const createMarketingForm = (data: any) =>
  postData(apiUrl.MARKETING_FORMS, { marketing_form: data })
export const updateMarketingForm = ({ id, data }: any) =>
  updateData(apiUrl.MARKETING_FORMS + '/' + id, { marketing_form: data })
export const deleteMarketingForm = (id: any) =>
  deleteData(apiUrl.MARKETING_FORMS + '/' + id)
export const useMarketingCampaigns = (params: any) =>
  useQuery(['marketing_campaigns', params], () =>
    list(apiUrl.MARKETING_CAMPAIGNS, params)
  )
export const useUserMarketingCampaigns = (userId: any, params: any) =>
  useQuery(
    ['user_marketing_campaigns', userId, params],
    () => list(`/admin/users/${userId}/marketing_campaigns`, params),
    { enabled: Boolean(userId) }
  )
export const useMarketingCampaign = (id: any, userId?: any) =>
  useQuery(
    ['marketing_campaign', id, userId],
    () => {
      if (userId && userId !== 'undefined') {
        return getData(`/admin/users/${userId}/marketing_campaigns/${id}`)
      }
      return getData(apiUrl.MARKETING_CAMPAIGNS + '/' + id)
    },
    { enabled: Boolean(id) }
  )
export const createMarketingCampaign = (data: any) =>
  postData(apiUrl.MARKETING_CAMPAIGNS, { marketing_campaign: data })
export const updateMarketingCampaign = ({ id, data }: any) =>
  updateData(apiUrl.MARKETING_CAMPAIGNS + '/' + id, {
    marketing_campaign: data,
  })
export const deleteMarketingCampaign = (id: any) =>
  deleteData(apiUrl.MARKETING_CAMPAIGNS + '/' + id)
export const getCampaignPublicLink = (id: any) =>
  getData(apiUrl.MARKETING_CAMPAIGNS + '/' + id + '/public_link')
export const useCampaignLeads = (id: any, params: any, userId?: any) =>
  useQuery(
    ['marketing_leads', id, params, userId],
    async () => {
      if (userId && userId !== 'undefined') {
        try {
          const res = await list(
            `/admin/users/${userId}/marketing_campaigns/${id}`,
            params
          )
          if (res && (res.leads || res.marketing_leads)) return res
        } catch {
          // fallback
        }
      }
      return list(
        apiUrl.MARKETING_CAMPAIGNS + '/' + id + '/marketing_leads',
        params
      )
    },
    { enabled: Boolean(id) }
  )
export const useMarketingLead = (campaignId: any, leadId: any) =>
  useQuery(
    ['marketing_lead', campaignId, leadId],
    async () => {
      if (campaignId && campaignId !== 'undefined') {
        try {
          return await getData(
            apiUrl.MARKETING_CAMPAIGNS +
              '/' +
              campaignId +
              '/marketing_leads/' +
              leadId
          )
        } catch (err) {
          // fallback if generic endpoint exists
        }
      }
      return await getData('/marketing_leads/' + leadId)
    },
    { enabled: Boolean(leadId) }
  )
export const createMarketingLead = ({ campaignId, data }: any) =>
  postData(apiUrl.MARKETING_CAMPAIGNS + '/' + campaignId + '/marketing_leads', {
    marketing_lead: data,
  })
export const updateMarketingLead = ({ campaignId, id, data }: any) =>
  updateData(
    apiUrl.MARKETING_CAMPAIGNS + '/' + campaignId + '/marketing_leads/' + id,
    { marketing_lead: data }
  )
export const assignMarketingLead = ({ campaignId, id, assigned_to_id }: any) =>
  postData(
    apiUrl.MARKETING_CAMPAIGNS +
      '/' +
      campaignId +
      '/marketing_leads/' +
      id +
      '/assign',
    { assigned_to_id }
  )
export const getSalesTeam = () => getData(apiUrl.MARKETING_SALES_TEAM)
export const createLeadActivity = ({ campaignId, id, data }: any) =>
  postData(
    apiUrl.MARKETING_CAMPAIGNS +
      '/' +
      campaignId +
      '/marketing_leads/' +
      id +
      '/activities',
    { marketing_lead_activity: data }
  )

export const getPublicCampaign = (token: string) =>
  getData('/public/campaigns/' + token)
export const submitPublicLead = (token: string, data: any) =>
  postData('/public/campaigns/' + token + '/leads', { lead: data })
