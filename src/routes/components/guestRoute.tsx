import { Suspense } from 'react'
import { Navigate, Outlet } from 'react-router-dom'

import CommonLoader from '../../components/common/commonLoader'
// import { useAuthStore } from '../../configs/permissionGate'
import { useAuthStore } from '../../store/authStore'

type Props = {
  children: React.ReactNode
}

const GuestRoute = ({ children }: Props) => {
  const { authenticated } = useAuthStore()

  return !authenticated ? (
    <Suspense fallback={<CommonLoader />}>
      <>{children}</> || <Outlet />
    </Suspense>
  ) : (
    <>
      <Navigate to={'/'} replace />
    </>
  )
}

export default GuestRoute
