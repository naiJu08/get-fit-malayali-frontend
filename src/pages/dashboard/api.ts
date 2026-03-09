import { useQuery } from '@tanstack/react-query'

import { getData } from '../../apis/api.helpers'
import apiUrl from '../../apis/api.url'
import type { DashboardResponse } from './types'

const fetchDashboard = async (): Promise<DashboardResponse> => {
  const response = await getData(apiUrl.ADMIN_DASHBOARD)
  return response as DashboardResponse
}

export const useAdminDashboard = () =>
  useQuery(['admin-dashboard'], fetchDashboard, {
    refetchOnWindowFocus: false,
  })
