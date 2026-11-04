import { useEffect, Suspense } from 'react'
import { Navigate, useLocation } from 'react-router-dom'

import Layout from '../../layout/userLayout'
import { useAppStore } from '../../store/appStore'
import { useAuthStore } from '../../store/authStore'
import { router_config } from '../../configs/route.config'
import CommonLoader from '../../components/common/commonLoader'

type Props = {
  children: React.ReactNode
  slug_key: string
  hasChild?: boolean
}

const UserRoute = ({ children, slug_key, hasChild = false }: Props) => {
  const { authenticated, roleData } = useAuthStore()
  const { setActiveRouteSlug } = useAppStore()
  const location = useLocation()

  useEffect(() => {
    if (!hasChild) {
      setActiveRouteSlug(slug_key)
    }
    // setMenuOpened(false)
    // eslint-disable-next-line
  }, [slug_key, location?.pathname])

  if (!authenticated) return <Navigate to="/login" replace />

  const hasPermission = () => {
    const currentRouteConfig = router_config[slug_key]
    if (
      !currentRouteConfig ||
      !currentRouteConfig?.permission_slugs ||
      currentRouteConfig.permission_slugs.length === 0
    ) {
      return true
    }

    if (roleData && roleData?.name) {
      const trimmedRoleName = roleData.name.trim().toLowerCase()
      if (trimmedRoleName === 'superadmin' || trimmedRoleName === 'admin') {
        return true
      }
      const allowedRoles = Array.isArray(currentRouteConfig.permission_slugs)
        ? currentRouteConfig.permission_slugs.map((s: string) =>
            String(s).toLowerCase()
          )
        : [String(currentRouteConfig.permission_slugs).toLowerCase()]
      return allowedRoles.includes(trimmedRoleName)
    }

    return true // No specific permissions required or roleData not available
  }

  return (
    <Layout>
      <Suspense fallback={<CommonLoader />}>
        {hasPermission() ? <>{children}</> : <> No Permission </>}
      </Suspense>
    </Layout>
  )
}

export default UserRoute
