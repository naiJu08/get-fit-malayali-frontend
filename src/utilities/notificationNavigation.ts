import { NotificationRecord } from '../apis/notifications.api'

/**
 * Resolves a notification's target URL into a role-appropriate, specific detail page route.
 * Handles role-specific views and ensures the user always lands on the most relevant detail view.
 */
export function resolveNotificationUrl(
  rawUrl?: string | null,
  userRole?: string | null,
  item?: Partial<NotificationRecord>
): string {
  const role = String(userRole || '')
    .trim()
    .toLowerCase()
  let url = (rawUrl || '').trim()

  // 1. If no URL is provided, attempt to infer from notification type / payload
  if (!url && item) {
    const type = String(item.notification_type || '').toLowerCase()
    switch (type) {
      case 'refund_request':
        return role === 'sales' ? '/sales/refunds' : '/refunds'
      case 'renewal_request':
        return '/sales/renewal-requests'
      case 'lead':
      case 'lead_acceptance':
      case 'proposal':
        if (role === 'sales') return '/sales/leads'
        if (role === 'marketing') return '/marketing/campaigns'
        return '/dashboard'
      case 'assignment':
        if (['nutritionist', 'physiotherapist', 'yogist'].includes(role)) {
          return `/users/${role}/assigned-clients`
        }
        return role === 'user' ? '/dashboard' : '/dashboard'
      case 'campaign':
      case 'campaign_expiring':
        return '/marketing/campaigns'
      case 'profile_completion':
      case 'profile_update':
        return role === 'sales' ? '/sales/clients' : '/users'
      default:
        return '/dashboard'
    }
  }

  if (!url) return '/dashboard'

  // Ensure leading slash
  if (!url.startsWith('/')) {
    url = `/${url}`
  }

  // Parse path and query string
  const [pathPart, queryPart] = url.split('?')
  const querySuffix = queryPart ? `?${queryPart}` : ''

  // ── 2. Role-specific URL transformations ──────────────────────────────

  // ── A. SALES ROLE ───────────────────────────────────────────────────
  if (role === 'sales') {
    // Client profile / details routes (Sales should view /sales/clients/:id)
    const userDetailMatch = pathPart.match(
      /^\/users\/(?:nutritionist\/|physiotherapist\/|yogist\/|sales\/|marketing\/)?(\d+)(?:\/.*)?$/
    )
    if (userDetailMatch) {
      const clientId = userDetailMatch[1]
      return `/sales/clients/${clientId}${querySuffix}`
    }
    if (
      pathPart === '/users' ||
      pathPart === '/users/sales' ||
      pathPart === '/sales/clients'
    ) {
      return `/sales/clients${querySuffix}`
    }

    // Lead detail routes (Sales should view /sales/leads/:id)
    const marketingLeadMatch = pathPart.match(
      /^\/marketing\/(?:campaigns\/\d+\/)?leads\/(\d+)(?:\/.*)?$/
    )
    if (marketingLeadMatch) {
      const leadId = marketingLeadMatch[1]
      return `/sales/leads/${leadId}${querySuffix}`
    }
    if (
      pathPart === '/marketing/campaigns' ||
      pathPart === '/marketing/leads'
    ) {
      return `/sales/leads${querySuffix}`
    }

    // Refund routes
    if (pathPart === '/refunds' || pathPart.startsWith('/refunds/')) {
      const refundIdMatch = pathPart.match(/^\/refunds\/(\d+)$/)
      if (refundIdMatch) {
        return `/sales/refunds/${refundIdMatch[1]}${querySuffix}`
      }
      return `/sales/refunds${querySuffix}`
    }

    // Renewal request routes
    if (
      pathPart === '/sales/renewal-requests' ||
      pathPart.startsWith('/sales/renewal-requests/')
    ) {
      return url
    }

    return url
  }

  // ── B. MARKETING ROLE ───────────────────────────────────────────────
  if (role === 'marketing') {
    // Sales lead -> Marketing lead detail
    const salesLeadMatch = pathPart.match(/^\/sales\/leads\/(\d+)$/)
    if (salesLeadMatch) {
      const leadId = salesLeadMatch[1]
      return `/marketing/leads/${leadId}${querySuffix}`
    }
    if (pathPart === '/sales/leads') {
      return `/marketing/campaigns${querySuffix}`
    }

    // User / Client links not accessible to marketing
    if (
      pathPart.startsWith('/users/') ||
      pathPart.startsWith('/sales/clients/')
    ) {
      return `/marketing/campaigns${querySuffix}`
    }

    return url
  }

  // ── C. SPECIALISTS: Nutritionist / Physiotherapist / Yogist ──────────
  if (['nutritionist', 'physiotherapist', 'yogist'].includes(role)) {
    // Sales client URL -> User details
    const salesClientMatch = pathPart.match(/^\/sales\/clients\/(\d+)$/)
    if (salesClientMatch) {
      const clientId = salesClientMatch[1]
      return `/users/${clientId}/details${querySuffix}`
    }
    if (pathPart === '/sales/clients' || pathPart === '/sales/leads') {
      return `/users/${role}/assigned-clients${querySuffix}`
    }

    // Assigned clients general path -> Role specific path
    if (pathPart === '/assigned-clients') {
      return `/users/${role}/assigned-clients${querySuffix}`
    }
    const assignedClientMatch = pathPart.match(/^\/assigned-clients\/(\d+)$/)
    if (assignedClientMatch) {
      return `/users/${role}/assigned-clients/${assignedClientMatch[1]}${querySuffix}`
    }

    // If another role's assigned client was linked, map to current specialist role
    const otherRoleAssignedMatch = pathPart.match(
      /^\/users\/(?:nutritionist|physiotherapist|yogist)\/assigned-clients(?:\/(\d+))?$/
    )
    if (otherRoleAssignedMatch) {
      const targetId = otherRoleAssignedMatch[1]
      return targetId
        ? `/users/${role}/assigned-clients/${targetId}${querySuffix}`
        : `/users/${role}/assigned-clients${querySuffix}`
    }

    return url
  }

  // ── D. CLIENT (Normal User) ─────────────────────────────────────────
  if (role === 'user') {
    // Clients cannot access staff or admin routes
    if (
      pathPart.startsWith('/sales/') ||
      pathPart.startsWith('/marketing/') ||
      pathPart.startsWith('/admin') ||
      pathPart.startsWith('/refunds') ||
      pathPart.startsWith('/users/')
    ) {
      return `/dashboard${querySuffix}`
    }
    return url
  }

  // ── E. SUPERADMIN / ADMIN ───────────────────────────────────────────
  // Superadmin and Admin have universal access. Normalize standard paths:
  if (pathPart.startsWith('/sales/refunds/')) {
    const refundId = pathPart.replace('/sales/refunds/', '')
    return `/refunds/${refundId}${querySuffix}`
  }

  return url
}
