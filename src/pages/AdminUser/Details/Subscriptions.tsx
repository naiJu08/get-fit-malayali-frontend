import moment from 'moment'
import { formatDurationMinutes } from '../../../utilities/format'
import { useMemo, useState, useEffect, useRef, useCallback } from 'react'
import type { DragEvent } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import InfoBox from '../../../components/app/alertBox/infoBox'
import Button from '../../../components/common/buttons/Button'
import { AutoComplete } from 'qbs-core'
import CustomDrawer from '../../../components/common/drawer'
import { DialogModal } from '../../../components/common'
import Icons from '../../../components/common/icons'
import { usePlans } from '../../Plans/api'
import { useMeditationList } from '../../Meditation/api'
import { useWorkoutList } from '../../Workout/api'
import { useYogaList } from '../../Yoga/api'
import {
  getAdminDetails,
  getActivePlanOverview,
  getOverviewDetail,
  freezeSubscription,
  unfreezeSubscription,
  workoutOverridesBulk,
  meditationOverridesBulk,
  yogaOverridesBulk,
} from '../api'
import { useAuthStore } from '../../../store/authStore'
import { useSnackbarManager } from '../../../components/common/snackbar'
import apiUrl from '../../../apis/api.url'
import { getData } from '../../../apis/api.helpers'
import { getWorkoutPlanSubcategories } from '../../Plans/Details/WorkoutPlan/api'
import { getYogaPlanSubcategories } from '../../YogaCategories/api'
import DayDetailTabsSection from './DayDetailTabsSection'
import { ClientWorkflowDetails } from '../../AssignedClients/WorkflowPanels'
import {
  useClientDetail,
  useClientPackageCycles,
  confirmClientPackageCycle,
} from '../../Sales/api'
import jsPDF from 'jspdf'
import { getErrorMessage } from '../../../utilities/parsers'

type DayDetailTab = 'diet' | 'workout' | 'yoga' | 'meditation'

// Helper function to capitalize first letter of each word
const toTitleCase = (str: string): string => {
  return str
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

export default function Subscriptions({
  id,
  user,
  loading,
  error,
  onRefresh,
  workflowAssignment,
  onWorkflowRefresh,
  selectedCycleId,
  selectedSubscriptionId,
  selectedCycle,
}: {
  id: string
  user: any
  loading: boolean
  error: string
  onRefresh: (data?: any) => void
  workflowAssignment?: any
  onWorkflowRefresh?: () => Promise<any>
  selectedCycleId?: string | number | null
  selectedSubscriptionId?: string | number | null
  selectedCycle?: any
  disableCycleChange?: boolean
}) {
  const queryClient = useQueryClient()
  const loginRole = useAuthStore((s) => s.roleData?.name?.toLowerCase?.())
  const isSuperAdmin = loginRole === 'superadmin'
  const isAdmin = loginRole === 'admin'
  const isSuperOrAdmin = isSuperAdmin || isAdmin
  const isNutritionist = loginRole === 'nutritionist'
  const isPhysio = loginRole === 'physiotherapist' || loginRole === 'physio'
  const isYogist =
    loginRole === 'yogist' ||
    loginRole === 'yoga_trainer' ||
    loginRole === 'yoga'

  const canAccessDiet = isSuperOrAdmin || isNutritionist
  const canAccessWorkout = isSuperOrAdmin || isPhysio || isNutritionist
  const canAccessYoga = isSuperOrAdmin || isYogist || isNutritionist

  const isServiceRole = ['nutritionist', 'yogist', 'physiotherapist'].includes(
    loginRole || ''
  )
  // Sales proposals belong to the client and can exist before staff assignment.
  const canLoadClientProposal = Boolean(
    isServiceRole || loginRole === 'superadmin' || loginRole === 'admin'
  )
  const { data: clientDetail, refetch: refetchClientDetail } = useClientDetail(
    canLoadClientProposal ? id : undefined,
    '/clients'
  )
  const { data: cycleData, refetch: refetchCycles } = useClientPackageCycles(
    canLoadClientProposal ? id : undefined,
    '/clients'
  )
  const rawCycles = cycleData?.cycles
  const cycles = useMemo(() => rawCycles || [], [rawCycles])

  const proposedCycle = useMemo(() => {
    if (selectedCycle) {
      if (
        selectedCycle.status === 'proposed' ||
        (!selectedCycle.subscription_id && selectedCycle.proposal)
      ) {
        return selectedCycle
      }
      if (selectedCycle.subscription_id) {
        return null
      }
    }
    return (
      cycles.find(
        (c: any) =>
          c.status === 'proposed' ||
          (!c.subscription_id && c.proposal?.status === 'proposed')
      ) || (cycles.length > 0 && !cycles[0].subscription_id ? cycles[0] : null)
    )
  }, [cycles, selectedCycle])

  const proposedPackage = useMemo(() => {
    if (
      selectedCycle &&
      (selectedCycle.status === 'proposed' || !selectedCycle.subscription_id)
    ) {
      if (selectedCycle.proposal) {
        return {
          ...selectedCycle.proposal,
          plan: selectedCycle.proposal?.plan || selectedCycle.plan,
          start_date:
            selectedCycle.start_date || selectedCycle.proposal?.start_date,
          end_date: selectedCycle.end_date || selectedCycle.proposal?.end_date,
        }
      }
      return {
        id: selectedCycle.id,
        status: 'proposed',
        plan: selectedCycle.plan,
        start_date: selectedCycle.start_date,
        end_date: selectedCycle.end_date,
      }
    }
    if (selectedCycle?.subscription_id || selectedCycleId === 'legacy') {
      return null
    }
    return (
      workflowAssignment?.anticipated_package ||
      (proposedCycle?.proposal
        ? {
            ...proposedCycle.proposal,
            plan: proposedCycle.plan || proposedCycle.proposal?.plan,
            start_date:
              proposedCycle.start_date || proposedCycle.proposal?.start_date,
            end_date:
              proposedCycle.end_date || proposedCycle.proposal?.end_date,
          }
        : null) ||
      clientDetail?.client?.plan_proposals?.find(
        (proposal: any) => proposal.status === 'proposed'
      )
    )
  }, [
    selectedCycle,
    selectedCycleId,
    workflowAssignment,
    proposedCycle,
    clientDetail,
  ])

  const canConfirmPackage = useMemo(() => {
    if (!proposedPackage) return false
    if (loginRole === 'superadmin' || loginRole === 'admin') {
      const targetCycle =
        selectedCycle &&
        (selectedCycle.status === 'proposed' || !selectedCycle.subscription_id)
          ? selectedCycle
          : proposedCycle
      const cycleAssignments = (targetCycle?.assignments ||
        user?.admin_assignments ||
        (workflowAssignment ? [workflowAssignment] : [])) as any[]
      const hasStaff = cycleAssignments.some((a: any) => a.staff_user_id)
      return hasStaff
    }

    const targetCycle =
      selectedCycle &&
      (selectedCycle.status === 'proposed' || !selectedCycle.subscription_id)
        ? selectedCycle
        : proposedCycle

    if (targetCycle?.can_confirm !== undefined) {
      return Boolean(targetCycle.can_confirm)
    }

    const cycleAssignments = (targetCycle?.assignments ||
      user?.admin_assignments ||
      (workflowAssignment ? [workflowAssignment] : [])) as any[]
    const assignedRoles = cycleAssignments
      .filter((a: any) => !a.ended_at)
      .map((a: any) => String(a.role || a.admin?.role || '').toLowerCase())
      .filter(Boolean)

    if (assignedRoles.includes('nutritionist')) {
      return loginRole === 'nutritionist'
    }
    return ['physiotherapist', 'physio', 'yogist', 'yoga'].includes(
      loginRole || ''
    )
  }, [
    proposedPackage,
    loginRole,
    selectedCycle,
    proposedCycle,
    user,
    workflowAssignment,
  ])

  const canUpdatePackage = canConfirmPackage

  const [confirmModalOpen, setConfirmModalOpen] = useState(false)
  const [confirmingPackage, setConfirmingPackage] = useState(false)

  const subscribedPlan = user?.subscribed_plan
  const [overview, setOverview] = useState<any>(null)
  const [overviewLoading, setOverviewLoading] = useState(false)
  const [overviewError, setOverviewError] = useState<string>('')

  const isMeditationIncluded = useMemo(() => {
    const candidates = [
      overview?.subscription?.plan_details?.meditation_included,
      overview?.subscription?.plan?.meditation_included,
      overview?.subscription?.package_details?.meditation_included,
      overview?.subscription?.package?.meditation_included,
      overview?.subscription?.meditation_included,
      overview?.plan_details?.meditation_included,
      overview?.plan?.meditation_included,
      overview?.package?.meditation_included,
      overview?.meditation_included,
      selectedCycle?.plan_details?.meditation_included,
      selectedCycle?.plan?.meditation_included,
      selectedCycle?.package_details?.meditation_included,
      selectedCycle?.package?.meditation_included,
      selectedCycle?.meditation_included,
      selectedCycle?.proposal?.plan_details?.meditation_included,
      selectedCycle?.proposal?.plan?.meditation_included,
      selectedCycle?.proposal?.package_details?.meditation_included,
      selectedCycle?.proposal?.package?.meditation_included,
      selectedCycle?.proposal?.meditation_included,
      proposedPackage?.plan_details?.meditation_included,
      proposedPackage?.plan?.meditation_included,
      proposedPackage?.package_details?.meditation_included,
      proposedPackage?.package?.meditation_included,
      proposedPackage?.meditation_included,
      user?.subscribed_plan?.meditation_included,
      user?.subscribed_package?.meditation_included,
      user?.plan_details?.meditation_included,
      user?.plan?.meditation_included,
      user?.package?.meditation_included,
      user?.subscription?.plan_details?.meditation_included,
      user?.subscription?.plan?.meditation_included,
      user?.subscription?.package_details?.meditation_included,
      user?.subscription?.package?.meditation_included,
      user?.subscription?.meditation_included,
      user?.meditation_included,
      clientDetail?.client?.plan_details?.meditation_included,
      clientDetail?.client?.plan?.meditation_included,
      clientDetail?.client?.package_details?.meditation_included,
      clientDetail?.client?.package?.meditation_included,
      clientDetail?.client?.subscription?.plan_details?.meditation_included,
      clientDetail?.client?.subscription?.plan?.meditation_included,
      clientDetail?.client?.subscription?.package_details?.meditation_included,
      clientDetail?.client?.subscription?.package?.meditation_included,
      clientDetail?.client?.subscription?.meditation_included,
      clientDetail?.client?.active_subscription?.plan_details
        ?.meditation_included,
      clientDetail?.client?.active_subscription?.plan?.meditation_included,
      clientDetail?.client?.active_subscription?.meditation_included,
      overview?.subscription?.plan_details?.meditationIncluded,
      overview?.subscription?.plan?.meditationIncluded,
      overview?.subscription?.meditationIncluded,
      selectedCycle?.plan_details?.meditationIncluded,
      selectedCycle?.plan?.meditationIncluded,
      selectedCycle?.meditationIncluded,
      proposedPackage?.plan_details?.meditationIncluded,
      proposedPackage?.plan?.meditationIncluded,
      proposedPackage?.meditationIncluded,
      user?.subscribed_plan?.meditationIncluded,
      user?.plan_details?.meditationIncluded,
      user?.plan?.meditationIncluded,
      user?.subscription?.plan_details?.meditationIncluded,
      user?.subscription?.plan?.meditationIncluded,
      user?.subscription?.meditationIncluded,
      user?.meditationIncluded,
      clientDetail?.client?.plan_details?.meditationIncluded,
      clientDetail?.client?.plan?.meditationIncluded,
      clientDetail?.client?.subscription?.plan_details?.meditationIncluded,
      clientDetail?.client?.subscription?.plan?.meditationIncluded,
      clientDetail?.client?.subscription?.meditationIncluded,
    ]

    for (const val of candidates) {
      if (val !== undefined && val !== null) {
        if (typeof val === 'boolean') return val
        if (typeof val === 'number') return val === 1 || val > 0
        if (typeof val === 'string') {
          const lower = val.toLowerCase().trim()
          if (lower === '0' || lower === 'false' || lower === 'no') return false
          if (lower === '1' || lower === 'true' || lower === 'yes') return true
        }
      }
    }

    const daysList =
      overview?.days ||
      overview?.data?.days ||
      overview?.subscription?.days ||
      []

    if (Array.isArray(daysList) && daysList.length > 0) {
      const hasMeditationSummary = daysList.some(
        (day: any) =>
          day?.meditation_summary !== undefined &&
          day?.meditation_summary !== null
      )
      return hasMeditationSummary
    }

    if (
      overview?.meditation_summary !== undefined &&
      overview?.meditation_summary !== null
    ) {
      return true
    }

    return true
  }, [overview, selectedCycle, proposedPackage, user, clientDetail])

  const canAccessMeditation =
    (isSuperOrAdmin || isNutritionist || isYogist) && isMeditationIncluded
  const [currentMonth, setCurrentMonth] = useState<string>('')
  const [dayDetailOpen, setDayDetailOpen] = useState(false)
  const [dayDetail, setDayDetail] = useState<any>(null)
  const [dayDetailLoading, setDayDetailLoading] = useState(false)
  const [dayDetailTab, setDayDetailTab] = useState<DayDetailTab>('diet')
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [toggleFreezeOpen, setToggleFreezeOpen] = useState(false)
  const [toggleFreezeRow, setToggleFreezeRow] = useState<any>(null)
  const [freezeMode, setFreezeMode] = useState<'freeze' | 'unfreeze'>('freeze')
  const [loader, setLoader] = useState(false)
  const [freezeForm, setFreezeForm] = useState<{
    reason: string
    start_date: string
    end_date: string
  }>({
    reason: '',
    start_date: '',
    end_date: '',
  })

  const isActionableSubscription = useMemo(() => {
    const cycleStatus = (selectedCycle?.status || '').toLowerCase()
    const subStatus = (
      overview?.subscription?.status ||
      cycleStatus ||
      ''
    ).toLowerCase()
    const inactiveStatuses = [
      'expired',
      'cancelled',
      'refunded',
      'dropped_out',
      'declined',
      'ended',
    ]

    if (
      inactiveStatuses.includes(cycleStatus) ||
      inactiveStatuses.includes(subStatus)
    ) {
      return false
    }

    const endDate = overview?.subscription?.end_date || selectedCycle?.end_date
    if (endDate && moment(endDate, 'YYYY-MM-DD').isBefore(moment(), 'day')) {
      if (cycleStatus !== 'upcoming' && subStatus !== 'upcoming') {
        return false
      }
    }

    return true
  }, [overview?.subscription, selectedCycle])

  const [assignOpen, setAssignOpen] = useState(false)
  const [reviewOpen, setReviewOpen] = useState(false)
  const [selectedWorkouts, setSelectedWorkouts] = useState<any[]>([])
  const [workoutCounts, setWorkoutCounts] = useState<Record<string, number>>({})
  const [wpPage, setWpPage] = useState<number>(1)
  const [wpPerPage] = useState<number>(9999)
  const [wpSearch, setWpSearch] = useState<string>('')
  const [assigning, setAssigning] = useState<boolean>(false)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dragGroup, setDragGroup] = useState<string | null>(null)
  const [yogaAssignOpen, setYogaAssignOpen] = useState(false)
  const [yogaReviewOpen, setYogaReviewOpen] = useState(false)
  const [selectedYogas, setSelectedYogas] = useState<any[]>([])
  const [yogaCategoryFilter, setYogaCategoryFilter] = useState<string>('')
  const [yogaAssigning, setYogaAssigning] = useState(false)
  const [yogaDragIndex, setYogaDragIndex] = useState<number | null>(null)
  const [medAssignOpen, setMedAssignOpen] = useState(false)
  const [medReviewOpen, setMedReviewOpen] = useState(false)
  const [selectedMeditations, setSelectedMeditations] = useState<any[]>([])
  const [medPage, setMedPage] = useState<number>(1)
  const [medPerPage, setMedPerPage] = useState<number>(20)
  const [medSearch, setMedSearch] = useState<string>('')
  const [medAssigning, setMedAssigning] = useState(false)
  const [medDragIndex, setMedDragIndex] = useState<number | null>(null)
  const [downloadingTemplate, setDownloadingTemplate] = useState(false)
  const refreshEntirePage = useCallback(() => {
    if (
      typeof window !== 'undefined' &&
      typeof window.location?.reload === 'function'
    ) {
      window.location.reload()
    }
  }, [])
  const shouldLoadPlans = Boolean(workflowAssignment)
  const shouldLoadWorkouts = assignOpen
  const shouldLoadYoga = yogaAssignOpen
  const shouldLoadMeditations = medAssignOpen
  const { data: plansList } = usePlans({ page: 1, per_page: 100 } as any, {
    enabled: shouldLoadPlans,
    staleTime: 5 * 60 * 1000,
  })
  const isYogaSelected = (id: any) =>
    selectedYogas.some((y) => String(y?.id) === String(id))
  const allPlans: any[] = (
    (plansList?.plans || plansList?.items || []) as any[]
  ).filter((p: any) => p?.active)
  const { enqueueSnackbar } = useSnackbarManager()
  const { data: allWorkoutsResp, isLoading: allWorkoutsLoading } =
    useWorkoutList(
      {
        page: 1,
        per_page: 99999,
      } as any,
      {
        enabled: dayDetailOpen,
        staleTime: 5 * 60 * 1000,
      }
    )
  const getWorkoutSelectableId = (item: any) =>
    item?.workout_id || item?.workout?.id || item?.id || item?.workoutId

  const isSelected = (id: any) =>
    selectedWorkouts.some(
      (w) =>
        String(getWorkoutSelectableId(w)) === String(id) ||
        String(w?.id) === String(id)
    )

  const allWorkoutsForLookup = allWorkoutsResp?.workouts ?? []
  const { data: categoriesResponse } = useQuery(
    ['workout_categories_for_assign_admin'],
    () => getData(apiUrl.CATEGORIES),
    {
      staleTime: 5 * 60 * 1000,
    }
  )

  const normalizedCategories = useMemo(() => {
    const categories =
      (categoriesResponse as any)?.categories ??
      (categoriesResponse as any)?.category ??
      categoriesResponse
    if (Array.isArray(categories)) return categories
    return []
  }, [categoriesResponse])
  const categoryOptions = useMemo(
    () =>
      normalizedCategories.map((cat: any) => ({
        id: cat?.id,
        name: cat?.name,
        subcategories: Array.isArray(cat?.subcategories)
          ? cat.subcategories
          : [],
      })),
    [normalizedCategories]
  )
  const subcategoryParentMap = useMemo(() => {
    const map: Record<
      string,
      {
        categoryId: number | string | undefined
        categoryName: string
        label: string
      }
    > = {}

    categoryOptions.forEach((cat: any) => {
      const subs = Array.isArray(cat?.subcategories) ? cat.subcategories : []

      subs.forEach((sub: any) => {
        const subId = sub?.id ?? sub?.value
        if (subId === undefined || subId === null) return

        const catName = toTitleCase(cat?.name ?? '')
        const subName = toTitleCase(sub?.value ?? sub?.name ?? sub?.label ?? '')
        const formattedLabel =
          catName && subName ? `${catName} - ${subName}` : subName || catName

        map[String(subId)] = {
          categoryId: cat?.id,
          categoryName: catName,
          label: formattedLabel,
        }
      })
    })

    return map
  }, [categoryOptions])
  const [selectedCategoryId, setSelectedCategoryId] = useState<
    number | string | undefined
  >(undefined)
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<
    Array<number | string>
  >([])
  const [selectedCategoryName, setSelectedCategoryName] = useState<string>('')
  const formattedCategoryOptions = useMemo(() => {
    return (categoryOptions || []).map((c: any) => ({
      ...c,
      name: toTitleCase(c.name || ''),
    }))
  }, [categoryOptions])
  const selectedCategoryItems = useMemo(
    () =>
      formattedCategoryOptions.filter((cat: any) =>
        selectedCategoryIds.map(String).includes(String(cat?.id))
      ),
    [formattedCategoryOptions, selectedCategoryIds]
  )
  const [selectedSubcategories, setSelectedSubcategories] = useState<any[]>([])
  const subcategoryLookupRef = useRef<
    Record<string, { id: any; value: string }>
  >({})
  const prefillAppliedRef = useRef(false)
  const lastPrefillSignatureRef = useRef('')
  const selectAllNextWorkoutsRef = useRef(false)
  const selectAllNextYogasRef = useRef(false)
  const drawerSelectionInitializedRef = useRef(false)
  const userSelectionTouchedRef = useRef(false)
  const pendingPrefillCategoryRef = useRef<string>('')

  const pendingPrefillSubcategoriesRef = useRef<
    | {
        id: any
        value: string
      }[]
    | null
  >(null)
  const yogaSelectionPrefilledRef = useRef(false)
  const medSelectionPrefilledRef = useRef(false)
  const selectedSubcategoryIds = useMemo(
    () =>
      (selectedSubcategories || [])
        .map((s: any) => s?.id)
        .filter((id: any) => id != null),
    [selectedSubcategories]
  )
  const normalizedSelectedSubcategories = useMemo(() => {
    if (!selectedSubcategories?.length) return []
    return selectedSubcategories
      .map((item: any) => {
        if (!item) return null
        const key = item?.id ?? item?.value ?? item
        if (key === undefined || key === null) return null
        const parentMeta = subcategoryParentMap[String(key)]
        const cached = subcategoryLookupRef.current[String(key)]
        const label =
          parentMeta?.label ||
          cached?.value ||
          item?.value ||
          item?.name ||
          item?.label ||
          item?.desc ||
          ''
        return {
          id: key,
          value: label,
        }
      })
      .filter(Boolean)
  }, [selectedSubcategories, subcategoryParentMap])
  const deriveSubcategorySelection = useCallback((value?: any | any[]) => {
    if (!value) return []
    const list = Array.isArray(value) ? value : [value]
    return list
      .map((item) => {
        if (!item) return null
        const id = item?.id ?? item?.value ?? item
        if (id === undefined || id === null) return null
        const label =
          item?.value ?? item?.name ?? item?.label ?? item?.desc ?? ''
        return { id, value: label }
      })
      .filter(Boolean)
  }, [])
  const updateSubcategoryLookup = useCallback((options: any[]) => {
    if (!Array.isArray(options) || options.length === 0) return
    options.forEach((opt: any) => {
      const id = opt?.id ?? opt?.value ?? opt
      if (id === undefined || id === null) return
      const label = opt?.value ?? opt?.name ?? opt?.label ?? ''
      subcategoryLookupRef.current[String(id)] = { id, value: label }
    })
  }, [])
  const workoutListParams = useMemo(() => {
    const params: any = {
      page: wpPage,
      per_page: wpPerPage,
      search: wpSearch,
    }
    if (selectedCategoryIds.length) {
      params.category_ids = selectedCategoryIds.join(',')
    } else if (selectedCategoryId) {
      params.category_id = selectedCategoryId
    }
    // We intentionally DO NOT send subcategory_ids to the API here.
    // If we send it, the backend filters strictly and excludes workouts from
    // other categories that don't have subcategories selected. We will filter locally.

    return params
  }, [wpPage, wpPerPage, wpSearch, selectedCategoryIds, selectedCategoryId])
  const { data: workoutsResp, isFetching: workoutsLoading } = useWorkoutList(
    workoutListParams as any,
    {
      enabled: shouldLoadWorkouts,
      keepPreviousData: true,
      staleTime: 5 * 60 * 1000,
    }
  )

  const workouts = useMemo(() => {
    const raw = workoutsResp?.workouts ?? []
    if (!selectedSubcategoryIds.length) return raw

    return raw.filter((w: any) => {
      const mainCatId =
        w?.category?.main_category?.id ??
        w?.category?.parent_id ??
        w?.category_id ??
        w?.category?.id

      const hasSubSelectedForThisCat = selectedSubcategoryIds.some((subId) => {
        const meta = subcategoryParentMap[String(subId)]
        return String(meta?.categoryId) === String(mainCatId)
      })

      if (!hasSubSelectedForThisCat) {
        return true
      }

      const wSubId =
        w?.subcategory?.id ??
        w?.subcategory_id ??
        w?.category?.id ??
        w?.category_id
      return selectedSubcategoryIds.map(String).includes(String(wSubId))
    })
  }, [workoutsResp, selectedSubcategoryIds, subcategoryParentMap])
  const {
    data: medResp,
    isFetching: medLoading,
    refetch: refetchMeditationsList,
  } = useMeditationList(
    {
      page: medPage,
      per_page: medPerPage,
      search: medSearch,
    } as any,
    {
      enabled: shouldLoadMeditations,
      keepPreviousData: true,
      staleTime: 5 * 60 * 1000,
    }
  )
  const meditations = medResp?.meditations ?? medResp?.items ?? []
  const medMeta = medResp?.meta ?? {}
  const allVisibleSelected =
    Array.isArray(meditations) &&
    meditations.length > 0 &&
    meditations.every((m: any) => isSelected(m?.id))

  // Yoga categories and multiple category/subcategory filtering
  const { data: yogaCategoriesResponse } = useQuery(
    ['yoga_categories_for_assign_admin'],
    () => getData(`${apiUrl.CATEGORIES}?category_type=yoga`),
    {
      staleTime: 5 * 60 * 1000,
    }
  )

  const normalizedYogaCategories = useMemo(() => {
    const categories =
      (yogaCategoriesResponse as any)?.categories ??
      (yogaCategoriesResponse as any)?.category ??
      yogaCategoriesResponse
    if (Array.isArray(categories)) return categories
    return []
  }, [yogaCategoriesResponse])

  const yogaCategoryOptions = useMemo(
    () =>
      normalizedYogaCategories.map((cat: any) => ({
        id: cat?.id,
        name: cat?.name,
        subcategories: Array.isArray(cat?.subcategories)
          ? cat.subcategories
          : [],
      })),
    [normalizedYogaCategories]
  )

  const formattedYogaCategoryOptions = useMemo(() => {
    return (yogaCategoryOptions || []).map((c: any) => ({
      ...c,
      name: toTitleCase(c.name || ''),
    }))
  }, [yogaCategoryOptions])

  const [selectedYogaCategoryIds, setSelectedYogaCategoryIds] = useState<
    Array<number | string>
  >([])
  const [selectedYogaSubcategories, setSelectedYogaSubcategories] = useState<
    any[]
  >([])
  const [yogaSubcategoryLookup, setYogaSubcategoryLookup] = useState<
    Record<string, { id: any; value: string }>
  >({})

  const selectedYogaCategoryItems = useMemo(
    () =>
      formattedYogaCategoryOptions.filter((cat: any) =>
        selectedYogaCategoryIds.map(String).includes(String(cat?.id))
      ),
    [formattedYogaCategoryOptions, selectedYogaCategoryIds]
  )

  const selectedYogaSubcategoryIds = useMemo(
    () =>
      (selectedYogaSubcategories || [])
        .map((s: any) => s?.id)
        .filter((id: any) => id != null),
    [selectedYogaSubcategories]
  )

  const yogaSubcategoryParentMap = useMemo(() => {
    const map: Record<
      string,
      {
        categoryId: number | string | undefined
        categoryName: string
        label: string
      }
    > = {}

    yogaCategoryOptions.forEach((cat: any) => {
      const subs = Array.isArray(cat?.subcategories)
        ? cat.subcategories
        : Array.isArray(cat?.subcategory)
          ? cat.subcategory
          : []

      subs.forEach((sub: any) => {
        const subId = sub?.id ?? sub?.value
        if (subId === undefined || subId === null) return

        const catName = toTitleCase(cat?.name ?? '')
        const subName = toTitleCase(sub?.value ?? sub?.name ?? sub?.label ?? '')
        const formattedLabel =
          catName && subName ? `${catName} - ${subName}` : subName || catName

        map[String(subId)] = {
          categoryId: cat?.id,
          categoryName: catName,
          label: formattedLabel,
        }
      })
    })

    return map
  }, [yogaCategoryOptions])

  const normalizedSelectedYogaSubcategories = useMemo(() => {
    if (!selectedYogaSubcategories?.length) return []
    return selectedYogaSubcategories
      .map((item: any) => {
        if (!item) return null
        const key = item?.id ?? item?.value ?? item
        if (key === undefined || key === null) return null
        const parentMeta = yogaSubcategoryParentMap[String(key)]
        const cached = yogaSubcategoryLookup[String(key)]
        const label =
          parentMeta?.label ||
          cached?.value ||
          item?.value ||
          item?.name ||
          item?.label ||
          item?.desc ||
          ''
        return {
          id: key,
          value: label,
        }
      })
      .filter(Boolean)
  }, [
    selectedYogaSubcategories,
    yogaSubcategoryLookup,
    yogaSubcategoryParentMap,
  ])

  const updateYogaSubcategoryLookup = useCallback((options: any[]) => {
    if (!Array.isArray(options) || options.length === 0) return
    setYogaSubcategoryLookup((prev) => {
      const next = { ...prev }
      options.forEach((opt: any) => {
        const id = opt?.id ?? opt?.value ?? opt
        if (id === undefined || id === null) return
        const label = opt?.value ?? opt?.name ?? opt?.label ?? ''
        next[String(id)] = { id, value: label }
      })
      return next
    })
  }, [])

  const yogaListParams = useMemo(() => {
    const params: any = {
      page: 1,
      per_page: 99999,
    }
    if (selectedYogaCategoryIds.length) {
      params.category_ids = selectedYogaCategoryIds.join(',')
    }
    if (selectedYogaSubcategoryIds.length) {
      params.subcategory_ids = selectedYogaSubcategoryIds.join(',')
    }
    if (yogaCategoryFilter) {
      params.category = yogaCategoryFilter
    }
    return params
  }, [selectedYogaCategoryIds, selectedYogaSubcategoryIds, yogaCategoryFilter])
  const { data: yogasResp, isFetching: yogasLoading } = useYogaList(
    yogaListParams as any,
    {
      enabled: shouldLoadYoga,
      keepPreviousData: true,
      staleTime: 5 * 60 * 1000,
    }
  )
  const yogas = yogasResp?.yogas ?? yogasResp?.items ?? []
  const allVisibleYogaSelected =
    Array.isArray(yogas) &&
    yogas.length > 0 &&
    yogas.every((y: any) => isYogaSelected(y?.id))
  const hasVisibleYogaSelection =
    Array.isArray(yogas) && yogas.some((y: any) => isYogaSelected(y?.id))

  const getYogaGroupLabels = useCallback(
    (w: any) => {
      const subId =
        w?.subcategory_id ??
        w?.yoga?.subcategory_id ??
        w?.subcategory?.id ??
        w?.yoga?.subcategory?.id

      const parentMeta = subId ? yogaSubcategoryParentMap[String(subId)] : null

      const main =
        parentMeta?.categoryName ??
        w?.category?.main_category?.name ??
        w?.category?.parent?.name ??
        w?.category?.main_category_name ??
        w?.category?.parent_name ??
        w?.yoga?.category?.main_category?.name ??
        w?.yoga?.category?.parent?.name ??
        w?.category?.name ??
        w?.category_name ??
        'Others'

      const sub = parentMeta?.label?.includes(' - ')
        ? parentMeta.label.split(' - ')[1]
        : (parentMeta?.label ??
          w?.subcategory?.name ??
          w?.subcategory_name ??
          w?.yoga?.subcategory?.name ??
          w?.yoga?.subcategory_name ??
          w?.yoga?.category?.name ??
          w?.category?.name ??
          w?.category ??
          'Others')

      const mainTitle = toTitleCase(String(main || 'Others'))
      const subTitle = toTitleCase(String(sub || 'Others'))

      return {
        main: mainTitle,
        sub: subTitle,
        legend:
          mainTitle && subTitle && mainTitle !== subTitle
            ? `${mainTitle} - ${subTitle}`
            : subTitle || mainTitle,
      }
    },
    [yogaSubcategoryParentMap]
  )

  const getYogaGroupKey = useCallback(
    (w: any) => {
      const { main, sub } = getYogaGroupLabels(w)
      return `${main}::${sub}`
    },
    [getYogaGroupLabels]
  )

  const groupedYogas = useMemo(() => {
    if (!Array.isArray(yogas) || yogas.length === 0) return []

    const sorted = yogas.slice().sort((a: any, b: any) => {
      const pa = a?.category?.priority ?? 9999
      const pb = b?.category?.priority ?? 9999
      if (pa === pb) return 0
      return pa < pb ? -1 : 1
    })

    const groups = new Map<
      string,
      { main: string; sub: string; legend: string; items: any[] }
    >()

    sorted.forEach((w: any) => {
      const key = getYogaGroupKey(w)
      if (!groups.has(key)) {
        const labels = getYogaGroupLabels(w)
        groups.set(key, {
          main: labels.main,
          sub: labels.sub,
          legend: labels.legend,
          items: [],
        })
      }
      groups.get(key)!.items.push(w)
    })

    return Array.from(groups.values()).map((group) => ({
      name: group.sub,
      mainName: group.main,
      legend: group.legend,
      items: group.items,
    }))
  }, [yogas, getYogaGroupKey, getYogaGroupLabels])

  const sortedMeditations = useMemo(() => {
    if (!Array.isArray(meditations) || meditations.length === 0) return []
    return meditations.slice().sort((a: any, b: any) => {
      const nameA = (a?.title || a?.name || '').toLowerCase()
      const nameB = (b?.title || b?.name || '').toLowerCase()
      if (nameA === nameB) return 0
      return nameA < nameB ? -1 : 1
    })
  }, [meditations])

  const getEmbedUrl = (url?: string) => {
    const u = String(url || '').trim()
    if (!u) return ''

    const ytMatch = u.match(
      /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|v\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/i
    )
    if (ytMatch && ytMatch[1]) {
      return `https://www.youtube.com/embed/${ytMatch[1]}`
    }

    const vimeoMatch = u.match(
      /(?:vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|album\/(?:\d+)\/video\/|video\/|))(\d+)/i
    )
    if (vimeoMatch && vimeoMatch[1]) {
      return `https://player.vimeo.com/video/${vimeoMatch[1]}`
    }

    return ''
  }

  const fetchOverview = useCallback(async () => {
    const targetUserId = user?.id || id
    if (!targetUserId) return

    // If a proposed cycle or cycle without subscription is explicitly selected
    if (
      selectedCycle &&
      (!selectedCycle.subscription_id || selectedCycle.status === 'proposed')
    ) {
      setOverview(null)
      setOverviewError('')
      setOverviewLoading(false)
      return
    }

    try {
      setOverviewLoading(true)
      setOverviewError('')
      const subId =
        selectedCycle?.subscription_id || selectedSubscriptionId || undefined
      const res = await getActivePlanOverview(targetUserId, subId)
      setOverview(res)

      const todayStr = moment().format('YYYY-MM-DD')
      const hasToday = Array.isArray(res?.days)
        ? res.days.some((d: any) => {
            const dateMatch = d?.date === todayStr
            const statusStr = String(d?.status || '').toLowerCase()
            return dateMatch && statusStr === 'today'
          })
        : false

      if (hasToday) {
        setCurrentMonth(
          moment(todayStr, 'YYYY-MM-DD').startOf('month').format('YYYY-MM')
        )
      } else {
        const sd = res?.subscription?.start_date
        if (sd) {
          setCurrentMonth(
            moment(sd, 'YYYY-MM-DD').startOf('month').format('YYYY-MM')
          )
        } else {
          setCurrentMonth('')
        }
      }
    } catch (e: any) {
      setOverview(null)
      const parsedErr = getErrorMessage(e)
      if (parsedErr && parsedErr !== 'An unexpected error occurred') {
        setOverviewError(parsedErr)
      } else {
        setOverviewError('')
      }
    } finally {
      setOverviewLoading(false)
    }
  }, [user?.id, id, selectedSubscriptionId, selectedCycle])

  useEffect(() => {
    setDayDetailOpen(false)
    setDayDetail(null)
    setSelectedDate('')
  }, [selectedSubscriptionId, selectedCycleId])

  useEffect(() => {
    fetchOverview()
  }, [
    fetchOverview,
    workflowAssignment?.package_confirmed_at,
    selectedSubscriptionId,
    selectedCycleId,
  ])

  const handleConfirmPackage = async () => {
    const targetCycle =
      proposedCycle ||
      cycles.find((c: any) => c.status === 'proposed' || !c.subscription_id)

    if (!targetCycle?.id) {
      enqueueSnackbar('No package cycle found to confirm.', {
        variant: 'error',
      })
      return
    }

    try {
      setConfirmingPackage(true)
      const res = await confirmClientPackageCycle(
        id,
        targetCycle.id,
        '/clients'
      )
      enqueueSnackbar(
        res?.message ||
          'Package confirmed and converted to active subscription.',
        { variant: 'success' }
      )
      setConfirmModalOpen(false)

      await Promise.allSettled([
        refetchCycles(),
        canLoadClientProposal ? refetchClientDetail() : Promise.resolve(),
        fetchOverview(),
        onWorkflowRefresh ? onWorkflowRefresh() : Promise.resolve(),
      ])

      try {
        const fresh = await getAdminDetails(String(id))
        if (onRefresh) onRefresh(fresh)
      } catch {}

      await queryClient.invalidateQueries({
        predicate: (q: any) =>
          [
            'client_package_cycles',
            'client_detail',
            'assigned_client_workflow_client',
            'assigned_client_workflow_detail',
            'sales_renewal_requests',
          ].includes(String(q.queryKey?.[0])),
      })
    } catch (err: any) {
      enqueueSnackbar(
        err?.response?.data?.error ||
          err?.response?.data?.errors?.[0] ||
          err?.message ||
          'Failed to confirm package.',
        { variant: 'error' }
      )
    } finally {
      setConfirmingPackage(false)
    }
  }

  const getYogaId = (item: any) => {
    if (!item) return undefined
    return (
      item?.yoga_id ??
      item?.id ??
      item?.yoga?.id ??
      item?.yogaId ??
      item?.yoga_item_id
    )
  }

  const toYogaSelectable = (item: any, idx?: number) => {
    const yogaId = getYogaId(item)
    if (yogaId == null) return null
    return {
      ...item,
      id: yogaId,
      name:
        item?.yoga_name ||
        item?.name ||
        item?.title ||
        item?.workout_name ||
        `Yoga ${typeof idx === 'number' ? idx + 1 : ''}`.trim(),
      video_url:
        item?.video_url ||
        item?.yoga?.video_url ||
        item?.workout_video_url ||
        item?.workout?.video_url ||
        '',
    }
  }

  const toggleSelected = (w: any) => {
    const workoutId = getWorkoutSelectableId(w) ?? w?.id
    if (workoutId == null) return
    const key = String(workoutId)
    userSelectionTouchedRef.current = true
    setSelectedWorkouts((prev) => {
      const exists = prev.some(
        (x) =>
          String(getWorkoutSelectableId(x)) === key || String(x?.id) === key
      )
      if (exists) {
        setWorkoutCounts((counts) => {
          const next = { ...counts }
          delete next[key]
          return next
        })
        return prev.filter(
          (x) =>
            String(getWorkoutSelectableId(x)) !== key && String(x?.id) !== key
        )
      } else {
        setWorkoutCounts((counts) => ({
          ...counts,
          [key]: Math.max(1, counts[key] ?? 1),
        }))
        return [...prev, w]
      }
    })
  }

  const allVisibleWorkoutSelected = useMemo(() => {
    if (!Array.isArray(workouts) || workouts.length === 0) return false
    return workouts.every((w: any) => {
      const id = getWorkoutSelectableId(w) ?? w?.id
      return id != null && isSelected(id)
    })
  }, [workouts, selectedWorkouts])

  const hasVisibleWorkoutSelection = useMemo(() => {
    if (!Array.isArray(workouts) || workouts.length === 0) return false
    return workouts.some((w: any) => {
      const id = getWorkoutSelectableId(w) ?? w?.id
      return id != null && isSelected(id)
    })
  }, [workouts, selectedWorkouts])

  const handleWorkoutSelectAllVisible = () => {
    if (!Array.isArray(workouts) || workouts.length === 0) return
    userSelectionTouchedRef.current = true
    setSelectedWorkouts((prev) => {
      const existingIds = new Set(
        prev.map((item) => String(getWorkoutSelectableId(item) ?? item?.id))
      )
      const next = [...prev]
      workouts.forEach((w: any) => {
        const id = getWorkoutSelectableId(w) ?? w?.id
        if (id == null) return
        const key = String(id)
        if (!existingIds.has(key)) {
          existingIds.add(key)
          next.push(w)
          setWorkoutCounts((counts) => ({
            ...counts,
            [key]: Math.max(1, counts[key] ?? 1),
          }))
        }
      })
      return next
    })
  }

  const handleWorkoutUnselectAllVisible = () => {
    if (!hasVisibleWorkoutSelection) return
    userSelectionTouchedRef.current = true
    setSelectedWorkouts((prev) => {
      if (!Array.isArray(workouts) || workouts.length === 0) return []
      const visibleIds = new Set(
        workouts.map((w: any) => String(getWorkoutSelectableId(w) ?? w?.id))
      )
      setWorkoutCounts((counts) => {
        const next = { ...counts }
        visibleIds.forEach((id) => delete next[id])
        return next
      })
      return prev.filter(
        (item) =>
          !visibleIds.has(String(getWorkoutSelectableId(item) ?? item?.id))
      )
    })
  }

  const yogaCanProceedToReview = selectedYogas.length > 0
  const canReorderYogaSelections = selectedYogas.length > 1

  const toggleYogaSelected = (item: any) => {
    const normalized = toYogaSelectable(item)
    if (!normalized?.id) return
    setSelectedYogas((prev) =>
      prev.some((y) => String(y?.id) === String(normalized.id))
        ? prev.filter((y) => String(y?.id) !== String(normalized.id))
        : [...prev, normalized]
    )
  }

  const handleYogaSelectAllVisible = () => {
    if (!Array.isArray(yogas) || yogas.length === 0) return
    setSelectedYogas((prev) => {
      const existingIds = new Set(prev.map((item) => String(item?.id)))
      const next = [...prev]
      yogas.forEach((yoga: any) => {
        const normalized = toYogaSelectable(yoga)
        if (!normalized?.id) return
        const key = String(normalized.id)
        if (!existingIds.has(key)) {
          existingIds.add(key)
          next.push(normalized)
        }
      })
      return next
    })
  }

  const handleYogaUnselectAllVisible = () => {
    if (!hasVisibleYogaSelection) return
    setSelectedYogas((prev) => {
      if (!Array.isArray(yogas) || yogas.length === 0) return []
      const visibleIds = new Set(yogas.map((y: any) => String(y?.id)))
      return prev.filter((item) => !visibleIds.has(String(item?.id)))
    })
  }

  const getWorkoutGroupLabels = useCallback(
    (w: any) => {
      const subId =
        w?.category_id ??
        w?.subcategory_id ??
        w?.workout?.subcategory_id ??
        w?.subcategory?.id ??
        w?.workout?.category_id ??
        w?.workout?.category?.id

      const parentMeta =
        subId != null ? subcategoryParentMap[String(subId)] : null

      const main =
        parentMeta?.categoryName ??
        w?.category?.main_category?.name ??
        w?.category?.parent?.name ??
        w?.category?.main_category_name ??
        w?.category?.parent_name ??
        w?.workout?.category?.main_category?.name ??
        w?.workout?.category?.parent?.name ??
        w?.category?.name ??
        w?.category_name ??
        'Others'

      const sub = parentMeta?.label?.includes(' - ')
        ? parentMeta.label.split(' - ')[1]
        : (parentMeta?.label ??
          w?.subcategory?.name ??
          w?.subcategory_name ??
          w?.workout?.subcategory?.name ??
          w?.workout?.subcategory_name ??
          w?.workout?.category?.name ??
          w?.category?.name ??
          w?.category ??
          'Others')

      const mainTitle = toTitleCase(String(main || 'Others'))
      const subTitle = toTitleCase(String(sub || 'Others'))

      return {
        main: mainTitle,
        sub: subTitle,
        legend:
          mainTitle && subTitle && mainTitle !== subTitle
            ? `${mainTitle} - ${subTitle}`
            : subTitle || mainTitle,
      }
    },
    [subcategoryParentMap]
  )

  const getWorkoutGroupKey = useCallback(
    (w: any) => {
      const { main, sub } = getWorkoutGroupLabels(w)
      return `${main}::${sub}`
    },
    [getWorkoutGroupLabels]
  )

  const collectAllVisibleYogas = useCallback(
    (list: any[]) => {
      if (!Array.isArray(list) || list.length === 0) return []
      const unique = new Map<string, any>()

      list.forEach((item: any) => {
        const normalized = toYogaSelectable(item)
        if (!normalized?.id) return
        const key = String(normalized.id)
        if (!unique.has(key)) {
          unique.set(key, normalized)
        }
      })

      return Array.from(unique.values())
    },
    [toYogaSelectable]
  )
  const handleSelectAllVisible = () => {
    if (!Array.isArray(meditations) || meditations.length === 0) return
    setSelectedMeditations((prev) => {
      const existingIds = new Set(prev.map((item) => String(item?.id)))
      const next = [...prev]
      meditations.forEach((m: any) => {
        const id = String(m?.id)
        if (!existingIds.has(id)) {
          existingIds.add(id)
          next.push(m)
        }
      })
      return next
    })
  }
  const handleUnselectVisible = () => {
    if (selectedMeditations.length === 0) return
    setSelectedMeditations([])
  }
  const getMeditationId = (meditation: any) => {
    if (!meditation) return undefined
    return (
      meditation?.meditation_id ??
      meditation?.id ??
      meditation?.meditationId ??
      meditation?.meditation?.id ??
      meditation?.meditation_item_id
    )
  }

  const groupedWorkouts = useMemo(() => {
    if (!Array.isArray(workouts) || workouts.length === 0) return []

    const sorted = workouts.slice().sort((a: any, b: any) => {
      const pa = a?.category?.priority ?? 9999
      const pb = b?.category?.priority ?? 9999
      if (pa === pb) return 0
      return pa < pb ? -1 : 1
    })

    const groups = new Map<
      string,
      {
        main: string
        sub: string
        legend: string
        priority: number
        items: any[]
      }
    >()

    sorted.forEach((w: any) => {
      const key = getWorkoutGroupKey(w)
      if (!groups.has(key)) {
        const labels = getWorkoutGroupLabels(w)
        const p = w?.category?.priority ?? 9999
        groups.set(key, {
          main: labels.main,
          sub: labels.sub,
          legend: labels.legend,
          priority: p,
          items: [],
        })
      }
      groups.get(key)!.items.push(w)
    })

    return Array.from(groups.values()).map((group) => ({
      name: group.sub,
      mainName: group.main,
      legend: group.legend,
      priority: group.priority,
      items: group.items,
    }))
  }, [workouts, getWorkoutGroupKey, getWorkoutGroupLabels])

  const groupedSelectedWorkouts = useMemo(() => {
    if (!Array.isArray(selectedWorkouts) || selectedWorkouts.length === 0)
      return []

    const groups = new Map<
      string,
      {
        main: string
        sub: string
        legend: string
        priority: number
        items: any[]
      }
    >()

    selectedWorkouts.forEach((w: any) => {
      const key = getWorkoutGroupKey(w)
      if (!groups.has(key)) {
        const labels = getWorkoutGroupLabels(w)
        const p = w?.category?.priority ?? 9999
        groups.set(key, {
          main: labels.main,
          sub: labels.sub,
          legend: labels.legend,
          priority: p,
          items: [],
        })
      }
      groups.get(key)!.items.push(w)
    })

    return Array.from(groups.values())
      .map((group) => ({
        name: group.sub,
        mainName: group.main,
        legend: group.legend,
        priority: group.priority,
        items: group.items,
      }))
      .sort((a, b) => a.priority - b.priority)
  }, [selectedWorkouts, getWorkoutGroupKey, getWorkoutGroupLabels])

  const canReorderWorkoutGroups = useMemo(
    () =>
      groupedSelectedWorkouts.some((group) => (group?.items?.length ?? 0) > 1),
    [groupedSelectedWorkouts]
  )

  const workoutsById = useMemo(() => {
    const map = new Map<string, any>()
    if (Array.isArray(allWorkoutsForLookup)) {
      allWorkoutsForLookup.forEach((workout: any) => {
        const id = getWorkoutSelectableId(workout)
        if (id == null) return
        map.set(String(id), workout)
      })
    }
    console.log(
      '[workoutsById] Total workouts in lookup:',
      map.size,
      'from allWorkoutsForLookup:',
      allWorkoutsForLookup?.length
    )
    return map
  }, [allWorkoutsForLookup])

  const canProceedToReview = selectedWorkouts.length > 0
  const medCanProceedToReview = selectedMeditations.length > 0
  const canReorderMeditations = selectedMeditations.length > 1
  const isMeditationSelected = (id: any) =>
    selectedMeditations.some((m) => String(getMeditationId(m)) === String(id))
  const toggleMeditationSelected = (meditation: any) => {
    const medId = getMeditationId(meditation)
    if (medId == null) return
    setSelectedMeditations((prev) => {
      const exists = prev.some(
        (item) => String(getMeditationId(item)) === String(medId)
      )
      if (exists) {
        return prev.filter(
          (item) => String(getMeditationId(item)) !== String(medId)
        )
      }
      const withId =
        String(meditation?.id) === String(medId)
          ? meditation
          : { ...meditation, id: medId }
      return [...prev, withId]
    })
  }

  const buildMonthCells = (monthKey: string) => {
    if (
      !overview?.subscription?.start_date ||
      !overview?.subscription?.end_date
    )
      return { title: '', cells: [] as any[] }
    const start = moment(overview.subscription.start_date, 'YYYY-MM-DD')
    const end = moment(overview.subscription.end_date, 'YYYY-MM-DD')
    const monthStart = moment(monthKey + '-01', 'YYYY-MM-DD')
    const daysMap: Record<string, any> = {}
    if (Array.isArray(overview?.days)) {
      overview.days.forEach((d: any) => {
        daysMap[d?.date] = d
      })
    }
    const cells: any[] = []
    const daysInMonth = monthStart.daysInMonth()
    const firstWeekday = monthStart.day() // 0=Sun
    for (let i = 0; i < firstWeekday; i++) {
      cells.push({
        key: `${monthStart.format('YYYY-MM')}-pad-${i}`,
        inRange: false,
      })
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const date = monthStart.clone().date(d)
      const dateStr = date.format('YYYY-MM-DD')
      const inRange =
        date.isSameOrAfter(start, 'day') && date.isSameOrBefore(end, 'day')
      const meta = daysMap[dateStr]
      cells.push({ key: dateStr, label: d, inRange, meta })
    }
    while (cells.length % 7 !== 0) {
      cells.push({
        key: `${monthStart.format('YYYY-MM')}-trail-${cells.length}`,
        inRange: false,
      })
    }
    return { title: monthStart.format('MMMM YYYY'), cells }
  }

  const toISODate = (val: string) => {
    if (!val) return ''
    // Accept both DD-MM-YYYY and YYYY-MM-DD; return ISO YYYY-MM-DD
    if (moment(val, 'DD-MM-YYYY', true).isValid()) {
      return moment(val, 'DD-MM-YYYY').format('YYYY-MM-DD')
    }
    if (moment(val, 'YYYY-MM-DD', true).isValid()) {
      return val
    }
    return ''
  }

  const resolveUnfreezeDates = () => {
    const candidates = [
      toggleFreezeRow?.freeze_dates,
      overview?.subscription?.freeze_dates,
      toggleFreezeRow?.freeze_date,
      toggleFreezeRow?.freeze_start_date,
      toggleFreezeRow?.freeze_start,
      toggleFreezeRow?.start_date,
      overview?.subscription?.freeze_date,
      overview?.subscription?.freeze_start_date,
      overview?.subscription?.freeze_start,
    ]

    const uniqueDates = new Set<string>()

    const appendDate = (value: any) => {
      if (!value) return
      const values = Array.isArray(value) ? value : [value]
      values.forEach((item) => {
        if (!item) return
        const iso = toISODate(String(item))
        if (iso) uniqueDates.add(iso)
      })
    }

    candidates.forEach(appendDate)

    return Array.from(uniqueDates)
  }

  const monthRange = () => {
    if (
      !overview?.subscription?.start_date ||
      !overview?.subscription?.end_date
    )
      return { min: '', max: '' }
    const min = moment(overview.subscription.start_date, 'YYYY-MM-DD')
      .startOf('month')
      .format('YYYY-MM')
    const max = moment(overview.subscription.end_date, 'YYYY-MM-DD')
      .startOf('month')
      .format('YYYY-MM')
    return { min, max }
  }

  const canPrev = () => {
    const { min } = monthRange()
    return currentMonth && min && currentMonth > min
  }
  const canNext = () => {
    const { max } = monthRange()
    return currentMonth && max && currentMonth < max
  }
  const goPrev = () => {
    if (!canPrev()) return
    setCurrentMonth(
      moment(currentMonth + '-01')
        .subtract(1, 'month')
        .format('YYYY-MM')
    )
  }
  const goNext = () => {
    if (!canNext()) return
    setCurrentMonth(
      moment(currentMonth + '-01')
        .add(1, 'month')
        .format('YYYY-MM')
    )
  }

  const statusColor = (day: any) => {
    if (day?.freeze)
      return 'bg-gradient-to-br from-red-500 to-rose-600 text-white border-red-400 shadow-sm'
    const s = String(day?.status || '').toLowerCase()
    if (s === 'today')
      return 'bg-gradient-to-br from-blue-600 to-primaryBlue text-white border-blue-400 ring-2 ring-blue-300 shadow-md'
    if (s === 'over' || s === 'completed')
      return 'bg-gradient-to-br from-emerald-500 to-green-600 text-white border-emerald-400 shadow-sm'
    return 'bg-gradient-to-br from-amber-400 to-orange-400 text-white border-orange-300 shadow-sm'
  }

  const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  const getDayCellClass = (cell: any) => {
    if (!cell?.inRange)
      return 'text-slate-400 bg-slate-50/80 border-slate-200 cursor-not-allowed shadow-2xs'
    if (cell?.meta?.freeze)
      return 'bg-gradient-to-br from-red-500 to-rose-600 text-white border-red-400 shadow-sm cursor-pointer hover:brightness-105'
    return `${statusColor(cell?.meta)} cursor-pointer hover:brightness-105`
  }

  const decrementWorkoutCount = (workout: any) => {
    const workoutId = getWorkoutSelectableId(workout) ?? workout?.id
    if (workoutId == null) return
    const key = String(workoutId)
    userSelectionTouchedRef.current = true

    if (
      !selectedWorkouts.some(
        (w) =>
          String(getWorkoutSelectableId(w)) === key || String(w?.id) === key
      )
    )
      return

    setWorkoutCounts((prev) => {
      const current = prev[key] ?? 1
      if (current <= 1) return prev
      return {
        ...prev,
        [key]: Math.max(1, current - 1),
      }
    })
  }

  const incrementWorkoutCount = (workout: any) => {
    const workoutId = getWorkoutSelectableId(workout) ?? workout?.id
    if (workoutId == null) return
    const key = String(workoutId)
    userSelectionTouchedRef.current = true

    if (
      !selectedWorkouts.some(
        (w) =>
          String(getWorkoutSelectableId(w)) === key || String(w?.id) === key
      )
    ) {
      setSelectedWorkouts((prev) => [...prev, workout])
      setWorkoutCounts((prev) => ({
        ...prev,
        [key]: 1,
      }))
      return
    }

    setWorkoutCounts((prev) => ({
      ...prev,
      [key]: Math.max(1, (prev[key] ?? 1) + 1),
    }))
  }

  const previouslyAssignedWorkoutIds = useMemo(() => {
    if (!Array.isArray(dayDetail?.workout_plan?.exercises)) return []

    return dayDetail.workout_plan.exercises
      .map((exercise: any) => getWorkoutSelectableId(exercise))
      .filter((id: unknown): id is number | string => id != null)
  }, [dayDetail?.workout_plan?.exercises])

  const workoutPrefillFromApi = useMemo(() => {
    if (previouslyAssignedWorkoutIds.length === 0 || workoutsById.size === 0)
      return null

    type Bucket = {
      categoryId: number | string
      categoryName: string
      subs: Map<string, { id: any; value: string }>
      weight: number
    }

    const buckets = new Map<string, Bucket>()

    previouslyAssignedWorkoutIds.forEach((workoutId: number | string) => {
      const workout = workoutsById.get(String(workoutId))
      if (!workout) return

      const subId =
        workout?.category?.id ??
        workout?.subcategory?.id ??
        workout?.subcategory_id ??
        workout?.category_id

      const subMeta =
        subId != null ? subcategoryParentMap[String(subId)] : undefined

      const isMainCategory = categoryOptions.some(
        (c: any) => String(c.id) === String(subId)
      )
      const mainCatMatch = isMainCategory
        ? categoryOptions.find((c: any) => String(c.id) === String(subId))
        : undefined

      const mainCategoryId =
        workout?.category?.main_category?.id ??
        subMeta?.categoryId ??
        workout?.category?.main_category_id ??
        workout?.category?.parent_id ??
        (isMainCategory ? subId : undefined)

      if (mainCategoryId === undefined || mainCategoryId === null) return

      const bucketKey = String(mainCategoryId)

      if (!buckets.has(bucketKey)) {
        buckets.set(bucketKey, {
          categoryId: mainCategoryId,
          categoryName:
            workout?.category?.main_category?.name ??
            subMeta?.categoryName ??
            workout?.category?.main_category_name ??
            workout?.category?.parent?.name ??
            mainCatMatch?.name ??
            '',
          subs: new Map(),
          weight: 0,
        })
      }

      const bucket = buckets.get(bucketKey)!
      bucket.weight += 1

      if (
        subId !== undefined &&
        subId !== null &&
        subId !== '' &&
        !isMainCategory &&
        !bucket.subs.has(String(subId))
      ) {
        const fallbackLabel =
          subMeta?.label ??
          workout?.category?.name ??
          workout?.subcategory?.name ??
          workout?.subcategory_name ??
          ''

        bucket.subs.set(String(subId), {
          id: subId,
          value: fallbackLabel || `Subcategory ${subId}`,
        })
      }
    })

    if (!buckets.size) return null

    const allBuckets = Array.from(buckets.values())
    const categoryIds = Array.from(
      new Set(
        allBuckets
          .map((b) => b.categoryId)
          .filter((id): id is number | string => id != null && id !== '')
      )
    )
    const categoryNames = allBuckets.map((b) => b.categoryName).filter(Boolean)

    const subMap = new Map<string, { id: any; value: string }>()
    allBuckets.forEach((b) => {
      b.subs.forEach((sub, subKey) => {
        if (!subMap.has(subKey)) {
          subMap.set(subKey, sub)
        }
      })
    })

    return {
      categoryIds,
      categoryId: categoryIds[0],
      categoryName: categoryNames.join(', '),
      subcategories: Array.from(subMap.values()),
    }
  }, [previouslyAssignedWorkoutIds, workoutsById, subcategoryParentMap])

  type PrefillSelection = {
    categoryIds?: (number | string)[]
    categoryId?: number | string
    categoryName?: string
    subcategories: { id: any; value: string }[]
  }

  const previouslySubmittedSelection = useMemo(() => {
    const exercises = dayDetail?.workout_plan?.exercises
    if (!Array.isArray(exercises) || exercises.length === 0) return null

    const buckets: Record<
      string,
      {
        categoryId: number | string | undefined
        categoryName: string
        subs: Map<string, { id: any; value: string }>
      }
    > = {}

    const getSubcategoryIdFromExercise = (exercise: any) => {
      const candidates = [
        exercise?.subcategory_id,
        exercise?.category?.id,
        exercise?.category_id,
        exercise?.workout?.subcategory_id,
        exercise?.workout?.subcategory?.id,
        exercise?.workout?.category?.id,
        exercise?.workout?.category_id,
      ]

      return candidates.find(
        (candidate) =>
          candidate !== undefined && candidate !== null && candidate !== ''
      )
    }

    const getCategoryInfoFromExercise = (exercise: any) => {
      const sources = [
        exercise?.category?.main_category,
        exercise?.workout?.category?.main_category,
        exercise?.category?.parent,
        exercise?.workout?.category?.parent,
      ].filter(Boolean)

      const primary = sources[0] as any

      const idCandidates = [
        primary?.id,
        exercise?.category?.main_category_id,
        exercise?.workout?.category?.main_category_id,
        exercise?.category?.parent_id,
        exercise?.workout?.category?.parent_id,
        exercise?.workout?.main_category_id,
      ]

      // If the category object explicitly has no main_category/parent, it must be the main category itself
      if (
        exercise?.category &&
        (exercise?.category?.main_category_id === null ||
          exercise?.category?.parent_id === null)
      ) {
        idCandidates.push(exercise?.category?.id)
      } else if (
        exercise?.workout?.category &&
        (exercise?.workout?.category?.main_category_id === null ||
          exercise?.workout?.category?.parent_id === null)
      ) {
        idCandidates.push(exercise?.workout?.category?.id)
      }

      const categoryId = idCandidates.find(
        (candidate) =>
          candidate !== undefined && candidate !== null && candidate !== ''
      )

      const categoryName =
        primary?.name ??
        exercise?.category?.main_category?.name ??
        exercise?.category?.main_category_name ??
        exercise?.workout?.category?.main_category?.name ??
        exercise?.workout?.category?.parent?.name ??
        ''

      return {
        categoryId,
        categoryName,
      }
    }

    const getSubcategoryLabelFromExercise = (exercise: any) =>
      exercise?.category?.name ??
      exercise?.workout?.subcategory?.name ??
      exercise?.workout?.category?.name ??
      exercise?.workout?.subcategory_name ??
      exercise?.category_name ??
      ''

    exercises.forEach((exercise: any) => {
      const subId = getSubcategoryIdFromExercise(exercise)

      const mapMeta =
        subId != null ? subcategoryParentMap[String(subId)] : undefined

      const isMainCategory = categoryOptions.some(
        (c: any) => String(c.id) === String(subId)
      )
      const mainCatMatch = isMainCategory
        ? categoryOptions.find((c: any) => String(c.id) === String(subId))
        : undefined

      const catInfo = mapMeta?.categoryId
        ? {
            categoryId: mapMeta.categoryId,
            categoryName: mapMeta.categoryName,
          }
        : mainCatMatch
          ? {
              categoryId: mainCatMatch.id,
              categoryName: mainCatMatch.name,
            }
          : getCategoryInfoFromExercise(exercise)

      if (
        catInfo.categoryId === undefined ||
        catInfo.categoryId === null ||
        catInfo.categoryId === ''
      )
        return

      const bucketKey = String(catInfo.categoryId)
      if (!buckets[bucketKey]) {
        buckets[bucketKey] = {
          categoryId: catInfo.categoryId,
          categoryName: catInfo.categoryName || '',
          subs: new Map(),
        }
      }

      if (
        subId !== undefined &&
        subId !== null &&
        subId !== '' &&
        !isMainCategory
      ) {
        const label =
          getSubcategoryLabelFromExercise(exercise) || mapMeta?.label || ''

        buckets[bucketKey].subs.set(String(subId), {
          id: subId,
          value: label || mapMeta?.label || '',
        })
      }
    })

    const bucketList = Object.values(buckets)
    if (!bucketList.length) return null

    const categoryIds = Array.from(
      new Set(
        bucketList
          .map((b) => b.categoryId)
          .filter((id): id is number | string => id != null && id !== '')
      )
    )
    const categoryNames = bucketList.map((b) => b.categoryName).filter(Boolean)

    const subMap = new Map<string, { id: any; value: string }>()
    bucketList.forEach((b) => {
      b.subs.forEach((sub, subKey) => {
        if (!subMap.has(subKey)) {
          subMap.set(subKey, sub)
        }
      })
    })

    if (!categoryIds.length) return null

    return {
      categoryIds,
      categoryId: categoryIds[0],
      categoryName: categoryNames.join(', '),
      subcategories: Array.from(subMap.values()),
    }
  }, [dayDetail?.workout_plan?.exercises, subcategoryParentMap])

  const previouslySubmittedYogaSelection = useMemo(() => {
    const exercises =
      Array.isArray(dayDetail?.yoga_plan?.exercises) &&
      dayDetail.yoga_plan.exercises.length > 0
        ? dayDetail.yoga_plan.exercises
        : Array.isArray(selectedYogas) && selectedYogas.length > 0
          ? selectedYogas
          : []

    if (exercises.length === 0) return null

    const buckets: Record<
      string,
      {
        categoryId: number | string | undefined
        categoryName: string
        subs: Map<string, { id: any; value: string }>
      }
    > = {}

    const getSubcategoryIdFromExercise = (exercise: any) => {
      const candidates = [
        exercise?.subcategory_id,
        exercise?.yoga?.subcategory_id,
        exercise?.subcategory?.id,
        exercise?.yoga?.subcategory?.id,
        Array.isArray(exercise?.subcategory_ids)
          ? exercise.subcategory_ids[0]
          : undefined,
        Array.isArray(exercise?.yoga?.subcategory_ids)
          ? exercise.yoga.subcategory_ids[0]
          : undefined,
        Array.isArray(exercise?.subcategories)
          ? exercise.subcategories[0]?.id
          : undefined,
        Array.isArray(exercise?.yoga?.subcategories)
          ? exercise.yoga.subcategories[0]?.id
          : undefined,
        exercise?.category?.parent_id ? exercise?.category?.id : undefined,
        exercise?.yoga?.category?.parent_id
          ? exercise?.yoga?.category?.id
          : undefined,
      ]

      return candidates.find(
        (candidate) =>
          candidate !== undefined && candidate !== null && candidate !== ''
      )
    }

    const getCategoryInfoFromExercise = (exercise: any) => {
      const sources = [
        exercise?.category?.main_category,
        exercise?.yoga?.category?.main_category,
        exercise?.category?.parent,
        exercise?.yoga?.category?.parent,
        exercise?.subcategory?.category,
        exercise?.yoga?.subcategory?.category,
        exercise?.subcategory?.parent,
        exercise?.yoga?.subcategory?.parent,
      ].filter(Boolean)

      const primary = sources[0] as any

      const idCandidates = [
        primary?.id,
        exercise?.category?.main_category_id,
        exercise?.yoga?.category?.main_category_id,
        exercise?.category?.parent_id,
        exercise?.yoga?.category?.parent_id,
        exercise?.yoga?.main_category_id,
        exercise?.main_category_id,
        exercise?.category_id,
        exercise?.yoga?.category_id,
        exercise?.category?.parent_id
          ? exercise?.category?.parent_id
          : exercise?.category?.id,
        exercise?.yoga?.category?.parent_id
          ? exercise?.yoga?.category?.parent_id
          : exercise?.yoga?.category?.id,
      ]

      const categoryId = idCandidates.find(
        (candidate) =>
          candidate !== undefined && candidate !== null && candidate !== ''
      )

      const categoryName =
        primary?.name ??
        exercise?.category?.main_category?.name ??
        exercise?.category?.main_category_name ??
        exercise?.yoga?.category?.main_category?.name ??
        exercise?.yoga?.category?.parent?.name ??
        exercise?.category?.name ??
        exercise?.yoga?.category?.name ??
        ''

      return {
        categoryId,
        categoryName,
      }
    }

    const getSubcategoryLabelFromExercise = (exercise: any) =>
      exercise?.subcategory?.name ??
      exercise?.yoga?.subcategory?.name ??
      exercise?.yoga?.subcategory_name ??
      exercise?.subcategory_name ??
      exercise?.category?.name ??
      exercise?.yoga?.category?.name ??
      ''

    exercises.forEach((exercise: any) => {
      const subId = getSubcategoryIdFromExercise(exercise)
      if (subId === undefined) return

      const mapMeta = yogaSubcategoryParentMap[String(subId)]
      const catInfo = mapMeta?.categoryId
        ? {
            categoryId: mapMeta.categoryId,
            categoryName: mapMeta.categoryName,
          }
        : getCategoryInfoFromExercise(exercise)

      if (
        catInfo.categoryId === undefined ||
        catInfo.categoryId === null ||
        catInfo.categoryId === ''
      )
        return

      const bucketKey = String(catInfo.categoryId)
      if (!buckets[bucketKey]) {
        buckets[bucketKey] = {
          categoryId: catInfo.categoryId,
          categoryName: catInfo.categoryName || '',
          subs: new Map(),
        }
      }

      const label =
        mapMeta?.label || getSubcategoryLabelFromExercise(exercise) || ''

      buckets[bucketKey].subs.set(String(subId), {
        id: subId,
        value: label,
      })
    })

    const bucketList = Object.values(buckets)
    if (!bucketList.length) return null

    const categoryIds = Array.from(
      new Set(
        bucketList
          .map((b) => b.categoryId)
          .filter((id): id is number | string => id != null && id !== '')
      )
    )
    const categoryNames = bucketList.map((b) => b.categoryName).filter(Boolean)

    const subMap = new Map<string, { id: any; value: string }>()
    bucketList.forEach((b) => {
      b.subs.forEach((sub, subKey) => {
        if (!subMap.has(subKey)) {
          subMap.set(subKey, sub)
        }
      })
    })

    if (!categoryIds.length) return null

    return {
      categoryIds,
      categoryId: categoryIds[0],
      categoryName: categoryNames.join(', '),
      subcategories: Array.from(subMap.values()),
    }
  }, [dayDetail?.yoga_plan?.exercises, selectedYogas, yogaSubcategoryParentMap])

  const yogaPrefillAppliedRef = useRef(false)

  useEffect(() => {
    setSelectedYogaCategoryIds([])
    setSelectedYogaSubcategories([])
    yogaPrefillAppliedRef.current = false
  }, [dayDetail?.yoga_plan?.id])

  const previouslyAssignedYogaIds = useMemo(() => {
    const exercises = dayDetail?.yoga_plan?.exercises
    if (!Array.isArray(exercises) || exercises.length === 0) return []
    return exercises
      .map((ex: any) => getYogaId(ex))
      .filter((id: unknown): id is number | string => id != null)
  }, [dayDetail?.yoga_plan?.exercises])

  const yogasById = useMemo(() => {
    const map = new Map<string, any>()
    const list = Array.isArray(yogas) ? yogas : []
    list.forEach((y: any) => {
      const id = getYogaId(y)
      if (id != null) map.set(String(id), y)
    })
    const dayExercises = Array.isArray(dayDetail?.yoga_plan?.exercises)
      ? dayDetail.yoga_plan.exercises
      : []
    dayExercises.forEach((ex: any) => {
      const id = getYogaId(ex)
      if (id != null && !map.has(String(id))) {
        if (ex.yoga) map.set(String(id), ex.yoga)
        else map.set(String(id), ex)
      }
    })
    return map
  }, [yogas, dayDetail?.yoga_plan?.exercises])

  const yogaPrefillFromApi = useMemo(() => {
    const yogaIds =
      previouslyAssignedYogaIds.length > 0
        ? previouslyAssignedYogaIds
        : selectedYogas.map((y) => getYogaId(y)).filter(Boolean)

    if (yogaIds.length === 0 || yogasById.size === 0) return null

    type Bucket = {
      categoryId: number | string
      categoryName: string
      subs: Map<string, { id: any; value: string }>
      weight: number
    }

    const buckets = new Map<string, Bucket>()

    yogaIds.forEach((yogaId: number | string) => {
      const yoga = yogasById.get(String(yogaId))
      if (!yoga) return

      const subId =
        yoga?.subcategory_id ??
        yoga?.subcategory?.id ??
        yoga?.category?.id ??
        yoga?.category_id

      const subMeta =
        subId != null ? yogaSubcategoryParentMap[String(subId)] : undefined

      const mainCategoryId =
        yoga?.category?.main_category?.id ??
        subMeta?.categoryId ??
        yoga?.category?.main_category_id ??
        yoga?.category?.parent_id ??
        (yoga?.category?.parent_id
          ? yoga?.category?.parent_id
          : yoga?.category?.id)

      if (mainCategoryId === undefined || mainCategoryId === null) return

      const bucketKey = String(mainCategoryId)

      if (!buckets.has(bucketKey)) {
        buckets.set(bucketKey, {
          categoryId: mainCategoryId,
          categoryName:
            yoga?.category?.main_category?.name ??
            subMeta?.categoryName ??
            yoga?.category?.main_category_name ??
            yoga?.category?.parent?.name ??
            yoga?.category?.name ??
            '',
          subs: new Map(),
          weight: 0,
        })
      }

      const bucket = buckets.get(bucketKey)!
      bucket.weight += 1

      if (subId != null) {
        const subName =
          subMeta?.label ||
          yoga?.subcategory?.name ||
          yoga?.subcategory_name ||
          yoga?.category?.name ||
          ''
        bucket.subs.set(String(subId), {
          id: subId,
          value: subName,
        })
      }
    })

    if (!buckets.size) return null

    const allBuckets = Array.from(buckets.values())
    const categoryIds = Array.from(
      new Set(
        allBuckets
          .map((b) => b.categoryId)
          .filter((id): id is number | string => id != null && id !== '')
      )
    )
    const categoryNames = allBuckets.map((b) => b.categoryName).filter(Boolean)

    const subMap = new Map<string, { id: any; value: string }>()
    allBuckets.forEach((b) => {
      b.subs.forEach((sub, subKey) => {
        if (!subMap.has(subKey)) {
          subMap.set(subKey, sub)
        }
      })
    })

    return {
      categoryIds,
      categoryId: categoryIds[0],
      categoryName: categoryNames.join(', '),
      subcategories: Array.from(subMap.values()),
    }
  }, [
    previouslyAssignedYogaIds,
    selectedYogas,
    yogasById,
    yogaSubcategoryParentMap,
  ])

  const yogaSelectionCandidate: PrefillSelection | null = useMemo(() => {
    if (yogaPrefillFromApi) return yogaPrefillFromApi
    if (!previouslySubmittedYogaSelection) return null
    const fallbackSubs = Array.isArray(
      previouslySubmittedYogaSelection.subcategories
    )
      ? previouslySubmittedYogaSelection.subcategories
      : []

    return {
      categoryIds:
        previouslySubmittedYogaSelection.categoryIds ||
        (previouslySubmittedYogaSelection.categoryId != null
          ? [previouslySubmittedYogaSelection.categoryId]
          : []),
      categoryId: previouslySubmittedYogaSelection.categoryId,
      categoryName: previouslySubmittedYogaSelection.categoryName,
      subcategories: fallbackSubs,
    }
  }, [yogaPrefillFromApi, previouslySubmittedYogaSelection])

  const yogaSelectionSignature = useMemo(() => {
    if (!yogaSelectionCandidate) return ''
    const catKeys = (
      yogaSelectionCandidate.categoryIds ||
      (yogaSelectionCandidate.categoryId != null
        ? [yogaSelectionCandidate.categoryId]
        : [])
    )
      .map((id) => (id == null ? '' : String(id)))
      .filter(Boolean)
      .sort()
      .join(',')

    const subIds = Array.isArray(yogaSelectionCandidate.subcategories)
      ? yogaSelectionCandidate.subcategories
          .map((sub) =>
            sub?.id === undefined || sub?.id === null ? '' : String(sub.id)
          )
          .filter(Boolean)
          .sort()
          .join('|')
      : ''

    return `${catKeys}::${subIds}`
  }, [yogaSelectionCandidate])

  const lastYogaPrefillSignatureRef = useRef<string>('')

  useEffect(() => {
    if (!yogaAssignOpen) return
    if (!yogaSelectionCandidate) return

    if (
      yogaPrefillAppliedRef.current &&
      lastYogaPrefillSignatureRef.current === yogaSelectionSignature
    ) {
      return
    }

    const categoryIds =
      Array.isArray(yogaSelectionCandidate.categoryIds) &&
      yogaSelectionCandidate.categoryIds.length > 0
        ? yogaSelectionCandidate.categoryIds
        : yogaSelectionCandidate.categoryId != null
          ? [yogaSelectionCandidate.categoryId]
          : []

    const subcategories = yogaSelectionCandidate.subcategories || []

    const applySubcategoriesIfChanged = () => {
      if (!Array.isArray(subcategories) || subcategories.length === 0) return

      setSelectedYogaSubcategories((prev) => {
        const prevKey = prev
          .map((item: any) => String(item?.id ?? ''))
          .filter(Boolean)
          .sort()
          .join('|')
        const nextKey = subcategories
          .map((item: any) => String(item?.id ?? ''))
          .filter(Boolean)
          .sort()
          .join('|')

        if (prevKey === nextKey) {
          return prev
        }

        updateYogaSubcategoryLookup(subcategories)
        return subcategories
      })
    }

    if (categoryIds.length > 0) {
      setSelectedYogaCategoryIds((prev) => {
        const prevKey = prev.map(String).sort().join('|')
        const nextKey = categoryIds.map(String).sort().join('|')
        if (prevKey === nextKey) return prev
        return categoryIds
      })

      applySubcategoriesIfChanged()
    }

    lastYogaPrefillSignatureRef.current = yogaSelectionSignature
    yogaPrefillAppliedRef.current = true
  }, [
    yogaAssignOpen,
    yogaSelectionCandidate,
    yogaSelectionSignature,
    updateYogaSubcategoryLookup,
  ])

  useEffect(() => {
    if (yogaAssignOpen) return
    if (yogaReviewOpen) return
    yogaPrefillAppliedRef.current = false
    lastYogaPrefillSignatureRef.current = ''
    setSelectedYogaCategoryIds([])
    setSelectedYogaSubcategories([])
    setYogaCategoryFilter('')
  }, [yogaAssignOpen, yogaReviewOpen])

  const selectionCandidate: PrefillSelection | null = useMemo(() => {
    if (workoutPrefillFromApi) return workoutPrefillFromApi
    if (!previouslySubmittedSelection) return null
    const fallbackSubs = Array.isArray(
      previouslySubmittedSelection.subcategories
    )
      ? previouslySubmittedSelection.subcategories
      : []

    return {
      categoryIds:
        previouslySubmittedSelection.categoryIds ||
        (previouslySubmittedSelection.categoryId != null
          ? [previouslySubmittedSelection.categoryId]
          : []),
      categoryId: previouslySubmittedSelection.categoryId,
      categoryName: previouslySubmittedSelection.categoryName,
      subcategories: fallbackSubs,
    }
  }, [workoutPrefillFromApi, previouslySubmittedSelection])

  const selectionSignature = useMemo(() => {
    if (!selectionCandidate) return ''
    const catKeys = (
      selectionCandidate.categoryIds ||
      (selectionCandidate.categoryId != null
        ? [selectionCandidate.categoryId]
        : [])
    )
      .map((id) => (id == null ? '' : String(id)))
      .filter(Boolean)
      .sort()
      .join(',')

    const subIds = Array.isArray(selectionCandidate.subcategories)
      ? selectionCandidate.subcategories
          .map((sub) =>
            sub?.id === undefined || sub?.id === null ? '' : String(sub.id)
          )
          .filter(Boolean)
          .sort()
          .join('|')
      : ''

    return `${catKeys}::${subIds}`
  }, [selectionCandidate])

  useEffect(() => {
    setSelectedCategoryId(undefined)
    setSelectedCategoryIds([])
    setSelectedCategoryName('')
    setSelectedSubcategories([])
    subcategoryLookupRef.current = {}
    prefillAppliedRef.current = false
    lastPrefillSignatureRef.current = ''
  }, [dayDetail?.workout_plan?.id])

  useEffect(() => {
    if (!assignOpen) return
    if (prefillAppliedRef.current) return
    if (!selectionCandidate) return

    if (
      prefillAppliedRef.current &&
      lastPrefillSignatureRef.current === selectionSignature
    ) {
      return
    }

    const categoryIds =
      Array.isArray(selectionCandidate.categoryIds) &&
      selectionCandidate.categoryIds.length > 0
        ? selectionCandidate.categoryIds
        : selectionCandidate.categoryId != null
          ? [selectionCandidate.categoryId]
          : []

    const categoryName = selectionCandidate.categoryName
    const subcategories = selectionCandidate.subcategories || []

    const resolvedCategoryName =
      categoryName && categoryName.length > 0
        ? categoryName
        : (categoryOptions.find(
            (cat: any) => String(cat?.id ?? '') === String(categoryIds[0] ?? '')
          )?.name ?? '')

    const applySubcategoriesIfChanged = () => {
      if (!Array.isArray(subcategories) || subcategories.length === 0) return

      setSelectedSubcategories((prev) => {
        const prevKey = prev
          .map((item: any) => String(item?.id ?? ''))
          .filter(Boolean)
          .sort()
          .join('|')
        const nextKey = subcategories
          .map((item: any) => String(item?.id ?? ''))
          .filter(Boolean)
          .sort()
          .join('|')

        if (prevKey === nextKey) {
          return prev
        }

        updateSubcategoryLookup(subcategories)
        return subcategories
      })
    }

    if (categoryIds.length > 0) {
      setSelectedCategoryId((prev) => {
        if (String(prev ?? '') === String(categoryIds[0] ?? '')) {
          return prev
        }
        return categoryIds[0]
      })

      setSelectedCategoryIds((prev) => {
        const prevKey = prev.map(String).sort().join('|')
        const nextKey = categoryIds.map(String).sort().join('|')
        if (prevKey === nextKey) return prev
        return categoryIds
      })

      setSelectedCategoryName((prev) => {
        if (prev === resolvedCategoryName) return prev
        return resolvedCategoryName
      })

      applySubcategoriesIfChanged()
    }

    lastPrefillSignatureRef.current = selectionSignature
    prefillAppliedRef.current = true
  }, [assignOpen, selectionCandidate, selectionSignature])

  useEffect(() => {
    if (assignOpen) return
    if (reviewOpen) return
    prefillAppliedRef.current = false
    lastPrefillSignatureRef.current = ''
    setSelectedCategoryId(undefined)
    setSelectedCategoryIds([])
    setSelectedCategoryName('')
    setSelectedSubcategories([])
    pendingPrefillCategoryRef.current = ''
    pendingPrefillSubcategoriesRef.current = null
    drawerSelectionInitializedRef.current = false
    userSelectionTouchedRef.current = false
  }, [assignOpen, reviewOpen])

  useEffect(() => {
    if (!assignOpen) return
    if (workoutsLoading) return
    if (!Array.isArray(workouts) || workouts.length === 0) return
    const pendingCategoryKey = pendingPrefillCategoryRef.current
    const pendingSubcategories = pendingPrefillSubcategoriesRef.current
    if (!pendingCategoryKey || !pendingSubcategories?.length) return
    if (String(selectedCategoryId ?? '') !== pendingCategoryKey) return
    if (selectedSubcategories?.length) {
      pendingPrefillCategoryRef.current = ''
      pendingPrefillSubcategoriesRef.current = null
      return
    }

    updateSubcategoryLookup(pendingSubcategories)
    setSelectedSubcategories(pendingSubcategories)
    pendingPrefillCategoryRef.current = ''
    pendingPrefillSubcategoriesRef.current = null
  }, [
    assignOpen,
    workoutsLoading,
    workouts,
    selectedCategoryId,
    selectedSubcategories,
    updateSubcategoryLookup,
  ])

  useEffect(() => {
    if (!assignOpen) return
    if (!selectedCategoryId) return
    if (selectedCategoryName && selectedCategoryName.length > 0) return
    if (!Array.isArray(categoryOptions) || categoryOptions.length === 0) return

    const match = categoryOptions.find(
      (cat: any) => String(cat?.id) === String(selectedCategoryId)
    )
    if (match?.name) {
      setSelectedCategoryName(match.name)
    }
  }, [assignOpen, selectedCategoryId, selectedCategoryName, categoryOptions])

  useEffect(() => {
    if (!assignOpen) {
      selectAllNextWorkoutsRef.current = false
    }
  }, [assignOpen])

  useEffect(() => {
    if (!yogaAssignOpen) {
      selectAllNextYogasRef.current = false
      return
    }
    if (yogasLoading) return
    if (!selectAllNextYogasRef.current) return
    if (!Array.isArray(yogas) || yogas.length === 0) {
      setSelectedYogas([])
      selectAllNextYogasRef.current = false
      return
    }

    setSelectedYogas(collectAllVisibleYogas(yogas))
    selectAllNextYogasRef.current = false
  }, [yogaAssignOpen, yogasLoading, yogas, collectAllVisibleYogas])

  const getDefaultDayDetailTab = (): DayDetailTab => {
    if (canAccessDiet) return 'diet'
    if (canAccessWorkout) return 'workout'
    if (canAccessYoga) return 'yoga'
    if (canAccessMeditation) return 'meditation'
    return 'diet'
  }

  const openDayDetail = async (dateStr: string, focusTab?: DayDetailTab) => {
    if (!user?.id || !dateStr) return
    let targetTab = focusTab || getDefaultDayDetailTab()
    if (targetTab === 'diet' && !canAccessDiet)
      targetTab = getDefaultDayDetailTab()
    if (targetTab === 'workout' && !canAccessWorkout)
      targetTab = getDefaultDayDetailTab()
    if (targetTab === 'yoga' && !canAccessYoga)
      targetTab = getDefaultDayDetailTab()
    if (targetTab === 'meditation' && !canAccessMeditation)
      targetTab = getDefaultDayDetailTab()

    try {
      setSelectedDate(dateStr)
      setDayDetail(null)
      setDayDetailOpen(true)
      setDayDetailTab(targetTab)
      setDayDetailLoading(true)
      const subId =
        selectedSubscriptionId || selectedCycle?.subscription_id || undefined
      const res = await getOverviewDetail(String(user.id), dateStr, subId)
      setDayDetail(res)
    } catch {
      setDayDetail(null)
    } finally {
      setDayDetailLoading(false)
    }
  }

  const getActiveDayDate = () => dayDetail?.date || selectedDate

  const canNavigateDayDetail = (direction: 'previous' | 'next') => {
    const activeDate = getActiveDayDate()
    const startDate = overview?.subscription?.start_date
    const endDate = overview?.subscription?.end_date
    if (!activeDate || !startDate || !endDate || dayDetailLoading) return false

    const current = moment(activeDate, 'YYYY-MM-DD', true)
    const boundary = moment(
      direction === 'previous' ? startDate : endDate,
      'YYYY-MM-DD',
      true
    )
    if (!current.isValid() || !boundary.isValid()) return false

    return direction === 'previous'
      ? current.isAfter(boundary, 'day')
      : current.isBefore(boundary, 'day')
  }

  const navigateDayDetail = (direction: 'previous' | 'next') => {
    if (!canNavigateDayDetail(direction)) return
    const activeDate = getActiveDayDate()
    const nextDate = moment(activeDate, 'YYYY-MM-DD')
      .add(direction === 'previous' ? -1 : 1, 'day')
      .format('YYYY-MM-DD')

    setAssignOpen(false)
    setReviewOpen(false)
    setYogaAssignOpen(false)
    setYogaReviewOpen(false)
    setMedAssignOpen(false)
    setMedReviewOpen(false)
    setCurrentMonth(moment(nextDate, 'YYYY-MM-DD').format('YYYY-MM'))
    openDayDetail(nextDate, dayDetailTab)
  }

  const dayDetailNavigatorLabel = dayDetail
    ? `Plan Day ${safeStr(dayDetail?.day_number)} - ${moment(dayDetail?.date).format('MMM D, YYYY')}`
    : selectedDate
      ? `Day Details - ${moment(selectedDate).format('MMM D, YYYY')}`
      : 'Day Details'

  useEffect(() => {
    if (!assignOpen) return
    if (drawerSelectionInitializedRef.current) return
    if (allWorkoutsLoading) {
      console.log('[Init] Waiting for all workouts to load...')
      return
    }

    setDragIndex(null)
    setDragGroup(null)
    setReviewOpen(false)

    const map = new Map<any, any>()

    if (Array.isArray(dayDetail?.workout_plan?.exercises)) {
      console.log(
        '[Init] Starting to process',
        dayDetail.workout_plan.exercises.length,
        'exercises'
      )
      console.log('[Init] workoutsById has', workoutsById.size, 'workouts')

      dayDetail.workout_plan.exercises.forEach((ex: any) => {
        const workoutId = ex?.workout_id || ex?.workout?.id || ex?.id
        if (!workoutId || map.has(workoutId)) return
        const canonical = workoutsById.get(String(workoutId))
        console.log(
          '[Init] Workout ID:',
          workoutId,
          'Found canonical:',
          !!canonical,
          canonical ? `(${canonical.name})` : ''
        )
        const repsValue = Number(ex?.reps ?? ex?.workout?.reps)

        const categoryRaw =
          canonical?.category ?? ex?.workout?.category ?? ex?.category
        const subcategoryRaw =
          canonical?.subcategory ?? ex?.workout?.subcategory ?? ex?.subcategory

        const categoryName =
          canonical?.category_name ??
          canonical?.category?.name ??
          ex?.workout?.category_name ??
          ex?.category_name ??
          ex?.category?.name ??
          (typeof ex?.category === 'string' ? ex.category : null)

        const subcategoryName =
          canonical?.subcategory_name ??
          canonical?.subcategory?.name ??
          ex?.workout?.subcategory_name ??
          ex?.subcategory_name ??
          ex?.subcategory?.name ??
          (typeof ex?.subcategory === 'string' ? ex.subcategory : null)

        let category = categoryRaw
        let subcategory = subcategoryRaw

        if (categoryRaw && typeof categoryRaw === 'object') {
          category = { ...categoryRaw }
          if (categoryName) {
            category.name = categoryName
          }
        } else if (categoryName) {
          category = { name: categoryName }
        }

        if (subcategoryRaw && typeof subcategoryRaw === 'object') {
          subcategory = { ...subcategoryRaw }
          if (subcategoryName) {
            subcategory.name = subcategoryName
          }
        } else if (subcategoryName) {
          subcategory = { name: subcategoryName }
        }

        const workoutData: any = {
          ...(canonical ?? {}),
          id: workoutId,
          name:
            canonical?.name ||
            ex?.workout_name ||
            ex?.workout?.name ||
            ex?.name ||
            ex?.title ||
            'Workout',
          video_url:
            canonical?.video_url ||
            ex?.video_url ||
            ex?.workout_video_url ||
            ex?.workout?.video_url ||
            '',
          reps: Number.isFinite(repsValue) && repsValue > 0 ? repsValue : 1,
        }

        if (category) {
          workoutData.category = category
        }
        if (subcategory) {
          workoutData.subcategory = subcategory
        }
        if (categoryName) {
          workoutData.category_name = categoryName
        }
        if (subcategoryName) {
          workoutData.subcategory_name = subcategoryName
        }

        map.set(workoutId, workoutData)
      })
    }

    const prefilledWorkouts = Array.from(map.values())
    setSelectedWorkouts(prefilledWorkouts)

    drawerSelectionInitializedRef.current = true
  }, [
    assignOpen,
    dayDetail?.workout_plan?.exercises,
    workoutsById,
    allWorkoutsLoading,
  ])

  useEffect(() => {
    if (!Array.isArray(selectedWorkouts) || selectedWorkouts.length === 0) {
      if (Object.keys(workoutCounts).length === 0) return
      setWorkoutCounts({})
      return
    }

    setWorkoutCounts((prev) => {
      const next: Record<string, number> = {}
      selectedWorkouts.forEach((w: any) => {
        const id = getWorkoutSelectableId(w)
        if (id == null) return
        const key = String(id)
        const fallbackReps = (() => {
          const direct = Number(w?.reps)
          if (Number.isFinite(direct) && direct > 0) return direct
          return null
        })()
        next[key] = Math.max(1, prev[key] ?? fallbackReps ?? 1)
      })
      return next
    })
  }, [selectedWorkouts])

  useEffect(() => {
    if (!yogaAssignOpen) return
    if (yogaSelectionPrefilledRef.current) return
    setYogaDragIndex(null)
    setYogaReviewOpen(false)

    const map = new Map<any, any>()
    if (Array.isArray(dayDetail?.yoga_plan?.exercises)) {
      dayDetail.yoga_plan.exercises.forEach((ex: any, idx: number) => {
        const normalized = toYogaSelectable(ex, idx)
        if (!normalized?.id || map.has(normalized.id)) return
        map.set(normalized.id, normalized)
      })
    }
    setSelectedYogas(Array.from(map.values()))
    yogaSelectionPrefilledRef.current = true
  }, [dayDetail?.yoga_plan?.exercises, yogaAssignOpen])

  useEffect(() => {
    yogaSelectionPrefilledRef.current = false
  }, [dayDetail?.yoga_plan?.id])

  useEffect(() => {
    if (!medAssignOpen) return
    if (medSelectionPrefilledRef.current) return
    setMedDragIndex(null)
    setMedReviewOpen(false)

    const map = new Map<any, any>()
    if (Array.isArray(dayDetail?.meditations)) {
      dayDetail.meditations.forEach((med: any, idx: number) => {
        const medId = getMeditationId(med)
        if (!medId || map.has(medId)) return
        map.set(medId, {
          ...med,
          id: medId,
          sequence_number: med?.sequence_number ?? idx + 1,
        })
      })
    }
    setSelectedMeditations(Array.from(map.values()))
    medSelectionPrefilledRef.current = true
  }, [dayDetail?.meditations, medAssignOpen])

  useEffect(() => {
    medSelectionPrefilledRef.current = false
  }, [dayDetail?.meditations, dayDetail?.plan_id])

  useEffect(() => {
    if (!dayDetailOpen) {
      setAssignOpen(false)
      setReviewOpen(false)
      setSelectedWorkouts([])
      setDragIndex(null)
      setWorkoutCounts({})
      setYogaAssignOpen(false)
      setYogaReviewOpen(false)
      setSelectedYogas([])
      yogaSelectionPrefilledRef.current = false
      setYogaDragIndex(null)
      setYogaCategoryFilter('')
      setMedAssignOpen(false)
      setMedReviewOpen(false)
      setSelectedMeditations([])
      medSelectionPrefilledRef.current = false
      setMedDragIndex(null)
    }
  }, [dayDetailOpen])

  const refreshDayDetail = async () => {
    if (user?.id && selectedDate) {
      try {
        const subId =
          selectedSubscriptionId || selectedCycle?.subscription_id || undefined
        const [refreshed] = await Promise.all([
          getOverviewDetail(String(user.id), selectedDate, subId),
          fetchOverview(),
        ])
        setDayDetail(refreshed)
      } catch (err) {
        console.error(err)
      }
    }
  }

  const handleNext = () => {
    if (!canProceedToReview) return
    setSelectedWorkouts((prev) => {
      const next = prev.slice()
      next.sort((a: any, b: any) => {
        const pa = a?.category?.priority ?? 9999
        const pb = b?.category?.priority ?? 9999
        if (pa === pb) return 0
        return pa < pb ? -1 : 1
      })
      return next
    })

    setReviewOpen(true)
    setAssignOpen(false)
  }

  const handleMedNext = () => {
    if (!medCanProceedToReview) return
    setMedReviewOpen(true)
    setMedAssignOpen(false)
  }

  const handleYogaNext = () => {
    if (!yogaCanProceedToReview) return
    setYogaReviewOpen(true)
    setYogaAssignOpen(false)
  }

  const normalizeExercisePayload = (items: any[]) => {
    let sequence = 0
    return items.reduce(
      (
        acc: {
          workout_id: number | string
          sequence_number: number
          reps: number
        }[],
        item: any
      ) => {
        const workoutId = getWorkoutSelectableId(item)
        if (workoutId == null) return acc

        const key = String(workoutId)
        const reps = Math.max(1, workoutCounts[key] ?? 1)
        sequence += 1

        acc.push({
          workout_id: workoutId,
          sequence_number: sequence,
          reps,
        })

        return acc
      },
      []
    )
  }

  const handleBulkAssign = async () => {
    const workoutPlanId = dayDetail?.workout_plan?.id
    const subscriptionId = overview?.subscription?.id
    if (!subscriptionId || selectedWorkouts.length === 0) return
    setAssigning(true)
    try {
      const exercisesPayload = normalizeExercisePayload(selectedWorkouts)

      if (!exercisesPayload.length) {
        throw new Error('No valid workouts to assign')
      }

      await workoutOverridesBulk(subscriptionId, {
        workout_plan_id: workoutPlanId,
        day_number: dayDetail?.day_number,
        date: dayDetail?.date,
        exercises: exercisesPayload,
      })
      await refreshDayDetail()
      setSelectedWorkouts([])
      setWorkoutCounts({})
      setSelectedCategoryId(undefined)
      setSelectedCategoryIds([])
      setSelectedCategoryName('')
      setSelectedSubcategories([])
      prefillAppliedRef.current = false
      lastPrefillSignatureRef.current = ''
      drawerSelectionInitializedRef.current = false
      userSelectionTouchedRef.current = false
      setReviewOpen(false)
      setAssignOpen(false)
      enqueueSnackbar('Workout plan updated successfully', {
        variant: 'success',
      })
      refreshEntirePage()
    } catch (error: any) {
      const resp = error?.response?.data
      const messageFromResponse =
        resp?.message ||
        resp?.error ||
        (Array.isArray(resp?.errors) ? resp.errors.join(', ') : null) ||
        resp?.detail ||
        error?.message
      enqueueSnackbar(messageFromResponse || 'Failed to assign workouts', {
        variant: 'error',
      })
    } finally {
      setAssigning(false)
      setDragIndex(null)
      setDragGroup(null)
      setWpSearch('')
      setWpPage(1)
    }
  }

  const onDrop = (index: number, groupName?: string) => {
    if (
      dragIndex === null ||
      dragIndex === index ||
      (groupName && dragGroup && groupName !== dragGroup)
    ) {
      setDragIndex(null)
      setDragGroup(null)
      return
    }
    setSelectedWorkouts((prev) => {
      const next = prev.slice()
      const [item] = next.splice(dragIndex, 1)
      next.splice(index, 0, item)
      return next
    })
    setDragIndex(null)
    setDragGroup(null)
  }

  const onMedDragStart = (index: number) => {
    setMedDragIndex(index)
  }
  const onMedDragOver = (e: any) => {
    e.preventDefault()
  }
  const onMedDrop = (index: number) => {
    if (medDragIndex === null || medDragIndex === index) {
      setMedDragIndex(null)
      return
    }
    setSelectedMeditations((prev) => {
      const next = prev.slice()
      const [item] = next.splice(medDragIndex, 1)
      next.splice(index, 0, item)
      return next
    })
    setMedDragIndex(null)
  }

  const onYogaDragStart = (index: number) => {
    setYogaDragIndex(index)
  }
  const onYogaDragOver = (e: any) => {
    e.preventDefault()
  }
  const onYogaDrop = (index: number) => {
    if (yogaDragIndex === null || yogaDragIndex === index) {
      setYogaDragIndex(null)
      return
    }
    setSelectedYogas((prev) => {
      const next = prev.slice()
      const [item] = next.splice(yogaDragIndex, 1)
      next.splice(index, 0, item)
      return next
    })
    setYogaDragIndex(null)
  }

  const handleMedAssign = async () => {
    const subscriptionId = overview?.subscription?.id
    const planId =
      dayDetail?.meditation_plan?.id ||
      dayDetail?.plan_id ||
      overview?.subscription?.plan_id

    if (!subscriptionId || !planId || selectedMeditations.length === 0) return

    setMedAssigning(true)
    try {
      const payload = {
        plan_id: planId,
        meditations: selectedMeditations.reduce(
          (
            acc: { meditation_id: number | string; sequence_number: number }[],
            item: any,
            idx: number
          ) => {
            const medId = getMeditationId(item)
            if (!medId) return acc
            acc.push({
              meditation_id: medId,
              sequence_number: idx + 1,
            })
            return acc
          },
          []
        ),
      }

      if (!payload.meditations.length) {
        throw new Error('No valid meditations to assign')
      }

      await meditationOverridesBulk(subscriptionId, payload)

      await refreshDayDetail()
      setSelectedMeditations([])
      medSelectionPrefilledRef.current = false
      setMedReviewOpen(false)
      enqueueSnackbar('Meditation plan updated successfully', {
        variant: 'success',
      })
      refetchMeditationsList?.()
      refreshEntirePage()
    } catch (error: any) {
      const resp = error?.response?.data
      const messageFromResponse =
        resp?.message ||
        resp?.error ||
        (Array.isArray(resp?.errors) ? resp.errors.join(', ') : null) ||
        resp?.detail ||
        error?.message
      enqueueSnackbar(messageFromResponse || 'Failed to assign meditations', {
        variant: 'error',
      })
    } finally {
      setMedAssigning(false)
      setMedDragIndex(null)
      setMedSearch('')
      setMedPage(1)
    }
  }

  const handleYogaAssign = async () => {
    const yogaPlanId = dayDetail?.yoga_plan?.id
    const subscriptionId = overview?.subscription?.id
    if (!yogaPlanId || !subscriptionId || selectedYogas.length === 0) return
    setYogaAssigning(true)
    try {
      const exercisesPayload = selectedYogas.reduce(
        (
          acc: { yoga_id: number | string; sequence_number: number }[],
          item: any,
          idx: number
        ) => {
          const yogaId = getYogaId(item)
          if (!yogaId) return acc
          acc.push({
            yoga_id: yogaId,
            sequence_number: idx + 1,
          })
          return acc
        },
        []
      )

      if (!exercisesPayload.length) {
        throw new Error('No valid yogas to assign')
      }

      await yogaOverridesBulk(subscriptionId, {
        yoga_plan_id: yogaPlanId,
        day_number: dayDetail?.day_number,
        date: dayDetail?.date,
        exercises: exercisesPayload,
      })

      await refreshDayDetail()
      setSelectedYogas([])
      setSelectedYogaCategoryIds([])
      setSelectedYogaSubcategories([])
      setYogaCategoryFilter('')
      yogaPrefillAppliedRef.current = false
      lastYogaPrefillSignatureRef.current = ''
      yogaSelectionPrefilledRef.current = false
      setYogaReviewOpen(false)
      setYogaAssignOpen(false)
      enqueueSnackbar('Yoga plan updated successfully', { variant: 'success' })
      refreshEntirePage()
    } catch (error: any) {
      const resp = error?.response?.data
      const messageFromResponse =
        resp?.message ||
        resp?.error ||
        (Array.isArray(resp?.errors) ? resp.errors.join(', ') : null) ||
        resp?.detail ||
        error?.message
      enqueueSnackbar(messageFromResponse || 'Failed to assign yogas', {
        variant: 'error',
      })
    } finally {
      setYogaAssigning(false)
      setYogaDragIndex(null)
      setYogaCategoryFilter('')
    }
  }

  const isFrozen = (row?: any) => {
    return !!(row?.is_frozen ?? overview?.subscription?.is_frozen)
  }

  const handleFreezeChange = (data: { name: string; value: any }) => {
    const subStart = overview?.subscription?.start_date || ''
    const subEnd = overview?.subscription?.end_date || ''
    if (data.name === 'start_date') {
      let newStart = toISODate(data.value as string)
      if (
        subStart &&
        newStart &&
        moment(newStart, 'YYYY-MM-DD', true).isBefore(
          moment(subStart, 'YYYY-MM-DD')
        )
      ) {
        newStart = subStart
      }
      if (
        subEnd &&
        newStart &&
        moment(newStart, 'YYYY-MM-DD', true).isAfter(
          moment(subEnd, 'YYYY-MM-DD')
        )
      ) {
        newStart = subEnd
      }
      let newEnd = freezeForm.end_date
      if (
        newEnd &&
        moment(newEnd, 'YYYY-MM-DD', true).isBefore(
          moment(newStart, 'YYYY-MM-DD')
        )
      ) {
        newEnd = ''
      }
      if (
        subEnd &&
        newEnd &&
        moment(newEnd, 'YYYY-MM-DD', true).isAfter(moment(subEnd, 'YYYY-MM-DD'))
      ) {
        newEnd = subEnd
      }
      setFreezeForm((prev) => ({
        ...prev,
        start_date: newStart,
        end_date: newEnd,
      }))
      return
    }
    setFreezeForm((prev) => ({ ...prev, [data.name]: data.value }))
  }

  const resetFreezeForm = () => {
    setFreezeForm({ reason: '', start_date: '', end_date: '' })
  }

  const closeFreezeDialog = () => {
    setToggleFreezeOpen(false)
    setToggleFreezeRow(null)
    setFreezeMode('freeze')
    resetFreezeForm()
  }

  // const handleDownloadDietTemplate = async () => {
  //   const templateId = overview?.subscription?.diet_plan_template_id

  //   if (!templateId) {
  //     enqueueSnackbar('No diet template assigned to this subscription', {
  //       variant: 'error',
  //     })
  //     return
  //   }
  //   setDownloadingTemplate(true)
  //   try {
  //     // Use the diet plans API with template ID filter
  //     const dietPlansApiUrl = `${apiUrl.DIET_PLAN}?page=1&per_page=1000&diet_plan_template_id=${templateId}`
  //     const response = await getData(dietPlansApiUrl)
  //     const dietPlansData = response?.diet_plans || response?.items || response || []

  //     if (!dietPlansData || dietPlansData.length === 0) {
  //       enqueueSnackbar('No diet plans found for this template', {
  //         variant: 'error',
  //       })
  //       return
  //     }

  //     // Fetch logo
  //     let base64Logo: string | null = null;
  //     try {
  //       const logoUrl = '/gfm-logo.png';
  //       const logoResponse = await fetch(logoUrl);
  //       const blob = await logoResponse.blob();
  //       base64Logo = await new Promise<string>((resolve, reject) => {
  //         const reader = new FileReader();
  //         reader.onloadend = () => resolve(reader.result as string);
  //         reader.onerror = reject;
  //         reader.readAsDataURL(blob);
  //       });
  //     } catch (err) {
  //       console.warn('Could not load logo for PDF', err);
  //     }

  //     // Create PDF
  //     const pdf = new jsPDF('p', 'mm', 'a4')
  //     const pageWidth = pdf.internal.pageSize.getWidth()
  //     const pageHeight = pdf.internal.pageSize.getHeight()
  //     const marginX = 35 // Left side offset past the sidebar
  //     const rightMargin = 15
  //     const contentWidth = pageWidth - marginX - rightMargin

  //     const drawBackground = () => {
  //       const sidebarW = 22;
  //       const topbarH = 7;
  //       const curveR = 12;
  //       const topCornerR = 14;

  //       // Light blue sidebar and top bar
  //       pdf.setFillColor(152, 192, 230) // Light blue
  //       pdf.rect(0, 0, sidebarW, pageHeight, 'F') // Sidebar
  //       pdf.rect(0, 0, pageWidth, topbarH, 'F') // Top bar

  //       // Curve filler and carver to make a smooth inner concave corner
  //       pdf.rect(sidebarW, topbarH, curveR, curveR, 'F') // Filler
  //       pdf.setFillColor(255, 255, 255)
  //       pdf.circle(sidebarW + curveR, topbarH + curveR, curveR, 'F') // Carver

  //       // Top-left white curving corner
  //       pdf.setFillColor(255, 255, 255)
  //       pdf.circle(0, 0, topCornerR, 'F')

  //       // Add logo inside a white circle with dark blue border
  //       const logoCenterX = sidebarW / 2;
  //       const logoCenterY = 25;
  //       const logoCircleR = 9; // smaller circle

  //       pdf.setFillColor(255, 255, 255)
  //       pdf.setDrawColor(22, 60, 92) // Dark blue border
  //       pdf.setLineWidth(0.6)
  //       pdf.circle(logoCenterX, logoCenterY, logoCircleR, 'FD')

  //       if (base64Logo) {
  //         const logoSize = 14; // smaller logo
  //         pdf.addImage(base64Logo, 'PNG', logoCenterX - logoSize / 2, logoCenterY - logoSize / 2, logoSize, logoSize)
  //       }

  //       // Bottom colored bars
  //       const barWidth = pageWidth / 4
  //       pdf.setFillColor(44, 193, 203) // turquoise-ish
  //       pdf.rect(0, pageHeight - 4, barWidth, 4, 'F')
  //       pdf.setFillColor(231, 61, 142) // pink
  //       pdf.rect(barWidth, pageHeight - 4, barWidth, 4, 'F')
  //       pdf.setFillColor(29, 137, 219) // blue
  //       pdf.rect(barWidth * 2, pageHeight - 4, barWidth, 4, 'F')
  //       pdf.setFillColor(22, 60, 92) // dark blue
  //       pdf.rect(barWidth * 3, pageHeight - 4, barWidth, 4, 'F')
  //     }

  //     drawBackground()

  //     let yPosition = 25

  //     // Helper function to add text with proper line height
  //     const addText = (
  //       text: string,
  //       fontSize = 10,
  //       fontStyle = 'normal',
  //       xOffset = 0
  //     ) => {
  //       pdf.setFont('helvetica', fontStyle as any)
  //       pdf.setFontSize(fontSize)
  //       pdf.text(text, marginX + xOffset, yPosition)
  //       yPosition += fontSize * 0.5 + 2
  //     }

  //     // Helper function to check page break
  //     const checkPageBreak = (requiredHeight: number) => {
  //       if (
  //         yPosition + requiredHeight >
  //         pageHeight - 20
  //       ) {
  //         pdf.addPage()
  //         drawBackground()
  //         yPosition = 20
  //       }
  //     }

  //     // Title
  //     pdf.setTextColor(0, 0, 0)
  //     pdf.setFont('helvetica', 'bold')
  //     pdf.setFontSize(18)
  //     pdf.text('Diet Template Details', marginX, yPosition)
  //     yPosition += 10

  //     // Template basic info
  //     const templateName =
  //       dietPlansData[0]?.diet_plan_template_name || 'Unknown Template'
  //     addText(`Template Name: ${templateName}`, 14, 'bold')
  //     addText(`Total Meals: ${dietPlansData.length}`, 10, 'normal')
  //     yPosition += 8

  //     // Group diet plans by day_number
  //     const groupedByDay = dietPlansData.reduce((acc: any, plan: any) => {
  //       const dayNum = plan.day_number || 1
  //       if (!acc[dayNum]) {
  //         acc[dayNum] = []
  //       }
  //       acc[dayNum].push(plan)
  //       return acc
  //     }, {})

  //     // Sort days numerically
  //     const sortedDays = Object.keys(groupedByDay).sort(
  //       (a, b) => Number(a) - Number(b)
  //     )

  //     sortedDays.forEach((dayNum) => {
  //       checkPageBreak(25)

  //       // Day header with background
  //       pdf.setFillColor(52, 73, 94)
  //       pdf.rect(marginX, yPosition - 4, contentWidth, 8, 'F')
  //       pdf.setTextColor(255, 255, 255)
  //       pdf.setFont('helvetica', 'bold')
  //       pdf.setFontSize(11)
  //       pdf.text(`Option- ${dayNum}`, marginX + 3, yPosition)
  //       pdf.setTextColor(0, 0, 0)
  //       yPosition += 8

  //       const dayPlans = groupedByDay[dayNum]

  //       // Sort by sequence_number
  //       dayPlans.sort(
  //         (a: any, b: any) =>
  //           (a.sequence_number || 0) - (b.sequence_number || 0)
  //       )

  //       dayPlans.forEach((dietPlan: any) => {
  //         checkPageBreak(20)

  //         // Meal header with light background
  //         pdf.setFillColor(241, 245, 249)
  //         pdf.rect(marginX + 3, yPosition - 3, contentWidth - 6, 7, 'F')
  //         pdf.setFont('helvetica', 'bold')
  //         pdf.setFontSize(10)
  //         pdf.text(
  //           `${dietPlan.meal_time || 'Meal'} - ${dietPlan.effective_total_calories || 0} kcal`,
  //           marginX + 5,
  //           yPosition
  //         )
  //         yPosition += 8

  //         if (dietPlan.items && Array.isArray(dietPlan.items)) {
  //           dietPlan.items.forEach((item: any) => {
  //             checkPageBreak(15)

  //             const reqLabel =
  //               item.requirement === 'mandatory'
  //                 ? '(Mandatory)'
  //                 : item.requirement === 'optional'
  //                   ? '(Optional)'
  //                   : ''
  //             const servingInfo = item.serving_unit
  //               ? `${item.quantity} ${item.serving_unit}`
  //               : `${item.quantity} units`
  //             const caloriesInfo = item.per_serving?.calories || 0

  //             // Item name
  //             pdf.setFont('helvetica', 'bold')
  //             pdf.setFontSize(9)
  //             pdf.text(
  //               `• ${item.meal_name || 'Unknown Item'} ${reqLabel}`,
  //               marginX + 8,
  //               yPosition
  //             )
  //             yPosition += 5

  //             // Item details
  //             pdf.setFont('helvetica', 'normal')
  //             pdf.setFontSize(8)
  //             pdf.setTextColor(100, 100, 100)
  //             pdf.text(
  //               `Quantity: ${servingInfo}  |  Calories: ${caloriesInfo} kcal`,
  //               marginX + 12,
  //               yPosition
  //             )
  //             yPosition += 4

  //             // Calorie breakdown
  //             if (item.per_serving) {
  //               const protein = item.per_serving.protein || 0
  //               const carbs = item.per_serving.carbs || 0
  //               const fat = item.per_serving.fat || 0
  //               const fiber = item.per_serving.fiber || 0

  //               pdf.text(
  //                 `Protein: ${protein}g  |  Carbs: ${carbs}g  |  Fat: ${fat}g  |  Fiber: ${fiber}g`,
  //                 marginX + 12,
  //                 yPosition
  //               )
  //               yPosition += 6
  //             } else {
  //               yPosition += 2
  //             }
  //             pdf.setTextColor(0, 0, 0)
  //           })
  //         }
  //         yPosition += 2
  //       })
  //       yPosition += 5
  //     })

  //     // Add timestamp
  //     yPosition = pageHeight - 12
  //     pdf.setFont('helvetica', 'normal')
  //     pdf.setFontSize(8)
  //     pdf.text(
  //       `Downloaded on: ${moment().format('MMM D, YYYY h:mm A')}`,
  //       marginX,
  //       yPosition
  //     )

  //     // Save PDF
  //     pdf.save(`diet_template_${templateId}.pdf`)

  //     enqueueSnackbar('Diet template PDF downloaded successfully', {
  //       variant: 'success',
  //     })
  //   } catch (err) {
  //     console.error('Failed to download diet template:', err)
  //     enqueueSnackbar('Failed to download diet template', { variant: 'error' })
  //   } finally {
  //     setDownloadingTemplate(false)
  //   }
  // }

  const handleDownloadDietTemplate = async () => {
    const templateId = overview?.subscription?.diet_plan_template_id

    if (!templateId) {
      enqueueSnackbar('No diet template assigned to this subscription', {
        variant: 'error',
      })
      return
    }
    setDownloadingTemplate(true)
    try {
      // Use the diet plans API with template ID filter
      const dietPlansApiUrl = `${apiUrl.DIET_PLAN}?page=1&per_page=1000&diet_plan_template_id=${templateId}`
      const response = await getData(dietPlansApiUrl)
      const dietPlansData =
        response?.diet_plans || response?.items || response || []

      if (!dietPlansData || dietPlansData.length === 0) {
        enqueueSnackbar('No diet plans found for this template', {
          variant: 'error',
        })
        return
      }

      // Fetch logo and plate
      let base64Logo: string | null = null
      let base64Plate: string | null = null
      try {
        const logoUrl = '/gfm-logo.png'
        const logoResponse = await fetch(logoUrl)
        const blob = await logoResponse.blob()
        base64Logo = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onloadend = () => resolve(reader.result as string)
          reader.onerror = reject
          reader.readAsDataURL(blob)
        })

        const plateUrl = '/diet_plate.jpg'
        const plateResponse = await fetch(plateUrl)
        if (plateResponse.ok) {
          const pb = await plateResponse.blob()
          const pBase = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader()
            reader.onloadend = () => resolve(reader.result as string)
            reader.onerror = reject
            reader.readAsDataURL(pb)
          })

          base64Plate = await new Promise<string>((resolve) => {
            const img = new Image()
            img.onload = () => {
              const canvas = document.createElement('canvas')
              const size = Math.min(img.width, img.height)
              canvas.width = size
              canvas.height = size
              const ctx = canvas.getContext('2d')
              if (ctx) {
                ctx.beginPath()
                ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2)
                ctx.closePath()
                ctx.clip()
                const dx = (size - img.width) / 2
                const dy = (size - img.height) / 2
                ctx.drawImage(img, dx, dy, img.width, img.height)
                resolve(canvas.toDataURL('image/png'))
              } else {
                resolve(pBase)
              }
            }
            img.onerror = () => resolve(pBase)
            img.src = pBase
          })
        }
      } catch (err) {
        console.warn('Could not load images for PDF', err)
      }

      // Create PDF
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()

      // DRASCTICALLY REDUCED Layout variables
      const gap = 3
      const sidebarW = 20 // Very thin sidebar
      const marginX = gap + sidebarW + 5 // Reduced left margin
      const rightMargin = 15
      const genderValue =
        user?.gender ?? user?.gender_id ?? user?.profile?.gender
      const genderText = String(genderValue ?? '')
        .trim()
        .toLowerCase()
      const isFemale =
        genderValue === 1 ||
        genderValue === '1' ||
        genderText === 'female' ||
        genderText === 'f'
      const pdfPalette = isFemale
        ? {
            start: [244, 149, 185] as const,
            end: [255, 238, 246] as const,
            dark: [153, 27, 77] as const,
          }
        : {
            start: [138, 185, 235] as const,
            end: [240, 248, 255] as const,
            dark: [22, 60, 92] as const,
          }

      const drawBackground = () => {
        const topbarH = 6 // Thinner top bar
        const curveR = 6 // Tighter inner curve
        const topCornerR = 15 // Slightly smaller top-left cutout
        const barHeight = 5

        // Gradient color variables defined early for reuse
        const [rStart, gStart, bStart] = pdfPalette.start
        const [rEnd, gEnd, bEnd] = pdfPalette.end

        // 1. Top bar
        pdf.setFillColor(rStart, gStart, bStart)
        pdf.rect(gap, gap, pageWidth - gap, topbarH, 'F')

        // 2. Sidebar with Gradient
        for (let i = gap + topbarH; i < pageHeight - barHeight; i += 1.5) {
          const ratio =
            (i - (gap + topbarH)) / (pageHeight - barHeight - (gap + topbarH))
          const r = rStart + (rEnd - rStart) * ratio
          const g = gStart + (gEnd - gStart) * ratio
          const b = bStart + (bEnd - bStart) * ratio
          pdf.setFillColor(Math.round(r), Math.round(g), Math.round(b))
          pdf.rect(gap, i, sidebarW, 2, 'F')
        }

        // Fill top area of sidebar
        pdf.setFillColor(rStart, gStart, bStart)
        pdf.rect(gap, gap, sidebarW, topbarH, 'F')

        // 3. Inner concave curve (where top bar and sidebar meet)
        pdf.setFillColor(rStart, gStart, bStart)
        pdf.rect(gap + sidebarW, gap + topbarH, curveR, curveR, 'F')
        pdf.setFillColor(255, 255, 255)
        pdf.circle(gap + sidebarW + curveR, gap + topbarH + curveR, curveR, 'F')

        // 4. Top-left white carving corner (the circular cutout)
        pdf.setFillColor(255, 255, 255)
        pdf.circle(gap, gap, topCornerR, 'F')

        // ----------------------------------------------------------------------
        // --- Smooth Fillets for the sharp intersections of the cutout ---
        // ----------------------------------------------------------------------
        const filletR = 4 // Tighter fillet for a smaller cutout
        const dist = Math.sqrt(
          Math.pow(topCornerR + filletR, 2) - Math.pow(filletR, 2)
        )

        // A. Top Edge Intersection Fillet
        const cx1 = gap + dist
        const cy1 = gap + filletR
        const t1x = gap + topCornerR * (dist / (topCornerR + filletR))
        const t1y = gap + topCornerR * (filletR / (topCornerR + filletR))

        pdf.setFillColor(255, 255, 255)
        pdf.triangle(
          gap + topCornerR - 1,
          gap - 1,
          cx1,
          gap - 1,
          t1x - 0.5,
          t1y + 0.5,
          'F'
        )
        pdf.setFillColor(rStart, gStart, bStart)
        pdf.circle(cx1, cy1, filletR, 'F')

        // B. Left Edge Intersection Fillet
        const cx2 = gap + filletR
        const cy2 = gap + dist
        const t2x = gap + topCornerR * (filletR / (topCornerR + filletR))
        const t2y = gap + topCornerR * (dist / (topCornerR + filletR))

        pdf.setFillColor(255, 255, 255)
        pdf.triangle(
          gap - 1,
          gap + topCornerR - 1,
          gap - 1,
          cy2,
          t2x + 0.5,
          t2y - 0.5,
          'F'
        )

        const gradRatio =
          (cy2 - (gap + topbarH)) / (pageHeight - barHeight - (gap + topbarH))
        const filletRColor = Math.round(
          rStart + (rEnd - rStart) * Math.max(0, gradRatio)
        )
        const filletGColor = Math.round(
          gStart + (gEnd - gStart) * Math.max(0, gradRatio)
        )
        const filletBColor = Math.round(
          bStart + (bEnd - bStart) * Math.max(0, gradRatio)
        )

        pdf.setFillColor(filletRColor, filletGColor, filletBColor)
        pdf.circle(cx2, cy2, filletR, 'F')
        // ----------------------------------------------------------------------

        // 5. Outer Corner Rounding (Bottom-Left only)
        const carveOuterCorner = (
          x: number,
          y: number,
          r: number,
          corner: string
        ) => {
          pdf.setFillColor(255, 255, 255)
          const step = 0.1
          for (let i = 0; i <= r; i += step) {
            const cut = r - Math.sqrt(r * r - i * i)
            if (corner === 'bottom-left') {
              pdf.rect(x, y - r + i, cut, step * 1.5, 'F')
            }
          }
        }

        const outerCornerRadius = 8
        carveOuterCorner(
          gap,
          pageHeight - barHeight,
          outerCornerRadius,
          'bottom-left'
        )

        // 6. Logo container and placement (MUCH SMALLER)
        const logoCenterX = gap + sidebarW / 2
        const logoCenterY = gap + 28
        const logoCircleR = 7 // Drastically smaller white circle

        pdf.setFillColor(255, 255, 255)
        pdf.setDrawColor(
          pdfPalette.dark[0],
          pdfPalette.dark[1],
          pdfPalette.dark[2]
        )
        pdf.setLineWidth(0.8)
        pdf.circle(logoCenterX, logoCenterY, logoCircleR, 'FD')

        if (base64Logo) {
          const logoSize = 9 // Tiny logo
          pdf.addImage(
            base64Logo,
            'PNG',
            logoCenterX - logoSize / 2,
            logoCenterY - logoSize / 2,
            logoSize,
            logoSize
          )
        }
      }

      drawBackground()

      let yPosition = gap + 25 // Adjusted starting height for text

      // Helper function to add text
      // const addText = (
      //   text: string,
      //   fontSize = 10,
      //   fontStyle = 'normal',
      //   xOffset = 0
      // ) => {
      //   pdf.setFont('helvetica', fontStyle as any)
      //   pdf.setFontSize(fontSize)
      //   pdf.text(text, marginX + xOffset, yPosition)
      //   yPosition += fontSize * 0.5 + 2
      // }

      // Helper function to check page break
      const checkPageBreak = (requiredHeight: number) => {
        if (yPosition + requiredHeight > pageHeight - 20) {
          pdf.addPage()
          drawBackground()
          yPosition = gap + 25
        }
      }

      // Data for header
      const clientName = (
        user?.display_name ||
        user?.name ||
        'N/A'
      ).toUpperCase()
      const clientAge = user?.date_of_birth
        ? moment().diff(moment(user.date_of_birth), 'years')
        : 'N/A'
      let clientBmi = 'N/A'
      if (user?.weight && user?.height) {
        const heightInMeters = user.height / 100
        clientBmi = (user.weight / (heightInMeters * heightInMeters)).toFixed(1)
      }
      const planName = (
        overview?.subscription?.plan_name ||
        user?.subscribed_plan?.plan?.name ||
        'N/A'
      ).toUpperCase()
      const templateName = (
        dietPlansData[0]?.diet_plan_template_name || 'N/A'
      ).toUpperCase()

      // Header Section (drawn row by row)
      let headerY = gap + 15
      const headerLineHeight = 7

      pdf.setFont('times', 'bold')
      pdf.setFontSize(10)
      pdf.setTextColor(
        pdfPalette.dark[0],
        pdfPalette.dark[1],
        pdfPalette.dark[2]
      )

      const headerRows = [
        `NAME: ${clientName}`,
        `AGE: ${clientAge}`,
        `BMI: ${clientBmi}`,
        `PLAN: ${planName}`,
        `DIET PLAN: ${templateName}`,
      ]

      headerRows.forEach((row) => {
        pdf.text(row, marginX, headerY)
        headerY += headerLineHeight
      })

      // Add plate image at the right of the header section
      if (base64Plate) {
        const plateSize = 35 // Increased size
        pdf.addImage(
          base64Plate,
          'PNG', // Using PNG because canvas converted it to preserved transparency
          pageWidth - rightMargin - plateSize,
          gap + 10, // Positioned within header section
          plateSize,
          plateSize
        )
      }

      // pdf.setDrawColor(200, 200, 200)
      // pdf.setLineWidth(0.1)
      // pdf.line(marginX, headerY + 8, pageWidth - rightMargin, headerY + 8) // Line moved down

      // Title (Shifted down below header)
      yPosition = headerY + 10
      yPosition += 2

      // Group diet plans by day_number
      const groupedByDay = dietPlansData.reduce((acc: any, plan: any) => {
        const dayNum = plan.day_number || 1
        if (!acc[dayNum]) {
          acc[dayNum] = []
        }
        acc[dayNum].push(plan)
        return acc
      }, {})

      // Sort days numerically
      const sortedDays = Object.keys(groupedByDay).sort(
        (a, b) => Number(a) - Number(b)
      )

      sortedDays.forEach((dayNum) => {
        checkPageBreak(25)

        // Day header with background matching sidebar gradient at option position
        // Calculate sidebar color at this y position
        const [rStart, gStart, bStart] = pdfPalette.start
        const [rEnd, gEnd, bEnd] = pdfPalette.end
        const topbarH = 6
        const barHeight = 5
        const ratio =
          (yPosition - (gap + topbarH)) /
          (pageHeight - barHeight - (gap + topbarH))
        const r = rStart + (rEnd - rStart) * ratio
        const g = gStart + (gEnd - gStart) * ratio
        const b = bStart + (bEnd - bStart) * ratio

        pdf.setFillColor(Math.round(r), Math.round(g), Math.round(b)) // Sidebar gradient color at this position
        const optionBarX = gap + sidebarW
        const optionBarTop = yPosition - 4
        const optionBarHeight = 8
        const optionBarWidth = pageWidth - rightMargin - optionBarX
        pdf.rect(optionBarX, optionBarTop, optionBarWidth, optionBarHeight, 'F')
        pdf.setTextColor(
          pdfPalette.dark[0],
          pdfPalette.dark[1],
          pdfPalette.dark[2]
        ) // Dark text for contrast against light background
        pdf.setFont('times', 'bold')
        pdf.setFontSize(11)
        const optionText = `Option- ${dayNum}`
        const optionTextY = optionBarTop + optionBarHeight / 2 + 1
        pdf.text(optionText, marginX, optionTextY)
        pdf.setTextColor(0, 0, 0)
        yPosition += 8

        const dayPlans = groupedByDay[dayNum]

        // Sort by sequence_number
        dayPlans.sort(
          (a: any, b: any) =>
            (a.sequence_number || 0) - (b.sequence_number || 0)
        )

        dayPlans.forEach((dietPlan: any) => {
          checkPageBreak(20)

          // Meal header without background
          pdf.setFont('times', 'bold')
          pdf.setFontSize(10)
          pdf.text(
            `${dietPlan.meal_time || 'Meal'} - ${dietPlan.effective_total_calories || 0} kcal`,
            marginX + 5,
            yPosition
          )
          yPosition += 8

          if (dietPlan.items && Array.isArray(dietPlan.items)) {
            dietPlan.items.forEach((item: any) => {
              checkPageBreak(15)

              const reqLabel =
                item.requirement === 'mandatory'
                  ? '(Mandatory)'
                  : item.requirement === 'optional'
                    ? '(Optional)'
                    : ''
              const servingInfo = item.serving_unit
                ? `${item.quantity} ${item.serving_unit}`
                : `${item.quantity} units`
              const caloriesInfo = item.per_serving?.calories || 0

              // Item name
              pdf.setFont('helvetica', 'bold')
              pdf.setFontSize(9)
              pdf.text(
                `• ${item.meal_name || 'Unknown Item'} ${reqLabel}`,
                marginX + 8,
                yPosition
              )
              yPosition += 5

              // Item details
              pdf.setFont('helvetica', 'normal')
              pdf.setFontSize(8)
              pdf.setTextColor(100, 100, 100)
              pdf.text(
                `Quantity: ${servingInfo}  |  Calories: ${caloriesInfo} kcal`,
                marginX + 12,
                yPosition
              )
              yPosition += 4

              // Calorie breakdown
              if (item.per_serving) {
                const protein = item.per_serving.protein || 0
                const carbs = item.per_serving.carbs || 0
                const fat = item.per_serving.fat || 0
                const fiber = item.per_serving.fiber || 0

                pdf.text(
                  `Protein: ${protein}g  |  Carbs: ${carbs}g  |  Fat: ${fat}g  |  Fiber: ${fiber}g`,
                  marginX + 12,
                  yPosition
                )
                yPosition += 6
              } else {
                yPosition += 2
              }
              pdf.setTextColor(0, 0, 0)
            })
          }
          yPosition += 2
        })
        yPosition += 5
      })

      // Add timestamp
      yPosition = pageHeight - 12
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(8)
      pdf.text(
        `Downloaded on: ${moment().format('MMM D, YYYY h:mm A')}`,
        marginX,
        yPosition
      )

      // Save PDF
      pdf.save(`diet_template_${templateId}.pdf`)

      enqueueSnackbar('Diet template PDF downloaded successfully', {
        variant: 'success',
      })
    } catch (err) {
      console.error('Failed to download diet template:', err)
      enqueueSnackbar('Failed to download diet template', { variant: 'error' })
    } finally {
      setDownloadingTemplate(false)
    }
  }

  const handleConfirmToggleFreeze = async () => {
    const sid = String(toggleFreezeRow?.id || overview?.subscription?.id || '')
    if (!sid) {
      enqueueSnackbar('Missing subscription id', { variant: 'error' })
      return
    }

    // Validation based on freeze mode
    if (freezeMode === 'freeze') {
      const { reason, start_date, end_date } = freezeForm
      if (!reason || !start_date || !end_date) {
        enqueueSnackbar('Please fill reason, start date and end date', {
          variant: 'warning',
        })
        return
      }
    } else {
      const unfreezeDates = resolveUnfreezeDates()
      if (!unfreezeDates.length) {
        enqueueSnackbar('Select at least one date to unfreeze', {
          variant: 'warning',
        })
        return
      }
    }

    try {
      setLoader(true)
      if (freezeMode === 'freeze') {
        await freezeSubscription(sid, {
          reason: freezeForm.reason || undefined,
          start_date: freezeForm.start_date || undefined,
          end_date: freezeForm.end_date || undefined,
        })
        enqueueSnackbar('Subscription frozen successfully', {
          variant: 'success',
        })
      } else {
        const unfreezeDates = resolveUnfreezeDates()
        if (!unfreezeDates.length) {
          enqueueSnackbar('Unable to determine freeze dates to unfreeze', {
            variant: 'error',
          })
          return
        }

        await unfreezeSubscription(sid, {
          unfreeze_dates: unfreezeDates,
        })
        enqueueSnackbar('Subscription unfrozen successfully', {
          variant: 'success',
        })
      }

      try {
        const subId =
          selectedSubscriptionId || selectedCycle?.subscription_id || undefined
        const res = await getActivePlanOverview(user.id, subId)
        setOverview(res)
      } catch {}
      try {
        const fresh = await getAdminDetails(String(id))
        onRefresh(fresh)
      } catch {}
      closeFreezeDialog()
    } catch (err: any) {
      enqueueSnackbar(
        err?.response?.data?.error?.message || err?.response?.data?.message,
        { variant: 'error' }
      )
    } finally {
      setLoader(false)
    }
  }

  const onDragStart = (index: number, groupName?: string) => {
    setDragIndex(index)
    setDragGroup(groupName ?? null)
  }
  const onDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
  }

  return (
    <>
      {loading && (
        <div className="p-6">
          <InfoBox content="Loading interested plans..." />
        </div>
      )}
      {error && !loading && (
        <div className="p-6">
          <InfoBox content={error} />
        </div>
      )}
      {!loading && !error && (
        <div className="flex flex-col gap-4">
          <ClientWorkflowDetails
            assignment={workflowAssignment}
            proposedPackage={proposedPackage}
            assignmentId={workflowAssignment?.id}
            role={loginRole || 'nutritionist'}
            plans={allPlans}
            showWorkflowActions={loginRole !== 'superadmin'}
            onRefresh={async () => {
              await (onWorkflowRefresh || onRefresh)()
              if (canLoadClientProposal) {
                await Promise.allSettled([
                  refetchClientDetail(),
                  refetchCycles(),
                ])
              }
            }}
            subscription={
              selectedCycle &&
              (!selectedCycle.subscription_id ||
                selectedCycle.status === 'proposed')
                ? null
                : overview?.subscription ||
                  (selectedCycle?.subscription_id
                    ? { ...selectedCycle, plan_name: selectedCycle.plan?.name }
                    : selectedCycleId === 'legacy'
                      ? subscribedPlan
                      : null)
            }
            isServiceRole={isServiceRole}
            onConfirmPackage={() => setConfirmModalOpen(true)}
            confirmLoading={confirmingPackage}
            canConfirmPackage={canConfirmPackage}
            canUpdatePackage={canUpdatePackage}
            clientId={String(id)}
          />

          {Boolean(
            overview?.subscription ||
              (selectedCycle?.subscription_id &&
                selectedCycle.status !== 'proposed') ||
              (selectedCycleId === 'legacy' && subscribedPlan)
          ) && (
            <div className="flex justify-end gap-2 mt-2">
              <Button
                className="primaryButton"
                label={
                  downloadingTemplate
                    ? 'Downloading...'
                    : 'Download Diet Template'
                }
                onClick={handleDownloadDietTemplate}
                disabled={
                  downloadingTemplate ||
                  !overview?.subscription?.diet_plan_template_id
                }
              />
              {isActionableSubscription && (
                <Button
                  className="primaryButton"
                  label={
                    isFrozen(overview?.subscription)
                      ? 'Unfreeze Subscription'
                      : 'Freeze Subscription'
                  }
                  onClick={() => {
                    setFreezeMode(
                      isFrozen(overview?.subscription) ? 'unfreeze' : 'freeze'
                    )
                    setToggleFreezeRow(overview?.subscription)
                    setToggleFreezeOpen(true)
                    setFreezeForm({
                      reason: '',
                      start_date: '',
                      end_date: '',
                    })
                  }}
                />
              )}
            </div>
          )}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-xs flex flex-col flex-1 min-h-[440px] transition-all">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primaryBlue text-white shadow-2xs">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800 tracking-tight">
                    Plan Calendar
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {isYogist
                      ? 'Daily scheduled yoga & meditation'
                      : 'Daily scheduled diet, workouts, yoga & meditation'}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50/80 border border-blue-200 text-[11px] font-medium text-blue-700">
                  <span className="w-2 h-2 rounded-full bg-primaryBlue animate-pulse inline-block" />
                  Today
                </div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50/80 border border-amber-200 text-[11px] font-medium text-amber-700">
                  <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                  Upcoming
                </div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50/80 border border-emerald-200 text-[11px] font-medium text-emerald-700">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                  Complete
                </div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50/80 border border-rose-200 text-[11px] font-medium text-rose-700">
                  <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
                  Freeze
                </div>
              </div>
            </div>
            {overviewLoading && (
              <div className="flex flex-col items-center justify-center py-16 flex-1 text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-primaryBlue border border-blue-100 shadow-2xs mb-2.5">
                  <svg
                    className="h-5 w-5 animate-spin text-primaryBlue"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="3"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                </div>
                <div className="text-xs font-semibold text-slate-700">
                  Loading Calendar
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Please wait while the schedule is loaded
                </div>
              </div>
            )}
            {!overviewLoading &&
            overview?.subscription?.start_date &&
            overview?.subscription?.end_date ? (
              <div className="flex flex-col gap-3 flex-1 overflow-hidden">
                <div className="flex items-center justify-between bg-slate-50/80 border border-slate-200/70 rounded-xl px-3 py-2">
                  <button
                    type="button"
                    onClick={goPrev}
                    disabled={!canPrev()}
                    className={`flex items-center justify-center h-7 w-7 rounded-lg text-xs font-semibold border transition-all ${
                      canPrev()
                        ? 'bg-white text-slate-700 border-slate-200 shadow-2xs hover:bg-slate-100 active:scale-95'
                        : 'bg-slate-100 text-slate-300 border-transparent cursor-not-allowed'
                    }`}
                    title="Previous Month"
                  >
                    ❮
                  </button>
                  <div className="text-xs font-bold text-slate-800 tracking-wide uppercase">
                    {buildMonthCells(currentMonth).title}
                  </div>
                  <button
                    type="button"
                    onClick={goNext}
                    disabled={!canNext()}
                    className={`flex items-center justify-center h-7 w-7 rounded-lg text-xs font-semibold border transition-all ${
                      canNext()
                        ? 'bg-white text-slate-700 border-slate-200 shadow-2xs hover:bg-slate-100 active:scale-95'
                        : 'bg-slate-100 text-slate-300 border-transparent cursor-not-allowed'
                    }`}
                    title="Next Month"
                  >
                    ❯
                  </button>
                </div>
                {(() => {
                  const m = buildMonthCells(currentMonth)
                  return (
                    <>
                      <div className="grid grid-cols-7 gap-1.5 text-center">
                        {WEEK_DAYS.map((w) => (
                          <div
                            key={w}
                            className="py-1.5 text-center text-xs font-semibold text-slate-500 bg-slate-50 rounded-lg border border-slate-100"
                          >
                            {w}
                          </div>
                        ))}
                      </div>
                      <div className="flex-1 overflow-auto">
                        <div className="grid grid-cols-7 auto-rows-fr gap-1.5">
                          {m.cells.map((c: any) => {
                            const isToday =
                              String(c?.meta?.status || '').toLowerCase() ===
                              'today'
                            return (
                              <div
                                key={c.key}
                                className={`relative min-h-[170px] rounded-xl border p-2 flex flex-col justify-between transition-all duration-200 ${c?.inRange ? 'hover:-translate-y-0.5' : ''} select-none ${getDayCellClass(c)}`}
                                title={
                                  c?.meta?.date
                                    ? [
                                        moment(c.meta.date).isValid()
                                          ? moment(c.meta.date).format(
                                              'DD-MM-YYYY'
                                            )
                                          : c.meta.date,
                                        canAccessDiet &&
                                          `Diet: ${c?.meta?.diet_summary?.total_items ?? 0}`,
                                        canAccessWorkout &&
                                          `Workout: ${c?.meta?.workout_summary?.total_exercises ?? 0}`,
                                        canAccessYoga &&
                                          `Yoga: ${c?.meta?.yoga_summary?.total_exercises ?? 0}`,
                                        canAccessMeditation &&
                                          `Meditation: ${c?.meta?.meditation_summary?.total_items ?? 0}`,
                                      ]
                                        .filter(Boolean)
                                        .join('  •  ')
                                    : ''
                                }
                                role={c?.inRange ? 'button' : undefined}
                                tabIndex={c?.inRange ? 0 : -1}
                                onClick={() => {
                                  if (!c?.inRange) return
                                  if (c?.meta?.freeze) {
                                    setFreezeMode('unfreeze')
                                    setToggleFreezeRow({
                                      ...overview?.subscription,
                                      freeze_date: c?.meta?.date || c.key,
                                    })
                                    setToggleFreezeOpen(true)
                                    return
                                  }
                                  openDayDetail(c?.meta?.date || c.key)
                                }}
                                onKeyDown={(e) => {
                                  if (!c?.inRange) return
                                  if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault()
                                    if (c?.meta?.freeze) {
                                      setFreezeMode('unfreeze')
                                      setToggleFreezeRow({
                                        ...overview?.subscription,
                                        freeze_date: c?.meta?.date || c.key,
                                      })
                                      setToggleFreezeOpen(true)
                                    } else {
                                      openDayDetail(c?.meta?.date || c.key)
                                    }
                                  }
                                }}
                              >
                                <div className="flex flex-col h-full w-full justify-between">
                                  <div>
                                    <div
                                      className={`flex items-center justify-between pb-1 mb-1.5 ${
                                        c?.inRange
                                          ? 'border-b border-white/25'
                                          : 'border-b border-slate-200/70'
                                      }`}
                                    >
                                      {isToday ? (
                                        <span className="h-6 w-6 rounded-full bg-white text-blue-600 flex items-center justify-center font-bold text-xs shadow-2xs">
                                          {c?.label ?? ''}
                                        </span>
                                      ) : (
                                        <span
                                          className={`text-sm font-bold pl-0.5 ${
                                            c?.inRange
                                              ? 'text-white drop-shadow-2xs'
                                              : 'text-slate-400'
                                          }`}
                                        >
                                          {c?.label ?? ''}
                                        </span>
                                      )}
                                      {c?.meta?.freeze ? (
                                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-white/20 text-white border border-white/30 backdrop-blur-xs">
                                          Frozen
                                        </span>
                                      ) : c?.meta?.day_number ? (
                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-white/20 text-white backdrop-blur-xs">
                                          Day {c.meta.day_number}
                                        </span>
                                      ) : null}
                                    </div>
                                    {c?.inRange && c?.meta ? (
                                      <div className="flex flex-col gap-1 mt-1">
                                        {canAccessDiet && (
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              openDayDetail(
                                                c?.meta?.date || c.key,
                                                'diet'
                                              )
                                            }}
                                            className="group w-full flex items-center justify-between rounded-lg px-2.5 py-1 text-[11px] font-medium text-slate-800 bg-white/95 hover:bg-white border border-white/60 transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] shadow-2xs"
                                          >
                                            <span className="flex items-center gap-1.5">
                                              <span className="h-1.5 w-1.5 rounded-full bg-rose-500 group-hover:scale-125 transition-transform" />
                                              <span>Diet</span>
                                            </span>
                                            <span className="rounded-md bg-rose-50 px-1.5 py-0.5 text-[10px] font-bold text-rose-700 border border-rose-200/60 shadow-2xs">
                                              {c?.meta?.diet_summary
                                                ?.total_items ?? 0}
                                            </span>
                                          </button>
                                        )}

                                        {canAccessWorkout && (
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              openDayDetail(
                                                c?.meta?.date || c.key,
                                                'workout'
                                              )
                                            }}
                                            className="group w-full flex items-center justify-between rounded-lg px-2.5 py-1 text-[11px] font-medium text-slate-800 bg-white/95 hover:bg-white border border-white/60 transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] shadow-2xs"
                                          >
                                            <span className="flex items-center gap-1.5">
                                              <span className="h-1.5 w-1.5 rounded-full bg-violet-500 group-hover:scale-125 transition-transform" />
                                              <span>Workout</span>
                                            </span>
                                            <span className="rounded-md bg-violet-50 px-1.5 py-0.5 text-[10px] font-bold text-violet-700 border border-violet-200/60 shadow-2xs">
                                              {c?.meta?.workout_summary
                                                ?.total_exercises ?? 0}
                                            </span>
                                          </button>
                                        )}

                                        {canAccessYoga && (
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              openDayDetail(
                                                c?.meta?.date || c.key,
                                                'yoga'
                                              )
                                            }}
                                            className="group w-full flex items-center justify-between rounded-lg px-2.5 py-1 text-[11px] font-medium text-slate-800 bg-white/95 hover:bg-white border border-white/60 transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] shadow-2xs"
                                          >
                                            <span className="flex items-center gap-1.5">
                                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 group-hover:scale-125 transition-transform" />
                                              <span>Yoga</span>
                                            </span>
                                            <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200/60 shadow-2xs">
                                              {c?.meta?.yoga_summary
                                                ?.total_exercises ?? 0}
                                            </span>
                                          </button>
                                        )}

                                        {canAccessMeditation && (
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              openDayDetail(
                                                c?.meta?.date || c.key,
                                                'meditation'
                                              )
                                            }}
                                            className="group w-full flex items-center justify-between rounded-lg px-2.5 py-1 text-[11px] font-medium text-slate-800 bg-white/95 hover:bg-white border border-white/60 transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] shadow-2xs"
                                          >
                                            <span className="flex items-center gap-1.5">
                                              <span className="h-1.5 w-1.5 rounded-full bg-sky-500 group-hover:scale-125 transition-transform" />
                                              <span>Meditation</span>
                                            </span>
                                            <span className="rounded-md bg-sky-50 px-1.5 py-0.5 text-[10px] font-bold text-sky-700 border border-sky-200/60 shadow-2xs">
                                              {c?.meta?.meditation_summary
                                                ?.total_items ?? 0}
                                            </span>
                                          </button>
                                        )}
                                      </div>
                                    ) : null}
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </>
                  )
                })()}
              </div>
            ) : (
              !overviewLoading && (
                <div className="flex flex-col items-center justify-center p-6 text-center flex-1">
                  {selectedCycle &&
                  (!selectedCycle.subscription_id ||
                    selectedCycle.status === 'proposed') ? (
                    <div className="text-xs font-medium text-slate-600 bg-slate-50 border border-slate-200 rounded-xl px-5 py-4 max-w-md shadow-xs">
                      The package plan (
                      <strong className="font-semibold text-slate-800">
                        {toTitleCase(
                          proposedPackage?.plan?.name ||
                            selectedCycle.plan?.name ||
                            'Proposed Package'
                        )}
                      </strong>
                      ) is currently proposed and pending confirmation. Once
                      confirmed, the daily schedule calendar will be generated.
                    </div>
                  ) : (
                    <div className="text-xs font-medium text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-4 py-3 max-w-md shadow-sm">
                      {overviewError || 'No calendar data available'}
                    </div>
                  )}
                </div>
              )
            )}
          </div>
        </div>
      )}

      <CustomDrawer
        open={assignOpen}
        handleClose={() => {
          setAssignOpen(false)
          setWpSearch('')
          setWpPage(1)
        }}
        className="w-screen max-w-[100vw]"
        unmountOnClose
        title={'Assign Workout'}
        handleSubmit={handleNext}
        disableSubmit={!canProceedToReview}
        hideSubmit={!canProceedToReview}
        actionLoader={false}
        actionLabel={'Next'}
      >
        <div className="w-full">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
              <div className="text-md font-bold">Workouts</div>
              <div className="flex flex-col md:flex-row md:items-end gap-2 w-full md:w-auto mb-1">
                <div className="flex-1 min-w-[180px]">
                  <AutoComplete
                    placeholder="Select category"
                    desc="name"
                    descId="id"
                    type="custom_search_select"
                    isMultiple={true}
                    selectedItems={selectedCategoryItems}
                    data={formattedCategoryOptions}
                    value={''}
                    name="assign_category"
                    onChange={(option: any) => {
                      const options = Array.isArray(option)
                        ? option
                        : option
                          ? [option]
                          : []
                      const ids = options
                        .map((item: any) => item?.id ?? item?.value)
                        .filter(
                          (value: any) =>
                            value !== undefined &&
                            value !== null &&
                            value !== ''
                        )

                      const removedCategoryIds = selectedCategoryIds.filter(
                        (oldId) => !ids.map(String).includes(String(oldId))
                      )

                      // When categories change (add or remove), clear ALL
                      // subcategories so the workout list refetches without
                      // stale subcategory filters for the new category set.
                      const categoriesChanged =
                        ids.map(String).sort().join(',') !==
                        selectedCategoryIds.map(String).sort().join(',')

                      const remainingWorkouts = selectedWorkouts.filter(
                        (w: any) => {
                          const catId =
                            w?.category?.main_category?.id ??
                            w?.workout?.category?.main_category?.id ??
                            w?.category?.parent_id ??
                            w?.workout?.category?.parent_id ??
                            w?.main_category_id ??
                            w?.workout?.main_category_id ??
                            w?.category_id ??
                            w?.workout?.category_id ??
                            w?.category?.id ??
                            w?.workout?.category?.id

                          if (catId !== undefined && catId !== null) {
                            return !removedCategoryIds
                              .map(String)
                              .includes(String(catId))
                          }
                          return true
                        }
                      )

                      setSelectedCategoryIds(ids)
                      setSelectedCategoryId(ids[0] || undefined)
                      // Clear all subcategories whenever categories change so
                      // the workout query key updates and a fresh fetch fires.
                      if (categoriesChanged) {
                        setSelectedSubcategories([])
                      }
                      setSelectedWorkouts(remainingWorkouts)
                      setWpPage(1)
                    }}
                  />
                </div>
                <div className="flex-1 min-w-[200px]">
                  <AutoComplete
                    key={selectedCategoryIds.join(',')}
                    placeholder="Select subcategories"
                    desc="value"
                    descId="id"
                    type="auto_suggestion"
                    isMultiple={true}
                    selectedItems={normalizedSelectedSubcategories}
                    value={''}
                    async={true}
                    initialLoad={true}
                    paginationEnabled={false}
                    name="assign_subcategories"
                    getData={async (key?: string) => {
                      const catIds =
                        selectedCategoryIds && selectedCategoryIds.length > 0
                          ? selectedCategoryIds
                          : selectedCategoryId
                            ? [selectedCategoryId]
                            : []

                      if (catIds.length === 0) return []

                      const results = await Promise.all(
                        catIds.map((categoryId) =>
                          getWorkoutPlanSubcategories(categoryId)
                        )
                      )
                      const raw = results.flat()

                      let options = Array.isArray(raw) ? raw : []

                      options.sort((a: any, b: any) => {
                        const nameA = String(
                          a.subName || a.value || ''
                        ).toLowerCase()
                        const nameB = String(
                          b.subName || b.value || ''
                        ).toLowerCase()
                        if (nameA < nameB) return -1
                        if (nameA > nameB) return 1
                        const catA = String(a.catName || '').toLowerCase()
                        const catB = String(b.catName || '').toLowerCase()
                        if (catA < catB) return -1
                        if (catA > catB) return 1
                        return 0
                      })

                      if (key) {
                        const lower = String(key).toLowerCase()
                        options = options.filter((o: any) =>
                          String(o.value || '')
                            .toLowerCase()
                            .includes(lower)
                        )
                      }

                      updateSubcategoryLookup(options)

                      return options
                    }}
                    onChange={(value?: any | any[]) => {
                      const normalized = deriveSubcategorySelection(value)
                      const prevKey = (selectedSubcategories || [])
                        .map((item: any) => String(item?.id ?? ''))
                        .filter(Boolean)
                        .sort()
                        .join('|')
                      const nextKey = (normalized || [])
                        .map((item: any) => String(item?.id ?? ''))
                        .filter(Boolean)
                        .sort()
                        .join('|')

                      const removedSubcategoryIds = (
                        selectedSubcategories || []
                      )
                        .map((item: any) => String(item?.id ?? ''))
                        .filter(
                          (oldId) =>
                            !normalized
                              .map((n: any) => String(n?.id ?? ''))
                              .includes(oldId)
                        )

                      if (removedSubcategoryIds.length > 0) {
                        const remainingWorkouts = selectedWorkouts.filter(
                          (w: any) => {
                            const subId =
                              w?.subcategory_id ??
                              w?.workout?.subcategory_id ??
                              w?.subcategory?.id ??
                              w?.workout?.subcategory?.id ??
                              (Array.isArray(w?.subcategory_ids)
                                ? w.subcategory_ids[0]
                                : undefined) ??
                              (Array.isArray(w?.workout?.subcategory_ids)
                                ? w.workout.subcategory_ids[0]
                                : undefined) ??
                              (Array.isArray(w?.subcategories)
                                ? w.subcategories[0]?.id
                                : undefined) ??
                              (Array.isArray(w?.workout?.subcategories)
                                ? w.workout.subcategories[0]?.id
                                : undefined)

                            if (subId !== undefined && subId !== null) {
                              return !removedSubcategoryIds.includes(
                                String(subId)
                              )
                            }
                            return true
                          }
                        )
                        setSelectedWorkouts(remainingWorkouts)
                      }

                      if (prevKey === nextKey) {
                        setSelectedSubcategories(normalized)
                        return
                      }

                      setSelectedSubcategories(normalized)
                    }}
                  />
                </div>
              </div>
            </div>
            {!workoutsLoading && workouts.length > 0 && (
              <div className="flex flex-wrap items-center justify-between text-xs text-gray-600">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    className="px-2 py-1 border rounded text-xs disabled:opacity-50"
                    onClick={handleWorkoutSelectAllVisible}
                    disabled={workoutsLoading || allVisibleWorkoutSelected}
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    className="px-2 py-1 border rounded text-xs disabled:opacity-50"
                    onClick={handleWorkoutUnselectAllVisible}
                    disabled={!hasVisibleWorkoutSelection}
                  >
                    Unselect All
                  </button>
                </div>
                <div className="flex items-center gap-4 text-[11px] text-gray-600 ml-auto justify-end">
                  <span className="inline-flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                    Repetitions
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    Intensity
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    Duration
                  </span>
                </div>
              </div>
            )}
            {workoutsLoading && workouts.length === 0 && (
              <div className="flex items-center justify-center py-12 text-xs text-gray-500 min-h-[200px]">
                Loading...
              </div>
            )}
            {!workoutsLoading && workouts.length === 0 && (
              <div className="text-xs text-gray-500 p-2 min-h-[100px]">
                No workouts found.
              </div>
            )}

            {workouts.length > 0 && (
              <div
                className={`flex flex-col gap-4 transition-opacity duration-150 ${
                  workoutsLoading
                    ? 'opacity-50 pointer-events-none'
                    : 'opacity-100'
                }`}
              >
                {groupedWorkouts.map((group) => {
                  return (
                    <fieldset
                      key={group.legend}
                      className="border border-gray-300 rounded-xl p-4 bg-white"
                    >
                      <legend className="px-2 text-md font-semibold text-gray-600">
                        {group.legend}
                      </legend>

                      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 xl:grid-cols-8 gap-4">
                        {group.items.map((w: any) => {
                          const url = w?.video_url || ''
                          const embed = getEmbedUrl(url)
                          const checked = isSelected(w?.id)
                          const workoutId = getWorkoutSelectableId(w)
                          const count =
                            workoutId != null
                              ? (workoutCounts[String(workoutId)] ??
                                (checked ? 1 : 0))
                              : 0
                          const canAdjust = checked && workoutId != null

                          return (
                            <div
                              key={w?.id}
                              className={`border rounded bg-white overflow-hidden w-full cursor-pointer ${
                                checked ? 'ring-2 ring-primary/30' : ''
                              }`}
                              onClick={(e) => {
                                if (
                                  (
                                    e.target as HTMLElement
                                  ).tagName.toLowerCase() !== 'input'
                                ) {
                                  toggleSelected(w)
                                }
                              }}
                            >
                              <div className="relative w-full h-40 bg-black/5">
                                {embed ? (
                                  <iframe
                                    src={embed}
                                    title={`Workout Video ${w?.id}`}
                                    className="w-full h-full"
                                    allowFullScreen
                                  />
                                ) : url ? (
                                  <video
                                    className="w-full h-full object-cover"
                                    src={String(url)}
                                    muted
                                    controls
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-xxs text-gray-500 bg-gray-50">
                                    No video
                                  </div>
                                )}

                                <div className="absolute top-2 right-2 flex flex-wrap gap-1 text-[11px]">
                                  <span className="inline-flex items-center gap-1 rounded-sm bg-blue-600/90 text-white px-2 py-0.5 font-semibold backdrop-blur">
                                    <Icons name="repeat" className="w-3 h-3" />
                                    {count > 0 ? count : '--'}
                                  </span>
                                  <span className="inline-flex items-center gap-1 rounded-sm bg-amber-500 text-white px-2 py-0.5 font-medium backdrop-blur">
                                    <Icons
                                      name="activity"
                                      className="w-3 h-3"
                                    />
                                    {w?.intensity_level ||
                                      w?.workout?.intensity_level ||
                                      '--'}
                                  </span>
                                  <span className="inline-flex items-center gap-1 rounded-sm bg-emerald-600/90 text-white px-2 py-0.5 font-medium backdrop-blur">
                                    <Icons name="clock" className="w-3 h-3" />
                                    {formatDurationMinutes(
                                      w?.duration_minutes ||
                                        w?.workout?.duration_minutes
                                    )}
                                  </span>
                                </div>
                              </div>

                              <div className="px-3 py-2 text-sm flex flex-col gap-2">
                                <div className="flex items-center justify-between gap-3">
                                  <div className="font-medium line-clamp-1 flex-1 text-left">
                                    {w?.name || 'Untitled'}
                                  </div>
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => toggleSelected(w)}
                                    onClick={(e) => e.stopPropagation()}
                                    className="cursor-pointer"
                                  />
                                </div>
                                <div className="flex items-center gap-2 justify-center">
                                  <button
                                    type="button"
                                    className="w-7 h-7 border rounded flex items-center justify-center text-lg leading-none disabled:opacity-40 disabled:cursor-not-allowed"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      e.preventDefault()
                                      decrementWorkoutCount(w)
                                    }}
                                    disabled={!canAdjust || count <= 1}
                                  >
                                    −
                                  </button>
                                  <span className="text-base font-semibold w-5 text-center">
                                    {count}
                                  </span>
                                  <button
                                    type="button"
                                    className="w-7 h-7 border rounded flex items-center justify-center text-lg leading-none disabled:opacity-40 disabled:cursor-not-allowed"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      e.preventDefault()
                                      incrementWorkoutCount(w)
                                    }}
                                    disabled={!canAdjust}
                                  >
                                    +
                                  </button>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </fieldset>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </CustomDrawer>

      <CustomDrawer
        open={reviewOpen}
        handleClose={() => {
          setReviewOpen(false)
          setAssignOpen(true)
          setDragIndex(null)
          setDragGroup(null)
        }}
        className="w-screen max-w-[100vw] h-screen"
        unmountOnClose
        title={'Review & Order Exercises'}
        handleSubmit={handleBulkAssign}
        disableSubmit={assigning || selectedWorkouts.length === 0}
        actionLoader={assigning}
        actionLabel={'Confirm'}
      >
        <div className="">
          <h2 className="text-lg font-bold flex items-center gap-2 mb-3">
            {canReorderWorkoutGroups && (
              <span className="text-gray-600  bg-clip-text ">
                Drag and drop the videos below into the order you want them to
                appear in the workout plan, then click{' '}
                <span className="font-semibold">Assign</span> to save this
                sequence.
              </span>
            )}
          </h2>
          {selectedWorkouts.length > 0 ? (
            <div className="flex flex-col gap-4">
              {groupedSelectedWorkouts.map((group) => {
                return (
                  <fieldset
                    key={group.legend}
                    className="border border-gray-300 rounded-xl p-4 bg-white"
                  >
                    <legend className="px-2 text-md font-semibold text-gray-600">
                      {group.legend}
                    </legend>

                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 xl:grid-cols-8 gap-5">
                      {group.items.map((w: any) => {
                        const index = selectedWorkouts.findIndex(
                          (it) => it?.id === w?.id
                        )
                        if (index === -1) return null

                        const embed = getEmbedUrl(w?.video_url)
                        const url = w?.video_url || ''

                        return (
                          <div
                            key={w?.id}
                            draggable
                            onDragStart={() => onDragStart(index, group.legend)}
                            onDragOver={(e) => onDragOver(e)}
                            onDrop={() => onDrop(index, group.legend)}
                            className="rounded-xl shadow-lg bg-white border hover:shadow-xl transition-shadow cursor-grab active:cursor-grabbing overflow-hidden"
                          >
                            <div className="px-4 py-2 bg-gray-50 border-b text-sm font-semibold flex justify-between items-center">
                              <span className="line-clamp-1">
                                {index + 1}. {w?.name}
                              </span>
                            </div>

                            {embed ? (
                              <iframe
                                className="w-full h-30"
                                src={embed}
                                allowFullScreen
                              ></iframe>
                            ) : url ? (
                              <video
                                src={url}
                                controls
                                muted
                                className="w-full h-30 object-cover"
                              />
                            ) : (
                              <div className="text-sm text-gray-500 italic">
                                No video URL available.
                              </div>
                            )}

                            {group.items.length > 1 && (
                              <div className="px-4 py-2 text-xs text-gray-600">
                                Hold and drag to rearrange
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </fieldset>
                )
              })}
            </div>
          ) : (
            <div className="text-sm text-gray-500 italic">
              No videos selected yet.
            </div>
          )}
        </div>
      </CustomDrawer>

      <CustomDrawer
        open={yogaAssignOpen}
        handleClose={() => {
          setYogaAssignOpen(false)
          setYogaCategoryFilter('')
          setSelectedYogaCategoryIds([])
          setSelectedYogaSubcategories([])
          setSelectedYogas([])
          yogaSelectionPrefilledRef.current = false
          yogaPrefillAppliedRef.current = false
          lastYogaPrefillSignatureRef.current = ''
        }}
        className="w-screen max-w-[100vw]"
        unmountOnClose
        title={'Assign Yoga'}
        handleSubmit={handleYogaNext}
        disableSubmit={!yogaCanProceedToReview}
        hideSubmit={!yogaCanProceedToReview}
        actionLoader={false}
        actionLabel={'Next'}
      >
        <div className="w-full">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
              <div className="text-md font-bold mb-2">Yogas</div>
              <div className="flex flex-col md:flex-row md:items-end gap-2 w-full md:w-auto mb-1">
                <div className="flex-1 min-w-[180px]">
                  <AutoComplete
                    placeholder="Select category"
                    desc="name"
                    descId="id"
                    type="custom_search_select"
                    isMultiple={true}
                    selectedItems={selectedYogaCategoryItems}
                    data={formattedYogaCategoryOptions}
                    value={''}
                    name="assign_yoga_category"
                    onChange={(option: any) => {
                      const options = Array.isArray(option)
                        ? option
                        : option
                          ? [option]
                          : []
                      const ids = options
                        .map((item: any) => item?.id ?? item?.value)
                        .filter(
                          (value: any) =>
                            value !== undefined &&
                            value !== null &&
                            value !== ''
                        )

                      const removedCategoryIds = selectedYogaCategoryIds.filter(
                        (oldId) => !ids.map(String).includes(String(oldId))
                      )

                      // When categories change (add or remove), clear ALL
                      // subcategories so the yoga list refetches without
                      // stale subcategory filters for the new category set.
                      const categoriesChanged =
                        ids.map(String).sort().join(',') !==
                        selectedYogaCategoryIds.map(String).sort().join(',')

                      const remainingYogas = selectedYogas.filter((y: any) => {
                        const catId =
                          y?.category?.main_category?.id ??
                          y?.yoga?.category?.main_category?.id ??
                          y?.category?.parent_id ??
                          y?.yoga?.category?.parent_id ??
                          y?.main_category_id ??
                          y?.yoga?.main_category_id ??
                          y?.category_id ??
                          y?.yoga?.category_id ??
                          y?.category?.id ??
                          y?.yoga?.category?.id

                        if (catId !== undefined && catId !== null) {
                          return !removedCategoryIds
                            .map(String)
                            .includes(String(catId))
                        }
                        return true
                      })

                      setSelectedYogaCategoryIds(ids)
                      // Clear all subcategories whenever categories change so
                      // the yoga query key updates and a fresh fetch fires.
                      if (categoriesChanged) {
                        setSelectedYogaSubcategories([])
                      }
                      setSelectedYogas(remainingYogas)
                    }}
                  />
                </div>
                <div className="flex-1 min-w-[200px]">
                  <AutoComplete
                    key={selectedYogaCategoryIds.join(',')}
                    placeholder="Select subcategories"
                    desc="value"
                    descId="id"
                    type="auto_suggestion"
                    isMultiple={true}
                    selectedItems={normalizedSelectedYogaSubcategories}
                    value={''}
                    async={true}
                    initialLoad={true}
                    paginationEnabled={false}
                    name="assign_yoga_subcategories"
                    getData={async (key?: string) => {
                      if (
                        !selectedYogaCategoryIds ||
                        selectedYogaCategoryIds.length === 0
                      )
                        return []

                      const results = await Promise.all(
                        selectedYogaCategoryIds.map((categoryId) =>
                          getYogaPlanSubcategories(categoryId)
                        )
                      )
                      const raw = results.flat()

                      let options = Array.isArray(raw) ? raw : []

                      options.sort((a: any, b: any) => {
                        const nameA = String(
                          a.subName || a.value || ''
                        ).toLowerCase()
                        const nameB = String(
                          b.subName || b.value || ''
                        ).toLowerCase()
                        if (nameA < nameB) return -1
                        if (nameA > nameB) return 1
                        const catA = String(a.catName || '').toLowerCase()
                        const catB = String(b.catName || '').toLowerCase()
                        if (catA < catB) return -1
                        if (catA > catB) return 1
                        return 0
                      })

                      if (key) {
                        const lower = String(key).toLowerCase()
                        options = options.filter((o: any) =>
                          String(o.value || '')
                            .toLowerCase()
                            .includes(lower)
                        )
                      }

                      updateYogaSubcategoryLookup(options)

                      return options
                    }}
                    onChange={(value?: any | any[]) => {
                      const normalized = deriveSubcategorySelection(value)
                      const prevKey = (selectedYogaSubcategories || [])
                        .map((item: any) => String(item?.id ?? ''))
                        .filter(Boolean)
                        .sort()
                        .join('|')
                      const nextKey = (normalized || [])
                        .map((item: any) => String(item?.id ?? ''))
                        .filter(Boolean)
                        .sort()
                        .join('|')

                      const removedSubcategoryIds = (
                        selectedYogaSubcategories || []
                      )
                        .map((item: any) => String(item?.id ?? ''))
                        .filter(
                          (oldId) =>
                            !normalized
                              .map((n: any) => String(n?.id ?? ''))
                              .includes(oldId)
                        )

                      if (removedSubcategoryIds.length > 0) {
                        const remainingYogas = selectedYogas.filter(
                          (y: any) => {
                            const subId =
                              y?.subcategory_id ??
                              y?.yoga?.subcategory_id ??
                              y?.subcategory?.id ??
                              y?.yoga?.subcategory?.id ??
                              (Array.isArray(y?.subcategory_ids)
                                ? y.subcategory_ids[0]
                                : undefined) ??
                              (Array.isArray(y?.yoga?.subcategory_ids)
                                ? y.yoga.subcategory_ids[0]
                                : undefined) ??
                              (Array.isArray(y?.subcategories)
                                ? y.subcategories[0]?.id
                                : undefined) ??
                              (Array.isArray(y?.yoga?.subcategories)
                                ? y.yoga.subcategories[0]?.id
                                : undefined)

                            if (subId !== undefined && subId !== null) {
                              return !removedSubcategoryIds.includes(
                                String(subId)
                              )
                            }
                            return true
                          }
                        )
                        setSelectedYogas(remainingYogas)
                      }

                      if (prevKey === nextKey) {
                        setSelectedYogaSubcategories(normalized)
                        return
                      }

                      setSelectedYogaSubcategories(normalized)
                    }}
                  />
                </div>
              </div>
            </div>

            {yogasLoading && (
              <div className="text-xs text-gray-500 p-2">Loading...</div>
            )}
            {!yogasLoading && yogas.length === 0 && (
              <div className="text-xs text-gray-500 p-2">No yoga found.</div>
            )}

            {!yogasLoading && yogas.length > 0 && (
              <div className="flex flex-wrap items-center justify-between text-xs text-gray-600">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    className="px-2 py-1 border rounded text-xs disabled:opacity-50"
                    onClick={handleYogaSelectAllVisible}
                    disabled={yogasLoading || allVisibleYogaSelected}
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    className="px-2 py-1 border rounded text-xs disabled:opacity-50"
                    onClick={handleYogaUnselectAllVisible}
                    disabled={!hasVisibleYogaSelection}
                  >
                    Unselect All
                  </button>
                </div>
                <div className="flex items-center gap-4 text-[11px] text-gray-600 ml-auto justify-end">
                  <span className="inline-flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                    Repetitions
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    Intensity
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    Duration
                  </span>
                </div>
              </div>
            )}

            {!yogasLoading && yogas.length > 0 && (
              <div
                className={`flex flex-col gap-4 transition-opacity duration-150 ${
                  yogasLoading
                    ? 'opacity-50 pointer-events-none'
                    : 'opacity-100'
                }`}
              >
                {groupedYogas.map((group) => {
                  const legendText = group.legend

                  return (
                    <fieldset
                      key={group.legend || group.name}
                      className="border border-gray-300 rounded-xl p-4 bg-white"
                    >
                      <legend className="px-2 text-md font-semibold text-gray-600">
                        {legendText}
                      </legend>

                      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 xl:grid-cols-8 gap-4">
                        {group.items.map((y: any) => {
                          const url = y?.video_url || ''
                          const embed = getEmbedUrl(url)
                          const checked = isYogaSelected(y?.id)
                          const durationLabel = getYogaDurationLabel(y)
                          return (
                            <div
                              key={y?.id}
                              className={`border rounded bg-white overflow-hidden w-full cursor-pointer ${
                                checked ? 'ring-2 ring-primary/30' : ''
                              }`}
                              onClick={(e) => {
                                if (
                                  (
                                    e.target as HTMLElement
                                  ).tagName.toLowerCase() !== 'input'
                                ) {
                                  toggleYogaSelected(y)
                                }
                              }}
                            >
                              <div className="relative w-full h-40 bg-black/5">
                                {embed ? (
                                  <iframe
                                    src={embed}
                                    title={`Yoga Video ${y?.id}`}
                                    className="w-full h-full pointer-events-none"
                                    allowFullScreen
                                  />
                                ) : url ? (
                                  <video
                                    className="w-full h-full object-cover"
                                    src={String(url)}
                                    muted
                                    controls
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-xxs text-gray-500 bg-gray-50">
                                    No video
                                  </div>
                                )}

                                <div className="absolute top-2 right-2 flex flex-wrap gap-1 text-[11px]">
                                  {y?.reps ? (
                                    <span className="items-center gap-1 rounded-sm bg-blue-600/90 text-white px-2 py-0.5 font-semibold backdrop-blur">
                                      <Icons
                                        name="repeat"
                                        className="w-3 h-3"
                                      />
                                      {y.reps}
                                    </span>
                                  ) : null}
                                  <span className="items-center gap-1 rounded-sm bg-amber-500 text-white px-2 py-0.5 font-medium backdrop-blur">
                                    <Icons
                                      name="activity"
                                      className="w-3 h-3"
                                    />
                                    {y?.intensity_level ||
                                      y?.yoga?.intensity_level ||
                                      '--'}
                                  </span>
                                  <span className="items-center gap-1 rounded-sm bg-green-600/90 text-white px-2 py-0.5 font-medium backdrop-blur">
                                    <Icons name="clock" className="w-3 h-3" />
                                    {durationLabel}
                                  </span>
                                </div>
                              </div>

                              <div className="px-2 py-2 text-xs flex items-center justify-between gap-2">
                                <div className="font-medium line-clamp-1 flex-1">
                                  {formatYogaName(y?.name || y?.title)}
                                </div>
                                <input
                                  type="checkbox"
                                  className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer shrink-0"
                                  checked={checked}
                                  onChange={() => toggleYogaSelected(y)}
                                />
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </fieldset>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </CustomDrawer>

      <CustomDrawer
        open={yogaReviewOpen}
        handleClose={() => {
          setYogaReviewOpen(false)
          setYogaAssignOpen(true)
          setYogaDragIndex(null)
        }}
        className="w-screen max-w-[100vw] h-screen"
        unmountOnClose
        title={'Review & Order Yoga'}
        handleSubmit={handleYogaAssign}
        disableSubmit={yogaAssigning || selectedYogas.length === 0}
        actionLoader={yogaAssigning}
        actionLabel={'Confirm'}
      >
        <div className="">
          <h2 className="text-lg font-bold mb-1 flex items-center gap-2 mb-3">
            {canReorderYogaSelections && (
              <span className="text-gray-600  bg-clip-text ">
                Drag and drop the videos below into the order you want them to
                appear in the yoga plan, then click{' '}
                <span className="font-semibold">Assign</span> to save this
                sequence.
              </span>
            )}
          </h2>
          {selectedYogas.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-8 gap-5">
              {selectedYogas.map((y, i) => {
                const embed = getEmbedUrl(y?.video_url)
                const url = y?.video_url || ''
                return (
                  <div
                    key={`${y?.id}-${i}`}
                    draggable
                    onDragStart={() => onYogaDragStart(i)}
                    onDragOver={onYogaDragOver}
                    onDrop={() => onYogaDrop(i)}
                    className="rounded-xl shadow-lg bg-white border hover:shadow-xl transition-shadow cursor-grab active:cursor-grabbing overflow-hidden"
                  >
                    <div className="px-4 py-2 bg-gray-50 border-b text-sm font-semibold flex justify-between items-center">
                      <span className="line-clamp-1">
                        {i + 1}. {formatYogaName(y?.name || y?.title)}
                      </span>
                    </div>

                    {embed ? (
                      <iframe
                        className="w-full h-48"
                        src={embed}
                        allowFullScreen
                      ></iframe>
                    ) : url ? (
                      <video
                        src={url}
                        controls
                        muted
                        className="w-full h-48 object-cover"
                      />
                    ) : (
                      <div className="text-sm text-gray-500 italic">
                        No video URL available.
                      </div>
                    )}

                    {selectedYogas.length > 1 && (
                      <div className="px-4 py-2 text-xs text-gray-600">
                        Hold and drag to rearrange
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-sm text-gray-500 italic">
              No videos selected yet.
            </div>
          )}
        </div>
      </CustomDrawer>

      <CustomDrawer
        open={medAssignOpen}
        handleClose={() => {
          setMedAssignOpen(false)
          setMedSearch('')
          setMedPage(1)
          setSelectedMeditations([])
          medSelectionPrefilledRef.current = false
        }}
        className="w-screen max-w-[100vw]"
        unmountOnClose
        title={'Assign Meditation'}
        handleSubmit={handleMedNext}
        disableSubmit={!medCanProceedToReview}
        hideSubmit={!medCanProceedToReview}
        actionLoader={false}
        actionLabel={'Next'}
      >
        <div className="w-full">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
              <div className="text-sm font-medium">Meditations</div>
              <div className="flex items-center gap-2">
                <input
                  value={medSearch}
                  onChange={(e) => {
                    setMedSearch(e.target.value)
                    setMedPage(1)
                  }}
                  placeholder="Search meditations..."
                  className="border rounded px-2 py-1 text-sm"
                />
                <select
                  className="border rounded px-2 py-1 text-sm"
                  value={medPerPage}
                  onChange={(e) => {
                    setMedPerPage(Number(e.target.value))
                    setMedPage(1)
                  }}
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>
            <div className="flex justify-between text-[11px] text-gray-600">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  className="px-2 py-1 border rounded text-xs disabled:opacity-50"
                  onClick={handleSelectAllVisible}
                  disabled={
                    medLoading ||
                    (Array.isArray(meditations) && meditations.length === 0) ||
                    allVisibleSelected
                  }
                >
                  Select All
                </button>
                <button
                  type="button"
                  className="px-2 py-1 border rounded text-xs disabled:opacity-50"
                  onClick={handleUnselectVisible}
                  disabled={selectedMeditations.length === 0}
                >
                  Unselect All
                </button>
              </div>
              <span className="inline-flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                Duration
              </span>
            </div>
            {medLoading && (
              <div className="text-xs text-gray-500 p-2">Loading...</div>
            )}
            {!medLoading && sortedMeditations.length === 0 && (
              <div className="text-xs text-gray-500 p-2">
                No meditations found.
              </div>
            )}

            {!medLoading && sortedMeditations.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-8 gap-4">
                {sortedMeditations.map((m: any) => {
                  const url = m?.video_url || m?.meditation_video_url || ''
                  const embed = getEmbedUrl(url)
                  const medId = getMeditationId(m)
                  const checked = isMeditationSelected(medId)
                  const title = formatMeditationName(m?.name || m?.title)
                  const durationLabel = getMeditationDurationLabel(m)
                  return (
                    <div
                      key={medId ?? m?.id}
                      className={`border rounded bg-white overflow-hidden w-full cursor-pointer ${
                        checked ? 'ring-2 ring-primary/30' : ''
                      }`}
                      onClick={(e) => {
                        if (
                          (e.target as HTMLElement).tagName.toLowerCase() !==
                          'input'
                        ) {
                          toggleMeditationSelected(m)
                        }
                      }}
                    >
                      <div className="relative w-full h-40 bg-black/5">
                        {embed ? (
                          <iframe
                            src={embed}
                            title={`Meditation Video ${medId}`}
                            className="w-full h-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                          />
                        ) : url ? (
                          <video
                            className="w-full h-full object-cover"
                            src={String(url)}
                            muted
                            controls
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xxs text-gray-500 bg-gray-50">
                            No video
                          </div>
                        )}

                        {durationLabel && (
                          <div className="absolute top-2 right-2 flex flex-wrap gap-1 text-[11px]">
                            <span className="inline-flex items-center gap-1 rounded-sm bg-emerald-500 text-white px-2 py-0.5 font-medium backdrop-blur">
                              <span className="w-2 h-2 rounded-full bg-white" />
                              {durationLabel}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="px-3 py-2 text-sm flex items-start justify-between gap-2">
                        <div className="font-medium line-clamp-1">
                          {toTitleCase(title)}
                        </div>
                        <input
                          type="checkbox"
                          className="mt-0.5 shrink-0"
                          checked={checked}
                          onChange={() => toggleMeditationSelected(m)}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            <div className="flex items-center justify-between pt-2 text-xs text-gray-600">
              <div>
                Page {medMeta?.current_page ?? medPage} /{' '}
                {medMeta?.total_pages ?? 1}
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="px-2 py-1 border rounded disabled:opacity-50"
                  disabled={(medMeta?.current_page ?? medPage) <= 1}
                  onClick={() => setMedPage((p) => Math.max(1, p - 1))}
                >
                  Prev
                </button>
                <button
                  className="px-2 py-1 border rounded disabled:opacity-50"
                  disabled={
                    (medMeta?.current_page ?? medPage) >=
                    (medMeta?.total_pages ?? 1)
                  }
                  onClick={() => setMedPage((p) => p + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      </CustomDrawer>

      <CustomDrawer
        open={medReviewOpen}
        handleClose={() => {
          setMedReviewOpen(false)
          setMedAssignOpen(true)
          setMedDragIndex(null)
        }}
        className="w-screen max-w-[100vw] h-screen"
        unmountOnClose
        title={'Review & Order Meditations'}
        handleSubmit={handleMedAssign}
        disableSubmit={medAssigning || selectedMeditations.length === 0}
        actionLoader={medAssigning}
        actionLabel={'Confirm'}
      >
        <div className="">
          <h2 className="text-lg font-bold mb-1 flex items-center gap-2 mb-3">
            {canReorderMeditations && (
              <span className="text-gray-600  bg-clip-text ">
                Drag and drop the videos below into the order you want them to
                appear in the meditation plan, then click{' '}
                <span className="font-semibold">Assign</span> to save this
                sequence.
              </span>
            )}
          </h2>
          {selectedMeditations.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-8 gap-5">
              {selectedMeditations.map((m: any, i: number) => {
                const rawUrl = m?.video_url || m?.meditation_video_url || ''
                const url = String(rawUrl || '')
                const embed = getEmbedUrl(url)
                const title = formatMeditationName(m?.name || m?.title)
                const medId = getMeditationId(m) ?? `${title}-${i}`
                return (
                  <div
                    key={medId}
                    draggable
                    onDragStart={() => onMedDragStart(i)}
                    onDragOver={onMedDragOver}
                    onDrop={() => onMedDrop(i)}
                    className="rounded-xl shadow-lg bg-white border hover:shadow-xl transition-shadow cursor-grab active:cursor-grabbing overflow-hidden"
                  >
                    <div className="px-4 py-2 bg-gray-50 border-b text-sm font-semibold flex justify-between items-center">
                      <span className="line-clamp-1">
                        {i + 1}. {title}
                      </span>
                    </div>

                    {embed ? (
                      <iframe
                        className="w-full h-48"
                        src={embed}
                        allowFullScreen
                      ></iframe>
                    ) : url ? (
                      <video
                        src={url}
                        controls
                        muted
                        className="w-full h-48 object-cover"
                      />
                    ) : (
                      <div className="text-sm text-gray-500 italic">
                        No video URL available.
                      </div>
                    )}

                    {canReorderMeditations && (
                      <div className="px-4 py-2 text-xs text-gray-600">
                        Hold and drag to rearrange
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-sm text-gray-500 italic">
              No videos selected yet.
            </div>
          )}
        </div>
      </CustomDrawer>

      <DialogModal
        isOpen={confirmModalOpen}
        onClose={() => {
          if (!confirmingPackage) setConfirmModalOpen(false)
        }}
        title="Confirm Package"
        subTitle="Convert this proposed package into an active subscription."
        onSubmit={handleConfirmPackage}
        actionLabel={
          confirmingPackage
            ? 'Confirming...'
            : 'Confirm & Activate Subscription'
        }
        actionLoader={confirmingPackage}
        secondaryAction={() => setConfirmModalOpen(false)}
        secondaryActionLabel="Cancel"
        small={false}
        className="w-full max-w-lg"
        body={
          <div className="space-y-4 text-sm text-gray-700">
            <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-blue-700 mb-3">
                Package Details
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-xs text-gray-500 block">Plan Name</span>
                  <span className="font-semibold text-gray-900">
                    {toTitleCase(
                      proposedPackage?.plan?.name ||
                        proposedCycle?.plan?.name ||
                        '--'
                    )}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-gray-500 block">Category</span>
                  <span className="font-semibold text-gray-900 capitalize">
                    {(() => {
                      const getVal = (v: any) => {
                        if (!v) return ''
                        if (typeof v === 'string') return v
                        if (typeof v === 'number') return String(v)
                        if (typeof v === 'object') {
                          return (
                            v.name ||
                            v.title ||
                            v.label ||
                            v.category_name ||
                            v.category ||
                            ''
                          )
                        }
                        return ''
                      }
                      const candidates = [
                        proposedPackage?.plan?.category,
                        proposedPackage?.plan?.plan_category,
                        proposedPackage?.plan?.category_name,
                        proposedPackage?.plan?.plan_category_name,
                        proposedPackage?.category,
                        proposedPackage?.plan_category,
                        proposedPackage?.category_name,
                        proposedPackage?.plan_category_name,
                        proposedPackage?.package_category,
                        proposedPackage?.package_category_name,
                        proposedCycle?.plan?.category,
                        proposedCycle?.plan?.plan_category,
                        proposedCycle?.plan?.category_name,
                        proposedCycle?.plan?.plan_category_name,
                        proposedCycle?.category,
                        proposedCycle?.plan_category,
                        proposedCycle?.category_name,
                        proposedCycle?.plan_category_name,
                        proposedCycle?.proposal?.plan?.category,
                        proposedCycle?.proposal?.plan?.plan_category,
                        proposedCycle?.proposal?.category,
                        proposedCycle?.proposal?.plan_category,
                        workflowAssignment?.anticipated_package?.category,
                        workflowAssignment?.anticipated_package?.plan_category,
                        workflowAssignment?.anticipated_package?.plan?.category,
                        workflowAssignment?.anticipated_package?.plan
                          ?.plan_category,
                        clientDetail?.client?.plan_proposals?.find(
                          (p: any) => p.status === 'proposed'
                        )?.plan?.category,
                        clientDetail?.client?.plan_proposals?.find(
                          (p: any) => p.status === 'proposed'
                        )?.plan?.plan_category,
                        clientDetail?.client?.plan_proposals?.find(
                          (p: any) => p.status === 'proposed'
                        )?.category,
                        clientDetail?.client?.plan_proposals?.find(
                          (p: any) => p.status === 'proposed'
                        )?.plan_category,
                      ]
                      for (const c of candidates) {
                        const str = getVal(c)
                        if (str && str.trim() !== '') return str
                      }
                      return '--'
                    })()}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-gray-500 block">
                    Start Date
                  </span>
                  <span className="font-semibold text-gray-900">
                    {proposedPackage?.start_date || proposedCycle?.start_date
                      ? moment(
                          proposedPackage?.start_date ||
                            proposedCycle?.start_date
                        ).format('DD-MM-YYYY')
                      : '--'}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-gray-500 block">End Date</span>
                  <span className="font-semibold text-gray-900">
                    {proposedPackage?.end_date || proposedCycle?.end_date
                      ? moment(
                          proposedPackage?.end_date || proposedCycle?.end_date
                        ).format('DD-MM-YYYY')
                      : '--'}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
              <span className="font-semibold">Note:</span> Confirming this
              package will activate the subscription and make its calendar days
              immediately available. Existing staff assignments for this package
              will be locked in as confirmed.
            </div>
          </div>
        }
      />

      <DialogModal
        isOpen={toggleFreezeOpen}
        onClose={closeFreezeDialog}
        title={
          freezeMode === 'unfreeze'
            ? 'Unfreeze Subscription'
            : 'Freeze Subscription'
        }
        onSubmit={handleConfirmToggleFreeze}
        secondaryAction={() => {
          closeFreezeDialog()
        }}
        secondaryActionLabel="Cancel"
        actionLabel={freezeMode === 'unfreeze' ? 'Unfreeze' : 'Freeze'}
        actionLoader={loader}
        body={
          freezeMode === 'unfreeze' ? (
            <InfoBox content={'Do you want to unfreeze this subscription?'} />
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-sm text-gray-600">
                  Reason <span className="text-red-500">*</span>
                </label>
                <input
                  className="textfield"
                  name="reason"
                  value={freezeForm.reason}
                  onChange={(e) =>
                    handleFreezeChange({
                      name: e.target.name,
                      value: e.target.value,
                    })
                  }
                  placeholder="Enter reason"
                />
              </div>
              <div className="grid grid-cols-2 gap-1">
                <div className="flex flex-col gap-1">
                  <label className="text-sm text-gray-600">
                    Start date <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      className={`w-full border rounded px-3 py-2 text-xs ${freezeForm.start_date ? 'pr-7' : ''}`}
                      name="start_date"
                      value={freezeForm.start_date}
                      min={overview?.subscription?.start_date || undefined}
                      max={overview?.subscription?.end_date || undefined}
                      onChange={(e) =>
                        handleFreezeChange({
                          name: e.target.name,
                          value: e.target.value,
                        })
                      }
                    />
                    {freezeForm.start_date ? (
                      <button
                        type="button"
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        onClick={() =>
                          setFreezeForm((prev) => ({
                            ...prev,
                            start_date: '',
                            end_date: '',
                          }))
                        }
                        aria-label="Clear freeze start date"
                      >
                        <Icons name="close" className="text-gray-500" />
                      </button>
                    ) : null}
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm text-gray-600">
                    End date <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      className={`w-full border rounded px-3 py-2 text-xs ${freezeForm.end_date ? 'pr-7' : ''}`}
                      name="end_date"
                      value={freezeForm.end_date}
                      min={
                        freezeForm.start_date ||
                        overview?.subscription?.start_date ||
                        undefined
                      }
                      max={overview?.subscription?.end_date || undefined}
                      onChange={(e) =>
                        handleFreezeChange({
                          name: e.target.name,
                          value: e.target.value,
                        })
                      }
                    />
                    {freezeForm.end_date ? (
                      <button
                        type="button"
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        onClick={() =>
                          setFreezeForm((prev) => ({
                            ...prev,
                            end_date: '',
                          }))
                        }
                        aria-label="Clear freeze end date"
                      >
                        <Icons name="close" className="text-gray-500" />
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          )
        }
      />

      <CustomDrawer
        open={dayDetailOpen}
        handleClose={() => setDayDetailOpen(false)}
        className="w-screen max-w-[1000px]"
        unmountOnClose
        accentHeader
        title={
          <div className="flex w-full items-center gap-3">
            <div className="flex flex-1 items-center justify-center">
              <div className="flex h-9 items-center justify-center gap-3 rounded-lg border border-blue-100 bg-white px-3 shadow-sm">
                <button
                  type="button"
                  aria-label="Previous day"
                  onClick={() => navigateDayDetail('previous')}
                  disabled={!canNavigateDayDetail('previous')}
                  className={`h-7 w-7 flex items-center justify-center transition-colors ${
                    canNavigateDayDetail('previous')
                      ? 'text-gray-700'
                      : 'text-gray-300 cursor-not-allowed'
                  }`}
                >
                  <Icons name="previous-arrow" />
                </button>
                <span className="min-w-[220px] text-center text-sm font-semibold text-primaryText">
                  {dayDetailNavigatorLabel}
                </span>
                <button
                  type="button"
                  aria-label="Next day"
                  onClick={() => navigateDayDetail('next')}
                  disabled={!canNavigateDayDetail('next')}
                  className={`h-7 w-7 flex items-center justify-center transition-colors ${
                    canNavigateDayDetail('next')
                      ? 'text-gray-700'
                      : 'text-gray-300 cursor-not-allowed'
                  }`}
                >
                  <Icons name="next-arrow" />
                </button>
              </div>
            </div>
          </div>
        }
        actionLabel={undefined}
        actionLoader={false}
        disableSubmit={false}
      >
        <div className="flex flex-col gap-4">
          {dayDetailLoading && (
            <div className="text-xs text-gray-500">Loading day details...</div>
          )}
          {!dayDetailLoading && !dayDetail && (
            <div className="text-xs text-gray-500">No details available.</div>
          )}
          {!dayDetailLoading && dayDetail && (
            <DayDetailTabsSection
              isActionablePackage={isActionableSubscription}
              dayDetail={dayDetail}
              dayDetailTab={dayDetailTab}
              onChangeTab={(tabId) => setDayDetailTab(tabId as DayDetailTab)}
              isNutritionist={isNutritionist}
              canAccessDiet={canAccessDiet}
              canAccessWorkout={canAccessWorkout}
              canAccessYoga={canAccessYoga}
              canAccessMeditation={canAccessMeditation}
              subscriptionId={overview?.subscription?.id}
              userId={id}
              refreshDayDetail={refreshDayDetail}
              workoutsById={workoutsById}
              subcategoryParentMap={subcategoryParentMap}
              yogasById={yogasById}
              yogaSubcategoryParentMap={yogaSubcategoryParentMap}
              onEditWorkoutPlan={() => {
                setDragIndex(null)
                setReviewOpen(false)
                setAssignOpen(true)
                setWpSearch('')
                setWpPage(1)
              }}
              onEditYogaPlan={() => {
                setYogaDragIndex(null)
                setYogaReviewOpen(false)
                setYogaAssignOpen(true)
                setYogaCategoryFilter('')
              }}
              onEditMeditationPlan={() => {
                setMedDragIndex(null)
                setMedReviewOpen(false)
                setMedAssignOpen(true)
                setMedSearch('')
                setMedPage(1)
                refetchMeditationsList?.()
              }}
            />
          )}
        </div>
      </CustomDrawer>
    </>
  )
}

function safeStr(v: any) {
  if (v === null || v === undefined || v === '') return '--'
  return String(v)
}

function formatYogaName(value?: any) {
  const raw =
    value === null || value === undefined || value === ''
      ? 'Untitled'
      : String(value)

  return raw
    .toLowerCase()
    .replace(/\b\w+/g, (word) => word.slice(0, 1).toUpperCase() + word.slice(1))
}

function getYogaDurationLabel(item: any) {
  const raw =
    item?.duration_minutes ??
    item?.yoga_duration_minutes ??
    item?.duration ??
    item?.yoga?.duration_minutes ??
    item?.workout_duration ??
    item?.duration_min ??
    item?.duration_minute

  const value = raw === null || raw === undefined ? undefined : Number(raw)
  if (value === undefined || Number.isNaN(value) || value <= 0) return null

  if (value >= 1) {
    const whole = Number.isInteger(value)
    return `${whole ? value : value.toFixed(2)} min`
  }

  const seconds = Math.max(1, Math.round(value * 60))
  return `${seconds} sec`
}

function formatMeditationName(value?: any) {
  const raw =
    value === null || value === undefined || value === ''
      ? 'Untitled'
      : String(value)
  return raw.slice(0, 1).toUpperCase() + raw.slice(1).toLowerCase()
}

function getMeditationDurationLabel(item: any) {
  const raw =
    item?.duration_minutes ??
    item?.meditation_duration_minutes ??
    item?.meditation?.duration_minutes ??
    item?.duration ??
    item?.meditation_duration

  const value = raw === null || raw === undefined ? undefined : Number(raw)
  if (value === undefined || Number.isNaN(value) || value <= 0) return null

  if (value >= 1) {
    const whole = Number.isInteger(value)
    return `${whole ? value : value.toFixed(2)} min`
  }

  const seconds = Math.max(1, Math.round(value * 60))
  return `${seconds} sec`
}
