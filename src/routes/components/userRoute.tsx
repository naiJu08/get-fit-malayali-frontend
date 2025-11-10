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
    // if (!authenticated) return false // Admin has full permissions

    const currentRouteConfig = router_config[slug_key]
    if (currentRouteConfig?.permission_slugs.length === 0) {
      return true
    } else if (
      roleData &&
      roleData?.name &&
      currentRouteConfig &&
      currentRouteConfig?.permission_slugs.length > 0
    ) {
      const trimmedRoleName = roleData?.name.trim() // Trim whitespace
      return currentRouteConfig?.permission_slugs.includes(
        trimmedRoleName as string
      )
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
