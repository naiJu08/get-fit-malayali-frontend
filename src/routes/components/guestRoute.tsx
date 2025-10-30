import { Suspense } from 'react'
import { Navigate, Outlet } from 'react-router-dom'

import CommonLoader from '../../components/common/commonLoader'
// import { useAuthStore } from '../../configs/permissionGate'
import { useAuthStore } from '../../store/authStore'

import { useDomainManageStore } from '../../store/domainManageStore'

type Props = {
  children: React.ReactNode
}

const GuestRoute = ({ children }: Props) => {
  const { authenticated } = useAuthStore()
  const { domainType } = useDomainManageStore()

  return !authenticated ? (
    <Suspense fallback={<CommonLoader />}>
      <>{children}</> || <Outlet />
    </Suspense>
  ) : (
    <>
      {domainType === 'Organisation' ? (
        <Navigate to={'/myorganisation/profile'} replace />
      ) : domainType === 'Assessor' ? (
        <Navigate to={'/assessors'} replace />
      ) : (
        <Navigate to={'/dashboard'} replace />
      )}
    </>
  )
}

export default GuestRoute
