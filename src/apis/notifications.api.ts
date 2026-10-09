import { getData, postData, deleteData } from './api.helpers'
import apiUrl from './api.url'

export interface NotificationRecord {
  id: number | string
  title: string
  message: string
  notification_type?: string
  action_url?: string | null
  is_read: boolean
  sent_by?: string
  scheduled_at?: string
  delivered_at?: string
  created_at: string
}

export interface NotificationListResponse {
  notifications: NotificationRecord[]
  unread_count: number
  read_count?: number
  total_count?: number
  meta?: {
    current_page: number
    next_page: number | null
    prev_page: number | null
    total_pages: number
    total_count: number
  }
}

export const getNotifications = async (params?: {
  status?: 'unread' | 'read' | 'all' | 'new'
  unread?: boolean | string
  page?: number
  per_page?: number
  type?: string
}): Promise<NotificationListResponse> => {
  const queryParams = new URLSearchParams()
  if (params?.status) queryParams.append('status', params.status)
  if (params?.unread !== undefined)
    queryParams.append('unread', String(params.unread))
  if (params?.page) queryParams.append('page', String(params.page))
  if (params?.per_page) queryParams.append('per_page', String(params.per_page))
  if (params?.type) queryParams.append('type', params.type)

  const queryString = queryParams.toString()
  const base = apiUrl.NOTIFICATIONS || '/notifications'
  const url = queryString ? `${base}?${queryString}` : base
  return getData(url)
}

export const markNotificationAsRead = async (id: number | string) => {
  const base = apiUrl.NOTIFICATIONS || '/notifications'
  return postData(`${base}/${id}/mark_as_read`, {})
}

export const markAllNotificationsAsRead = async () => {
  const base = apiUrl.NOTIFICATIONS || '/notifications'
  return postData(`${base}/mark_all_as_read`, {})
}

export const deleteNotification = async (id: number | string) => {
  const base = apiUrl.NOTIFICATIONS || '/notifications'
  return deleteData(`${base}/${id}`)
}
