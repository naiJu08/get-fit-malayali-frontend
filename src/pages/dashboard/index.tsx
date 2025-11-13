import DashboardView, { DashboardResponse } from './dashboard'
import { useAdminDashboard } from './api'

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
