import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import moment from 'moment'

import Icons from '../../components/common/icons'
import { getAdminDetails, getActivePlanOverview } from './api'
import { Tab, TabContainer } from '../../components/common/tab'
import DetailsInfo from './Details/DetailsInfo'
import Subscriptions from './Details/Subscriptions'
import BodyMeasurements from './Details/BodyMeasurements'
// import BodyComposition from './Details/BodyComposition'
import Vitals from './Details/Vitals'
import AcceptedClients from './Details/AcceptedClients'
import AssignedClientsTab from './Details/AssignedClientsTab'
import Reports from './Details/Reports'
import ReminderSettings from './Details/ReminderSettings'
import AdditionalInfo from './Details/AdditionalInfo'
import RecipesTab from './Details/Recipe.tsx/Recipes'
import SubscriptionHistory from './Details/SubscriptionHistory'
import DietHistory from './Details/DietHistory'
import UserCampaigns from './Details/UserCampaigns'
import UserSalesLeads from './Details/UserSalesLeads'
import UserSalesClients from './Details/UserSalesClients'
import CreateAdmin from './create'
import AssignSalesModal from './AssignSalesModal'
import AcceptClientModal from './Details/AcceptClientModal'
import MarketingFormsTab from './Details/MarketingFormsTab'
import ClientPackagesTab from '../Sales/ClientPackagesTab'
import { useSnackbarManager } from '../../components/common/snackbar'
import { useAuthStore } from '../../store/authStore'
import { useQueryClient } from '@tanstack/react-query'
import {
  acceptAssignedClient,
  useAssignedClientForUser,
} from '../AssignedClients/api'
import { ClientWorkflowFollowUps } from '../AssignedClients/WorkflowPanels'
import { useClientPackageCycles } from '../Sales/api'

const formatDate = (date?: string | null) => {
  if (!date) return '--'
  return moment(date).format('MMM D, YYYY')
}

const capitalizeFirst = (text?: string) => {
  if (!text) return ''
  return text.charAt(0).toUpperCase() + text.slice(1)
}

const getCycleCardTheme = (status?: string) => {
  const s = (status || '').toLowerCase()
  switch (s) {
    case 'active':
      return {
        key: 'active',
        cardBg:
          'bg-gradient-to-r from-emerald-500/[0.09] via-teal-500/[0.04] to-white',
        cardBorder: 'border-emerald-200 hover:border-emerald-400',
        activeRing: 'border-emerald-500 ring-4 ring-emerald-500/15',
        shadow: 'shadow-xs hover:shadow-md hover:shadow-emerald-500/10',
        iconGradient: 'from-emerald-500 via-teal-500 to-emerald-600',
        iconShadow: 'shadow-emerald-500/25',
        iconRing: 'ring-emerald-400/25',
        badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200/90',
        dotColor: 'bg-emerald-500',
        pulse: true,
        tag: 'Active Plan',
        svgFill: '#10b981',
        svgSecondary: '#0d9488',
        accentText: 'text-emerald-700',
      }
    case 'proposed':
      return {
        key: 'proposed',
        cardBg:
          'bg-gradient-to-r from-indigo-500/[0.09] via-blue-500/[0.04] to-white',
        cardBorder: 'border-indigo-200 hover:border-indigo-400',
        activeRing: 'border-indigo-500 ring-4 ring-indigo-500/15',
        shadow: 'shadow-xs hover:shadow-md hover:shadow-indigo-500/10',
        iconGradient: 'from-indigo-500 via-blue-500 to-indigo-600',
        iconShadow: 'shadow-indigo-500/25',
        iconRing: 'ring-indigo-400/25',
        badgeBg: 'bg-indigo-50 text-indigo-700 border-indigo-200/90',
        dotColor: 'bg-indigo-500',
        pulse: false,
        tag: 'Proposed Plan',
        svgFill: '#6366f1',
        svgSecondary: '#3b82f6',
        accentText: 'text-indigo-700',
      }
    case 'refunded':
      return {
        key: 'refunded',
        cardBg:
          'bg-gradient-to-r from-rose-500/[0.09] via-pink-500/[0.04] to-white',
        cardBorder: 'border-rose-200 hover:border-rose-400',
        activeRing: 'border-rose-500 ring-4 ring-rose-500/15',
        shadow: 'shadow-xs hover:shadow-md hover:shadow-rose-500/10',
        iconGradient: 'from-rose-500 via-pink-500 to-rose-600',
        iconShadow: 'shadow-rose-500/25',
        iconRing: 'ring-rose-400/25',
        badgeBg: 'bg-rose-50 text-rose-700 border-rose-200/90',
        dotColor: 'bg-rose-500',
        pulse: false,
        tag: 'Refunded',
        svgFill: '#f43f5e',
        svgSecondary: '#e11d48',
        accentText: 'text-rose-700',
      }
    default:
      return {
        key: 'other',
        cardBg:
          'bg-gradient-to-r from-slate-500/[0.06] via-gray-500/[0.03] to-white',
        cardBorder: 'border-gray-200 hover:border-gray-300',
        activeRing: 'border-slate-500 ring-4 ring-slate-400/15',
        shadow: 'shadow-xs hover:shadow-md',
        iconGradient: 'from-slate-500 via-gray-500 to-slate-600',
        iconShadow: 'shadow-slate-500/20',
        iconRing: 'ring-slate-300/25',
        badgeBg: 'bg-gray-100 text-gray-700 border-gray-200',
        dotColor: 'bg-gray-400',
        pulse: false,
        tag: status ? capitalizeFirst(status) : 'Completed',
        svgFill: '#64748b',
        svgSecondary: '#94a3b8',
        accentText: 'text-gray-700',
      }
  }
}

const CycleDecorativeWatermark = ({
  theme,
  isSmall = false,
}: {
  theme: ReturnType<typeof getCycleCardTheme>
  isSmall?: boolean
}) => (
  <div className="pointer-events-none absolute inset-y-0 right-0 w-44 sm:w-56 overflow-hidden select-none">
    <svg
      className={`absolute -right-2 -bottom-2 h-[120%] w-full opacity-20 transition-all duration-300 group-hover:opacity-30 ${
        isSmall ? 'scale-90' : ''
      }`}
      viewBox="0 0 240 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient
          id={`grad-${theme.key}-${isSmall ? 'sm' : 'lg'}`}
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          <stop offset="0%" stopColor={theme.svgFill} stopOpacity="0.85" />
          <stop
            offset="100%"
            stopColor={theme.svgSecondary}
            stopOpacity="0.1"
          />
        </linearGradient>
      </defs>
      {/* Decorative dynamic wave ribbons */}
      <path
        d="M40 120C80 95 110 35 155 55C200 75 220 25 240 5V120H40Z"
        fill={`url(#grad-${theme.key}-${isSmall ? 'sm' : 'lg'})`}
      />
      <path
        d="M10 120C55 85 95 50 145 75C195 100 215 50 240 30"
        stroke={theme.svgFill}
        strokeWidth="2.5"
        strokeDasharray="4 4"
        strokeLinecap="round"
        opacity="0.55"
      />
      <path
        d="M60 120C100 100 130 65 175 80C210 92 225 68 240 52"
        stroke={theme.svgSecondary}
        strokeWidth="1.75"
        strokeLinecap="round"
        opacity="0.7"
      />
      {/* Dynamic pulse rings */}
      <circle
        cx="205"
        cy="30"
        r="22"
        stroke={theme.svgFill}
        strokeWidth="1.5"
        strokeDasharray="3 3"
        opacity="0.4"
      />
      <circle
        cx="205"
        cy="30"
        r="13"
        stroke={theme.svgSecondary}
        strokeWidth="1.5"
        opacity="0.45"
      />
      <circle cx="205" cy="30" r="6" fill={theme.svgFill} opacity="0.25" />
      {/* Constellation sparkles */}
      <circle cx="140" cy="22" r="3" fill={theme.svgSecondary} opacity="0.5" />
      <circle cx="168" cy="14" r="2" fill={theme.svgFill} opacity="0.4" />
      <circle cx="115" cy="45" r="2.5" fill={theme.svgFill} opacity="0.35" />
    </svg>
  </div>
)

type DetailRole =
  | 'user'
  | 'nutritionist'
  | 'physiotherapist'
  | 'yogist'
  | 'sales'
  | 'marketing'

const DETAIL_ROLE_PATHS: Record<DetailRole, string> = {
  user: '/users',
  nutritionist: '/users/nutritionist',
  physiotherapist: '/users/physiotherapist',
  yogist: '/users/yogist',
  sales: '/users/sales',
  marketing: '/users/marketing',
}

const DETAIL_ROLE_LABELS: Record<DetailRole, string> = {
  user: 'User',
  nutritionist: 'Nutritionist',
  physiotherapist: 'Physiotherapist',
  yogist: 'Yogist',
  sales: 'Sales',
  marketing: 'Marketing',
}

export default function UserDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const loginRole = useAuthStore((s: any) => s.roleData?.name?.toLowerCase?.())
  const location = useLocation()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string>('')
  const [subscriptionId, setSubscriptionId] = useState<string | number | null>(
    null
  )
  const [selectedCycleId, setSelectedCycleId] = useState<string>('')
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [assignSalesOpen, setAssignSalesOpen] = useState(false)

  const refreshUserDetails = useCallback(() => {
    if (!id) return
    ;(async () => {
      try {
        setLoading(true)
        const res = await getAdminDetails(String(id))
        setData(res)
        setError('')
      } catch (e: any) {
        setError(e?.response?.data?.message || 'Failed to load user')
      } finally {
        setLoading(false)
      }
    })()
  }, [id])

  useEffect(() => {
    refreshUserDetails()
  }, [refreshUserDetails, id])

  const user = data?.user || data || {}
  const detailRole = useMemo<DetailRole>(() => {
    const path = location.pathname || ''
    if (path.startsWith('/users/nutritionist')) return 'nutritionist'
    if (path.startsWith('/users/physiotherapist')) return 'physiotherapist'
    if (path.startsWith('/users/yogist')) return 'yogist'
    if (path.startsWith('/users/sales')) return 'sales'
    if (path.startsWith('/users/marketing')) return 'marketing'
    return 'user'
  }, [location.pathname])
  const isSuperAdmin = loginRole === 'superadmin'
  const isServiceClient =
    ['nutritionist', 'physiotherapist', 'yogist'].includes(loginRole || '') &&
    detailRole === 'user'
  const isWorkflowViewer = isServiceClient || isSuperAdmin
  const { data: workflowAssignment, refetch: refetchWorkflow } =
    useAssignedClientForUser(
      isWorkflowViewer ? user?.id : undefined,
      isWorkflowViewer ? (isSuperAdmin ? 'superadmin' : loginRole) : undefined,
      selectedCycleId || undefined
    )
  const { enqueueSnackbar } = useSnackbarManager()
  const queryClient = useQueryClient()
  const [acceptingClient, setAcceptingClient] = useState(false)
  const [showAcceptModal, setShowAcceptModal] = useState(false)
  const [dismissedAcceptModal, setDismissedAcceptModal] = useState(false)

  const isPendingAcceptance = Boolean(
    isServiceClient &&
      !isSuperAdmin &&
      workflowAssignment?.id &&
      (workflowAssignment.workflow_status === 'pending' ||
        !workflowAssignment.accepted_at)
  )

  useEffect(() => {
    if (isPendingAcceptance && !dismissedAcceptModal) {
      setShowAcceptModal(true)
    } else if (!isPendingAcceptance) {
      setShowAcceptModal(false)
    }
  }, [isPendingAcceptance, dismissedAcceptModal])

  const acceptClient = async () => {
    if (!workflowAssignment?.id) return
    try {
      setAcceptingClient(true)
      const response = await acceptAssignedClient(workflowAssignment.id)
      enqueueSnackbar(response?.message || 'Client accepted successfully', {
        variant: 'success',
      })
      await Promise.all([
        refetchWorkflow(),
        refetchCycles(),
        queryClient.invalidateQueries({
          queryKey: ['assigned_client_workflow'],
          refetchType: 'all',
        }),
        queryClient.invalidateQueries({
          queryKey: ['assigned_client_workflow_client'],
          refetchType: 'all',
        }),
        queryClient.invalidateQueries({
          queryKey: ['admin_user_list'],
          refetchType: 'all',
        }),
      ])
      setShowAcceptModal(false)
    } catch (error: any) {
      enqueueSnackbar(
        error?.response?.data?.error ||
          error?.response?.data?.message ||
          'Unable to accept client',
        { variant: 'error' }
      )
    } finally {
      setAcceptingClient(false)
    }
  }

  const currentUserId = useAuthStore((s: any) => s.userData?.id)
  const {
    data: cycleData,
    isLoading: cyclesLoading,
    refetch: refetchCycles,
  } = useClientPackageCycles(detailRole === 'user' ? id : undefined, '/clients')
  const allCycles = useMemo(() => cycleData?.cycles || [], [cycleData?.cycles])

  const availableCycles = useMemo(() => {
    if (!allCycles.length) return []
    if (isSuperAdmin || loginRole === 'admin') {
      return allCycles
    }
    if (isServiceClient) {
      const legacyAssignments = (cycleData as any)?.legacy_assignments || []
      const isLegacyAssigned = legacyAssignments.some(
        (a: any) =>
          String(a.staff_user_id || a.admin_id) === String(currentUserId)
      )

      return allCycles.filter((c: any) => {
        const inCycle =
          Array.isArray(c.assignments) &&
          c.assignments.some(
            (a: any) =>
              String(a.staff_user_id || a.admin_id) === String(currentUserId)
          )
        if (inCycle) return true

        if (isLegacyAssigned && (c.status === 'active' || !c.subscription_id)) {
          return true
        }

        return false
      })
    }
    return allCycles
  }, [
    allCycles,
    isSuperAdmin,
    loginRole,
    isServiceClient,
    currentUserId,
    (cycleData as any)?.legacy_assignments,
  ])

  const [headerPeriodDropdownOpen, setHeaderPeriodDropdownOpen] =
    useState(false)
  const headerPeriodDropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        headerPeriodDropdownRef.current &&
        !headerPeriodDropdownRef.current.contains(e.target as Node)
      ) {
        setHeaderPeriodDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  useEffect(() => {
    if (!availableCycles.length) {
      if (selectedCycleId !== '') setSelectedCycleId('')
      return
    }
    const exists = availableCycles.some(
      (c: any) => String(c.id) === String(selectedCycleId)
    )
    if (!exists) {
      const activeCycle = availableCycles.find(
        (c: any) => c.status === 'active'
      )
      const proposedCycle = availableCycles.find(
        (c: any) => c.status === 'proposed'
      )
      const target = activeCycle || proposedCycle || availableCycles[0]
      if (target?.id) {
        setSelectedCycleId(String(target.id))
      }
    }
  }, [availableCycles, selectedCycleId])

  const selectedCycle = useMemo(() => {
    if (!selectedCycleId) return null
    return (
      availableCycles.find(
        (c: any) => String(c.id) === String(selectedCycleId)
      ) || null
    )
  }, [availableCycles, selectedCycleId])

  const activeSubscriptionId = useMemo(() => {
    if (
      selectedCycle?.subscription_id !== undefined &&
      selectedCycle?.subscription_id !== null
    ) {
      return selectedCycle.subscription_id
    }
    return subscriptionId
  }, [selectedCycle?.subscription_id, subscriptionId])

  const isActionableSubscription = useMemo(() => {
    if (!selectedCycle) return true
    const cycleStatus = (selectedCycle?.status || '').toLowerCase()
    const inactiveStatuses = [
      'expired',
      'cancelled',
      'refunded',
      'dropped_out',
      'declined',
      'ended',
    ]
    if (inactiveStatuses.includes(cycleStatus)) {
      return false
    }
    const endDate = selectedCycle?.end_date
    if (endDate && moment(endDate, 'YYYY-MM-DD').isBefore(moment(), 'day')) {
      if (cycleStatus !== 'upcoming') {
        return false
      }
    }
    return true
  }, [selectedCycle])

  const headerAssignees = useMemo(() => {
    if (selectedCycle) {
      return selectedCycle.assignments || []
    }
    if (
      workflowAssignment?.assignments &&
      workflowAssignment.assignments.length > 0
    ) {
      return workflowAssignment.assignments
    }
    if (
      workflowAssignment &&
      (workflowAssignment.role || workflowAssignment.staff_name)
    ) {
      return [workflowAssignment]
    }
    const legacy = (cycleData as any)?.legacy_assignments || []
    const activeLegacy = legacy.filter((a: any) => !a.ended_at)
    return activeLegacy
  }, [
    selectedCycle,
    (cycleData as any)?.legacy_assignments,
    workflowAssignment,
  ])

  const assigneeSlots = useMemo(() => {
    const standardRoles = [
      {
        key: 'physiotherapist',
        title: 'Physiotherapist',
        shortLabel: 'Physio',
        iconType: 'physio',
        gradient: 'from-blue-500 to-indigo-600',
        ringColor: 'ring-blue-400/20',
      },
      {
        key: 'nutritionist',
        title: 'Nutritionist',
        shortLabel: 'Nutri',
        iconType: 'nutri',
        gradient: 'from-emerald-500 to-teal-600',
        ringColor: 'ring-emerald-400/20',
      },
      {
        key: 'yogist',
        title: 'Yoga Instructor',
        shortLabel: 'Yoga',
        iconType: 'yoga',
        gradient: 'from-purple-500 to-violet-600',
        ringColor: 'ring-purple-400/20',
      },
    ]

    const matchedIds = new Set<string>()

    const slots = standardRoles.map((r) => {
      const match = headerAssignees.find((a: any) => {
        const roleStr = (a.role || '').toLowerCase()
        const isMatched =
          roleStr === r.key ||
          (r.key === 'physiotherapist' && roleStr.includes('physio')) ||
          (r.key === 'nutritionist' && roleStr.includes('nutri')) ||
          (r.key === 'yogist' &&
            (roleStr.includes('yoga') || roleStr.includes('yogist')))
        return (
          isMatched &&
          !matchedIds.has(
            String(a.id || a.staff_user_id || a.admin_id || a.role)
          )
        )
      })

      if (match) {
        matchedIds.add(
          String(
            match.id || match.staff_user_id || match.admin_id || match.role
          )
        )
      }

      return {
        roleKey: r.key,
        title: r.title,
        shortLabel: r.shortLabel,
        iconType: r.iconType,
        gradient: r.gradient,
        ringColor: r.ringColor,
        assignment: match || null,
      }
    })

    const unmatched = headerAssignees.filter(
      (a: any) =>
        !matchedIds.has(String(a.id || a.staff_user_id || a.admin_id || a.role))
    )
    let uIdx = 0
    for (let i = 0; i < slots.length && uIdx < unmatched.length; i++) {
      if (!slots[i].assignment) {
        const extra = unmatched[uIdx++]
        slots[i].assignment = extra
        slots[i].title = capitalizeFirst(extra.role) || slots[i].title
        slots[i].shortLabel = capitalizeFirst(extra.role) || slots[i].shortLabel
      }
    }

    return slots
  }, [headerAssignees])

  useEffect(() => {
    if (detailRole !== 'user') return
    if (selectedCycle) {
      setSubscriptionId(selectedCycle.subscription_id ?? null)
    } else if (availableCycles.length === 0 && !cyclesLoading) {
      setSubscriptionId(null)
    }
  }, [selectedCycle, availableCycles.length, cyclesLoading, detailRole])

  const isNutritionist = (() => {
    const r = user?.role
    if (r === 2 || r === '2') return true
    const s = String(r || '').toLowerCase()
    return s === 'nutritionist' || detailRole === 'nutritionist'
  })()
  const isPhysiotherapist = (() => {
    const r = user?.role
    if (r === 4 || r === '4') return true
    const s = String(r || '').toLowerCase()
    return s === 'physiotherapist' || detailRole === 'physiotherapist'
  })()
  const isYogist = (() => {
    const r = user?.role
    if (r === 5 || r === '5') return true
    const s = String(r || '').toLowerCase()
    return s === 'yogist' || detailRole === 'yogist'
  })()
  const isSales = (() => {
    const r = user?.role
    if (r === 6 || r === '6') return true
    const s = String(r || '').toLowerCase()
    return s === 'sales' || detailRole === 'sales'
  })()
  const isMarketing = (() => {
    const r = user?.role
    if (r === 7 || r === '7') return true
    const s = String(r || '').toLowerCase()
    return s === 'marketing' || detailRole === 'marketing'
  })()
  const isSalesOrMarketing = isSales || isMarketing
  const isFlatWithClients = isPhysiotherapist || isYogist
  const isFlatRole = isFlatWithClients || isSalesOrMarketing

  useEffect(() => {
    let mounted = true

    const run = async () => {
      if (detailRole === 'user') return
      if (!user?.id || isNutritionist || isFlatRole) return
      if (!user?.subscribed_plan) return
      try {
        const overview = await getActivePlanOverview(user.id)
        if (!mounted) return
        const subId = overview?.subscription?.id
        setSubscriptionId(subId ?? null)
      } catch (e) {
        if (!mounted) return
        // On error (e.g. 404 for no active subscription), still use empty string
        // so subscription_id is present in the downstream requests.
        setSubscriptionId('')
      }
    }

    run()

    return () => {
      mounted = false
    }
  }, [user?.id, isNutritionist, isFlatRole, detailRole])

  const pathBase = useMemo(() => {
    return DETAIL_ROLE_PATHS[detailRole]
  }, [detailRole])

  // URL-driven active tab
  const urlTab = useMemo(() => {
    const parts = location.pathname.split('/').filter(Boolean)
    const last = parts[parts.length - 1]
    // If path ends with the user id (no subpath), redirect to details
    if (last === String(id)) return 'details'
    if (last === 'clients' && !isSales) return 'accepted-clients'
    if (last === 'sales_clients') return 'sales_clients'
    return last
  }, [location.pathname, id, isSales]) as
    | 'details'
    | 'subscriptions'
    | 'clients'
    | 'accepted-clients'
    | 'assigned-clients'
    | 'body'
    | 'body-composition'
    | 'vitals'
    | 'reports'
    | 'reminders'
    | 'additional-info'
    | 'follow-ups'
    | 'packages'
    | 'assignments'
    | 'forms'
    | 'campaigns'
    | 'leads'
    | 'sales_clients'

  useEffect(() => {
    if (location.pathname === `${pathBase}/${id}`) {
      navigate(`${pathBase}/${id}/details`, { replace: true })
    } else if (location.pathname === `${pathBase}/${id}/clients`) {
      navigate(`${pathBase}/${id}/accepted-clients`, { replace: true })
    }
  }, [location.pathname, id, navigate, pathBase])

  const hasSubscription = Boolean(
    user?.has_subscription ||
      user?.subscribed_plan ||
      (Array.isArray(user?.subscriptions) && user.subscriptions.length > 0) ||
      activeSubscriptionId ||
      subscriptionId ||
      selectedCycle?.subscription_id
  )

  const canAccessDietAndRecipes =
    isSuperAdmin || loginRole === 'admin' || loginRole === 'nutritionist'

  const canAccessReports =
    isSuperAdmin ||
    loginRole === 'admin' ||
    isServiceClient ||
    loginRole === 'sales'

  const canAccessFollowUps =
    isWorkflowViewer ||
    isSuperAdmin ||
    loginRole === 'admin' ||
    loginRole === 'sales'

  const tabs = useMemo(() => {
    if (detailRole !== 'user') {
      if (isNutritionist) {
        return [
          { id: 'details', label: 'Details' },
          { id: 'accepted-clients', label: 'Accepted Clients' },
          { id: 'assigned-clients', label: 'Assigned Clients' },
          { id: 'diet-history', label: 'Diet history' },
        ]
      }
      if (isMarketing) {
        return [
          { id: 'details', label: 'Details' },
          { id: 'forms', label: 'Forms' },
          { id: 'campaigns', label: 'Campaigns' },
        ]
      }
      if (isFlatWithClients) {
        return [
          { id: 'details', label: 'Details' },
          { id: 'accepted-clients', label: 'Accepted Clients' },
          { id: 'assigned-clients', label: 'Assigned Clients' },
        ]
      }
      if (isSales) {
        return [
          { id: 'details', label: 'Details' },
          { id: 'leads', label: 'Leads' },
          { id: 'sales_clients', label: 'Clients' },
        ]
      }
    }

    // Client / User detail tabs in exact required order
    return [
      { id: 'details', label: 'Details' },
      { id: 'subscriptions', label: 'Subscriptions' },
      ...(hasSubscription
        ? [
            { id: 'body', label: 'Body measurements' },
            { id: 'vitals', label: 'Vitals' },
            { id: 'reminders', label: 'Reminder settings' },
          ]
        : []),
      ...(hasSubscription && canAccessDietAndRecipes
        ? [{ id: 'recipes', label: 'Recipes' }]
        : []),
      { id: 'additional-info', label: 'Nutritional assessment' },
      { id: 'subscription-history', label: 'Subscription history' },
      ...(canAccessDietAndRecipes
        ? [{ id: 'diet-history', label: 'Diet history' }]
        : []),
      ...(hasSubscription && canAccessReports
        ? [{ id: 'reports', label: 'Reports' }]
        : []),
      ...(canAccessFollowUps
        ? [{ id: 'follow-ups', label: 'Follow-ups' }]
        : []),
      ...(isSuperAdmin
        ? [
            { id: 'packages', label: 'Packages' },
            { id: 'assignments', label: 'Assignments' },
          ]
        : []),
    ]
  }, [
    detailRole,
    isSuperAdmin,
    isNutritionist,
    isMarketing,
    isFlatWithClients,
    isSales,
    hasSubscription,
    canAccessDietAndRecipes,
    canAccessReports,
    canAccessFollowUps,
  ])

  const handleTabClick = (item: { id: string | number; label: string }) => {
    navigate(`${pathBase}/${id}/${item.id}`)
  }

  return (
    <>
      <div className="p-4">
        {/* <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                navigate(
                  pathBase === '/users/nutritionist'
                    ? '/users/nutritionist'
                    : '/users'
                )
              }
              aria-label="Back"
            >
              <Icons name="left-arrow-icon" />
            </button>
            <h1 className="text-xl font-semibold">
              {isNutritionist ? 'Nutritionist Details' : 'User Details'}
            </h1>
          </div>
        </div> */}

        {/* User Information Breadcrumb */}
        {/* User Header */}
        <div className="mb-4 bg-white border border-gray-200 rounded-xl shadow-xs p-3.5 sm:p-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              {/* Name row */}
              <div className="flex items-center">
                <button
                  onClick={() =>
                    navigate((location.state as any)?.from || pathBase)
                  }
                  className="rounded-lg hover:bg-gray-100 transition mr-2"
                  aria-label="Back"
                >
                  <Icons name="left-arrow-icon" />
                </button>

                <h1 className="text-xl font-semibold text-gray-900">
                  {user?.name || 'User'}
                </h1>
              </div>

              {/* User meta info */}
              <div className="flex flex-wrap items-center gap-2.5 mt-2 text-sm ml-8">
                {user?.email && (
                  <div className="flex items-center gap-1 px-3 py-1 rounded-lg bg-green-50 text-green-700">
                    <span className="font-medium">Email:</span>
                    <span>{user.email}</span>
                  </div>
                )}

                {user?.phone && (
                  <div className="flex items-center gap-1 px-3 py-1 rounded-lg bg-purple-50 text-purple-700">
                    <span className="font-medium">Phone:</span>
                    <span>{user.phone}</span>
                  </div>
                )}

                <div className="flex items-center gap-1 px-3 py-1 rounded-lg bg-blue-50 text-blue-700 capitalize">
                  <span className="font-medium">Role:</span>
                  <span>{DETAIL_ROLE_LABELS[detailRole]}</span>
                </div>
              </div>
            </div>

            {/* Right side: Package Selector & Actions */}
            <div className="flex flex-wrap items-center gap-3">
              {detailRole === 'user' &&
                (cyclesLoading ? (
                  <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-gradient-to-r from-gray-50 via-slate-50 to-white border border-gray-200 text-xs text-secondary animate-pulse min-w-[340px] sm:min-w-[420px]">
                    <div className="h-11 w-11 rounded-xl bg-gray-200/80 animate-pulse" />
                    <div className="space-y-1.5 flex-1">
                      <div className="h-3.5 w-32 bg-gray-200/80 rounded" />
                      <div className="h-2.5 w-44 bg-gray-100 rounded" />
                    </div>
                  </div>
                ) : availableCycles.length > 0 ? (
                  (() => {
                    const selectedTheme = getCycleCardTheme(
                      selectedCycle?.status
                    )
                    return (
                      <div
                        ref={headerPeriodDropdownRef}
                        className="relative w-full sm:w-auto min-w-[340px] sm:min-w-[420px] md:min-w-[480px] lg:min-w-[500px] max-w-xl"
                      >
                        <button
                          type="button"
                          id="header-package-cycle-selector"
                          aria-expanded={headerPeriodDropdownOpen}
                          onClick={() => {
                            if (availableCycles.length > 1 || isSuperAdmin) {
                              setHeaderPeriodDropdownOpen((prev) => !prev)
                            }
                          }}
                          className={`group relative overflow-hidden w-full flex items-center justify-between gap-3.5 p-3 sm:p-3.5 rounded-2xl border transition-all duration-200 text-left ${selectedTheme.cardBg} ${
                            headerPeriodDropdownOpen
                              ? `${selectedTheme.activeRing} bg-white shadow-lg`
                              : `${selectedTheme.cardBorder} ${selectedTheme.shadow}`
                          } ${
                            availableCycles.length <= 1 && !isSuperAdmin
                              ? 'cursor-default'
                              : 'cursor-pointer hover:shadow-md'
                          }`}
                        >
                          {/* Decorative SVG Backdrop Watermark */}
                          <CycleDecorativeWatermark theme={selectedTheme} />

                          {/* Left: Rich Gradient Icon Container */}
                          <div className="relative flex items-center gap-3.5 min-w-0 z-10">
                            <div
                              className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${selectedTheme.iconGradient} text-white shadow-md ${selectedTheme.iconShadow} ring-4 ${selectedTheme.iconRing} transition-transform duration-200 group-hover:scale-105`}
                            >
                              <svg
                                className="h-5 w-5 drop-shadow-xs"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth={2.2}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <rect
                                  x="3"
                                  y="4"
                                  width="18"
                                  height="18"
                                  rx="3"
                                  ry="3"
                                />
                                <line x1="16" y1="2" x2="16" y2="6" />
                                <line x1="8" y1="2" x2="8" y2="6" />
                                <line x1="3" y1="10" x2="21" y2="10" />
                                <circle
                                  cx="8"
                                  cy="15"
                                  r="1"
                                  fill="currentColor"
                                />
                                <circle
                                  cx="12"
                                  cy="15"
                                  r="1"
                                  fill="currentColor"
                                />
                                <circle
                                  cx="16"
                                  cy="15"
                                  r="1"
                                  fill="currentColor"
                                />
                              </svg>
                            </div>

                            {/* Center: Info block */}
                            <div className="min-w-0 pr-1">
                              {/* Eyebrow / Tag row */}
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-secondary/80">
                                  {selectedTheme.tag}
                                </span>
                                {selectedCycle?.plan?.category && (
                                  <span className="rounded-md bg-white/80 px-1.5 py-0.2 text-[10px] font-bold text-gray-700 border border-gray-200/80 shadow-2xs">
                                    {capitalizeFirst(
                                      selectedCycle.plan.category
                                    )}
                                  </span>
                                )}
                                <span
                                  className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.2 text-[10px] font-bold border shadow-2xs ${selectedTheme.badgeBg}`}
                                >
                                  {selectedTheme.pulse ? (
                                    <span className="relative flex h-2 w-2">
                                      <span
                                        className={`animate-ping absolute inline-flex h-full w-full rounded-full ${selectedTheme.dotColor} opacity-75`}
                                      />
                                      <span
                                        className={`relative inline-flex rounded-full h-2 w-2 ${selectedTheme.dotColor}`}
                                      />
                                    </span>
                                  ) : (
                                    <span
                                      className={`h-1.5 w-1.5 rounded-full ${selectedTheme.dotColor}`}
                                    />
                                  )}
                                  <span>
                                    {capitalizeFirst(selectedCycle?.status) ||
                                      'Active'}
                                  </span>
                                </span>
                              </div>

                              {/* Plan Name */}
                              <h3 className="text-sm sm:text-base font-extrabold text-gray-900 tracking-tight leading-snug mt-0.5 truncate max-w-[220px] sm:max-w-[280px] md:max-w-xs group-hover:text-primaryGreen transition-colors">
                                {capitalizeFirst(selectedCycle?.plan?.name) ||
                                  (selectedCycle?.id
                                    ? `Package #${selectedCycle.id}`
                                    : 'Package')}
                              </h3>

                              {/* Date range & duration */}
                              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-gray-600 mt-0.5 font-medium">
                                {selectedCycle?.start_date &&
                                selectedCycle?.end_date ? (
                                  <div className="flex items-center gap-1">
                                    <svg
                                      className="w-3.5 h-3.5 text-gray-400 shrink-0"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth={2}
                                    >
                                      <rect
                                        x="3"
                                        y="4"
                                        width="18"
                                        height="18"
                                        rx="2"
                                        ry="2"
                                      />
                                      <line x1="16" y1="2" x2="16" y2="6" />
                                      <line x1="8" y1="2" x2="8" y2="6" />
                                      <line x1="3" y1="10" x2="21" y2="10" />
                                    </svg>
                                    <span>
                                      {formatDate(selectedCycle.start_date)} –{' '}
                                      {formatDate(selectedCycle.end_date)}
                                    </span>
                                  </div>
                                ) : (
                                  <span>Assigned package</span>
                                )}

                                {selectedCycle?.days_remaining !== undefined &&
                                  selectedCycle?.days_remaining !== null && (
                                    <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-semibold bg-white/90 text-gray-700 border border-gray-200/90 shadow-2xs">
                                      {selectedCycle.days_remaining}d left
                                    </span>
                                  )}
                              </div>
                            </div>
                          </div>

                          {/* Right: Dropdown arrow or switch affordance */}
                          {(availableCycles.length > 1 || isSuperAdmin) && (
                            <div className="flex items-center self-center pl-2 shrink-0 z-10">
                              <div
                                className={`flex h-8 w-8 items-center justify-center rounded-xl bg-white/90 border border-gray-200 shadow-2xs transition-all duration-200 group-hover:border-primaryGreen/50 group-hover:bg-white ${
                                  headerPeriodDropdownOpen
                                    ? 'rotate-180 border-primaryGreen text-primaryGreen ring-2 ring-primaryGreen/20 shadow-xs'
                                    : 'text-gray-500'
                                }`}
                              >
                                <svg
                                  className="h-4 w-4"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                  strokeWidth={2.2}
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M19 9l-7 7-7-7"
                                  />
                                </svg>
                              </div>
                            </div>
                          )}
                        </button>

                        {/* Dropdown Menu */}
                        {headerPeriodDropdownOpen && (
                          <div className="absolute right-0 top-full mt-2 w-full min-w-[340px] sm:min-w-[420px] md:min-w-[480px] lg:min-w-[500px] max-w-xl rounded-2xl border border-gray-200 bg-white shadow-2xl z-50 overflow-hidden ring-1 ring-black/5 animate-in fade-in-50 zoom-in-95 duration-150">
                            {/* Dropdown Header */}
                            <div className="border-b border-gray-200 bg-gradient-to-r from-gray-50 via-slate-50 to-emerald-50/40 px-4 py-3 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-primaryGreen/10 text-primaryGreen font-bold">
                                  <svg
                                    className="w-3.5 h-3.5"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={2.5}
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                                    />
                                  </svg>
                                </div>
                                <div>
                                  <span className="text-xs font-bold uppercase tracking-wider text-gray-800">
                                    {isSuperAdmin
                                      ? 'All Packages & Subscriptions'
                                      : 'Assigned Package Cycles'}
                                  </span>
                                  <p className="text-[10px] text-gray-500 font-medium">
                                    {isSuperAdmin
                                      ? 'Switch active package view for this client'
                                      : 'Select an assigned package cycle'}
                                  </p>
                                </div>
                              </div>
                              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white border border-gray-200 text-gray-700 shadow-2xs">
                                {availableCycles.length}{' '}
                                {availableCycles.length === 1
                                  ? 'Cycle'
                                  : 'Cycles'}
                              </span>
                            </div>

                            {/* Dropdown Items */}
                            <div className="max-h-[380px] overflow-y-auto p-2.5 sm:p-3 space-y-2.5">
                              {availableCycles.map((c: any) => {
                                const isSelected =
                                  String(c.id) === String(selectedCycleId)
                                const itemTheme = getCycleCardTheme(c.status)
                                return (
                                  <button
                                    key={c.id}
                                    type="button"
                                    onClick={() => {
                                      setSelectedCycleId(String(c.id))
                                      setHeaderPeriodDropdownOpen(false)
                                    }}
                                    className={`group relative overflow-hidden w-full flex items-center justify-between gap-3 p-3 rounded-xl border text-left transition-all duration-200 ${itemTheme.cardBg} ${
                                      isSelected
                                        ? 'border-primaryGreen ring-2 ring-primaryGreen/30 shadow-md bg-white'
                                        : `${itemTheme.cardBorder} hover:shadow-md hover:scale-[1.005]`
                                    }`}
                                  >
                                    {/* Decorative SVG Backdrop in each dropdown item */}
                                    <CycleDecorativeWatermark
                                      theme={itemTheme}
                                      isSmall
                                    />

                                    <div className="flex items-center gap-3 min-w-0 z-10">
                                      <div
                                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${itemTheme.iconGradient} text-white shadow-sm ${itemTheme.iconShadow}`}
                                      >
                                        <svg
                                          className="h-4 w-4"
                                          viewBox="0 0 24 24"
                                          fill="none"
                                          stroke="currentColor"
                                          strokeWidth={2.2}
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                        >
                                          <rect
                                            x="3"
                                            y="4"
                                            width="18"
                                            height="18"
                                            rx="3"
                                            ry="3"
                                          />
                                          <line x1="16" y1="2" x2="16" y2="6" />
                                          <line x1="8" y1="2" x2="8" y2="6" />
                                          <line
                                            x1="3"
                                            y1="10"
                                            x2="21"
                                            y2="10"
                                          />
                                        </svg>
                                      </div>

                                      <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-1.5">
                                          <span className="text-xs sm:text-sm font-bold text-gray-900 group-hover:text-primaryGreen transition-colors truncate max-w-[180px] sm:max-w-[240px]">
                                            {capitalizeFirst(c.plan?.name) ||
                                              `Package #${c.id}`}
                                          </span>
                                          {c.plan?.category && (
                                            <span className="rounded-md bg-white/80 px-1.5 py-0.2 text-[10px] font-semibold text-gray-700 border border-gray-200">
                                              {capitalizeFirst(c.plan.category)}
                                            </span>
                                          )}
                                          <span
                                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.2 text-[10px] font-bold border ${itemTheme.badgeBg}`}
                                          >
                                            {itemTheme.pulse && (
                                              <span
                                                className={`h-1.5 w-1.5 rounded-full ${itemTheme.dotColor} animate-pulse`}
                                              />
                                            )}
                                            {capitalizeFirst(c.status) ||
                                              'Active'}
                                          </span>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-gray-600 mt-0.5">
                                          {c.start_date && c.end_date ? (
                                            <span className="flex items-center gap-1 font-medium">
                                              <svg
                                                className="w-3 h-3 text-gray-400"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth={2}
                                              >
                                                <rect
                                                  x="3"
                                                  y="4"
                                                  width="18"
                                                  height="18"
                                                  rx="2"
                                                  ry="2"
                                                />
                                                <line
                                                  x1="16"
                                                  y1="2"
                                                  x2="16"
                                                  y2="6"
                                                />
                                                <line
                                                  x1="8"
                                                  y1="2"
                                                  x2="8"
                                                  y2="6"
                                                />
                                                <line
                                                  x1="3"
                                                  y1="10"
                                                  x2="21"
                                                  y2="10"
                                                />
                                              </svg>
                                              {formatDate(c.start_date)} –{' '}
                                              {formatDate(c.end_date)}
                                            </span>
                                          ) : (
                                            <span>Assigned package</span>
                                          )}
                                          {c.days_remaining !== undefined &&
                                            c.days_remaining !== null && (
                                              <span className="font-semibold text-gray-500">
                                                • {c.days_remaining}d remaining
                                              </span>
                                            )}
                                        </div>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0 z-10 pl-2">
                                      {isSelected ? (
                                        <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-primaryGreen text-white text-[11px] font-bold shadow-xs">
                                          <span>Selected</span>
                                          <svg
                                            className="w-3.5 h-3.5"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth={3}
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                          >
                                            <polyline points="20 6 9 17 4 12" />
                                          </svg>
                                        </div>
                                      ) : (
                                        <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-400 group-hover:border-primaryGreen group-hover:text-primaryGreen group-hover:bg-primaryGreen/5 transition-all">
                                          <svg
                                            className="w-3.5 h-3.5"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                            strokeWidth={2}
                                          >
                                            <path
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                              d="M9 5l7 7-7 7"
                                            />
                                          </svg>
                                        </div>
                                      )}
                                    </div>
                                  </button>
                                )
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })()
                ) : isServiceClient ? (
                  <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-gradient-to-r from-gray-50 to-white border border-gray-200 text-xs text-gray-600 min-w-[320px]">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-400">
                      <Icons name="calendar" className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">
                        No Packages Assigned
                      </p>
                      <p className="text-[11px] text-gray-500">
                        You are not assigned to any package cycle for this
                        client
                      </p>
                    </div>
                  </div>
                ) : null)}
            </div>
          </div>

          {/* Header Bottom Section: Ultra-compact colored strip split into 3 */}
          {detailRole === 'user' && (
            <div className="mt-3 pt-2.5 border-t border-gray-100">
              <div className="w-full rounded-xl bg-gradient-to-r from-slate-50/90 via-blue-50/40 to-indigo-50/30 border border-blue-100/70 p-1.5 shadow-2xs">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-1.5">
                  {assigneeSlots.map((slot) => {
                    const item = slot.assignment
                    const hasStaff = Boolean(
                      item &&
                        (item.staff_name || item.admin_id || item.staff_user_id)
                    )
                    const staffId =
                      item?.staff_user_id || item?.admin_id || item?.id
                    const isItemAccepted = Boolean(
                      item?.accepted_at ||
                        (item?.workflow_status &&
                          item.workflow_status !== 'pending' &&
                          item.workflow_status !== 'package_confirmed') ||
                        (item?.workflow_status === 'package_confirmed' &&
                          item?.accepted_at)
                    )

                    const getStaffSvg = () => {
                      if (slot.iconType === 'physio') {
                        return (
                          <svg
                            className="w-3.5 h-3.5 text-white"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2.2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                          </svg>
                        )
                      }
                      if (slot.iconType === 'nutri') {
                        return (
                          <svg
                            className="w-3.5 h-3.5 text-white"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2.2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
                            <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
                          </svg>
                        )
                      }
                      return (
                        <svg
                          className="w-3.5 h-3.5 text-white"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2.2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <circle cx="12" cy="5" r="2.5" />
                          <path d="M4 18c1-3 4-5 8-5s7 2 8 5" />
                          <path d="M9 13l-3 4" />
                          <path d="M15 13l3 4" />
                          <path d="M6 21h12" />
                        </svg>
                      )
                    }

                    return (
                      <div
                        key={slot.roleKey}
                        className={`group flex items-center justify-between gap-2 px-2.5 py-1 rounded-lg border transition-all ${
                          hasStaff
                            ? 'bg-white/95 hover:bg-white border-gray-200/80 hover:border-blue-300 shadow-2xs'
                            : 'bg-white/60 border-dashed border-gray-200'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <div
                            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${
                              hasStaff
                                ? `bg-gradient-to-br ${slot.gradient} shadow-2xs ring-2 ${slot.ringColor}`
                                : 'bg-gray-100 text-gray-400 border border-gray-200'
                            }`}
                          >
                            {hasStaff ? (
                              getStaffSvg()
                            ) : (
                              <svg
                                className="w-3.5 h-3.5 text-gray-400"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth={2}
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                                />
                              </svg>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5 min-w-0 flex-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 shrink-0">
                              {slot.shortLabel}:
                            </span>
                            <span
                              className={`text-xs truncate ${
                                hasStaff
                                  ? 'font-bold text-gray-900 group-hover:text-primaryGreen transition-colors'
                                  : 'font-medium text-gray-400 italic'
                              }`}
                            >
                              {hasStaff
                                ? item.staff_name || 'Assigned'
                                : 'Unassigned'}
                            </span>

                            {hasStaff ? (
                              <span
                                className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.2 text-[9px] font-bold border shrink-0 ${
                                  isItemAccepted
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : 'bg-amber-50 text-amber-700 border-amber-200'
                                }`}
                              >
                                <span
                                  className={`h-1 w-1 rounded-full ${
                                    isItemAccepted
                                      ? 'bg-emerald-500'
                                      : 'bg-amber-500 animate-pulse'
                                  }`}
                                />
                                {isItemAccepted ? 'Accepted' : 'Pending'}
                              </span>
                            ) : null}
                          </div>
                        </div>

                        {/* Right: Compact arrow button - only for superadmin */}
                        {isSuperAdmin ? (
                          hasStaff && staffId ? (
                            <button
                              type="button"
                              onClick={() => {
                                const roleKey = (
                                  item.role || slot.roleKey
                                ).toLowerCase()
                                const roleUrl = roleKey.includes('physio')
                                  ? 'physiotherapist'
                                  : roleKey.includes('nutri')
                                    ? 'nutritionist'
                                    : 'yogist'
                                navigate(`/users/${roleUrl}/${staffId}/details`)
                              }}
                              className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-gray-400 hover:text-primaryGreen hover:bg-primaryGreen/10 transition-all active:scale-90"
                              title={`Go to ${item.staff_name || slot.title}'s detail page`}
                              aria-label={`Go to ${item.staff_name || slot.title}'s detail page`}
                            >
                              <svg
                                className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth={2.5}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M5 12h14" />
                                <path d="M12 5l7 7-7 7" />
                              </svg>
                            </button>
                          ) : (
                            <div className="w-5 h-5 shrink-0" />
                          )
                        ) : null}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        <TabContainer
          data={tabs as any}
          activeTab={urlTab}
          onClick={(item: any) => handleTabClick(item)}
        >
          <Tab id="details">
            <DetailsInfo
              user={user}
              loading={loading}
              error={error}
              isNutritionist={isNutritionist}
              isPhysiotherapist={isPhysiotherapist}
              isYogist={isYogist}
              isSales={isSales}
              isMarketing={isMarketing}
              detailRole={detailRole}
              onEdit={() => setEditModalOpen(true)}
              onAssignSales={
                isSuperAdmin && detailRole === 'user'
                  ? () => setAssignSalesOpen(true)
                  : undefined
              }
            />
          </Tab>

          {/* Subscriptions */}
          {detailRole === 'user' && (
            <Tab id="subscriptions">
              <Subscriptions
                id={String(id)}
                user={user}
                loading={loading}
                error={error}
                onRefresh={(fresh: any) => {
                  if (fresh) setData(fresh)
                  else refreshUserDetails()
                  refetchCycles()
                }}
                workflowAssignment={
                  isWorkflowViewer ? workflowAssignment : undefined
                }
                onWorkflowRefresh={
                  isWorkflowViewer
                    ? async () => {
                        await refetchWorkflow()
                        await refreshUserDetails()
                        await refetchCycles()
                      }
                    : undefined
                }
                selectedCycleId={selectedCycleId}
                selectedSubscriptionId={activeSubscriptionId}
                selectedCycle={selectedCycle}
                disableCycleChange={!isSuperAdmin}
              />
            </Tab>
          )}

          {/* Body Measurements (Requires Subscription) */}
          {detailRole === 'user' && hasSubscription && (
            <Tab id="body">
              <BodyMeasurements
                user={user}
                subscriptionId={activeSubscriptionId}
              />
            </Tab>
          )}

          {/* Vitals (Requires Subscription) */}
          {detailRole === 'user' && hasSubscription && (
            <Tab id="vitals">
              <Vitals user={user} subscriptionId={activeSubscriptionId} />
            </Tab>
          )}

          {/* Reminder Settings (Requires Subscription) */}
          {detailRole === 'user' && hasSubscription && (
            <Tab id="reminders">
              <ReminderSettings userId={user?.id} />
            </Tab>
          )}

          {/* Recipes (Requires Subscription & Nutritionist / Superadmin / Admin) */}
          {detailRole === 'user' &&
            hasSubscription &&
            canAccessDietAndRecipes && (
              <Tab id="recipes">
                <RecipesTab
                  userId={user?.id}
                  isActionablePackage={isActionableSubscription}
                />
              </Tab>
            )}

          {/* Nutritional Assessment (All Roles) */}
          {detailRole === 'user' && (
            <Tab id="additional-info">
              <AdditionalInfo
                user={user}
                subscriptionId={activeSubscriptionId}
                isActionablePackage={isActionableSubscription}
              />
            </Tab>
          )}

          {/* Subscription History */}
          {detailRole === 'user' && (
            <Tab id="subscription-history">
              <SubscriptionHistory />
            </Tab>
          )}

          {/* Diet History (Nutritionist / Superadmin / Admin) */}
          {(canAccessDietAndRecipes ||
            (isNutritionist && detailRole !== 'user')) && (
            <Tab id="diet-history">
              <DietHistory subscriptionId={activeSubscriptionId} />
            </Tab>
          )}

          {/* Reports (Requires Subscription & Superadmin / Admin / Service Roles) */}
          {detailRole === 'user' && hasSubscription && canAccessReports && (
            <Tab id="reports">
              <Reports user={user} subscriptionId={activeSubscriptionId} />
            </Tab>
          )}

          {/* Follow-ups */}
          {detailRole === 'user' &&
            canAccessFollowUps &&
            workflowAssignment && (
              <Tab id="follow-ups">
                <ClientWorkflowFollowUps
                  assignment={workflowAssignment}
                  assignmentId={workflowAssignment.id}
                  onRefresh={() => refetchWorkflow()}
                />
              </Tab>
            )}

          {/* Packages */}
          {detailRole === 'user' && id && isSuperAdmin && (
            <Tab id="packages" activeTab={urlTab}>
              <ClientPackagesTab
                clientId={String(id)}
                canManage={isSuperAdmin}
                apiPrefix="/clients"
                mode="packages"
                selectedCycleId={
                  selectedCycleId ? String(selectedCycleId) : undefined
                }
                onSelectCycleId={(cId) => setSelectedCycleId(cId)}
                disableCycleChange={!isSuperAdmin}
              />
            </Tab>
          )}

          {/* Assignments */}
          {detailRole === 'user' && id && isSuperAdmin && (
            <Tab id="assignments" activeTab={urlTab}>
              <ClientPackagesTab
                clientId={String(id)}
                canManage={isSuperAdmin}
                apiPrefix="/clients"
                mode="assignments"
                user={user}
                onSalesAssignSuccess={() => {
                  refreshUserDetails()
                  refetchCycles()
                }}
                selectedCycleId={
                  selectedCycleId ? String(selectedCycleId) : undefined
                }
                onSelectCycleId={(cId) => setSelectedCycleId(cId)}
                disableCycleChange={!isSuperAdmin}
              />
            </Tab>
          )}

          {/* Staff Specific Tabs */}
          {(isNutritionist || isFlatWithClients) && (
            <Tab id="accepted-clients">
              <AcceptedClients user={user} />
            </Tab>
          )}
          {(isNutritionist || isFlatWithClients) && (
            <Tab id="assigned-clients">
              <AssignedClientsTab user={user} />
            </Tab>
          )}
          {isMarketing && (
            <Tab id="forms">
              <MarketingFormsTab userId={String(id)} />
            </Tab>
          )}
          {isMarketing && (
            <Tab id="campaigns">
              <UserCampaigns user={user} />
            </Tab>
          )}
          {isSales && (
            <Tab id="leads">
              <UserSalesLeads user={user} />
            </Tab>
          )}
          {isSales && (
            <Tab id="sales_clients">
              <UserSalesClients user={user} />
            </Tab>
          )}
        </TabContainer>
      </div>

      <CreateAdmin
        isDrawerOpen={editModalOpen}
        handleClose={() => setEditModalOpen(false)}
        handleRefresh={() => refreshUserDetails()}
        edit
        rowData={{ user }}
        activeRole={detailRole}
      />

      <AssignSalesModal
        isOpen={assignSalesOpen}
        onClose={() => setAssignSalesOpen(false)}
        user={user}
        onSuccess={() => refreshUserDetails()}
      />

      <AcceptClientModal
        isOpen={showAcceptModal}
        onClose={() => {
          setDismissedAcceptModal(true)
          setShowAcceptModal(false)
        }}
        onAccept={acceptClient}
        isLoading={acceptingClient}
        clientName={user?.name}
        clientEmail={user?.email}
        clientPhone={user?.phone}
        planName={
          selectedCycle?.plan_name || user?.active_subscription?.plan_name
        }
        roleTitle={
          loginRole === 'physiotherapist'
            ? 'Physiotherapist'
            : loginRole === 'nutritionist'
              ? 'Nutritionist'
              : loginRole === 'yogist'
                ? 'Yogist'
                : capitalizeFirst(loginRole || '')
        }
        onGoBack={() => {
          navigate(
            loginRole ? `/users/${loginRole}/assigned-clients` : '/clients'
          )
        }}
      />
    </>
  )
}
