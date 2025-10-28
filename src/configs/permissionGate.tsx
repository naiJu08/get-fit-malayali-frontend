import { cloneElement, ReactElement } from 'react'

import { PermissionDataProps, useAuthStore } from '../store/authStore'
import { useDomainManageStore } from '../store/domainManageStore'
import { router_config } from './route.config'

export const hasPermission = ({ scopes }: { scopes: string[] }) => {
  const permissions = useAuthStore.getState().permissionData
  const isAdmin = useAuthStore.getState().userData?.is_admin || false

  if (isAdmin) {
    return true
  }
  if (scopes.length === 0) {
    return true
  }

  const has_permission = permissions?.some((permission: PermissionDataProps) =>
    scopes?.some((sc) => permission.acl === sc)
  )
  return has_permission
}
const domainType = useDomainManageStore.getState().domainType

export const checkMultiplePermission = (slug_key: string) => {
  const isAdmin = useAuthStore.getState().userData?.is_admin || false
  // const permissions = useAuthStore.getState().permissionData

  if (isAdmin) return true

  const currentRouteConfig = router_config[slug_key]
  if (currentRouteConfig && currentRouteConfig.permission_slugs.length > 0) {
    return currentRouteConfig.permission_slugs.includes(domainType as string)
    // return permissions?.some((per) =>
    //   currentRouteConfig.permission_slugs.includes(per?.codename as string)
    // )
  }
  return true
}
export const checkPermissionAny = (permissionAcl: string) => {
  const isAdmin = useAuthStore.getState().userData?.is_admin || false

  const permissions = useAuthStore.getState().permissionData
  if (isAdmin) {
    return true
  }
  const check_permission = permissions?.some(
    (permission: any) => permission.codename === permissionAcl
  )

  return check_permission
}
export const blockActionsbyStatus = (
  currentStatus?: string,
  statusToBlock: string[] = [
    'cancelled',
    'converted',
    'rejected',
    'order_cancelled',
    'order_completed_payment_done',
  ]
) => {
  if (currentStatus) {
    return statusToBlock?.some((status: string) => status === currentStatus)
  }

  return false
}
export const allowActionsByStatusExcept = (
  currentStatus?: string,
  statusToblock: string[] = [
    'cancelled',
    'converted',
    'order_cancelled',
    'order_completed_payment_done',
    'rejected',
  ]
) => {
  if (currentStatus) {
    return statusToblock?.some((status: string) => status === currentStatus)
      ? false
      : true
  }
  return false
}
const PermissionsGate = ({
  children,
  errorMessage = 'No Permission',
  errorProps = null,
  scopes,
  overridePermission = false,
}: {
  children: any
  errorMessage?: string
  errorProps?: any
  scopes: string[]
  overridePermission?: boolean
}): ReactElement => {
  const isAdmin = useAuthStore.getState().userData?.is_admin || false

  const permissionGranted =
    isAdmin || overridePermission
      ? isAdmin || overridePermission
      : hasPermission({ scopes })

  if (!permissionGranted && !errorProps) return <>{errorMessage}</>

  if (!permissionGranted && errorProps)
    return cloneElement(children, { ...errorProps })

  return <>{children}</>
}
export default PermissionsGate
