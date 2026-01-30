import moment from 'moment'
import { useMemo, useState, useEffect, useRef, useCallback } from 'react'
import type { DragEvent } from 'react'
import { useQuery } from '@tanstack/react-query'
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
  createSubscription,
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
import DayDetailTabsSection from './DayDetailTabsSection'

const YOGA_CATEGORY_OPTIONS: { label: string; value: string }[] = [
  { label: 'Basic', value: 'basic' },
  { label: 'Intermediate', value: 'intermediate' },
  { label: 'Advanced', value: 'advanced' },
]

export default function Subscriptions({
  id,
  user,
  loading,
  error,
  onRefresh,
}: {
  id: string
  user: any
  loading: boolean
  error: string
  onRefresh: (data?: any) => void
}) {
  const plans = Array.isArray(user?.interested_plans)
    ? user.interested_plans.filter((p: any) => p?.active)
    : []
  const loginRole = useAuthStore((s) => s.roleData?.name?.toLowerCase?.())
  const isNutritionist = loginRole === 'nutritionist'

  const subscribedPlan = user?.subscribed_plan
  const [overview, setOverview] = useState<any>(null)
  const [overviewLoading, setOverviewLoading] = useState(false)
  const [currentMonth, setCurrentMonth] = useState<string>('')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [subscriptionEditMode, setSubscriptionEditMode] = useState(false)
  const [dayDetailOpen, setDayDetailOpen] = useState(false)
  const [dayDetail, setDayDetail] = useState<any>(null)
  const [dayDetailLoading, setDayDetailLoading] = useState(false)
  const [dayDetailTab, setDayDetailTab] = useState<string>('diet')
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
  const [subForm, setSubForm] = useState<{
    start_date: string
    end_date: string
    status: number | ''
    notes: string
    plan_id: number | ''
  }>({ start_date: '', end_date: '', status: 0, notes: '', plan_id: '' })
  const [subSubmitAttempted, setSubSubmitAttempted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [selectedPlanOption, setSelectedPlanOption] = useState<any>(null)
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
  const shouldLoadPlans = drawerOpen
  const shouldLoadWorkouts = assignOpen
  const shouldLoadYoga = yogaAssignOpen
  const shouldLoadMeditations = medAssignOpen
  const { data: plansList } = usePlans({ page: 1, per_page: 100 } as any, {
    enabled: shouldLoadPlans,
    staleTime: 5 * 60 * 1000,
  })
  const allPlans: any[] = (
    (plansList?.plans || plansList?.items || []) as any[]
  ).filter((p: any) => p?.active)
  const { enqueueSnackbar } = useSnackbarManager()
  const hasPlanOverview = !!overview?.subscription
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

        map[String(subId)] = {
          categoryId: cat?.id,
          categoryName: cat?.name ?? '',
          label: sub?.name ?? sub?.value ?? sub?.label ?? '',
        }
      })
    })

    return map
  }, [categoryOptions])
  const [selectedCategoryId, setSelectedCategoryId] = useState<
    number | string | undefined
  >(undefined)
  const [selectedCategoryName, setSelectedCategoryName] = useState<string>('')
  const categoryAutocompleteValue = useMemo(() => {
    if (selectedCategoryName && selectedCategoryName.length > 0) {
      return selectedCategoryName
    }
    if (!selectedCategoryId) return ''
    const match = categoryOptions.find(
      (cat: any) => String(cat?.id) === String(selectedCategoryId)
    )
    return match?.name ?? ''
  }, [selectedCategoryId, selectedCategoryName, categoryOptions])
  const [selectedSubcategories, setSelectedSubcategories] = useState<any[]>([])
  const [subcategoryLookup, setSubcategoryLookup] = useState<
    Record<string, { id: any; value: string }>
  >({})
  const prefillAppliedRef = useRef(false)
  const lastPrefillSignatureRef = useRef('')
  const selectAllNextWorkoutsRef = useRef(false)
  const pendingPrefillCategoryRef = useRef<string>('')
  const pendingPrefillSubcategoriesRef = useRef<
    | {
        id: any
        value: string
      }[]
    | null
  >(null)
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
        const cached = subcategoryLookup[String(key)]
        if (cached) return cached
        const label =
          item?.value ?? item?.name ?? item?.label ?? item?.desc ?? ''
        return {
          id: key,
          value: label,
        }
      })
      .filter(Boolean)
  }, [selectedSubcategories, subcategoryLookup])
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
    setSubcategoryLookup((prev) => {
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
  const workoutListParams = useMemo(() => {
    const params: any = {
      page: wpPage,
      per_page: wpPerPage,
      search: wpSearch,
    }
    if (selectedCategoryId) {
      params.category_id = selectedCategoryId
    }
    if (selectedSubcategoryIds.length) {
      params.subcategory_ids = selectedSubcategoryIds.join(',')
    }
    return params
  }, [wpPage, wpPerPage, wpSearch, selectedCategoryId, selectedSubcategoryIds])
  const { data: workoutsResp, isFetching: workoutsLoading } = useWorkoutList(
    workoutListParams as any,
    {
      enabled: shouldLoadWorkouts,
      keepPreviousData: true,
      staleTime: 5 * 60 * 1000,
    }
  )
  const workouts = workoutsResp?.workouts ?? []
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
  const yogaListParams = useMemo(() => {
    const params: any = {
      page: 1,
      per_page: 99999,
    }
    if (yogaCategoryFilter) {
      params.category = yogaCategoryFilter
    }
    return params
  }, [yogaCategoryFilter])
  const { data: yogasResp, isFetching: yogasLoading } = useYogaList(
    yogaListParams as any,
    {
      enabled: shouldLoadYoga,
      keepPreviousData: true,
      staleTime: 5 * 60 * 1000,
    }
  )
  const yogas = yogasResp?.yogas ?? yogasResp?.items ?? []
  const sortedMeditations = useMemo(() => {
    if (!Array.isArray(meditations) || meditations.length === 0) return []
    return meditations.slice().sort((a: any, b: any) => {
      const nameA = (a?.title || a?.name || '').toLowerCase()
      const nameB = (b?.title || b?.name || '').toLowerCase()
      if (nameA === nameB) return 0
      return nameA < nameB ? -1 : 1
    })
  }, [meditations])

  const computeEndDate = (start: string, days?: number) => {
    if (!start || !days || isNaN(days as any)) return ''
    const d = moment(start, 'YYYY-MM-DD', true)
    if (!d.isValid()) return ''
    const end = d.clone().add((days as number) - 1, 'days')
    return end.format('YYYY-MM-DD')
  }

  const getEmbedUrl = (url?: string) => {
    const u = String(url || '')
    if (!u) return ''
    if (u.includes('youtube.com/watch')) {
      try {
        const v = new URL(u).searchParams.get('v')
        return v ? `https://www.youtube.com/embed/${v}` : ''
      } catch {
        return ''
      }
    }
    if (u.includes('youtu.be/')) {
      const id = u.split('youtu.be/')[1]?.split(/[?&]/)[0]
      return id ? `https://www.youtube.com/embed/${id}` : ''
    }
    return ''
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

  const isSelected = (id: any) => selectedWorkouts.some((w) => w?.id === id)
  const toggleSelected = (w: any) => {
    if (!w?.id) return
    setSelectedWorkouts((prev) =>
      prev.some((x) => x?.id === w.id)
        ? prev.filter((x) => x?.id !== w.id)
        : [...prev, w]
    )
  }

  const yogaCanProceedToReview = selectedYogas.length > 0
  const isYogaSelected = (id: any) =>
    selectedYogas.some((y) => String(y?.id) === String(id))
  const toggleYogaSelected = (item: any) => {
    const normalized = toYogaSelectable(item)
    if (!normalized?.id) return
    setSelectedYogas((prev) =>
      prev.some((y) => String(y?.id) === String(normalized.id))
        ? prev.filter((y) => String(y?.id) !== String(normalized.id))
        : [...prev, normalized]
    )
  }

  const getWorkoutGroupKey = (w: any) => {
    const rawSub =
      w?.subcategory?.name ??
      w?.subcategory_name ??
      w?.subcategory ??
      w?.category?.name ??
      'Others'

    return String(rawSub || 'Others')
  }

  const getWorkoutSelectableId = (item: any) =>
    item?.workout_id || item?.workout?.id || item?.id || item?.workoutId

  const collectAllVisibleWorkouts = useCallback((list: any[]) => {
    if (!Array.isArray(list) || list.length === 0) return []
    const unique = new Map<string, any>()

    list.forEach((item: any) => {
      const workoutId = getWorkoutSelectableId(item)
      if (workoutId == null) return
      const key = String(workoutId)
      if (!unique.has(key)) {
        unique.set(key, item)
      }
    })

    return Array.from(unique.values())
  }, [])

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

    const groups = new Map<string, any[]>()

    sorted.forEach((w: any) => {
      const key = getWorkoutGroupKey(w)
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key)!.push(w)
    })

    return Array.from(groups.entries()).map(([name, items]) => ({
      name,
      items,
    }))
  }, [workouts])

  const groupedSelectedWorkouts = useMemo(() => {
    if (!Array.isArray(selectedWorkouts) || selectedWorkouts.length === 0)
      return []

    const groups = new Map<string, any[]>()
    const priorities = new Map<string, number>()

    selectedWorkouts.forEach((w: any) => {
      const key = getWorkoutGroupKey(w)
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key)!.push(w)

      if (!priorities.has(key)) {
        const p = w?.category?.priority ?? 9999
        priorities.set(key, p)
      }
    })

    return Array.from(groups.entries())
      .map(([name, items]) => ({
        name,
        items,
        priority: priorities.get(name) ?? 9999,
      }))
      .sort((a, b) => a.priority - b.priority)
  }, [selectedWorkouts])

  const workoutsById = useMemo(() => {
    const map = new Map<string, any>()
    if (Array.isArray(workouts)) {
      workouts.forEach((workout: any) => {
        const id = getWorkoutSelectableId(workout)
        if (id == null) return
        map.set(String(id), workout)
      })
    }
    return map
  }, [workouts])

  const canProceedToReview = selectedWorkouts.length > 0
  const medCanProceedToReview = selectedMeditations.length > 0
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

  useEffect(() => {
    const fetchOverview = async () => {
      if (!user?.id) return
      if (!user?.subscribed_plan) {
        setOverview(null)
        setCurrentMonth('')
        return
      }
      try {
        setOverviewLoading(true)
        const res = await getActivePlanOverview(user.id)
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
      } catch (e) {
        setOverview(null)
      } finally {
        setOverviewLoading(false)
      }
    }
    fetchOverview()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  const statusColor = (day: any) => {
    if (day?.freeze)
      return 'bg-gradient-to-br from-red-600 to-red-600 text-white border-red-300 shadow-sm'
    const s = String(day?.status || '').toLowerCase()
    if (s === 'today')
      return 'bg-gradient-to-br from-primaryBlue to-primaryBlue text-white border-blue-300 ring-1 ring-blue-200/60 shadow-sm'
    if (s === 'over' || s === 'completed')
      return 'bg-gradient-to-br from-emerald-600 to-emerald-600 text-white border-emerald-300 shadow-sm'
    return 'bg-orange-400 text-white border-gray-200 shadow-sm'
  }

  const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  const getDayCellClass = (cell: any) => {
    if (!cell?.inRange)
      return 'text-gray-400 bg-white border-gray-200 opacity-70 cursor-not-allowed'
    if (cell?.meta?.freeze)
      return 'bg-gradient-to-br from-red-600 to-red-600 text-white border-red-300 shadow-sm cursor-pointer'
    return `${statusColor(cell?.meta)} cursor-pointer`
  }

  const decrementWorkoutCount = (workout: any) => {
    const workoutId = getWorkoutSelectableId(workout)
    if (workoutId == null) return
    const key = String(workoutId)
    if (
      !selectedWorkouts.some((w) => String(getWorkoutSelectableId(w)) === key)
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
    const workoutId = getWorkoutSelectableId(workout)
    if (workoutId == null) return
    const key = String(workoutId)
    if (
      !selectedWorkouts.some((w) => String(getWorkoutSelectableId(w)) === key)
    )
      return

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

      const mainCategoryId =
        workout?.category?.main_category?.id ??
        subMeta?.categoryId ??
        workout?.category?.main_category_id ??
        workout?.category?.parent_id

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

    const preferred = Array.from(buckets.values()).sort((a, b) => {
      if (b.weight === a.weight) {
        return b.subs.size - a.subs.size
      }
      return b.weight - a.weight
    })[0]

    return {
      categoryId: preferred.categoryId,
      categoryName: preferred.categoryName,
      subcategories: Array.from(preferred.subs.values()),
    }
  }, [previouslyAssignedWorkoutIds, workoutsById, subcategoryParentMap])

  type PrefillSelection = {
    categoryId: number | string
    categoryName: string
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
      if (subId === undefined) return

      const mapMeta = subcategoryParentMap[String(subId)]
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
        getSubcategoryLabelFromExercise(exercise) || mapMeta?.label || ''

      buckets[bucketKey].subs.set(String(subId), {
        id: subId,
        value: label || mapMeta?.label || '',
      })
    })

    const bucketList = Object.values(buckets)
    if (!bucketList.length) return null

    bucketList.sort((a, b) => b.subs.size - a.subs.size)
    const preferred = bucketList[0]

    if (!preferred.categoryId) return null

    return {
      categoryId: preferred.categoryId,
      categoryName: preferred.categoryName,
      subcategories: Array.from(preferred.subs.values()),
    }
  }, [dayDetail?.workout_plan?.exercises, subcategoryParentMap])

  const selectionCandidate: PrefillSelection | null = useMemo(() => {
    if (workoutPrefillFromApi) return workoutPrefillFromApi
    if (!previouslySubmittedSelection) return null
    const fallbackSubs = Array.isArray(
      previouslySubmittedSelection.subcategories
    )
      ? previouslySubmittedSelection.subcategories
      : []

    return {
      categoryId: previouslySubmittedSelection.categoryId,
      categoryName: previouslySubmittedSelection.categoryName,
      subcategories: fallbackSubs,
    }
  }, [workoutPrefillFromApi, previouslySubmittedSelection])

  const selectionSignature = useMemo(() => {
    if (!selectionCandidate) return ''
    const subIds = Array.isArray(selectionCandidate.subcategories)
      ? selectionCandidate.subcategories
          .map((sub) =>
            sub?.id === undefined || sub?.id === null ? '' : String(sub.id)
          )
          .filter(Boolean)
          .sort()
          .join('|')
      : ''

    return `${selectionCandidate.categoryId ?? ''}::${subIds}`
  }, [selectionCandidate])

  useEffect(() => {
    setSelectedCategoryId(undefined)
    setSelectedCategoryName('')
    setSelectedSubcategories([])
    setSubcategoryLookup({})
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

    const categoryId = selectionCandidate.categoryId
    const categoryName = selectionCandidate.categoryName
    const subcategories = selectionCandidate.subcategories || []

    const resolvedCategoryName =
      categoryName && categoryName.length > 0
        ? categoryName
        : (categoryOptions.find(
            (cat: any) => String(cat?.id ?? '') === String(categoryId ?? '')
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

    if (categoryId !== undefined && categoryId !== null && categoryId !== '') {
      setSelectedCategoryId((prev) => {
        if (String(prev ?? '') === String(categoryId ?? '')) {
          return prev
        }
        return categoryId
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
    if (!assignOpen) {
      prefillAppliedRef.current = false
      lastPrefillSignatureRef.current = ''
      setSelectedCategoryId(undefined)
      setSelectedCategoryName('')
      setSelectedSubcategories([])
      pendingPrefillCategoryRef.current = ''
      pendingPrefillSubcategoriesRef.current = null
    }
  }, [assignOpen])

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
      return
    }
    if (workoutsLoading) return
    if (!selectAllNextWorkoutsRef.current) return
    if (!Array.isArray(workouts) || workouts.length === 0) {
      setSelectedWorkouts([])
      selectAllNextWorkoutsRef.current = false
      return
    }

    setSelectedWorkouts(collectAllVisibleWorkouts(workouts))
    selectAllNextWorkoutsRef.current = false
  }, [assignOpen, workoutsLoading, workouts])

  const openDayDetail = async (dateStr: string) => {
    if (!user?.id || !dateStr) return
    try {
      setSelectedDate(dateStr)
      setDayDetailOpen(true)
      setDayDetailTab('diet')
      setDayDetailLoading(true)
      const res = await getOverviewDetail(String(user.id), dateStr)
      setDayDetail(res)
    } catch {
      setDayDetail(null)
    } finally {
      setDayDetailLoading(false)
    }
  }
  useEffect(() => {
    if (!assignOpen) return
    setDragIndex(null)
    setDragGroup(null)
    setReviewOpen(false)

    const map = new Map<any, any>()

    if (Array.isArray(dayDetail?.workout_plan?.exercises)) {
      dayDetail.workout_plan.exercises.forEach((ex: any) => {
        const workoutId = ex?.workout_id || ex?.workout?.id || ex?.id
        if (!workoutId || map.has(workoutId)) return
        const repsValue = Number(ex?.reps ?? ex?.workout?.reps)
        map.set(workoutId, {
          id: workoutId,
          name:
            ex?.workout_name ||
            ex?.workout?.name ||
            ex?.name ||
            ex?.title ||
            'Workout',
          video_url:
            ex?.video_url ||
            ex?.workout_video_url ||
            ex?.workout?.video_url ||
            '',
          category: ex?.workout?.category || ex?.category,
          category_name: ex?.workout?.category_name || ex?.category_name,
          subcategory_name:
            ex?.workout?.subcategory_name || ex?.subcategory_name,
          reps: Number.isFinite(repsValue) && repsValue > 0 ? repsValue : 1,
        })
      })
    }

    setSelectedWorkouts(Array.from(map.values()))
  }, [assignOpen, dayDetail?.workout_plan?.exercises])

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
  }, [dayDetail?.yoga_plan?.exercises, yogaAssignOpen])

  useEffect(() => {
    if (!medAssignOpen) return
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
  }, [dayDetail?.meditations, medAssignOpen])

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
      setYogaDragIndex(null)
      setYogaCategoryFilter('')
      setMedAssignOpen(false)
      setMedReviewOpen(false)
      setSelectedMeditations([])
      setMedDragIndex(null)
    }
  }, [dayDetailOpen])

  const refreshDayDetail = async () => {
    if (user?.id && selectedDate) {
      try {
        const refreshed = await getOverviewDetail(String(user.id), selectedDate)
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
    if (!workoutPlanId || !subscriptionId || selectedWorkouts.length === 0)
      return
    setAssigning(true)
    try {
      const exercisesPayload = normalizeExercisePayload(selectedWorkouts)

      if (!exercisesPayload.length) {
        throw new Error('No valid workouts to assign')
      }

      await workoutOverridesBulk(subscriptionId, {
        workout_plan_id: workoutPlanId,
        exercises: exercisesPayload,
      })
      await refreshDayDetail()
      setSelectedWorkouts([])
      setWorkoutCounts({})
      setReviewOpen(false)
      enqueueSnackbar('Workout plan updated successfully', {
        variant: 'success',
      })
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
      setMedReviewOpen(false)
      enqueueSnackbar('Meditation plan updated successfully', {
        variant: 'success',
      })
      refetchMeditationsList?.()
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
        exercises: exercisesPayload,
      })

      await refreshDayDetail()
      setSelectedYogas([])
      setYogaReviewOpen(false)
      enqueueSnackbar('Yoga plan updated successfully', { variant: 'success' })
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

  const handleConfirmToggleFreeze = async () => {
    const sid = String(toggleFreezeRow?.id || overview?.subscription?.id || '')
    if (!sid) {
      enqueueSnackbar('Missing subscription id', { variant: 'error' })
      return
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
        await unfreezeSubscription(sid)
        enqueueSnackbar('Subscription unfrozen successfully', {
          variant: 'success',
        })
      }

      try {
        const res = await getActivePlanOverview(user.id)
        setOverview(res)
      } catch {}
      try {
        const fresh = await getAdminDetails(String(id))
        onRefresh(fresh)
      } catch {}
      closeFreezeDialog()
    } catch (error: any) {
      const resp = error?.response?.data
      const messageFromResponse =
        resp?.message ||
        resp?.error ||
        (Array.isArray(resp?.errors) ? resp.errors.join(', ') : null) ||
        resp?.detail ||
        error?.message
      enqueueSnackbar(messageFromResponse || 'Failed to update subscription', {
        variant: 'error',
      })
    } finally {
      setLoader(false)
    }
  }

  const handleSubFormChange = (
    name: 'start_date' | 'end_date' | 'status' | 'notes' | 'plan_id',
    value: any
  ) => {
    if (name === 'start_date') {
      const plan = allPlans?.find?.(
        (p: any) => String(p?.id) === String(subForm.plan_id)
      )
      const computed = computeEndDate(value, plan?.duration_days)
      setSubForm((prev) => ({
        ...prev,
        start_date: value,
        end_date: computed || prev.end_date,
      }))
      return
    }
    setSubForm((prev) => ({ ...prev, [name]: value }))
  }
  const canSubmit = useMemo(() => {
    return (
      !!user?.id &&
      typeof subForm.plan_id === 'number' &&
      subForm.plan_id > 0 &&
      !!subForm.start_date &&
      !!subForm.end_date &&
      (subForm.status === 0 || subForm.status === 1 || subForm.status === 2)
    )
  }, [user?.id, subForm])

  const subFormErrors = useMemo(() => {
    const errs: {
      plan_id?: string
      start_date?: string
      end_date?: string
    } = {}

    if (!(typeof subForm.plan_id === 'number' && subForm.plan_id > 0)) {
      errs.plan_id = 'Required'
    }

    if (!subForm.start_date) {
      errs.start_date = 'Required'
    }

    if (!subForm.end_date) {
      errs.end_date = 'Required'
    } else if (
      subForm.start_date &&
      moment(subForm.end_date, 'YYYY-MM-DD', true).isValid() &&
      moment(subForm.start_date, 'YYYY-MM-DD', true).isValid() &&
      moment(subForm.end_date).isBefore(moment(subForm.start_date), 'day')
    ) {
      errs.end_date = 'End date cannot be before start date.'
    }

    return errs
  }, [subForm.plan_id, subForm.start_date, subForm.end_date])

  const openSubscriptionDrawer = (isUpdate = false) => {
    setSubscriptionEditMode(isUpdate)
    setSelectedPlanOption(null)
    setSubSubmitAttempted(false)
    setSubForm({
      start_date: '',
      end_date: '',
      status: 0,
      notes: '',
      plan_id: '',
    })
    setDrawerOpen(true)
  }
  const closeSubscriptionDrawer = () => {
    setDrawerOpen(false)
    setSubscriptionEditMode(false)
  }

  const handleSubmitSubscription = async () => {
    setSubSubmitAttempted(true)
    if (!canSubmit) return
    try {
      setSubmitting(true)
      const payload: any = {
        subscription: {
          user_id: user?.id,
          plan_id: subForm.plan_id,
          start_date: subForm.start_date,
          end_date: subForm.end_date,
          status: 0,
        },
      }
      if (subForm.notes && String(subForm.notes).trim() !== '') {
        payload.subscription.notes = subForm.notes
      }
      await createSubscription(payload)
      try {
        const fresh = await getAdminDetails(String(id))
        onRefresh(fresh)
      } catch {}
      enqueueSnackbar('Subscription created successfully', {
        variant: 'success',
      })
      setSelectedPlanOption(null)
      setDrawerOpen(false)
      // Force full page refresh to reflect new subscription state
      if (typeof window !== 'undefined' && window.location) {
        window.location.reload()
      }
    } catch {
    } finally {
      setSubmitting(false)
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
          {loginRole !== 'nutritionist' &&
            !hasPlanOverview &&
            !subscribedPlan && (
              <div className="flex justify-end">
                <Button
                  className="primaryButton"
                  label="Add Subscription"
                  onClick={() => openSubscriptionDrawer(false)}
                />
              </div>
            )}
          <div
            className={`relative border rounded-lg p-4 pt-6 ${subscribedPlan ? 'mt-4' : ''}`}
          >
            <div className="absolute -top-3 left-3 px-2 z-10 bg-mainBgColor">
              <span className="text-lg font-medium text-gray-700">
                {hasPlanOverview || subscribedPlan
                  ? 'Subscribed Plan'
                  : 'Interested Plans'}
              </span>
            </div>
            {hasPlanOverview || subscribedPlan ? (
              <div className="flex flex-col gap-4">
                <div className="border rounded-lg p-3 bg-white flex items-start justify-between gap-4">
                  <div>
                    <div className="text-sm font-medium mb-1">
                      {safeStr(
                        overview?.subscription?.plan_name ??
                          overview?.subscription?.name
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      Category:{' '}
                      {safeStr(
                        overview?.subscription?.plan_category ??
                          overview?.subscription?.category
                      )}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {overview?.subscription?.start_date &&
                      overview?.subscription?.end_date ? (
                        <>
                          <span>
                            Start Date:{' '}
                            <span className="font-semibold">
                              {moment(overview.subscription.start_date).format(
                                'MMM D, YYYY'
                              )}
                            </span>
                          </span>

                          <span className="mx-2">•</span>
                          <span>
                            End Date:{' '}
                            <span className="font-semibold">
                              {moment(overview.subscription.end_date).format(
                                'MMM D, YYYY'
                              )}
                            </span>
                          </span>
                        </>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {overview?.subscription?.plan_id ? (
                      <a
                        href={`/plans/${overview.subscription.plan_id}`}
                        className="text-xs text-primaryBlue underline whitespace-nowrap mt-1"
                      >
                        View plan details →
                      </a>
                    ) : null}
                    {loginRole !== 'nutritionist' && (
                      <Button
                        className="primaryButton"
                        label="Update Subscription"
                        onClick={() => openSubscriptionDrawer(true)}
                      />
                    )}
                  </div>
                </div>
                <div className="flex justify-end gap-2">
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
                </div>
                <div className="bg-white border border-gray-300 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm font-medium">Plan Calendar</div>
                    <div className="flex gap-3 text-xs">
                      <div className="flex items-center gap-1">
                        <span className="w-3 h-3 rounded bg-primaryBlue inline-block"></span>
                        Today
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="w-3 h-3 rounded bg-orange-400 inline-block"></span>
                        Upcoming
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="w-3 h-3 rounded bg-green-500 inline-block"></span>
                        Complete
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="w-3 h-3 rounded bg-red-400 inline-block"></span>
                        Freeze
                      </div>
                    </div>
                  </div>
                  {overviewLoading && (
                    <div className="text-xs text-gray-500">
                      Loading calendar...
                    </div>
                  )}
                  {!overviewLoading &&
                  overview?.subscription?.start_date &&
                  overview?.subscription?.end_date ? (
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <button
                          type="button"
                          onClick={goPrev}
                          disabled={!canPrev()}
                          className={`px-2 py-1 text-xs border rounded ${canPrev() ? 'text-gray-700' : 'text-gray-300 cursor-not-allowed'}`}
                        >
                          ◀
                        </button>
                        <div className="text-xs font-medium">
                          {buildMonthCells(currentMonth).title}
                        </div>
                        <button
                          type="button"
                          onClick={goNext}
                          disabled={!canNext()}
                          className={`px-2 py-1 text-xs border rounded ${canNext() ? 'text-gray-700' : 'text-gray-300 cursor-not-allowed'}`}
                        >
                          ▶
                        </button>
                      </div>
                      {(() => {
                        const m = buildMonthCells(currentMonth)
                        return (
                          <>
                            <div className="grid grid-cols-7 gap-1 text-[10px] text-gray-500 mb-1 bg-white">
                              {WEEK_DAYS.map((w) => (
                                <div key={w} className="py-1 text-center">
                                  {w}
                                </div>
                              ))}
                            </div>
                            <div className="grid grid-cols-7">
                              {m.cells.map((c: any) => (
                                <div
                                  key={c.key}
                                  className={`relative h-44 border px-2 py-1 text-[14px] transition-colors duration-150 ${getDayCellClass(c)}`}
                                  title={
                                    c?.meta?.date
                                      ? `${c.meta.date}  •  Diet: ${c?.meta?.diet_summary?.total_items ?? 0}  •  Workout: ${c?.meta?.workout_summary?.total_exercises ?? 0}  •  Yoga: ${c?.meta?.yoga_summary?.total_exercises ?? 0}  •  Meditation: ${c?.meta?.meditation_summary?.total_items ?? 0}`
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
                                  <div className="flex flex-col h-full w-full">
                                    <div className="flex justify-between">
                                      <div className="text-[12px] font-medium">
                                        {c?.label ?? ''}
                                      </div>
                                      {c?.meta?.day_number ? (
                                        <div className="text-[12px] font-medium">
                                          Day - {c?.meta?.day_number}
                                        </div>
                                      ) : null}
                                    </div>
                                    {c?.inRange && c?.meta ? (
                                      <div className="mt-1 text-[10px] leading-4">
                                        <div className="flex items-center justify-between border rounded-[5px] bg-red-100 text-black px-2 py-1">
                                          <span>Diet</span>
                                          <span className="font-medium">
                                            {c?.meta?.diet_summary
                                              ?.total_items ?? 0}
                                          </span>
                                        </div>
                                        <div className="flex items-center justify-between border rounded-[5px] bg-violet-200 text-black px-2 py-1 mt-2">
                                          <span>Workout</span>
                                          <span className="font-medium">
                                            {c?.meta?.workout_summary
                                              ?.total_exercises ?? 0}
                                          </span>
                                        </div>
                                        <div className="flex items-center justify-between border rounded-[5px] bg-green-200 text-black px-2 py-1 mt-2">
                                          <span>Yoga</span>
                                          <span className="font-medium">
                                            {c?.meta?.yoga_summary
                                              ?.total_exercises ?? 0}
                                          </span>
                                        </div>
                                        <div className="flex items-center justify-between border rounded-[5px] bg-blue-200 text-black px-2 py-1 mt-2">
                                          <span>Meditation</span>
                                          <span className="font-medium">
                                            {c?.meta?.meditation_summary
                                              ?.total_items ?? 0}
                                          </span>
                                        </div>
                                      </div>
                                    ) : null}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </>
                        )
                      })()}
                    </div>
                  ) : (
                    !overviewLoading && (
                      <div className="text-xs text-gray-500">
                        No calendar data
                      </div>
                    )
                  )}
                </div>
              </div>
            ) : (
              <div
                className={`grid grid-cols-1 ${
                  Array.isArray(plans) && plans.length > 0
                    ? 'md:grid-cols-2'
                    : 'md:grid-cols-1'
                } gap-4`}
              >
                {Array.isArray(plans) && plans.length > 0 ? (
                  plans.map((p: any) => (
                    <div key={p?.id} className="border rounded-lg p-3 bg-white">
                      <div className="text-sm font-medium mb-1">
                        {safeStr(p?.name)}
                      </div>
                      <div className="text-xs text-gray-500">
                        Category: {safeStr(p?.category)}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-10 min-h-[60vh] flex flex-col items-center justify-center text-gray-500">
                    <Icons name="no-data-icon" />
                    <div className="mt-3 text-sm">No interested plans</div>
                  </div>
                )}
              </div>
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
              <div className="flex flex-col md:flex-row md:items-end gap-2 w-full md:w-auto">
                <div className="flex-1 min-w-[180px]">
                  <AutoComplete
                    placeholder="Select category"
                    desc="name"
                    descId="id"
                    type="custom_search_select"
                    data={categoryOptions}
                    value={categoryAutocompleteValue}
                    name="assign_category"
                    onChange={(option: any) => {
                      const id = option?.id ?? option?.value ?? ''
                      const name = option?.name ?? option?.label ?? ''
                      const prevIdKey = String(selectedCategoryId ?? '')
                      const nextIdKey = String(id || '')
                      const categoryActuallyChanged = prevIdKey !== nextIdKey
                      const matchedCategory = categoryOptions.find(
                        (cat: any) => String(cat?.id ?? '') === nextIdKey
                      )
                      const normalizedPrefillSubcategories =
                        id && matchedCategory
                          ? (deriveSubcategorySelection(
                              matchedCategory?.subcategories || []
                            ) as { id: any; value: string }[])
                          : []
                      setSelectedCategoryId(id || undefined)
                      setSelectedCategoryName(name || '')
                      if (id && normalizedPrefillSubcategories.length) {
                        pendingPrefillCategoryRef.current = nextIdKey
                        pendingPrefillSubcategoriesRef.current =
                          normalizedPrefillSubcategories
                      } else {
                        pendingPrefillCategoryRef.current = ''
                        pendingPrefillSubcategoriesRef.current = null
                      }
                      setSelectedSubcategories([])
                      if (assignOpen && categoryActuallyChanged) {
                        selectAllNextWorkoutsRef.current = true
                        setSelectedWorkouts([])
                      }
                    }}
                  />
                </div>
                <div className="flex-1 min-w-[200px]">
                  <AutoComplete
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
                      if (!selectedCategoryId) return []

                      const raw =
                        await getWorkoutPlanSubcategories(selectedCategoryId)

                      let options = Array.isArray(raw) ? raw : []

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

                      if (prevKey === nextKey) {
                        setSelectedSubcategories(normalized)
                        return
                      }

                      setSelectedSubcategories(normalized)
                      if (assignOpen) {
                        selectAllNextWorkoutsRef.current = true
                        setSelectedWorkouts([])
                      }
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col md:flex-row md:items-center gap-2">
              <input
                value={wpSearch}
                onChange={(e) => {
                  setWpSearch(e.target.value)
                  setWpPage(1)
                }}
                placeholder="Search workouts..."
                className="border rounded px-2 py-1 text-sm w-full md:w-auto"
              />
            </div>

            {workoutsLoading && (
              <div className="text-xs text-gray-500 p-2">Loading...</div>
            )}
            {!workoutsLoading && workouts.length === 0 && (
              <div className="text-xs text-gray-500 p-2">
                No workouts found.
              </div>
            )}

            {!workoutsLoading && workouts.length > 0 && (
              <div className="flex flex-col gap-4">
                {groupedWorkouts.map((group) => {
                  const first = group.items?.[0]
                  const categoryName =
                    first?.category?.main_category?.name ??
                    first?.category_name ??
                    'Others'
                  const legendText = categoryName
                    ? `${categoryName} - ${group.name}`
                    : group.name

                  return (
                    <fieldset
                      key={group.name}
                      className="border border-gray-300 rounded-xl p-4 bg-white"
                    >
                      <legend className="px-2 text-md font-semibold text-gray-600">
                        {legendText}
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
                              {embed ? (
                                <div className="w-full h-40 bg-black/5">
                                  <iframe
                                    src={embed}
                                    title={`Workout Video ${w?.id}`}
                                    className="w-full h-full"
                                    allowFullScreen
                                  />
                                </div>
                              ) : url ? (
                                <video
                                  className="w-full h-32 object-cover"
                                  src={String(url)}
                                  muted
                                  controls
                                />
                              ) : (
                                <div className="w-full h-36 flex items-center justify-center text-xxs text-gray-500 bg-gray-50">
                                  No video
                                </div>
                              )}

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
          setSelectedWorkouts([])
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
        <div className="mt-4">
          <h2 className="text-lg font-bold flex items-center gap-2 mb-3">
            <span className="text-blue-600 text-xl">🎬</span>
            <span className="text-gray-600  bg-clip-text ">
              Drag and drop the videos below into the order you want them to
              appear in the workout plan, then click{' '}
              <span className="font-semibold">Assign</span> to save this
              sequence.
            </span>
          </h2>
          {selectedWorkouts.length > 0 ? (
            <div className="flex flex-col gap-4">
              {groupedSelectedWorkouts.map((group) => {
                const first = group.items?.[0]
                const categoryName =
                  first?.category?.main_category?.name ??
                  first?.category_name ??
                  'Others'
                const legendText = categoryName
                  ? `${categoryName} - ${group.name}`
                  : group.name

                return (
                  <fieldset
                    key={group.name}
                    className="border border-gray-300 rounded-xl p-4 bg-white"
                  >
                    <legend className="px-2 text-md font-semibold text-gray-600">
                      {legendText}
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
                            onDragStart={() => onDragStart(index, group.name)}
                            onDragOver={(e) => onDragOver(e)}
                            onDrop={() => onDrop(index, group.name)}
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

                            <div className="px-4 py-2 text-xs text-gray-600">
                              Hold and drag to rearrange
                            </div>
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
              <div className="text-sm font-medium">Yoga</div>
              <div className="flex items-center gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-gray-600">Category</label>
                  <select
                    className="border rounded px-2 py-1 text-sm"
                    value={yogaCategoryFilter}
                    onChange={(e) => {
                      setYogaCategoryFilter(e.target.value)
                    }}
                  >
                    <option value="">All</option>
                    {YOGA_CATEGORY_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
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
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 xl:grid-cols-8 gap-4">
                {yogas.map((y: any) => {
                  const url = y?.video_url || ''
                  const embed = getEmbedUrl(url)
                  const checked = isYogaSelected(y?.id)
                  return (
                    <div
                      key={y?.id}
                      className={`border rounded bg-white overflow-hidden w-full cursor-pointer ${
                        checked ? 'ring-2 ring-primary/30' : ''
                      }`}
                      onClick={(e) => {
                        if (
                          (e.target as HTMLElement).tagName.toLowerCase() !==
                          'input'
                        ) {
                          toggleYogaSelected(y)
                        }
                      }}
                    >
                      {embed ? (
                        <div className="w-full h-40 bg-black/5">
                          <iframe
                            src={embed}
                            title={`Yoga Video ${y?.id}`}
                            className="w-full h-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                          />
                        </div>
                      ) : url ? (
                        <video
                          className="w-full h-32 object-cover"
                          src={String(url)}
                          muted
                          controls
                        />
                      ) : (
                        <div className="w-full h-36 flex items-center justify-center text-xxs text-gray-500 bg-gray-50">
                          No video
                        </div>
                      )}
                      <div className="px-3 py-2 text-sm flex items-start justify-between gap-2">
                        <div className="font-medium line-clamp-1">
                          {y?.name || y?.title || 'Untitled'}
                        </div>
                        <input
                          type="checkbox"
                          className="mt-0.5 shrink-0"
                          checked={checked}
                          onChange={() => toggleYogaSelected(y)}
                        />
                      </div>
                    </div>
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
          setSelectedYogas([])
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
        <div className="mt-4">
          <h2 className="text-lg font-bold mb-1 flex items-center gap-2 mb-3">
            <span className="text-blue-600 text-xl">🧘</span>
            <span className="text-gray-600  bg-clip-text ">
              Drag and drop the videos below into the order you want them to
              appear in the yoga plan, then click{' '}
              <span className="font-semibold">Assign</span> to save this
              sequence.
            </span>
          </h2>
          {selectedYogas.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
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
                        {i + 1}. {y?.name || y?.title || 'Untitled'}
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

                    <div className="px-4 py-2 text-xs text-gray-600">
                      Hold and drag to rearrange
                    </div>
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

            {medLoading && (
              <div className="text-xs text-gray-500 p-2">Loading...</div>
            )}
            {!medLoading && sortedMeditations.length === 0 && (
              <div className="text-xs text-gray-500 p-2">
                No meditations found.
              </div>
            )}

            {!medLoading && sortedMeditations.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {sortedMeditations.map((m: any) => {
                  const url = m?.video_url || m?.meditation_video_url || ''
                  const embed = getEmbedUrl(url)
                  const medId = getMeditationId(m)
                  const checked = isMeditationSelected(medId)
                  const title = m?.name || m?.title || 'Untitled'
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
                      {embed ? (
                        <div className="w-full h-40 bg-black/5">
                          <iframe
                            src={embed}
                            title={`Meditation Video ${medId}`}
                            className="w-full h-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                          />
                        </div>
                      ) : url ? (
                        <video
                          className="w-full h-32 object-cover"
                          src={String(url)}
                          muted
                          controls
                        />
                      ) : (
                        <div className="w-full h-36 flex items-center justify-center text-xxs text-gray-500 bg-gray-50">
                          No video
                        </div>
                      )}
                      <div className="px-3 py-2 text-sm flex items-start justify-between gap-2">
                        <div className="font-medium line-clamp-1">{title}</div>
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
          setSelectedMeditations([])
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
        <div className="mt-4">
          <h2 className="text-lg font-bold mb-1 flex items-center gap-2 mb-3">
            <span className="text-blue-600 text-xl">🧘</span>
            <span className="text-gray-600  bg-clip-text ">
              Drag and drop the videos below into the order you want them to
              appear in the meditation plan, then click{' '}
              <span className="font-semibold">Assign</span> to save this
              sequence.
            </span>
          </h2>
          {selectedMeditations.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {selectedMeditations.map((m: any, i: number) => {
                const rawUrl = m?.video_url || m?.meditation_video_url || ''
                const url = String(rawUrl || '')
                const embed = getEmbedUrl(url)
                const title = m?.name || m?.title || 'Untitled'
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

                    <div className="px-4 py-2 text-xs text-gray-600">
                      Hold and drag to rearrange
                    </div>
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
        isOpen={drawerOpen}
        onClose={() => closeSubscriptionDrawer()}
        title={
          subscriptionEditMode ? 'Update Subscription' : 'Add Subscription'
        }
        onSubmit={handleSubmitSubscription}
        secondaryAction={() => closeSubscriptionDrawer()}
        secondaryActionLabel="Close"
        actionLabel="Save"
        actionLoader={submitting}
        small={false}
        body={
          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Plans <span className="text-red-500">*</span>
              </label>
              <AutoComplete
                name="plan_id"
                type="custom_search_select"
                desc="name"
                descId="id"
                data={allPlans}
                placeholder="Select a plan"
                value={selectedPlanOption?.name ?? ''}
                onChange={(opt: any) => {
                  setSelectedPlanOption(opt)
                  const pid =
                    typeof opt?.id === 'number'
                      ? opt.id
                      : parseInt(opt?.id, 10) || ''
                  handleSubFormChange('plan_id', pid)
                  setSubForm((prev) => ({
                    ...prev,
                    start_date: '',
                    end_date: '',
                  }))
                }}
                required
              />
              {subSubmitAttempted && subFormErrors.plan_id && (
                <div className="mt-1 text-xs text-red-500">
                  {subFormErrors.plan_id}
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Start date <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  className={`w-full border rounded px-3 py-2 text-xs ${subForm.start_date ? 'pr-7' : ''}`}
                  value={subForm.start_date}
                  onChange={(e) =>
                    handleSubFormChange('start_date', e.target.value)
                  }
                  required
                  min={moment().format('YYYY-MM-DD')}
                />
                {subForm.start_date ? (
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    onClick={() => {
                      setSubForm((prev) => ({
                        ...prev,
                        start_date: '',
                        end_date: '',
                      }))
                    }}
                    aria-label="Clear start date"
                  >
                    <Icons name="close" className="text-gray-500" />
                  </button>
                ) : null}
              </div>
              {subSubmitAttempted && subFormErrors.start_date && (
                <div className="mt-1 text-xs text-red-500">
                  {subFormErrors.start_date}
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                End date <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  className={`w-full border rounded px-3 py-2 text-xs ${subForm.end_date ? 'pr-7' : ''}`}
                  value={subForm.end_date}
                  onChange={(e) =>
                    handleSubFormChange('end_date', e.target.value)
                  }
                  required
                  disabled
                />
                {subForm.end_date ? (
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    onClick={() => {
                      setSubForm((prev) => ({
                        ...prev,
                        end_date: '',
                      }))
                    }}
                    aria-label="Clear end date"
                  >
                    <Icons name="close" className="text-gray-500" />
                  </button>
                ) : null}
              </div>
              {subSubmitAttempted && subFormErrors.end_date && (
                <div className="mt-1 text-xs text-red-500">
                  {subFormErrors.end_date}
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Notes (optional)
              </label>
              <textarea
                className="w-full border rounded px-3 py-2 text-xs"
                rows={3}
                value={subForm.notes}
                onChange={(e) => handleSubFormChange('notes', e.target.value)}
                placeholder="Optional notes"
              />
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
                <label className="text-sm text-gray-600">Reason</label>
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
                  <label className="text-sm text-gray-600">Start date</label>
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
                  <label className="text-sm text-gray-600">End date</label>
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

      <DialogModal
        isOpen={dayDetailOpen}
        onClose={() => setDayDetailOpen(false)}
        title={
          dayDetail
            ? `Plan Day ${safeStr(dayDetail?.day_number)} • ${moment(dayDetail?.date).format('MMM D, YYYY')}`
            : selectedDate
              ? `Day Details • ${moment(selectedDate).format('MMM D, YYYY')}`
              : 'Day Details'
        }
        onSubmit={() => setDayDetailOpen(false)}
        actionLabel="Close"
        actionLoader={false}
        small={false}
        body={
          <div className="flex flex-col gap-4">
            {dayDetailLoading && (
              <div className="text-xs text-gray-500">
                Loading day details...
              </div>
            )}
            {!dayDetailLoading && !dayDetail && (
              <div className="text-xs text-gray-500">No details available.</div>
            )}
            {!dayDetailLoading && dayDetail && (
              <DayDetailTabsSection
                dayDetail={dayDetail}
                dayDetailTab={dayDetailTab}
                onChangeTab={(tabId) => setDayDetailTab(tabId)}
                isNutritionist={isNutritionist}
                subscriptionId={overview?.subscription?.id}
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
        }
      />
    </>
  )
}

function safeStr(v: any) {
  if (v === null || v === undefined || v === '') return '--'
  return String(v)
}
