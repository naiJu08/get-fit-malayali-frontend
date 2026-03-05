import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'

import { useQuery } from '@tanstack/react-query'
import { AutoComplete } from 'qbs-core'

import Icons from '../../../../components/common/icons'
import InfoBox from '../../../../components/app/alertBox/infoBox'
import { useSnackbarManager } from '../../../../components/common/snackbar'
import {
  getWorkoutPlanDetails,
  deleteWorkoutPlanExercise,
  getWorkoutPlanSubcategories,
} from './api'
import CustomDrawer from '../../../../components/common/drawer'
import Tab from '../../../../components/common/tab/Tab'
import { TabItemProps } from '../../../../common/types'
import { useWorkoutList } from '../../../Workout/api'
import { useAuthStore } from '../../../../store/authStore'
import { useAddExercises } from './api'
import { TabContainer } from '../../../../components/common'
import apiUrl from '../../../../apis/api.url'
import { getData } from '../../../../apis/api.helpers'
import WorkoutPlanForm from './create'

const getWorkoutSelectableId = (item: any) =>
  item?.workout_id || item?.workout?.id || item?.id || item?.workoutId

function DetailsTabContent({
  wp,
  loading,
  error,
}: {
  wp: any
  loading: boolean
  error: string
}) {
  return (
    <>
      {/* Details Content */}
      {loading && (
        <div className="p-6">
          <InfoBox content="Loading workout plan details..." />
        </div>
      )}
      {error && !loading && (
        <div className="p-6">
          <InfoBox content={error} />
        </div>
      )}
      {!loading && !error && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <DetailItem label="Title" value={wp?.title} />
            <DetailItem label="Plan Id" value={safeStr(wp?.plan_id)} />
            <DetailItem label="Day Number" value={safeStr(wp?.day_number)} />
            <DetailItem
              label="Exercises"
              value={safeStr(wp?.exercises_count)}
            />
            <DetailItem
              label="Total Duration (mins)"
              value={safeStr(wp?.total_duration)}
            />
            <DetailItem label="Description" value={safeStr(wp?.description)} />
          </div>
        </>
      )}
    </>
  )
}

function AssignTabContent({
  wp,
  loading,
  error,
  // selectedWorkouts,
  getEmbedUrl,
  refreshDetails,
}: any) {
  const [selectedExerciseIds, setSelectedExerciseIds] = useState<any[]>([])
  const [removedExerciseIds, setRemovedExerciseIds] = useState<any[]>([])
  const { enqueueSnackbar } = useSnackbarManager()
  const roleName = useAuthStore((s) => s.roleData?.name?.toLowerCase?.())
  const isNutritionist = roleName === 'nutritionist'
  const handleRemoveSelected = async () => {
    if (!wp?.id || selectedExerciseIds.length === 0) return
    try {
      const res: any = await deleteWorkoutPlanExercise(
        wp.id,
        selectedExerciseIds
      )
      setRemovedExerciseIds((prev) => [...prev, ...selectedExerciseIds])
      setSelectedExerciseIds([])
      const msg = res?.message || 'Exercises removed successfully'
      enqueueSnackbar(msg, { variant: 'success' })
      await refreshDetails?.()
    } catch (e: any) {
      console.error(e)
    }
  }

  const exercises = Array.isArray(wp?.exercises)
    ? wp.exercises
        .slice()
        .sort(
          (a: any, b: any) =>
            (a?.sequence_number ?? 0) - (b?.sequence_number ?? 0)
        )
        .filter(
          (ex: any) =>
            !removedExerciseIds.includes(
              ex?.workout_id || ex?.workout?.id || ex?.id
            )
        )
    : []
  const groupedAssignedExercises = useMemo(() => {
    if (!Array.isArray(exercises) || exercises.length === 0) return []

    const groups = new Map<string, any[]>()

    exercises.forEach((ex: any) => {
      const catName =
        ex?.category?.main_category?.name ??
        ex?.category?.name ??
        ex?.workout?.category?.main_category?.name ??
        ex?.workout?.category_name ??
        'Others'

      const subName =
        ex?.category?.name ??
        ex?.workout?.category?.name ??
        ex?.workout?.subcategory_name ??
        ex?.workout?.subcategory?.name ??
        'Others'

      const legendText = `${catName} - ${subName}`

      if (!groups.has(legendText)) groups.set(legendText, [])
      groups.get(legendText)!.push(ex)
    })

    return Array.from(groups.entries()).map(([legend, items]) => ({
      legend,
      items,
    }))
  }, [exercises])

  return (
    <>
      {loading && (
        <div className="p-6">
          <InfoBox content="Loading workout plan details..." />
        </div>
      )}
      {error && !loading && (
        <div className="p-6">
          <InfoBox content={error} />
        </div>
      )}
      {!loading && !error && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <div className="text-md font-semibold">Exercises</div>
            <div className="flex flex-wrap items-center gap-3">
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

              {!isNutritionist &&
                exercises.length > 0 &&
                selectedExerciseIds.length > 0 && (
                  <button
                    className="px-3 py-1 text-xs border rounded btn-primary"
                    onClick={handleRemoveSelected}
                  >
                    Remove Exercise
                  </button>
                )}
            </div>
          </div>
          {exercises.length > 0 ? (
            <div className="flex flex-col gap-4">
              {groupedAssignedExercises.map((group) => (
                <fieldset
                  key={group.legend}
                  className="border border-gray-300 rounded-xl p-4 bg-white"
                >
                  <legend className="px-2 text-md font-semibold text-gray-600">
                    {group.legend}
                  </legend>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-8 gap-3 place-items-stretch">
                    {group.items.map((ex: any) => {
                      const rawUrl =
                        ex?.video_url ||
                        ex?.workout_video_url ||
                        ex?.workout?.video_url ||
                        ''
                      const url = String(rawUrl || '')
                      const embed = getEmbedUrl(url)
                      return (
                        <div
                          key={ex?.id}
                          className="border rounded bg-white overflow-hidden w-full"
                        >
                          {/* VIDEO BOX */}
                          <div className="relative w-full h-36 bg-black/5">
                            {embed ? (
                              <iframe
                                src={embed}
                                title={`Workout Video ${ex?.workout_id ?? ex?.id}`}
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

                            <div className="absolute top-2 right-2 right-2 flex flex-wrap gap-1 text-[11px]">
                              <span className="items-center gap-1 rounded-sm bg-blue-600/90 text-white px-2 py-0.5 font-semibold backdrop-blur">
                                <Icons name="repeat" className="w-3 h-3" />
                                {ex?.reps ?? '--'}
                              </span>
                              <span className="items-center gap-1 rounded-sm bg-amber-500 text-white px-2 py-0.5 font-medium backdrop-blur">
                                <Icons name="activity" className="w-3 h-3" />
                                {ex?.intensity_level
                                  ? ex.intensity_level
                                  : '--'}
                              </span>
                              <span className="items-center gap-1 rounded-sm bg-green-600/90 text-white px-2 py-0.5 font-medium backdrop-blur">
                                <Icons name="clock" className="w-3 h-3" />
                                {ex?.duration_minutes
                                  ? `${ex.duration_minutes}s`
                                  : '--'}
                              </span>
                            </div>
                          </div>

                          {/* TITLE BELOW VIDEO */}
                          <div className="px-2 py-2 text-xs">
                            <div className="font-medium line-clamp-1">
                              {ex?.workout_name || 'Untitled'}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </fieldset>
              ))}
            </div>
          ) : (
            <div className="text-sm text-gray-600">No exercises assigned.</div>
          )}
        </>
      )}
    </>
  )
}

export default function WorkoutPlanDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { enqueueSnackbar } = useSnackbarManager()
  const [searchParams, setSearchParams] = useSearchParams()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string>('')
  const currentTab = (
    searchParams.get('tab') === 'assign' ? 'assign' : 'details'
  ) as 'details' | 'assign'
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
  const [editPlanOpen, setEditPlanOpen] = useState(false)
  // const { mutateAsync: addExerciseAsync } = useAddExercise()
  const { mutateAsync: addExercisesAsync } = useAddExercises()
  const roleName = useAuthStore((s) => s.roleData?.name?.toLowerCase?.())
  const isNutritionist = roleName === 'nutritionist'

  const { data: categoriesResponse } = useQuery(
    ['workout_categories_for_assign'],
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
          label: sub?.value ?? sub?.name ?? sub?.label ?? '',
        }
      })
    })

    return map
  }, [categoryOptions])

  const [selectedCategoryId, setSelectedCategoryId] = useState<
    number | string | undefined
  >(undefined)
  const [selectedCategoryName, setSelectedCategoryName] = useState<string>('')
  const [selectedSubcategories, setSelectedSubcategories] = useState<any[]>([])
  const [subcategoryLookup, setSubcategoryLookup] = useState<
    Record<string, any>
  >({})
  const [workoutFiltersEnabled, setWorkoutFiltersEnabled] = useState(false)
  const prefillAppliedRef = useRef(false)
  const drawerSelectionInitializedRef = useRef(false)
  const selectAllNextWorkoutsRef = useRef(false)
  const userSelectionTouchedRef = useRef(false)
  const wp = data?.workout_plan || data || {}

  const categoryAutocompleteValue = useMemo(() => {
    if (!selectedCategoryId) return ''
    const match = categoryOptions.find(
      (cat: any) => String(cat?.id) === String(selectedCategoryId)
    )
    if (match?.name) return match.name
    return selectedCategoryName
  }, [categoryOptions, selectedCategoryId, selectedCategoryName])

  useEffect(() => {
    setSelectedCategoryId(undefined)
    setSelectedCategoryName('')
    setSelectedSubcategories([])
    prefillAppliedRef.current = false
    drawerSelectionInitializedRef.current = false
  }, [wp?.id])

  const refreshDetails = useCallback(async () => {
    try {
      setLoading(true)
      const res = await getWorkoutPlanDetails(String(id))
      setData(res)
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to load workout plan')
    } finally {
      setLoading(false)
    }
  }, [id])

  const handleAssignDrawerClose = useCallback(async () => {
    setAssignOpen(false)
    setWpSearch('')
    setWpPage(1)
    setSelectedCategoryId(undefined)
    setSelectedCategoryName('')
    setSelectedSubcategories([])
    setWorkoutFiltersEnabled(false)
    prefillAppliedRef.current = false
    drawerSelectionInitializedRef.current = false
    selectAllNextWorkoutsRef.current = false
    userSelectionTouchedRef.current = false
    await refreshDetails()
  }, [refreshDetails])

  useEffect(() => {
    if (assignOpen) return
    if (reviewOpen) return
    drawerSelectionInitializedRef.current = false
    selectAllNextWorkoutsRef.current = false
    setWorkoutFiltersEnabled(false)
  }, [assignOpen, reviewOpen])

  useEffect(() => {
    let mounted = true
    const run = async () => {
      try {
        setLoading(true)
        const res = await getWorkoutPlanDetails(String(id))
        if (!mounted) return
        setData(res)
      } catch (e: any) {
        if (!mounted) return
        setError(e?.response?.data?.message || 'Failed to load workout plan')
      } finally {
        if (!mounted) return
        setLoading(false)
      }
    }
    if (id) run()
    return () => {
      mounted = false
    }
  }, [id])

  const previouslySubmittedSelection = useMemo(() => {
    if (!Array.isArray(wp?.exercises) || wp.exercises.length === 0) return null

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

    wp.exercises.forEach((exercise: any) => {
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
  }, [wp?.exercises, subcategoryParentMap])

  // Derive selected subcategory IDs from multi-select
  const selectedSubcategoryIds = useMemo(
    () =>
      (selectedSubcategories || [])
        .map((s: any) => s?.id)
        .filter((id: any) => id != null),
    [selectedSubcategories]
  )

  const updateSubcategoryLookup = useCallback((options: any[]) => {
    if (!Array.isArray(options) || options.length === 0) return
    setSubcategoryLookup((prev) => {
      const next = { ...prev }
      options.forEach((opt) => {
        const key = opt?.id ?? opt?.value
        if (key !== undefined && key !== null) {
          next[String(key)] = opt
        }
      })
      return next
    })
  }, [])

  useEffect(() => {
    if (!assignOpen) return
    if (!previouslySubmittedSelection || prefillAppliedRef.current) return

    const { categoryId, categoryName, subcategories } =
      previouslySubmittedSelection

    if (categoryId !== undefined && categoryId !== null && categoryId !== '') {
      setSelectedCategoryId(categoryId)

      const resolvedCategoryName =
        categoryName && categoryName.length > 0
          ? categoryName
          : (categoryOptions.find(
              (cat: any) => String(cat?.id) === String(categoryId)
            )?.name ?? '')

      setSelectedCategoryName(resolvedCategoryName)
    }

    if (Array.isArray(subcategories) && subcategories.length > 0) {
      setSelectedSubcategories(subcategories)
      updateSubcategoryLookup(subcategories)
    }

    // Enable filters when pre-filling selection
    setWorkoutFiltersEnabled(true)
    prefillAppliedRef.current = true
  }, [
    assignOpen,
    previouslySubmittedSelection,
    categoryOptions,
    updateSubcategoryLookup,
  ])

  const assignedRepsMap = useMemo(() => {
    const map = new Map<string, number>()
    if (!Array.isArray(wp?.exercises)) return map

    wp.exercises.forEach((exercise: any) => {
      const workoutId = getWorkoutSelectableId(exercise)
      if (workoutId === undefined || workoutId === null) return
      const key = String(workoutId)
      if (map.has(key)) return
      const repsValue = Number(exercise?.reps)
      map.set(key, Number.isFinite(repsValue) && repsValue > 0 ? repsValue : 1)
    })

    return map
  }, [wp?.exercises])

  const assignedWorkoutMap = useMemo(() => {
    const map = new Map<string, any>()
    if (!Array.isArray(wp?.exercises)) return map

    wp.exercises.forEach((exercise: any) => {
      const workoutId =
        exercise?.workout_id || exercise?.workout?.id || exercise?.id
      if (workoutId === undefined || workoutId === null) return
      const key = String(workoutId)
      if (map.has(key)) return

      map.set(key, {
        id: workoutId,
        name:
          exercise?.workout_name ||
          exercise?.workout?.name ||
          exercise?.name ||
          exercise?.workout?.title ||
          'Untitled',
        category: exercise?.workout?.category ?? exercise?.category ?? null,
        subcategory:
          exercise?.workout?.subcategory ??
          exercise?.subcategory ??
          exercise?.workout?.category ??
          null,
        video_url:
          exercise?.workout?.video_url ||
          exercise?.video_url ||
          exercise?.workout_video_url ||
          '',
        reps: assignedRepsMap.get(key) ?? 1,
      })
    })

    return map
  }, [wp?.exercises, assignedRepsMap])

  const applyAssignedReps = useCallback(
    (workout: any) => {
      const workoutId = getWorkoutSelectableId(workout)
      if (workoutId == null) return workout
      const key = String(workoutId)
      const assignedReps = assignedRepsMap.get(key)
      if (assignedReps == null) return workout
      if (Number(workout?.reps) === assignedReps) return workout
      return { ...workout, reps: assignedReps }
    },
    [assignedRepsMap]
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

  // Build params for workouts API including category and subcategory filters
  const workoutListParams = useMemo(() => {
    const params: any = {
      page: wpPage,
      per_page: wpPerPage,
      search: wpSearch,
    }

    if (workoutFiltersEnabled && selectedCategoryId) {
      params.category_id = selectedCategoryId
    }

    if (workoutFiltersEnabled && selectedSubcategoryIds.length) {
      params.subcategory_ids = selectedSubcategoryIds.join(',')
    }

    console.log('🔍 Workout API Params:', {
      params,
      workoutFiltersEnabled,
      selectedCategoryId,
      selectedSubcategoryIds,
      assignOpen,
    })

    return params
  }, [
    wpPage,
    wpPerPage,
    wpSearch,
    selectedCategoryId,
    selectedSubcategoryIds,
    workoutFiltersEnabled,
  ])

  // Load workouts for assignment from backend with category/subcategory filters
  const { data: workoutsResp, isFetching: workoutsLoading } = useWorkoutList(
    workoutListParams as any,
    {
      enabled: assignOpen,
    }
  )

  const workouts = (workoutsResp as any)?.workouts ?? []

  useEffect(() => {
    if (!assignOpen) {
      setWorkoutFiltersEnabled(false)
    }
  }, [assignOpen])

  const collectAllVisibleWorkouts = useCallback((list: any[]) => {
    if (!Array.isArray(list) || list.length === 0) return []
    const map = new Map<string, any>()
    list.forEach((item: any) => {
      const workoutId = getWorkoutSelectableId(item)
      if (workoutId == null) return
      const key = String(workoutId)
      if (!map.has(key)) {
        map.set(key, item)
      }
    })
    return Array.from(map.values())
  }, [])

  useEffect(() => {
    if (!assignOpen) return
    if (loading) return
    if (drawerSelectionInitializedRef.current) return

    const hasExistingAssignments =
      Array.isArray(wp?.exercises) && wp.exercises.length > 0

    if (hasExistingAssignments && assignedWorkoutMap.size > 0) {
      const matchedFromList = Array.isArray(workouts)
        ? workouts.filter((w: any) => assignedWorkoutMap.has(String(w?.id)))
        : []

      const nextSelection =
        matchedFromList.length > 0
          ? matchedFromList.map(applyAssignedReps)
          : Array.from(assignedWorkoutMap.values())

      setSelectedWorkouts(nextSelection)
      userSelectionTouchedRef.current = false
      drawerSelectionInitializedRef.current = true
      return
    }

    if (!Array.isArray(workouts) || workouts.length === 0) return

    // Default behavior for brand new plans with no assignments: select all once
    const map = new Map<any, any>()
    workouts.forEach((w: any) => {
      if (w && w.id != null) {
        map.set(w.id, w)
      }
    })

    setSelectedWorkouts(Array.from(map.values()))
    userSelectionTouchedRef.current = false
    drawerSelectionInitializedRef.current = true
  }, [
    assignOpen,
    workouts,
    assignedWorkoutMap,
    applyAssignedReps,
    loading,
    wp?.exercises,
  ])

  useEffect(() => {
    if (!assignOpen) return
    if (workoutsLoading) return
    if (!selectAllNextWorkoutsRef.current) return

    if (!Array.isArray(workouts) || workouts.length === 0) {
      setSelectedWorkouts([])
      selectAllNextWorkoutsRef.current = false
      userSelectionTouchedRef.current = false
      return
    }

    if (userSelectionTouchedRef.current) {
      selectAllNextWorkoutsRef.current = false
      return
    }

    setSelectedWorkouts(collectAllVisibleWorkouts(workouts))
    selectAllNextWorkoutsRef.current = false
    userSelectionTouchedRef.current = false
  }, [assignOpen, workoutsLoading, workouts, collectAllVisibleWorkouts])

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

  const getWorkoutGroupLabels = (w: any) => {
    const main =
      w?.category?.main_category?.name ??
      w?.category?.parent?.name ??
      w?.category?.main_category_name ??
      w?.category?.parent_name ??
      w?.workout?.category?.main_category?.name ??
      w?.workout?.category?.parent?.name ??
      w?.category?.name ??
      w?.category_name ??
      'Others'

    const sub =
      w?.subcategory?.name ??
      w?.subcategory_name ??
      w?.workout?.subcategory?.name ??
      w?.workout?.subcategory_name ??
      w?.workout?.category?.name ??
      w?.category?.name ??
      'Others'

    return {
      main: String(main || 'Others'),
      sub: String(sub || 'Others'),
    }
  }

  const getWorkoutGroupKey = (w: any) => {
    const { main, sub } = getWorkoutGroupLabels(w)
    return `${main}::${sub}`
  }

  // Group workouts by subcategory for the Assign drawer so that
  // workouts sharing the same subcategory appear in a single wrapper.
  const groupedWorkouts = useMemo(() => {
    if (!Array.isArray(workouts) || workouts.length === 0) return []

    // Sort workouts by category/subcategory priority so that higher
    // priority categories are shown first in the Assign drawer.
    const sorted = workouts.slice().sort((a: any, b: any) => {
      const pa = a?.category?.priority ?? 9999
      const pb = b?.category?.priority ?? 9999
      if (pa === pb) return 0
      return pa < pb ? -1 : 1
    })

    const groups = new Map<
      string,
      { main: string; sub: string; items: any[] }
    >()

    sorted.forEach((w: any) => {
      const key = getWorkoutGroupKey(w)
      if (!groups.has(key)) {
        const labels = getWorkoutGroupLabels(w)
        groups.set(key, { main: labels.main, sub: labels.sub, items: [] })
      }
      groups.get(key)!.items.push(w)
    })

    return Array.from(groups.values()).map((group) => ({
      name: group.sub,
      mainName: group.main,
      legend: `${group.main} - ${group.sub}`,
      items: group.items,
    }))
  }, [workouts])

  // Group selected workouts by subcategory for the Review drawer so that
  // ordering is managed within each subcategory only.
  const groupedSelectedWorkouts = useMemo(() => {
    if (!Array.isArray(selectedWorkouts) || selectedWorkouts.length === 0)
      return []

    const groups = new Map<
      string,
      { main: string; sub: string; items: any[] }
    >()
    const priorities = new Map<string, number>()

    selectedWorkouts.forEach((w: any) => {
      const key = getWorkoutGroupKey(w)
      if (!groups.has(key)) {
        const labels = getWorkoutGroupLabels(w)
        groups.set(key, { main: labels.main, sub: labels.sub, items: [] })
      }
      groups.get(key)!.items.push(w)

      // Capture the category priority for this group (first value wins).
      if (!priorities.has(key)) {
        const p = w?.category?.priority ?? 9999
        priorities.set(key, p)
      }
    })

    return Array.from(groups.entries())
      .map(([key, value]) => ({
        name: value.sub,
        legend: `${value.main} - ${value.sub}`,
        mainName: value.main,
        items: value.items,
        priority: priorities.get(key) ?? 9999,
      }))
      .sort((a, b) => a.priority - b.priority)
  }, [selectedWorkouts])

  const canReorderWorkoutGroups = useMemo(
    () =>
      groupedSelectedWorkouts.some((group) => (group?.items?.length ?? 0) > 1),
    [groupedSelectedWorkouts]
  )

  const allVisibleSelected = useMemo(() => {
    if (!Array.isArray(workouts) || workouts.length === 0) return false
    if (!Array.isArray(selectedWorkouts) || selectedWorkouts.length === 0)
      return false

    const selectedKeys = new Set(
      selectedWorkouts
        .map((item) => {
          const id = getWorkoutSelectableId(item)
          return id == null ? null : String(id)
        })
        .filter(Boolean) as string[]
    )

    return workouts.every((item: any) => {
      const id = getWorkoutSelectableId(item)
      if (id == null) return true
      return selectedKeys.has(String(id))
    })
  }, [workouts, selectedWorkouts])

  const handleSelectAllVisibleWorkouts = useCallback(() => {
    if (!Array.isArray(workouts) || workouts.length === 0) return

    const additions = collectAllVisibleWorkouts(workouts)
    if (!additions.length) return

    userSelectionTouchedRef.current = true
    setSelectedWorkouts((prev) => {
      const map = new Map<string, any>()
      prev.forEach((item) => {
        const id = getWorkoutSelectableId(item)
        if (id == null) return
        map.set(String(id), item)
      })

      additions.forEach((item) => {
        const id = getWorkoutSelectableId(item)
        if (id == null) return
        const key = String(id)
        if (!map.has(key)) {
          map.set(key, item)
        }
      })

      return Array.from(map.values())
    })
  }, [workouts, collectAllVisibleWorkouts])

  const handleUnselectAllWorkouts = useCallback(() => {
    if (!selectedWorkouts.length) return
    userSelectionTouchedRef.current = true
    setSelectedWorkouts([])
    setWorkoutCounts({})
  }, [selectedWorkouts.length])

  const isSelected = (id: any) => selectedWorkouts.some((w) => w?.id === id)
  const toggleSelected = (w: any) => {
    userSelectionTouchedRef.current = true
    setSelectedWorkouts((prev) =>
      prev.some((x) => x?.id === w?.id)
        ? prev.filter((x) => x?.id !== w?.id)
        : [...prev, w]
    )
  }

  useEffect(() => {
    if (!Array.isArray(selectedWorkouts) || selectedWorkouts.length === 0) {
      if (Object.keys(workoutCounts).length) setWorkoutCounts({})
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
          return assignedRepsMap.get(key) ?? 1
        })()
        next[key] = Math.max(1, prev[key] ?? fallbackReps ?? 1)
      })
      return next
    })
  }, [selectedWorkouts, assignedRepsMap])

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

  // Open/close drawer based on Assign tab
  useEffect(() => {
    if (currentTab !== 'assign') {
      setAssignOpen(false)
      setReviewOpen(false)
    }
  }, [currentTab])

  useEffect(() => {
    if (assignOpen) {
      setDragIndex(null)
      setReviewOpen(false)

      // On first open (or after successful assign when selection was cleared),
      // pre-select workouts that are already assigned in this plan.
      // selection is now derived in the workouts/useEffect above
    }
  }, [assignOpen, wp?.exercises, selectedWorkouts.length])

  const canProceedToReview = selectedWorkouts.length > 0

  const handleNext = () => {
    // Only move to Review drawer if there is at least one explicitly
    // selected workout. The Review drawer always reflects exactly the
    // current selectedWorkouts list.
    if (!canProceedToReview) return
    // Before opening the Review drawer, sort the selected workouts
    // by category priority so that priority 1 appears first, then 2,
    // then 3, etc. This defines the initial order; the user can still
    // reorder via drag-and-drop afterwards.
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

  const buildExercisesPayload = () => {
    return selectedWorkouts.reduce(
      (
        acc: {
          workout_id: number | string
          sequence_number: number
          reps: number
        }[],
        item,
        index
      ) => {
        const workoutId = getWorkoutSelectableId(item)
        if (workoutId == null) return acc

        const key = String(workoutId)
        const reps = Math.max(1, workoutCounts[key] ?? 1)

        acc.push({
          workout_id: workoutId,
          sequence_number: index + 1,
          reps,
        })

        return acc
      },
      []
    )
  }

  const handleBulkAssign = async () => {
    if (!wp?.id || selectedWorkouts.length === 0) return
    setAssigning(true)
    try {
      const exercisesPayload = buildExercisesPayload()
      if (!exercisesPayload.length) return

      const res = await addExercisesAsync({
        id: wp.id,
        payload: {
          exercises: exercisesPayload,
        },
      })

      await refreshDetails()
      setSelectedWorkouts([])
      setWorkoutCounts({})
      setSelectedCategoryId(undefined)
      setSelectedCategoryName('')
      setSelectedSubcategories([])
      setWorkoutFiltersEnabled(false)
      prefillAppliedRef.current = false
      drawerSelectionInitializedRef.current = false
      selectAllNextWorkoutsRef.current = false
      userSelectionTouchedRef.current = false
      setReviewOpen(false)
      setSearchParams({ tab: 'assign' })
      enqueueSnackbar(res?.data?.message || 'Success', { variant: 'success' })
    } catch (err: any) {
      enqueueSnackbar(
        err?.response?.data?.message || 'Failed to assign workouts',
        {
          variant: 'error',
        }
      )
    } finally {
      setAssigning(false)
      setDragIndex(null)
      setWpSearch('')
      setWpPage(1)
    }
  }

  const onDragStart = (index: number, groupName: string) => {
    setDragIndex(index)
    setDragGroup(groupName)
  }
  const onDragOver = (e: any) => {
    e.preventDefault()
  }
  const onDrop = (index: number, groupName: string) => {
    if (dragIndex === null || dragIndex === index || dragGroup !== groupName) {
      setDragIndex(null)
      setDragGroup(null)
      return
    }
    userSelectionTouchedRef.current = true
    setSelectedWorkouts((prev) => {
      const next = prev.slice()
      const [item] = next.splice(dragIndex, 1)
      next.splice(index, 0, item)
      return next
    })
    setDragIndex(null)
    setDragGroup(null)
  }
  const capitalizeWords = (text: string) =>
    text?.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase())
  const formattedCategoryOptions = useMemo(() => {
    return (categoryOptions || []).map((c: any) => ({
      ...c,
      name: capitalizeWords(c.name),
    }))
  }, [categoryOptions])

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/plans/${wp?.plan_id}/workout-plan`)}
            aria-label="Back"
          >
            <Icons name="left-arrow-icon" />
          </button>
          <h1 className="text-xl font-semibold">
            Workout Plan Details - {wp?.plan_name}
          </h1>
        </div>
        {currentTab === 'assign' && !isNutritionist && (
          <div>
            <button
              className="px-3 py-1 text-sm border rounded btn-primary"
              onClick={() => {
                setDragIndex(null)
                setReviewOpen(false)
                setAssignOpen(true)
                setWpSearch('')
                setWpPage(1)
              }}
            >
              Assign
            </button>
          </div>
        )}
      </div>

      {(() => {
        const tabs: TabItemProps[] = [
          { id: 'details', label: 'Details' },
          { id: 'assign', label: 'Exercises' },
        ]

        return (
          <div className="no-tab-bg mb-4">
            <TabContainer
              data={tabs}
              activeTab={currentTab}
              onClick={(item) => {
                const next = item.id === 'assign' ? 'assign' : 'details'
                // preserve current pathname; update tab query param
                setSearchParams(next === 'assign' ? { tab: 'assign' } : {})
              }}
            >
              {currentTab === 'details' && !isNutritionist && (
                <div className="flex justify-end mb-4">
                  <button
                    className="px-4 py-2 text-sm border rounded btn-primary"
                    onClick={() => setEditPlanOpen(true)}
                  >
                    Edit Plan
                  </button>
                </div>
              )}
              <Tab id="details">
                <DetailsTabContent wp={wp} loading={loading} error={error} />
              </Tab>
              <Tab id="assign">
                <AssignTabContent
                  wp={wp}
                  loading={loading}
                  error={error}
                  selectedWorkouts={selectedWorkouts}
                  getEmbedUrl={getEmbedUrl}
                  refreshDetails={refreshDetails}
                />
              </Tab>
            </TabContainer>
          </div>
        )
      })()}

      <CustomDrawer
        open={assignOpen}
        handleClose={handleAssignDrawerClose}
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
                    data={formattedCategoryOptions}
                    value={categoryAutocompleteValue}
                    name="assign_category"
                    onChange={(option: any) => {
                      const id = option?.id ?? option?.value ?? ''
                      const name =
                        option?.name ?? option?.label ?? option?.value ?? ''
                      const prevIdKey = String(selectedCategoryId ?? '')
                      const nextIdKey = String(id || '')
                      const categoryActuallyChanged = prevIdKey !== nextIdKey

                      setSelectedCategoryId(id || undefined)
                      setSelectedCategoryName(capitalizeWords(name || ''))
                      setSelectedSubcategories([])
                      setWpPage(1)
                      if (id) {
                        setWorkoutFiltersEnabled(true)
                      }
                      if (assignOpen && categoryActuallyChanged) {
                        userSelectionTouchedRef.current = false
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

                      setSelectedSubcategories(normalized)
                      if (normalized.length > 0) {
                        setWorkoutFiltersEnabled(true)
                      }

                      if (assignOpen && prevKey !== nextKey) {
                        userSelectionTouchedRef.current = false
                        selectAllNextWorkoutsRef.current = true
                        setSelectedWorkouts([])
                      }
                    }}
                  />
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-[11px] text-gray-600 self-end justify-between w-full">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <button
                  type="button"
                  className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleSelectAllVisibleWorkouts}
                  disabled={
                    workoutsLoading ||
                    !Array.isArray(workouts) ||
                    workouts.length === 0 ||
                    allVisibleSelected
                  }
                >
                  Select All
                </button>
                <button
                  type="button"
                  className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleUnselectAllWorkouts}
                  disabled={selectedWorkouts.length === 0}
                >
                  Unselect All
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-4">
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
                      {/* Category - Subcategory name on border */}
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
                                  <span className="items-center gap-1 rounded-sm bg-blue-600/90 text-white px-2 py-0.5 font-semibold backdrop-blur">
                                    <Icons name="repeat" className="w-3 h-3" />
                                    {count > 0 ? count : '--'}
                                  </span>
                                  <span className="items-center gap-1 rounded-sm bg-amber-500 text-white px-2 py-0.5 font-medium backdrop-blur">
                                    <Icons
                                      name="activity"
                                      className="w-3 h-3"
                                    />
                                    {w?.intensity_level ||
                                      w?.workout?.intensity_level ||
                                      '--'}
                                  </span>
                                  <span className="items-center gap-1 rounded-sm bg-emerald-600/90 text-white px-2 py-0.5 font-medium backdrop-blur">
                                    <Icons name="clock" className="w-3 h-3" />
                                    {w?.duration_minutes ||
                                    w?.workout?.duration_minutes
                                      ? `${w?.duration_minutes || w?.workout?.duration_minutes}s`
                                      : '--'}
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

      {/* Review Drawer */}
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
                                {index + 1}.{' '}
                                {w?.name
                                  ? w.name
                                      .split(' ')
                                      .map(
                                        (word: string) =>
                                          word.charAt(0).toUpperCase() +
                                          word.slice(1).toLowerCase()
                                      )
                                      .join(' ')
                                  : ''}
                              </span>
                            </div>

                            <div className="relative w-full h-30 bg-black/5">
                              {embed ? (
                                <iframe
                                  className="w-full h-full"
                                  src={embed}
                                  allowFullScreen
                                ></iframe>
                              ) : url ? (
                                <video
                                  src={url}
                                  controls
                                  muted
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-sm text-gray-500 italic">
                                  No video URL available.
                                </div>
                              )}
                            </div>

                            <div className="px-4 py-2 text-xs text-gray-600">
                              {group.items.length > 1 &&
                                'Hold and drag to rearrange'}
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

      <WorkoutPlanForm
        isOpen={editPlanOpen}
        handleClose={() => {
          setEditPlanOpen(false)
          refreshDetails()
        }}
        edit
        rowData={wp}
        planId={wp?.plan_id}
        onSuccess={(res?: any) => {
          const msg = res?.message || 'Workout plan updated successfully'
          enqueueSnackbar(msg, { variant: 'success' })
        }}
      />
    </div>
  )
}

function DetailItem({ label, value }: { label: string; value: any }) {
  return (
    <div className="border rounded-lg p-3 bg-white">
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className="text-sm">{safeStr(value)}</div>
    </div>
  )
}

function safeStr(v: any) {
  if (v === null || v === undefined || v === '') return '--'
  return String(v)
}
