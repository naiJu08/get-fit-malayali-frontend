import { useEffect } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'

import { checkMultiplePermission } from '../../configs/permissionGate'
import { useAppStore } from '../../store/appStore'
import { useAuthStore } from '../../store/authStore'

type Props = {
  children: React.ReactNode
  slug_key: string
}

const ChildRoute = ({ children, slug_key }: Props) => {
  const { authenticated } = useAuthStore()
  const { setActiveRouteSlug } = useAppStore()
  const location = useLocation()
  const navigate = useNavigate()
  useEffect(() => {
    setActiveRouteSlug(slug_key)
    // eslint-disable-next-line
  }, [slug_key, location?.pathname])
  if (!authenticated) return <Navigate to="/login" replace />
  return (
    <>
      {checkMultiplePermission(slug_key) ? (
        <>{children}</>
      ) : (
        <>{navigate(-1)}</>
      )}
    </>
  )
}
export default ChildRoute
