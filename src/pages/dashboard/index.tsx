import DashboardView from './dashboard'
import { useAdminDashboard } from './api'
import type { DashboardResponse } from './types'

export default function DashboardPage() {
  const { data, isLoading, isError, refetch } = useAdminDashboard()

  return (
    <DashboardView
      data={data as DashboardResponse | undefined}
      loading={isLoading}
      error={isError}
      onRetry={() => refetch()}
    />
  )
}
