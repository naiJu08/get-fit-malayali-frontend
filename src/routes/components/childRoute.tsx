import { useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { router_config } from '../../configs/route.config'

import { useAppStore } from '../../store/appStore'
import { useAuthStore } from '../../store/authStore'

type Props = {
  children: React.ReactNode
  slug_key: string
}

const ChildRoute = ({ children, slug_key }: Props) => {
  const { authenticated, roleData } = useAuthStore()
  const { setActiveRouteSlug } = useAppStore()
  const location = useLocation()

  useEffect(() => {
    setActiveRouteSlug(slug_key)
    // eslint-disable-next-line
  }, [slug_key, location?.pathname])
  if (!authenticated) return <Navigate to="/" replace />

  const hasPermission = () => {
    // if (isAdmin) return false // Admin has full permissions

    const currentRouteConfig = router_config[slug_key]
    if (
      roleData &&
      roleData.name &&
      currentRouteConfig &&
      currentRouteConfig.permission_slugs.length > 0
    ) {
      const trimmedRoleName = roleData.name.trim() // Trim whitespace
      return currentRouteConfig.permission_slugs.includes(trimmedRoleName)
    }

    return true // No specific permissions required or roleData not available
  }
  return <>{hasPermission() ? <>{children}</> : <>No Permission</>}</>
}
export default ChildRoute
