import { Suspense, useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'

import Layout from '../../layout/userLayout'
import { useAppStore } from '../../store/appStore'
import { useAuthStore } from '../../store/authStore'
import CommonLoader from '../../components/common/commonLoader'

type Props = {
  children: React.ReactNode
  slug_key: string
  hasChild?: boolean
}

const UserRoute = ({ children, slug_key, hasChild = false }: Props) => {
  const { authenticated } = useAuthStore()
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

  return (
    <Layout>
      <Suspense fallback={<CommonLoader />}>
        <>{children}</>

        {/* {checkMultiplePermission(slug_key) ? (
          <>{children}</>
        ) : (
          <> No Permission </>
        )} */}
      </Suspense>
    </Layout>
  )
}

export default UserRoute
