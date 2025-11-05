import { getData, postData } from '../../apis/api.helpers'
import apiUrl from '../../apis/api.url'
import { useEffect, useMemo, useState } from 'react'

export type CreateNotificationPayload = {
  notification: {
    user_ids: number[]
    title: string
    message: string
    notification_type: string
    scheduled_at?: string
  }
}

export const createNotification = (payload: CreateNotificationPayload) =>
  postData(apiUrl.NOTIFICATIONS, payload)

export const searchUsers = async (search: string, page = 1, per_page = 20) => {
  const params = new URLSearchParams()
  if (search) params.set('search', search)
  params.set('page', String(page))
  params.set('per_page', String(per_page))
  const url = `${apiUrl.ADMIN_USER}?${params.toString()}`
  const res = await getData(url)
  const items: any[] = Array.isArray(res) ? res : res?.items || res?.users || []
  const total = res?.meta?.total_count ?? items.length
  return { items, total }
}

export type NotificationItem = {
  id: number | string
  title: string
  message: string
  notification_type: string
  is_read?: boolean
  sent_by?: string
  scheduled_at?: string | null
  delivered_at?: string | null
  created_at?: string
}

export type UseNotificationsParams = {
  page?: number
  per_page?: number
  search?: string
  ordering?: string
}

export function useNotifications({
  page = 1,
  per_page = 10,
  search = '',
  ordering = '',
}: UseNotificationsParams) {
  const [items, setItems] = useState<NotificationItem[]>([])
  const [total, setTotal] = useState<number>(0)
  const [currentPage, setCurrentPage] = useState<number>(page)
  const [isFetching, setIsFetching] = useState<boolean>(false)
  const [error, setError] = useState<any>(null)

  const params = useMemo(() => {
    const usp = new URLSearchParams()
    usp.set('page', String(page))
    usp.set('per_page', String(per_page))
    if (search) usp.set('search', search)
    if (ordering) usp.set('ordering', ordering)
    return usp
  }, [page, per_page, search, ordering])

  const fetchData = async () => {
    setIsFetching(true)
    setError(null)
    try {
      const url = `${apiUrl.NOTIFICATIONS_LIST}?${params.toString()}`
      const res: any = await getData(url)
      const dataArr: any[] = Array.isArray(res)
        ? res
        : res?.notifications || res?.items || res?.data || []
      const mapped: NotificationItem[] = dataArr.map((n: any) => ({
        id: n?.id,
        title: n?.title,
        message: n?.message,
        notification_type: n?.notification_type,
        is_read: n?.is_read,
        sent_by: n?.sent_by,
        scheduled_at: n?.scheduled_at,
        delivered_at: n?.delivered_at,
        created_at: n?.created_at,
      }))
      setItems(mapped)
      setTotal(
        res?.count ?? res?.total ?? res?.meta?.total_count ?? mapped.length
      )
      setCurrentPage(res?.current_page ?? page)
    } catch (err) {
      setError(err)
      setItems([])
      setTotal(0)
    } finally {
      setIsFetching(false)
    }
  }

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.toString()])

  return {
    items,
    total,
    current_page: currentPage,
    isFetching,
    error,
    refetch: fetchData,
  }
}
