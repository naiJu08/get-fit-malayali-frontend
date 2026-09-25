import { NotificationRecord } from '../apis/notifications.api'

/**
 * Extracts a target name (client, lead, campaign) from notification title or message
 * to enable smart filtering and modal auto-opening when no explicit numeric ID is present.
 */
function extractTargetName(item?: Partial<NotificationRecord>): string | null {
  if (!item) return null
  const title = String(item.title || '').trim()
  const message = String(item.message || '').trim()

  // 1. Colon-separated headers: "Refund Request: Alfiya", "Renewal Request: Bini", "Campaign Expiring Soon: Camp 234", etc.
  const colonIdx = title.indexOf(':')
  if (colonIdx !== -1) {
    const candidate = title.slice(colonIdx + 1).trim()
    if (candidate && candidate.length > 0 && !candidate.startsWith('₹')) {
      return candidate.replace(/^['"]|['"]$/g, '').trim()
    }
  }

  // 2. Single or double quotes in title or message: 'Camp 77'
  const titleQuoteMatch = title.match(/['"]([^'"]+)['"]/)
  if (titleQuoteMatch) {
    return titleQuoteMatch[1].trim()
  }

  // 3. Message patterns: "submitted by Alfiya", "for Alfiya", "Client Bini has requested...", etc.
  const clientMsgMatch = message.match(
    /(?:Client|for|lead|by|requested by|submitted by)\s+([A-Za-z0-9\s]+?)(?:\s+has|\s+was|\s+completed|\s+is|\.|\(|\,)/i
  )
  if (clientMsgMatch) {
    const candidate = clientMsgMatch[1].trim()
    if (candidate && candidate.length > 1 && !candidate.startsWith('₹')) {
      return candidate
    }
  }

  // 4. Message quotes: "campaign 'Camp 77'"
  const msgQuoteMatch = message.match(/['"]([^'"]+)['"]/)
  if (msgQuoteMatch) {
    return msgQuoteMatch[1].trim()
  }

  return null
}

function appendSearchQuery(baseUrl: string, searchTerm: string | null): string {
  if (!searchTerm) return baseUrl
  const hasQuery = baseUrl.includes('?')
  const hasSearch = /[\?&]search=/i.test(baseUrl)
  if (hasSearch) return baseUrl
  const separator = hasQuery ? '&' : '?'
  return `${baseUrl}${separator}search=${encodeURIComponent(searchTerm)}`
}

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
  const targetName = extractTargetName(item)

  // 1. If no URL is provided, attempt to infer from notification type / payload
  if (!url && item) {
    const type = String(item.notification_type || '').toLowerCase()
    switch (type) {
      case 'refund_request':
        return appendSearchQuery(
          role === 'sales' ? '/sales/refunds' : '/refunds',
          targetName
        )
      case 'renewal_request':
      case 'renewal':
        return appendSearchQuery('/sales/renewal-requests', targetName)
      case 'lead':
      case 'lead_acceptance':
      case 'proposal':
        if (role === 'sales')
          return appendSearchQuery('/sales/leads', targetName)
        if (role === 'marketing')
          return appendSearchQuery('/marketing/campaigns', targetName)
        return '/dashboard'
      case 'assignment':
        if (['nutritionist', 'physiotherapist', 'yogist'].includes(role)) {
          return appendSearchQuery(
            `/users/${role}/assigned-clients`,
            targetName
          )
        }
        return role === 'user' ? '/dashboard' : '/dashboard'
      case 'campaign':
      case 'campaign_expiring':
        return appendSearchQuery('/marketing/campaigns', targetName)
      case 'profile_completion':
      case 'profile_update':
        return appendSearchQuery(
          role === 'sales' ? '/sales/clients' : '/users',
          targetName
        )
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
      return appendSearchQuery(`/sales/clients${querySuffix}`, targetName)
    }

    // Lead detail routes (Sales should view /sales/leads/:id)
    const marketingLeadMatch =
      pathPart.match(
        /^\/users\/marketing\/\d+\/campaigns\/\d+\/leads\/(\d+)(?:\/.*)?$/
      ) ||
      pathPart.match(
        /^\/marketing\/(?:campaigns\/\d+\/)?leads\/(\d+)(?:\/.*)?$/
      )
    if (marketingLeadMatch) {
      const leadId = marketingLeadMatch[1]
      return `/sales/leads/${leadId}${querySuffix}`
    }
    if (
      pathPart === '/marketing/campaigns' ||
      pathPart === '/marketing/leads' ||
      pathPart.match(/^\/users\/marketing\/\d+\/campaigns(?:\/\d+\/leads)?$/)
    ) {
      return appendSearchQuery(`/sales/leads${querySuffix}`, targetName)
    }

    // Refund routes
    if (pathPart === '/refunds' || pathPart.startsWith('/refunds/')) {
      const refundIdMatch = pathPart.match(/^\/refunds\/(\d+)$/)
      if (refundIdMatch) {
        return `/sales/refunds/${refundIdMatch[1]}${querySuffix}`
      }
      return appendSearchQuery(`/sales/refunds${querySuffix}`, targetName)
    }
    if (pathPart === '/sales/refunds') {
      return appendSearchQuery(`/sales/refunds${querySuffix}`, targetName)
    }

    // Renewal request routes
    if (
      pathPart === '/sales/renewal-requests' ||
      pathPart === '/renewal-requests'
    ) {
      return appendSearchQuery(
        `/sales/renewal-requests${querySuffix}`,
        targetName
      )
    }
    if (pathPart.startsWith('/renewal-requests/')) {
      const renewalId = pathPart.replace('/renewal-requests/', '')
      return `/sales/renewal-requests/${renewalId}${querySuffix}`
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
      return appendSearchQuery(`/marketing/campaigns${querySuffix}`, targetName)
    }

    // Normalize nested superadmin user-marketing URL to direct marketing URL
    const userMarketingLeadMatch =
      pathPart.match(
        /^\/users\/marketing\/\d+\/campaigns\/(\d+)\/leads\/(\d+)(?:\/.*)?$/
      ) ||
      pathPart.match(/^\/marketing\/campaigns\/(\d+)\/leads\/(\d+)(?:\/.*)?$/)
    if (userMarketingLeadMatch) {
      return `/marketing/campaigns/${userMarketingLeadMatch[1]}/leads/${userMarketingLeadMatch[2]}${querySuffix}`
    }

    const userMarketingCampaignMatch =
      pathPart.match(/^\/users\/marketing\/\d+\/campaigns\/(\d+)(?:\/.*)?$/) ||
      pathPart.match(/^\/marketing\/campaigns\/(\d+)(?:\/.*)?$/)
    if (userMarketingCampaignMatch) {
      return `/marketing/campaigns/${userMarketingCampaignMatch[1]}/details${querySuffix}`
    }

    // User / Client links not accessible to marketing
    if (
      (pathPart.startsWith('/users/') &&
        !pathPart.startsWith('/users/marketing/')) ||
      pathPart.startsWith('/sales/clients/')
    ) {
      return appendSearchQuery(`/marketing/campaigns${querySuffix}`, targetName)
    }

    if (pathPart === '/marketing/campaigns') {
      return appendSearchQuery(url, targetName)
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
      return appendSearchQuery(
        `/users/${role}/assigned-clients${querySuffix}`,
        targetName
      )
    }

    // Assigned clients general path -> Role specific path
    if (pathPart === '/assigned-clients') {
      return appendSearchQuery(
        `/users/${role}/assigned-clients${querySuffix}`,
        targetName
      )
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
        : appendSearchQuery(
            `/users/${role}/assigned-clients${querySuffix}`,
            targetName
          )
    }

    if (pathPart === `/users/${role}/assigned-clients`) {
      return appendSearchQuery(url, targetName)
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
  const superadminCampaignLeadMatch =
    pathPart.match(
      /^\/users\/marketing\/\d+\/campaigns\/(\d+)\/leads\/(\d+)(?:\/.*)?$/
    ) ||
    pathPart.match(/^\/marketing\/campaigns\/(\d+)\/leads\/(\d+)(?:\/.*)?$/)
  if (superadminCampaignLeadMatch) {
    return `/marketing/campaigns/${superadminCampaignLeadMatch[1]}/leads/${superadminCampaignLeadMatch[2]}${querySuffix}`
  }

  const superadminCampaignMatch =
    pathPart.match(/^\/users\/marketing\/\d+\/campaigns\/(\d+)(?:\/.*)?$/) ||
    pathPart.match(/^\/marketing\/campaigns\/(\d+)(?:\/.*)?$/)
  if (superadminCampaignMatch) {
    return `/marketing/campaigns/${superadminCampaignMatch[1]}/details${querySuffix}`
  }

  if (pathPart.startsWith('/sales/refunds/')) {
    const refundId = pathPart.replace('/sales/refunds/', '')
    return `/refunds/${refundId}${querySuffix}`
  }
  if (pathPart === '/sales/refunds' || pathPart === '/refunds') {
    return appendSearchQuery(`/refunds${querySuffix}`, targetName)
  }
  if (
    pathPart === '/sales/renewal-requests' ||
    pathPart === '/renewal-requests'
  ) {
    return appendSearchQuery(
      `/sales/renewal-requests${querySuffix}`,
      targetName
    )
  }
  if (pathPart.startsWith('/renewal-requests/')) {
    const renewalId = pathPart.replace('/renewal-requests/', '')
    return `/sales/renewal-requests/${renewalId}${querySuffix}`
  }
  if (pathPart === '/marketing/campaigns') {
    return appendSearchQuery(url, targetName)
  }

  return url
}
